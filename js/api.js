/* =====================================================================
   api.js - camada de dados do GastroMatch.
   Simula o back-end REST (rotas, status HTTP, validações de negócio) e
   guarda tudo no localStorage. Para ligar o back-end real, defina API_BASE:
   todas as telas já consomem os dados por API.get/post/patch/del.
   Modos: 'supabase' (banco Postgres no Supabase, js/supabase.js), 'servidor' (banco SQLite via
   server/index.js, detectado sozinho em /api ou definido em js/config.js) e 'local'
   (localStorage, usado no Vercel estático quando não há banco configurado).
   ===================================================================== */

const API = (() => {
  const KEY = 'gm-db-v1', TOKEN = 'gm-token';
  const CUPONS = { GASTRO10: 0.10, CHEF20: 0.20 };
  const ASSINATURA = 29;
  let db, mem = null, base = (typeof window !== 'undefined' && window.GM_API_BASE) || null, sbMode = false;

  /* ---------- util ---------- */
  const fail = (status, message) => { const e = new Error(message); e.status = status; throw e; };
  const today = () => new Date().toLocaleDateString('pt-BR');
  const nextId = key => (db.seq[key] = (db.seq[key] || 0) + 1);
  async function hash(s){
    try{ const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('gm:' + s)); return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2,'0')).join(''); }
    catch(e){ return 'x' + btoa(unescape(encodeURIComponent(s))); }
  }
  function save(){ const s = JSON.stringify(db); try{ localStorage.setItem(KEY, s); }catch(e){ mem = s; } }
  const distanceKm = (cep, chefId) => GEO.distanceKm(cep, chefId);

  /* ---------- dados iniciais ---------- */
  async function seed(){
    return {
      seq: { user: 0, creator: 0, recipe: 0, tx: 0, order: 0, post: 0 },
      users: [
        { id:1, name:'Administração GastroMatch', email:'admin@gastromatch.com', pass: await hash('admin123'), kind:'admin' },
        { id:2, name:'Osteria Torino', email:'chef@gastromatch.com', pass: await hash('chef123'), kind:'criador' },
        { id:3, name:'Marina Souza', email:'marina@email.com', pass: await hash('123456'), kind:'amador' },
        { id:4, name:'Chef Beatriz Lima', email:'beatriz@email.com', pass: await hash('123456'), kind:'criador' }
      ],
      creators: [
        { id:1, userId:2, chefId:'torino', tipo:'restaurante', doc:'cnpj_osteria.pdf', raio:5, termo:true, status:'APROVADO' },
        { id:2, userId:4, chefId:'u4', tipo:'chef', doc:'diploma_beatriz.pdf', raio:8, termo:true, status:'PENDENTE' },
        ...Object.keys(GEO.BASE_RADIUS).filter(k => k !== 'torino').map((k, i) => ({ id:3 + i, userId:null, chefId:k, nome:GEO.BASE_NAMES[k], tipo:'restaurante', doc:'cnpj_' + k + '.pdf', raio:GEO.BASE_RADIUS[k], termo:true, status:'APROVADO' }))
      ],
      recipes: [], access: [], subs: [], tx: [], orders: [],
      posts: [{ id:1, userId:3, name:'Marina Souza', recipeId:'tagliatelle-ragu', chefId:'torino', caption:'Ficou idêntico ao do restaurante. Posso trocar o parmesão por pecorino?', stars:5, img:null, reply:'Pode sim, Marina! Pecorino combina muito bem.', date: today() }]
    };
  }
  async function detect(){
    if(base || typeof fetch === 'undefined' || typeof location === 'undefined' || !/^https?:/.test(location.protocol)) return;
    try{ const c = new AbortController(); setTimeout(() => c.abort(), 1500); const r = await fetch('/api/health', { signal:c.signal }); if(r.ok && (await r.json()).ok) base = '/api'; }catch(e){}
  }
  async function init(){
    /* Supabase: se estiver configurado e o banco responder, usa ele; senão cai para servidor/local */
    if(typeof SB !== 'undefined' && SB.enabled()){ sbMode = await SB.init(); if(sbMode) return; }
    await detect(); if(base) return;
    try{ db = JSON.parse(localStorage.getItem(KEY)); }catch(e){}
    if(!db && mem) db = JSON.parse(mem);
    if(!db || !db.users){ db = await seed(); save(); }
  }

  /* ---------- sessão ---------- */
  const token = () => { try{ return localStorage.getItem(TOKEN); }catch(e){ return null; } };
  const setToken = v => { try{ v ? localStorage.setItem(TOKEN, v) : localStorage.removeItem(TOKEN); }catch(e){} };
  const userFrom = () => { const t = token(); return t ? db.users.find(u => String(u.id) === t) : null; };
  const needUser = () => userFrom() || fail(401, 'Entre na sua conta para continuar.');
  const creatorOf = u => db.creators.find(c => c.userId === u.id);
  const needApproved = () => {
    const u = needUser(), c = creatorOf(u);
    if(!c) fail(403, 'Esta conta não é de criador.');
    if(c.status !== 'APROVADO') fail(403, 'Seu perfil ainda não foi aprovado pela curadoria.');
    return c;
  };
  const publicUser = u => ({ id:u.id, name:u.name, email:u.email, kind:u.kind });

  /* ---------- rotas ---------- */
  const routes = [];
  const route = (method, path, fn) => routes.push({ method, re: new RegExp('^' + path.replace(/:\w+/g, '([^/]+)') + '$'), fn });

  route('POST', '/auth/register', async b => {
    const name = (b.name || '').trim(), email = (b.email || '').trim().toLowerCase();
    if(name.length < 3) fail(422, 'Informe o nome completo (mínimo 3 letras).');
    if(!/^\S+@\S+\.\S+$/.test(email)) fail(422, 'Informe um e-mail válido.');
    if((b.password || '').length < 6) fail(422, 'A senha deve ter ao menos 6 caracteres.');
    if(db.users.some(u => u.email === email)) fail(409, 'Este e-mail já está cadastrado. Entre na sua conta.');
    const criador = b.kind === 'criador';
    if(criador){
      if(!b.termo) fail(422, 'É obrigatório aceitar as normas da Vigilância Sanitária para prosseguir.');
      if(!b.doc) fail(422, 'Envie um Diploma válido ou Alvará/CNPJ para a curadoria profissional.');
      const r = Number(b.raio); if(!(r >= 1 && r <= 15)) fail(422, 'O raio de entrega deve ficar entre 1 e 15 km.');
    }
    const user = { id: nextId('user') + 4, name, email, pass: await hash(b.password), kind: criador ? 'criador' : 'amador' };
    db.users.push(user);
    if(criador) db.creators.push({ id: nextId('creator') + 9, userId:user.id, chefId:'u' + user.id, tipo:b.tipo || 'chef', doc:b.doc, raio:Number(b.raio), termo:true, status:'PENDENTE' });
    save(); setToken(user.id);
    return { user: publicUser(user) };
  });
  route('POST', '/auth/login', async b => {
    const u = db.users.find(x => x.email === (b.email || '').trim().toLowerCase());
    if(!u || u.pass !== await hash(b.password || '')) fail(401, 'E-mail ou senha incorretos.');
    setToken(u.id); return { user: publicUser(u) };
  });
  route('POST', '/auth/logout', async () => { setToken(null); return {}; });

  route('GET', '/me', async () => {
    const u = userFrom(); if(!u) return { user:null };
    return { user: publicUser(u), creator: creatorOf(u) || null,
      access: db.access.filter(a => a.userId === u.id).map(a => a.recipeId),
      subs: db.subs.filter(s => s.userId === u.id).map(s => s.chefId),
      orders: db.orders.filter(o => o.userId === u.id), tx: db.tx.filter(t => t.userId === u.id) };
  });

  /* perfil: o próprio usuário altera nome e senha */
  route('PATCH', '/me', async b => {
    const u = needUser(), name = (b.name || '').trim();
    if(name.length < 3) fail(422, 'Informe o nome completo (mínimo 3 letras).');
    u.name = name;
    db.posts.forEach(p => { if(p.userId === u.id) p.name = name; });
    db.orders.forEach(o => { if(o.userId === u.id) o.buyer = name; });
    save(); return { user: publicUser(u) };
  });
  route('POST', '/me/password', async b => {
    const u = needUser();
    if(u.pass !== await hash(b.current || '')) fail(401, 'A senha atual está incorreta.');
    if((b.password || '').length < 6) fail(422, 'A nova senha deve ter ao menos 6 caracteres.');
    u.pass = await hash(b.password); save(); return {};
  });

  /* privacidade: o usuário exclui a própria conta e todos os dados dela */
  route('POST', '/me/delete', async b => {
    const u = needUser();
    if(u.kind === 'admin') fail(403, 'A conta de administrador não pode ser excluída pelo site.');
    if(u.pass !== await hash(b.password || '')) fail(401, 'A senha está incorreta.');
    if(String(b.confirm || '').trim() !== 'EXCLUIR') fail(422, 'Digite EXCLUIR para confirmar a exclusão.');
    const c = creatorOf(u);
    if(c){
      const ids = db.recipes.filter(r => r.chefId === c.chefId).map(r => r.id);
      db.access = db.access.filter(a => !ids.includes(a.recipeId));
      db.subs = db.subs.filter(s => s.chefId !== c.chefId);
      db.posts.forEach(p => { if(p.replyBy === c.chefId){ p.reply = ''; p.replyBy = null; } });
      db.recipes = db.recipes.filter(r => r.chefId !== c.chefId);
      db.creators = db.creators.filter(x => x.id !== c.id);
    }
    db.access = db.access.filter(a => a.userId !== u.id);
    db.subs = db.subs.filter(s => s.userId !== u.id);
    db.orders = db.orders.filter(o => o.userId !== u.id);
    db.posts = db.posts.filter(p => p.userId !== u.id);
    db.tx = db.tx.filter(t => t.userId !== u.id);
    db.users = db.users.filter(x => x.id !== u.id);
    save(); setToken(null); return {};
  });

  route('GET', '/recipes', async () => ({ recipes: db.recipes.filter(r => r.status === 'publicada'), creators: db.creators.filter(c => c.status === 'APROVADO').map(c => ({ chefId:c.chefId, raio:c.raio, name:(db.users.find(u => u.id === c.userId) || { name:c.nome }).name })) }));
  const recipeBody = b => {
    if(!(b.name || '').trim()) fail(422, 'Informe o título da receita.');
    if(!(Number(b.price) > 0)) fail(422, 'Informe um preço de acesso maior que zero.');
    if(!(Number(b.minutes) > 0)) fail(422, 'Informe o tempo de preparo em minutos.');
    const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
    return { name:b.name.trim(), categoria:['alta','massas','carnes','brasileiras','vegetarianas','sobremesas'].includes(b.categoria) ? b.categoria : 'alta', desc:(b.desc || '').trim(), restricao:b.restricao || 'sem restrição', minutes:Number(b.minutes), time:b.minutes + ' min',
      img:b.img || '', price:Number(b.price), kitPrice:Number(b.kitPrice) || 0, video:(b.video || '').trim(),
      ingredientes: lines(b.ingredientes), instrucoes: lines(b.instrucoes) };
  };
  route('POST', '/recipes', async b => {
    const c = needApproved(), d = recipeBody(b);
    const r = { id:'r' + nextId('recipe'), chefId:c.chefId, status: b.draft ? 'rascunho' : 'publicada', createdAt: today(), ...d };
    db.recipes.push(r); save(); return { recipe: r };
  });
  route('PATCH', '/recipes/:id', async (b, p) => {
    const c = needApproved(), r = db.recipes.find(x => x.id === p[0] && x.chefId === c.chefId) || fail(404, 'Receita não encontrada.');
    if(b.status && !b.name) r.status = b.status; else Object.assign(r, recipeBody(b), b.status ? { status:b.status } : {});
    save(); return { recipe: r };
  });
  route('DELETE', '/recipes/:id', async (b, p) => {
    const c = needApproved(); const n = db.recipes.length;
    db.recipes = db.recipes.filter(x => !(x.id === p[0] && x.chefId === c.chefId));
    if(db.recipes.length === n) fail(404, 'Receita não encontrada.'); save(); return {};
  });

  /* checkout: receita (pay-per-view), assinatura e kit. RN05: pagamento recusado = HTTP 402 */
  route('POST', '/checkout', async b => {
    const u = needUser();
    if(u.kind !== 'amador') fail(403, 'Contas de criador e administrador não realizam compras.');
    const price = Number(b.amount) || 0; if(!(price > 0)) fail(422, 'Valor inválido.');
    let valor = price;
    if(b.cupom){ const d = CUPONS[String(b.cupom).trim().toUpperCase()]; if(d === undefined) fail(422, 'Cupom inválido.'); valor = +(price * (1 - d)).toFixed(2); }
    if(b.type === 'kit'){
      if(!b.termo) fail(422, 'É obrigatório aceitar as normas da Vigilância Sanitária para prosseguir.');
      if(b.entrega !== 'retirada'){
        const raio = (db.creators.find(c => c.chefId === b.chefId) || {}).raio || 5, d = distanceKm(String(b.cep || ''), b.chefId);
        if(d === null) fail(422, 'Informe um CEP válido.');
        if(d > raio) fail(422, 'Endereço fora do raio de entrega. Escolha retirar no estabelecimento.');
      }
    }
    const metodo = b.metodo === 'pix' ? 'pix' : 'cartao';
    const recusado = metodo === 'cartao' && (!/^\d{13,19}$/.test((b.card || '').replace(/\s/g, '')) || /0000$/.test((b.card || '').replace(/\s/g, '')));
    const tx = { id: nextId('tx'), userId:u.id, type:b.type, refId:b.refId, chefId:b.chefId, valor, metodo, cupom: b.cupom || '', status: recusado ? 'RECUSADA' : 'APROVADA', http: recusado ? 402 : 200, date: today() };
    db.tx.push(tx);
    if(recusado){ save(); fail(402, 'Transação não autorizada. Tente outro cartão ou PIX.'); }
    if(b.type === 'receita' && !db.access.some(a => a.userId === u.id && a.recipeId === b.refId)) db.access.push({ userId:u.id, recipeId:b.refId, txId:tx.id });
    if(b.type === 'assinatura' && !db.subs.some(s => s.userId === u.id && s.chefId === b.chefId)) db.subs.push({ userId:u.id, chefId:b.chefId, txId:tx.id });
    let order = null;
    if(b.type === 'kit'){ order = { id: nextId('order'), userId:u.id, buyer:u.name, recipeId:b.refId, recipeName:b.recipeName, chefId:b.chefId, valor, entrega:b.entrega, slot:b.slot, cep:b.cep || '', status:'AGUARDANDO', date: today() }; db.orders.push(order); }
    save(); return { tx, order };
  });

  /* comunidade (RF06) */
  route('GET', '/posts', async () => ({ posts: db.posts }));
  route('POST', '/posts', async b => {
    const u = needUser();
    if(!(b.caption || '').trim()) fail(422, 'Escreva um comentário antes de publicar.');
    const stars = Number(b.stars); if(stars < 0 || stars > 5) fail(422, 'Nota inválida.');
    const p = { id: nextId('post') + 1, userId:u.id, name:u.name, recipeId:b.recipeId, chefId:b.chefId || '', caption:b.caption.trim(), stars, img:b.img || null, reply:'', date: today() };
    db.posts.unshift(p); save(); return { post: p };
  });
  route('POST', '/posts/:id/reply', async (b, p) => {
    const c = needApproved(), post = db.posts.find(x => String(x.id) === p[0]) || fail(404, 'Post não encontrado.');
    if(post.chefId !== c.chefId) fail(403, 'Você só responde dúvidas das suas receitas.');
    if(!(b.text || '').trim()) fail(422, 'Escreva a resposta.');
    post.reply = b.text.trim(); post.replyBy = c.chefId; save(); return { post };
  });

  /* painel do criador */
  route('GET', '/dashboard', async () => {
    const u = needUser(), c = creatorOf(u); if(!c) fail(403, 'Esta conta não é de criador.');
    const ok = c.status === 'APROVADO';
    const tx = db.tx.filter(t => t.chefId === c.chefId && t.status === 'APROVADA');
    return { creator: c, recipes: ok ? db.recipes.filter(r => r.chefId === c.chefId) : [],
      orders: ok ? db.orders.filter(o => o.chefId === c.chefId) : [], tx: ok ? tx : [],
      posts: ok ? db.posts.filter(p => p.chefId === c.chefId) : [], subs: db.subs.filter(s => s.chefId === c.chefId).length };
  });
  route('PATCH', '/creator', async b => {
    const c = needApproved(), r = Number(b.raio);
    if(!(r >= 1 && r <= 15)) fail(422, 'O raio de entrega deve ficar entre 1 e 15 km.');
    c.raio = r; save(); return { creator: c };
  });
  route('PATCH', '/orders/:id', async (b, p) => {
    const c = needApproved(), o = db.orders.find(x => String(x.id) === p[0] && x.chefId === c.chefId) || fail(404, 'Pedido não encontrado.');
    if(!['AGUARDANDO', 'CONFIRMADO', 'ENTREGUE'].includes(b.status)) fail(422, 'Status inválido.');
    o.status = b.status; save(); return { order: o };
  });

  /* administração: curadoria de criadores (RN01) */
  route('GET', '/admin/overview', async () => {
    const u = needUser(); if(u.kind !== 'admin') fail(403, 'Acesso restrito ao administrador.');
    return { creators: db.creators.filter(c => c.userId).map(c => ({ ...c, user: publicUser(db.users.find(x => x.id === c.userId)) })),
      users: db.users.map(publicUser), tx: db.tx, recipes: db.recipes };
  });
  route('POST', '/admin/creators/:id/:acao', async (b, p) => {
    const u = needUser(); if(u.kind !== 'admin') fail(403, 'Acesso restrito ao administrador.');
    const c = db.creators.find(x => String(x.id) === p[0]) || fail(404, 'Criador não encontrado.');
    c.status = p[1] === 'approve' ? 'APROVADO' : 'REJEITADO'; save(); return { creator: c };
  });

  /* ---------- cliente ---------- */
  async function request(method, path, body){
    if(sbMode) return SB.request(method, path, body);
    if(base){
      const tk = token(), r = await fetch(base + path, { method, headers: { 'Content-Type':'application/json', ...(tk ? { Authorization:'Bearer ' + tk } : {}) }, body: body ? JSON.stringify(body) : undefined });
      const j = await r.json().catch(() => ({}));
      if(!r.ok){ const e = new Error(j.message || 'Erro na requisição.'); e.status = r.status; throw e; }
      if(j.token) setToken(j.token); if(path === '/auth/logout') setToken(null);
      return j;
    }
    await new Promise(r => setTimeout(r, 120)); // latência simulada
    const hit = routes.find(x => x.method === method && x.re.test(path));
    if(!hit) fail(404, 'Rota não encontrada.');
    return hit.fn(body || {}, hit.re.exec(path).slice(1));
  }
  return { init, distanceKm, mode: () => sbMode ? 'supabase' : base ? 'servidor' : 'local', ASSINATURA, CUPONS,
    get:(p) => request('GET', p), post:(p, b) => request('POST', p, b), patch:(p, b) => request('PATCH', p, b), del:(p) => request('DELETE', p) };
})();
