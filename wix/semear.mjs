// Prepara um site Wix para a pousada: instala o CMS, acerta moeda, fuso e idioma, importa as fotos
// para o Wix Media, cria as coleções e grava quartos e temporadas. Pode rodar de novo: coleção que
// já existe fica como está, e coleção que já tem itens não recebe outros.
//
//   WIX_API_KEY=... WIX_SITE_ID=... node wix/semear.mjs
//
// A chave de API se cria em https://manage.wix.com/account/api-keys, com permissão para o site,
// o CMS (Wix Data), o Media Manager, as propriedades do site e a instalação de apps.
//
// Documentação das chamadas:
//   https://dev.wix.com/docs/api-reference/business-management/site-properties/properties/update-business-region
//   https://dev.wix.com/docs/api-reference/assets/media/media-manager/files/import-file
//   https://dev.wix.com/docs/api-reference/business-solutions/cms/data-collections/create-data-collection
//   https://dev.wix.com/docs/api-reference/business-solutions/cms/data-items/bulk-insert-data-items
import { colecoes, fotos, quartos, temporadas } from './conteudo.js';

const API = 'https://www.wixapis.com';
const CMS = 'e593b0bd-b783-45b8-97c2-873d42aacaf4'; // o app Wix Data (CMS)

const { WIX_API_KEY, WIX_SITE_ID } = process.env;
if (!WIX_API_KEY || !WIX_SITE_ID) {
  console.error('Defina WIX_API_KEY e WIX_SITE_ID.');
  process.exit(1);
}

async function wix(metodo, caminho, corpo) {
  const resposta = await fetch(API + caminho, {
    method: metodo,
    headers: { Authorization: WIX_API_KEY, 'wix-site-id': WIX_SITE_ID, 'Content-Type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const texto = await resposta.text();
  const dados = texto ? JSON.parse(texto) : {};
  if (!resposta.ok) {
    const erro = new Error(`${metodo} ${caminho}: ${resposta.status} ${dados.message ?? texto}`);
    erro.status = resposta.status;
    erro.codigo = dados.details?.applicationError?.code;
    throw erro;
  }
  return dados;
}

const data = (dia) => (dia ? { $date: `${dia}T12:00:00.000Z` } : undefined);

async function instalarCms() {
  try {
    await wix('POST', '/apps-installer-service/v1/app-instance/install', {
      tenant: { tenantType: 'SITE', id: WIX_SITE_ID },
      appInstance: { appDefId: CMS, enabled: true },
    });
    console.log('CMS instalado.');
  } catch (e) {
    console.log(`CMS: ${e.message} (se já estava instalado, siga em frente).`);
  }
}

async function acertarRegiao() {
  await wix('POST', '/site-properties/v4/properties/business-region', {
    businessRegion: { paymentCurrency: 'BRL', timeZone: 'America/Bahia' },
    fields: { paths: ['paymentCurrency', 'timeZone'] },
  });
  await wix('PATCH', '/site-properties/v4/properties', { properties: { language: 'pt' }, fields: { paths: ['language'] } });
  await wix('PATCH', '/site-properties/v4/properties', {
    properties: { locale: { languageCode: 'pt', country: 'BR' } },
    fields: { paths: ['locale'] },
  });
  console.log('Moeda BRL, fuso America/Bahia, português do Brasil.');
}

/** Importa as fotos e devolve o id novo de cada arquivo, pelo id do site original. */
async function importarFotos() {
  const ids = {};
  for (const [nome, foto] of Object.entries(fotos)) {
    const { file } = await wix('POST', '/site-media/v1/files/import', {
      url: foto.origem,
      mimeType: 'image/webp',
      displayName: `${nome}.webp`,
      mediaType: 'IMAGE',
      private: false,
    });
    ids[foto.arquivo] = file.url;
    console.log(`Foto ${nome}: ${file.url}`);
  }
  return ids;
}

async function criarColecao(colecao) {
  try {
    await wix('POST', '/wix-data/v2/collections', { collection: colecao });
    console.log(`Coleção ${colecao.id} criada.`);
  } catch (e) {
    if (e.status !== 409 && e.codigo !== 'WDE0104') throw e;
    console.log(`Coleção ${colecao.id} já existe.`);
  }
}

async function gravarSeVazia(colecao, itens) {
  const { dataItems = [] } = await wix('POST', '/wix-data/v2/items/query', { dataCollectionId: colecao, query: { paging: { limit: 1 } } });
  if (dataItems.length) {
    console.log(`${colecao}: já tem itens, nada gravado.`);
    return;
  }
  const { bulkActionMetadata } = await wix('POST', '/wix-data/v2/bulk/items/insert', {
    dataCollectionId: colecao,
    dataItems: itens.map((item) => ({ data: item })),
  });
  console.log(`${colecao}: ${bulkActionMetadata?.totalSuccesses ?? itens.length} itens gravados.`);
}

await instalarCms();
await acertarRegiao();
const novas = await importarFotos();
for (const colecao of colecoes) await criarColecao(colecao);
await gravarSeVazia('quartos', quartos.map((q) => ({ ...q, foto: novas[q.foto] })));
await gravarSeVazia(
  'temporadas',
  temporadas.map((t) => ({ ...t, primeiraNoite: data(t.primeiraNoite), ultimaNoite: data(t.ultimaNoite) })),
);
console.log('Pronto. Agora suba a pasta site/ e instale os módulos do CMS (veja "Publicar" no README).');
