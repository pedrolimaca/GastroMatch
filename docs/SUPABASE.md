# GastroMatch no Supabase

A integração usa Supabase Auth para a sessão e funções `gm_*` para persistir dados no PostgreSQL. O [manual de implantação](sprint-3/MANUAL.md) descreve a aplicação transacional do SQL, a ordem de atualização e a homologação. O [contrato da API](API.md#supabase) lista as funções e como os erros chegam à interface.

O catálogo comercial, os descontos e as verificações de curadoria e entrega são resolvidos pela função de checkout. O número de cartão fictício fica no navegador para o fluxo Supabase. A chave pública identifica o projeto. O token de Auth identifica o usuário. As tabelas usam RLS e as funções restantes verificam a autorização de cada operação.

Para conferir o modo de dados, execute `API.mode()` no console. Os valores são `supabase`, `servidor` e `local`. Uma instância Node acessível na mesma origem ou configurada via `GM_API_BASE` tem prioridade. Sem conexão com nenhum backend, a interface usa armazenamento local de demonstração.

As [evidências históricas](EVIDENCIAS_SUPABASE.md) correspondem à versão anterior. Consulte o [relatório da Sprint 3](TESTES.md) para as verificações da revisão e o roteiro pendente com Auth real.
