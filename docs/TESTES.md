# Testes de usabilidade e evidências

## Testes automatizados

- `npm test`: 27 cenários de regra de negócio (cadastro, curadoria, publicação, pagamento 402, kit e raio, comunidade, perfil e exclusão de conta) e 15 testes do adaptador do Supabase, que usam um Supabase simulado. Resultado em `docs/evidencias-testes-api.txt` (modo local) e `docs/evidencias-testes-servidor-banco.txt` (contra o banco).
- Auditoria de interface em navegador (Chromium): 20 telas em 360, 768 e 1280 px, sem rolagem lateral nem erros de console; categorias, busca por CEP, abas e publicação de receita verificadas.
- Teste de interface em navegador simulado: login, filtros, dashboard, publicação, pagamento recusado e aprovado, modo cozinha, termo sanitário e curadoria (14 verificações, todas aprovadas).

## Roteiro manual (tirar os prints e salvar em `docs/prints/`)

| # | Fluxo | Passos | Resultado esperado | Print |
|---|---|---|---|---|
| 1 | Cadastro amador | Criar conta com senha de 3 letras | Mensagem de senha mínima | 01-cadastro-erro.png |
| 2 | Login inválido | Entrar com senha errada | "E-mail ou senha incorretos." | 02-login-erro.png |
| 3 | Cadastro de chef | Enviar sem marcar o termo sanitário | Alerta da Vigilância Sanitária | 03-termo.png |
| 4 | Chef pendente | Entrar como beatriz@email.com | Painel bloqueado, status PENDENTE | 04-pendente.png |
| 5 | Curadoria | Entrar como admin e aprovar a Beatriz | Status APROVADO | 05-curadoria.png |
| 6 | Publicar receita | Chef aprovado cria receita e publica | Aparece na vitrine; rascunho não aparece | 06-publicar.png |
| 7 | Filtros | Escolher Vegano e Até 30 min | Lista filtrada | 07-filtros.png |
| 8 | Pagamento recusado | Comprar com cartão final 0000 | Erro 402 | 08-402.png |
| 9 | Pagamento aprovado | Comprar com PIX ou outro cartão | Receita liberada e modo cozinha | 09-aprovado.png |
| 10 | Kit fora do raio | Testar CEPs até aparecer "fora do raio" | Opção de retirada ou só a aula | 10-raio.png |
| 11 | Pedido de kit | Confirmar com o termo marcado | Pedido aparece no dashboard do chef | 11-pedido.png |
| 12 | Comunidade | Postar dúvida; chef responde no painel | Resposta aparece no post | 12-comunidade.png |
| 13 | Responsividade | Repetir telas 6, 9 e 11 com a janela a 390 px | Sem rolagem lateral na página | 13-mobile.png |

## Roteiro manual no Supabase

Resultado do que já foi executado no projeto real do Supabase (prints em `docs/evidencias/`, resumo em `docs/EVIDENCIAS_SUPABASE.md`):

| Fluxo | Situação |
|---|---|
| Criar o banco rodando `server/supabase.sql` | Verificado |
| Cadastro de 4 contas (administrador, chef, cozinheira e chef pendente) com perfil criado pelo gatilho | Verificado |
| Script de contas de demonstração (administrador e restaurante Osteria Torino) | Verificado |
| Compra de receita gravada em `transacao_financeira` e `acesso_receita` | Verificado |
| Painel do administrador lendo usuários, transações e criadores | Verificado |
| Publicar receita como chef aprovado | A testar |
| Pedido de kit dentro e fora do raio | A testar |
| Cartão recusado (final 0000) sem liberar acesso | A testar |
| Comunidade: post e resposta do chef | A testar |
| Troca de nome e de senha no perfil | A testar |
| Excluir conta e todos os dados no perfil | A testar |
| Entrar com a mesma conta em outro aparelho | A testar |

## Registro de ajustes feitos após os testes

- Chamada de `video.play()` protegida para navegadores que bloqueiam vídeo automático.
