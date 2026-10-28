/* =====================================================================
   pages.js - telas novas: catálogo de receitas (categorias, busca e
   filtros), perfil do usuário (cozinheiro, criador e administrador) e
   páginas de informação (ajuda, contato, termos e privacidade).
   Carregado ANTES de script.js: só declarações; os dados (recipes, chefs,
   categories, currentUser...) são usados apenas em tempo de execução.
   ===================================================================== */

/* ---------------------------------------------------------------------
   CATÁLOGO DE RECEITAS  (#recipes)
   --------------------------------------------------------------------- */
const F = { q:'', cat:'', rest:'', time:'', price:'', sort:'' };

const CAT_INFO = {
  alta:         { desc:'Técnicas de restaurante autoral para levar à sua mesa: risotos, panificação de fermentação natural e pratos para impressionar.' },
  massas:       { desc:'Massas frescas, molhos de longo cozimento e o ponto certo do al dente, direto de cozinhas italianas.' },
  carnes:       { desc:'Cortes nobres, cocção lenta e grelhados no ponto, com o passo a passo de quem trabalha com carne todos os dias.' },
  brasileiras:  { desc:'Comida de panela cheia e de afeto, da feijoada de domingo aos clássicos da cozinha brasileira.' },
  vegetarianas: { desc:'Bowls, grãos e legumes cheios de sabor, preparados com produtores locais.' },
  sobremesas:   { desc:'Tortas, mousses e confeitaria autoral, com acidez, cacau e acabamento de vitrine.' },
};
const REST_OPTIONS  = ['vegano', 'vegetariano', 'sem glúten', 'sem lactose', 'zero açúcar'];
const TIME_OPTIONS  = [['30', 'Até 30 min'], ['60', '30 a 60 min'], ['61', 'Mais de 60 min']];
const PRICE_OPTIONS = [['20', 'Até R$ 20'], ['30', 'R$ 20 a 30'], ['31', 'Acima de R$ 30']];
const SORT_OPTIONS  = [['', 'Relevância'], ['preco-asc', 'Menor preço'], ['preco-desc', 'Maior preço'], ['tempo', 'Menor tempo'], ['nota', 'Melhor avaliadas']];

/* atalhos da busca da home */
const SUGGESTIONS = {
  rapido:       { label:'Quero algo rápido',   set:{ time:'30' } },
  especial:     { label:'Jantar especial',     set:{ cat:'alta' } },
  impressionar: { label:'Quero impressionar',  set:{ cat:'alta' } },
  ate20:        { label:'Até R$ 20',           set:{ price:'20' } },
  vegetariana:  { label:'Receita vegetariana', set:{ cat:'vegetarianas' } },
};

const norm = s => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const catLabel = key => (categories.find(c => c.key === key) || {}).label || '';

function recipeSearchText(r){
  const c = chefs[r.chef] || {};
  return norm([r.name, c.name, c.person, catLabel(catOf(r)), r.restricao, ...(r.kit || []).map(k => k[0])].join(' '));
}
function matchesPrice(r, v){ return !v || (v === '20' ? r.price <= 20 : v === '30' ? r.price > 20 && r.price <= 30 : r.price > 30); }
function matchesTime(r, v){ const m = minutesOf(r); return !v || (v === '30' ? m <= 30 : v === '60' ? m > 30 && m <= 60 : m > 60); }
/* skip: ignora um filtro (usado para contar quantas receitas há em cada categoria) */
function recipeMatches(r, skip){
  const words = norm(F.q).split(/\s+/).filter(Boolean);
  if(words.length){ const txt = recipeSearchText(r); if(!words.every(w => txt.includes(w))) return false; }
  return (skip === 'cat' || !F.cat || catOf(r) === F.cat)
    && (!F.rest || r.restricao === F.rest)
    && matchesTime(r, F.time) && matchesPrice(r, F.price);
}
function filteredRecipes(){
  const list = recipes.filter(r => recipeMatches(r));
  const by = {
    'preco-asc':  (a, b) => a.price - b.price,
    'preco-desc': (a, b) => b.price - a.price,
    'tempo':      (a, b) => minutesOf(a) - minutesOf(b),
    'nota':       (a, b) => (b.rating || 0) - (a.rating || 0),
  }[F.sort];
  return by ? list.slice().sort(by) : list;
}
const hasFilters = () => !!(F.q || F.cat || F.rest || F.time || F.price || F.sort);
const fmtTime = m => m >= 60 ? Math.floor(m / 60) + 'h' + (m % 60 ? String(m % 60).padStart(2, '0') : '') : m + ' min';

