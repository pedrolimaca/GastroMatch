/* =====================================================================
   features.js - telas e fluxos integrados à API (js/api.js).
   Carregado ANTES de script.js: aqui só há declarações; tudo usa os dados
   de script.js (recipes, chefs, currentUser...) apenas em tempo de execução.
   ===================================================================== */
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const fmtErr = e => '<div class="field-error">' + esc(e.message || 'Erro inesperado.') + '</div>';
const EMAIL_RE = /^\S+@\S+\.\S+$/;
const KIND_LABEL = { amador:'Cozinheiro', criador:'Criador', admin:'Administrador' };
let D = null, dashTab = 'visao', editingId = null, nrImg = '', adminData = null, adminTab = 'cur', payCtx = null, payMetodo = 'cartao', payCupom = '';
window.draftRecipes = [];

/* ---------- sessão e catálogo ---------- */
async function loadSession(){
  const me = await API.get('/me');
  currentUser = me.user ? { ...me.user, creator: me.creator, orders: me.orders || [], tx: me.tx || [] } : null;
  unlockedRecipes.clear(); (me.access || []).forEach(i => unlockedRecipes.add(i));
  subscribedChefs.clear(); (me.subs || []).forEach(i => subscribedChefs.add(i));
  renderAuthArea();
}
function ensureChef(id, name, raio){
  if(!chefs[id]) chefs[id] = { name:esc(name), person:esc(name), initial:(name || '?').charAt(0).toUpperCase(), city:'Joinville, SC', distance:'-', radius:raio + ' km',
    stats:{ receitas:0, alunos:0, avaliacao:0 }, bio:'Perfil aprovado pela curadoria do GastroMatch.', cover: IMG.kitchen };
  else chefs[id].radius = raio + ' km';
}
function toFrontRecipe(r){
  const kit = r.ingredientes && r.ingredientes.length ? r.ingredientes.map(i => [esc(i), '']) : [['Ingredientes a definir', '']];
  return { id:r.id, custom:true, name:esc(r.name), chef:r.chefId, time:esc(r.time), minutes:r.minutes, difficulty:'média', portions:'2 pessoas', price:r.price,
    cat:r.categoria || 'alta', rating:0, reviews:0, kitPrice:r.kitPrice || 0, kitsLeft:5, img:r.img || IMG.risoto, restricao:r.restricao, kit,
    instrucoes: r.instrucoes && r.instrucoes.length ? r.instrucoes.map(esc) : [esc(r.desc) || 'Modo de preparo em edição.'],
    testi:{ quote:'Em breve as primeiras avaliações.', name:'GastroMatch' }, status:r.status };
}
async function loadCatalog(){
  const d = await API.get('/recipes');
  for(let i = recipes.length - 1; i >= 0; i--) if(recipes[i].custom) recipes.splice(i, 1);
  d.creators.forEach(c => ensureChef(c.chefId, c.name, c.raio));
  d.recipes.forEach(r => recipes.push(toFrontRecipe(r)));
  const posts = (await API.get('/posts')).posts;
  communityPosts.length = 0; communityPosts.push(...posts);
}
async function bootstrap(){
  try{ await API.init(); await loadSession(); await loadCatalog(); }catch(e){ console.error(e); }
  render();
}
const ownsRecipe = r => !!currentUser && (currentUser.kind === 'admin' || (currentUser.creator && currentUser.creator.chefId === r.chef));
const landingFor = k => k === 'admin' ? 'admin' : k === 'criador' ? 'dashboard' : 'home';

/* ---------- topo: usuário logado ---------- */
function renderAuthArea(){
  const area = document.getElementById('authArea'), dr = document.getElementById('drawerAuthArea');
  if(currentUser){
    const k = currentUser.kind, panel = k === 'admin' ? 'admin' : k === 'criador' ? 'dashboard' : '';
    const panelLabel = k === 'admin' ? 'Administração' : 'Meu painel';
    if(area) area.innerHTML = `<div class="userchip" role="button" tabindex="0" onclick="goToTab('profile')" onkeydown="if(event.key==='Enter')goToTab('profile')" title="Meu perfil - ${esc(currentUser.email)}"><span class="av">${esc(currentUser.name.charAt(0).toUpperCase())}</span><span>${esc(currentUser.name.split(' ')[0])} <small class="role-tag">${KIND_LABEL[k]}</small></span></div>${panel ? `<button class="nav-btn-ghost panel-btn" style="display:inline-block" onclick="goToTab('${panel}')">${panelLabel}</button>` : ''}<button class="nav-btn-ghost logout-btn" style="display:inline-block" onclick="logout()">Sair</button>`;
    if(dr) dr.innerHTML = `<button class="ghost" onclick="closeDrawer(); goToTab('profile')">Meu perfil</button>${panel ? `<button class="ghost" onclick="closeDrawer(); goToTab('${panel}')">${panelLabel}</button>` : ''}<button class="primary" onclick="closeDrawer(); logout()">Sair</button>`;
  } else {
    if(area) area.innerHTML = `<button class="nav-btn-ghost" style="display:inline-block" onclick="goToTab('login')">Entrar</button><button class="nav-btn-solid" style="display:inline-block" onclick="goToTab('register-choice')">Criar conta</button>`;
    if(dr) dr.innerHTML = `<button class="ghost" onclick="closeDrawer(); goToTab('login')">Entrar</button><button class="primary" onclick="closeDrawer(); goToTab('register-choice')">Criar conta</button>`;
  }
}
async function logout(){ try{ await API.post('/auth/logout'); }catch(e){} currentUser = null; unlockedRecipes.clear(); subscribedChefs.clear(); D = null; adminData = null; renderAuthArea(); showToast('Você saiu da sua conta.'); goToTab('home'); }

