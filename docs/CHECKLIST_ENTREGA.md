# Checklist de entrega

- [ ] **Código-fonte atualizado e versionado.** Código pronto no pacote. Falta o commit e o push no repositório (ação da equipe): `git add -A`, `git commit`, `git push`.
- [x] **Fluxo principal funcional de ponta a ponta.** Cadastro do chef, aprovação, publicação, compra com 402 e aprovada, kit com raio, comunidade e dashboard. Diagrama: `docs/diagramas/fluxo.png`. Evidência: `docs/evidencias-testes-*.txt`.
- [x] **Banco de dados criado e integrado.** `server/schema.sql` com 9 tabelas, servidor em `server/index.js`, diagrama `docs/diagramas/der.png`. Os 23 testes passam contra o banco. Ressalva: o catálogo base de demonstração ainda fica no código do site.
- [x] **Interface responsiva integrada ao back-end.** 20 telas auditadas em 360, 768 e 1280 px contra o servidor, sem rolagem lateral e sem erros de console.
- [x] **Validações e tratamento básico de erros.** Validação de cadastro, senha, e-mail duplicado, termo sanitário, documento, preço e tempo, cupom, CEP e raio. Erros com mensagem e status HTTP (401, 402, 403, 404, 409, 422).
- [ ] **Testes iniciais com evidências.** Testes automatizados prontos e salvos em `docs/`. Faltam os prints das telas, que precisam ser tirados no site real (roteiro em `docs/TESTES.md`).
- [x] **Documentação de API.** `docs/API.md`.
- [x] **ERS, diagramas e backlog atualizados.** `docs/ERS.md`, `docs/diagramas/` (DER, fluxo, arquitetura e casos de uso) e `docs/BACKLOG.md`. Conferir com o documento oficial da equipe se existem requisitos além de RF01 a RF06, RN01 a RN03 e RN05, RNF02 a RNF04.
- [x] **Registro de dificuldades, decisões e mudanças de escopo.** `docs/DECISOES.md`. A equipe deve acrescentar as suas próprias dificuldades da semana.