function catBannerHtml(){
  const cat = categories.find(c => c.key === F.cat);
  const pool = recipes.filter(r => !F.cat || catOf(r) === F.cat);
  const mins = pool.map(minutesOf).filter(Boolean);
  const avg = mins.length ? Math.round(mins.reduce((a, b) => a + b, 0) / mins.length) : 0;
  const from = pool.length ? Math.min(...pool.map(r => r.price)) : 0;
  const chefsN = new Set(pool.map(r => r.chef)).size;
  const title = cat ? cat.label : 'Todas as receitas';
  const desc = cat ? (CAT_INFO[cat.key] || {}).desc : 'Explore o catálogo completo: receitas, videoaulas e kits de ingredientes de chefs e restaurantes verificados.';
  return `<section class="cat-banner photo">${photoHtml(cat ? cat.img : IMG.kitchen)}
    <div class="cat-banner-info">
      <div class="eyebrow"><span class="dot"></span>${cat ? 'Categoria' : 'Catálogo'}</div>
      <h1>${esc(title)}</h1><p>${esc(desc)}</p>
      <div class="cat-stats">
        <span><b>${pool.length}</b>receita${pool.length === 1 ? '' : 's'}</span>
        <span><b>${chefsN}</b>chef${chefsN === 1 ? '' : 's'} e restaurante${chefsN === 1 ? '' : 's'}</span>
        ${avg ? `<span><b>${fmtTime(avg)}</b>tempo médio</span>` : ''}
        ${pool.length ? `<span><b>${brl(from)}</b>a partir de</span>` : ''}
      </div>
    </div></section>`;
}
function catChipsHtml(){
  const all = recipes.filter(r => recipeMatches(r, 'cat')).length;
  const chip = (key, label, n) => `<button class="cat-chip ${F.cat === key ? 'on' : ''} ${n === 0 ? 'empty' : ''}" aria-pressed="${F.cat === key}" onclick="setCat('${key}')">${esc(label)} <small>${n}</small></button>`;
  return `<div class="cat-chips" role="group" aria-label="Categorias">${chip('', 'Todas', all)}${categories.map(c => chip(c.key, c.label, recipes.filter(r => catOf(r) === c.key && recipeMatches(r, 'cat')).length)).join('')}</div>`;
}
function filterLineHtml(){
  const chips = (list, key) => list.map(x => { const v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x.charAt(0).toUpperCase() + x.slice(1); return `<button class="chip ${F[key] === v ? 'on' : ''}" aria-pressed="${F[key] === v}" onclick="setFilter('${key}','${v}')">${esc(l)}</button>`; }).join('');
  return `<div class="filter-line">
    <div class="filter-group"><span class="flabel">Restrição</span>${chips(REST_OPTIONS, 'rest')}</div>
    <div class="filter-group"><span class="flabel">Preparo</span>${chips(TIME_OPTIONS, 'time')}</div>
    <div class="filter-group"><span class="flabel">Preço</span>${chips(PRICE_OPTIONS, 'price')}</div>
    <div class="filter-group push"><label for="sortSel">Ordenar</label><select id="sortSel" class="sort-select" onchange="setSort(this.value)">${SORT_OPTIONS.map(o => `<option value="${o[0]}" ${F.sort === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div>
  </div>`;
}
function catalogResultsHtml(list){
  if(list.length) return list.map(cardHtml).join('');
  return `<div class="empty-state"><b>Nenhuma receita encontrada</b><p>${F.q ? 'Não achamos nada para "' + esc(F.q) + '" com esses filtros.' : 'Nenhuma receita combina com esses filtros.'} Tente outro termo ou remova algum filtro.</p><button class="btn-dark" onclick="clearFilters()">Limpar filtros</button></div>`;
}
function resultBarHtml(n){
  return `<div class="result-bar"><span><b>${n}</b> receita${n === 1 ? '' : 's'} encontrada${n === 1 ? '' : 's'}${F.cat ? ' em ' + esc(catLabel(F.cat)) : ''}${F.q ? ' para "' + esc(F.q) + '"' : ''}</span>${hasFilters() ? '<span class="link-inline" role="button" tabindex="0" onclick="clearFilters()" onkeydown="if(event.key===\'Enter\')clearFilters()">Limpar filtros</span>' : ''}</div>`;
}
/* repinta tudo menos o campo de busca (para não perder o foco ao digitar) */
function paintCatalog(){
  const set = (id, html) => { const el = document.getElementById(id); if(el) el.innerHTML = html; };
  const list = filteredRecipes();
  set('catalog-banner', catBannerHtml());
  set('catalog-cats', catChipsHtml());
  set('catalog-filters', filterLineHtml());
  set('catalog-count', resultBarHtml(list.length));
  set('recipe-results', catalogResultsHtml(list));
  const box = document.getElementById('catalogSearchBox'); if(box) box.classList.toggle('has-text', !!F.q);
}
function renderRecipes(){
  const list = filteredRecipes();
  return `<div class="wrap page-top catalog-page">
    <div id="catalog-banner">${catBannerHtml()}</div>
    <div class="catalog-search ${F.q ? 'has-text' : ''}" id="catalogSearchBox">
      <svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/></svg>
      <input id="catalogSearch" type="search" autocomplete="off" placeholder="Buscar receitas, chefs ou ingredientes" aria-label="Buscar receitas" value="${esc(F.q)}" oninput="onCatalogSearch(this.value)">
      <button class="clear-x" aria-label="Limpar busca" onclick="clearSearch()"><svg class="icon" style="width:15px;height:15px" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <div id="catalog-cats">${catChipsHtml()}</div>
    <div id="catalog-filters">${filterLineHtml()}</div>
    <div id="catalog-count">${resultBarHtml(list.length)}</div>
    <div class="card-grid" id="recipe-results">${catalogResultsHtml(list)}</div>
    <p class="photo-credit" style="margin-top:-46px;margin-bottom:60px">fotos ilustrativas: Wikimedia Commons</p>
  </div>`;
}
function onCatalogSearch(v){ F.q = v; paintCatalog(); }
function clearSearch(){ F.q = ''; const i = document.getElementById('catalogSearch'); if(i){ i.value = ''; i.focus(); } paintCatalog(); }
function setCat(key){ F.cat = key; paintCatalog(); }
function setFilter(k, v){ F[k] = F[k] === v ? '' : v; paintCatalog(); }
function setSort(v){ F.sort = v; paintCatalog(); }
function clearFilters(){ Object.assign(F, { q:'', cat:'', rest:'', time:'', price:'', sort:'' }); const i = document.getElementById('catalogSearch'); if(i) i.value = ''; paintCatalog(); }

/* entradas vindas de outras telas */
function openCategory(key){ Object.assign(F, { q:'', cat:key || '', rest:'', time:'', price:'', sort:'' }); goToTab('recipes'); }
function openRecipes(q){ Object.assign(F, { q:q || '', cat:'', rest:'', time:'', price:'', sort:'' }); goToTab('recipes'); }
function submitHomeSearch(ev){
  if(ev) ev.stopPropagation();
  const i = document.getElementById('searchInput'), v = i ? i.value.trim() : '';
  const hit = Object.values(SUGGESTIONS).find(x => norm(x.label) === norm(v));
  if(hit){ applySuggestion(Object.keys(SUGGESTIONS).find(k => SUGGESTIONS[k] === hit)); return; }
  openRecipes(v);
}
function applySuggestion(key){
  const s = SUGGESTIONS[key]; if(!s) return;
  Object.assign(F, { q:'', cat:'', rest:'', time:'', price:'', sort:'' }, s.set);
  goToTab('recipes');
}
function goAccount(){ if(currentUser) goToTab('profile'); else { pendingAfterLogin = () => goToTab('profile'); goToTab('login'); } }

/* ---------------------------------------------------------------------
   PERFIL  (#profile) - cozinheiro, criador e administrador
   --------------------------------------------------------------------- */
const STATUS_LABEL = { APROVADO:'Aprovado', PENDENTE:'Pendente de validação', REJEITADO:'Rejeitado' };
const TIPO_LABEL = { chef:'Chef', restaurante:'Restaurante' };
const statusPill = (txt, cls) => `<span class="status-pill s-${esc(String(cls || txt).toLowerCase())}">${esc(txt)}</span>`;
const SVG_PANEL = '<svg class="icon" style="width:15px;height:15px" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>';
const SVG_OUT = '<svg class="icon" style="width:15px;height:15px" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';

function renderProfile(){
  if(!currentUser){
    return `<div class="auth-wrap"><div class="auth-card">
      <h1 class="auth-title">Seu perfil</h1>
      <p class="auth-sub">Entre na sua conta para ver e editar seus dados.</p>
      <button class="auth-submit" onclick="goAccount()">Entrar</button>
      <p class="auth-switch">Não tem conta? <span class="link-inline" onclick="goToTab('register-choice')">Criar conta</span></p>
    </div></div>`;
  }
  const u = currentUser, k = u.kind, c = u.creator;
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  const panelBtn = k === 'admin'
    ? `<button class="primary" onclick="goToTab('admin')">${SVG_PANEL} Painel de administração</button>`
    : k === 'criador' ? `<button class="primary" onclick="goToTab('dashboard')">${SVG_PANEL} Painel do criador</button>`
    : `<button class="primary" onclick="goToTab('recipes')">Explorar receitas</button>`;
  const aside = `<aside class="profile-aside"><div class="profile-card">
      <div class="profile-avatar" aria-hidden="true">${esc(u.name.charAt(0).toUpperCase())}</div>
      <h1 class="profile-name">${esc(u.name)}</h1>
      <p class="profile-mail">${esc(u.email)}</p>
      <div><span class="status-pill">${esc(KIND_LABEL[k])}</span>${c ? ' ' + statusPill(STATUS_LABEL[c.status] || c.status, c.status === 'PENDENTE' ? 'pendente' : c.status === 'REJEITADO' ? 'rejeitado' : 'aprovado') : ''}</div>
      <div class="profile-actions">${panelBtn}<button class="danger" onclick="logout()">${SVG_OUT} Sair da conta</button></div>
    </div></aside>`;

  const dados = `<section class="profile-card"><h2>Dados da conta</h2><p class="pc-sub">Atualize como seu nome aparece na plataforma. O e-mail é o seu login e não pode ser alterado.</p>
      <div class="profile-form two">
        <div class="field"><label for="pfName">Nome completo</label><input id="pfName" value="${esc(u.name)}" autocomplete="name" onkeydown="if(event.key==='Enter')saveProfile()"></div>
        <div class="field"><label for="pfEmail">E-mail</label><input id="pfEmail" value="${esc(u.email)}" disabled></div>
      </div>
      <div class="form-actions"><button class="save-btn" id="pfSave" onclick="saveProfile()">Salvar alterações</button><span class="form-msg" id="pfMsg" role="status"></span></div>
    </section>`;
  const senha = `<section class="profile-card"><h2>Alterar senha</h2><p class="pc-sub">Use ao menos 6 caracteres.</p>
      <div class="profile-form two">
        <div class="field"><label for="pwCur">Senha atual</label><input id="pwCur" type="password" autocomplete="current-password"></div>
        <div class="field"></div>
        <div class="field"><label for="pwNew">Nova senha</label><input id="pwNew" type="password" autocomplete="new-password"></div>
        <div class="field"><label for="pwNew2">Confirmar nova senha</label><input id="pwNew2" type="password" autocomplete="new-password" onkeydown="if(event.key==='Enter')changePassword()"></div>
      </div>
      <div class="form-actions"><button class="save-btn" id="pwSave" onclick="changePassword()">Atualizar senha</button><span class="form-msg" id="pwMsg" role="status"></span></div>
    </section>`;
  const prefs = `<section class="profile-card"><h2>Preferências</h2><p class="pc-sub">Ajustes de aparência neste dispositivo.</p>
      <div class="pref-row"><p>Tema do site<small id="pfThemeNow">${dark ? 'Modo escuro ativado' : 'Modo claro ativado'}</small></p><button class="tiny-btn alt" onclick="toggleDarkMode(); document.getElementById('pfThemeNow').textContent = darkMode ? 'Modo escuro ativado' : 'Modo claro ativado'">Alternar tema</button></div>
    </section>`;
  return `<div class="wrap page-top"><div class="profile-layout">${aside}<div>${dados}${profileRoleHtml()}${senha}${prefs}${dangerZoneHtml()}</div></div></div>`;
}

/* exclusão da conta e de todos os dados (recurso de privacidade) */
function dangerZoneHtml(){
  const k = currentUser.kind;
  if(k === 'admin') return `<section class="profile-card"><h2>Excluir conta</h2><p class="pc-sub" style="margin:0">A conta de administrador não pode ser excluída pelo site, para a plataforma não ficar sem administrador.</p></section>`;
  const itens = k === 'criador'
    ? ['seu cadastro (nome, e-mail e senha) e o perfil de criador, com documento e raio de entrega',
       'todas as suas receitas e kits, inclusive rascunhos',
       'as suas respostas na comunidade e as assinaturas ao seu catálogo',
       'as publicações e os pagamentos feitos com esta conta']
    : ['seu cadastro (nome, e-mail e senha)',
       'as receitas desbloqueadas e as assinaturas',
       'seus pedidos de kit e seus pagamentos',
       'suas publicações na comunidade'];
  const nota = k === 'criador' ? '<p class="pc-sub" style="margin:0 0 18px">As compras que outras pessoas fizeram com você continuam no histórico delas.</p>' : '';
  return `<section class="profile-card danger-zone"><h2>Excluir conta e dados</h2>
    <p class="pc-sub">Esta ação é <b>permanente</b> e não pode ser desfeita. Ao excluir, apagamos:</p>
    <ul class="danger-list">${itens.map(i => '<li>' + i + '</li>').join('')}</ul>${nota}
    <div class="profile-form two">
      <div class="field"><label for="delPass">Sua senha</label><input id="delPass" type="password" autocomplete="current-password"></div>
      <div class="field"><label for="delConfirm">Digite EXCLUIR para confirmar</label><input id="delConfirm" autocomplete="off" placeholder="EXCLUIR" onkeydown="if(event.key==='Enter')deleteAccount()"></div>
    </div>
    <div class="form-actions"><button class="danger-btn" id="delBtn" onclick="deleteAccount()">Excluir minha conta</button><span class="form-msg" id="delMsg" role="status"></span></div>
  </section>`;
}

function profileRoleHtml(){
  const u = currentUser, k = u.kind, c = u.creator;
  if(k === 'admin') return `<section class="profile-card"><h2>Administração</h2><p class="pc-sub">Visão geral da plataforma.</p><div id="profileAdmin"><p class="p-empty">Carregando...</p></div></section>`;
  if(k === 'criador' && c){
    const pub = recipes.filter(r => r.chef === c.chefId).length;
    const pend = c.status === 'PENDENTE' ? '<div class="note-box" style="margin:0 0 18px">Seu perfil está em análise pela curadoria (em até 48h). Assim que for aprovado, você poderá publicar receitas e receber pedidos de kit.</div>'
      : c.status === 'REJEITADO' ? '<div class="note-box" style="margin:0 0 18px;border-left-color:var(--brick)">Seu perfil não foi aprovado pela curadoria. Entre em contato para entender o motivo e reenviar a documentação.</div>' : '';
    return `<section class="profile-card"><h2>Perfil de criador</h2><p class="pc-sub">Dados enviados no cadastro e usados na curadoria.</p>${pend}
      <dl class="info-grid">
        <div><dt>Tipo de perfil</dt><dd>${esc(TIPO_LABEL[c.tipo] || c.tipo)}</dd></div>
        <div><dt>Situação</dt><dd>${statusPill(STATUS_LABEL[c.status] || c.status, c.status === 'PENDENTE' ? 'pendente' : c.status === 'REJEITADO' ? 'rejeitado' : 'aprovado')}</dd></div>
        <div><dt>Raio de entrega</dt><dd>${esc(c.raio)} km</dd></div>
        <div><dt>Documento enviado</dt><dd>${esc(c.doc || 'não informado')}</dd></div>
        <div><dt>Receitas publicadas</dt><dd>${pub}</dd></div>
      </dl>
      <div class="form-actions" style="margin-top:20px"><button class="save-btn" onclick="goToTab('dashboard')">Abrir painel do criador</button>${c.status === 'APROVADO' ? '<button class="tiny-btn alt" onclick="goToTab(\'new-recipe\')">Publicar nova receita</button>' : ''}</div>
    </section>`;
  }
  /* cozinheiro amador */
  const myRecipes = [...unlockedRecipes].map(id => recipes.find(r => r.id === id)).filter(Boolean);
  const subs = [...subscribedChefs].filter(id => chefs[id]);
  const orders = (u.orders || []).slice().reverse();
  const tx = (u.tx || []).slice().reverse().slice(0, 10);
  const myPosts = communityPosts.filter(p => p.userId === u.id).length;
  const TIPO_TX = { receita:'Receita', assinatura:'Assinatura', kit:'Kit de ingredientes' };
  const stats = `<div class="p-stats">
      <div class="p-stat"><b>${myRecipes.length}</b><small>receitas desbloqueadas</small></div>
      <div class="p-stat"><b>${subs.length}</b><small>assinatura${subs.length === 1 ? '' : 's'}</small></div>
      <div class="p-stat"><b>${orders.length}</b><small>pedido${orders.length === 1 ? '' : 's'} de kit</small></div>
      <div class="p-stat"><b>${favorites.size}</b><small>favorita${favorites.size === 1 ? '' : 's'}</small></div>
      <div class="p-stat"><b>${myPosts}</b><small>publicaç${myPosts === 1 ? 'ão' : 'ões'}</small></div>
    </div>`;
  const favList = [...favorites].map(id => recipes.find(r => r.id === id)).filter(Boolean);
  return `<section class="profile-card"><h2>Minha atividade</h2><p class="pc-sub">Resumo do que você já fez no GastroMatch.</p>${stats}</section>
    <section class="profile-card"><h2>Minhas receitas</h2><p class="pc-sub">Receitas que você comprou ou que estão liberadas pelas suas assinaturas.</p>
      ${myRecipes.length ? `<ul class="p-list">${myRecipes.map(r => `<li><span><span class="link-inline" role="button" tabindex="0" onclick="goTo('recipe','${r.id}')">${r.name}</span><small>${esc((chefs[r.chef] || {}).name || '')}</small></span><span class="right">${brl(r.price)}</span></li>`).join('')}</ul>`
        : '<p class="p-empty">Você ainda não desbloqueou nenhuma receita. <span class="link-inline" onclick="goToTab(\'recipes\')">Explorar receitas</span></p>'}
      ${subs.length ? `<h2 style="margin-top:24px;font-size:16px">Assinaturas</h2><div style="margin-top:12px">${subs.map(id => `<span class="chip-static" role="button" tabindex="0" onclick="goTo('chef','${id}')">${esc(chefs[id].name)}</span>`).join('')}</div>` : ''}
    </section>
    <section class="profile-card"><h2>Favoritas</h2><p class="pc-sub">Receitas que você marcou com o coração.</p>
      ${favList.length ? `<ul class="p-list">${favList.map(r => `<li><span><span class="link-inline" role="button" tabindex="0" onclick="goTo('recipe','${r.id}')">${r.name}</span><small>${esc((chefs[r.chef] || {}).name || '')}</small></span><span class="right">${brl(r.price)}</span></li>`).join('')}</ul>` : '<p class="p-empty">Nenhuma receita favoritada ainda.</p>'}
    </section>
    <section class="profile-card"><h2>Pedidos de kit</h2><p class="pc-sub">Acompanhe o status das suas entregas e retiradas.</p>
      ${orders.length ? `<ul class="p-list">${orders.map(o => `<li><span>${esc(o.recipeName || 'Kit')}<small>${esc((chefs[o.chefId] || {}).name || '')} · ${esc(o.entrega === 'retirada' ? 'retirada no local' : 'entrega')} · ${esc(o.date)}</small></span><span style="text-align:right">${statusPill(String(o.status).charAt(0) + String(o.status).slice(1).toLowerCase(), String(o.status).toLowerCase())}<small style="display:block;margin-top:4px;color:var(--brick);font-family:'Fraunces',serif">${brl(o.valor)}</small></span></li>`).join('')}</ul>` : '<p class="p-empty">Você ainda não pediu nenhum kit.</p>'}
    </section>
    <section class="profile-card"><h2>Pagamentos</h2><p class="pc-sub">Últimas transações da sua conta.</p>
      ${tx.length ? `<ul class="p-list">${tx.map(t => `<li><span>${esc(TIPO_TX[t.type] || t.type)}<small>${esc(t.metodo === 'pix' ? 'PIX' : 'Cartão')} · ${esc(t.date)}${t.cupom ? ' · cupom ' + esc(t.cupom) : ''}</small></span><span style="text-align:right">${statusPill(t.status === 'APROVADA' ? 'Aprovada' : 'Recusada', t.status === 'APROVADA' ? 'aprovado' : 'recusada')}<small style="display:block;margin-top:4px;color:var(--brick);font-family:'Fraunces',serif">${brl(t.valor)}</small></span></li>`).join('')}</ul>` : '<p class="p-empty">Nenhum pagamento realizado.</p>'}
    </section>`;
}

/* carrega os números do administrador depois que a tela aparece */
async function profileAfterRender(){
  if(!currentUser || currentUser.kind !== 'admin') return;
  const box = document.getElementById('profileAdmin'); if(!box) return;
  try{
    const d = await API.get('/admin/overview');
    const pend = d.creators.filter(c => c.status === 'PENDENTE').length, ok = d.creators.filter(c => c.status === 'APROVADO').length;
    const total = d.tx.filter(t => t.status === 'APROVADA').reduce((a, t) => a + t.valor, 0);
    if(currentPage !== 'profile') return;
    box.innerHTML = `<div class="p-stats">
      <div class="p-stat"><b>${d.users.length}</b><small>usuários</small></div>
      <div class="p-stat"><b>${pend}</b><small>criador${pend === 1 ? '' : 'es'} em análise</small></div>
      <div class="p-stat"><b>${ok}</b><small>criador${ok === 1 ? '' : 'es'} aprovado${ok === 1 ? '' : 's'}</small></div>
      <div class="p-stat"><b>${d.recipes.length}</b><small>receita${d.recipes.length === 1 ? '' : 's'} de criadores</small></div>
      <div class="p-stat"><b>${brl(total)}</b><small>em pagamentos aprovados</small></div>
    </div><div class="form-actions" style="margin-top:20px"><button class="save-btn" onclick="goToTab('admin')">Abrir painel de administração</button></div>`;
  }catch(e){ box.innerHTML = fmtErr(e); }
}

function setMsg(id, text, ok){ const el = document.getElementById(id); if(!el) return; el.textContent = text || ''; el.className = 'form-msg ' + (text ? (ok ? 'ok' : 'err') : ''); }
async function saveProfile(){
  const name = document.getElementById('pfName').value.trim(), btn = document.getElementById('pfSave');
  if(name.length < 3){ setMsg('pfMsg', 'Informe o nome completo (mínimo 3 letras).'); return; }
  btn.disabled = true; setMsg('pfMsg', '');
  try{
    const r = await API.patch('/me', { name });
    currentUser.name = r.user.name; renderAuthArea();
    const t = document.querySelector('.profile-name'), a = document.querySelector('.profile-avatar');
    if(t) t.textContent = r.user.name; if(a) a.textContent = r.user.name.charAt(0).toUpperCase();
    setMsg('pfMsg', 'Dados atualizados.', true);
  }catch(e){ setMsg('pfMsg', e.message || 'Não foi possível salvar.'); }
  btn.disabled = false;
}
async function changePassword(){
  const cur = document.getElementById('pwCur').value, n1 = document.getElementById('pwNew').value, n2 = document.getElementById('pwNew2').value, btn = document.getElementById('pwSave');
  if(!cur){ setMsg('pwMsg', 'Informe a senha atual.'); return; }
  if(n1.length < 6){ setMsg('pwMsg', 'A nova senha deve ter ao menos 6 caracteres.'); return; }
  if(n1 !== n2){ setMsg('pwMsg', 'A confirmação não confere com a nova senha.'); return; }
  btn.disabled = true; setMsg('pwMsg', '');
  try{
    await API.post('/me/password', { current:cur, password:n1 });
    ['pwCur', 'pwNew', 'pwNew2'].forEach(id => { document.getElementById(id).value = ''; });
    setMsg('pwMsg', 'Senha atualizada.', true);
  }catch(e){ setMsg('pwMsg', e.message || 'Não foi possível atualizar a senha.'); }
  btn.disabled = false;
}

async function deleteAccount(){
  const pass = document.getElementById('delPass').value, conf = document.getElementById('delConfirm').value.trim(), btn = document.getElementById('delBtn');
  if(!pass){ setMsg('delMsg', 'Informe sua senha para confirmar.'); return; }
  if(conf !== 'EXCLUIR'){ setMsg('delMsg', 'Digite EXCLUIR, em letras maiúsculas, para confirmar.'); return; }
  if(!window.confirm('Tem certeza? Sua conta e todos os seus dados serão apagados para sempre.')) return;
  btn.disabled = true; setMsg('delMsg', '');
  try{
    await API.post('/me/delete', { password: pass, confirm: conf });
    favorites.clear();
    await logout();                       /* limpa a sessão e o estado da tela e volta para a home */
    showToast('Sua conta e todos os seus dados foram excluídos.');
  }catch(e){ setMsg('delMsg', e.message || 'Não foi possível excluir a conta.'); btn.disabled = false; }
}

/* ---------------------------------------------------------------------
   PÁGINAS DE INFORMAÇÃO
   --------------------------------------------------------------------- */
const infoBack = '<button class="back-link" onclick="goBack()"><svg class="icon" style="width:14px;height:14px" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> voltar</button>';
const infoWrap = body => `<div class="wrap page-top"><div class="info-page">${infoBack}${body}</div></div>`;

function renderHelp(){
  const faq = [
    ['Como funciona o GastroMatch?', 'Você escolhe uma receita de um chef ou restaurante verificado, desbloqueia a videoaula e o passo a passo, e pode pedir o kit com os ingredientes porcionados para cozinhar em casa.'],
    ['Posso comprar só a receita, sem o kit?', 'Sim. Em cada receita há três opções: desbloquear a receita, assinar o catálogo completo do chef por R$ 29/mês ou pedir o kit de ingredientes.'],
    ['Como sei se o kit chega no meu endereço?', 'Cada chef define um raio de entrega entre 1 e 15 km. No pedido você informa o CEP e o sistema confere a distância. Fora do raio, é possível retirar no estabelecimento.'],
    ['Existe cupom de desconto?', 'Sim, no pagamento você pode informar um cupom válido. Cupons de teste do protótipo: GASTRO10 (10%) e CHEF20 (20%).'],
    ['Posso baixar o vídeo ou a receita?', 'O vídeo é protegido e não permite download. A ficha da receita em PDF pode ser baixada e traz uma marca d\'água com os seus dados.'],
    ['Como me torno um chef parceiro?', 'Crie uma conta de Chef ou Restaurante, envie seu diploma ou CNPJ e aceite o termo sanitário. A curadoria analisa o cadastro em até 48 horas.'],
    ['Quero ver como funciona sem criar conta. Há contas de teste?', 'Sim. Na tela de login há atalhos para uma conta de cozinheiro, de chef aprovado, de chef pendente e de administrador.'],
  ];
  return infoWrap(`<h1>Central de ajuda</h1><p class="lead">Respostas rápidas para as dúvidas mais comuns sobre receitas, kits e pagamentos.</p>
    ${faq.map(f => `<div class="faq-item"><b>${f[0]}</b><p>${f[1]}</p></div>`).join('')}
    <div class="note-box">Não encontrou o que procurava? Veja a página de <span class="link-inline" onclick="goToTab('contact')">contato</span>.</div>`);
}
function renderContact(){
  return infoWrap(`<h1>Contato</h1><p class="lead">O GastroMatch é um protótipo desenvolvido no SENAI/SC Joinville Sul. Por isso ainda não há um canal de atendimento ao público.</p>
    <h2>Dúvidas e sugestões sobre o projeto</h2>
    <p>Quem quiser sugerir melhorias ou relatar um problema pode abrir uma solicitação no repositório do projeto:</p>
    <p><a class="link-inline" href="https://github.com/pedrolimaca/GastroMatch" target="_blank" rel="noopener">github.com/pedrolimaca/GastroMatch</a></p>
    <h2>Quer ser parceiro?</h2>
    <p>Chefs e restaurantes podem se cadastrar direto na plataforma. <span class="link-inline" onclick="goToTab('register-choice')">Criar conta de parceiro</span></p>`);
}
function renderTerms(){
  return infoWrap(`<h1>Termos de uso</h1><p class="lead">Regras gerais para usar o GastroMatch.</p>
    <div class="note-box">Este texto descreve o funcionamento do protótipo e não substitui termos jurídicos definitivos. Os pagamentos são simulados e nenhuma cobrança real é feita.</div>
    <h2>Contas</h2><ul><li>Há três tipos de conta: cozinheiro, criador (chef ou restaurante) e administrador.</li><li>Você é responsável pelas informações do seu cadastro e pela guarda da sua senha.</li></ul>
    <h2>Criadores de conteúdo</h2><ul><li>O perfil só é publicado após a curadoria, mediante diploma válido ou CNPJ ativo.</li><li>Quem vende kits deve aceitar o termo de conformidade sanitária para manipulação e transporte de alimentos.</li><li>O criador define o raio de entrega, de 1 a 15 km, e responde às dúvidas sobre as próprias receitas.</li></ul>
    <h2>Compras</h2><ul><li>É possível comprar uma receita, assinar o catálogo de um chef ou pedir um kit de ingredientes.</li><li>Kits só são entregues dentro do raio do criador; fora dele, a retirada no local fica disponível.</li><li>Vídeos e fichas de receita têm marca d'água e não podem ser redistribuídos.</li></ul>
    <h2>Comunidade</h2><p>Ao publicar fotos, notas e comentários, você declara ser autor do conteúdo e concorda em manter um ambiente respeitoso.</p>`);
}
function renderPrivacy(){
  const mode = typeof API !== 'undefined' ? API.mode() : 'local', local = mode === 'local';
  return infoWrap(`<h1>Política de privacidade</h1><p class="lead">Quais dados o GastroMatch guarda e para quê.</p>
    <div class="note-box">Este texto descreve o funcionamento do protótipo e não substitui uma política de privacidade definitiva.</div>
    <h2>Dados que coletamos</h2><ul><li>Nome, e-mail e senha (a senha é guardada de forma criptografada, nunca em texto puro).</li><li>Para criadores: tipo de perfil, nome do documento enviado e raio de entrega.</li><li>Pedidos, pagamentos simulados, receitas liberadas, assinaturas e publicações na comunidade.</li></ul>
    <h2>Onde ficam os dados</h2><p>${local ? 'Nesta versão, os dados ficam salvos apenas no seu navegador e não são enviados a nenhum servidor.' : mode === 'supabase' ? 'Os dados ficam no banco de dados do projeto (Supabase), com acesso restrito por regras de segurança.' : 'Os dados ficam no banco de dados do servidor do projeto.'} Dados de cartão não são armazenados.</p>
    <h2>Para que usamos</h2><p>Para identificar você, liberar o conteúdo que você comprou, calcular a entrega dos kits e mostrar suas atividades no perfil.</p>
    <h2>Seus direitos</h2><p>Na tela de <span class="link-inline" onclick="goAccount()">perfil</span> você pode atualizar seu nome e sua senha, sair da conta a qualquer momento e <b>excluir sua conta junto com todos os seus dados</b>. A exclusão é permanente e pede a sua senha para confirmar.</p>`);
}

/* ganchos executados depois que uma tela é desenhada */
const pageAfter = { profile: profileAfterRender };
