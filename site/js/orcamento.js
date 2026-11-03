// O orçamento da pousada: quanto custa cada noite, qual temporada vale em cada uma e se a estadia
// cumpre o mínimo de noites. Puro: sem página, sem Wix e sem relógio. Quem chama passa "hoje".
//
// As datas são textos "AAAA-MM-DD", como os do <input type="date">. A noite de 27/12 é a que
// começa no dia 27: quem chega em 27/12 e sai em 02/01 dorme as noites de 27 a 01, seis noites.

const DIA = 86_400_000;
const meioDia = (data) => Date.parse(`${data}T12:00:00Z`);
const textoDe = (ms) => new Date(ms).toISOString().slice(0, 10);

/** Mais de 30 noites é temporada longa: o preço é combinado com a pousada. */
export const LIMITE_DE_NOITES = 30;

/** Fator a partir do qual a temporada é de pico (Réveillon, Carnaval): muda a cor na página. */
export const FATOR_DE_PICO = 1.8;

/** Vale quando o CMS não tem temporada marcada como padrão: diária de tabela, sem mínimo. */
export const TABELA = Object.freeze({ nome: 'Diária de tabela', fator: 1, minimo: 1, padrao: true, observacao: '' });

/** A data de um campo do CMS ("2026-12-27T12:00:00.000Z", um Date ou "2026-12-27") como "2026-12-27". */
export function diaDe(valor) {
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? '' : valor.toISOString().slice(0, 10);
  if (typeof valor !== 'string') return '';
  const dia = valor.slice(0, 10);
  return dataValida(dia) ? dia : '';
}

/** "2027-02-30" não é data: o dia precisa existir no calendário. */
export function dataValida(data) {
  return typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data) && textoDe(meioDia(data)) === data;
}

export function somarDias(data, dias) {
  return textoDe(meioDia(data) + dias * DIA);
}

/** As noites de uma estadia: da chegada até a véspera da saída. */
export function noitesEntre(chegada, saida) {
  const noites = [];
  for (let t = meioDia(chegada); t < meioDia(saida); t += DIA) noites.push(textoDe(t));
  return noites;
}

/** O nível de preço de uma temporada, para a cor: tabela, alta ou pico. */
export function nivel(fator) {
  if (fator >= FATOR_DE_PICO) return 'pico';
  if (fator > 1) return 'alta';
  return 'tabela';
}

/**
 * Os itens da coleção "temporadas" do jeito que o orçamento usa. Uma temporada sem as duas datas
 * só vale se for a padrão; fator ou mínimo faltando viram 1. A padrão vem primeiro, as outras em
 * ordem de data.
 */
export function prepararTemporadas(itens = []) {
  const temporadas = [];
  for (const item of itens) {
    const fator = Number(item.fator) > 0 ? Number(item.fator) : 1;
    const minimo = Number.isInteger(Number(item.minimoNoites)) && Number(item.minimoNoites) > 0 ? Number(item.minimoNoites) : 1;
    const base = { id: item._id ?? item.nome, nome: String(item.nome ?? '').trim() || 'Temporada', fator, minimo, observacao: String(item.observacao ?? '').trim() };
    if (item.padrao) {
      temporadas.push({ ...base, padrao: true, de: '', ate: '' });
      continue;
    }
    const de = diaDe(item.primeiraNoite);
    const ate = diaDe(item.ultimaNoite);
    if (!de || !ate || ate < de) continue;
    temporadas.push({ ...base, padrao: false, de, ate });
  }
  return temporadas.sort((a, b) => Number(b.padrao) - Number(a.padrao) || a.de.localeCompare(b.de));
}

/**
 * A temporada de uma noite. Se duas temporadas cobrem a mesma noite (a dona cadastrou o Carnaval
 * dentro da alta de verão), vale a de maior fator. Fora de todas, vale a padrão.
 */
export function temporadaDaNoite(noite, temporadas) {
  let escolhida = null;
  for (const t of temporadas) {
    if (t.padrao || noite < t.de || noite > t.ate) continue;
    if (!escolhida || t.fator > escolhida.fator) escolhida = t;
  }
  return escolhida ?? temporadas.find((t) => t.padrao) ?? TABELA;
}

/** A diária de um quarto numa temporada, arredondada para o real. */
export function diariaNa(quarto, temporada) {
  return Math.round(quarto.diaria * temporada.fator);
}

const falha = (campo, mensagem) => ({ ok: false, campo, mensagem });

/**
 * O orçamento de uma estadia.
 *
 * Com dados que não dão orçamento (sem datas, saída antes da chegada, hóspedes demais), devolve
 * { ok: false, campo, mensagem }, e a mensagem diz o que fazer.
 *
 * Com orçamento, devolve as noites, as linhas por temporada (noites seguidas da mesma temporada
 * viram uma linha), o total e o mínimo de noites. Se a estadia é curta para o mínimo, "ok" é
 * false, mas o orçamento vem inteiro, com a saída que cumpre o mínimo em "sugestao".
 */
