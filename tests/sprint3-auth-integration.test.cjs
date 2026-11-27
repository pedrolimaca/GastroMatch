/* Integração com GoTrue e PostgREST em loopback. Use apenas um banco descartável. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const GEO = require('../js/geo.js');
const auth = new URL(process.env.GM_QA_AUTH || 'http://127.0.0.1:3930');
const rest = new URL(process.env.GM_QA_REST || 'http://127.0.0.1:3931');
for(const url of [auth,rest]) assert.ok(['localhost','127.0.0.1'].includes(url.hostname), 'Use a pilha de homologação local.');
const adminEmail = process.env.GM_QA_ADMIN_EMAIL;
const adminPassword = process.env.GM_QA_ADMIN_PASSWORD;
assert.ok(adminEmail && adminPassword, 'Configure um admin do banco descartável.');
const originalFetch = global.fetch.bind(global);
const window = { GM_SUPABASE:{url:'https://gm-homologacao.invalid', key:'qa-public'} };
const qaFetch = (input, opts) => {
  const url = new URL(input);
  assert.equal(url.hostname,'gm-homologacao.invalid');
  const match = /^(\/auth\/v1|\/rest\/v1)(\/.*)$/.exec(url.pathname);
  assert.ok(match, url.pathname);
  return originalFetch(new URL(match[2] + url.search, match[1] === '/auth/v1' ? auth : rest), opts);
};

const source = fs.readFileSync(path.resolve(__dirname, '../js/supabase.js'), 'utf8');
const makeClient = new Function('window', 'localStorage', 'fetch', source + '\nreturn SB;');
function client(){
  const data = new Map();
  const storage = {
    getItem:k => data.get(k) ?? null,
    setItem:(k,v) => data.set(k,v),
    removeItem:k => data.delete(k)
  };
  return makeClient(window, storage, qaFetch);
}
const password = 'QA-demo-D8ufXp64';
const updatedPassword = 'QA-demo-8pNmXz21';
const stamp = Date.now();
const chefEmail = 'chef-gm-'+stamp+'@example.org';
const buyerEmail = 'buyer-gm-'+stamp+'@example.org';

(async () => {
  const sb = client();
  assert.equal(await sb.init(),true);
  const login = (email,pass = password) => sb.request('POST','/auth/login',{email,password:pass});
  const create = body => sb.request('POST','/auth/register',{password,...body});
  await create({name:'Criador Homologação',email:chefEmail,kind:'criador',tipo:'chef',doc:'referencia-teste.pdf',raio:5,termo:true});
  await assert.rejects(sb.request('POST','/recipes',{name:'Receita',price:20,minutes:15}),{status:403});
  await login(adminEmail,adminPassword);
  const pending = (await sb.request('GET','/admin/overview')).creators.find(entry => entry.user.email === chefEmail);
  assert.equal(pending.status,'PENDENTE');
  await sb.request('POST','/admin/creators/'+pending.id+'/approve');
  await login(chefEmail);
  const video = 'https://youtu.be/abcdefghijk';
  const {recipe} = await sb.request('POST','/recipes',{name:'Aula de homologação',price:35,kitPrice:50,minutes:19,video,ingredientes:'Arroz',instrucoes:'Toste o arroz',draft:true});
  assert.equal((await sb.request('GET','/recipes/'+recipe.id+'/video')).video,video);
  assert.ok(!(await sb.request('GET','/recipes')).recipes.some(r=>r.id===recipe.id));
  await sb.request('PATCH','/recipes/'+recipe.id,{status:'publicada'});
  console.log('PASS  GoTrue cadastra e autentica. Curadoria aprova e o criador publica a videoaula.');

  await create({name:'Cozinheiro Homologação',email:buyerEmail,kind:'amador'});
  await assert.rejects(sb.request('GET','/recipes/'+recipe.id+'/video'),{status:403});
  const publicRecipe = (await sb.request('GET','/recipes')).recipes.find(r=>r.id===recipe.id);
  assert.equal(publicRecipe.hasVideo,true);
  assert.equal('video' in publicRecipe,false);
  const buy = {type:'receita',refId:recipe.id};
  await assert.rejects(sb.request('POST','/checkout',{...buy,metodo:'cartao',card:'4242424242420000'}),{status:402});
  assert.ok(!(await sb.request('GET','/me')).access.includes(recipe.id));
  const {tx} = await sb.request('POST','/checkout',{...buy,metodo:'pix',cupom:'GASTRO10'});
  assert.equal(tx.valor,31.50);
  assert.equal((await sb.request('GET','/recipes/'+recipe.id+'/video')).video,video);
  const secondDevice = client();
  await secondDevice.init();
  const relogged = await secondDevice.request('POST','/auth/login',{email:buyerEmail,password});
  assert.equal(relogged.user.kind,'amador');
  assert.ok((await secondDevice.request('GET','/me')).access.includes(recipe.id));
  console.log('PASS  Recusa, PIX com cupom, acesso ao vídeo e login independente com acesso persistido.');

  let outside;
  for(let cep=10000000;cep<99999999;cep+=7919){
    if(GEO.distanceKm(String(cep),recipe.chefId)>5){ outside=String(cep); break; }
  }
  assert.ok(outside);
  const kit = {type:'kit',refId:recipe.id,metodo:'pix',termo:true};
  await assert.rejects(sb.request('POST','/checkout',{...kit,entrega:'entrega',cep:outside}),{status:422});
  const {order} = await sb.request('POST','/checkout',{...kit,entrega:'retirada',slot:'Retirar no local'});
  assert.equal(order.status,'AGUARDANDO');
  const {post} = await sb.request('POST','/posts',{recipeId:recipe.id,chefId:recipe.chefId,caption:'Posso trocar o arroz?',stars:5});
  await login(chefEmail);
  const dashboard = await sb.request('GET','/dashboard');
  assert.ok(dashboard.orders.some(o=>o.id===order.id));
  await sb.request('PATCH','/orders/'+order.id,{status:'CONFIRMADO'});
  await sb.request('POST','/posts/'+post.id+'/reply',{text:'Pode trocar.'});
  assert.equal((await sb.request('GET','/posts')).posts.find(p=>p.id===post.id).reply,'Pode trocar.');
  console.log('PASS  Kit fora do raio, retirada, status do pedido, post e resposta do criador.');

  await login(buyerEmail);
  await sb.request('PATCH','/me',{name:'Cozinheiro Revisado'});
  assert.equal((await sb.request('GET','/me')).user.name,'Cozinheiro Revisado');
  await sb.request('POST','/me/password',{current:password,password:updatedPassword});
  await sb.request('POST','/auth/logout');
  await assert.rejects(login(buyerEmail),{status:401});
  await login(buyerEmail,updatedPassword);
  await assert.rejects(sb.request('POST','/me/delete',{confirm:'EXCLUIR',password}),{status:401});
  await sb.request('POST','/me/delete',{confirm:'EXCLUIR',password:updatedPassword});
  await assert.rejects(login(buyerEmail,updatedPassword),{status:401});
  assert.ok(!(await sb.request('GET','/posts')).posts.some(p=>p.id===post.id));
  console.log('PASS  Edição de perfil, troca de senha no GoTrue e exclusão de conta com limpeza.');
})().catch(e=>{ console.error(e); process.exitCode=1; });
