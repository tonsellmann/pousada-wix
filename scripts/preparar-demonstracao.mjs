// Gera uma cópia do site que roda em qualquer pasta de qualquer servidor, sem Wix, para a
// demonstração do portfólio. Os caminhos absolutos (/css, /js) viram relativos e o módulo do CMS
// é o de scripts/cms-falso.mjs.
//
//   node scripts/preparar-demonstracao.mjs ../Portfolio/public/demos/pousada-barra-mansa
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { moduloDoCms } from './cms-falso.mjs';

const destino = process.argv[2];
if (!destino) {
  console.error('Uso: node scripts/preparar-demonstracao.mjs <pasta de destino>');
  process.exit(1);
}
const SITE = fileURLToPath(new URL('../site/', import.meta.url));
const pasta = resolve(destino);

await rm(pasta, { recursive: true, force: true });
await mkdir(join(pasta, 'js', 'wix'), { recursive: true });
await cp(join(SITE, 'css'), join(pasta, 'css'), { recursive: true });
for (const arquivo of ['orcamento.js', 'formato.js']) await cp(join(SITE, 'js', arquivo), join(pasta, 'js', arquivo));

const pagina = await readFile(join(SITE, 'js', 'pagina.js'), 'utf8');
await writeFile(join(pasta, 'js', 'pagina.js'), pagina.replace("from '/js/wix/items.js'", "from './wix/items.js'"));
await writeFile(join(pasta, 'js', 'wix', 'items.js'), moduloDoCms());

const html = await readFile(join(SITE, 'index.html'), 'utf8');
await writeFile(join(pasta, 'index.html'), html.replace('href="/css/estilo.css"', 'href="css/estilo.css"').replace('src="/js/pagina.js"', 'src="js/pagina.js"'));

console.log(`Demonstração em ${pasta}`);
