/* Teste do adaptador js/supabase.js com um Supabase simulado (sem rede).
   Confere: rotas -> funções gm_*, cabeçalhos, mapeamento de erros (GMxxx -> HTTP),
   renovação de sessão e o tratamento do cartão. O SQL em si só roda no Supabase. */
const assert = require('assert');
const store = {}; global.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
global.window = { GM_SUPABASE: { url: 'https://abc.supabase.co/', key: 'sb_publishable_TESTE' } };
const SB = require('../js/supabase.js');

let calls = [], handler = null;
global.fetch = async (url, opt) => {
  const body = opt.body ? JSON.parse(opt.body) : null;
  calls.push({ url, method: opt.method, headers: opt.headers, body });
  const out = handler(url, body, opt) || { status: 200, json: {} };
  return { ok: out.status < 400, status: out.status, json: async () => out.json };
};
const session = (extra = {}) => ({ access_token: 'JWT1', refresh_token: 'R1', expires_in: 3600, user: { email: 'a@b.com' }, ...extra });
const gmErr = (n, msg) => ({ status: 400, json: { code: 'GM' + n, message: msg } });
let ok = 0, bad = 0;
async function t(name, fn){ try{ calls = []; await fn(); console.log('PASS  ' + name); ok++; }catch(e){ console.log('FAIL  ' + name + '\n      ' + e.message); bad++; } }
const rej = async (p, status, frag) => { try{ await p; }catch(e){ assert.strictEqual(e.status, status, 'status ' + e.status + ': ' + e.message); if(frag) assert.ok(e.message.includes(frag), e.message); return; } assert.fail('deveria ter falhado'); };