/* ---------- login e cadastro (RF01 / RF05) ---------- */
function renderLogin(){
  return `<div class="auth-wrap"><div class="auth-card">
    <h1 class="auth-title">Bem-vindo de volta</h1>
    <p class="auth-sub">Entre com seu e-mail e senha para acessar sua conta GastroMatch.</p>
    <div class="field"><label for="loginEmail">E-mail</label><input id="loginEmail" type="email" autocomplete="email" placeholder="voce@email.com"></div>
    <div class="field"><label for="loginPass">Senha</label><input id="loginPass" type="password" autocomplete="current-password" placeholder="Sua senha" onkeydown="if(event.key==='Enter')doLogin()"></div>
    <div id="loginError"></div>
    <button class="auth-submit" id="loginBtn" onclick="doLogin()">Entrar</button>
    <p class="auth-switch">Não tem conta? <span class="link-inline" onclick="goToTab('register-choice')">Criar conta</span></p>
    <div class="demo-box"><b>Contas de teste</b>
      <span class="link-inline" onclick="fillLogin('marina@email.com','123456')">Cozinheira</span>,
      <span class="link-inline" onclick="fillLogin('chef@gastromatch.com','chef123')">Chef aprovado</span>,
      <span class="link-inline" onclick="fillLogin('beatriz@email.com','123456')">Chef pendente</span>,
      <span class="link-inline" onclick="fillLogin('admin@gastromatch.com','admin123')">Administrador</span></div>
  </div></div>`;
}
function fillLogin(e, p){ document.getElementById('loginEmail').value = e; document.getElementById('loginPass').value = p; }
function afterAuth(){
  if(pendingAfterLogin){ const act = pendingAfterLogin; pendingAfterLogin = null; act(); }
  else goToTab(landingFor(currentUser.kind));
}
async function doLogin(){
  const email = document.getElementById('loginEmail').value.trim(), pass = document.getElementById('loginPass').value, box = document.getElementById('loginError');
  if(!EMAIL_RE.test(email)){ box.innerHTML = '<div class="field-error">Informe um e-mail válido.</div>'; return; }
  if(!pass){ box.innerHTML = '<div class="field-error">Informe sua senha.</div>'; return; }
  const btn = document.getElementById('loginBtn'); btn.disabled = true;
  try{ await API.post('/auth/login', { email, password:pass }); await loadSession(); showToast('Login realizado com sucesso.'); afterAuth(); }
  catch(e){ box.innerHTML = fmtErr(e); btn.disabled = false; }
}
async function doRegisterAmador(){
  const name = document.getElementById('regName').value.trim(), email = document.getElementById('regEmail').value.trim(), password = document.getElementById('regPass').value, box = document.getElementById('regError');
  if(!name || !email || !password){ box.innerHTML = '<div class="field-error">Preencha todos os campos.</div>'; return; }
  try{ await API.post('/auth/register', { name, email, password, kind:'amador' }); await loadSession(); showToast('Conta criada. Bem-vindo(a), ' + name.split(' ')[0] + '.'); afterAuth(); }
  catch(e){ box.innerHTML = fmtErr(e); }
}
async function doRegisterCriador(){
  const g = id => document.getElementById(id), box = g('regCError');
  const name = g('regCName').value.trim(), email = g('regCEmail').value.trim(), password = g('regCPass').value;
  if(!name || !email || !password){ box.innerHTML = '<div class="field-error">Preencha todos os campos obrigatórios.</div>'; return; }
  const f = g('regCDoc').files[0];
  try{
    await API.post('/auth/register', { name, email, password, kind:'criador', tipo:g('regTipo').value, raio:g('regCRadius').value || 5, doc:f ? f.name : '', termo:g('regCSanit').checked });
    await loadSession(); showToast('Cadastro enviado. Perfil Pendente de Validação, curadoria em até 48h.'); goToTab('dashboard');
  }catch(e){ box.innerHTML = fmtErr(e); }
}

/* ---------- categorias e tempo de preparo (o catálogo e os filtros ficam em js/pages.js) ---------- */
/* categoria de cada receita do catálogo base (as criadas pelos chefs trazem a própria categoria) */
const CAT_OF = { 'risoto-funghi':'alta', 'tagliatelle-ragu':'massas', 'cordeiro-porto':'carnes', 'curry-verde':'alta', 'pao-fermentacao':'alta', 'torta-limao':'sobremesas', 'feijoada-completa':'brasileiras', 'hamburguer-artesanal':'carnes', 'bowl-vegetariano':'vegetarianas', 'mousse-chocolate':'sobremesas' };
const catOf = r => r.cat || CAT_OF[r.id] || 'alta';
function minutesOf(r){
  if(r.minutes) return r.minutes;
  const t = String(r.time).toLowerCase(), h = +((/(\d+)\s*h/.exec(t) || [])[1] || 0);
  const m = +((/h\s*(\d+)/.exec(t) || /(\d+)\s*min/.exec(t) || [])[1] || 0);
  return h * 60 + m;
}

