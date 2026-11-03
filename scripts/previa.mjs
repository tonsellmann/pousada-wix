// Prévia local do site, sem Wix: serve a pasta site/ e troca o módulo do CMS (/js/wix/items.js)
// pelo de scripts/cms-falso.mjs.
//
//   npm run previa   →   http://localhost:4330
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { moduloDoCms } from './cms-falso.mjs';

const SITE = fileURLToPath(new URL('../site/', import.meta.url));
const PORTA = Number(process.env.PORTA ?? 4330);
const tipos = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

/** Só entrega arquivo de dentro de site/. */
function arquivoDe(caminho) {
  const arquivo = normalize(join(SITE, caminho === '/' ? 'index.html' : caminho));
  return arquivo.startsWith(SITE.endsWith(sep) ? SITE : SITE + sep) ? arquivo : null;
}

createServer(async (req, res) => {
  const caminho = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (caminho === '/js/wix/items.js') {
    res.writeHead(200, { 'content-type': tipos['.js'] });
    return res.end(moduloDoCms());
  }
  const arquivo = arquivoDe(caminho);
  try {
    if (!arquivo) throw new Error('fora do site');
    const conteudo = await readFile(arquivo);
    res.writeHead(200, { 'content-type': tipos[extname(arquivo)] ?? 'application/octet-stream' });
    res.end(conteudo);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Não encontrado');
  }
}).listen(PORTA, () => console.log(`Prévia em http://localhost:${PORTA}`));
