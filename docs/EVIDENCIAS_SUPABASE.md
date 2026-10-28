# Evidências: integração com o Supabase

Prints tirados do painel do Supabase e do site publicado, em 28/10/2026, depois de criar o banco com `server/supabase.sql`, cadastrar as contas pelo site e rodar `server/supabase-contas-demo.sql`.

## O que as imagens mostram

**1. Cadastro e perfis** (`evidencias/01-tabela-usuario.png`)
Tabela `usuario` com as 4 contas criadas pelo site: um administrador, dois criadores e uma cozinheira. O perfil de cada uma foi criado pelo gatilho do banco no momento do cadastro.

**2. Acesso liberado pela compra** (`evidencias/02-tabela-acesso-receita.png`)
Tabela `acesso_receita`: a cozinheira passou a ter acesso à receita `curry-verde`, ligada à transação 1.

**3. Transação financeira** (`evidencias/03-tabela-transacao-financeira.png`)
Tabela `transacao_financeira`: compra do tipo `receita` de R$ 28,50 no cartão, do mesmo usuário do print anterior.

**4. Painel do administrador** (`evidencias/04-painel-administrador.png`)
Tela do site lendo o Supabase: 4 usuários, 1 transação e a lista de criadores com tipo, documento, termo sanitário e status.

**5. Criadores no banco** (`evidencias/05-tabela-criador-conteudo.png`)
Tabela `criador_conteudo` com os 8 restaurantes do catálogo base, o Osteria Torino ligado ao usuário do chef de demonstração e a Chef Beatriz Lima, com o status exibido na coluna `status_validacao`.

## O que isso comprova

- O site publicado usa o banco (`API.mode()` retorna `supabase`).
- Cadastro, perfis, compra e leitura pelo administrador funcionam com dados reais.
- A compra respeita o dono: transação e acesso apontam para o mesmo usuário.

## O que ainda não foi comprovado no Supabase

Publicar receita, pedido de kit (dentro e fora do raio), cartão recusado, comunidade, troca de senha, **exclusão de conta** e uso de outro aparelho. A lista completa e a situação de cada item estão em `docs/TESTES.md`.

A exclusão de conta já passa nos testes automatizados dos modos local e servidor. No Supabase, ela depende de a função do banco apagar o usuário do Auth, o que só se confirma executando o fluxo no projeto real.

## Observação sobre o administrador

O print 1 foi tirado antes do script de contas de demonstração, que renomeia o administrador para "Administração GastroMatch".
