# GastroMatch no Supabase

O site pode usar o Supabase (PostgreSQL + login) como banco de dados, sem servidor Node. Quando o Supabase não responde, o site cai sozinho para o modo local (navegador).

## Como funciona

- **Login e senha:** Supabase Auth (`/auth/v1`). As senhas ficam criptografadas pelo próprio Supabase.
- **Dados e regras de negócio:** funções SQL `gm_*` (`/rest/v1/rpc`), em `server/supabase.sql`. Elas aplicam as mesmas regras do servidor Node: perfil de cada conta, curadoria, raio de entrega, cupom, termo sanitário.
- **Segurança:** todas as tabelas têm RLS ligado e nenhuma política, então o navegador não lê nem grava nas tabelas diretamente. Só as funções `gm_*` ficam liberadas e cada uma confere quem está logado (`auth.uid()`).
- **Chave:** o site usa só a chave pública (`sb_publishable_...`), que pode ficar no código. A chave `secret` / `service_role` nunca deve ir para o código nem para o GitHub.
- **Cartão:** o número do cartão fica no navegador. O banco recebe apenas se o cartão foi aceito (`card_ok`). O pagamento continua simulado.

## Configuração (uma vez)

1. **Criar o projeto** em supabase.com e anotar a URL (`https://ID.supabase.co`) e a chave `sb_publishable_...`.
2. **Desligar a confirmação de e-mail** (só para testes): Authentication > Sign In / Providers > Email > desmarcar *Confirm email*.
3. **Rodar o banco:** SQL Editor > New query > colar `server/supabase.sql` > Run. Pode rodar de novo sem problema.
4. **Preencher `js/config.js`** com a URL e a chave pública (`window.GM_SUPABASE`).
5. **Criar as contas de teste** pela tela "Criar conta" do site e depois rodar `server/supabase-contas-demo.sql` (explicação no começo do arquivo). Esse passo promove o administrador e liga o chef de demonstração ao restaurante Osteria Torino.
6. Publicar o front (git push). O Vercel republica sozinho.

## Como saber se está usando o Supabase

No site, abra o console do navegador (F12) e digite `API.mode()`:

- `supabase`: está usando o banco.
- `local`: o Supabase não respondeu (script SQL ainda não rodado, projeto pausado ou sem internet). Veja a mensagem `[GastroMatch] Supabase indisponível` no console.

## Erros comuns

| Mensagem | O que fazer |
|---|---|
| "O banco ainda não foi configurado" | Rode `server/supabase.sql` no SQL Editor. |
| "Esta conta não tem perfil no GastroMatch" | A conta foi criada antes do script SQL. Rode o script de novo: ele cria o perfil das contas existentes. |
| "Confirme o e-mail" ao criar conta | A confirmação de e-mail está ligada (passo 2). |
| Botão de teste do login não entra | As contas de teste precisam existir (passo 5). |
| Site volta para o modo local depois de dias parado | No plano gratuito o Supabase pausa projetos sem uso. Reative no painel. |

## Limitações

- O preço de cada compra continua vindo do navegador (as receitas do catálogo base estão no código do site, não no banco). Receitas de criadores são validadas pelo banco.
- Dados que estavam salvos no navegador (modo local) não migram para o Supabase.
- Fotos de posts e de receitas são enviadas como texto (data URL). Para muitos usuários, o ideal é migrar para o Supabase Storage.
- Os testes automáticos (`npm test`) cobrem o servidor Node e o adaptador do site com um Supabase simulado. O SQL em si só é executado no Supabase.
