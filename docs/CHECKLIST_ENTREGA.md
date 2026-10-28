# Checklist de entrega

- [x] **Código-fonte atualizado e versionado.** Código no repositório do GitHub (branch `main`) e publicado na Vercel.
- [x] **Fluxo principal funcional de ponta a ponta.** Cadastro do chef, aprovação, publicação, compra com 402 e aprovada, kit com raio, comunidade e dashboard. Diagrama: `docs/diagramas/fluxo.png`. Evidência: `docs/evidencias-testes-*.txt`.
- [x] **Banco de dados criado e integrado.** Supabase (PostgreSQL) em uso na versão publicada, com `server/supabase.sql`, e servidor Node com SQLite (`server/schema.sql`) como alternativa; diagrama `docs/diagramas/der.png`. Os 27 testes passam nos modos local e servidor. Ressalva: o catálogo base de demonstração ainda fica no código do site.
- [x] **Interface responsiva integrada ao back-end.** 20 telas auditadas em 360, 768 e 1280 px contra o servidor, sem rolagem lateral e sem erros de console.
- [x] **Validações e tratamento básico de erros.** Validação de cadastro, senha, e-mail duplicado, termo sanitário, documento, preço e tempo, cupom, CEP e raio. Erros com mensagem e status HTTP (401, 402, 403, 404, 409, 422).
- [ ] **Testes iniciais com evidências.** Testes automatizados prontos e salvos em `docs/`. Prints do banco no Supabase em `docs/evidencias/` (cadastro, compra e painel do administrador). Faltam os demais fluxos do roteiro manual (tabela em `docs/TESTES.md`).
- [x] **Documentação de API.** `docs/API.md`.
- [x] **ERS, diagramas e backlog atualizados.** `docs/ERS.md`, `docs/diagramas/` (DER, fluxo, arquitetura e casos de uso) e `docs/BACKLOG.md`. Conferir com o documento oficial da equipe se existem requisitos além de RF01 a RF06, RN01 a RN03 e RN05, RNF02 a RNF04.
- [x] **Registro de dificuldades, decisões e mudanças de escopo.** `docs/DECISOES.md`. A equipe deve acrescentar as suas próprias dificuldades da semana.
