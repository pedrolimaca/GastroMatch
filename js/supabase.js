/* =====================================================================
   supabase.js - terceiro modo de dados do GastroMatch (além de "local" e "servidor").
   Fala direto com o Supabase por HTTP, sem biblioteca:
     - login, cadastro e senha: Supabase Auth (GoTrue)  -> /auth/v1
     - regras de negócio e dados: funções SQL gm_*       -> /rest/v1/rpc
   As rotas abaixo são as mesmas de js/api.js, então nenhuma tela muda.
   Ativado quando js/config.js define window.GM_SUPABASE = { url, key }.
   A chave é a "publishable" (pública). NUNCA coloque a chave secret/service_role aqui.
   O SQL (tabelas, RLS e funções) está em server/supabase.sql.
   ===================================================================== */
const SB = (() => {
  const SKEY = 'gm-sb-session';
  const cfg = () => (typeof window !== 'undefined' && window.GM_SUPABASE) || {};
  const enabled = () => !!(cfg().url && cfg().key);
  const base = () => String(cfg().url).replace(/\/+$/, '');
  let sess = null, mem = null;

  const fail = (status, message) => { const e = new Error(message); e.status = status; throw e; };

  /* ---------- sessão (guardada no navegador) ---------- */
  function loadSess(){
    try{ sess = JSON.parse(localStorage.getItem(SKEY)); }catch(e){ sess = null; }
    if(!sess && mem) sess = mem;
  }
  function saveSess(s){
    sess = s;
    try{ s ? localStorage.setItem(SKEY, JSON.stringify(s)) : localStorage.removeItem(SKEY); }catch(e){ mem = s; }
  }
  function adoptSession(j){
    saveSess({ access_token: j.access_token, refresh_token: j.refresh_token,
      expires_at: j.expires_at || (Math.floor(Date.now() / 1000) + (j.expires_in || 3600)) });
  }

  /* ---------- HTTP ---------- */
  const headers = token => ({ 'Content-Type':'application/json', apikey: cfg().key, ...(token ? { Authorization:'Bearer ' + token } : {}) });
  async function http(url, opt){
    let r;
    try{ r = await fetch(url, opt); }catch(e){ fail(0, 'Não foi possível conectar ao banco de dados. Verifique sua internet.'); }
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, j };
  }
  const auth = (path, body, token, method) => http(base() + '/auth/v1' + path,
    { method: method || 'POST', headers: headers(token), body: body ? JSON.stringify(body) : undefined });

  async function freshToken(){
    if(!sess) return null;
    if(sess.expires_at - 30 > Date.now() / 1000) return sess.access_token;
    const r = await auth('/token?grant_type=refresh_token', { refresh_token: sess.refresh_token });
    if(!r.ok || !r.j.access_token){ saveSess(null); return null; }
    adoptSession(r.j); return sess.access_token;
  }

  /* chama uma função SQL gm_*; erros "GMxxx" viram erro HTTP xxx (como no servidor Node) */
  async function rpc(fn, args){
    const token = await freshToken();
    const r = await http(base() + '/rest/v1/rpc/' + fn, { method:'POST', headers: headers(token), body: JSON.stringify(args || {}) });
    if(r.ok) return r.j;
    const j = r.j || {}, code = String(j.code || '');
    if(/^GM\d{3}$/.test(code)) fail(Number(code.slice(2)), j.message);
    if(token && (r.status === 401 || code === 'PGRST301' || code === 'PGRST303')){ saveSess(null); fail(401, 'Sua sessão expirou. Entre novamente.'); }
    if(code === 'PGRST202' || code === '42883') fail(500, 'O banco ainda não foi configurado. Rode o script server/supabase.sql no Supabase.');
    fail(r.status || 500, j.message || j.msg || 'Erro ao acessar o banco de dados.');
  }

  /* ---------- rotas (mesmo contrato de js/api.js) ---------- */
  const routes = [];
  const route = (method, path, fn) => routes.push({ method, re: new RegExp('^' + path.replace(/:\w+/g, '([^/]+)') + '$'), fn });
  const needSession = () => { if(!sess) fail(401, 'Entre na sua conta para continuar.'); };

  route('POST', '/auth/register', async b => {
    const name = String(b.name || '').trim(), email = String(b.email || '').trim().toLowerCase();
    if(name.length < 3) fail(422, 'Informe o nome completo (mínimo 3 letras).');
    if(!/^\S+@\S+\.\S+$/.test(email)) fail(422, 'Informe um e-mail válido.');
    if(String(b.password || '').length < 6) fail(422, 'A senha deve ter ao menos 6 caracteres.');
    const criador = b.kind === 'criador', data = { name, kind: criador ? 'criador' : 'amador' };
    if(criador){
      if(!b.termo) fail(422, 'É obrigatório aceitar as normas da Vigilância Sanitária para prosseguir.');
      if(!b.doc) fail(422, 'Envie um Diploma válido ou Alvará/CNPJ para a curadoria profissional.');
      const r = Number(b.raio); if(!(r >= 1 && r <= 15)) fail(422, 'O raio de entrega deve ficar entre 1 e 15 km.');
      Object.assign(data, { tipo: b.tipo || 'chef', doc: String(b.doc), raio: r, termo: true });
    }
    const r = await auth('/signup', { email, password: b.password, data });
    if(!r.ok){
      const code = r.j.error_code || '', msg = String(r.j.msg || r.j.message || r.j.error_description || '');
      if(code === 'user_already_exists' || /already/i.test(msg)) fail(409, 'Este e-mail já está cadastrado. Entre na sua conta.');
      if(code === 'weak_password') fail(422, 'Senha muito fraca. Use ao menos 6 caracteres, com letras e números.');
      if(code === 'email_address_invalid') fail(422, 'Informe um e-mail válido.');
      if(r.status === 429 || /rate limit/i.test(code + msg)) fail(429, 'Muitas tentativas. Aguarde alguns minutos e tente de novo.');
      fail(r.status || 500, msg || 'Não foi possível criar a conta.');
    }
    if(!r.j.access_token) fail(422, 'Conta criada! Enviamos um e-mail de confirmação: confirme e depois entre.');
    adoptSession(r.j);
    const me = await rpc('gm_me');
    return { user: me.user };
  });

  route('POST', '/auth/login', async b => {
    const r = await auth('/token?grant_type=password', { email: String(b.email || '').trim().toLowerCase(), password: String(b.password || '') });
    if(!r.ok){
      if(r.j.error_code === 'email_not_confirmed') fail(401, 'Confirme seu e-mail antes de entrar.');
      if(r.status === 429) fail(429, 'Muitas tentativas. Aguarde alguns minutos e tente de novo.');
      if(r.status >= 500) fail(r.status, 'O serviço de login está indisponível. Tente novamente.');
      fail(401, 'E-mail ou senha incorretos.');
    }
    adoptSession(r.j);
    const me = await rpc('gm_me');
    if(!me.user){ saveSess(null); fail(401, 'Esta conta não tem perfil no GastroMatch. Crie a conta pela tela de cadastro.'); }
    return { user: me.user };
  });

  route('POST', '/auth/logout', async () => {
    if(sess) await auth('/logout', null, sess.access_token).catch(() => {});
    saveSess(null); return {};
  });

  route('GET', '/me', async () => {
    if(!sess) return { user: null };
    try{ return await rpc('gm_me'); }
    catch(e){ if(e.status === 401) return { user: null }; throw e; }
  });

  route('PATCH', '/me', async b => {
    needSession();
    const name = String(b.name || '').trim();
    if(name.length < 3) fail(422, 'Informe o nome completo (mínimo 3 letras).');
    return rpc('gm_update_name', { p_name: name });
  });

  route('POST', '/me/password', async b => {
    needSession();
    const me = await rpc('gm_me'); if(!me.user) fail(401, 'Entre na sua conta para continuar.');
    const nova = String(b.password || '');
    /* confere a senha atual entrando de novo com ela */
    const v = await auth('/token?grant_type=password', { email: me.user.email, password: String(b.current || '') });
    if(!v.ok) fail(401, 'A senha atual está incorreta.');
    if(nova.length < 6) fail(422, 'A nova senha deve ter ao menos 6 caracteres.');
    adoptSession(v.j);
    const u = await auth('/user', { password: nova }, sess.access_token, 'PUT');
    if(!u.ok){
      const code = u.j.error_code || '';
      if(code === 'same_password') fail(422, 'A nova senha deve ser diferente da atual.');
      if(code === 'weak_password') fail(422, 'Senha muito fraca. Escolha outra.');
      fail(u.status || 500, String(u.j.msg || u.j.message || 'Não foi possível atualizar a senha.'));
    }
    return {};
  });

  /* privacidade: confere a senha entrando de novo e só então apaga a conta e os dados */
  route('POST', '/me/delete', async b => {
    needSession();
    if(String(b.confirm || '').trim() !== 'EXCLUIR') fail(422, 'Digite EXCLUIR para confirmar a exclusão.');
    const me = await rpc('gm_me'); if(!me.user) fail(401, 'Entre na sua conta para continuar.');
    const v = await auth('/token?grant_type=password', { email: me.user.email, password: String(b.password || '') });
    if(!v.ok) fail(401, 'A senha está incorreta.');
    adoptSession(v.j);
    await rpc('gm_delete_account', { p_confirm: 'EXCLUIR' });
    saveSess(null); return {};
  });

  route('GET', '/recipes', () => rpc('gm_recipes'));
  route('POST', '/recipes', b => rpc('gm_recipe_create', { p_data: b }));
  route('PATCH', '/recipes/:id', (b, p) => rpc('gm_recipe_update', { p_id: p[0], p_data: b }));
  route('DELETE', '/recipes/:id', (b, p) => rpc('gm_recipe_delete', { p_id: p[0] }));

  route('POST', '/checkout', async b => {
    /* o número do cartão fica no navegador: o banco recebe só "card_ok" */
    const card = String(b.card || '').replace(/\s/g, '');
    const data = { ...b, card_ok: /^\d{13,19}$/.test(card) && !/0000$/.test(card) };
    delete data.card;
    const r = await rpc('gm_checkout', { p_data: data });
    if(r.refused) fail(402, 'Transação não autorizada. Tente outro cartão ou PIX.');
    return { tx: r.tx, order: r.order };
  });

  route('GET', '/posts', () => rpc('gm_posts'));
  route('POST', '/posts', b => rpc('gm_post_create', { p_data: b }));
  route('POST', '/posts/:id/reply', (b, p) => rpc('gm_post_reply', { p_id: Number(p[0]), p_text: String(b.text || '') }));

  route('GET', '/dashboard', () => rpc('gm_dashboard'));
  route('PATCH', '/creator', b => rpc('gm_creator_radius', { p_raio: Number(b.raio) }));
  route('PATCH', '/orders/:id', (b, p) => rpc('gm_order_status', { p_id: Number(p[0]), p_status: b.status }));

  route('GET', '/admin/overview', () => rpc('gm_admin_overview'));
  route('POST', '/admin/creators/:id/:acao', (b, p) => rpc('gm_admin_creator', { p_id: Number(p[0]), p_acao: p[1] }));

  /* ---------- API pública do módulo ---------- */
  async function request(method, path, body){
    const hit = routes.find(x => x.method === method && x.re.test(path));
    if(!hit) fail(404, 'Rota não encontrada.');
    return hit.fn(body || {}, hit.re.exec(path).slice(1));
  }
  /* true se o banco respondeu; false -> o site cai para o modo local */
  async function init(){
    loadSess();
    try{ await rpc('gm_ping'); return true; }
    catch(e){ console.warn('[GastroMatch] Supabase indisponível, usando o modo local:', e.message); return false; }
  }
  return { enabled, init, request };
})();
if(typeof module !== 'undefined') module.exports = SB;