/* ---------- modo cozinha (RNF04) ---------- */
let cookSize = 15;
function cookFont(d){ cookSize = Math.max(13, Math.min(24, cookSize + d * 2)); const b = document.querySelector('.unlocked-recipe-body'); if(b) b.style.fontSize = cookSize + 'px'; }
function toggleStep(el){ el.classList.toggle('done'); }

/* ---------- pagamento simulado (RF03 / RN05) ---------- */
const money = n => 'R$ ' + Number(n).toFixed(2).replace('.', ',');
function openPayment(ctx){
  payCtx = ctx; payMetodo = 'cartao'; payCupom = '';
  const b = document.createElement('div'); b.className = 'modal-backdrop'; b.id = 'payBackdrop'; b.innerHTML = '<div class="modal-box" id="payBox"></div>';
  b.addEventListener('click', ev => { if(ev.target === b) closePayment(); });
  document.body.appendChild(b); paintPayment();
}
function closePayment(){ const b = document.getElementById('payBackdrop'); if(b) b.remove(); payCtx = null; }
function payTotal(){ const d = API.CUPONS[payCupom] || 0; return +(payCtx.amount * (1 - d)).toFixed(2); }
function paintPayment(msg){
  const box = document.getElementById('payBox'); if(!box) return;
  box.innerHTML = `<h3>Pagamento</h3><p class="auth-sub">${payCtx.title}</p>
    <div class="chip-row"><div class="chip ${payMetodo === 'cartao' ? 'on' : ''}" onclick="payMetodo='cartao';paintPayment()">Cartão</div><div class="chip ${payMetodo === 'pix' ? 'on' : ''}" onclick="payMetodo='pix';paintPayment()">PIX</div></div>
    ${payMetodo === 'cartao' ? `<div class="field"><label for="payCard">Número do cartão</label><input id="payCard" inputmode="numeric" maxlength="19" placeholder="4242 4242 4242 4242"><small class="hint">Teste: cartão terminado em 0000 simula pagamento recusado.</small></div>` : '<p class="auth-sub">PIX simulado: a confirmação é imediata ao clicar em pagar.</p>'}
    <div class="field"><label for="payCupom">Cupom de desconto</label><div style="display:flex;gap:8px"><input id="payCupom" value="${esc(payCupom)}" placeholder="GASTRO10" style="flex:1"><button class="tiny-btn" onclick="applyCupom()">aplicar</button></div></div>
    <div class="total-row"><span>Total</span><b>${money(payTotal())}</b></div>
    <div id="payError">${msg || ''}</div>
    <div class="modal-actions"><button class="cancel" onclick="closePayment()">cancelar</button><button class="submit" id="payBtn" onclick="confirmPayment()">Pagar agora</button></div>`;
}
function applyCupom(){
  const v = document.getElementById('payCupom').value.trim().toUpperCase();
  if(v && !API.CUPONS[v]){ payCupom = ''; paintPayment('<div class="field-error">Cupom inválido.</div>'); return; }
  payCupom = v; paintPayment(v ? '<div class="geo-ok"><span class="geo-dot"></span> cupom aplicado</div>' : '');
}
async function confirmPayment(){
  const c = payCtx, card = payMetodo === 'cartao' ? document.getElementById('payCard').value : '', btn = document.getElementById('payBtn');
  if(payMetodo === 'cartao' && card.replace(/\s/g, '').length < 13){ document.getElementById('payError').innerHTML = '<div class="field-error">Informe o número do cartão (13 a 19 dígitos).</div>'; return; }
  btn.disabled = true; btn.textContent = 'Processando...';
  try{
    await API.post('/checkout', { ...c.body, amount:c.amount, metodo:payMetodo, card, cupom:payCupom });
    closePayment(); await loadSession(); showToast(c.okMsg);
    if(c.after) c.after(); else render();
  }catch(e){
    const txt = e.status === 402 ? 'Erro 402: ' + e.message : e.message;
    paintPayment('<div class="field-error">' + esc(txt) + '</div>');
  }
}
function buyRecipe(id){
  requireLogin(() => {
    if(currentUser.kind !== 'amador'){ showToast('Somente contas de cozinheiro amador compram receitas.'); return; }
    const r = recipeById(id);
    openPayment({ title:'Acesso à receita: ' + r.name, amount:r.price, body:{ type:'receita', refId:id, chefId:r.chef }, okMsg:'Pagamento aprovado. Receita liberada.' });
  });
}
function subscribeChef(chefId){
  requireLogin(() => {
    if(currentUser.kind !== 'amador'){ showToast('Somente contas de cozinheiro amador assinam catálogos.'); return; }
    openPayment({ title:'Assinatura mensal: ' + chefs[chefId].name, amount:API.ASSINATURA, body:{ type:'assinatura', refId:chefId, chefId }, okMsg:'Assinatura ativada. Todo o catálogo foi liberado.' });
  });
}
function startKitPayment(recipeId){
  const r = recipeById(recipeId);
  if(!currentUser || currentUser.kind !== 'amador'){ showToast('Entre com uma conta de cozinheiro amador para pedir o kit.'); return; }
  if(!document.getElementById('terms').checked){ showToast('É obrigatório aceitar as normas da Vigilância Sanitária para prosseguir.'); return; }
  const slot = (document.querySelector('.chip-row .chip.on') || {}).textContent || '', retirada = /Retirar/.test(slot), cep = (document.getElementById('cepInput').value || '').replace(/\D/g, '');
  openPayment({ title:'Kit de ingredientes: ' + r.name, amount:r.kitPrice, okMsg:'Pedido confirmado. Que tal compartilhar o resultado na comunidade?', after:() => goToTab('community'),
    body:{ type:'kit', refId:recipeId, recipeName:r.name, chefId:r.chef, entrega: retirada ? 'retirada' : 'entrega', slot, cep, raio:parseFloat(chefs[r.chef].radius) || 5, termo:true } });
}

