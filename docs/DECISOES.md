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

## Limitações conhecidas

- O valor da compra é enviado pelo front e o servidor o aceita; em produção deve ser calculado no servidor a partir do banco.
- O catálogo base ainda fica no código do site.
- O CEP vira coordenadas por uma regra aproximada para a região de Joinville.

## Espaço para a equipe

Acrescentar aqui as dificuldades e decisões do grupo ao longo da semana (por exemplo, divisão de tarefas, conflitos de merge e combinados com o professor).
