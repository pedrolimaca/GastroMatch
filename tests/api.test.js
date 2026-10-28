/* Testes automatizados do fluxo de negócio (Sprint 1 e 2). Execute: node tests/api.test.js */
const fs = require('fs'), assert = require('assert');
const store = {}; const localStorage = { getItem:k => (k in store ? store[k] : null), setItem:(k, v) => { store[k] = String(v); }, removeItem:k => { delete store[k]; } };
/* Modo local (padrão): node tests/api.test.js | Modo servidor/banco: API_URL=http://localhost:3000/api node tests/api.test.js */
const GEO = require('../js/geo.js'), URL_API = process.env.API_URL || null;
const API = new Function('localStorage', 'crypto', 'GEO', 'window', fs.readFileSync(__dirname + '/../js/api.js', 'utf8') + ';return API;')(localStorage, require('crypto').webcrypto, GEO, { GM_API_BASE: URL_API });
console.log('Modo de teste: ' + (URL_API ? 'servidor com banco de dados (' + URL_API + ')' : 'local (localStorage)'));
let ok = 0, bad = 0, CH = '';
async function t(nome, fn){ try{ await fn(); ok++; console.log('PASS  ' + nome); }catch(e){ bad++; console.log('FAIL  ' + nome + ' -> ' + e.message); } }
const err = async (p, status, trecho) => { try{ await p; }catch(e){ assert.strictEqual(e.status, status, 'status ' + e.status + ' (' + e.message + ')'); if(trecho) assert(e.message.includes(trecho), e.message); return; } assert.fail('deveria falhar com ' + status); };
const login = (email, password) => API.post('/auth/login', { email, password });
const RUN = Date.now(); const em = n => n + RUN + '@x.com';
(async () => {
  await API.init();
  await t('RF05 cadastro amador valida nome, e-mail e senha', async () => {
    await err(API.post('/auth/register', { name:'Jo', email:'a@b.com', password:'123456' }), 422, 'nome');
    await err(API.post('/auth/register', { name:'Joana Lima', email:'invalido', password:'123456' }), 422, 'e-mail');
    await err(API.post('/auth/register', { name:'Joana Lima', email:em('joana'), password:'123' }), 422, 'senha');
  });
  await t('RF05 cadastro amador ok e e-mail duplicado bloqueado', async () => {
    await API.post('/auth/register', { name:'Joana Lima', email:em('joana'), password:'123456', kind:'amador' });
    await err(API.post('/auth/register', { name:'Joana Lima', email:em('joana'), password:'123456' }), 409);
  });
  await t('login com senha errada retorna 401', async () => { await err(login(em('joana'), 'errada'), 401, 'incorretos'); });
  await t('RN03 cadastro de criador exige termo sanitário', async () => { await err(API.post('/auth/register', { name:'Chef Novo', email:em('novo'), password:'123456', kind:'criador', doc:'d.pdf', raio:5, termo:false }), 422, 'Vigilância Sanitária'); });
  await t('RN01 cadastro de criador exige documento', async () => { await err(API.post('/auth/register', { name:'Chef Novo', email:em('novo'), password:'123456', kind:'criador', raio:5, termo:true }), 422, 'Diploma'); });
  await t('RF01 criador novo fica PENDENTE e não publica receita (403)', async () => {
    await API.post('/auth/register', { name:'Chef Novo', email:em('novo'), password:'123456', kind:'criador', tipo:'chef', doc:'diploma.pdf', raio:6, termo:true });
    const d = await API.get('/dashboard'); CH = d.creator.chefId; assert.strictEqual(d.creator.status, 'PENDENTE');
    await err(API.post('/recipes', { name:'Risoto', price:20, minutes:30 }), 403, 'aprovado');
  });
  await t('RN01 apenas admin acessa a curadoria (403 para criador)', async () => { await err(API.get('/admin/overview'), 403); });
  let novoId;
  await t('RN01 admin aprova o criador pendente', async () => {
    await login('admin@gastromatch.com', 'admin123');
    const o = await API.get('/admin/overview'); const c = o.creators.find(x => x.user.email === em('novo')); novoId = c.id;
    await API.post('/admin/creators/' + c.id + '/approve'); const o2 = await API.get('/admin/overview');
    assert.strictEqual(o2.creators.find(x => x.id === novoId).status, 'APROVADO');
  });
  let rid;
  await t('RF02 criador aprovado salva rascunho e ele NÃO aparece na vitrine pública', async () => {
    await login(em('novo'), '123456');
    const r = await API.post('/recipes', { name:'Risoto de Abóbora', price:25.9, minutes:40, restricao:'vegano', draft:true, ingredientes:'Arroz\nAbóbora', instrucoes:'Refogue\nSirva' }); rid = r.recipe.id;
    assert.strictEqual(r.recipe.status, 'rascunho');
    assert(!(await API.get('/recipes')).recipes.some(x => x.id === rid));
  });
  await t('RF02 publicar faz a receita aparecer; despublicar volta a esconder', async () => {
    await API.patch('/recipes/' + rid, { status:'publicada' }); assert((await API.get('/recipes')).recipes.some(x => x.id === rid));
    await API.patch('/recipes/' + rid, { status:'rascunho' }); assert(!(await API.get('/recipes')).recipes.some(x => x.id === rid));
    await API.patch('/recipes/' + rid, { status:'publicada' });
  });
  await t('RF02 validação: preço e tempo obrigatórios', async () => { await err(API.post('/recipes', { name:'X', price:0, minutes:10 }), 422); await err(API.post('/recipes', { name:'X', price:10, minutes:0 }), 422); });
  await t('RF03 criador não compra receita (403)', async () => { await err(API.post('/checkout', { type:'receita', refId:rid, chefId:CH, amount:25.9, metodo:'pix' }), 403); });
  await t('RN05 cartão recusado: HTTP 402, transação RECUSADA e acesso NÃO liberado', async () => {
    await login(em('joana'), '123456');
    await err(API.post('/checkout', { type:'receita', refId:rid, chefId:CH, amount:25.9, metodo:'cartao', card:'4242 4242 4242 0000' }), 402, 'Transação não autorizada');
    const me = await API.get('/me'); assert(!me.access.includes(rid)); assert(me.tx.some(x => x.status === 'RECUSADA' && x.http === 402));
  });
  await t('RF03 cupom inválido é rejeitado; cupom GASTRO10 aplica 10%', async () => {
    await err(API.post('/checkout', { type:'receita', refId:rid, chefId:CH, amount:25.9, metodo:'pix', cupom:'FALSO' }), 422, 'Cupom');
    const r = await API.post('/checkout', { type:'receita', refId:rid, chefId:CH, amount:100, metodo:'pix', cupom:'GASTRO10' });
    assert.strictEqual(r.tx.valor, 90); assert((await API.get('/me')).access.includes(rid));
  });
  await t('RF03 assinatura de catálogo libera o chef e registra transação', async () => {
    await API.post('/checkout', { type:'assinatura', refId:'torino', chefId:'torino', amount:29, metodo:'pix' }); assert((await API.get('/me')).subs.includes('torino'));
  });
  await t('RF04/RN02 kit fora do raio é bloqueado (422)', async () => {
    let fora = null; for(let n = 10000000; n < 99999999; n += 7919){ if(API.distanceKm(String(n), CH) > 6){ fora = String(n); break; } }
    assert(fora, 'CEP fora do raio não encontrado');
    await err(API.post('/checkout', { type:'kit', refId:rid, recipeName:'Risoto', chefId:CH, amount:40, metodo:'pix', entrega:'entrega', cep:fora, termo:true }), 422, 'fora do raio');
  });
  await t('RN03 kit sem aceite do termo sanitário é bloqueado', async () => { await err(API.post('/checkout', { type:'kit', refId:rid, chefId:CH, amount:40, metodo:'pix', entrega:'retirada', termo:false }), 422, 'Vigilância Sanitária'); });
  await t('RF04 retirada no estabelecimento dispensa raio e gera pedido', async () => {
    const r = await API.post('/checkout', { type:'kit', refId:rid, recipeName:'Risoto de Abóbora', chefId:CH, amount:40, metodo:'pix', entrega:'retirada', slot:'Retirar no local', termo:true }); assert.strictEqual(r.order.status, 'AGUARDANDO');
  });
  await t('RF06 amador publica post com nota e dúvida; comentário vazio é bloqueado', async () => {
    await err(API.post('/posts', { recipeId:rid, caption:'  ', stars:5 }), 422);
    await API.post('/posts', { recipeId:rid, chefId:CH, caption:'Posso trocar o arroz?', stars:4 });
  });
  await t('Dashboard do chef mostra receita, pedido e venda reais; chef responde dúvida', async () => {
    await login(em('novo'), '123456'); const d = await API.get('/dashboard');
    assert.strictEqual(d.orders.length, 1); assert(d.tx.length >= 2); assert.strictEqual(d.posts.length, 1);
    await API.post('/posts/' + d.posts[0].id + '/reply', { text:'Pode sim!' });
    await API.patch('/orders/' + d.orders[0].id, { status:'CONFIRMADO' });
    const d2 = await API.get('/dashboard'); assert.strictEqual(d2.orders[0].status, 'CONFIRMADO'); assert.strictEqual(d2.posts[0].reply, 'Pode sim!');
  });
  await t('RF04 chef altera raio de entrega (1 a 15 km) com validação', async () => { await err(API.patch('/creator', { raio:30 }), 422); const r = await API.patch('/creator', { raio:12 }); assert.strictEqual(r.creator.raio, 12); });
  await t('Chef não edita receita de outro criador (404)', async () => { await login('chef@gastromatch.com', 'chef123'); await err(API.patch('/recipes/' + rid, { status:'rascunho' }), 404); });
  await t('Perfil: usuário altera o nome (mínimo 3 letras) e o /me reflete', async () => {
    await login(em('joana'), '123456');
    await err(API.patch('/me', { name:'Jo' }), 422, 'nome');
    const r = await API.patch('/me', { name:'Joana Souza Lima' }); assert.strictEqual(r.user.name, 'Joana Souza Lima');
    assert.strictEqual((await API.get('/me')).user.name, 'Joana Souza Lima');
  });
  await t('Perfil: troca de senha exige a senha atual e valida a nova', async () => {
    await err(API.post('/me/password', { current:'errada', password:'novasenha' }), 401, 'atual');
    await err(API.post('/me/password', { current:'123456', password:'123' }), 422, 'ao menos 6');
    await API.post('/me/password', { current:'123456', password:'novasenha' });
    await API.post('/auth/logout'); await err(login(em('joana'), '123456'), 401); await login(em('joana'), 'novasenha');
  });
  await t('Privacidade: excluir conta exige senha e a palavra EXCLUIR e apaga todos os dados da pessoa', async () => {
    const email = em('del'), dados = { name:'Pessoa Teste', email, password:'123456', kind:'amador' };
    await API.post('/auth/register', dados);
    await API.post('/posts', { caption:'Meu prato', stars:4, recipeId:'risoto-funghi', chefId:'torino' });
    await API.post('/checkout', { type:'receita', refId:'risoto-funghi', chefId:'torino', amount:34.9, metodo:'pix' });
    await err(API.post('/me/delete', { password:'errada', confirm:'EXCLUIR' }), 401, 'senha');
    await err(API.post('/me/delete', { password:'123456', confirm:'excluir' }), 422, 'EXCLUIR');
    assert.strictEqual((await API.get('/posts')).posts.filter(p => p.name === 'Pessoa Teste').length, 1);
    await API.post('/me/delete', { password:'123456', confirm:'EXCLUIR' });
    assert.strictEqual((await API.get('/me')).user, null);
    await err(login(email, '123456'), 401, 'incorretos');
    assert.strictEqual((await API.get('/posts')).posts.filter(p => p.name === 'Pessoa Teste').length, 0);
    await API.post('/auth/register', dados);                     // o e-mail fica livre e a conta nova nasce vazia
    const me = await API.get('/me'); assert.strictEqual(me.access.length, 0); assert.strictEqual(me.tx.length, 0); assert.strictEqual(me.orders.length, 0);
  });
  await t('Privacidade: criador que exclui a conta leva receitas, assinaturas e respostas; administrador não exclui a própria', async () => {
    const ec = em('delchef'), eb = em('delbuyer');
    await API.post('/auth/register', { name:'Chef Saindo', email:ec, password:'123456', kind:'criador', tipo:'chef', doc:'d.pdf', raio:5, termo:true });
    const ch = (await API.get('/dashboard')).creator.chefId;
    await login('admin@gastromatch.com', 'admin123');
    await API.post('/admin/creators/' + (await API.get('/admin/overview')).creators.find(x => x.user.email === ec).id + '/approve');
    await err(API.post('/me/delete', { password:'admin123', confirm:'EXCLUIR' }), 403, 'administrador');
    await login(ec, '123456');
    const rec = (await API.post('/recipes', { name:'Receita Saindo', price:20, minutes:30 })).recipe;
    await API.post('/auth/register', { name:'Comprador Fiel', email:eb, password:'123456', kind:'amador' });
    await API.post('/checkout', { type:'assinatura', refId:ch, chefId:ch, amount:29, metodo:'pix' });
    const post = (await API.post('/posts', { caption:'Dúvida sobre a receita', stars:5, recipeId:rec.id, chefId:ch })).post;
    await login(ec, '123456'); await API.post('/posts/' + post.id + '/reply', { text:'Respondido pelo chef' });
    await API.post('/me/delete', { password:'123456', confirm:'EXCLUIR' });
    await err(login(ec, '123456'), 401);
    assert(!(await API.get('/recipes')).recipes.some(r => r.chefId === ch), 'receitas do criador ainda existem');
    await login(eb, '123456');
    assert(!(await API.get('/me')).subs.includes(ch), 'assinatura ao criador excluído ainda existe');
    assert.strictEqual((await API.get('/posts')).posts.find(p => p.id === post.id).reply, '', 'resposta do criador excluído ainda existe');
  });
  await t('Sem login: rotas protegidas retornam 401', async () => { await API.post('/auth/logout'); await err(API.post('/me/delete', { password:'x', confirm:'EXCLUIR' }), 401); await err(API.get('/dashboard'), 401); await err(API.post('/posts', { caption:'x', stars:5 }), 401); await err(API.patch('/me', { name:'Fulano de Tal' }), 401); });
  console.log('\n' + ok + ' testes passaram, ' + bad + ' falharam.'); process.exit(bad ? 1 : 0);
})();
