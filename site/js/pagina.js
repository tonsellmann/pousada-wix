// A página: lê quartos e temporadas do CMS do Wix, refaz a conta a cada mudança no formulário e
// grava o pedido na coleção "pedidos". As regras de preço ficam em orcamento.js, que não sabe
// nada de página nem de Wix.
import { insertItem, queryItems } from '/js/wix/items.js';
import { detalhar, nivel, orcar, prepararTemporadas, quantidade } from './orcamento.js';
import { dia, diaComSemana, diaPorExtenso, digitos, hojeNaPousada, reais } from './formato.js';

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
const form = $('[data-orcamento]');
const conta = $('[data-conta]');
const contato = $('[data-contato]');

let quartos = [];
let temporadas = [];
let atual = null; // o último orçamento calculado

/** A foto do CMS no tamanho certo: o Wix Media recorta e converte pela URL. */
function foto(url, largura, altura) {
  if (typeof url !== 'string' || !url.startsWith('https://static.wixstatic.com/media/')) return '';
  const arquivo = url.split('/media/')[1].split('/')[0];
  return `https://static.wixstatic.com/media/${arquivo}/v1/fill/w_${largura},h_${altura},al_c,q_80/${arquivo}`;
}

const el = (tag, atributos = {}, ...filhos) => {
  const no = document.createElement(tag);
  for (const [k, v] of Object.entries(atributos)) {
    if (v === false || v == null) continue;
    if (k === 'class') no.className = v;
    else if (k === 'text') no.textContent = v;
    else no.setAttribute(k, v === true ? '' : v);
  }
  no.append(...filhos.filter((f) => f != null && f !== false));
  return no;
};

// O texto rico do CMS vem em HTML; aqui só interessa o texto.
const semTags = (html) => new DOMParser().parseFromString(String(html ?? ''), 'text/html').body.textContent.trim();

function desenharQuartos() {
  const lista = $('[data-quartos]');
  lista.replaceChildren(
    ...quartos.map((q) => {
      const src = foto(q.foto, 800, 600);
      return el('li', { class: 'quarto' },
        src ? el('img', { src, srcset: `${foto(q.foto, 480, 360)} 480w, ${src} 800w`, sizes: '(max-width: 600px) 100vw, 25vw', alt: `Foto do ${q.titulo}`, loading: 'lazy', width: 800, height: 600 }) : null,
        el('div', { class: 'quarto__corpo' },
          el('h3', { text: q.titulo }),
          el('p', { text: q.resumo }),
          el('p', { text: semTags(q.descricao) }),
          el('div', { class: 'quarto__dados' },
            el('span', { text: `Até ${quantidade(q.capacidade, 'hóspede', 'hóspedes')}` }),
            el('span', { class: 'quarto__preco' }, reais(q.diaria), el('small', { text: ' por noite' }))),
          el('button', { class: 'quarto__orcar', type: 'button', 'data-orcar': q.slug, text: 'Orçar este quarto' })));
    }),
  );
  lista.removeAttribute('aria-busy');

  $('[data-opcoes-quarto]').replaceChildren(
    ...quartos.map((q) => el('label', { class: 'opcao' },
      el('input', { type: 'radio', name: 'quarto', value: q.slug }),
      foto(q.foto, 160, 160) ? el('img', { src: foto(q.foto, 160, 160), alt: '', width: 80, height: 80, loading: 'lazy' }) : null,
      el('span', {}, el('strong', { text: q.titulo }), `até ${q.capacidade}, ${reais(q.diaria)}`))),
  );
}

