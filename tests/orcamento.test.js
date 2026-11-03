import { describe, expect, it } from 'vitest';
import { dataValida, detalhar, diaDe, nivel, noitesEntre, orcar, prepararTemporadas, temporadaDaNoite, TABELA } from '../site/js/orcamento.js';
import { dia, reais } from '../site/js/formato.js';
import { quartos as itensQuartos, temporadas as itensTemporadas } from './falsos/cms.js';

// As temporadas e os quartos como o CMS do Wix devolve (datas em ISO, ao meio-dia UTC).
const temporadas = prepararTemporadas(itensTemporadas);
const quarto = (titulo) => itensQuartos.find((q) => q.titulo === titulo);
const chale = quarto('Chalé do Rio');
const hoje = '2026-11-02';

const pedir = (dados) => orcar({ quarto: chale, hospedes: 2, temporadas, hoje, ...dados });

describe('datas', () => {
  it('conta as noites da chegada até a véspera da saída', () => {
    expect(noitesEntre('2026-12-30', '2027-01-02')).toEqual(['2026-12-30', '2026-12-31', '2027-01-01']);
    expect(noitesEntre('2027-02-27', '2027-03-01')).toEqual(['2027-02-27', '2027-02-28']);
  });

  it('não aceita dia que não existe no calendário', () => {
    expect(dataValida('2027-02-29')).toBe(false);
    expect(dataValida('2028-02-29')).toBe(true);
    expect(dataValida('27/12/2026')).toBe(false);
  });

  it('lê a data do CMS sem escorregar de dia', () => {
    expect(diaDe('2026-12-27T12:00:00.000Z')).toBe('2026-12-27');
    expect(diaDe(new Date('2027-01-01T12:00:00Z'))).toBe('2027-01-01');
    expect(diaDe(undefined)).toBe('');
  });
});

describe('temporadas', () => {
  it('põe a padrão primeiro e as outras em ordem de data', () => {
    expect(temporadas.map((t) => t.nome)).toEqual([
      'Baixa temporada', 'Antes do Natal', 'Réveillon', 'Alta de verão', 'Carnaval', 'Fim do verão', 'Semana Santa', 'Férias de julho',
    ]);
  });

  it('acha a temporada de cada noite, com primeira e última noite incluídas', () => {
    expect(temporadaDaNoite('2026-12-26', temporadas).nome).toBe('Antes do Natal');
    expect(temporadaDaNoite('2026-12-27', temporadas).nome).toBe('Réveillon');
    expect(temporadaDaNoite('2027-01-01', temporadas).nome).toBe('Réveillon');
    expect(temporadaDaNoite('2027-01-02', temporadas).nome).toBe('Alta de verão');
    expect(temporadaDaNoite('2027-05-10', temporadas).nome).toBe('Baixa temporada');
  });

  it('com duas temporadas na mesma noite, vale a de maior fator', () => {
    const sobrepostas = prepararTemporadas([
      ...itensTemporadas,
      { nome: 'Festa de São João', primeiraNoite: '2027-01-20T12:00:00.000Z', ultimaNoite: '2027-01-22T12:00:00.000Z', fator: 2.5, minimoNoites: 2 },
    ]);
    expect(temporadaDaNoite('2027-01-21', sobrepostas).nome).toBe('Festa de São João');
    expect(temporadaDaNoite('2027-01-23', sobrepostas).nome).toBe('Alta de verão');
  });

  it('ignora temporada sem datas e usa a tabela se a dona apagar a padrão', () => {
    const semPadrao = prepararTemporadas(itensTemporadas.filter((t) => !t.padrao).concat({ nome: 'Rascunho', fator: 3 }));
    expect(semPadrao.some((t) => t.nome === 'Rascunho')).toBe(false);
    expect(temporadaDaNoite('2027-05-10', semPadrao)).toBe(TABELA);
  });

  it('separa tabela, alta e pico pelo fator', () => {
    expect([1, 1.3, 1.5, 1.8, 2.2].map(nivel)).toEqual(['tabela', 'alta', 'alta', 'pico', 'pico']);
  });
});

