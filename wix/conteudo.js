// O conteúdo do site: as coleções do CMS do Wix, os quartos, as temporadas e as fotos.
// É o mesmo que está gravado no site no ar. wix/semear.mjs grava isto num site novo, e os testes
// leem daqui o que o CMS devolveria.

// Fotos com licença livre, guardadas no Wix Media do site. "arquivo" é o id que o Wix deu a cada
// uma no site no ar; "origem" é de onde semear.mjs importa num site novo.
const PORTFOLIO = 'https://luisantoniodev.tech/fotos/costa-ampla-imoveis';
export const fotos = {
  capa: { arquivo: 'a7c136_aa9727c4bb3148a295f2bddfb1401225~mv2.webp', origem: `${PORTFOLIO}/imovel-6b.webp`, descricao: 'Barcos coloridos ancorados no rio Caraíva, com coqueiros na outra margem' },
  chale: { arquivo: 'a7c136_e1ba7486daec407ebb1850cc33e9acf4~mv2.webp', origem: `${PORTFOLIO}/imovel-6.webp`, descricao: 'Chalé de madeira escura com telhado de palha, no gramado' },
  varanda: { arquivo: 'a7c136_9eb48cf86f3545a698d9ecf8e9fa42f6~mv2.webp', origem: `${PORTFOLIO}/imovel-8b.webp`, descricao: 'Duas cadeiras de madeira numa varanda, de frente para a vegetação' },
  casaDaMata: { arquivo: 'a7c136_867bd9857d7b43ff8b21c05f428b659a~mv2.webp', origem: `${PORTFOLIO}/imovel-5.webp`, descricao: 'Casa com piscina no alto de um terreno, cercada de mata' },
  quartoDaVila: { arquivo: 'a7c136_b3207c99e4bd40d2b998a7dfe883c39c~mv2.webp', origem: `${PORTFOLIO}/imovel-9.webp`, descricao: 'Quarto claro com poltrona e janela grande' },
  vila: { arquivo: 'a7c136_00d9d2d59623474a9b236bde6e31d79d~mv2.webp', origem: `${PORTFOLIO}/imovel-3.webp`, descricao: 'Rua estreita entre casas coloridas e vasos de plantas' },
};

const leituraPublica = { read: 'ANYONE', insert: 'ADMIN', update: 'ADMIN', remove: 'ADMIN' };
// O hóspede grava o pedido, mas não lê o de ninguém: só a pousada, no painel.
const visitanteGrava = { read: 'ADMIN', insert: 'ANYONE', update: 'ADMIN', remove: 'ADMIN' };

export const colecoes = [
  {
    id: 'quartos',
    displayName: 'Quartos',
    permissions: leituraPublica,
    fields: [
      { key: 'titulo', displayName: 'Nome', type: 'TEXT' },
      { key: 'slug', displayName: 'Endereço na página', type: 'TEXT' },
      { key: 'resumo', displayName: 'Resumo', type: 'TEXT' },
      { key: 'descricao', displayName: 'Descrição', type: 'RICH_TEXT' },
      { key: 'capacidade', displayName: 'Hóspedes', type: 'NUMBER' },
      { key: 'diaria', displayName: 'Diária na baixa temporada (R$)', type: 'NUMBER' },
      { key: 'foto', displayName: 'Foto', type: 'IMAGE' },
      { key: 'ordem', displayName: 'Ordem na página', type: 'NUMBER' },
    ],
  },
  {
    id: 'temporadas',
    displayName: 'Temporadas',
    permissions: leituraPublica,
    fields: [
      { key: 'nome', displayName: 'Nome', type: 'TEXT' },
      { key: 'primeiraNoite', displayName: 'Primeira noite', type: 'DATE' },
      { key: 'ultimaNoite', displayName: 'Última noite', type: 'DATE' },
      { key: 'fator', displayName: 'Fator sobre a diária (1 = baixa temporada)', type: 'NUMBER' },
      { key: 'minimoNoites', displayName: 'Mínimo de noites', type: 'NUMBER' },
      { key: 'padrao', displayName: 'Vale fora das outras temporadas', type: 'BOOLEAN' },
      { key: 'observacao', displayName: 'Observação para o hóspede', type: 'TEXT' },
    ],
  },
  {
    id: 'pedidos',
    displayName: 'Pedidos de orçamento',
    permissions: visitanteGrava,
    fields: [
      { key: 'nome', displayName: 'Nome', type: 'TEXT' },
      { key: 'email', displayName: 'E-mail', type: 'EMAIL' },
      { key: 'whatsapp', displayName: 'WhatsApp', type: 'TEXT' },
      { key: 'quarto', displayName: 'Quarto', type: 'TEXT' },
      { key: 'chegada', displayName: 'Chegada', type: 'DATE' },
      { key: 'saida', displayName: 'Saída', type: 'DATE' },
      { key: 'hospedes', displayName: 'Hóspedes', type: 'NUMBER' },
      { key: 'noites', displayName: 'Noites', type: 'NUMBER' },
      { key: 'total', displayName: 'Total estimado (R$)', type: 'NUMBER' },
      { key: 'detalhamento', displayName: 'Noites por temporada', type: 'TEXT' },
      { key: 'mensagem', displayName: 'Mensagem', type: 'TEXT' },
    ],
  },
];

