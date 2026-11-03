// Os itens das coleções como o módulo do Wix (items.js) devolve: datas em ISO, imagens já em URL.
// São os mesmos que wix/conteudo.js grava no CMS do site.
import { quartos as q, temporadas as t } from '../../wix/conteudo.js';

const midia = (id) => `https://static.wixstatic.com/media/${id}/v1/fill/w_1200,h_900,al_c,q_90/${id}`;
const iso = (data) => (data ? `${data}T12:00:00.000Z` : undefined);

export const quartos = q.map((item, i) => ({ _id: `quarto-${i + 1}`, ...item, foto: midia(item.foto) }));

export const temporadas = t.map((item, i) => ({
  _id: `temporada-${i + 1}`,
  ...item,
  primeiraNoite: iso(item.primeiraNoite),
  ultimaNoite: iso(item.ultimaNoite),
}));