export function orcar({ quarto, chegada, saida, hospedes, temporadas, hoje }) {
  if (!quarto) return falha('quarto', 'Escolha um quarto.');
  if (!dataValida(chegada) || !dataValida(saida)) return falha('datas', 'Escolha a data de chegada e a de saída.');
  if (hoje && chegada < hoje) return falha('datas', 'A data de chegada já passou. Escolha outra.');
  if (saida <= chegada) return falha('datas', 'A saída precisa ser pelo menos um dia depois da chegada.');

  const datas = noitesEntre(chegada, saida);
  if (datas.length > LIMITE_DE_NOITES) {
    return falha('datas', `Para mais de ${LIMITE_DE_NOITES} noites, o preço é combinado direto com a pousada. Conte as datas na mensagem.`);
  }
  const n = Number(hospedes);
  if (!Number.isInteger(n) || n < 1) return falha('hospedes', 'Diga quantos hóspedes vêm, contando as crianças.');
  if (n > quarto.capacidade) {
    return falha('hospedes', `${quarto.titulo} recebe até ${quantidade(quarto.capacidade, 'hóspede', 'hóspedes')}.`);
  }

  const noites = datas.map((noite) => {
    const temporada = temporadaDaNoite(noite, temporadas);
    return { noite, temporada: temporada.nome, nivel: nivel(temporada.fator), diaria: diariaNa(quarto, temporada), minimo: temporada.minimo, observacao: temporada.observacao };
  });

  const linhas = [];
  for (const noite of noites) {
    const ultima = linhas.at(-1);
    if (ultima && ultima.temporada === noite.temporada && ultima.diaria === noite.diaria) {
      ultima.noites += 1;
      ultima.subtotal += noite.diaria;
      ultima.ate = noite.noite;
    } else {
      linhas.push({ temporada: noite.temporada, nivel: noite.nivel, noites: 1, diaria: noite.diaria, subtotal: noite.diaria, de: noite.noite, ate: noite.noite });
    }
  }

  // O mínimo é o da temporada mais exigente que a estadia toca: duas noites de Réveillon numa
  // viagem de três pedem o pacote de cinco.
  const exigente = noites.reduce((a, b) => (b.minimo > a.minimo ? b : a));
  const curta = noites.length < exigente.minimo;

  const avisos = [];
  for (const noite of noites) {
    if (noite.observacao && !avisos.some((a) => a.temporada === noite.temporada)) {
      avisos.push({ temporada: noite.temporada, texto: noite.observacao });
    }
  }

  return {
    ok: !curta,
    quarto: quarto.titulo,
    hospedes: n,
    chegada,
    saida,
    noites,
    linhas,
    total: linhas.reduce((soma, l) => soma + l.subtotal, 0),
    minimo: { noites: exigente.minimo, temporada: exigente.temporada, cumprido: !curta },
    sugestao: curta ? sugerirSaida({ quarto, chegada, hospedes: n, temporadas, minimo: exigente.minimo }) : null,
    avisos,
  };
}

/**
 * A primeira saída que cumpre o mínimo, mantendo a chegada. Esticar a estadia pode entrar numa
 * temporada mais exigente (chegar dia 25 com mínimo de 3 cai no Réveillon, que pede 5), então a
 * conta se repete até parar de mudar.
 */
function sugerirSaida({ quarto, chegada, hospedes, temporadas, minimo }) {
  let noites = minimo;
  for (let volta = 0; volta < 6 && noites <= LIMITE_DE_NOITES; volta += 1) {
    const saida = somarDias(chegada, noites);
    const exigido = Math.max(...noitesEntre(chegada, saida).map((d) => temporadaDaNoite(d, temporadas).minimo));
    if (exigido <= noites) {
      const total = noitesEntre(chegada, saida).reduce((s, d) => s + diariaNa(quarto, temporadaDaNoite(d, temporadas)), 0);
      return { saida, noites, total, hospedes };
    }
    noites = exigido;
  }
  return null;
}

export function quantidade(n, um, varios) {
  return `${n} ${n === 1 ? um : varios}`;
}

/**
 * O texto que vai para o campo "Noites por temporada" do pedido: a dona lê no painel do Wix,
 * no celular, sem abrir o site.
 */
export function detalhar(orcamento, { reais, dia }) {
  const linhas = [
    `${orcamento.quarto}, ${quantidade(orcamento.hospedes, 'hóspede', 'hóspedes')}`,
    `${dia(orcamento.chegada)} a ${dia(orcamento.saida)}, ${quantidade(orcamento.noites.length, 'noite', 'noites')}`,
    ...orcamento.linhas.map((l) => `${quantidade(l.noites, 'noite', 'noites')} de ${l.temporada} × ${reais(l.diaria)} = ${reais(l.subtotal)}`),
    `Total: ${reais(orcamento.total)}`,
  ];
  return linhas.join('\n');
}