describe('orçamento', () => {
  it('cobra a diária de tabela fora das temporadas', () => {
    const o = pedir({ chegada: '2027-05-10', saida: '2027-05-13' });
    expect(o.ok).toBe(true);
    expect(o.linhas).toEqual([{ temporada: 'Baixa temporada', nivel: 'tabela', noites: 3, diaria: 420, subtotal: 1260, de: '2027-05-10', ate: '2027-05-12' }]);
    expect(o.total).toBe(1260);
  });

  it('divide a estadia que atravessa duas temporadas, noite por noite', () => {
    const o = pedir({ chegada: '2026-12-27', saida: '2027-01-04' });
    expect(o.ok).toBe(true);
    expect(o.linhas.map((l) => [l.temporada, l.noites, l.diaria, l.subtotal])).toEqual([
      ['Réveillon', 6, 924, 5544],
      ['Alta de verão', 2, 630, 1260],
    ]);
    expect(o.total).toBe(6804);
    expect(o.noites).toHaveLength(8);
  });

  it('arredonda a diária para o real', () => {
    const o = orcar({ quarto: quarto('Suíte Varanda'), hospedes: 1, temporadas, hoje, chegada: '2027-02-12', saida: '2027-02-14' });
    expect(o.linhas[0].diaria).toBe(442); // 340 × 1,3
  });

  it('pede o mínimo da temporada mais exigente e sugere a saída que cumpre', () => {
    const o = pedir({ chegada: '2026-12-30', saida: '2027-01-02' });
    expect(o.ok).toBe(false);
    expect(o.minimo).toEqual({ noites: 5, temporada: 'Réveillon', cumprido: false });
    expect(o.total).toBe(924 * 3);
    expect(o.sugestao).toEqual({ saida: '2027-01-04', noites: 5, total: 924 * 3 + 630 * 2, hospedes: 2 });
  });

  it('refaz a sugestão quando esticar a estadia entra numa temporada mais exigente', () => {
    // Chegar em 25/12 pede 3 noites (Antes do Natal), mas a terceira já é Réveillon, que pede 5.
    const o = pedir({ chegada: '2026-12-25', saida: '2026-12-26' });
    expect(o.minimo.noites).toBe(3);
    expect(o.sugestao.saida).toBe('2026-12-30');
    expect(o.sugestao.noites).toBe(5);
  });

  it('junta as observações das temporadas tocadas, uma vez cada', () => {
    const o = pedir({ chegada: '2026-12-27', saida: '2027-01-02' });
    expect(o.avisos).toEqual([{ temporada: 'Réveillon', texto: 'Pacote de cinco noites, com ceia da virada na beira do rio.' }]);
  });

  it('não repete no orçamento a observação da temporada padrão, que fala da tabela inteira', () => {
    expect(pedir({ chegada: '2027-05-10', saida: '2027-05-13' }).avisos).toEqual([]);
  });

  it('explica cada dado que impede o orçamento', () => {
    expect(orcar({ temporadas, hoje, chegada: '2027-05-10', saida: '2027-05-12', hospedes: 2 })).toMatchObject({ ok: false, campo: 'quarto' });
    expect(pedir({ chegada: '', saida: '2027-05-12' })).toMatchObject({ campo: 'datas', mensagem: 'Escolha a data de chegada e a de saída.' });
    expect(pedir({ chegada: '2026-10-30', saida: '2026-11-03' })).toMatchObject({ campo: 'datas', mensagem: 'A data de chegada já passou. Escolha outra.' });
    expect(pedir({ chegada: '2027-05-12', saida: '2027-05-12' })).toMatchObject({ campo: 'datas' });
    expect(pedir({ chegada: '2027-05-01', saida: '2027-06-05' }).mensagem).toMatch(/mais de 30 noites/);
    expect(pedir({ chegada: '2027-05-10', saida: '2027-05-12', hospedes: 3 })).toMatchObject({ campo: 'hospedes', mensagem: 'Chalé do Rio recebe até 2 hóspedes.' });
    expect(pedir({ chegada: '2027-05-10', saida: '2027-05-12', hospedes: 0 })).toMatchObject({ campo: 'hospedes' });
  });

  it('aceita chegar hoje', () => {
    expect(pedir({ chegada: hoje, saida: '2026-11-04' }).ok).toBe(true);
  });
});

describe('detalhamento do pedido', () => {
  it('escreve o orçamento em linhas que a dona lê no painel do Wix', () => {
    const o = pedir({ chegada: '2026-12-27', saida: '2027-01-04' });
    expect(detalhar(o, { reais, dia })).toBe(
      [
        'Chalé do Rio, 2 hóspedes',
        '27/12 a 04/01, 8 noites',
        '6 noites de Réveillon × R$ 924 = R$ 5.544',
        '2 noites de Alta de verão × R$ 630 = R$ 1.260',
        'Total: R$ 6.804',
      ].join('\n'),
    );
  });
});
