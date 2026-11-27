# Relatório de testes — Sprint 3

**Data da revisão** — 27/11/2026
**Ambientes** — Node.js 24.22.3, SQLite temporário, Chromium 156 / Playwright 1.62.1 e PostgreSQL local via PGlite 0.6.1 com Auth simulado.

| Execução | Resultado | Evidência |
|---|---|---|
| Regras de negócio em armazenamento local | 28 cenários passaram | [Log](sprint-3/evidencias/local.txt) |
| Adaptador Supabase com respostas simuladas | 15 cenários passaram | [Log](sprint-3/evidencias/local.txt) |
| As mesmas regras de negócio na API Node, sobre SQLite | 28 cenários passaram | [Log](sprint-3/evidencias/sqlite.txt) |
| SQL completo aplicado duas vezes, com catálogo, checkout e exclusão | Cinco grupos de verificações passaram | [Log](sprint-3/evidencias/postgres.txt) |
| Chromium sobre SQLite | Cinco fluxos de interface passaram, sem erros de execução do JavaScript capturados | [Log](sprint-3/evidencias/chromium.txt) |

## Casos e evidências

| Caso | Resultado da revisão |
|---|---|
| CT005–CT009, cadastro, duplicidade, login, credenciais inválidas e campos obrigatórios | Testes de validação, autenticação e duplicidade em Node e SQLite. Criação de conta e início de sessão conferidos na interface. |
| Curadoria e publicação | Perfil pendente bloqueado, aprovação exigida, publicação e rascunho testados na API. |
| Checkout e cupom | Backend determina valor e nome do item. Referência inexistente, criador divergente e cupom inválido são recusados. Cartão recusado grava transação sem liberar acesso. [Recusa](sprint-3/evidencias/02-pagamento-recusado.png) |
| Catálogo e modo cozinha | Busca por ingrediente, navegação direta e recarga. Pagamento simulado libera ingredientes e passos. [Catálogo](sprint-3/evidencias/01-catalogo.png), [Modo cozinha](sprint-3/evidencias/03-modo-cozinha.png) |
| Kits | CEP fora do raio, falta de termo, receita sem kit e modalidade inválida bloqueiam a compra. A retirada válida cria pedido. [Checkout a 390 px](sprint-3/evidencias/04-retirada-mobile.png) |
| Comunidade e painel | Publicação, resposta, pedido no painel do criador e mudança de status testados pela API. |
| Perfil e exclusão | Nome, senha e exclusão conferidos pelas suítes. Chromium confirma exclusão e falha de novo login. SQL verifica senha atual e exclusão dos dados em cascata. |

## Reproduzir

Na raiz do repositório:

```bash
npm test
DB_FILE=/tmp/gm-sprint3-qa.sqlite PORT=3811 npm start
```

Em outro terminal:

```bash
API_URL=http://127.0.0.1:3811/api node tests/api.test.js
```

Para executar os testes opcionais com dependências instaladas fora do código da aplicação:

```bash
qa_dir=$(mktemp -d)
npm install --prefix "$qa_dir" playwright@1.62.1 @electric-sql/pglite@0.6.1
NODE_PATH="$qa_dir/node_modules" node tests/sprint3-postgres.test.cjs
NODE_PATH="$qa_dir/node_modules" CHROMIUM_BIN=/usr/bin/chromium \
  GM_TEST_EVIDENCE=/tmp/gm-sprint3-evidencias node tests/sprint3-browser.test.cjs
```

Use um Chromium instalado, indicando seu caminho em `CHROMIUM_BIN`. O teste de interface cria dados em um banco descartável. Para um teste sem acesso à CDN, baixe o arquivo jsPDF 2.5.1 usado pelo front e defina `GM_TEST_JSPDF` com o caminho da cópia local. O teste SQL cria um banco em memória com o formato mínimo de `auth.users` e `auth.uid()`, além das funções e tabelas reais do projeto.

## Homologação da versão publicada

O [registro histórico](EVIDENCIAS_SUPABASE.md) tem capturas de conta, compra e administração da versão anterior. A revisão atual ainda requer aplicação do SQL e do front em um projeto de homologação com Auth real. Use contas descartáveis e registre data, usuário de teste e resultado destes fluxos:

1. Cadastro, autenticação e abertura da mesma conta em segundo navegador.
2. Aprovação de criador, publicação e despublicação de receita.
3. Compra da receita-base e de receita publicada, com cupom, recusa de cartão e acesso liberado via PIX.
4. Kit com CEP interno, externo e retirada, com conferência do pedido no painel.
5. Post, resposta, atualização de perfil, senha e exclusão de conta com tentativa de login posterior.
6. Download da ficha e leitura da marca d’água, navegação por teclado e compatibilidade em celular real.
