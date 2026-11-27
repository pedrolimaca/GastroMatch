# Backlog final — Sprint 3

## Concluídos no MVP

| Item | Requisito | Verificação |
|---|---|---|
| Cadastro e login, validações e perfil | RF05, RF07 | Testes Node, SQLite e adaptador Auth |
| Cadastro pendente, termo e aprovação de criador | RF01, RN01, RN03 | Testes de curadoria e bloqueio |
| Catálogo, rascunho, publicação, filtros e links diretos | RF02, RF08 | Testes de API e Chromium |
| Compra avulsa, cupom, assinatura e recusa simuladas | RF03, RN05 | SQLite, PostgreSQL isolado e Chromium |
| Kit, raio simulado, retirada e painel de pedidos | RF04, RN02, RN03 | SQLite, PostgreSQL isolado e Chromium |
| Checkout com preço e título definidos pelo catálogo | RF03, RF04 | Testes de checkout em três modos |
| Comunidade, avaliação e resposta | RF06 | Testes de API |
| Ficha PDF e modo cozinha | RNF03, RNF04 | Download e marca d’água verificados em Chromium |
| Exclusão de conta com senha e confirmação | RF09, RNF-P | SQLite, PostgreSQL isolado e Chromium |
| Manual, API, diagramas, matriz, evidências e apresentação | Sprint 3 | Índice de entrega |

## Retirados do escopo executável da entrega

| Item | Decisão |
|---|---|
| MySQL | A Sprint 2 adotou SQLite. PostgreSQL com Supabase é a opção de nuvem. |
| Aplicativo móvel separado | A revisão entrega a interface web responsiva. Aplicativo permanece candidato a evolução. |
| Cobrança real na demonstração | O ambiente acadêmico demonstra aceite, recusa, cupom, assinatura e pedido sem movimentação financeira. |
| Rastreamento industrial da entrega | O projeto usa distância por CEP aproximado. A proposta curricular de sensores e telemetria segue sem implementação. |

## Futuros

| Prioridade | Item | Condição de aceite |
|---|---|---|
| Alta | Aplicar SQL e validar a revisão em um projeto Supabase de homologação | Testar com Auth real a compra, curadoria, kit, perfil e exclusão em conta descartável. |
| Alta | Storage privado e verificação documental | Administrador autorizado consegue revisar diploma, CNPJ e alvará e registrar a decisão. |
| Alta | Gateway real e cobrança recorrente | Confirmar pagamentos com webhook, idempotência, tratamento de duplicação e expiração da assinatura. |
| Alta | Vídeo e conteúdo pago com acesso controlado por servidor | Servir conteúdo mediante autorização e URLs temporárias. |
| Média | Geocodificação e endereços reais | Medir distância com coordenadas verificadas e usar endereço completo e política de cobertura. |
| Média | Porcionamento e aproveitamento | Quantidade e unidade estruturadas por item; orientações obrigatórias para o kit. |
| Média | Catálogo integral no banco | Migrar descrições, imagens, porções e avaliações de demonstração para dados administráveis. |
| Média | Acessibilidade, automação e operação | Cobrir teclado, leitor de tela, repetição de requisição e observabilidade. |
| Baixa | Aplicativo móvel e recuperação de conta | Definir distribuição móvel e integrar recuperação de senha conforme o provedor. |
