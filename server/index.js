/* =====================================================================
   GastroMatch - servidor com banco de dados (Node 22+, sem dependências externas).
   Banco: SQLite (arquivo) via node:sqlite. Esquema em server/schema.sql.
   Uso:  npm start   ->  http://localhost:3000  (front + API em /api)
   Variáveis: PORT, DB_FILE, JWT_SECRET
   O contrato das rotas é o mesmo de js/api.js (modo local do front).
   ===================================================================== */
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');
const GEO = require('../js/geo.js');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 3000;
const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'gastromatch.db');
const SECRET = process.env.JWT_SECRET || 'troque-este-segredo-em-producao';
const CUPONS = { GASTRO10: 0.10, CHEF20: 0.20 };
const CATEGORIAS = ['alta', 'massas', 'carnes', 'brasileiras', 'vegetarianas', 'sobremesas'];

const db = new DatabaseSync(DB_FILE);
db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
const all = (sql, ...a) => db.prepare(sql).all(...a);
const one = (sql, ...a) => db.prepare(sql).get(...a);
const run = (sql, ...a) => db.prepare(sql).run(...a);
const tx = fn => { db.exec('BEGIN'); try{ const r = fn(); db.exec('COMMIT'); return r; }catch(e){ db.exec('ROLLBACK'); throw e; } };

