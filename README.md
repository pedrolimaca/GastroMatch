# GastroMatch

O GastroMatch conecta cozinheiros amadores a chefs e restaurantes por meio de receitas, videoaulas, kits de ingredientes e uma comunidade. Esta versão acadêmica demonstra o fluxo completo de navegação, curadoria, publicação e compras simuladas.

## Executar

Com Node.js 22.5 ou posterior, na raiz do repositório:

```bash
npm start
```

Abra <http://localhost:3000/>. O Node serve a interface e a API. O SQLite é criado em `server/gastromatch.db` e as contas de demonstração aparecem na tela de login. Para avaliar sem alterar um banco existente, configure `DB_FILE` com um caminho novo. O [manual](docs/sprint-3/MANUAL.md) cobre variáveis, configuração de nuvem e roteiro da Mostra.

A interface pode rodar como site estático na Vercel, com Supabase Auth e PostgreSQL quando configurados. O servidor Node, quando disponível na mesma origem ou explicitamente configurado, tem prioridade. Na ausência de ambos, a interface inicia em modo de demonstração individual no navegador.

## O que experimentar

- **Cozinheiro.** Busca por receita, chef ou ingrediente, filtros combináveis, compra avulsa, assinatura simulada, ficha PDF, modo cozinha, pedido de kit, avaliação e perfil.
- **Criador.** Solicitação de cadastro, painel de aprovação, edição de receitas e rascunhos, preço de kit, pedidos e respostas.
- **Administrador.** Curadoria de criadores, consulta à base de usuários e transações de demonstração.

O cartão fictício com final `0000` simula recusa. O PIX simulado aprova no próprio ambiente. O cupom `GASTRO10` aplica 10%. O preço registrado é calculado pela camada de dados. A distância por CEP é aproximada.

## Código e dados

| Caminho | Responsabilidade |
|---|---|
| `index.html`, `css/`, `assets/` | Estrutura, estilos responsivos e imagens-base com créditos |
| `js/script.js`, `js/features.js`, `js/pages.js` | Navegação, catálogo, autenticação, checkout e painéis |
| `js/checkout.js`, `js/geo.js` | Preços-base, validações e simulação de distância compartilhadas pelo Node e pela demonstração local |
| `js/api.js`, `js/supabase.js`, `js/config.js` | Escolha da fonte de dados, cliente REST e adaptador da nuvem |
| `server/index.js`, `server/schema.sql` | API Node e esquema SQLite |
| `server/supabase.sql` | Esquema PostgreSQL, RLS, catálogo comercial de demonstração e funções RPC |
| `tests/` | Testes de negócio, integração e interface |
| `docs/` | Requisitos, diagramas, documentação e evidências |

## Testes

```bash
npm test
```

A suíte padrão exercita as regras na demonstração local e o adaptador Supabase simulado. A suíte de negócio também roda contra SQLite. O [relatório de testes](docs/TESTES.md) cobre os comandos, os cenários de Chromium e PostgreSQL isolado e o que permanece para homologar na nuvem.

## Sprint 3

Veja o [índice de todos os entregáveis](docs/sprint-3/README.md), a [ERS final](docs/ERS.md), a [API](docs/API.md), os [diagramas](docs/diagramas/README.md), o [backlog](docs/BACKLOG.md) e as [limitações](docs/sprint-3/LIMITACOES.md).

A versão pública anterior está disponível na Vercel. Esta revisão requer aplicação do SQL e publicação do front correspondente para que as mudanças também estejam na nuvem. [GastroMatch na Vercel](https://gastro-match.vercel.app/)