// "foto" é o id do arquivo no Wix Media; semear.mjs troca pelo id do site novo.
export const quartos = [
  { titulo: 'Chalé do Rio', slug: 'chale-do-rio', resumo: 'Chalé de madeira com telhado de piaçava, a vinte passos do rio.', descricao: '<p>Cama de casal, rede na varanda e café servido no deque, de frente para os barcos. O mais pedido para lua de mel.</p>', capacidade: 2, diaria: 420, foto: fotos.chale.arquivo, ordem: 1 },
  { titulo: 'Suíte Varanda', slug: 'suite-varanda', resumo: 'Varanda com espreguiçadeiras virada para o mangue.', descricao: '<p>Suíte no andar de cima, com ventilador de teto, varanda própria e o pôr do sol atrás do mangue.</p>', capacidade: 2, diaria: 340, foto: fotos.varanda.arquivo, ordem: 2 },
  { titulo: 'Quarto da Vila', slug: 'quarto-da-vila', resumo: 'Térreo, a dois minutos da praça e do forró.', descricao: '<p>Quarto para até três pessoas, com cama de casal e uma de solteiro. Perto de tudo, longe do barulho depois da meia-noite.</p>', capacidade: 3, diaria: 280, foto: fotos.quartoDaVila.arquivo, ordem: 3 },
  { titulo: 'Casa da Mata', slug: 'casa-da-mata', resumo: 'Casa inteira para a família, com piscina e cozinha.', descricao: '<p>Três quartos, cozinha equipada e piscina só da casa, no alto do terreno, entre a mata e o rio.</p>', capacidade: 6, diaria: 780, foto: fotos.casaDaMata.arquivo, ordem: 4 },
];

// Datas como "AAAA-MM-DD"; semear.mjs grava cada uma ao meio-dia UTC, para nenhum fuso mudar o dia.
export const temporadas = [
  { nome: 'Baixa temporada', fator: 1, minimoNoites: 2, padrao: true, observacao: 'Fora das datas abaixo, a diária é a de tabela.' },
  { nome: 'Antes do Natal', primeiraNoite: '2026-12-18', ultimaNoite: '2026-12-26', fator: 1.4, minimoNoites: 3, padrao: false, observacao: '' },
  { nome: 'Réveillon', primeiraNoite: '2026-12-27', ultimaNoite: '2027-01-01', fator: 2.2, minimoNoites: 5, padrao: false, observacao: 'Pacote de cinco noites, com ceia da virada na beira do rio.' },
  { nome: 'Alta de verão', primeiraNoite: '2027-01-02', ultimaNoite: '2027-02-05', fator: 1.5, minimoNoites: 3, padrao: false, observacao: '' },
  { nome: 'Carnaval', primeiraNoite: '2027-02-06', ultimaNoite: '2027-02-09', fator: 1.9, minimoNoites: 4, padrao: false, observacao: 'Do sábado à terça de carnaval.' },
  { nome: 'Fim do verão', primeiraNoite: '2027-02-10', ultimaNoite: '2027-02-28', fator: 1.3, minimoNoites: 2, padrao: false, observacao: '' },
  { nome: 'Semana Santa', primeiraNoite: '2027-03-25', ultimaNoite: '2027-03-27', fator: 1.4, minimoNoites: 3, padrao: false, observacao: '' },
  { nome: 'Férias de julho', primeiraNoite: '2027-07-01', ultimaNoite: '2027-07-31', fator: 1.3, minimoNoites: 2, padrao: false, observacao: '' },
];
