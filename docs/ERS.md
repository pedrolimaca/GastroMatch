# Especificação de Requisitos de Software (ERS) - GastroMatch

## 1. Introdução

**Propósito.** Descrever o que o GastroMatch faz e como cada requisito foi verificado.
**Escopo.** Plataforma web que conecta chefs e restaurantes profissionais a cozinheiros amadores, reunindo: venda de videoaulas e receitas (compra avulsa ou assinatura), kits de ingredientes com entrega restrita por distância, comunidade com avaliações e curadoria sanitária dos criadores.
**Entregas.** Sprint 1 e Sprint 2, mais a integração com o banco na nuvem (Supabase), o catálogo de receitas, a tela de perfil e a exclusão de conta.

## 2. Visão geral

**Perfis de usuário**

| Perfil | O que faz |
|---|---|
| Cozinheiro amador | Navega, compra aulas e kits, usa o modo cozinha, publica pratos e dúvidas |
| Chef ou restaurante (criador) | Cadastra-se, aguarda aprovação, publica receitas e kits, acompanha vendas e responde à comunidade |
| Administrador | Faz a curadoria dos criadores e consulta usuários e transações |

**Restrições.** Aplicação web responsiva (celular e desktop); três modos de dados: Supabase (PostgreSQL na nuvem, usado na versão publicada), servidor Node com SQLite (`npm start`) e modo local no navegador (plano B); pagamento simulado nesta entrega.
Diagramas: `docs/diagramas/casos-de-uso.png`, `fluxo.png`, `arquitetura.png`, `der.png`.

## 3. Requisitos funcionais

| Código | Requisito | Critério de aceite | Onde |
|---|---|---|---|
| RF01 | Cadastro de chef ou restaurante com documento (diploma ou CNPJ/alvará) e termo sanitário | Sem termo ou sem documento o envio é bloqueado; cadastro nasce PENDENTE DE VALIDAÇÃO | `doRegisterCriador`, `POST /auth/register` |
| RF02 | Publicar receitas, com rascunho, e filtrar a vitrine por restrição alimentar, tempo e categoria | Rascunho não aparece na vitrine; filtros combinam | `publishRecipe`, `filteredRecipes`, `POST /recipes` |
| RF03 | Comercialização de receita avulsa (pay-per-view) e assinatura, com cupom e registro financeiro | Pagamento aprovado libera o acesso e grava a transação | `openPayment`, `POST /checkout` |
| RF04 | Kit de ingredientes com validação de CEP por raio de entrega | Fora do raio: oferece retirada ou só a aula | `checkCep`, `GEO.distanceKm`, `POST /checkout` |
| RF05 | Cadastro e login do cozinheiro amador | Valida nome, e-mail, senha e duplicidade | `doRegisterAmador`, `doLogin` |
| RF06 | Comunidade: foto, nota de 1 a 5 e dúvidas respondidas pelo restaurante | Resposta do chef aparece no post | `submitPost`, `replyPost` |
| RF07 | Perfil do usuário (cozinheiro, criador e administrador): ver atividade, alterar nome e senha | Nome com menos de 3 letras e senha atual errada são recusados; a nova senha exige 6 caracteres | `renderProfile`, `PATCH /me`, `POST /me/password` |
| RF08 | Catálogo de receitas com busca por nome, chef ou ingrediente, filtro por categoria, restrição, preparo e preço, e ordenação | A busca ignora acentos e maiúsculas; filtros combinam; sem resultado mostra aviso e permite limpar | `renderRecipes`, `filteredRecipes` (`js/pages.js`) |
| RF09 | Excluir a própria conta e todos os dados (privacidade) | Exige a senha e a palavra EXCLUIR; apaga cadastro, compras, pedidos, posts e, para criador, receitas, kits, assinaturas e respostas; o e-mail fica livre; administrador não exclui a própria conta | `deleteAccount`, `POST /me/delete` |