function desenharTemporadas() {
  const hoje = hojeNaPousada();
  const lista = $('[data-temporadas]');
  const futuras = temporadas.filter((t) => t.padrao || t.ate >= hoje);
  lista.replaceChildren(
    ...futuras.map((t) => {
      const mais = Math.round((t.fator - 1) * 100);
      return el('li', { class: `temporada temporada--${nivel(t.fator)}` },
        el('h3', { text: t.nome }),
        el('p', { text: t.padrao ? 'O resto do ano' : `Noites de ${diaPorExtenso(t.de)} a ${diaPorExtenso(t.ate)}` }),
        el('p', { class: 'temporada__preco', text: mais > 0 ? `Diária ${mais}% acima da tabela` : 'Diária de tabela' }),
        el('p', { text: `Mínimo de ${quantidade(t.minimo, 'noite', 'noites')}` }),
        t.observacao && !t.padrao ? el('p', { text: t.observacao }) : null);
    }),
  );
  lista.removeAttribute('aria-busy');
}

function mostrarErro(campo, mensagem) {
  for (const p of form.querySelectorAll('[data-erro]')) {
    const ativo = p.dataset.erro === campo;
    p.hidden = !ativo;
    p.textContent = ativo ? mensagem : '';
  }
  for (const nome of ['chegada', 'saida', 'hospedes']) {
    const errado = (campo === 'datas' && nome !== 'hospedes') || campo === nome;
    form.elements[nome].toggleAttribute('aria-invalid', false);
    if (errado) form.elements[nome].setAttribute('aria-invalid', 'true');
  }
}

function lerFormulario() {
  const slug = form.elements.quarto?.value;
  return {
    quarto: quartos.find((q) => q.slug === slug),
    chegada: form.elements.chegada.value,
    saida: form.elements.saida.value,
    hospedes: Number(form.elements.hospedes.value),
  };
}

/** Recalcula a cada mudança. Só mostra erro de campo que a pessoa já mexeu. */
function recalcular({ mostrarTudo = false } = {}) {
  const dados = lerFormulario();
  const tocados = form.dataset.tocados?.split(',') ?? [];
  const contador = form.elements.hospedes;
  if (dados.quarto) contador.max = dados.quarto.capacidade;
  form.querySelector('[data-hospedes="-1"]').disabled = dados.hospedes <= 1;
  form.querySelector('[data-hospedes="1"]').disabled = Boolean(dados.quarto) && dados.hospedes >= dados.quarto.capacidade;

  const o = orcar({ ...dados, temporadas, hoje: hojeNaPousada() });
  atual = o.noites ? o : null;
  contato.disabled = !o.ok;

  if (!o.noites) {
    const visivel = mostrarTudo || tocados.includes(o.campo) || (o.campo === 'datas' && dados.chegada && dados.saida);
    mostrarErro(visivel ? o.campo : null, o.mensagem);
    conta.replaceChildren(el('p', { class: 'conta__vazia', text: visivel ? o.mensagem : 'Escolha o quarto e as datas para ver o preço de cada noite.' }));
    return;
  }
  mostrarErro(null);
  desenharConta(o);
}