/* ---------- comunidade (RF06) ---------- */
async function submitPost(){
  const recipeId = document.getElementById('postRecipeSel').value, caption = document.getElementById('postCaption').value.trim();
  if(!caption){ showToast('Escreva um comentário antes de publicar.'); return; }
  try{
    await API.post('/posts', { recipeId, caption, stars:postDraftStars, img:postDraftImg, chefId:recipeById(recipeId).chef });
    await loadCatalog(); closePostModal(); showToast('Resultado publicado na comunidade.'); goToTab('community');
  }catch(e){ showToast(e.message); }
}

/* ---------- painel do criador ---------- */
function renderDashboard(){
  if(!currentUser) return renderLoginGate('painel do criador');
  if(currentUser.kind === 'admin') return renderAdmin();
  if(currentUser.kind !== 'criador') return `<div class="wrap" style="padding-top:140px; max-width:520px; text-align:center"><h2 style="font-family:'Fraunces',serif;font-size:22px;font-weight:500">Área exclusiva para criadores</h2><p style="color:var(--ink-soft);font-size:13.5px;line-height:1.7;margin:12px 0 22px">Sua conta é de Cozinheiro Amador. Para publicar receitas e vender kits, cadastre-se como Chef ou Restaurante.</p><button class="btn-primary" onclick="goToTab('register-criador')">Cadastrar como criador</button></div>`;
  setTimeout(loadDashboard, 0);
  return `<div class="wrap" id="dash-root" style="padding-top:120px;max-width:980px"><p class="auth-sub">Carregando painel...</p></div>`;
}
async function loadDashboard(){
  const root = document.getElementById('dash-root'); if(!root) return;
  try{ D = await API.get('/dashboard'); }catch(e){ root.innerHTML = fmtErr(e); return; }
  currentUser.creator = D.creator; ensureChef(D.creator.chefId, currentUser.name, D.creator.raio);
  window.draftRecipes = D.recipes.map(toFrontRecipe); paintDashboard();
}
const pill = s => `<span class="status-pill s-${String(s).toLowerCase()}">${esc(s)}</span>`;
function paintDashboard(){
  const root = document.getElementById('dash-root'); if(!root || !D) return;
  const c = D.creator, name = (chefs[c.chefId] || {}).name || currentUser.name;
  let h = `<h2 class="dash-title">${esc(name)}, painel do criador</h2><p class="dash-sub">${esc(currentUser.email)} ${pill(c.status === 'PENDENTE' ? 'PENDENTE DE VALIDAÇÃO' : c.status)} <small>${API.mode() === 'servidor' ? 'dados no banco de dados' : 'dados salvos no navegador'}</small></p>`;
  if(c.status !== 'APROVADO'){
    h += `<div class="alert-box">${c.status === 'PENDENTE' ? 'Seu cadastro está em análise pela curadoria. Publicar receitas e cadastrar kits será liberado após a aprovação.' : 'Seu cadastro foi rejeitado pela curadoria. Crie uma nova conta com a documentação correta.'}</div>
      <div class="rev-cards"><div class="rev-card"><small>documento enviado</small><b style="font-size:15px">${esc(c.doc)}</b></div><div class="rev-card"><small>termo sanitário</small><b style="font-size:15px">${c.termo ? 'Aceito' : 'Pendente'}</b></div><div class="rev-card"><small>raio de entrega</small><b>${c.raio} km</b></div></div>`;
    root.innerHTML = h; return;
  }
  const tabs = [['visao', 'Visão geral'], ['rec', 'Receitas'], ['ped', 'Pedidos de kit'], ['com', 'Comunidade'], ['ent', 'Entrega']];
  h += `<div class="tabs-bar">${tabs.map(t => `<span class="${dashTab === t[0] ? 'on' : ''}" onclick="dashTab='${t[0]}';paintDashboard()">${t[1]}</span>`).join('')}</div>` + dashTabHtml();
  root.innerHTML = h;
}
function dashTabHtml(){
  const c = D.creator, base = recipes.filter(r => r.chef === c.chefId && !r.custom), tx = D.tx, rev = tx.reduce((a, t) => a + t.valor, 0);
  const sales = id => tx.filter(t => t.type === 'receita' && t.refId === id).length;
  if(dashTab === 'visao'){
    const pend = D.orders.filter(o => o.status === 'AGUARDANDO').length, all = base.concat(D.recipes.filter(r => r.status === 'publicada').map(toFrontRecipe)), mx = Math.max(1, ...all.map(r => sales(r.id)));
    return `<div class="rev-cards"><div class="rev-card"><small>receita total</small><b>${money(rev)}</b><em>${tx.length} transações aprovadas</em></div><div class="rev-card"><small>receitas vendidas</small><b>${tx.filter(t => t.type === 'receita').length}</b></div><div class="rev-card"><small>kits pedidos</small><b>${D.orders.length}</b></div><div class="rev-card"><small>assinantes</small><b>${D.subs}</b></div></div>
      ${pend ? `<div class="alert-box">${pend} pedido(s) de kit aguardando confirmação de estoque.</div>` : ''}
      <h3 class="dash-h3">Vendas por receita</h3>${all.map(r => `<div class="bar-row"><span>${r.name}</span><div class="bar"><i style="width:${sales(r.id) / mx * 100}%"></i></div><b>${sales(r.id)}</b></div>`).join('') || '<p class="empty-note">Nenhuma receita publicada.</p>'}
      <h3 class="dash-h3">Últimas transações</h3>${txTable(tx.slice(-5).reverse())}`;
  }
  if(dashTab === 'rec'){
    return `<button class="new-recipe-btn" style="margin:0 0 16px" onclick="goTo('new-recipe')">+ Nova receita</button><div class="table-scroll"><table class="data-table"><tr><th>Receita</th><th>Preço</th><th>Vendas</th><th>Status</th><th></th></tr>
      ${base.map(r => `<tr><td>${r.name}</td><td>${brl(r.price)}</td><td>${sales(r.id)}</td><td>${pill('PUBLICADA')}</td><td><span class="link-inline" onclick="goTo('recipe','${r.id}')">ver</span></td></tr>`).join('')}
      ${D.recipes.map(r => `<tr><td>${esc(r.name)}</td><td>${brl(r.price)}</td><td>${sales(r.id)}</td><td>${pill(r.status === 'publicada' ? 'PUBLICADA' : 'RASCUNHO')}</td><td class="acts"><span class="link-inline" onclick="goTo('new-recipe','${r.id}')">editar</span><span class="link-inline" onclick="togglePublish('${r.id}','${r.status === 'publicada' ? 'rascunho' : 'publicada'}')">${r.status === 'publicada' ? 'despublicar' : 'publicar'}</span><span class="link-inline" onclick="goTo('recipe','${r.id}')">ver</span><span class="link-inline" onclick="deleteRecipe('${r.id}')">excluir</span></td></tr>`).join('')}</table></div>`;
  }
  if(dashTab === 'ped'){
    return D.orders.length ? `<div class="table-scroll"><table class="data-table"><tr><th>Data</th><th>Cliente</th><th>Receita</th><th>Entrega</th><th>Valor</th><th>Status</th></tr>${D.orders.map(o => `<tr><td>${o.date}</td><td>${esc(o.buyer)}</td><td>${esc(o.recipeName)}</td><td>${o.entrega === 'retirada' ? 'Retirada' : esc(o.slot) + (o.cep ? ', CEP ' + esc(o.cep) : '')}</td><td>${money(o.valor)}</td><td><select onchange="setOrderStatus(${o.id},this.value)">${['AGUARDANDO', 'CONFIRMADO', 'ENTREGUE'].map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td></tr>`).join('')}</table></div>` : '<p class="empty-note">Nenhum pedido de kit ainda. Os pedidos dos cozinheiros aparecem aqui.</p>';
  }
  if(dashTab === 'com'){
    return D.posts.length ? D.posts.map(p => `<div class="dash-post"><b>${esc(p.name)}</b> em <i>${esc(recipeById(p.recipeId).name)}</i> <span class="stars">${'★'.repeat(p.stars)}</span><p>${esc(p.caption)}</p>${p.reply ? `<p class="post-reply">Sua resposta: ${esc(p.reply)}</p>` : `<div style="display:flex;gap:8px"><input id="rp-${p.id}" placeholder="Responder ao cozinheiro" style="flex:1;padding:9px;border:1px solid var(--line);background:var(--paper);color:var(--ink)"><button class="tiny-btn" onclick="replyPost(${p.id})">enviar</button></div>`}</div>`).join('') : '<p class="empty-note">Ainda não há posts nas suas receitas.</p>';
  }
  return `<div class="dash-post"><div class="field"><label for="raioInput">Raio de entrega dos kits (km, máximo 15)</label><input id="raioInput" type="number" min="1" max="15" value="${c.raio}" style="max-width:160px"></div><div id="raioMsg"></div><button class="auth-submit" style="width:auto;padding:11px 22px" onclick="saveRaio()">Salvar raio</button></div>`;
}
const txTable = list => list.length ? `<div class="table-scroll"><table class="data-table"><tr><th>Data</th><th>Tipo</th><th>Valor</th><th>Método</th></tr>${list.map(t => `<tr><td>${t.date}</td><td>${t.type}</td><td>${money(t.valor)}</td><td>${t.metodo}</td></tr>`).join('')}</table></div>` : '<p class="empty-note">Sem transações ainda.</p>';
async function dashAct(fn, msg){ try{ await fn(); await loadCatalog(); D = await API.get('/dashboard'); window.draftRecipes = D.recipes.map(toFrontRecipe); if(msg) showToast(msg); if(currentPage === 'dashboard') paintDashboard(); }catch(e){ showToast(e.message); } }
const togglePublish = (id, status) => dashAct(() => API.patch('/recipes/' + id, { status }), status === 'publicada' ? 'Receita publicada no marketplace.' : 'Receita voltou para rascunho.');
const deleteRecipe = id => { if(confirm('Excluir esta receita? Essa ação não pode ser desfeita.')) dashAct(() => API.del('/recipes/' + id), 'Receita excluída.'); };
const setOrderStatus = (id, status) => dashAct(() => API.patch('/orders/' + id, { status }), 'Pedido atualizado para ' + status.toLowerCase() + '.');
const replyPost = id => { const v = document.getElementById('rp-' + id).value.trim(); if(!v){ showToast('Escreva a resposta.'); return; } dashAct(() => API.post('/posts/' + id + '/reply', { text:v }), 'Resposta enviada.'); };
async function saveRaio(){
  try{ const r = await API.patch('/creator', { raio:document.getElementById('raioInput').value }); chefs[D.creator.chefId].radius = r.creator.raio + ' km'; D.creator = r.creator; showToast('Raio de entrega salvo.'); }
  catch(e){ document.getElementById('raioMsg').innerHTML = fmtErr(e); }
}

/* ---------- cadastro e edição de receitas (RF02 / RN01) ---------- */
function renderNewRecipe(id){
  if(!currentUser || currentUser.kind !== 'criador') return renderLoginGate('publicação de receitas');
  if(!D || (id && !D.recipes.find(r => r.id === id))){ API.get('/dashboard').then(d => { D = d; render(); }).catch(() => {}); return '<div class="wrap" style="padding-top:140px"><p class="auth-sub">Carregando...</p></div>'; }
  if(D.creator.status !== 'APROVADO') return `<div class="wrap" style="padding-top:140px;max-width:520px;text-align:center"><h2 style="font-family:'Fraunces',serif;font-size:22px;font-weight:500">Perfil ainda não aprovado</h2><p class="auth-sub">A publicação de receitas é liberada somente após a aprovação da curadoria.</p><button class="btn-primary" onclick="goToTab('dashboard')">Voltar ao painel</button></div>`;
  editingId = id || null;
  const r = id ? D.recipes.find(x => x.id === id) : { name:'', desc:'', restricao:'sem restrição', minutes:'', price:'', kitPrice:'', video:'', ingredientes:[], instrucoes:[], img:'' };
  nrImg = r.img || '';
  const opts = ['sem restrição', 'vegano', 'vegetariano', 'sem glúten', 'sem lactose', 'zero açúcar'].map(o => `<option ${o === r.restricao ? 'selected' : ''}>${o}</option>`).join('');
  return `<div class="auth-wrap" style="max-width:600px"><button class="back-link" onclick="goToTab('dashboard')">voltar ao painel</button><div class="auth-card">
    <h1 class="auth-title">${id ? 'Editar receita' : 'Publicar nova receita'}</h1><p class="auth-sub">Categorize por restrição alimentar e tempo de preparo.</p>
    <div class="field"><label for="nrTitle">Título da receita</label><input id="nrTitle" value="${esc(r.name)}" placeholder="Ex: Risoto de Camarão"></div>
    <div class="field"><label for="nrDesc">Descrição</label><textarea id="nrDesc">${esc(r.desc)}</textarea></div>
    <div class="field"><label for="nrRestricao">Restrição alimentar</label><select id="nrRestricao">${opts}</select></div>
    <div class="field"><label for="nrCategoria">Categoria</label><select id="nrCategoria">${categories.map(c => `<option value="${c.key}" ${(r.categoria || 'alta') === c.key ? 'selected' : ''}>${c.label}</option>`).join('')}</select></div>
    <div class="field"><label for="nrTempo">Tempo de preparo (minutos)</label><input id="nrTempo" type="number" min="1" value="${r.minutes}" placeholder="40"></div>
    <div class="field"><label for="nrPreco">Preço de acesso avulso, Pay-Per-View (R$)</label><input id="nrPreco" type="number" step="0.10" min="0" value="${r.price}" placeholder="29.90"></div>
    <div class="field"><label for="nrKit">Valor do kit de ingredientes (R$, deixe vazio se não houver kit)</label><input id="nrKit" type="number" step="0.10" min="0" value="${r.kitPrice || ''}"></div>
    <div class="field"><label for="nrIng">Ingredientes (um por linha, ex: Arroz arbóreo, 200g)</label><textarea id="nrIng" rows="4">${esc((r.ingredientes || []).join('\n'))}</textarea></div>
    <div class="field"><label for="nrPassos">Modo de preparo (um passo por linha)</label><textarea id="nrPassos" rows="4">${esc((r.instrucoes || []).join('\n'))}</textarea></div>
    <div class="field"><label for="nrVideo">Link da videoaula</label><input id="nrVideo" value="${esc(r.video)}" placeholder="https://..."></div>
    <div class="field"><label for="nrFoto">Foto do prato</label><input type="file" id="nrFoto" accept="image/*" onchange="handleRecipeImg(event)"><img id="nrPreview" class="preview-img" style="${nrImg ? '' : 'display:none'}" src="${nrImg}"></div>
    <div id="nrError"></div>
    <div class="modal-actions" style="justify-content:flex-start"><button class="auth-submit" style="width:auto" onclick="publishRecipe(false)">Publicar</button><button class="cancel" style="padding:10px 16px" onclick="publishRecipe(true)">Salvar rascunho</button></div>
  </div></div>`;
}
function handleRecipeImg(ev){
  const f = ev.target.files[0]; if(!f) return;
  const fr = new FileReader();
  fr.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 800 / im.width), cv = document.createElement('canvas'); cv.width = im.width * k; cv.height = im.height * k; cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); nrImg = cv.toDataURL('image/jpeg', .75); const p = document.getElementById('nrPreview'); p.src = nrImg; p.style.display = 'block'; }; im.src = fr.result; };
  fr.readAsDataURL(f);
}
async function publishRecipe(asDraft){
  const g = id => document.getElementById(id).value;
  const body = { name:g('nrTitle'), desc:g('nrDesc'), restricao:g('nrRestricao'), categoria:g('nrCategoria'), minutes:g('nrTempo'), price:g('nrPreco'), kitPrice:g('nrKit'), ingredientes:g('nrIng'), instrucoes:g('nrPassos'), video:g('nrVideo'), img:nrImg, draft:asDraft };
  try{
    if(editingId) await API.patch('/recipes/' + editingId, { ...body, status: asDraft ? 'rascunho' : 'publicada' }); else await API.post('/recipes', body);
    await loadCatalog(); D = await API.get('/dashboard'); window.draftRecipes = D.recipes.map(toFrontRecipe);
    showToast(asDraft ? 'Receita salva como rascunho.' : 'Receita publicada no marketplace.'); dashTab = 'rec'; goToTab('dashboard');
  }catch(e){ document.getElementById('nrError').innerHTML = fmtErr(e); }
}

