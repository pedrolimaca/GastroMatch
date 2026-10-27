# Especificação de Requisitos de Software (ERS) - GastroMatch

## 1. Introdução

**Propósito.** Descrever o que o GastroMatch faz e como cada requisito foi verificado.
**Escopo.** Plataforma web que conecta chefs e restaurantes profissionais a cozinheiros amadores, reunindo: venda de videoaulas e receitas (compra avulsa ou assinatura), kits de ingredientes com entrega restrita por distância, comunidade com avaliações e curadoria sanitária dos criadores.
**Entregas.** Sprint 1 e Sprint 2.

## 2. Visão geral

**Perfis de usuário**

| Perfil | O que faz |
|---|---|
| Cozinheiro amador | Navega, compra aulas e kits, usa o modo cozinha, publica pratos e dúvidas |
| Chef ou restaurante (criador) | Cadastra-se, aguarda aprovação, publica receitas e kits, acompanha vendas e responde à comunidade |
| Administrador | Faz a curadoria dos criadores e consulta usuários e transações |

**Restrições.** Aplicação web responsiva (celular e desktop); back-end Node com banco SQLite; pagamento simulado nesta entrega.
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
| RNF-S | Senha armazenada com hash (scrypt), sessão com token assinado, texto de usuário escapado | Atendido |

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

Os mesmos 23 testes rodam no modo local e contra o banco (`docs/evidencias-testes-*.txt`).
