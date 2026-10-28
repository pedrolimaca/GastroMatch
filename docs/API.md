# Documentação da API

Base: `/api` (mesmo endereço do site quando se usa `npm start`, ou o valor de `GM_API_BASE` em `js/config.js`).
Formato: JSON. Autenticação: cabeçalho `Authorization: Bearer <token>`, recebido no login ou no cadastro (validade de 7 dias).
Erros: resposta `{ "message": "texto para o usuário" }` com o status HTTP correspondente.

| Status | Significado |
|---|---|
| 200 | Sucesso |
| 400 | JSON inválido |
| 401 | Sem login ou credenciais incorretas |
| 402 | Pagamento recusado ("Transação não autorizada") |
| 403 | Sem permissão (perfil errado ou criador não aprovado) |
| 404 | Recurso inexistente ou de outro criador |
| 409 | E-mail já cadastrado |
| 413 | Requisição maior que 8 MB |
| 422 | Dado inválido (validação de negócio) |

## Autenticação

| Método e rota | Acesso | Corpo | Resposta e erros |
|---|---|---|---|
| `POST /auth/register` | Público | `name`, `email`, `password` (mín. 6), `kind` (`amador` ou `criador`). Para criador: `tipo`, `doc`, `raio` (1 a 15), `termo` (obrigatório `true`) | `{ token, user }`. 422 (nome, e-mail, senha, termo sanitário, documento, raio), 409 |
| `POST /auth/login` | Público | `email`, `password` | `{ token, user }`. 401 |
| `POST /auth/logout` | Qualquer | vazio | `{}` |
| `GET /me` | Qualquer | | `{ user, creator, access[], subs[], orders[], tx[] }`. `user` é `null` sem login |
| `PATCH /me` | Logado | `{ name }` | Atualiza o nome. 422 se tiver menos de 3 letras. Devolve `{ user }` |
| `POST /me/password` | Logado | `{ current, password }` | Troca a senha. 401 se a atual estiver errada, 422 se a nova tiver menos de 6 caracteres |
| `POST /me/delete` | Logado | `{ password, confirm }` | Exclui a própria conta e todos os dados dela. `confirm` deve ser `EXCLUIR`. 401 se a senha estiver errada, 422 se a confirmação não for `EXCLUIR`, 403 para administrador. Devolve `{}` |

## Receitas e catálogo

| Método e rota | Acesso | Corpo | Resposta e erros |
|---|---|---|---|
| `GET /recipes` | Público | | `{ recipes[], creators[] }` somente receitas publicadas de criadores aprovados |
| `POST /recipes` | Criador aprovado | `name`, `price` > 0, `minutes` > 0, `restricao`, `categoria`, `desc`, `ingredientes` e `instrucoes` (um por linha), `video`, `img`, `kitPrice`, `draft` | `{ recipe }`. 403 se pendente ou rejeitado, 422 |
| `PATCH /recipes/:id` | Dono da receita | mesmos campos, ou só `status` (`publicada` ou `rascunho`) | `{ recipe }`. 404 se for de outro criador |
| `DELETE /recipes/:id` | Dono da receita | | `{}`. 404 |

Categorias aceitas: `alta`, `massas`, `carnes`, `brasileiras`, `vegetarianas`, `sobremesas`.

## Compras (RF03, RF04, RN02, RN03, RN05)

`POST /checkout`, acesso: cozinheiro amador.

| Campo | Descrição |
|---|---|
| `type` | `receita`, `assinatura` ou `kit` |
| `refId`, `chefId`, `amount` | Item comprado, restaurante e valor de tabela |
| `metodo` | `cartao` ou `pix` |
| `card` | Número do cartão (13 a 19 dígitos). Final `0000` simula recusa |
| `cupom` | `GASTRO10` (10%) ou `CHEF20` (20%) |
| Só para kit | `termo` (obrigatório), `entrega` (`entrega` ou `retirada`), `cep`, `slot`, `recipeName` |

Resposta 200: `{ tx, order }` (`order` só no kit). Erros: 402 pagamento recusado (a transação fica registrada como RECUSADA e nada é liberado), 422 (cupom inválido, termo sanitário, CEP inválido, endereço fora do raio), 403 (conta de criador ou admin).

Exemplo de recusa:

```
curl -X POST http://localhost:3000/api/checkout -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type":"receita","refId":"r1","chefId":"torino","amount":39.9,"metodo":"cartao","card":"4242424242420000"}'
# 402 {"message":"Transação não autorizada. Tente outro cartão ou PIX."}
```

## Comunidade (RF06)

| Método e rota | Acesso | Corpo | Resposta e erros |
|---|---|---|---|
| `GET /posts` | Público | | `{ posts[] }` |
| `POST /posts` | Logado | `recipeId`, `chefId`, `caption`, `stars` (0 a 5, 0 = só dúvida), `img` | `{ post }`. 401, 422 |
| `POST /posts/:id/reply` | Criador aprovado dono do chef | `text` | `{ post }`. 403 se o post for de outro restaurante |

## Painel do criador

| Método e rota | Acesso | Corpo | Resposta e erros |
|---|---|---|---|
| `GET /dashboard` | Criador | | `{ creator, recipes[], orders[], tx[], posts[], subs }`. Listas vazias se não aprovado |
| `PATCH /creator` | Criador aprovado | `raio` (1 a 15) | `{ creator }`. 422 |
| `PATCH /orders/:id` | Criador aprovado dono do pedido | `status` (`AGUARDANDO`, `CONFIRMADO`, `ENTREGUE`) | `{ order }`. 404, 422 |

## Administração (RN01)

| Método e rota | Acesso | Resposta e erros |
|---|---|---|
| `GET /admin/overview` | Admin | `{ creators[], users[], tx[], recipes[] }`. 403 para outros perfis |
| `POST /admin/creators/:id/approve` | Admin | `{ creator }` com status `APROVADO` |
| `POST /admin/creators/:id/reject` | Admin | `{ creator }` com status `REJEITADO` |

## Utilitário

`GET /health` devolve `{ "ok": true, "db": "sqlite" }`. O front usa essa rota para detectar o servidor.

## Contas de teste

| Perfil | E-mail | Senha |
|---|---|---|
| Admin | admin@gastromatch.com | admin123 |
| Chef aprovado | chef@gastromatch.com | chef123 |
| Chef pendente | beatriz@email.com | 123456 |
| Cozinheira | marina@email.com | 123456 |
