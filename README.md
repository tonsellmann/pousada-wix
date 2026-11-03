# Pousada Barra Mansa

Site de uma pousada em Caraíva, Bahia, feito em Wix Headless. Os quartos, as temporadas e os pedidos de orçamento ficam no CMS do Wix; a página monta o orçamento noite por noite, com o preço e o mínimo de noites de cada temporada.

**Projeto conceito.** A pousada é fictícia, e os pedidos feitos no site não são respondidos.

- Portfólio: https://luisantoniodev.tech

## O problema

Pousada pequena em destino de temporada vive de mensagem no WhatsApp perguntando "quanto fica do dia 30 ao dia 2?". A resposta muda com a data: o Réveillon custa mais que o dobro da baixa temporada e só fecha em pacote de cinco noites, o Carnaval pede quatro, e uma viagem que começa no Natal e termina no Ano-Novo paga cada noite num preço. A dona faz essa conta à mão, várias vezes por dia.

O site faz a conta antes da conversa. O hóspede escolhe o quarto e as datas e vê:

- uma linha por temporada, com as noites, a diária e o subtotal;
- o mínimo de noites da temporada mais exigente que a viagem toca e, se a estadia estiver curta, a data de saída que cumpre o mínimo, já com o preço;
- as observações da temporada (o pacote do Réveillon, as datas do Carnaval).

O pedido chega no painel do Wix com o orçamento escrito em texto, para a dona ler no celular e responder.

## Por que Wix

Quem mexe no site depois de pronto é a dona da pousada, no celular, entre um check-in e outro. Isso decidiu a plataforma.

- **O CMS do Wix vira o painel dela.** Cada coleção (quartos, temporadas, pedidos) aparece no painel do Wix como uma tabela com formulário, que abre no navegador do celular. Mudar a data do Carnaval ou a diária de um quarto é editar uma linha, e o orçamento do site muda na hora, sem publicar nada.
- **Permissão por coleção, sem servidor.** Quartos e temporadas têm leitura pública; pedidos aceitam gravação de qualquer visitante e leitura só da dona. Não existe back-end para manter, atualizar ou proteger.
- **Hospedagem e imagens inclusas.** O Wix hospeda as páginas e o Wix Media recorta e converte as fotos pela URL (`/v1/fill/w_800,h_600/...`), então cada tela pede a foto no tamanho que usa.
- **Headless em vez do editor.** As páginas são HTML, CSS e JavaScript deste repositório. A regra de preço fica num módulo puro ([site/js/orcamento.js](site/js/orcamento.js)), com testes automatizados e versionado no Git, coisa que o editor visual não dá.

### O que ficou de fora

- **WordPress com plugin de reservas.** Resolve, mas pede hospedagem, atualização de plugin e cuidado com segurança. Para uma pousada de quatro quartos, é manutenção demais.
- **Editor do Wix com código Velo.** Faz a mesma conta, mas o código fica preso ao editor, sem teste automatizado e sem histórico de versões.
- **Site estático com uma planilha do Google.** A dona edita fácil, mas a planilha não tem permissão por linha, e os pedidos precisariam de outro serviço.

## Decisões de interface

- **A conta parece um recibo.** Uma linha por temporada, com etiqueta colorida pelo nível de preço: azul na diária de tabela, amarelo na alta, vermelho no pico (Réveillon e Carnaval). O hóspede entende de onde vem o total sem ler regra nenhuma.
- **O mínimo de noites não bloqueia.** Com a estadia curta, o orçamento aparece inteiro e, embaixo, um botão "Sair em 04/01: 5 noites, R$ 4.032". Um clique resolve. Se esticar a viagem cair numa temporada mais exigente, a sugestão já considera isso.
- **A saída anda junto.** Ao escolher a chegada, a saída vem preenchida com o mínimo da baixa temporada e nunca fica antes da chegada.
- **Erro só no campo mexido.** Ninguém abre a página e dá de cara com "escolha um quarto" em vermelho.
- **Contato só depois do orçamento.** Os campos de nome, WhatsApp e e-mail ficam desabilitados até a conta fechar, para não chegar pedido sem datas.
- **Hóspedes limitados pelo quarto.** O botão "+" para na capacidade do quarto escolhido.
- **Datas no fuso da pousada.** "Hoje" é o de Caraíva (America/Bahia), mesmo para quem abre o site de Lisboa.
- **Cores das canoas.** Azul, vermelho e amarelo dos barcos do rio Caraíva sobre um fundo de água clara; títulos em Caprasimo e texto em Figtree.

