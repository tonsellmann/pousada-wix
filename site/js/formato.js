// Reais e datas em português, no fuso de Caraíva. O hóspede pode abrir o site de Lisboa ou de
// Manaus: "hoje" e as datas são sempre os da pousada.

export const FUSO = 'America/Bahia';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const diaMes = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
const semana = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' });
const extenso = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
const iso = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: FUSO });

// O Intl separa "R$" do número com espaço que não quebra; fica assim, para não partir na linha.
export const reais = (valor) => moeda.format(valor);

const meioDia = (data) => new Date(`${data}T12:00:00Z`);

/** "27/12" */
export const dia = (data) => diaMes.format(meioDia(data));

/** "dom, 27/12" */
export const diaComSemana = (data) => `${semana.format(meioDia(data)).replace('.', '')}, ${dia(data)}`;

/** "27 de dezembro" */
export const diaPorExtenso = (data) => extenso.format(meioDia(data));

/** A data de hoje em Caraíva, "AAAA-MM-DD". */
export const hojeNaPousada = (agora = Date.now()) => iso.format(agora);

/** Só os dígitos de um telefone, para conferir se tem DDD. */
export const digitos = (texto) => String(texto ?? '').replace(/\D/g, '');
