# Registro de dificuldades, decisões e mudanças de escopo

## Decisões técnicas

| Decisão | Motivo |
|---|---|
| Sem framework: HTML, CSS e JavaScript em módulos | A lista de tarefas previa Vue.js, mas foi pedido tirá-lo; o código já existente era em JavaScript puro |
| Node + SQLite (`node:sqlite`), sem dependências | Banco relacional real, simples de rodar com `npm start` e fácil de avaliar |
| Camada `api.js` com dois modos (servidor e local) | O mesmo front funciona no Vercel estático e com banco; as mesmas regras são testadas nos dois |
| Geolocalização compartilhada (`geo.js`) | Front e servidor usam a mesma regra de distância, evitando divergência no raio de entrega |
| Testes de regra de negócio em um único arquivo para os dois modos | Prova que o servidor e o modo local têm o mesmo comportamento |
| Visual claro e sem emojis | Pedido da equipe para o design |
| Supabase em vez de hospedar o servidor Node | O SQLite não persiste na Vercel e hospedar um servidor exigiria mais um serviço. O Supabase entrega banco, login e API no mesmo lugar, e o site continua só na Vercel |
| O site fala direto com o Supabase, com as regras em funções SQL (`gm_*`) | Sem servidor próprio, as regras (curadoria, raio de entrega, cupom, permissões) precisam morar no banco; assim o navegador não consegue pulá-las |
| Tabelas com RLS ligado e sem políticas | Bloqueia qualquer acesso direto do navegador às tabelas; só as funções liberadas funcionam |
| Camada `api.js` com três modos (Supabase, servidor e local) | As telas não mudaram com a troca de banco, e o modo local virou plano B |
| O número do cartão fica no navegador e o banco recebe só `card_ok` | O pagamento é simulado, mas o número do cartão não deve trafegar nem ser registrado |
| O administrador só é criado por SQL | Impede que alguém se promova a administrador pelo próprio site |
| Exclusão de conta pede a senha e a palavra EXCLUIR | Evita exclusão por engano ou por quem usar um computador deixado aberto; é um pedido do professor (privacidade) |
| Administrador não pode excluir a própria conta pelo site | A plataforma não pode ficar sem administrador; a remoção, se necessária, é feita no banco |
| Ao excluir um criador, as compras de outras pessoas continuam no histórico delas | Esses registros pertencem a quem comprou; o que sai é tudo que é do criador (cadastro, receitas, kits, assinaturas ao catálogo dele e respostas) |

## Mudanças de escopo

| Mudança | Tipo |
|---|---|
| Vue.js removido | Retirado a pedido |
| Painel do administrador | Incluído (necessário para a curadoria da RN01) |
| Categorias, proximidade e avaliações na refeição | Incluído (pedido na integração) |
| Modo cozinha (RNF04) | Incluído (não existia no código recebido) |
| Pagamento real, upload de arquivos e geocodificação real | Adiados; simulados nesta entrega |

## Dificuldades encontradas e como foram resolvidas

| Dificuldade | Solução |
|---|---|
| O login aceitava qualquer senha e nada era guardado | Contas reais com senha em hash, sessão e validações |
| Rascunhos apareciam na vitrine pública | Separação entre receitas publicadas e rascunhos |
| Chef pendente conseguia publicar | Bloqueio por status na API (403) e no painel |
| Rota `/me` do servidor não enxergava o usuário logado | Corrigido o argumento do contexto e reexecutados os testes |
| Layout do checkout estourava a largura em celular de 360 px | Grid com `minmax(0, 1fr)` |
| Botões de aprovar e rejeitar desalinhados na tabela do admin | Ajuste de estilo da coluna de ações |
| SQLite não persiste em hospedagem estática como o Vercel | Modo local para o Vercel e documentação para hospedar o servidor com disco persistente |
| Imagens de fontes externas não carregam em alguns ambientes | Fotos locais substitutas apenas nas capturas de tela; o site usa as originais |
| No modo escuro, o botão "Criar conta" ficava branco com texto claro e não dava para ler | O texto usava uma variável de cor que muda com o tema; passou a usar uma cor fixa |
| Metadados do card de receita (nota, tempo, dificuldade) saíam grudados | A classe `.feat-meta` não tinha estilo; foi criada com espaçamento |
| No modo claro, as descrições do "Mise en place" ficavam quase invisíveis | Cores claras fixas foram trocadas pelas variáveis do tema |
| No Supabase, um erro dentro da função de compra desfaria o registro da transação recusada | A função devolve `refused` sem lançar erro, e o site mostra o erro 402 |
| O Git no Windows listava dezenas de arquivos como alterados | Eram só diferenças de quebra de linha (CRLF); conferido com `git diff --ignore-cr-at-eol` |
| No SQLite, excluir um usuário falhava por chaves estrangeiras sem cascata | A exclusão apaga os dados filhos na ordem certa, dentro de uma transação |

## Limitações conhecidas

- O valor da compra é enviado pelo front e o servidor o aceita; em produção deve ser calculado no servidor a partir do banco.
- O catálogo base ainda fica no código do site.
- No plano gratuito, o Supabase pausa o projeto depois de dias sem uso; enquanto estiver pausado, o site cai para o modo local.
- Fotos de posts e receitas são enviadas como texto; para muitos usuários, o ideal é usar o Supabase Storage.
- Os dados do modo local não migram para o Supabase.
- O SQL do Supabase não tem teste automatizado: só roda no Supabase. O adaptador do site é testado com um Supabase simulado.
- A exclusão de conta no Supabase depende de a função do banco poder apagar o usuário do Auth (`delete from auth.users`); isso só foi comprovado nos modos local e servidor.
- O CEP vira coordenadas por uma regra aproximada para a região de Joinville.

## Espaço para a equipe

Acrescentar aqui as dificuldades e decisões do grupo ao longo da semana (por exemplo, divisão de tarefas, conflitos de merge e combinados com o professor).
