# Especificação de requisitos — GastroMatch, Sprint 3

**Equipe** — Kauan Alejandro da Rosa, Pedro de Lima Cavalcanti e Renan Ramos Capeleti
**Curso** — Análise e Desenvolvimento de Sistemas, SENAI Taubaté
**Orientação** — Prof. Wesley Fioreze
**Referências de requisitos** — GastroMatch Sprint 1 e GastroMatch ERS Sprint 2, fornecidos pela equipe.

## Propósito e escopo

O GastroMatch é uma aplicação web responsiva que permite descobrir receitas, acessar instruções e videoaulas, solicitar kits e interagir com criadores. O MVP usa pagamentos e logística demonstrativos. O catálogo inicial combina receitas de demonstração com receitas publicadas pelos criadores. SQLite é a referência para execução local e avaliação. PostgreSQL com Supabase Auth é o caminho de publicação com dados compartilhados.

| Ator | Responsabilidade |
|---|---|
| Visitante | Consultar catálogo, perfis públicos e comunidade, criar conta e autenticar-se |
| Cozinheiro amador | Simular compra ou assinatura, acessar conteúdo, pedir kit e interagir na comunidade |
| Chef ou restaurante | Solicitar aprovação, manter receitas e kits, acompanhar pedidos e responder dúvidas |
| Administrador | Decidir a curadoria e consultar indicadores de usuários, receitas e transações |

## Requisitos funcionais

| ID | Requisito | Critério de aceite e situação no MVP |
|---|---|---|
| RF01 | Cadastro e validação do criador | Nome, e-mail, senha, tipo, referência do comprovante, termo sanitário e raio de 1 a 15 km. Nasce pendente e só publica após decisão do administrador. Parcial em relação à Sprint 1, pois apenas o nome do documento é armazenado. |
| RF02 | Marketplace de receitas e videoaulas | O criador aprovado publica, edita, despublica ou salva rascunhos. A vitrine exibe receitas publicadas de criadores aprovados. Aceita link HTTPS, oferece prévia e reproduz YouTube, Vimeo ou arquivo compatível. Implementado no escopo MVP. |
| RF03 | Compra avulsa e assinatura | O checkout valida o item, consulta o preço, aplica cupom e registra a transação. Aprovação avulsa libera a receita e assinatura libera o catálogo do criador. Parcial em relação à Sprint 1, pois cobrança e recorrência reais estão pendentes. |
| RF04 | Venda e logística de kits | Receita precisa ter kit precificado. Com termo aceito, entrega exige CEP dentro do raio demonstrativo. Retirada dispensa o CEP. O criador acompanha o pedido. Parcial em relação à Sprint 1, pois a geocodificação é simulada e não há estoque real. |
| RF05 | Cadastro e acesso do amador | Cadastro valida nome (mínimo 3 caracteres), e-mail e senha (mínimo 6). Login inválido é recusado. Cadastro válido inicia sessão quando a confirmação por e-mail está desligada. Implementado. |
| RF06 | Comunidade | Entrar, publicar texto com foto opcional e nota de 1 a 5, ou dúvida sem nota. Criador aprovado responde em seu próprio catálogo. Implementado no escopo MVP. |
| RF07 | Perfil da conta | Exibir atividade de acordo com o perfil, atualizar nome e trocar senha mediante a senha atual no fluxo da interface. Implementado. |
| RF08 | Catálogo e filtros | Buscar por nome, chef ou ingrediente, sem distinção de acentos ou caixa. Permitir combinar categoria, restrição, tempo e preço, ordenar e limpar filtros. Links diretos preservam a página ao recarregar. Implementado. |
| RF09 | Exclusão da conta | Exigir senha atual e confirmação literal EXCLUIR. Remover a conta, compras e publicações próprias e limpar vínculos de acesso, assinaturas e respostas de criadores excluídos. Administrador é tratado fora desse fluxo. Verificado em SQLite e PostgreSQL com Auth simulado. |

RF07–RF09 foram incorporados no repositório após a especificação inicial. O registro financeiro de terceiros e seus pedidos históricos podem conservar a referência de uma receita removida.

## Regras de negócio

| ID | Regra | Aplicação |
|---|---|---|
| RN01 | Curadoria profissional | Só criadores aprovados publicam e vendem. A validação efetiva do diploma, CNPJ e alvará fica com a curadoria, que no protótipo recebe apenas a referência do arquivo. |
| RN02 | Raio de entrega | Bloqueio de entrega fora do raio configurado (1 a 15 km). Retirada é oferecida como alternativa. |
| RN03 | Conformidade sanitária | Termo obrigatório no cadastro do criador e na simulação do pedido do kit. |
| RN04 | Porcionamento e aproveitamento | Receitas-base exibem quantidades por item. Receitas de criadores aceitam quantidades em texto. Falta exigir porção estruturada e instruções de aproveitamento. |
| RN05 | Pagamento recusado | A transação é registrada como RECUSADA, sem acesso ou pedido. A API Node retorna 402, e o adaptador Supabase converte o indicador de recusa em 402 para a interface. |

## Requisitos não funcionais

| ID | Requisito | Situação |
|---|---|---|
| RNF01 | Web e aplicativo móvel | Web responsiva. Aplicativo móvel separado permanece futuro. |
| RNF02 | Proteção de vídeo pago | A API autoriza o link das aulas de criadores para administrador, autor, comprador ou assinante. Provedores externos definem as regras de incorporação e compartilhamento. Hospedagem privada e proteção contra cópia ficam para evolução. |
| RNF03 | Marca d’água em PDF | Ficha de receita liberada usa o e-mail da conta autenticada. A geração depende do jsPDF carregado por CDN. |
| RNF04 | Modo cozinha | Checklist de ingredientes, marcação de passos e tamanho de texto ajustável. |
| RNF-R | Responsividade | Catálogo e checkout exercitados no Chromium. Checkout conferido a 390 px na revisão. |
| RNF-S | Conta e sessão | Node usa scrypt e token HMAC. Na nuvem, Supabase Auth e RLS com operações mediadas por RPC. O modo local foi concebido para demonstração individual. |
| RNF-D | Persistência compartilhada | SQLite no servidor e PostgreSQL na publicação configurada. O armazenamento local fica isolado no navegador. |
| RNF-C | Continuidade | O site pode iniciar em modo local quando o servidor e o Supabase estão indisponíveis. |
| RNF-P | Privacidade | Exclusão de conta conforme RF09. Confirmação de senha aplicada no SQLite e na função SQL do PostgreSQL. |

## Validação

A [matriz final](sprint-3/MATRIZ.md) liga requisitos, implementação, testes e Unidades Curriculares. A [modelagem](diagramas/README.md) contém casos de uso, classes do domínio, modelos de dados, arquitetura, quatro sequências e duas atividades. O [relatório](TESTES.md) identifica os ambientes e a cobertura real. As decisões de escopo estão no [backlog](BACKLOG.md) e nas [limitações](sprint-3/LIMITACOES.md).
