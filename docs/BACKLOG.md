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

## Sprint 3: Supabase, catálogo, perfil e privacidade

| Item | Requisito | Status | Evidência |
|---|---|---|---|
| Banco na nuvem (PostgreSQL no Supabase) com login pelo Supabase Auth | RNF-D | Concluído | `docs/EVIDENCIAS_SUPABASE.md` |
| Regras de negócio no banco (funções `gm_*`) e tabelas protegidas por RLS | RNF-D | Concluído | cadastro, compra e painel verificados com dados reais |
| Plano B: o site usa o modo local se o Supabase não responder | RNF-C | Concluído | teste de navegador sem rede |
| Catálogo de receitas com busca, categorias, filtros e ordenação | RF08 | Concluído | verificação em navegador |
| Tela de perfil para os três tipos de conta | RF07 | Concluído | testes do perfil (`tests/api.test.js`) |
| Excluir conta e todos os dados, dentro do perfil (pedido do professor) | RF09, RNF-P | Parcial | testes automatizados nos modos local e servidor; falta o teste manual no Supabase |
| Páginas de ajuda, contato, termos e privacidade | - | Concluído | navegação verificada |
| Correções do modo escuro e de espaçamento | RNF-R | Concluído | capturas de tela antes e depois |
| Roteiro manual no Supabase: publicar receita, pedido de kit, cartão recusado, comunidade, troca de senha e exclusão de conta | RF02, RF04, RN05, RF06, RF07, RF09 | Pendente | falta executar e registrar (ver `docs/TESTES.md`) |

## Pendências e próximos passos

| Item | Prioridade |
|---|---|
| Calcular o valor da compra no servidor (hoje vem do front; o catálogo base ainda está no código do site) | Alta |
| Executar e registrar o roteiro manual no Supabase | Alta |
| Gateway de pagamento real | Alta |
| Upload real de documentos e fotos (no Supabase, usar o Storage em vez de enviar as imagens como texto) | Média |
| Geocodificação real do CEP | Média |
| Vídeo protegido de verdade | Média |
| Mover o catálogo base (10 receitas, 8 restaurantes) para o banco | Média |
| Recuperação de senha e confirmação por e-mail | Baixa |