function desenharConta(o) {
  const n = o.noites.length;
  const partes = [
    el('h3', { text: o.quarto }),
    el('p', { class: 'conta__estadia', text: `${diaComSemana(o.chegada)} a ${diaComSemana(o.saida)} · ${quantidade(n, 'noite', 'noites')} · ${quantidade(o.hospedes, 'hóspede', 'hóspedes')}` }),
    el('ul', { class: 'conta__linhas' },
      ...o.linhas.map((l) => el('li', { class: 'conta__linha' },
        el('span', {}, el('span', { class: `etiqueta etiqueta--${l.nivel}`, text: l.temporada })),
        el('small', { text: `${quantidade(l.noites, 'noite', 'noites')} × ${reais(l.diaria)}${l.noites > 1 ? `, de ${dia(l.de)} a ${dia(l.ate)}` : `, ${dia(l.de)}`}` }),
        el('b', { text: reais(l.subtotal) })))),
    el('p', { class: 'conta__total' }, el('span', { text: 'Total estimado' }), el('strong', { text: reais(o.total) })),
    el('p', { class: 'conta__por-noite', text: `média de ${reais(Math.round(o.total / n))} por noite` }),
  ];

  if (!o.minimo.cumprido) {
    const aviso = el('div', { class: 'conta__aviso conta__aviso--minimo' },
      el('p', { style: 'margin:0', text: `${o.minimo.temporada} pede no mínimo ${quantidade(o.minimo.noites, 'noite', 'noites')}. Do jeito que está, a pousada não consegue fechar.` }));
    if (o.sugestao) {
      aviso.append(el('button', { type: 'button', 'data-sugestao': o.sugestao.saida,
        text: `Sair em ${dia(o.sugestao.saida)}: ${quantidade(o.sugestao.noites, 'noite', 'noites')}, ${reais(o.sugestao.total)}` }));
    }
    partes.push(aviso);
  }
  for (const a of o.avisos) partes.push(el('p', { class: 'conta__aviso', text: `${a.temporada}: ${a.texto}` }));

  if (n > 1) {
    partes.push(el('details', { class: 'conta__noites' },
      el('summary', { text: 'Ver noite por noite' }),
      el('ol', {}, ...o.noites.map((x) => el('li', { class: `etiqueta--${x.nivel}` }, el('span', { text: diaComSemana(x.noite) }), reais(x.diaria))))));
  }
  conta.replaceChildren(...partes);
}

function marcarTocado(campo) {
  const tocados = new Set(form.dataset.tocados?.split(',').filter(Boolean));
  tocados.add(campo);
  form.dataset.tocados = [...tocados].join(',');
}

function escolherQuarto(slug) {
  const opcao = form.querySelector(`input[name="quarto"][value="${CSS.escape(slug)}"]`);
  if (!opcao) return;
  opcao.checked = true;
  marcarTocado('quarto');
  recalcular();
}

function ligarFormulario() {
  const hoje = hojeNaPousada();
  form.elements.chegada.min = hoje;
  form.elements.saida.min = hoje;

  form.addEventListener('change', (e) => {
    const nome = e.target.name;
    if (nome === 'chegada' || nome === 'saida') marcarTocado('datas');
    else if (nome) marcarTocado(nome);
    // Escolheu a chegada e a saída ficou para trás: a saída anda junto, com o mínimo de noites.
    if (nome === 'chegada' && e.target.value) {
      const saida = form.elements.saida;
      const dias = Math.max(2, temporadas.find((t) => t.padrao)?.minimo ?? 2);
      const proxima = new Date(`${e.target.value}T12:00:00Z`);
      proxima.setUTCDate(proxima.getUTCDate() + 1);
      saida.min = proxima.toISOString().slice(0, 10);
      if (!saida.value || saida.value <= e.target.value) {
        proxima.setUTCDate(proxima.getUTCDate() + dias - 1);
        saida.value = proxima.toISOString().slice(0, 10);
      }
    }
    recalcular();
  });
  form.addEventListener('input', (e) => {
    if (e.target.name === 'hospedes') recalcular();
  });

  form.addEventListener('click', (e) => {
    const passo = e.target.closest('[data-hospedes]');
    if (passo) {
      const campo = form.elements.hospedes;
      campo.value = Math.max(1, Number(campo.value || 0) + Number(passo.dataset.hospedes));
      marcarTocado('hospedes');
      recalcular();
    }
  });
  conta.addEventListener('click', (e) => {
    const sugestao = e.target.closest('[data-sugestao]');
    if (sugestao) {
      form.elements.saida.value = sugestao.dataset.sugestao;
      recalcular();
      form.elements.saida.focus();
    }
  });
  document.addEventListener('click', (e) => {
    const botao = e.target.closest('[data-orcar]');
    if (!botao) return;
    escolherQuarto(botao.dataset.orcar);
    $('#orcamento').scrollIntoView();
    form.elements.chegada.focus({ preventScroll: true });
  });

  form.addEventListener('submit', enviar);
  $('[data-novo]').addEventListener('click', () => {
    $('[data-enviado]').hidden = true;
    form.hidden = false;
    form.elements.mensagem.value = '';
    recalcular();
    form.scrollIntoView();
  });
}

