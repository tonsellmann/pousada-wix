// Um /js/wix/items.js de mentira, com os quartos e as temporadas de wix/conteudo.js dentro dele.
// Serve à prévia local e à demonstração do portfólio, que rodam sem Wix. Os pedidos ficam na
// memória da aba, em window.pedidosDaPrevia.
import { quartos, temporadas } from '../tests/falsos/cms.js';

export function moduloDoCms() {
  return `// CMS de mentira: os itens como o módulo do Wix devolve. Gerado por scripts/cms-falso.mjs.
const colecoes = ${JSON.stringify({ quartos, temporadas })};
const pedidos = (window.pedidosDaPrevia = []);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export async function queryItems(id, consulta = {}) {
  await espera(300);
  const items = structuredClone(colecoes[id] ?? []);
  for (const s of consulta.sort ?? []) items.sort((a, b) => (a[s.field] > b[s.field] ? 1 : -1) * (s.direction === 'desc' ? -1 : 1));
  return { items, hasNext: false, total: null };
}

export async function insertItem(id, data) {
  await espera(500);
  pedidos.push({ colecao: id, ...data });
  return { _id: String(pedidos.length), ...data };
}
`;
}
