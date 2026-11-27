# Manual de instalação, execução e implantação

## Executar para a Mostra ou avaliação

1. Obtenha a branch `sprint-3/revisao-mvp` do [repositório](https://github.com/pedrolimaca/GastroMatch) e instale Node.js 22.5+ (testado com Node 24).
2. Com o terminal na raiz do repositório, execute `npm start`. O Node inicializa `server/gastromatch.db` com SQLite e serve a aplicação e a API na porta 3000. A aplicação não tem dependências npm em tempo de execução.
3. Abra <http://localhost:3000/>. `GET /api/health` devolve `{"ok":true,"db":"sqlite"}`. A tela de login local oferece contas de teste de cozinheiro, chef aprovado, chef pendente e administração.
4. Na plataforma, entre com a cozinheira, abra uma receita e tente o cartão fictício final `0000`. Escolha PIX, aplique `GASTRO10` e pague para liberar o modo cozinha.
5. Em uma receita com kit, escolha retirada ou teste o raio por CEP, aceite o termo e confirme. Confira o pedido no painel do chef. O painel administrativo permite aprovar criadores pendentes.

A execução Node na mesma origem tem prioridade sobre a configuração da nuvem. Para começar com um banco temporário, no Linux ou macOS use `DB_FILE=/tmp/gastromatch-mostra.sqlite PORT=3000 npm start`. No PowerShell, use `$env:DB_FILE = "$env:TEMP/gastromatch-mostra.sqlite"; $env:PORT = "3000"; npm start`. Para usar dados existentes, faça cópia do banco com o servidor parado ou use uma cópia consistente do SQLite.

## Publicar e homologar com Vercel e Supabase

1. Crie um projeto Supabase de homologação com dados de teste. Configure Auth por e-mail e senha. Se habilitar confirmação por e-mail, conclua o cadastro pelo link recebido.
2. Faça backup e aplique o conteúdo completo de `server/supabase.sql` no SQL Editor. O script é transacional e pode ser reaplicado. Ele atualiza checkout, catálogo e a função de exclusão, cuja assinatura exige a versão correspondente do front-end. Planeje a atualização do banco e do front na mesma janela.
3. Em `js/config.js`, configure a URL e chave pública do projeto de homologação em `window.GM_SUPABASE`. Mantenha `window.GM_API_BASE = null` para a implantação estática. As chaves secret e service role ficam no ambiente administrativo.
4. Crie contas de teste com senhas próprias. Para criar um administrador, promova a conta controlada pela equipe pelo painel SQL (`public.usuario.perfil = 'admin'` para o e-mail selecionado). Use `server/supabase-contas-demo.sql` apenas em projeto descartável.
5. Importe a branch no Vercel como site estático, preset **Other**, raiz do repositório e sem etapa de build. Confirme no console que `API.mode()` retorna `supabase`. Execute [o roteiro de homologação](../TESTES.md).
6. Aplique o mesmo procedimento ao projeto publicado após aprovação da homologação. O script é uma migração de aplicação. Deve ser executado pelo responsável pelo banco.

## Modos de dados

| Modo | Configuração | Persistência |
|---|---|---|
| Servidor | `npm start`, ou `window.GM_API_BASE` explícito | SQLite no servidor |
| Supabase | Site estático, `GM_SUPABASE` válido e banco disponível | Auth e PostgreSQL compartilhados |
| Local | Sem servidor e sem Supabase disponível | `localStorage` da origem do navegador |

O modo Node é uma demonstração local. As contas iniciais públicas e a configuração de autenticação de desenvolvimento devem ser substituídas antes da exposição de uma instância SQLite à internet. `JWT_SECRET`, `PORT` e `DB_FILE` são variáveis do servidor. Sem `JWT_SECRET`, um segredo é gerado a cada início do servidor e as sessões anteriores pedem novo login. Configure um segredo forte e armazenamento persistente para qualquer implantação controlada desse modo.