(async () => {
  await t('enabled() depende de url e key', () => { assert.strictEqual(SB.enabled(), true); });

  await t('init(): ping ok usa o Supabase; ping com erro cai para o modo local', async () => {
    handler = u => u.endsWith('/rpc/gm_ping') ? { status: 200, json: true } : null;
    assert.strictEqual(await SB.init(), true);
    assert.strictEqual(calls[0].url, 'https://abc.supabase.co/rest/v1/rpc/gm_ping');
    assert.strictEqual(calls[0].headers.apikey, 'sb_publishable_TESTE');
    assert.ok(!calls[0].headers.Authorization, 'sem login não envia Authorization');
    handler = () => ({ status: 404, json: { code: 'PGRST202', message: 'x' } });
    const w = console.warn; console.warn = () => {}; assert.strictEqual(await SB.init(), false); console.warn = w;
  });

  await t('cadastro de cozinheiro: valida, chama /signup com metadados e abre sessão', async () => {
    await rej(SB.request('POST', '/auth/register', { name: 'Jo', email: 'a@b.com', password: '123456' }), 422, 'nome');
    await rej(SB.request('POST', '/auth/register', { name: 'Joana Lima', email: 'x', password: '123456' }), 422, 'e-mail');
    await rej(SB.request('POST', '/auth/register', { name: 'Joana Lima', email: 'a@b.com', password: '123' }), 422, '6');
    calls = [];
    handler = (u) => u.includes('/auth/v1/signup') ? { status: 200, json: session() } : { status: 200, json: { user: { id: 'u1', name: 'Joana Lima', email: 'a@b.com', kind: 'amador' } } };
    const r = await SB.request('POST', '/auth/register', { name: ' Joana Lima ', email: 'A@B.com', password: '123456', kind: 'amador' });
    assert.strictEqual(r.user.kind, 'amador');
    assert.deepStrictEqual(calls[0].body, { email: 'a@b.com', password: '123456', data: { name: 'Joana Lima', kind: 'amador' } });
    assert.strictEqual(calls[1].headers.Authorization, 'Bearer JWT1');
  });

  await t('cadastro de criador exige termo, documento e raio 1 a 15; manda tudo nos metadados', async () => {
    await rej(SB.request('POST', '/auth/register', { name: 'Chef Teste', email: 'c@d.com', password: '123456', kind: 'criador', doc: 'x.pdf', raio: 5 }), 422, 'Vigilância');
    await rej(SB.request('POST', '/auth/register', { name: 'Chef Teste', email: 'c@d.com', password: '123456', kind: 'criador', termo: true, raio: 5 }), 422, 'Diploma');
    await rej(SB.request('POST', '/auth/register', { name: 'Chef Teste', email: 'c@d.com', password: '123456', kind: 'criador', termo: true, doc: 'x.pdf', raio: 40 }), 422, 'raio');
    calls = [];
    handler = u => u.includes('/signup') ? { status: 200, json: session() } : { status: 200, json: { user: { kind: 'criador' } } };
    await SB.request('POST', '/auth/register', { name: 'Chef Teste', email: 'c@d.com', password: '123456', kind: 'criador', termo: true, doc: 'cnpj.pdf', raio: '7', tipo: 'restaurante' });
    assert.deepStrictEqual(calls[0].body.data, { name: 'Chef Teste', kind: 'criador', tipo: 'restaurante', doc: 'cnpj.pdf', raio: 7, termo: true });
  });

  await t('cadastro: e-mail repetido vira 409; confirmação de e-mail ligada avisa o usuário', async () => {
    handler = () => ({ status: 422, json: { error_code: 'user_already_exists', msg: 'User already registered' } });
    await rej(SB.request('POST', '/auth/register', { name: 'Joana Lima', email: 'a@b.com', password: '123456' }), 409, 'já está cadastrado');
    handler = () => ({ status: 200, json: { id: 'x', email: 'a@b.com' } });
    await rej(SB.request('POST', '/auth/register', { name: 'Joana Lima', email: 'a@b.com', password: '123456' }), 422, 'confirmação');
  });

  await t('login: senha errada = 401 em português; sucesso devolve o usuário', async () => {
    handler = () => ({ status: 400, json: { error_code: 'invalid_credentials', msg: 'Invalid login credentials' } });
    await rej(SB.request('POST', '/auth/login', { email: 'a@b.com', password: 'x' }), 401, 'incorretos');
    handler = u => u.includes('/token') ? { status: 200, json: session() } : { status: 200, json: { user: { id: 'u1', kind: 'amador' } } };
    assert.strictEqual((await SB.request('POST', '/auth/login', { email: 'a@b.com', password: '123456' })).user.kind, 'amador');
  });

  await t('login de conta sem perfil no app: bloqueia e limpa a sessão', async () => {
    handler = u => u.includes('/token') ? { status: 200, json: session() } : { status: 200, json: { user: null } };
    await rej(SB.request('POST', '/auth/login', { email: 'a@b.com', password: '123456' }), 401, 'perfil');
    assert.deepStrictEqual(await SB.request('GET', '/me'), { user: null });
  });

  await t('rotas chamam as funções certas com os argumentos certos', async () => {
    handler = u => u.includes('/token') ? { status: 200, json: session() } : { status: 200, json: { user: { id: 'u1', email: 'a@b.com', kind: 'criador' } } };
    await SB.request('POST', '/auth/login', { email: 'a@b.com', password: '123456' });
    const seen = []; handler = (u, b) => { seen.push([u.split('/rpc/')[1], JSON.stringify(b)]); return { status: 200, json: {} }; };
    await SB.request('GET', '/recipes'); await SB.request('POST', '/recipes', { name: 'X', price: 10 });
    await SB.request('PATCH', '/recipes/r7', { status: 'publicada' }); await SB.request('DELETE', '/recipes/r7');
    await SB.request('GET', '/posts'); await SB.request('POST', '/posts', { caption: 'oi', stars: 5 }); await SB.request('POST', '/posts/9/reply', { text: 'ok' });
    await SB.request('GET', '/dashboard'); await SB.request('PATCH', '/creator', { raio: '9' }); await SB.request('PATCH', '/orders/3', { status: 'ENTREGUE' });
    await SB.request('GET', '/admin/overview'); await SB.request('POST', '/admin/creators/4/approve');
    await SB.request('PATCH', '/me', { name: 'Novo Nome' });
    assert.deepStrictEqual(seen, [
      ['gm_recipes', '{}'], ['gm_recipe_create', '{"p_data":{"name":"X","price":10}}'],
      ['gm_recipe_update', '{"p_id":"r7","p_data":{"status":"publicada"}}'], ['gm_recipe_delete', '{"p_id":"r7"}'],
      ['gm_posts', '{}'], ['gm_post_create', '{"p_data":{"caption":"oi","stars":5}}'], ['gm_post_reply', '{"p_id":9,"p_text":"ok"}'],
      ['gm_dashboard', '{}'], ['gm_creator_radius', '{"p_raio":9}'], ['gm_order_status', '{"p_id":3,"p_status":"ENTREGUE"}'],
      ['gm_admin_overview', '{}'], ['gm_admin_creator', '{"p_id":4,"p_acao":"approve"}'], ['gm_update_name', '{"p_name":"Novo Nome"}']]);
    await rej(SB.request('PATCH', '/me', { name: 'ab' }), 422, 'nome');
  });

  await t('erros do banco GMxxx viram o status HTTP correspondente', async () => {
    handler = () => gmErr(403, 'Seu perfil ainda não foi aprovado pela curadoria.');
    await rej(SB.request('POST', '/recipes', { name: 'X' }), 403, 'curadoria');
    handler = () => gmErr(422, 'Cupom inválido.'); await rej(SB.request('POST', '/checkout', { type: 'receita', amount: 10, cupom: 'X' }), 422, 'Cupom');
    handler = () => ({ status: 404, json: { code: 'PGRST202', message: 'Could not find the function' } });
    await rej(SB.request('GET', '/recipes'), 500, 'supabase.sql');
  });

  await t('checkout: cartão nunca sai do navegador; card_ok calculado; recusado = 402', async () => {
    let sent = null; handler = (u, b) => { sent = b; return { status: 200, json: { refused: false, tx: { id: 1 }, order: null } }; };
    const r = await SB.request('POST', '/checkout', { type: 'receita', amount: 34.9, metodo: 'cartao', card: '4111 1111 1111 1111', refId: 'r1', chefId: 'torino' });
    assert.strictEqual(sent.p_data.card_ok, true); assert.ok(!('card' in sent.p_data)); assert.deepStrictEqual(r, { tx: { id: 1 }, order: null });
    await SB.request('POST', '/checkout', { type: 'receita', amount: 10, metodo: 'cartao', card: '4111111111110000' }); assert.strictEqual(sent.p_data.card_ok, false);
    await SB.request('POST', '/checkout', { type: 'receita', amount: 10, metodo: 'cartao', card: '123' }); assert.strictEqual(sent.p_data.card_ok, false);
    handler = () => ({ status: 200, json: { refused: true, tx: { id: 2 } } });
    await rej(SB.request('POST', '/checkout', { type: 'receita', amount: 10, metodo: 'cartao', card: '4111111111110000' }), 402, 'não autorizada');
  });

  await t('sessão expirada é renovada com o refresh_token antes da chamada', async () => {
    store['gm-sb-session'] = JSON.stringify({ access_token: 'VELHO', refresh_token: 'R9', expires_at: 1 });
    handler = u => u.includes('grant_type=refresh_token') ? { status: 200, json: { access_token: 'NOVO', refresh_token: 'R10', expires_in: 3600 } }
      : u.endsWith('/rpc/gm_ping') ? { status: 200, json: true } : { status: 200, json: { posts: [] } };
    assert.strictEqual(await SB.init(), true);                       // o ping já renova a sessão
    assert.ok(calls[0].url.includes('grant_type=refresh_token')); assert.strictEqual(calls[0].body.refresh_token, 'R9');
    assert.strictEqual(calls[1].headers.Authorization, 'Bearer NOVO');
    assert.strictEqual(JSON.parse(store['gm-sb-session']).refresh_token, 'R10');
    calls = []; await SB.request('GET', '/posts');                   // sessão válida: não renova de novo
    assert.strictEqual(calls.length, 1); assert.strictEqual(calls[0].headers.Authorization, 'Bearer NOVO');
  });

  await t('token inválido (401) limpa a sessão e /me devolve user:null', async () => {
    store['gm-sb-session'] = JSON.stringify({ access_token: 'RUIM', refresh_token: 'R', expires_at: 9999999999 });
    const w = console.warn; console.warn = () => {}; handler = () => ({ status: 401, json: { code: 'PGRST301' } }); await SB.init(); console.warn = w;
    store['gm-sb-session'] = JSON.stringify({ access_token: 'RUIM', refresh_token: 'R', expires_at: 9999999999 }); await SB.init().catch(() => {});
    handler = () => ({ status: 401, json: { code: 'PGRST301', message: 'JWT expired' } });
    assert.deepStrictEqual(await SB.request('GET', '/me'), { user: null });
    assert.strictEqual(store['gm-sb-session'], undefined);
  });

  await t('troca de senha: confere a atual, valida a nova e atualiza no Auth', async () => {
    handler = u => u.includes('/token?grant_type=password') ? { status: 200, json: session() } : { status: 200, json: { user: { id: 'u1', email: 'a@b.com', kind: 'amador' } } };
    await SB.request('POST', '/auth/login', { email: 'a@b.com', password: '123456' });
    handler = u => u.includes('/token?grant_type=password') ? { status: 400, json: { error_code: 'invalid_credentials' } } : { status: 200, json: { user: { email: 'a@b.com' } } };
    await rej(SB.request('POST', '/me/password', { current: 'errada', password: 'novasenha' }), 401, 'atual');
    handler = u => u.includes('/token?grant_type=password') ? { status: 200, json: session({ access_token: 'JWT2' }) } : { status: 200, json: { user: { email: 'a@b.com' } } };
    await rej(SB.request('POST', '/me/password', { current: '123456', password: '123' }), 422, '6');
    calls = []; handler = u => u.includes('/token?grant_type=password') ? { status: 200, json: session({ access_token: 'JWT2' }) } : { status: 200, json: { user: { email: 'a@b.com' } } };
    await SB.request('POST', '/me/password', { current: '123456', password: 'novasenha' });
    const put = calls.find(c => c.method === 'PUT'); assert.ok(put.url.endsWith('/auth/v1/user')); assert.deepStrictEqual(put.body, { password: 'novasenha' }); assert.strictEqual(put.headers.Authorization, 'Bearer JWT2');
  });

  await t('excluir conta: exige EXCLUIR, confere a senha, chama gm_delete_account e encerra a sessão', async () => {
    handler = u => u.includes('/token?grant_type=password') ? { status: 200, json: session() } : { status: 200, json: { user: { id: 'u1', email: 'a@b.com', kind: 'amador' } } };
    await SB.request('POST', '/auth/login', { email: 'a@b.com', password: '123456' });
    await rej(SB.request('POST', '/me/delete', { password: '123456', confirm: 'excluir' }), 422, 'EXCLUIR');
    handler = u => u.includes('/token?grant_type=password') ? { status: 400, json: { error_code: 'invalid_credentials' } } : { status: 200, json: { user: { email: 'a@b.com' } } };
    await rej(SB.request('POST', '/me/delete', { password: 'errada', confirm: 'EXCLUIR' }), 401, 'senha');
    assert.ok(store['gm-sb-session'], 'senha errada não pode encerrar a sessão');
    calls = []; handler = u => u.includes('/token?grant_type=password') ? { status: 200, json: session({ access_token: 'JWT3' }) }
      : u.endsWith('/rpc/gm_me') ? { status: 200, json: { user: { email: 'a@b.com' } } } : { status: 200, json: {} };
    await SB.request('POST', '/me/delete', { password: '123456', confirm: 'EXCLUIR' });
    const del = calls.find(c => c.url.endsWith('/rpc/gm_delete_account'));
    assert.deepStrictEqual(del.body, { p_confirm: 'EXCLUIR' }); assert.strictEqual(del.headers.Authorization, 'Bearer JWT3');
    assert.strictEqual(store['gm-sb-session'], undefined);
    assert.deepStrictEqual(await SB.request('GET', '/me'), { user: null });
    handler = () => gmErr(403, 'A conta de administrador não pode ser excluída pelo site.');
    store['gm-sb-session'] = JSON.stringify({ access_token: 'A', refresh_token: 'R', expires_at: 9999999999 }); await SB.init().catch(() => {});
  });

  await t('logout limpa a sessão mesmo se a chamada falhar', async () => {
    handler = () => { throw new Error('rede'); };
    global.fetch = async () => { throw new Error('rede'); };
    await SB.request('POST', '/auth/logout'); assert.strictEqual(store['gm-sb-session'], undefined);
  });

  console.log('\n' + ok + ' testes passaram, ' + bad + ' falharam.'); process.exit(bad ? 1 : 0);
})();
