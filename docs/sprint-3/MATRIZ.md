# Matriz de rastreabilidade final

As seis Unidades Curriculares são as dos PDFs das Sprints 1 e 2. A relação abaixo registra a contribuição observável na entrega.

| Unidade Curricular | Requisitos ou decisão | Implementação e aplicação | Evidência e situação |
|---|---|---|---|
| Desenvolvimento Back-end | RF01–RF07, RF09, RN01–RN05 | Rotas Node, integridade de SQLite, transações, RPC PostgreSQL, controle de perfis e autenticação | [API](../API.md), [testes SQLite](evidencias/sqlite.txt), [testes PostgreSQL](evidencias/postgres.txt) |
| Frameworks Front-end | RF01–RF09, RNF01–RNF04 | HTML/CSS e módulos JavaScript sem framework. DOM, formulários, Fetch, navegação, filtros e modo cozinha | [Teste Chromium](evidencias/chromium.txt), [modo cozinha](evidencias/03-modo-cozinha.png), [checkout em 390 px](evidencias/04-retirada-mobile.png). Aplicativo móvel e proteção de vídeo completos são futuros. |
| DevOps | Versionamento, execução e testes | Git, branch de revisão, configuração por ambiente, comandos para reproduzir os testes e publicação estática | [Manual](MANUAL.md), [testes](../TESTES.md) e histórico Git. Jenkins, Opal, Docker e WSL não são dependências desta entrega. |
| Computação em Nuvem | RF05, RF09, RNF-D, RNF-C | Vercel, Supabase Auth, Postgres, PostgREST e funções com RLS, com SQLite como alternativa | [Arquitetura](../diagramas/arquitetura.svg), [evidências históricas](../EVIDENCIAS_SUPABASE.md), [manual](MANUAL.md). A nova revisão ainda requer homologação na nuvem. |
| Automação Industrial | Proposta de telemetria de kits na Sprint 2 | Simulação de logística via CEP. Sem integração de sensores, CLP ou GPS de frota. | [Backlog](../BACKLOG.md), proposta retirada da entrega executável. |
| Ciência de Dados | RF04, RN02, RF08 | Cálculo de distância de Haversine, classificação por raio e agregação descritiva no painel | [GEO](../../js/geo.js), [testes de raio](evidencias/sqlite.txt), [atividade de checkout](../diagramas/atividade-checkout.svg). Dados de CEP sintéticos, sem amostra operacional. |
