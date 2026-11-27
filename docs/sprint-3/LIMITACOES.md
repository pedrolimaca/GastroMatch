# Limitações e propostas de evolução

| Limitação observada | Proposta de evolução |
|---|---|
| Pagamento usa PIX ou cartão fictício. Assinatura de demonstração não renova nem expira automaticamente. | Integrar gateway, recorrência, idempotência, conciliação e webhooks. |
| CEP e distância representam uma aproximação determinística. Sem roteamento, cadastro de endereço real ou rastreamento de frota. | Usar provedores de CEP e geocodificação, validar endereços e medir cobertura com amostras reais. |
| Curadoria recebe nome do comprovante. Não valida sua autenticidade digital. Fotos são armazenadas como texto. | Armazenar comprovantes em bucket privado com auditoria e regras de acesso. Armazenar imagens separadamente. |
| Kits da base têm quantidade em texto e receitas novas aceitam texto livre. Sem controle de estoque ou de aproveitamento. | Modelar porção, unidade e instruções de aproveitamento e exigir preenchimento para publicar um kit. |
| Vitrine aplica a liberação do conteúdo na interface. O catálogo devolve ingredientes, instruções e links. As receitas-base contêm conteúdo estático. | Separar metadados públicos do conteúdo privado. Autorizar acesso no servidor e emitir links de vídeo temporários. |
| Aplicação web responsiva com recursos externos (algumas imagens, fontes e jsPDF). | Completar a distribuição local dos ativos essenciais para conexão instável e avaliar PWA ou aplicativo móvel. |
| Dados do modo local ficam no navegador e não são transferidos para a nuvem. | Exibir status explícito e oferecer migração controlada ou seleção de ambiente. |
| Ambiente público existente e dados históricos de demonstração dependem do projeto Supabase e dos administradores. | Homologar a migração em um projeto isolado e conferir que contas públicas de demonstração não têm privilégios na implantação compartilhada. |
| Eventos de negócio são gravados e recursos de acesso têm unicidade. Falta uma chave de idempotência no checkout. | Introduzir chave por tentativa e testes de repetição e concorrência antes de uma cobrança real. |
