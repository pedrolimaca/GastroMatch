# Revisão da Sprint 1 e 2: requisitos x implementação

Revisão feita sobre o código do repositório (`index.html`, `css/style.css`, `js/*.js`).
Legenda: **OK** = implementado e testado | **Simulado** = funciona na interface com dados no navegador (precisa de back-end real para produção).

## Requisitos funcionais

| Código | Requisito | Situação | Onde |
|---|---|---|---|
| RF01 | Cadastro de Chef/Restaurante com documento e termo sanitário, status inicial PENDENTE | OK | `renderRegisterCriador`, `doRegisterCriador`, `POST /auth/register` |
| RF02 | Filtros por restrição alimentar e tempo de preparo; publicar receita; rascunho oculto da vitrine | OK | `filterBarHtml`, `setFilter`, `publishRecipe`, `POST /recipes` |
| RF03 | Compra avulsa (Pay-Per-View) e assinatura, com cupom, PIX/cartão e registro de transação | OK (pagamento simulado) | `openPayment`, `confirmPayment`, `POST /checkout` |
| RF04 | Kit de ingredientes com validação de CEP por raio; alternativa de retirada ou só a aula | OK (CEP aproximado) | `checkCep`, `startKitPayment`, regra no `/checkout` |
| RF05 | Cadastro e login do cozinheiro amador, com validações | OK | `doRegisterAmador`, `doLogin`, `/auth/*` |
| RF06 | Comunidade: foto, nota de 1 a 5 e dúvidas respondidas pelo restaurante | OK | `submitPost`, `replyPost`, `/posts` |

## Regras de negócio

| Código | Regra | Situação |
|---|---|---|
| RN01 | Só criadores APROVADOS publicam receitas e kits; curadoria feita pelo admin | OK. Painel admin (`renderAdmin`) aprova ou rejeita; o back (`needApproved`) bloqueia com 403 |
| RN02 | Entrega do kit apenas dentro do raio do restaurante (1 a 15 km) | OK. O chef ajusta o raio no painel; o `/checkout` recusa endereço fora do raio |
| RN03 | Termo sanitário obrigatório (cadastro do criador e pedido de kit) | OK. Mensagem: "É obrigatório aceitar as normas da Vigilância Sanitária para prosseguir" |
| RN05 | Pagamento recusado retorna 402 "Transação não autorizada" e não libera acesso | OK. Cartão terminado em 0000 simula a recusa |

## Requisitos não funcionais

| Código | Requisito | Situação |
|---|---|---|
| RNF02 | Conteúdo restrito: receita e vídeo só após compra, assinatura ou ser o dono | OK (`isRecipeUnlocked`) |
| RNF03 | Ficha técnica em PDF com marca d'água do e-mail do usuário | OK (`downloadFichaPdf`) |
| RNF04 | Modo cozinha: fonte ajustável, checklist de ingredientes e passos clicáveis | OK (adicionado nesta revisão) |
| Responsividade | Desktop e mobile | OK. Tabelas com rolagem lateral, abas roláveis, modais em tela cheia no celular |

## Segunda revisão: banco de dados, categorias e proximidade

- **Banco de dados real**: `server/` (Node + SQLite) com as tabelas do DER: `usuario`, `criador_conteudo`, `receita`, `kit_ingrediente`, `transacao_financeira`, `acesso_receita`, `assinatura`, `pedido_kit` e `post_comunidade`. Senhas com scrypt, sessão por token assinado, restrições `CHECK` e chaves estrangeiras.
- **Mesmas regras nos dois modos**: as 23 verificações de `tests/api.test.js` passam no modo local e contra o servidor (evidências em `docs/evidencias-testes-*.txt`).
- **Categorias**: seis categorias clicáveis filtram a vitrine, e o chef escolhe a categoria ao cadastrar a receita.
- **Proximidade**: busca por CEP ou localização do aparelho, com restaurantes ordenados por distância e aviso se entregam o kit. A mesma regra de distância vale no checkout e no servidor.
- **Tela da refeição**: abas Receita, Vídeo e Avaliações funcionais, com notas e respostas do restaurante.
- **Responsividade**: auditoria automática de 20 telas em 360, 768 e 1280 px, sem rolagem lateral e sem erros de console. Corrigidos o topo no celular e o layout do checkout.

## O que mudou na primeira revisão

1. **Camada de API** (`js/api.js`): todas as telas passam a consumir dados por `API.get/post/patch/del`. Hoje usa `localStorage`; para ligar o back-end real basta preencher `API_BASE`.
2. **Login real**: antes qualquer senha entrava. Agora há conta, senha com hash, sessão persistente e validações.
3. **Dashboard do chef com dados reais**: receita, vendas, assinantes, pedidos de kit (com troca de status), respostas à comunidade, raio de entrega e CRUD de receitas com foto.
4. **Painel do administrador** para curadoria, usuários e transações.
5. **Pagamento**: antes a compra liberava direto. Agora há modal com cartão/PIX, cupom (`GASTRO10`, `CHEF20`), erro 402 e registro da transação.
6. **Rascunhos** deixaram de aparecer na vitrine pública.
7. **Persistência**: nada se perde ao recarregar a página.
8. Proteção contra HTML injetado em nomes, comentários e receitas.

## Pendências para a produção

- Gateway de pagamento real (hoje a aprovação e a recusa são simuladas).
- Hospedar o servidor com disco persistente, ou migrar o esquema para PostgreSQL, e definir um `JWT_SECRET` próprio.
- Catálogo base (10 receitas e 8 restaurantes de demonstração) ainda mora no front; as receitas dos chefs já vêm do banco.
- Upload de documentos e fotos para armazenamento externo (hoje só o nome do documento é guardado e as fotos ficam no navegador).
- Geocodificação real do CEP (hoje o CEP vira coordenadas por uma regra aproximada para Joinville; a localização do aparelho já usa a posição real).
- Player de vídeo protegido de verdade (hoje é um vídeo de demonstração).

## Contas de teste

| Perfil | E-mail | Senha |
|---|---|---|
| Cozinheira | marina@email.com | 123456 |
| Chef aprovado | chef@gastromatch.com | chef123 |
| Chef pendente | beatriz@email.com | 123456 |
| Administrador | admin@gastromatch.com | admin123 |
