// Prévia local do site, sem Wix: serve a pasta site/ e troca o módulo do CMS (/js/wix/items.js)
// por um que lê os quartos e as temporadas de wix/conteudo.js. Os pedidos ficam na memória da aba,
// em window.pedidosDaPrevia.
//
//   npm run previa   →   http://localhost:4330
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const PORTA = Number(process.env.PORTA ?? 4330);
const tipos = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

const cmsFalso = `
import { quartos, temporadas } from '/tests/falsos/cms.js';
const colecoes = { quartos, temporadas };
const pedidos = (window.pedidosDaPrevia = []);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
export async function queryItems(id, consulta = {}) {
  await espera(300);
  const items = [...(colecoes[id] ?? [])];
  for (const s of consulta.sort ?? []) items.sort((a, b) => (a[s.field] > b[s.field] ? 1 : -1) * (s.direction === 'desc' ? -1 : 1));
  return { items, hasNext: false, total: null };
}
export async function insertItem(id, data) {
  await espera(500);
  pedidos.push({ colecao: id, ...data });
  return { _id: String(pedidos.length), ...data };
}
`;

/** Só entrega arquivo de dentro do projeto. */
function arquivoDe(caminho) {
  const pasta = caminho.startsWith('/tests/falsos/') || caminho.startsWith('/wix/') ? RAIZ : join(RAIZ, 'site');
  const arquivo = normalize(join(pasta, caminho === '/' ? 'index.html' : caminho));
  return arquivo.startsWith(pasta.endsWith(sep) ? pasta : pasta + sep) ? arquivo : null;
}

createServer(async (req, res) => {
  const caminho = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (caminho === '/js/wix/items.js') {
    res.writeHead(200, { 'content-type': tipos['.js'] });
    return res.end(cmsFalso);
  }
  const arquivo = arquivoDe(caminho);
  try {
    if (!arquivo) throw new Error('fora do projeto');
    const conteudo = await readFile(arquivo);
    res.writeHead(200, { 'content-type': tipos[extname(arquivo)] ?? 'application/octet-stream' });
    res.end(conteudo);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Não encontrado');
  }
}).listen(PORTA, () => console.log(`Prévia em http://localhost:${PORTA}`));