## Como funciona

```
site/
  index.html          a página única
  css/estilo.css
  js/orcamento.js     as regras de preço: puro, sem página e sem Wix
  js/formato.js       reais e datas em português, no fuso de Caraíva
  js/pagina.js        lê o CMS, desenha a página e grava o pedido
wix/
  conteudo.js         as coleções, os quartos, as temporadas e as fotos
  semear.mjs          prepara um site Wix novo com esse conteúdo
tests/
  orcamento.test.js   18 testes das regras de preço
  falsos/cms.js       os itens como o módulo do Wix devolve
scripts/
  cms-falso.mjs       um módulo do CMS de mentira, com o conteúdo de wix/conteudo.js
  previa.mjs          prévia local com esse CMS
  preparar-demonstracao.mjs   cópia do site que roda em qualquer pasta, sem Wix
```

A página importa dois módulos que o Wix instala no site, em `site/js/wix/`: `queryItems` lê uma coleção e `insertItem` grava o pedido. Eles não estão no repositório porque são do Wix.

### Coleções do CMS

| Coleção | Campos | Permissão |
|---|---|---|
| `quartos` | nome, resumo, descrição, hóspedes, diária na baixa temporada, foto, ordem | todos leem |
| `temporadas` | nome, primeira e última noite, fator sobre a diária, mínimo de noites, se é a padrão, observação | todos leem |
| `pedidos` | nome, e-mail, WhatsApp, quarto, chegada, saída, hóspedes, noites, total, noites por temporada, mensagem | todos gravam, só a dona lê |

A regra do preço:

- A noite de 27/12 é a que começa no dia 27. Quem chega em 27/12 e sai em 02/01 dorme seis noites.
- A diária de uma noite é a do quarto vezes o fator da temporada da noite, arredondada para o real.
- Se duas temporadas cobrem a mesma noite, vale a de maior fator. Fora de todas, vale a marcada como padrão.
- O mínimo da estadia é o maior entre as temporadas que ela toca.
- Mais de 30 noites é combinado direto com a pousada.

As datas do CMS são gravadas ao meio-dia UTC, para nenhum fuso mudar o dia.

## Rodar

Precisa de Node 20 ou mais novo.

```bash
npm install
npm test
npm run previa
```

A prévia abre em http://localhost:4330 com os quartos e as temporadas de `wix/conteudo.js`. Os pedidos ficam na memória da aba, em `window.pedidosDaPrevia`.

Para a demonstração do portfólio, `node scripts/preparar-demonstracao.mjs <pasta>` grava uma cópia do site com caminhos relativos e o mesmo CMS de mentira.

## Publicar

1. **Site e conteúdo.** Crie um site Wix Headless e uma chave de API em https://manage.wix.com/account/api-keys, com acesso ao site, ao CMS, ao Media Manager, às propriedades do site e à instalação de apps. Depois:

   ```bash
   WIX_API_KEY=... WIX_SITE_ID=... npm run semear
   ```

   O script instala o CMS, acerta moeda (BRL), fuso (America/Bahia) e idioma, importa as fotos e cria as coleções com os quartos e as temporadas. Pode rodar de novo: o que já existe fica como está.

2. **Páginas.** Suba a pasta `site/` para a hospedagem do site Headless e instale os módulos do CMS do Wix em `js/wix/`, com o id do cliente OAuth do site. O site no ar foi publicado assim, pelo conector do Wix.

A chave de API nunca vai para o repositório nem para o navegador. A página usa só o token de visitante que o módulo do Wix gera.

## Créditos

Fotos e fontes em [CREDITOS.md](CREDITOS.md).