function validarContato() {
  const { nome, email, whatsapp } = form.elements;
  if (nome.value.trim().length < 2) return [nome, 'Escreva seu nome.'];
  const fone = digitos(whatsapp.value);
  if (fone.length < 10 || fone.length > 13) return [whatsapp, 'O WhatsApp precisa do DDD, como (73) 99999-0000.'];
  if (!email.validity.valid || !email.value) return [email, 'Confira o e-mail.'];
  return null;
}

async function enviar(e) {
  e.preventDefault();
  recalcular({ mostrarTudo: true });
  if (!atual?.minimo?.cumprido) return;
  const problema = validarContato();
  const erro = $('[data-erro="contato"]');
  for (const campo of contato.querySelectorAll('input')) campo.removeAttribute('aria-invalid');
  if (problema) {
    const [campo, mensagem] = problema;
    campo.setAttribute('aria-invalid', 'true');
    erro.textContent = mensagem;
    erro.hidden = false;
    campo.focus();
    return;
  }
  erro.hidden = true;

  const botao = contato.querySelector('button[type="submit"]');
  botao.disabled = true;
  botao.textContent = 'Enviando...';
  const o = atual;
  const { nome, email, whatsapp, mensagem } = form.elements;
  try {
    // DATE do CMS: o dia ao meio-dia UTC, para nenhum fuso mudar a data.
    await insertItem('pedidos', {
      nome: nome.value.trim(),
      email: email.value.trim(),
      whatsapp: whatsapp.value.trim(),
      quarto: o.quarto,
      chegada: new Date(`${o.chegada}T12:00:00Z`),
      saida: new Date(`${o.saida}T12:00:00Z`),
      hospedes: o.hospedes,
      noites: o.noites.length,
      total: o.total,
      detalhamento: detalhar(o, { reais, dia }),
      mensagem: mensagem.value.trim(),
    });
    form.hidden = true;
    const pronto = $('[data-enviado]');
    $('[data-enviado-texto]', pronto).textContent =
      `${nome.value.trim().split(' ')[0]}, a pousada recebeu o pedido: ${o.quarto}, de ${diaPorExtenso(o.chegada)} a ${diaPorExtenso(o.saida)}, ${reais(o.total)} no total.\nA resposta vem pelo WhatsApp ${whatsapp.value.trim()} em até um dia.`;
    pronto.hidden = false;
    pronto.focus();
  } catch (falha) {
    console.error(falha);
    erro.textContent = 'Não foi possível enviar agora. Tente de novo em instantes.';
    erro.hidden = false;
  } finally {
    botao.disabled = false;
    botao.textContent = 'Pedir este orçamento';
  }
}

async function carregar() {
  try {
    const [q, t] = await Promise.all([
      queryItems('quartos', { sort: [{ field: 'ordem', direction: 'asc' }], limit: 50 }),
      queryItems('temporadas', { limit: 100 }),
    ]);
    quartos = q.items.map((item) => ({ ...item, capacidade: Number(item.capacidade) || 1, diaria: Number(item.diaria) || 0 }));
    temporadas = prepararTemporadas(t.items);
    desenharQuartos();
    desenharTemporadas();
    ligarFormulario();
    // Link direto para orçar um quarto: /?quarto=casa-da-mata#orcamento
    const pedido = new URLSearchParams(location.search).get('quarto');
    if (pedido) escolherQuarto(pedido);
    recalcular();
    // Os quartos entraram e empurraram a página: volta para a seção do link.
    if (location.hash.length > 1) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  } catch (falha) {
    console.error(falha);
    for (const alvo of [$('[data-quartos]'), conta]) {
      alvo.replaceChildren(el('p', { class: 'falha', text: 'Os quartos não carregaram. Recarregue a página em instantes.' }));
    }
  }
}

carregar();