/* ---------- segurança: senha (scrypt) e token assinado (HMAC) ---------- */
const hashPass = (p, salt = crypto.randomBytes(16).toString('hex')) => salt + ':' + crypto.scryptSync(p, salt, 32).toString('hex');
const checkPass = (p, stored) => { const [salt, h] = stored.split(':'); const x = hashPass(p, salt).split(':')[1]; return crypto.timingSafeEqual(Buffer.from(x), Buffer.from(h)); };
const b64 = s => Buffer.from(s).toString('base64url');
const sign = id => { const body = b64(JSON.stringify({ id, exp: Date.now() + 7 * 864e5 })); return body + '.' + crypto.createHmac('sha256', SECRET).update(body).digest('base64url'); };
function verify(token){
  if(!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.'); const ok = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if(sig.length !== ok.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(ok))) return null;
  try{ const p = JSON.parse(Buffer.from(body, 'base64url')); return p.exp > Date.now() ? p.id : null; }catch(e){ return null; }
}

/* ---------- dados iniciais ---------- */
function seed(){
  if(one('SELECT COUNT(*) n FROM usuario').n) return;
  const u = (n, e, p, k) => Number(run('INSERT INTO usuario (nome,email,senha_hash,perfil) VALUES (?,?,?,?)', n, e, hashPass(p), k).lastInsertRowid);
  u('Administração GastroMatch', 'admin@gastromatch.com', 'admin123', 'admin');
  const torino = u('Osteria Torino', 'chef@gastromatch.com', 'chef123', 'criador');
  const marina = u('Marina Souza', 'marina@email.com', '123456', 'amador');
  const beatriz = u('Chef Beatriz Lima', 'beatriz@email.com', '123456', 'criador');
  const cr = (uid, chef, nome, tipo, doc, raio, st) => run('INSERT INTO criador_conteudo (id_usuario,chef_id,nome_publico,tipo_perfil,documento_path,status_validacao,termo_sanitario_aceito,raio_entrega_km) VALUES (?,?,?,?,?,?,1,?)', uid, chef, nome, tipo, doc, st, raio);
  cr(torino, 'torino', 'Osteria Torino', 'restaurante', 'cnpj_osteria.pdf', 5, 'APROVADO');
  cr(beatriz, 'u' + beatriz, 'Chef Beatriz Lima', 'chef', 'diploma_beatriz.pdf', 8, 'PENDENTE');
  for(const k of Object.keys(GEO.BASE_RADIUS)) if(k !== 'torino') cr(null, k, GEO.BASE_NAMES[k], 'restaurante', 'cnpj_' + k + '.pdf', GEO.BASE_RADIUS[k], 'APROVADO');
  run('INSERT INTO post_comunidade (id_usuario,id_receita,chef_id,legenda,estrelas,resposta,respondido_por) VALUES (?,?,?,?,?,?,?)', marina, 'tagliatelle-ragu', 'torino', 'Ficou idêntico ao do restaurante. Posso trocar o parmesão por pecorino?', 5, 'Pode sim, Marina! Pecorino combina muito bem.', 'torino');
}
seed();

/* ---------- mapeadores (mesmo formato JSON do modo local) ---------- */
const fdate = s => new Date(String(s).replace(' ', 'T') + 'Z').toLocaleDateString('pt-BR');
const mUser = u => ({ id:u.id, name:u.nome, email:u.email, kind:u.perfil });
const mCreator = c => c && ({ id:c.id, userId:c.id_usuario, chefId:c.chef_id, tipo:c.tipo_perfil, doc:c.documento_path, raio:c.raio_entrega_km, termo:!!c.termo_sanitario_aceito, status:c.status_validacao });
const RECIPE_SQL = 'SELECT r.*, c.chef_id, k.valor_kit FROM receita r JOIN criador_conteudo c ON c.id = r.id_criador LEFT JOIN kit_ingrediente k ON k.id_receita = r.id';
const mRecipe = r => ({ id:'r' + r.id, chefId:r.chef_id, status: r.status === 'PUBLICADA' ? 'publicada' : 'rascunho', createdAt:fdate(r.criado_em), name:r.titulo, desc:r.descricao, restricao:r.categoria_restricao, categoria:r.categoria, minutes:r.tempo_preparo_min, time:r.tempo_preparo_min + ' min', price:r.preco, kitPrice:r.valor_kit || 0, video:r.link_videoaula, img:r.imagem, ingredientes:JSON.parse(r.ingredientes), instrucoes:JSON.parse(r.instrucoes) });
const mTx = t => ({ id:t.id, userId:t.id_usuario, type:t.tipo, refId:t.ref_id, chefId:t.chef_id, valor:t.valor, metodo:t.metodo, cupom:t.cupom, status:t.status, http:t.http, date:fdate(t.criado_em) });
const ORDER_SQL = 'SELECT p.*, u.nome buyer FROM pedido_kit p JOIN usuario u ON u.id = p.id_usuario';
const mOrder = o => ({ id:o.id, userId:o.id_usuario, buyer:o.buyer, recipeId:o.id_receita, recipeName:o.nome_receita, chefId:o.chef_id, valor:o.valor, entrega:o.entrega, slot:o.janela, cep:o.cep, status:o.status, date:fdate(o.criado_em) });
const POST_SQL = 'SELECT p.*, u.nome nome FROM post_comunidade p JOIN usuario u ON u.id = p.id_usuario';
const mPost = p => ({ id:p.id, userId:p.id_usuario, name:p.nome, recipeId:p.id_receita, chefId:p.chef_id, caption:p.legenda, stars:p.estrelas, img:p.imagem, reply:p.resposta, replyBy:p.respondido_por, date:fdate(p.criado_em) });

/* ---------- utilidades de rota ---------- */
const fail = (status, message) => { const e = new Error(message); e.status = status; throw e; };
const needUser = ctx => ctx.user || fail(401, 'Entre na sua conta para continuar.');
const creatorOf = u => one('SELECT * FROM criador_conteudo WHERE id_usuario = ?', u.id);
function needApproved(ctx){
  const u = needUser(ctx), c = creatorOf(u);
  if(!c) fail(403, 'Esta conta não é de criador.');
  if(c.status_validacao !== 'APROVADO') fail(403, 'Seu perfil ainda não foi aprovado pela curadoria.');
  return c;
}
const needAdmin = ctx => { const u = needUser(ctx); if(u.perfil !== 'admin') fail(403, 'Acesso restrito ao administrador.'); return u; };
function recipeBody(b){
  if(!String(b.name || '').trim()) fail(422, 'Informe o título da receita.');
  if(!(Number(b.price) > 0)) fail(422, 'Informe um preço de acesso maior que zero.');
  if(!(Number(b.minutes) > 0)) fail(422, 'Informe o tempo de preparo em minutos.');
  const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
  return { titulo:b.name.trim(), descricao:String(b.desc || '').trim(), categoria_restricao:b.restricao || 'sem restrição', categoria: CATEGORIAS.includes(b.categoria) ? b.categoria : 'alta',
    tempo_preparo_min:Math.round(Number(b.minutes)), preco:Number(b.price), link_videoaula:String(b.video || '').trim(), imagem:b.img || '',
    ingredientes:JSON.stringify(lines(b.ingredientes)), instrucoes:JSON.stringify(lines(b.instrucoes)), kit:Number(b.kitPrice) || 0 };
}
function saveKit(idReceita, valor, ing){
  if(valor > 0) run('INSERT INTO kit_ingrediente (id_receita,composicao,valor_kit) VALUES (?,?,?) ON CONFLICT(id_receita) DO UPDATE SET valor_kit = excluded.valor_kit, composicao = excluded.composicao', idReceita, ing, valor);
  else run('DELETE FROM kit_ingrediente WHERE id_receita = ?', idReceita);
}
const ownRecipe = (c, id) => one(RECIPE_SQL + ' WHERE r.id = ? AND r.id_criador = ?', Number(String(id).replace(/^r/, '')), c.id) || fail(404, 'Receita não encontrada.');

/* ---------- rotas ---------- */
const routes = [];
const route = (method, p, fn) => routes.push({ method, re: new RegExp('^' + p.replace(/:\w+/g, '([^/]+)') + '$'), fn });

route('GET', '/health', () => ({ ok:true, db:'sqlite' }));

route('POST', '/auth/register', b => {
  const name = String(b.name || '').trim(), email = String(b.email || '').trim().toLowerCase();
  if(name.length < 3) fail(422, 'Informe o nome completo (mínimo 3 letras).');
  if(!/^\S+@\S+\.\S+$/.test(email)) fail(422, 'Informe um e-mail válido.');
  if(String(b.password || '').length < 6) fail(422, 'A senha deve ter ao menos 6 caracteres.');
  if(one('SELECT id FROM usuario WHERE email = ?', email)) fail(409, 'Este e-mail já está cadastrado. Entre na sua conta.');
  const criador = b.kind === 'criador';
  if(criador){
    if(!b.termo) fail(422, 'É obrigatório aceitar as normas da Vigilância Sanitária para prosseguir.');
    if(!b.doc) fail(422, 'Envie um Diploma válido ou Alvará/CNPJ para a curadoria profissional.');
    const r = Number(b.raio); if(!(r >= 1 && r <= 15)) fail(422, 'O raio de entrega deve ficar entre 1 e 15 km.');
  }
  const id = tx(() => {
    const uid = Number(run('INSERT INTO usuario (nome,email,senha_hash,perfil) VALUES (?,?,?,?)', name, email, hashPass(b.password), criador ? 'criador' : 'amador').lastInsertRowid);
    if(criador) run('INSERT INTO criador_conteudo (id_usuario,chef_id,nome_publico,tipo_perfil,documento_path,status_validacao,termo_sanitario_aceito,raio_entrega_km) VALUES (?,?,?,?,?,?,1,?)', uid, 'u' + uid, name, b.tipo || 'chef', b.doc, 'PENDENTE', Number(b.raio));
    return uid;
  });
  return { token: sign(id), user: mUser(one('SELECT * FROM usuario WHERE id = ?', id)) };
});
route('POST', '/auth/login', b => {
  const u = one('SELECT * FROM usuario WHERE email = ?', String(b.email || '').trim().toLowerCase());
  if(!u || !checkPass(String(b.password || ''), u.senha_hash)) fail(401, 'E-mail ou senha incorretos.');
  return { token: sign(u.id), user: mUser(u) };
});
route('POST', '/auth/logout', () => ({}));

route('GET', '/me', (b, p, ctx) => {
  const u = ctx.user; if(!u) return { user:null };
  return { user: mUser(u), creator: mCreator(creatorOf(u)) || null,
    access: all('SELECT id_receita FROM acesso_receita WHERE id_usuario = ?', u.id).map(a => a.id_receita),
    subs: all('SELECT chef_id FROM assinatura WHERE id_usuario = ?', u.id).map(s => s.chef_id),
    orders: all(ORDER_SQL + ' WHERE p.id_usuario = ?', u.id).map(mOrder),
    tx: all('SELECT * FROM transacao_financeira WHERE id_usuario = ?', u.id).map(mTx) };
});

/* perfil: o próprio usuário altera nome e senha */
route('PATCH', '/me', (b, p, ctx) => {
  const u = needUser(ctx), name = String(b.name || '').trim();
  if(name.length < 3) fail(422, 'Informe o nome completo (mínimo 3 letras).');
  run('UPDATE usuario SET nome = ? WHERE id = ?', name, u.id);
  return { user: mUser(one('SELECT * FROM usuario WHERE id = ?', u.id)) };
});
route('POST', '/me/password', (b, p, ctx) => {
  const u = needUser(ctx);
  if(!checkPass(String(b.current || ''), u.senha_hash)) fail(401, 'A senha atual está incorreta.');
  const nova = String(b.password || '');
  if(nova.length < 6) fail(422, 'A nova senha deve ter ao menos 6 caracteres.');
  run('UPDATE usuario SET senha_hash = ? WHERE id = ?', hashPass(nova), u.id);
  return {};
});

route('GET', '/recipes', () => ({
  recipes: all(RECIPE_SQL + " WHERE r.status = 'PUBLICADA' ORDER BY r.id").map(mRecipe),
  creators: all("SELECT c.chef_id, c.raio_entrega_km, COALESCE(u.nome, c.nome_publico) nome FROM criador_conteudo c LEFT JOIN usuario u ON u.id = c.id_usuario WHERE c.status_validacao = 'APROVADO'").map(c => ({ chefId:c.chef_id, raio:c.raio_entrega_km, name:c.nome })) }));
route('POST', '/recipes', (b, p, ctx) => {
  const c = needApproved(ctx), d = recipeBody(b);
  return tx(() => {
    const id = Number(run('INSERT INTO receita (id_criador,titulo,descricao,instrucoes,ingredientes,categoria_restricao,categoria,tempo_preparo_min,preco,link_videoaula,imagem,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      c.id, d.titulo, d.descricao, d.instrucoes, d.ingredientes, d.categoria_restricao, d.categoria, d.tempo_preparo_min, d.preco, d.link_videoaula, d.imagem, b.draft ? 'RASCUNHO' : 'PUBLICADA').lastInsertRowid);
    saveKit(id, d.kit, d.ingredientes);
    return { recipe: mRecipe(one(RECIPE_SQL + ' WHERE r.id = ?', id)) };
  });
});
route('PATCH', '/recipes/:id', (b, p, ctx) => {
  const c = needApproved(ctx), r = ownRecipe(c, p[0]);
  if(b.status && !b.name) run('UPDATE receita SET status = ? WHERE id = ?', b.status === 'publicada' ? 'PUBLICADA' : 'RASCUNHO', r.id);
  else {
    const d = recipeBody(b);
    run('UPDATE receita SET titulo=?, descricao=?, instrucoes=?, ingredientes=?, categoria_restricao=?, categoria=?, tempo_preparo_min=?, preco=?, link_videoaula=?, imagem=?, status=? WHERE id=?',
      d.titulo, d.descricao, d.instrucoes, d.ingredientes, d.categoria_restricao, d.categoria, d.tempo_preparo_min, d.preco, d.link_videoaula, d.imagem || r.imagem, b.status ? (b.status === 'publicada' ? 'PUBLICADA' : 'RASCUNHO') : r.status, r.id);
    saveKit(r.id, d.kit, d.ingredientes);
  }
  return { recipe: mRecipe(one(RECIPE_SQL + ' WHERE r.id = ?', r.id)) };
});
route('DELETE', '/recipes/:id', (b, p, ctx) => { const c = needApproved(ctx), r = ownRecipe(c, p[0]); run('DELETE FROM receita WHERE id = ?', r.id); return {}; });

route('POST', '/checkout', (b, p, ctx) => {
  const u = needUser(ctx);
  if(u.perfil !== 'amador') fail(403, 'Contas de criador e administrador não realizam compras.');
  const price = Number(b.amount) || 0; if(!(price > 0)) fail(422, 'Valor inválido.');
  let valor = price;
  if(b.cupom){ const d = CUPONS[String(b.cupom).trim().toUpperCase()]; if(d === undefined) fail(422, 'Cupom inválido.'); valor = +(price * (1 - d)).toFixed(2); }
  if(b.type === 'kit'){
    if(!b.termo) fail(422, 'É obrigatório aceitar as normas da Vigilância Sanitária para prosseguir.');
    if(b.entrega !== 'retirada'){
      const d = GEO.distanceKm(String(b.cep || ''), b.chefId); if(d === null) fail(422, 'Informe um CEP válido.');
      const c = one('SELECT raio_entrega_km r FROM criador_conteudo WHERE chef_id = ?', b.chefId);
      if(d > (c ? c.r : 5)) fail(422, 'Endereço fora do raio de entrega. Escolha retirar no estabelecimento.');
    }
  }
  if(!['receita', 'assinatura', 'kit'].includes(b.type)) fail(422, 'Tipo de compra inválido.');
  const metodo = b.metodo === 'pix' ? 'pix' : 'cartao', card = String(b.card || '').replace(/\s/g, '');
  const recusado = metodo === 'cartao' && (!/^\d{13,19}$/.test(card) || /0000$/.test(card));
  const result = tx(() => {
    const tid = Number(run('INSERT INTO transacao_financeira (id_usuario,tipo,ref_id,chef_id,valor,metodo,cupom,status,http) VALUES (?,?,?,?,?,?,?,?,?)', u.id, b.type, String(b.refId), String(b.chefId), valor, metodo, b.cupom || '', recusado ? 'RECUSADA' : 'APROVADA', recusado ? 402 : 200).lastInsertRowid);
    if(recusado) return { tid, recusado:true };
    if(b.type === 'receita') run('INSERT OR IGNORE INTO acesso_receita (id_usuario,id_receita,id_transacao) VALUES (?,?,?)', u.id, String(b.refId), tid);
    if(b.type === 'assinatura') run('INSERT OR IGNORE INTO assinatura (id_usuario,chef_id,id_transacao) VALUES (?,?,?)', u.id, String(b.chefId), tid);
    let order = null;
    if(b.type === 'kit'){ const oid = Number(run('INSERT INTO pedido_kit (id_usuario,id_receita,nome_receita,chef_id,valor,entrega,janela,cep) VALUES (?,?,?,?,?,?,?,?)', u.id, String(b.refId), String(b.recipeName || ''), b.chefId, valor, b.entrega, b.slot || '', b.cep || '').lastInsertRowid); order = mOrder(one(ORDER_SQL + ' WHERE p.id = ?', oid)); }
    return { tid, order };
  });
  const t = mTx(one('SELECT * FROM transacao_financeira WHERE id = ?', result.tid));
  if(result.recusado) fail(402, 'Transação não autorizada. Tente outro cartão ou PIX.');
  return { tx: t, order: result.order };
});

route('GET', '/posts', () => ({ posts: all(POST_SQL + ' ORDER BY p.id DESC').map(mPost) }));
route('POST', '/posts', (b, p, ctx) => {
  const u = needUser(ctx);
  if(!String(b.caption || '').trim()) fail(422, 'Escreva um comentário antes de publicar.');
  const stars = Number(b.stars); if(!(stars >= 0 && stars <= 5)) fail(422, 'Nota inválida.');
  const id = Number(run('INSERT INTO post_comunidade (id_usuario,id_receita,chef_id,legenda,estrelas,imagem) VALUES (?,?,?,?,?,?)', u.id, String(b.recipeId), b.chefId || '', b.caption.trim(), Math.round(stars), b.img || null).lastInsertRowid);
  return { post: mPost(one(POST_SQL + ' WHERE p.id = ?', id)) };
});
route('POST', '/posts/:id/reply', (b, p, ctx) => {
  const c = needApproved(ctx), post = one('SELECT * FROM post_comunidade WHERE id = ?', Number(p[0])) || fail(404, 'Post não encontrado.');
  if(post.chef_id !== c.chef_id) fail(403, 'Você só responde dúvidas das suas receitas.');
  if(!String(b.text || '').trim()) fail(422, 'Escreva a resposta.');
  run('UPDATE post_comunidade SET resposta = ?, respondido_por = ? WHERE id = ?', b.text.trim(), c.chef_id, post.id);
  return { post: mPost(one(POST_SQL + ' WHERE p.id = ?', post.id)) };
});

route('GET', '/dashboard', (b, p, ctx) => {
  const u = needUser(ctx), c = creatorOf(u); if(!c) fail(403, 'Esta conta não é de criador.');
  const ok = c.status_validacao === 'APROVADO';
  return { creator: mCreator(c),
    recipes: ok ? all(RECIPE_SQL + ' WHERE r.id_criador = ? ORDER BY r.id', c.id).map(mRecipe) : [],
    orders: ok ? all(ORDER_SQL + ' WHERE p.chef_id = ? ORDER BY p.id DESC', c.chef_id).map(mOrder) : [],
    tx: ok ? all("SELECT * FROM transacao_financeira WHERE chef_id = ? AND status = 'APROVADA' ORDER BY id", c.chef_id).map(mTx) : [],
    posts: ok ? all(POST_SQL + ' WHERE p.chef_id = ? ORDER BY p.id DESC', c.chef_id).map(mPost) : [],
    subs: one('SELECT COUNT(*) n FROM assinatura WHERE chef_id = ?', c.chef_id).n };
});
route('PATCH', '/creator', (b, p, ctx) => {
  const c = needApproved(ctx), r = Number(b.raio);
  if(!(r >= 1 && r <= 15)) fail(422, 'O raio de entrega deve ficar entre 1 e 15 km.');
  run('UPDATE criador_conteudo SET raio_entrega_km = ? WHERE id = ?', r, c.id);
  return { creator: mCreator(one('SELECT * FROM criador_conteudo WHERE id = ?', c.id)) };
});
route('PATCH', '/orders/:id', (b, p, ctx) => {
  const c = needApproved(ctx), o = one('SELECT * FROM pedido_kit WHERE id = ? AND chef_id = ?', Number(p[0]), c.chef_id) || fail(404, 'Pedido não encontrado.');
  if(!['AGUARDANDO', 'CONFIRMADO', 'ENTREGUE'].includes(b.status)) fail(422, 'Status inválido.');
  run('UPDATE pedido_kit SET status = ? WHERE id = ?', b.status, o.id);
  return { order: mOrder(one(ORDER_SQL + ' WHERE p.id = ?', o.id)) };
});

route('GET', '/admin/overview', (b, p, ctx) => {
  needAdmin(ctx);
  return { creators: all('SELECT c.*, u.nome, u.email, u.perfil FROM criador_conteudo c JOIN usuario u ON u.id = c.id_usuario ORDER BY c.id').map(c => ({ ...mCreator(c), user:{ id:c.id_usuario, name:c.nome, email:c.email, kind:c.perfil } })),
    users: all('SELECT * FROM usuario ORDER BY id').map(mUser), tx: all('SELECT * FROM transacao_financeira ORDER BY id').map(mTx),
    recipes: all(RECIPE_SQL + ' ORDER BY r.id').map(mRecipe) };
});
route('POST', '/admin/creators/:id/:acao', (b, p, ctx) => {
  needAdmin(ctx);
  const c = one('SELECT * FROM criador_conteudo WHERE id = ?', Number(p[0])) || fail(404, 'Criador não encontrado.');
  run('UPDATE criador_conteudo SET status_validacao = ? WHERE id = ?', p[1] === 'approve' ? 'APROVADO' : 'REJEITADO', c.id);
  return { creator: mCreator(one('SELECT * FROM criador_conteudo WHERE id = ?', c.id)) };
});

/* ---------- servidor HTTP ---------- */
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.mp4':'video/mp4', '.md':'text/plain; charset=utf-8' };
const send = (res, status, body, headers = {}) => { res.writeHead(status, { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'Content-Type, Authorization', 'Access-Control-Allow-Methods':'GET,POST,PATCH,DELETE,OPTIONS', ...headers }); res.end(body); };
const readBody = req => new Promise((ok, no) => { let s = 0; const c = []; req.on('data', d => { s += d.length; if(s > 8e6){ no(Object.assign(new Error('Requisição muito grande.'), { status:413 })); req.destroy(); } else c.push(d); }); req.on('end', () => ok(Buffer.concat(c).toString())); req.on('error', no); });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if(req.method === 'OPTIONS') return send(res, 204, '');
  if(url.pathname.startsWith('/api/')){
    try{
      const sub = url.pathname.slice(4), hit = routes.find(r => r.method === req.method && r.re.test(sub));
      if(!hit) fail(404, 'Rota não encontrada.');
      const raw = req.method === 'GET' || req.method === 'DELETE' ? '' : await readBody(req);
      let body = {}; if(raw){ try{ body = JSON.parse(raw); }catch(e){ fail(400, 'JSON inválido.'); } }
      const auth = (req.headers.authorization || '').replace(/^Bearer /, ''), uid = verify(auth);
      const ctx = { user: uid ? one('SELECT * FROM usuario WHERE id = ?', uid) : null };
      return send(res, 200, JSON.stringify(hit.fn(body, hit.re.exec(sub).slice(1), ctx)), { 'Content-Type':'application/json; charset=utf-8' });
    }catch(e){
      if(!e.status) console.error(e);
      return send(res, e.status || 500, JSON.stringify({ message: e.status ? e.message : 'Erro interno do servidor.' }), { 'Content-Type':'application/json; charset=utf-8' });
    }
  }
  let p = decodeURIComponent(url.pathname); if(p === '/') p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  const blocked = /^\/(server|node_modules|\.git|tests)\b|\.db(-|$)/.test('/' + path.relative(ROOT, file).replace(/\\/g, '/'));
  if(!file.startsWith(ROOT) || blocked || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(res, 404, 'Não encontrado', { 'Content-Type':'text/plain; charset=utf-8' });
  send(res, 200, fs.readFileSync(file), { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
});
if(require.main === module) server.listen(PORT, () => console.log('GastroMatch rodando em http://localhost:' + PORT + ' (banco: ' + DB_FILE + ')'));
module.exports = { server, db };