/* ---------- administração: curadoria (RN01) ---------- */
function renderAdmin(){
  if(!currentUser || currentUser.kind !== 'admin') return renderLoginGate('o painel de administração');
  setTimeout(loadAdmin, 0);
  return `<div class="wrap" id="admin-root" style="padding-top:120px;max-width:980px"><p class="auth-sub">Carregando painel...</p></div>`;
}
async function loadAdmin(){
  const root = document.getElementById('admin-root'); if(!root) return;
  try{ adminData = await API.get('/admin/overview'); }catch(e){ root.innerHTML = fmtErr(e); return; }
  paintAdmin();
}
function paintAdmin(){
  const root = document.getElementById('admin-root'); if(!root || !adminData) return;
  const A = adminData, pend = A.creators.filter(c => c.status === 'PENDENTE').length, tabs = [['cur', 'Curadoria'], ['usr', 'Usuários'], ['tx', 'Transações']];
  let b = '';
  if(adminTab === 'cur') b = `<div class="table-scroll"><table class="data-table"><tr><th>Criador</th><th>Tipo</th><th>Documento</th><th>Termo sanitário</th><th>Status</th><th></th></tr>${A.creators.map(c => `<tr><td>${esc(c.user.name)}<br><small>${esc(c.user.email)}</small></td><td>${esc(c.tipo)}</td><td><span class="link-inline" onclick="showToast('Abrindo ${esc(c.doc)}')">${esc(c.doc)}</span></td><td>${c.termo ? 'Aceito' : 'Não'}</td><td>${pill(c.status)}</td><td class="acts">${c.status === 'PENDENTE' ? `<span class="link-inline" onclick="adminAct(${c.id},'approve')">aprovar</span><span class="link-inline" onclick="adminAct(${c.id},'reject')">rejeitar</span>` : ''}</td></tr>`).join('')}</table></div>`;
  if(adminTab === 'usr') b = `<div class="table-scroll"><table class="data-table"><tr><th>Nome</th><th>E-mail</th><th>Perfil</th></tr>${A.users.map(u => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${KIND_LABEL[u.kind]}</td></tr>`).join('')}</table></div>`;
  if(adminTab === 'tx') b = A.tx.length ? `<div class="table-scroll"><table class="data-table"><tr><th>#</th><th>Data</th><th>Tipo</th><th>Valor</th><th>Status</th></tr>${A.tx.map(t => `<tr><td>${t.id}</td><td>${t.date}</td><td>${t.type}</td><td>${money(t.valor)}</td><td>${pill(t.status)} (${t.http})</td></tr>`).join('')}</table></div>` : '<p class="empty-note">Nenhuma transação registrada.</p>';
  root.innerHTML = `<h2 class="dash-title">Administração</h2><div class="rev-cards"><div class="rev-card"><small>criadores pendentes</small><b>${pend}</b></div><div class="rev-card"><small>usuários</small><b>${A.users.length}</b></div><div class="rev-card"><small>transações</small><b>${A.tx.length}</b></div></div>
    <div class="tabs-bar">${tabs.map(t => `<span class="${adminTab === t[0] ? 'on' : ''}" onclick="adminTab='${t[0]}';paintAdmin()">${t[1]}</span>`).join('')}</div>${b}`;
}
async function adminAct(id, acao){
  try{ await API.post('/admin/creators/' + id + '/' + acao); adminData = await API.get('/admin/overview'); showToast(acao === 'approve' ? 'Criador aprovado.' : 'Cadastro rejeitado.'); paintAdmin(); }
  catch(e){ showToast(e.message); }
}

