# GastroMatch

Plataforma de experiências gastronômicas que conecta usuários a chefs e restaurantes por meio de receitas exclusivas, técnicas profissionais, videoaulas e experiências gastronômicas.

## Telas

- **Home:** hero, busca, categorias, receitas em destaque, restaurantes próximos, chefs e parceiros.
- **Receitas (`#recipes`):** catálogo completo com banner por categoria, busca por nome, chef ou ingrediente, filtros de restrição, preparo e preço, e ordenação.
- **Receita, Chef, Checkout do kit e Comunidade.**
- **Perfil (`#profile`):** para cozinheiro, criador e administrador. Edita nome e senha, mostra atividade, curadoria ou números da plataforma (conforme o tipo de conta) e permite **excluir a conta e todos os dados** (pede a senha e a palavra EXCLUIR).
- **Painel do criador e Administração.**
- **Ajuda, Contato, Termos e Privacidade.**

## Estrutura

| Pasta/arquivo | Função |
|---|---|
| `index.html`, `css/style.css` | Esqueleto, menus, rodapé e estilos |
| `js/script.js` | Dados base, roteador, tema escuro, Home, Receita, Chef, Checkout, Comunidade e Cadastro |
| `js/features.js` | Login, cadastro, painel do criador, administração, pagamento, modo cozinha e proximidade |
| `js/pages.js` | Catálogo de receitas (busca e filtros), perfil e páginas de informação |
| `js/api.js` | Camada de dados (modos Supabase, servidor ou local) |
| `js/supabase.js` | Adaptador do Supabase (login, dados e regras via funções SQL) |
| `js/geo.js` | CEP, distância e raio de entrega (compartilhado com o servidor) |
| `js/config.js` | Endereço da API (`GM_API_BASE`) |
| `server/` | API Node + banco SQLite (`schema.sql`) e scripts do Supabase (`supabase.sql`, `supabase-contas-demo.sql`) |
| `tests/` | Testes das regras de negócio |
| `docs/` | `SUPABASE.md`, `ERS.md`, `API.md`, `BACKLOG.md`, `DECISOES.md`, `CHECKLIST_ENTREGA.md`, `REVISAO_SPRINT.md`, `TESTES.md` e `diagramas/` |

A ordem dos scripts em `index.html` importa: `config`, `geo`, `supabase`, `api`, `features`, `pages` e, por último, `script`.

**Banco de dados:** o site escolhe sozinho entre Supabase (se `js/config.js` estiver preenchido e o banco responder), servidor Node com SQLite (`npm start`) e modo local no navegador. Passo a passo do Supabase em `docs/SUPABASE.md`.

**Vídeo do hero (opcional):** preencha `heroVideo` em `js/script.js` com um arquivo `.webm` ou `.mp4`. Sem ele, o hero usa a foto. Ao usar um vídeo, credite o autor no rodapé.

## Como rodar

**Com banco de dados (recomendado)**, precisa de Node 22.5 ou mais novo:

```
npm start
```

Abra http://localhost:3000. O servidor (`server/index.js`) serve o site e a API em `/api` e grava tudo em um banco SQLite (`server/gastromatch.db`, criado sozinho a partir de `server/schema.sql`). O front detecta o servidor automaticamente.

**Sem servidor**: abra o `index.html` (ou publique a pasta no Vercel). O site funciona em modo local, guardando os dados no navegador.

**Front em um endereço e API em outro**: edite `js/config.js` e coloque `window.GM_API_BASE = 'https://seu-servidor.com/api'`.

Variáveis do servidor: `PORT`, `DB_FILE`, `JWT_SECRET` (defina um segredo próprio em produção).

## Testes

```
npm test                                              # regras de negócio (modo local) + adaptador do Supabase (simulado)
API_URL=http://localhost:3000/api node tests/api.test.js   # as mesmas verificações contra o banco
```



## Publicação

- **Vercel (somente front)**: continua funcionando em modo local.
- **Supabase (recomendado, sem servidor extra)**: veja `docs/SUPABASE.md`.
- **Servidor Node com banco**: hospede o `server/` em um serviço de Node com disco persistente (Render, Railway, Fly.io) ou migre o `schema.sql` para PostgreSQL (Supabase, Neon). Depois aponte o `GM_API_BASE` para ele.