## 4. Regras de negócio

| Código | Regra |
|---|---|
| RN01 | Só criadores APROVADOS pelo administrador publicam receitas e cadastram kits |
| RN02 | Kit é entregue somente dentro do raio do restaurante (1 a 15 km); fora dele há retirada ou só a aula |
| RN03 | Termo sanitário é obrigatório no cadastro do criador e no pedido de kit |
| RN05 | Pagamento recusado devolve 402 "Transação não autorizada", registra a transação e não libera acesso |

Observação: a RN04 não aparece nos documentos recebidos. Se existir na versão oficial da equipe, incluir aqui e no backlog.

## 5. Requisitos não funcionais

| Código | Requisito | Situação |
|---|---|---|
| RNF02 | Conteúdo pago acessível só a quem comprou, assinou ou é dono | Atendido (vídeo é demonstração) |
| RNF03 | Ficha técnica em PDF com marca d'água do e-mail de quem baixou | Atendido |
| RNF04 | Modo cozinha: fonte ajustável, checklist de ingredientes e passos clicáveis | Atendido |
| RNF-R | Responsividade em 360, 768 e 1280 px sem rolagem lateral | Atendido (auditoria automática) |
| RNF-S | Senha armazenada com hash (scrypt no servidor Node; Supabase Auth no Supabase), sessão com token assinado, texto de usuário escapado | Atendido |
| RNF-D | Dados compartilhados entre aparelhos: no Supabase, as tabelas têm RLS ligado e sem políticas; o site só acessa o banco por funções `gm_*` que conferem o usuário logado | Atendido (verificado com dados reais, ver `docs/EVIDENCIAS_SUPABASE.md`) |
| RNF-C | Continuidade: se o Supabase não responder, o site usa o modo local | Atendido (teste de navegador sem rede) |
| RNF-P | Privacidade: o titular pode excluir a conta e todos os dados pela tela de perfil | Atendido nos modos local e servidor; no Supabase falta o teste manual (ver `docs/EVIDENCIAS_SUPABASE.md`) |

## 6. Rastreabilidade

| Requisito | Teste automatizado (`tests/api.test.js`) |
|---|---|
| RF01, RN01, RN03 | cadastro de criador exige termo e documento; criador novo fica PENDENTE e não publica (403); só admin acessa a curadoria; admin aprova |
| RF02 | rascunho não aparece na vitrine; publicar e despublicar; preço e tempo obrigatórios |
| RF03, RN05 | cartão recusado gera 402 sem liberar acesso; cupom inválido e cupom GASTRO10; assinatura libera o catálogo |
| RF04, RN02 | kit fora do raio é bloqueado; retirada gera pedido; chef altera o raio |
| RF05 | validação de nome, e-mail e senha; e-mail duplicado; login incorreto retorna 401 |
| RF06 | post com nota e dúvida; comentário vazio bloqueado; chef responde |
| Segurança | rotas protegidas retornam 401 sem login; chef não edita receita de outro criador |

Os mesmos 27 testes de `tests/api.test.js` rodam no modo local e contra o banco SQLite (`docs/evidencias-testes-*.txt`). Os 15 testes de `tests/supabase.test.js` conferem o adaptador do Supabase com um Supabase simulado. O SQL de `server/supabase.sql` só executa no Supabase de verdade e por isso foi verificado por teste manual (`docs/EVIDENCIAS_SUPABASE.md`).

| Requisito | Teste |
|---|---|
| RF07 | `Perfil: usuário altera o nome...` e `Perfil: troca de senha exige a senha atual...` |
| RF09, RNF-P | `Privacidade: excluir conta exige senha e a palavra EXCLUIR e apaga todos os dados da pessoa` e `Privacidade: criador que exclui a conta leva receitas, assinaturas e respostas; administrador não exclui a própria` |
| RF08, RNF-C | verificação em navegador (busca, categorias, filtros, ordenação e queda para o modo local) |
