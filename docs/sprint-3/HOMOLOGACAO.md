# Homologação da revisão de videoaulas

## Integração já executada

A revisão passou em uma pilha descartável com GoTrue 2.177.0, PostgREST 12.2.12 e PostgreSQL 16. A execução aplica o SQL duas vezes, cadastra criador e cozinheiro com Auth, aprova o criador, publica vídeo, processa recusa e PIX simulados, valida entrega de kit, confirma o pedido, publica e responde dúvida, altera a senha e exclui o comprador. Um segundo cliente fez login sem reutilizar o armazenamento do primeiro e recuperou o acesso comprado.

Com Docker, Node.js 22.5+, OpenSSL e cURL disponíveis, execute na raiz do repositório:

```bash
bash tests/run-supabase-qa.sh
```

A execução usa contêineres descartáveis em portas locais e os remove ao terminar. [Registro do teste](evidencias/revisao-video/auth-integracao.txt)

## Projeto hospedado

O endpoint público da Vercel respondeu e servia a versão integrada pelo primeiro PR. O painel Supabase do projeto configurado pediu login. O acesso ao endpoint do banco foi bloqueado na rede do ambiente de revisão. A migração desta revisão ainda precisa ser aplicada e verificada no Supabase hospedado.

1. Entre no **Supabase Dashboard** com a conta que administra o GastroMatch. Selecione um projeto de homologação com dados descartáveis. No **SQL Editor → New query**, cole todo o [`server/supabase.sql`](../../server/supabase.sql) desta revisão e clique em **Run**.
2. Teste uma cópia do front com o endereço e a chave pública do projeto de homologação em `js/config.js`. Para usar o modo Supabase ao servir a cópia, execute o front como site estático. Por exemplo, execute `python -m http.server 8081` na raiz e abra `http://localhost:8081`. Confirme no console que `API.mode()` devolve `supabase`. Use contas descartáveis para os perfis de administrador, criador e cozinheiro.
3. Crie um criador e aprove-o com a conta de administrador. Publique uma receita com kit e vídeo, simule a recusa de cartão e confirme via PIX. Verifique o vídeo após a compra e em um segundo navegador com a mesma conta. Teste entrega, retirada, comunidade, troca e exclusão da conta descartável.
4. Depois de homologar, faça backup do banco do projeto publicado. Aplique o mesmo SQL no Supabase de produção e integre o PR da revisão na mesma janela. A nova função `gm_recipe_video` substitui a entrega do link pelo catálogo. Confira a publicação no Vercel e repita os fluxos essenciais com dados de teste.

A revisão preserva leitura de aulas vindas de uma versão antiga do catálogo durante a transição. Os controles de acesso na API dependem da aplicação do SQL. Consulte [manual e variáveis](MANUAL.md).