/* ---------- tela da refeição: abas e avaliações ---------- */
function switchTab(name, el){
  document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = p.dataset.p !== name; });
  document.querySelectorAll('.tabs span').forEach(s => s.classList.toggle('active', s === el));
}
function reviewsHtml(r){
  const ps = communityPosts.filter(p => p.recipeId === r.id), rated = ps.filter(p => p.stars > 0), avg = rated.length ? rated.reduce((a, p) => a + p.stars, 0) / rated.length : 0;
  return `<div class="review-head"><b>${avg ? avg.toFixed(1).replace('.', ',') + ' de 5' : 'Sem notas ainda'}</b><span>${ps.length} comentário(s) da comunidade</span><button class="tiny-btn" onclick="requireLogin(openPostModal)">postar avaliação</button></div>`
    + ps.map(p => `<div class="review"><div class="review-top"><b>${esc(p.name)}</b>${p.stars ? '<span class="stars">' + '★'.repeat(p.stars) + '</span>' : ''}</div><p>${esc(p.caption)}</p>${p.reply ? '<p class="post-reply">Resposta do restaurante: ' + esc(p.reply) + '</p>' : ''}</div>`).join('')
    + `<div class="testi-card"><span class="stars">${STARS5}</span><p>"${r.testi.quote}"</p><span class="who">${r.testi.name}, fez esta receita</span></div>`;
}

