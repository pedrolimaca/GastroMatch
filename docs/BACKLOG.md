# Backlog

Legenda: **Concluído** = implementado e testado | **Parcial** = funciona com limitação | **Pendente** = fora desta entrega.

## Sprint 1

| Item | Requisito | Status | Evidência |
|---|---|---|---|
| Cadastro e login do amador com validações | RF05 | Concluído | testes de cadastro e login |
| Cadastro de chef e restaurante com documento | RF01 | Concluído | teste do documento obrigatório |
| Termo sanitário obrigatório | RN03 | Concluído | teste do termo |
| Curadoria pelo administrador | RN01 | Concluído | teste de aprovação e 403 |
| Publicar receita e rascunho oculto | RF02 | Concluído | teste de rascunho na vitrine |
| Filtros por restrição e tempo | RF02 | Concluído | auditoria de interface |

## Sprint 2

| Item | Requisito | Status | Evidência |
|---|---|---|---|
| Checkout com cartão, PIX e cupom | RF03 | Concluído | testes de cupom e pagamento |
| Pagamento recusado (402) | RN05 | Concluído | teste do 402 |
| Assinatura de catálogo | RF03 | Concluído | teste de assinatura |
| Kit com validação de CEP e raio | RF04, RN02 | Concluído | testes de raio e retirada |
| Comunidade com nota, foto e dúvidas | RF06 | Concluído | testes de posts e resposta |
| Ficha técnica com marca d'água | RNF03 | Concluído | tela de receita liberada |
| Modo cozinha | RNF04 | Concluído | tela de receita liberada |
| Conteúdo restrito | RNF02 | Parcial | vídeo é de demonstração |

## Itens adicionados na integração

| Item | Status |
|---|---|
| Banco de dados SQLite e servidor com API | Concluído |
| Dashboard do chef (visão geral, receitas, pedidos, comunidade, entrega) | Concluído |
| Painel do administrador | Concluído |
| Categorias e busca por proximidade (CEP e localização) | Concluído |
| Abas Receita, Vídeo e Avaliações | Concluído |
| Testes automatizados e auditoria de responsividade | Concluído |

## Pendências e próximos passos

| Item | Prioridade |
|---|---|
| Calcular o valor da compra no servidor (hoje vem do front) | Alta |
| Gateway de pagamento real | Alta |
| Hospedar o servidor com disco persistente ou migrar para PostgreSQL | Alta |
| Upload real de documentos e fotos | Média |
| Geocodificação real do CEP | Média |
| Vídeo protegido de verdade | Média |
| Mover o catálogo base (10 receitas, 8 restaurantes) para o banco | Média |
| Recuperação de senha e confirmação por e-mail | Baixa |