/* ---------- proximidade: restaurantes perto de você ---------- */
const N = { origin:null, label:'Joinville, SC (centro)' };
function nearbyList(){
  const o = N.origin || GEO.BASE;
  return Object.entries(chefs).map(([id, c]) => ({ id, c, d:GEO.haversine(o, GEO.coordsOf(id)), r:parseFloat(c.radius) || 5, n:recipes.filter(x => x.chef === id).length })).sort((a, b) => a.d - b.d);
}
function nearbyListHtml(){
  return `<p class="near-label">Distâncias a partir de: ${esc(N.label)}</p><div class="near-grid">${nearbyList().map(x => `<div class="near-card" onclick="goTo('chef','${x.id}')" role="button" tabindex="0"><div><b>${x.c.name}</b><small>${x.c.city}, ${x.n} receita(s)</small></div><div class="near-meta"><span>${x.d.toFixed(1).replace('.', ',')} km</span><em class="${x.d <= x.r ? 'in' : 'out'}">${x.d <= x.r ? 'entrega o kit' : 'retirada ou só aula'}</em></div></div>`).join('')}</div>`;
}
function nearbyHtml(){
  return `<div class="sec-head reveal"><h2>Experiências perto de você</h2><p>Informe seu CEP ou use sua localização para ver quem entrega o kit no seu endereço.</p></div>
    <div class="near-form"><input id="nearCep" inputmode="numeric" maxlength="9" placeholder="CEP, ex: 89200-000" aria-label="CEP" oninput="this.value=this.value.replace(/\\D/g,'').replace(/^(\\d{5})(\\d)/,'$1-$2')" onkeydown="if(event.key==='Enter')nearbyCep()"><button class="tiny-btn" onclick="nearbyCep()">buscar por CEP</button><button class="tiny-btn alt" onclick="nearbyGeo()">usar minha localização</button></div>
    <div id="nearby-list">${nearbyListHtml()}</div>`;
}
function paintNearby(){ const el = document.getElementById('nearby-list'); if(el) el.innerHTML = nearbyListHtml(); }
function nearbyCep(){
  const v = document.getElementById('nearCep').value, g = GEO.geocodeCep(v);
  if(!g){ showToast('Digite um CEP válido com 8 números.'); return; }
  N.origin = g; N.label = 'CEP ' + v; paintNearby();
}
function nearbyGeo(){
  if(!navigator.geolocation){ showToast('Seu navegador não permite localização. Use o CEP.'); return; }
  navigator.geolocation.getCurrentPosition(pos => { N.origin = [pos.coords.latitude, pos.coords.longitude]; N.label = 'sua localização'; paintNearby(); }, () => showToast('Não foi possível obter a localização. Use o CEP.'), { timeout:8000 });
}
