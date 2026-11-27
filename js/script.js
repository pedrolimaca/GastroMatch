/* ---------------- DATA ---------------- */
const IMG = {
  hero: 'assets/hero.webp',
  mise: 'https://commons.wikimedia.org/wiki/Special:FilePath/Green_curry_ingredients.jpg',
  kitchen: 'assets/kitchen.webp',
  risoto: 'assets/risoto.webp',
  tagliatelle: 'assets/tagliatelle.webp',
  cordeiro: 'assets/cordeiro.webp',
  curry: 'assets/curry.webp',
  pao: 'assets/pao.webp',
  torta: 'assets/torta.webp',
  feijoada: 'assets/feijoada.webp',
  burger: 'https://commons.wikimedia.org/wiki/Special:FilePath/Lamb_Burger_with_Fries_and_Aioli.jpg',
  mousse: 'https://commons.wikimedia.org/wiki/Special:FilePath/Chocolate_Mousse.jpg',
  bowl: 'https://commons.wikimedia.org/wiki/Special:FilePath/BuddhaBowlLot.jpg',
  /* Vídeo opcional do hero e da aba "Vídeo" das receitas (arquivo .webm ou .mp4).
     Enquanto estiver vazio, o hero usa a foto e a aba mostra um aviso. Se usar um
     vídeo, lembre de creditar o autor no rodapé (index.html, id="videoCredit"). */
  heroVideo: '',
};

const chefs = {
  torino: { name:'Osteria Torino', person:'Chef Marina Kohl', initial:'M', city:'Joinville, SC', distance:'2,3 km', radius:'5 km',
    stats:{receitas:32, alunos:1240, avaliacao:4.9},
    bio:'Cozinha italiana contemporânea no centro de Joinville. A chef Marina Kohl compartilha técnicas de massas e risotos direto do salão do restaurante.',
    cover: IMG.kitchen },
  renato: { name:'Chef Renato Aveiro', person:'Chef Renato Aveiro', initial:'R', city:'Joinville, SC', distance:'4,1 km', radius:'8 km',
    stats:{receitas:14, alunos:530, avaliacao:4.9},
    bio:'Ex-sous chef de restaurante estrelado, hoje ensina cortes nobres e cocção lenta direto da própria cozinha.',
    cover: IMG.cordeiro },
  siam: { name:'Casa Siam', person:'Chef Anong Suwan', initial:'A', city:'Joinville, SC', distance:'3,0 km', radius:'6 km',
    stats:{receitas:21, alunos:860, avaliacao:4.7},
    bio:'Referência em comida tailandesa na região, com pastas de curry preparadas artesanalmente todos os dias.',
    cover: IMG.curry },
  bosque: { name:'Padaria do Bosque', person:'Panificação artesanal', initial:'P', city:'Joinville, SC', distance:'1,4 km', radius:'4 km',
    stats:{receitas:18, alunos:2100, avaliacao:4.9},
    bio:'Fermentação natural, sem pressa. A padaria ensina o processo completo do levain ao forno de pedra.',
    cover: IMG.pao },
  lume: { name:'Confeitaria Lume', person:'Chef Bia Lume', initial:'B', city:'Joinville, SC', distance:'2,8 km', radius:'5 km',
    stats:{receitas:26, alunos:980, avaliacao:4.8},
    bio:'Confeitaria autoral especializada em tortas e sobremesas com toque cítrico e sazonal.',
    cover: IMG.torta },
  recanto: { name:'Recanto Mineiro', person:'Chef Joana Ribeiro', initial:'J', city:'Joinville, SC', distance:'3,6 km', radius:'6 km',
    stats:{receitas:19, alunos:740, avaliacao:4.8},
    bio:'Comida mineira de raiz, feita no fogão a lenha do jeito que a vó fazia - agora ensinada em vídeoaula.',
    cover: IMG.feijoada },
  bufalo: { name:'Búfalo Burgers', person:'Chef Théo Duarte', initial:'T', city:'Joinville, SC', distance:'2,0 km', radius:'5 km',
    stats:{receitas:11, alunos:1580, avaliacao:4.7},
    bio:'Hambúrgueres autorais com blend próprio e pão de brioche feito na casa, direto da hamburgueria mais pedida da cidade.',
    cover: IMG.burger },
  verde: { name:'Verde Vivo', person:'Chef Sofia Martins', initial:'S', city:'Joinville, SC', distance:'1,9 km', radius:'4 km',
    stats:{receitas:16, alunos:690, avaliacao:4.9},
    bio:'Cozinha vegetariana contemporânea, com bowls e pratos coloridos feitos com produtores locais.',
    cover: IMG.bowl },
};

function demoRecipe(id){
  const recipe = Checkout.demoRecipe(id);
  return { ...recipe, chef:recipe.chefId };
}

const recipes = [
  { ...demoRecipe('risoto-funghi'), time:'45 min', difficulty:'média', portions:'2 pessoas', rating:4.8, reviews:312, kitsLeft:4, img:IMG.risoto, restricao:'sem restrição',
    kit:[['Arroz arbóreo','200g'],['Funghi porcini seco','15g'],['Caldo de legumes artesanal','500ml'],['Parmesão ralado na hora','60g'],['Manteiga e vinho branco','1 dose']],
    instrucoes:['Hidrate o funghi porcini em água morna por 15 min e reserve o líquido.','Refogue a cebola na manteiga até ficar translúcida.','Adicione o arroz arbóreo e toste por 2 min.','Vá adicionando o caldo quente aos poucos, mexendo sempre.','Finalize com o funghi picado, parmesão e um fio de azeite.'],
    testi:{quote:'Segui certinho e ficou idêntico ao prato do restaurante.', name:'Camila R.'} },
  { ...demoRecipe('tagliatelle-ragu'), time:'1h10', difficulty:'fácil', portions:'2 pessoas', rating:4.7, reviews:184, kitsLeft:6, img:IMG.tagliatelle, restricao:'sem restrição',
    kit:[['Tagliatelle fresco','250g'],['Molho ragu de carne','400g'],['Parmesão ralado na hora','50g'],['Manjericão fresco','1 maço']],
    instrucoes:['Cozinhe o tagliatelle fresco em água fervente com sal por 3 min.','Aqueça o ragu em fogo baixo até ferver suavemente.','Escorra a massa e misture ao molho na panela.','Sirva com parmesão ralado e manjericão fresco por cima.'],
    testi:{quote:'O molho pronto no kit foi o diferencial, não precisei correr atrás de nada.', name:'Bruno S.'} },
  { ...demoRecipe('cordeiro-porto'), time:'2h20', difficulty:'difícil', portions:'2 pessoas', rating:4.9, reviews:96, kitsLeft:2, img:IMG.cordeiro, restricao:'sem glúten',
    kit:[['Pernil de cordeiro','600g'],['Vinho do Porto','200ml'],['Batatas rústicas','400g'],['Ervas frescas','1 maço']],
    instrucoes:['Tempere o cordeiro com sal, pimenta e ervas frescas.','Sele a carne em fogo alto até dourar todos os lados.','Deglace com o vinho do Porto e deixe reduzir.','Leve ao forno a 160°C por 1h30 com as batatas.','Deixe descansar 10 min antes de fatiar.'],
    testi:{quote:'Achei que fosse complicado, mas o passo a passo em vídeo resolveu tudo.', name:'Diego F.'} },
  { ...demoRecipe('curry-verde'), time:'50 min', difficulty:'média', portions:'2 pessoas', rating:4.6, reviews:145, kitsLeft:5, img:IMG.curry, restricao:'sem glúten',
    kit:[['Pasta de curry verde','80g'],['Leite de coco','400ml'],['Frango em cubos','300g'],['Berinjela tailandesa','150g']],
    instrucoes:['Refogue a pasta de curry verde até soltar aroma.','Adicione o leite de coco aos poucos, mexendo bem.','Junte o frango e cozinhe até dourar por fora.','Acrescente a berinjela e cozinhe por 10 min.','Ajuste o sal e sirva com arroz jasmim.'],
    testi:{quote:'Pasta de curry fresquinha, muito mais saborosa que a de mercado.', name:'Larissa T.'} },
  { ...demoRecipe('pao-fermentacao'), time:'3h + fermentação', difficulty:'fácil', portions:'1 pão grande', rating:4.9, reviews:401, kitsLeft:8, img:IMG.pao, restricao:'vegano',
    kit:[['Farinha especial','500g'],['Fermento natural (levain)','100g'],['Sal marinho','10g']],
    instrucoes:['Misture a farinha, o levain, o sal e a água até formar uma massa homogênea.','Deixe descansar 30 min e faça as primeiras dobras.','Repita as dobras a cada 30 min por 2h.','Modele e deixe fermentar na geladeira por 8-12h.','Asse em forno bem quente com vapor por 40 min.'],
    testi:{quote:'Meu levain nunca tinha funcionado até eu comprar o kit certo.', name:'Marcos V.'} },
  { ...demoRecipe('torta-limao'), time:'1h + geladeira', difficulty:'fácil', portions:'8 fatias', rating:4.8, reviews:210, kitsLeft:3, img:IMG.torta, restricao:'vegetariano',
    kit:[['Massa sablée pronta','1 disco'],['Limão siciliano','4 un'],['Leite condensado','1 lata'],['Claras para merengue','4 un']],
    instrucoes:['Pré-asse a massa sablée por 12 min a 180°C.','Bata o leite condensado com o suco e raspas de limão.','Despeje o recheio sobre a massa e leve à geladeira por 2h.','Bata as claras em neve para o merengue e finalize com maçarico.'],
    testi:{quote:'Kit chegou super fresco, só faltou eu ter mais paciência com o merengue.', name:'Ana P.'} },
  { ...demoRecipe('feijoada-completa'), time:'3h', difficulty:'média', portions:'4 pessoas', rating:4.9, reviews:268, kitsLeft:5, img:IMG.feijoada, restricao:'sem glúten',
    kit:[['Feijão preto selecionado','500g'],['Carnes defumadas variadas','700g'],['Linguiça artesanal','300g'],['Couve fresca','1 maço'],['Farinha de mandioca torrada','200g']],
    instrucoes:['Deixe o feijão de molho por 4h e cozinhe na panela de pressão.','Refogue as carnes defumadas e a linguiça em fogo médio.','Junte tudo ao feijão e cozinhe por 1h30 em fogo baixo.','Refogue a couve fatiada fina na hora de servir.','Sirva com farinha torrada e arroz branco.'],
    testi:{quote:'Gostinho de comida de vó, sem passar o domingo inteiro na cozinha.', name:'Rafael M.'} },
  { ...demoRecipe('hamburguer-artesanal'), time:'35 min', difficulty:'fácil', portions:'2 pessoas', rating:4.7, reviews:157, kitsLeft:7, img:IMG.burger, restricao:'sem restrição',
    kit:[['Blend de cordeiro moído','300g'],['Pão brioche artesanal','2 un'],['Molho aioli da casa','80g'],['Batata rústica congelada','300g']],
    instrucoes:['Modele os hambúrgueres sem apertar demais a carne.','Sele em chapa bem quente, 3 min de cada lado.','Toste o pão brioche na manteiga.','Monte com aioli, hambúrguer e acompanhamentos.','Sirva com a batata rústica assada.'],
    testi:{quote:'Melhor hambúrguer que já fiz em casa, o blend faz toda diferença.', name:'Pedro L.'} },
  { ...demoRecipe('bowl-vegetariano'), time:'30 min', difficulty:'fácil', portions:'2 pessoas', rating:4.8, reviews:132, kitsLeft:6, img:IMG.bowl, restricao:'vegano',
    kit:[['Quinoa cozida','200g'],['Legumes assados da estação','300g'],['Grão-de-bico temperado','150g'],['Molho tahine','60ml']],
    instrucoes:['Aqueça a quinoa e os legumes assados.','Monte o bowl distribuindo os ingredientes em seções.','Finalize com o grão-de-bico temperado por cima.','Regue com o molho tahine antes de servir.'],
    testi:{quote:'Colorido, leve e muito mais gostoso do que eu esperava.', name:'Beatriz C.'} },
  { ...demoRecipe('mousse-chocolate'), time:'25 min + geladeira', difficulty:'fácil', portions:'4 pessoas', rating:4.9, reviews:189, kitsLeft:6, img:IMG.mousse, restricao:'vegetariano',
    kit:[['Chocolate 70% em gotas','200g'],['Creme de leite fresco','300ml'],['Ovos caipiras','3 un'],['Flor de sal','1 pitada']],
    instrucoes:['Derreta o chocolate em banho-maria.','Bata as claras em neve e o creme de leite em chantilly separadamente.','Misture as gemas ao chocolate morno.','Incorpore delicadamente o chantilly e depois as claras.','Leve à geladeira por pelo menos 3h antes de servir.'],
    testi:{quote:'Textura aerada, muito diferente da mousse de pacotinho.', name:'Isabela G.'} },
];

const categories = [
  { key:'alta', label:'Alta gastronomia', img:IMG.risoto, recipe:'risoto-funghi' },
  { key:'massas', label:'Massas', img:IMG.tagliatelle, recipe:'tagliatelle-ragu' },
  { key:'carnes', label:'Carnes', img:IMG.cordeiro, recipe:'cordeiro-porto' },
  { key:'brasileiras', label:'Brasileiras', img:IMG.feijoada, recipe:'feijoada-completa' },
  { key:'vegetarianas', label:'Vegetarianas', img:IMG.bowl, recipe:'bowl-vegetariano' },
  { key:'sobremesas', label:'Sobremesas', img:IMG.mousse, recipe:'mousse-chocolate' },
];

const findRecipe = id => recipes.find(r => r.id === id) || window.draftRecipes.find(r => r.id === id);
const recipeById = id => findRecipe(id) || recipes[0];
const brl = n => 'R$ ' + n.toFixed(2).replace('.', ',');
const AVATAR_TONES = ['var(--brick)','var(--olive)','var(--yolk)','#6b5b3e'];
const STARS5 = '★★★★★';
const favorites = new Set();

/* ---------------- THEME (dark mode) ---------------- */
let darkMode = false;
const SUN_ICON = '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M4.3 4.3l1.8 1.8M17.9 17.9l1.8 1.8M2.5 12h2.6M18.9 12h2.6M4.3 19.7l1.8-1.8M17.9 6.1l1.8-1.8"/></svg>';
const MOON_ICON = '<svg class="icon" viewBox="0 0 24 24"><path d="M20 14.2A8.5 8.5 0 1 1 9.8 4a7 7 0 0 0 10.2 10.2z"/></svg>';
function applyTheme(){
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  const btn = document.getElementById('themeToggle');
  if(btn) btn.innerHTML = darkMode ? SUN_ICON : MOON_ICON;
  const drawerLabel = document.getElementById('drawerThemeLabel');
  if(drawerLabel) drawerLabel.textContent = darkMode ? 'Modo claro' : 'Modo escuro';
}
function toggleDarkMode(){ darkMode = !darkMode; try{ localStorage.setItem('gm-theme', darkMode?'dark':'light'); }catch(e){} applyTheme(); }
function initTheme(){
  try{ darkMode = localStorage.getItem('gm-theme') === 'dark'; }catch(e){ darkMode = false; }
  applyTheme();
}

/* ---------------- AUTH STATE (RF05 / RF01 - no backend, in-memory only) ---------------- */
let currentUser = null; // { name, email, kind:'amador'|'criador', profileType, status }
let pendingAfterLogin = null; // {page,id} to resume after login
const unlockedRecipes = new Set();   // RF03 pay-per-view
const subscribedChefs = new Set();   // RF03 assinatura
const myOrders = [];                 // RF04 pedidos de kit

function requireLogin(action){
  if(currentUser){ action(); return; }
  pendingAfterLogin = action;
  showToast('Entre na sua conta para continuar.');
  goToTab('login');
}

/* ---------------- ROUTER ---------------- */
let currentPage = 'home';
let currentId = null;

function pushHistory(page, id){
  try{ history.pushState({page, id}, '', '#'+page+(id ? ('/'+id) : '')); }catch(e){ /* sandboxed iframe: ignore */ }
}
function goTo(page, id){ currentPage=page; currentId=id; pushHistory(page,id); render(); }
function goToTab(page){ currentPage=page; currentId=null; pushHistory(page,null); render(); }
function goBack(){
  try{ history.back(); }catch(e){ currentPage='home'; currentId=null; render(); }
}
function readLocation(){
  const [page, id = null, ...extra] = location.hash.slice(1).split('/');
  currentPage = !extra.length && Object.hasOwn(pageRenderers, page) ? page : 'home';
  currentId = id;
}

function navScroll(anchorId){
  if(currentPage!=='home'){ goToTab('home'); setTimeout(()=>scrollToAnchor(anchorId), 120); }
  else scrollToAnchor(anchorId);
}
function scrollToAnchor(id){ const el=document.getElementById(id); if(el) el.scrollIntoView({behavior:'smooth', block:'start'}); }
function topTabFor(page){
  if(page==='community') return 'community';
  if(page==='recipes') return 'recipes';
  if(['profile','dashboard','admin','new-recipe'].includes(page)) return 'profile';
  return 'home';
}

function openDrawer(){ document.getElementById('drawer').classList.add('open'); document.getElementById('drawerBackdrop').classList.add('open'); }
function closeDrawer(){ document.getElementById('drawer').classList.remove('open'); document.getElementById('drawerBackdrop').classList.remove('open'); }

/* ---------------- NAV SCROLLSPY (desktop yellow indicator) ---------------- */
let scrollSpyKey = 'home';
let spyObserver = null;
function currentNavKey(){
  if(currentPage==='home') return scrollSpyKey || 'home';
  if(currentPage==='community') return 'community';
  if(currentPage==='recipes') return 'receitas';
  return null;
}
function initScrollSpy(){
  if(spyObserver){ spyObserver.disconnect(); spyObserver=null; }
  scrollSpyKey = 'home';
  const map = { 'hero-sec':'home', 'cat-grid':'receitas', 'chef-grid':'chefs', 'partner':'restaurantes' };
  const targets = Object.keys(map).map(id=>document.getElementById(id)).filter(Boolean);
  if(!targets.length || !('IntersectionObserver' in window)) return;
  spyObserver = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ scrollSpyKey = map[e.target.id]; updateActiveTab(); } });
  }, { rootMargin:'-35% 0px -55% 0px', threshold:0 });
  targets.forEach(t=>spyObserver.observe(t));
}

function updateActiveTab(){
  const navKey = currentNavKey();
  document.querySelectorAll('.desktop-nav .tab-link[data-nav]').forEach(el => el.classList.toggle('active', el.dataset.nav === navKey));
  const nav = document.querySelector('.desktop-nav');
  const activeEl = nav ? nav.querySelector('.tab-link.active') : null;
  const indicator = document.getElementById('navIndicator');
  if (nav && activeEl && indicator){ indicator.style.left=activeEl.offsetLeft+'px'; indicator.style.width=activeEl.offsetWidth+'px'; indicator.style.opacity='1'; }
  else if(indicator){ indicator.style.opacity='0'; }
  const activePage = topTabFor(currentPage);
  document.querySelectorAll('.bt-item[data-page]').forEach(el => el.classList.toggle('active', el.dataset.page === activePage));
  const bt = document.getElementById('bottomTabs');
  const btActive = bt ? bt.querySelector('.bt-item.active') : null;
  const btIndicator = document.getElementById('btIndicator');
  if (bt && btActive && btIndicator){ btIndicator.style.left=btActive.offsetLeft+'px'; btIndicator.style.width=btActive.offsetWidth+'px'; }
  if (bt) bt.style.display = (currentPage === 'recipe' || currentPage==='login' || currentPage.startsWith('register') || currentPage==='checkout') ? 'none' : '';
}

function toggleChip(el){ el.parentElement.querySelectorAll('.chip').forEach(c=>c.classList.remove('on')); el.classList.add('on'); }

function showToast(msg){
  const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(window._toastTimer); window._toastTimer=setTimeout(()=>t.classList.remove('show'),3400);
}
function toggleFav(ev, id){
  ev.stopPropagation();
  const el = ev.currentTarget;
  if(favorites.has(id)) favorites.delete(id); else favorites.add(id);
  el.classList.toggle('fav', favorites.has(id));
  el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
}
function animateCounters(){
  document.querySelectorAll('[data-target]').forEach(el=>{
    const target=parseFloat(el.dataset.target); const prefix=el.dataset.prefix||''; const start=performance.now(); const duration=900;
    function tick(now){ const p=Math.min(1,(now-start)/duration); const eased=1-Math.pow(1-p,3); el.textContent=prefix+Math.round(target*eased).toLocaleString('pt-BR'); if(p<1) requestAnimationFrame(tick); }
    requestAnimationFrame(tick);
  });
}
function initReveals(){
  const els = document.querySelectorAll('.reveal:not(.in)');
  if(!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches){
    els.forEach(el=>el.classList.add('in')); return;
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold:.18 });
  els.forEach(el=>io.observe(el));
}

/* ---------------- HERO VIDEO (scroll-scrub effect) ---------------- */
let heroVideoReady = false;
function initHero(){
  const hero = document.querySelector('.hero');
  const bg = document.querySelector('.hero-bg');
  const media = document.getElementById('heroVideo');
  heroVideoReady = false;
  if(!hero) return;
  requestAnimationFrame(()=>{ bg && bg.classList.add('in'); hero.classList.add('in'); });
  if(media){
    media.addEventListener('loadedmetadata', ()=>{ heroVideoReady = true; media.pause(); updateHeroScroll(); }, { once:true });
    // start it briefly so the first frame is decoded, then pause and hand control to scroll
    Promise.resolve(media.play()).then(()=>{ setTimeout(()=>{ media.pause(); heroVideoReady = true; updateHeroScroll(); }, 60); }).catch(()=>{ /* autoplay blocked - scroll scrub still works once user interacts */ });
  }
  initScrollSpy();
  updateHeroScroll();
}
function updateHeroScroll(){
  if(currentPage !== 'home') return;
  const hero = document.querySelector('.hero');
  const media = document.getElementById('heroVideo');
  const inner = document.querySelector('.hero-inner');
  if(!hero) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const heroH = hero.offsetHeight || window.innerHeight;
  const p = Math.min(1, Math.max(0, window.scrollY / heroH));
  if(inner) inner.style.opacity = String(1 - p*1.1);
  if(reduced) return;
  // scroll-scrubbed video: playback position follows scroll progress through the hero
  if(media && heroVideoReady && media.duration && isFinite(media.duration)){
    const target = p * media.duration;
    if(Math.abs(media.currentTime - target) > 0.05){ try{ media.currentTime = target; }catch(e){} }
  }
  if(media) media.style.transform = `scale(${1 + p*0.06})`;
}
function handleHeroPointerEnter(){
  // subtle motion cue: gently plays a couple of frames forward while hovering, like a "wake up" tick
  const media = document.getElementById('heroVideo');
  if(!media || !heroVideoReady || currentPage!=='home') return;
  Promise.resolve(media.play()).then(()=>{ setTimeout(()=>{ media.pause(); }, 220); }).catch(()=>{});
}
function toggleSearch(open){ const el = document.getElementById('searchSuggest'); if(el) el.classList.toggle('open', open); }

/* ---------------- SMALL PARTIALS ---------------- */
function photoHtml(url, badge){
  const style = 'background-image:url(' + JSON.stringify(String(url || '')) + ')';
  return '<div class="photo-img" style="' + esc(style) + '"></div><div class="photo-shade"></div>' + (badge ? '<span class="badge">'+badge+'</span>' : '');
}
function avatarHtml(name, size){
  const initial = name.trim().charAt(0).toUpperCase();
  let sum=0; for(const ch of name) sum += ch.charCodeAt(0);
  const tone = AVATAR_TONES[sum % AVATAR_TONES.length];
  return '<div class="post-avatar" style="background:'+tone+'; width:'+size+'px; height:'+size+'px; font-size:'+Math.round(size*.42)+'px">'+esc(initial)+'</div>';
}
function ratingHtml(rating, reviews){ return '<span class="rating"><span class="stars">★</span>'+rating+(reviews?' <span style="opacity:.75">('+reviews+')</span>':'')+'</span>'; }
function heartHtml(id){
  const fav = favorites.has(id) ? ' fav' : '';
  return '<button class="heart'+fav+'" onclick="toggleFav(event,\''+id+'\')"><svg viewBox="0 0 24 24"><path d="M12 21s-7-4.4-9.6-9C.6 8.7 2 5 5.6 5c2 0 3.4 1.1 4.4 2.6C11 6.1 12.4 5 14.4 5 18 5 19.4 8.7 21.6 12 19 16.6 12 21 12 21z"/></svg></button>';
}
function cardHtml(r){
  const c = chefs[r.chef];
  return '<div class="mcard" onclick="goTo(\'recipe\',\''+r.id+'\')" role="button" tabindex="0" onkeydown="if(event.key===\'Enter\')goTo(\'recipe\',\''+r.id+'\')"><div class="mswatch photo">'+photoHtml(r.img, r.difficulty)+heartHtml(r.id)+'</div>'+
    '<h4>'+r.name+'</h4><p class="mby">'+c.name+'</p>'+
    '<div class="mcard-foot">'+ratingHtml(r.rating, r.reviews)+'<span class="mprice">'+brl(r.price)+'</span></div></div>';
}

/* ---------------- PAGE RENDERERS ---------------- */
function renderHome(){
  const featured = recipeById('risoto-funghi');
  const fc = chefs[featured.chef];
  const featSide = ['hamburguer-artesanal','mousse-chocolate','feijoada-completa'].map(recipeById);
  const trending = ['tagliatelle-ragu','bowl-vegetariano','curry-verde','pao-fermentacao'].map(recipeById);
  return `
  <section class="hero" id="hero-sec" onpointerenter="handleHeroPointerEnter()">
    <div class="hero-bg" id="heroBg">
      ${IMG.heroVideo ? `<video class="hero-video" id="heroVideo" muted loop playsinline preload="auto" poster="${IMG.hero}" src="${IMG.heroVideo}" onerror="this.style.display='none'"></video>` : ''}
      <div class="hero-bg-img" id="heroFallback" style="background-image:url('${IMG.hero}')"></div>
    </div>
    <div class="hero-shade"></div>
    <div class="hero-inner">
      <div class="hero-eyebrow">GASTROMATCH - EXPERIÊNCIAS GASTRONÔMICAS</div>
      <h1 class="hero-title">O próximo <i>prato</i> começa aqui.</h1>
      <p class="hero-sub">Aprenda com quem entende. Receitas exclusivas, técnicas profissionais e ingredientes na medida certa, direto do chef para a sua cozinha.</p>
      <div class="hero-ctas">
        <button class="btn-primary" onclick="navScroll('cat-grid')">Explorar experiências</button>
        <button class="btn-outline" onclick="goTo('recipe','${featured.id}')">Quero cozinhar</button>
      </div>
    </div>
    <div class="hero-scroll">role para descobrir</div>
  </section>

  <div class="search-block reveal">
    <div class="search-row" onclick="document.getElementById('searchInput').focus()">
      <svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/></svg>
      <input id="searchInput" type="search" autocomplete="off" placeholder="O que você está com vontade de cozinhar?" aria-label="Buscar receitas" onfocus="toggleSearch(true)" onblur="setTimeout(()=>toggleSearch(false),200)" onkeydown="if(event.key==='Enter')submitHomeSearch()">
      <button class="search-go" onclick="submitHomeSearch(event)">Buscar</button>
    </div>
    <div class="search-suggest" id="searchSuggest">
      <div class="suggest-chips">
        ${Object.entries(SUGGESTIONS).map(([k,v])=>`<button class="sugg" onclick="applySuggestion('${k}')">${v.label}</button>`).join('')}
      </div>
    </div>
  </div>

  <div class="wrap">
    <div class="trust-row reveal" style="margin-top:56px">
      <div class="trust-item"><svg class="icon" style="width:15px;height:15px" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> chefs e restaurantes verificados</div>
      <div class="trust-item"><svg class="icon" style="width:15px;height:15px" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="10" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg> conteúdo protegido com marca d'água</div>
      <div class="trust-item"><svg class="icon" style="width:15px;height:15px" viewBox="0 0 24 24"><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/></svg> kits com entrega georreferenciada</div>
    </div>

    <section class="sec" id="cat-grid">
      <div class="sec-head reveal"><h2>O que combina com o seu momento?</h2><div><p>Escolha uma categoria para ver todas as receitas dela.</p><span class="sec-link" style="margin-top:14px" role="button" tabindex="0" onclick="openCategory('')" onkeydown="if(event.key==='Enter')openCategory('')">Ver todas as receitas <svg class="icon" style="width:14px;height:14px" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span></div></div>
      <div class="cat-grid">
        ${categories.map((c,i)=>`
        <div class="cat-tile reveal reveal${(i%4)+1} photo" role="button" tabindex="0" onclick="openCategory('${c.key}')" onkeydown="if(event.key==='Enter')openCategory('${c.key}')">
          ${photoHtml(c.img)}
          <div class="cat-tile-label"><b>${c.label}</b><span>${recipes.filter(r=>catOf(r)===c.key).length} receita${recipes.filter(r=>catOf(r)===c.key).length===1?'':'s'}</span></div>
        </div>`).join('')}
      </div>
    </section>

    <section class="sec" style="padding-top:0">
      <div class="sec-head reveal"><h2>Receitas que estão fazendo sucesso</h2><p>Selecionadas pela comunidade nos últimos 30 dias.</p></div>
      <div class="success-grid">
        <div class="success-card photo reveal" onclick="goTo('recipe','${featured.id}')">
          ${photoHtml(featured.img)}${heartHtml(featured.id)}
          <div class="success-card-info">
            <div class="feat-meta" style="margin-bottom:8px">${ratingHtml(featured.rating, featured.reviews)}<span>${featured.time}</span><span>${featured.difficulty}</span></div>
            <h3>${featured.name}</h3>
            <span class="success-by">${fc.name}, ${brl(featured.price)}</span>
          </div>
        </div>
        ${featSide.map((r,i)=>`
        <div class="success-card photo reveal reveal${i+2}" onclick="goTo('recipe','${r.id}')">
          ${photoHtml(r.img)}${heartHtml(r.id)}
          <div class="success-card-info"><h3>${r.name}</h3><div class="feat-meta">${ratingHtml(r.rating)}<span>${r.time}</span></div></div>
        </div>`).join('')}
      </div>
    </section>
  </div>

  <section class="story reveal">
    <div class="wrap">
      <div class="story-img photo">${photoHtml(IMG.mise)}</div>
      <div>
        <div class="story-eyebrow">MISE EN PLACE</div>
        <h2>Do restaurante para a sua cozinha.</h2>
        <div class="story-steps">
          <div class="story-step"><span class="num">1</span><div><h4>Escolha o prato</h4><p>Navegue por receitas validadas por chefs com CNPJ e formação comprovada.</p></div></div>
          <div class="story-step"><span class="num">2</span><div><h4>Receba os ingredientes porcionados</h4><p>O restaurante prepara e envia o kit já higienizado, na medida exata da receita.</p></div></div>
          <div class="story-step"><span class="num">3</span><div><h4>Acompanhe o chef</h4><p>Quando disponível, assista à videoaula e use o passo a passo com ficha em PDF.</p></div></div>
          <div class="story-step"><span class="num">4</span><div><h4>Finalize em casa</h4><p>Sem sobra de ingrediente, sem ida ao mercado no meio do preparo.</p></div></div>
          <div class="story-step"><span class="num">5</span><div><h4>Compartilhe o resultado</h4><p>Publique na comunidade e tire dúvidas direto com quem criou a receita.</p></div></div>
        </div>
      </div>
    </div>
  </section>

  <div class="wrap">
    <section class="sec" style="padding-bottom:0" id="nearby">${nearbyHtml()}</section>

    <section class="sec">
      <div class="sec-head reveal"><h2>Conheça quem está por trás do prato.</h2><p>Cada perfil passa por curadoria - só chef formado ou restaurante com CNPJ ativo entra na plataforma.</p></div>
      <div class="chef-grid" id="chef-grid">
        ${Object.entries(chefs).map(([id,c],i)=>`
        <div class="chef-tile photo reveal reveal${(i%4)+1}" onclick="goTo('chef','${id}')">
          ${photoHtml(c.cover)}
          <span class="chef-verified"><svg class="icon" style="width:11px;height:11px" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> verificado</span>
          <div class="chef-tile-info"><b>${c.name}</b><span>${c.person}, ${c.stats.receitas} receitas</span></div>
        </div>`).join('')}
      </div>
    </section>

    <section class="sec" id="partner">
      <div class="partner reveal">
        <div>
          <div class="story-eyebrow" style="color:#c8a45e">PARA RESTAURANTES E CHEFS</div>
          <h2>Seu conhecimento pode ir muito além da cozinha.</h2>
          <p>Transforme técnica de salão em receita, aula e kit monetizável - com a marca do seu restaurante protegida em cada entrega.</p>
          <ul class="partner-list">
            <li><svg class="icon" style="width:15px;height:15px" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> Venda receitas, videoaulas e kits</li>
            <li><svg class="icon" style="width:15px;height:15px" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> Atraia novos clientes para o salão físico</li>
            <li><svg class="icon" style="width:15px;height:15px" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> Conteúdo protegido com marca d'água</li>
          </ul>
          <button class="btn-primary" onclick="goToTab('register-choice')">Quero ser um parceiro</button>
        </div>
        <div class="partner-visual photo">${photoHtml(chefs.torino.cover)}</div>
      </div>
    </section>

    <section class="sec">
      <div class="sec-head reveal"><h2>Quem já cozinhou</h2><p>Avaliações reais de quem já recebeu um kit ou assistiu a uma aula.</p></div>
      <div class="testi-grid reveal">
        <div class="testi-card"><span class="stars">${STARS5}</span><p>"${recipeById('risoto-funghi').testi.quote}"</p><span class="who">${recipeById('risoto-funghi').testi.name}, Risoto de Funghi</span></div>
        <div class="testi-card"><span class="stars">${STARS5}</span><p>"${recipeById('hamburguer-artesanal').testi.quote}"</p><span class="who">${recipeById('hamburguer-artesanal').testi.name}, Hambúrguer Artesanal de Cordeiro</span></div>
        <div class="testi-card"><span class="stars">${STARS5}</span><p>"${recipeById('feijoada-completa').testi.quote}"</p><span class="who">${recipeById('feijoada-completa').testi.name}, Feijoada Completa</span></div>
      </div>
    </section>

    <section class="sec" style="padding-top:0">
      <div class="sec-head reveal"><h2>As mais bem avaliadas</h2><p>Uma amostra do catálogo. Veja todas as receitas com busca e filtros.</p></div>
      <div class="card-grid">${recipes.slice().sort((x,y)=>(y.rating||0)-(x.rating||0)).slice(0,4).map(cardHtml).join('')}</div>
      <div class="more-row"><button class="btn-dark" onclick="openCategory('')">Ver todas as ${recipes.length} receitas <svg class="icon" style="width:15px;height:15px" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></button></div>
      <p class="photo-credit">fotos ilustrativas: Wikimedia Commons</p>
    </section>
  </div>
  `;
}

/* -------- aba "Vídeo" da receita -------- */
function videoPlayerHtml(source, poster = ''){
  const alternative = source.url
    ? `<a class="link-inline" href="${esc(source.url)}" target="_blank" rel="noopener">Abrir vídeo na origem</a>` : '';
  if(source.type === 'embed') return `<div class="lesson-video">
    <iframe title="Player da videoaula" src="${esc(source.src)}" allow="fullscreen; picture-in-picture"
      referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    <p>Se o provedor impedir a reprodução aqui, use o link. ${alternative}</p>
    </div>`;
  if(source.type === 'file') return `<div class="lesson-video">
    <video controls playsinline preload="metadata" poster="${esc(poster)}" src="${esc(source.src)}"
      aria-label="Player da videoaula" onerror="this.nextElementSibling.hidden=false"></video>
    <p role="status" hidden>Não foi possível reproduzir este arquivo. Confira o link e o formato do vídeo.</p>
    ${alternative}</div>`;
  return `<div class="locked-box"><b>Vídeo hospedado externamente</b>${alternative}</div>`;
}

async function loadLessonVideo(panel, id){
  if(panel.dataset.state) return;
  const recipe = findRecipe(id);
  if(!recipe || !isRecipeUnlocked(recipe)) return;
  panel.dataset.state = 'loading';
  panel.innerHTML = '<p role="status">Carregando videoaula…</p>';
  try{
    const original = recipe.legacyVideo || (await API.get('/recipes/' + id + '/video')).video;
    const source = LinksVideo.parse(original, true);
    if(!panel.isConnected) return;
    panel.dataset.state = 'loaded';
    panel.innerHTML = source ? videoPlayerHtml(source, recipe.img)
      : '<div class="locked-box"><b>Videoaula indisponível</b>O link desta aula precisa ser atualizado pelo criador.</div>';
  }catch(e){
    if(!panel.isConnected) return;
    delete panel.dataset.state;
    panel.innerHTML = '<div class="locked-box" role="status"><b>Não foi possível carregar a videoaula</b>'
      + esc(e.message) + '<br><button class="tiny-btn" type="button">Tentar novamente</button></div>';
    panel.querySelector('button').addEventListener('click', () => loadLessonVideo(panel, id));
  }
}

function lessonTabHtml(recipe, unlocked){
  if(recipe.id === 'risoto-funghi') return '<p class="auth-sub">Demonstração ilustrada · Risoto de funghi</p>'
    + videoPlayerHtml({ type:'file', src:'assets/risoto-demo.webm' }, recipe.img);
  if(!recipe.hasVideo) return '<div class="locked-box"><b>Videoaula em breve</b>O criador ainda não adicionou um vídeo a esta receita.</div>';
  if(!unlocked) return '<div class="locked-box"><b>Videoaula exclusiva</b>Desbloqueie a receita ou assine o catálogo para assistir.</div>';
  return '';
}

/* -------- RF03: comercialização flexível -------- */
function isRecipeUnlocked(r){ return unlockedRecipes.has(r.id) || subscribedChefs.has(r.chef) || ownsRecipe(r); }

function unavailableRecipe(message){
  return `<div class="auth-wrap"><div class="auth-card"><h1 class="auth-title">${message}</h1>
    <button class="auth-submit" onclick="goToTab('recipes')">Ver catálogo</button></div></div>`;
}

function renderRecipe(id){
  const r = findRecipe(id);
  if(!r) return unavailableRecipe('Receita indisponível');
  const c = chefs[r.chef];
  const unlocked = isRecipeUnlocked(r);
  const bodyHtml = unlocked ? `
      <div class="unlocked-recipe-body">
        <div class="cook-bar"><span>Modo cozinha</span><button onclick="cookFont(-1)" aria-label="Diminuir fonte">A-</button><button onclick="cookFont(1)" aria-label="Aumentar fonte">A+</button></div>
        <h4>Ingredientes</h4>
        <ul class="cook-list">${r.kit.map(i=>'<li><label><input type="checkbox"> '+(i[1]?i[0]+' - '+i[1]:i[0])+'</label></li>').join('')}</ul>
        <h4>Modo de preparo</h4>
        <ol class="cook-steps">${r.instrucoes.map(s=>'<li onclick="toggleStep(this)">'+s+'</li>').join('')}</ol>
        <button class="tiny-btn" style="margin-top:6px" onclick="downloadFichaPdf('${r.id}')">baixar ficha em PDF (com marca d'água)</button>
      </div>` : `
      <div class="locked-box"><b>Ingredientes e modo de preparo</b>protegidos com marca d'água - desbloqueie comprando a receita ou assinando o catálogo de ${c.name}</div>`;
  return `<div class="wrap" style="padding-top:120px">
  <button class="back-link" onclick="goBack()"><svg class="icon" style="width:14px;height:14px" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> voltar</button>
  <div class="detail-layout">
    <div class="detail-main">
      <div class="hero-photo photo">${photoHtml(r.img, r.difficulty+', '+r.time)}${heartHtml(r.id)}</div>
      <h1 class="detail-title">${r.name}</h1>
      <p class="detail-by">por <span class="link-inline" onclick="goTo('chef','${r.chef}')">${c.person}</span>, <span class="link-inline" onclick="goTo('chef','${r.chef}')">${c.name}</span>, ${c.city}</p>
      ${ratingHtml(r.rating, r.reviews+' avaliações')}
      <div class="meta-strip" style="margin-top:16px">
        <div><b>${r.time}</b><small>preparo</small></div>
        <div><b>${r.portions}</b><small>rende</small></div>
        <div><b>${r.rating}</b><small>avaliação</small></div>
      </div>
      <div class="tabs" role="group" aria-label="Seções da receita">
        <button type="button" class="active" aria-pressed="true" onclick="switchTab('receita',this)">Receita</button>
        <button type="button" aria-pressed="false" onclick="switchTab('video',this)">Vídeo</button>
        <button type="button" aria-pressed="false" onclick="switchTab('avaliacoes',this)">Avaliações</button>
      </div>
      <div class="tab-panel" data-p="receita">${bodyHtml}</div>
      <div class="tab-panel" data-p="video" ${unlocked && r.hasVideo ? `data-recipe="${esc(r.id)}"` : ''} hidden>${lessonTabHtml(r, unlocked)}</div>
      <div class="tab-panel" data-p="avaliacoes" hidden>${reviewsHtml(r)}</div>
    </div>
    <div class="purchase-panel">
      <div class="buy-row"><div><span class="lab">Desbloquear receita</span><span class="sub">receita e videoaula, quando disponível</span></div>${unlocked ? '<span style="color:var(--olive);font-family:\'Public Sans\',sans-serif;font-size:11px">liberado</span>' : `<button class="tiny-btn" onclick="buyRecipe('${r.id}')">${brl(r.price)}</button>`}</div>
      <div class="buy-row"><div><span class="lab">Assinar ${c.name}</span><span class="sub">acesso ao catálogo em modo de demonstração</span></div>${subscribedChefs.has(r.chef) ? '<span style="color:var(--olive);font-family:\'Public Sans\',sans-serif;font-size:11px">assinante</span>' : `<button class="tiny-btn" onclick="subscribeChef('${r.chef}')">R$ 29 · simulação</button>`}</div>
      ${r.kitPrice > 0 ? `<div class="buy-row"><div><span class="lab">Pedir kit de ingredientes</span><span class="sub">entrega em até ${c.radius}, disponível</span></div><button class="tiny-btn" onclick="requireLogin(()=>goTo('checkout','${r.id}'))">pedir</button></div>` : ''}
      <div class="panel-guarantee"><svg class="icon" viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>Pagamento simulado. Nenhum valor é cobrado.</div>
    </div>
  </div>
  </div>
  ${r.kitPrice > 0 ? `<div class="sticky-cta"><div class="sp"><small>kit de ingredientes</small><b>${brl(r.kitPrice)}</b></div><button onclick="requireLogin(()=>goTo('checkout','${r.id}'))">Pedir agora</button></div>` : ''}
  `;
}

/* -------- RNF03: geração de PDF com marca d'água dinâmica -------- */
let jspdfLoading = null;
function loadJsPDF(){
  if(window.jspdf) return Promise.resolve();
  if(jspdfLoading) return jspdfLoading;
  jspdfLoading = new Promise((resolve, reject)=>{
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = resolve;
    s.onerror = () => { jspdfLoading = null; s.remove(); reject(new Error('Biblioteca PDF indisponível.')); };
    document.head.appendChild(s);
  });
  return jspdfLoading;
}
function downloadFichaPdf(id){
  const r = findRecipe(id);
  if(!r || !currentUser || !isRecipeUnlocked(r)){
    showToast('Entre com uma conta que tenha acesso à receita.');
    return;
  }
  const c = chefs[r.chef], email = currentUser.email;
  loadJsPDF().then(()=>{
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const plain = html => {
      const el = document.createElement('textarea');
      el.innerHTML = html;
      return el.value;
    };
    let y = 20;
    function write(value, size = 11, weight = 'normal', x = 15){
      doc.setFont('helvetica',weight);
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(plain(value), 180 - (x - 15));
      for(const line of lines){
        if(y > 268){ doc.addPage(); y = 20; }
        doc.text(line, x, y);
        y += size > 12 ? 9 : 6;
      }
    }
    write(r.name, 18, 'bold');
    write('por ' + c.person + ', ' + c.name);
    write('Tempo: ' + r.time + '   Rende: ' + r.portions);
    y += 5;
    write('Ingredientes', 11, 'bold');
    r.kit.forEach(([item, quantity]) => write('• ' + item + (quantity ? ' - ' + quantity : ''), 11, 'normal', 17));
    y += 5;
    write('Modo de preparo', 11, 'bold');
    r.instrucoes.forEach((step, index) => write((index + 1) + '. ' + step, 11, 'normal', 17));
    // Marca d'água e identificação em todas as páginas.
    for(let page = 1; page <= doc.internal.getNumberOfPages(); page++){
      doc.setPage(page);
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text('Baixado por: ' + email, 15, 286, { maxWidth:180 });
      doc.setFontSize(31);
      doc.setTextColor(212);
      doc.text('GASTROMATCH', 63, 176, { angle:35 });
      doc.setFontSize(13);
      doc.text(email, 68, 183, { angle:35, maxWidth:115 });
    }
    doc.save(r.id + '-ficha.pdf');
    showToast('Ficha em PDF baixada com identificação da sua conta.');
  }).catch(()=>showToast('Não foi possível gerar o PDF agora. Verifique sua conexão e tente novamente.'));
}

function renderChef(id){
  const c = Object.hasOwn(chefs, id) && chefs[id];
  if(!c) return unavailableRecipe('Criador indisponível');
  const catalog = recipes.filter(r=>r.chef===id);
  return `<div class="wrap" style="padding-top:120px">
  <button class="back-link" onclick="goBack()"><svg class="icon" style="width:14px;height:14px" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> voltar</button>
  <div class="cover photo">${photoHtml(c.cover)}</div>
  <div class="chef-head"><div class="avatar">${c.initial}</div><div><p class="chef-name">${c.name}</p><div class="verified">CNPJ verificado, ${c.city}</div></div></div>
  <div class="stat-row"><div><b>${c.stats.receitas}</b><small>receitas</small></div><div><b>${c.stats.alunos}</b><small>alunos</small></div><div><b>${c.stats.avaliacao}</b><small>avaliação</small></div></div>
  <p class="bio">${c.bio}</p>
  <button class="follow-btn" onclick="subscribeChef('${id}')">${subscribedChefs.has(id) ? 'Você é assinante' : 'Assinar catálogo, R$ 29/mês'}</button>
  <h2 style="font-family:'Fraunces',serif;font-size:19px;font-weight:500;margin:0 0 16px">Catálogo</h2>
  <div class="card-grid" style="margin-bottom:70px">${catalog.map(cardHtml).join('')}</div>
  </div>`;
}

/* -------- RF04: checkout com validação de raio por geolocalização -------- */
function pseudoDistanceKm(cep, chefId){ return GEO.distanceKm(cep, chefId); }
function checkCep(recipeId){
  const r = recipeById(recipeId);
  const c = chefs[r.chef];
  const cepInput = document.getElementById('cepInput');
  const cep = (cepInput.value||'').replace(/\D/g,'').slice(0,8);
  const resultBox = document.getElementById('geoResult');
  const radiusKm = parseFloat(c.radius) || 5;
  const dist = pseudoDistanceKm(cep, r.chef);
  if(dist === null){
    resultBox.innerHTML = '<div class="field-error">Digite um CEP válido (8 dígitos).</div>';
    document.getElementById('kitBuyBtn').style.display='none';
    document.getElementById('outOfRangeBox').style.display='none';
    return;
  }
  const ok = dist <= radiusKm;
  if(ok){
    resultBox.innerHTML = `<div class="geo-ok"><span class="geo-dot"></span> dentro do raio de ${c.radius} de ${c.name} (~${dist} km)</div>`;
    document.getElementById('kitBuyBtn').style.display='';
    document.getElementById('outOfRangeBox').style.display='none';
  } else {
    resultBox.innerHTML = `<div class="field-error">Endereço a ~${dist} km - fora do raio de ${c.radius} de ${c.name}.</div>`;
    document.getElementById('kitBuyBtn').style.display='none';
    document.getElementById('outOfRangeBox').style.display='';
  }
}
function refreshKitDelivery(recipeId){
  if(!document.querySelector('#kitSlots [data-pickup].on')) checkCep(recipeId);
}
function allowPickup(){
  const resultBox = document.getElementById('geoResult');
  resultBox.innerHTML = '<div class="geo-ok"><span class="geo-dot"></span> retirada no estabelecimento - sem validação de raio necessária</div>';
  document.getElementById('kitBuyBtn').style.display='';
  document.getElementById('outOfRangeBox').style.display='none';
}
function renderCheckout(id){
  const r = recipes.find(recipe => recipe.id === id);
  if(!r || r.kitPrice <= 0) return unavailableRecipe('Kit indisponível para esta receita');
  const c = chefs[r.chef];
  return `<div class="wrap" style="padding-top:120px">
  <button class="back-link" onclick="goBack()"><svg class="icon" style="width:14px;height:14px" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> voltar</button>
  <h2 style="font-family:'Fraunces',serif;font-size:22px;font-weight:500;margin:0 0 20px">Kit, ${r.name}</h2>
  <div class="checkout-layout" style="margin-bottom:70px">
    <div class="checkout-main">
      <div class="addr-box">
        <div class="addr-top"><span>Endereço de entrega</span></div>
        <div class="field" style="margin:10px 0 4px"><label>CEP</label><div style="display:flex;gap:8px"><input id="cepInput" inputmode="numeric" maxlength="9" placeholder="89200-000" oninput="refreshKitDelivery('${r.id}')" style="padding:11px 13px;border:1px solid var(--line);background:var(--paper);color:var(--ink);border-radius:2px;flex:1"><button class="tiny-btn" onclick="refreshKitDelivery('${r.id}')">verificar raio</button></div></div>
        <div id="geoResult"><div class="geo-ok"><span class="geo-dot"></span> informe o CEP para validar o raio de entrega de ${c.name} (${c.radius})</div></div>
        <div id="outOfRangeBox" style="display:none; margin-top:10px; font-size:12px; color:var(--ink-soft)">Você ainda pode <span class="link-inline" onclick="goTo('recipe','${r.id}')">comprar apenas a aula em vídeo</span> ou retirar no estabelecimento.</div>
      </div>
      <h3 style="font-family:'Fraunces',serif;font-size:16px;font-weight:500;margin:0 0 14px">Itens do kit</h3>
      ${r.kit.map(i=>'<div class="kit-line"><span>'+i[0]+'</span><span>'+i[1]+'</span></div>').join('')}
      <h3 style="font-family:'Fraunces',serif;font-size:16px;font-weight:500;margin:22px 0 14px">Entrega</h3>
      <div class="chip-row" id="kitSlots"><button class="chip on" type="button" onclick="toggleChip(this); refreshKitDelivery('${r.id}')">Hoje, 18h–20h</button><button class="chip" type="button" onclick="toggleChip(this); refreshKitDelivery('${r.id}')">Amanhã, 12h–14h</button><button class="chip" type="button" data-pickup onclick="toggleChip(this); allowPickup()">Retirar no local</button></div>
      <div class="terms-row"><input type="checkbox" id="terms"><label for="terms">Declaro ciência de que os ingredientes seguem as normas locais de Vigilância Sanitária para manipulação e transporte.</label></div>
    </div>
    <div class="order-summary">
      <div class="kit-line"><span>${r.name}</span><span>${brl(r.kitPrice)}</span></div>
      <div class="kit-line" style="border-bottom:none"><span>Entrega</span><span>grátis</span></div>
      <div class="total-row"><span>Total</span><b>${brl(r.kitPrice)}</b></div>
      <button class="confirm-btn" id="kitBuyBtn" onclick="startKitPayment('${r.id}')" style="display:none">Confirmar pedido</button>
      <div class="summary-guarantee">Pedido demonstrativo. Nenhum valor é cobrado.</div>
    </div>
  </div>
  </div>`;
}

function renderCommunity(){
  const r1=recipeById('curry-verde'), r2=recipeById('cordeiro-porto'), r3=recipeById('mousse-chocolate'), r4=recipeById('bowl-vegetariano');
  const extra = communityPosts.map(p=>`
      <div class="post"><div class="post-photo photo">${p.img ? photoHtml(p.img) : photoHtml(recipeById(p.recipeId).img)}</div><div class="post-body">
        <div class="post-head">${avatarHtml(p.name,28)}<div><div class="post-name">${esc(p.name)}</div><div class="post-tag" onclick="goTo('recipe','${p.recipeId}')">fez: ${recipeById(p.recipeId).name}</div></div></div>
        <p class="post-caption">${esc(p.caption)}</p>${p.reply?'<p class="post-reply">Resposta da equipe: '+esc(p.reply)+'</p>':''}
        <div class="post-actions"><span>${'★'.repeat(p.stars)}${'☆'.repeat(5-p.stars)}</span><span>0 curtidas</span></div></div></div>`).join('');
  return `<div class="wrap" style="padding-top:120px; max-width:920px">
    <h2 style="font-family:'Fraunces',serif;font-size:22px;font-weight:500;margin:0 0 20px">Mostre o que você preparou.</h2>
    <div class="progress-widget">
      <div><b>Seu progresso gastronômico</b><span>Você já preparou ${8+communityPosts.length} receitas.</span></div>
      <div class="badges-row">
        <span class="badge-pill">Mestre das massas</span>
        <span class="badge-pill">5 receitas concluídas</span>
        <span class="badge-pill">1ª receita de chef</span>
      </div>
    </div>
    <div class="composer" onclick="openPostModal()">${avatarHtml(currentUser?currentUser.name:'Você',30)} Compartilhe o resultado da sua receita…</div>
    <div class="masonry">
      ${extra}
      <div class="post"><div class="post-photo photo">${photoHtml(r1.img)}</div><div class="post-body">
        <div class="post-head">${avatarHtml('Camila R.',28)}<div><div class="post-name">Camila R.</div><div class="post-tag" onclick="goTo('recipe','${r1.id}')">fez: ${r1.name}</div></div></div>
        <p class="post-caption">Pasta de curry fresquinha muda tudo, ficou tão bom quanto no restaurante</p>
        <div class="post-actions"><span>42 curtidas</span><span>6 comentários</span></div></div></div>

      <div class="post qa-post">
        <div class="post-head">${avatarHtml('Diego F.',28)}<div><div class="post-name">Diego F.</div><div class="post-tag" onclick="goTo('recipe','${r2.id}')">fez: ${r2.name}</div></div></div>
        <div class="qa-box"><b>pergunta para chef renato</b>Posso trocar o vinho do Porto por um tinto seco?</div>
        <div class="qa-box reply"><b>respondido pelo chef renato</b>Pode sim - o resultado fica um pouco menos adocicado.</div>
        <div class="post-actions"><span>18 curtidas</span><span>3 comentários</span></div>
      </div>

      <div class="post"><div class="post-photo photo">${photoHtml(r3.img)}</div><div class="post-body">
        <div class="post-head">${avatarHtml('Ana P.',28)}<div><div class="post-name">Ana P.</div><div class="post-tag" onclick="goTo('recipe','${r3.id}')">fez: ${r3.name}</div></div></div>
        <p class="post-caption">Mousse com textura de restaurante, bem diferente da de pacotinho</p>
        <div class="post-actions"><span>27 curtidas</span><span>4 comentários</span></div></div></div>

      <div class="post"><div class="post-photo photo" style="aspect-ratio:4/3">${photoHtml(r4.img)}</div><div class="post-body">
        <div class="post-head">${avatarHtml('Larissa T.',28)}<div><div class="post-name">Larissa T.</div><div class="post-tag" onclick="goTo('recipe','${r4.id}')">fez: ${r4.name}</div></div></div>
        <p class="post-caption">Bowl colorido, leve e muito mais saboroso do que eu esperava.</p>
        <div class="post-actions"><span>31 curtidas</span><span>2 comentários</span></div></div></div>
    </div>
  </div>`;
}

/* -------- RF06: comunidade - postar resultado -------- */
const communityPosts = [];
let postDraftImg = null;
let postDraftStars = 5;
function openPostModal(){
  requireLogin(()=>{
    postDraftImg = null; postDraftStars = 5;
    const opts = recipes.map(r=>'<option value="'+r.id+'">'+r.name+'</option>').join('');
    const backdrop = document.createElement('div');
    backdrop.className='modal-backdrop'; backdrop.id='postModalBackdrop';
    backdrop.innerHTML = `<div class="modal-box">
      <h3>Compartilhar resultado</h3>
      <div class="field"><label>Qual receita você fez?</label><select id="postRecipeSel">${opts}</select></div>
      <div class="field"><label>Foto do prato (opcional)</label><input type="file" accept="image/*" id="postFileInput" onchange="handlePostFile(event)"><img id="postPreview" class="preview-img" style="display:none"></div>
      <div class="field"><label>Sua nota</label><div class="star-pick" id="starPick">${[1,2,3,4,5].map(n=>'<span data-n="'+n+'" onclick="setPostStars('+n+')" class="'+(n<=postDraftStars?'on':'')+'">★</span>').join('')}</div></div>
      <div class="field"><label>Comentário</label><textarea id="postCaption" placeholder="Como foi preparar essa receita?"></textarea></div>
      <div class="modal-actions"><button class="cancel" onclick="closePostModal()">cancelar</button><button class="submit" onclick="submitPost()">publicar</button></div>
    </div>`;
    document.body.appendChild(backdrop);
  });
}
function closePostModal(){ const b=document.getElementById('postModalBackdrop'); if(b) b.remove(); }
function setPostStars(n){ postDraftStars=n; document.querySelectorAll('#starPick span').forEach(s=>s.classList.toggle('on', parseInt(s.dataset.n)<=n)); }
function handlePostFile(ev){
  const file = ev.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{ postDraftImg = reader.result; const img=document.getElementById('postPreview'); img.src=postDraftImg; img.style.display='block'; };
  reader.readAsDataURL(file);
}


/* -------- RF02: publicar receita -------- */

/* -------- Login gate for protected pages -------- */
function renderLoginGate(what){
  return `<div class="auth-wrap"><div class="auth-card" style="text-align:center">
    <h1 class="auth-title">Entre para continuar</h1>
    <p class="auth-sub">Você precisa estar logado para acessar ${what}.</p>
    <button class="auth-submit" onclick="goToTab('login')">Ir para o login</button>
  </div></div>`;
}

/* -------- RF05 / RF01: Login e Cadastro -------- */
function renderRegisterChoice(){
  return `<div class="auth-wrap"><div class="auth-card">
    <h1 class="auth-title">Criar conta</h1>
    <p class="auth-sub">Escolha o tipo de perfil que combina com você.</p>
    <div class="type-choice">
      <div class="type-card" onclick="goToTab('register-amador')">
        <svg class="icon" viewBox="0 0 24 24" width="28" height="28"><path d="M12 21s-7-4.4-9.6-9C.6 8.7 2 5 5.6 5c2 0 3.4 1.1 4.4 2.6C11 6.1 12.4 5 14.4 5 18 5 19.4 8.7 21.6 12 19 16.6 12 21 12 21z"/></svg>
        <b>Cozinheiro Amador</b><span>quero cozinhar em casa com receitas de chefs</span>
      </div>
      <div class="type-card" onclick="goToTab('register-criador')">
        <svg class="icon" viewBox="0 0 24 24" width="28" height="28"><path d="M12 2a4 4 0 0 0-4 4c0 2 1 3 1 5H8a2 2 0 0 0 0 4h8a2 2 0 0 0 0-4h-1c0-2 1-3 1-5a4 4 0 0 0-4-4z"/><path d="M9 21h6"/></svg>
        <b>Chef / Restaurante</b><span>quero publicar receitas, aulas e kits</span>
      </div>
    </div>
    <p class="auth-switch">Já tem conta? <span class="link-inline" onclick="goToTab('login')">Entrar</span></p>
  </div></div>`;
}
function renderRegisterAmador(){
  return `<div class="auth-wrap"><div class="auth-card">
    <button class="back-link" onclick="goToTab('register-choice')"><svg class="icon" style="width:14px;height:14px" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> voltar</button>
    <h1 class="auth-title">Cadastro, Cozinheiro Amador</h1>
    ${localModeMessage()}
    <p class="auth-sub">Registro simples - navegue pelo catálogo, compre aulas e kits.</p>
    <div class="field"><label>Nome</label><input id="regName" placeholder="Seu nome completo"></div>
    <div class="field"><label>E-mail</label><input id="regEmail" type="email" placeholder="voce@email.com"></div>
    <div class="field"><label>Senha</label><input id="regPass" type="password" placeholder="mín. 6 caracteres"></div>
    <div id="regError"></div>
    <button class="auth-submit" onclick="doRegisterAmador()">Criar conta</button>
    <p class="auth-switch">Já tem conta? <span class="link-inline" onclick="goToTab('login')">Entrar</span></p>
  </div></div>`;
}
let regDocAttached = false;
function renderRegisterCriador(){
  regDocAttached = false;
  return `<div class="auth-wrap" style="max-width:520px"><div class="auth-card">
    <button class="back-link" onclick="goToTab('register-choice')"><svg class="icon" style="width:14px;height:14px" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> voltar</button>
    <h1 class="auth-title">Cadastro, Chef / Restaurante</h1>
    ${localModeMessage()}
    <p class="auth-sub">Curadoria profissional - apenas chefs com formação comprovada ou restaurantes com CNPJ ativo podem publicar conteúdo monetizado.</p>
    <div class="field"><label>Tipo de perfil</label><select id="regTipo"><option value="chef">Chef Profissional</option><option value="restaurante">Restaurante</option></select></div>
    <div class="field"><label>Nome / Razão social</label><input id="regCName" placeholder="Ex: Osteria Torino"></div>
    <div class="field"><label>E-mail</label><input id="regCEmail" type="email" placeholder="contato@restaurante.com"></div>
    <div class="field"><label>Senha</label><input id="regCPass" type="password" placeholder="mín. 6 caracteres"></div>
    <div class="field"><label>Raio de entrega para kits (km)</label><input id="regCRadius" type="number" placeholder="5"></div>
    <div class="field"><label>Diploma (Chef) ou CNPJ/Alvará (Restaurante)</label>
      <div class="file-drop" id="fileDrop" onclick="document.getElementById('regCDoc').click()">clique para anexar o comprovante (PDF/imagem)</div>
      <input type="file" id="regCDoc" style="display:none" onchange="markDocAttached()">
    </div>
    <div class="checkbox-row"><input type="checkbox" id="regCSanit"><label for="regCSanit">Declaro ciência e aceito o Termo de Conformidade Sanitária para manipulação e transporte de ingredientes frescos.</label></div>
    <div id="regCError"></div>
    <button class="auth-submit" onclick="doRegisterCriador()">Enviar cadastro para curadoria</button>
    <p class="auth-switch">Já tem conta? <span class="link-inline" onclick="goToTab('login')">Entrar</span></p>
  </div></div>`;
}
function markDocAttached(){
  regDocAttached = true;
  const drop = document.getElementById('fileDrop');
  const f = document.getElementById('regCDoc').files[0];
  drop.classList.add('has-file');
  drop.textContent = '' + (f ? f.name : 'arquivo anexado');
}

const pageRenderers = { home:renderHome, recipe:renderRecipe, chef:renderChef, checkout:renderCheckout, community:renderCommunity, dashboard:renderDashboard,
  recipes:renderRecipes, profile:renderProfile, help:renderHelp, contact:renderContact, terms:renderTerms, privacy:renderPrivacy,
  login:renderLogin, 'register-choice':renderRegisterChoice, 'register-amador':renderRegisterAmador, 'register-criador':renderRegisterCriador, 'new-recipe':renderNewRecipe, admin:renderAdmin };

function render(){
  const el = document.getElementById('content');
  el.classList.remove('page-in');
  void el.offsetWidth;
  el.innerHTML = pageRenderers[currentPage](currentId);
  requestAnimationFrame(()=>{ el.classList.add('page-in'); initReveals(); if(currentPage==='home') initHero(); else { updateActiveTab(); } });
  if (currentPage === 'dashboard') animateCounters();
  if (typeof pageAfter !== 'undefined' && pageAfter[currentPage]) pageAfter[currentPage]();
  window.scrollTo(0,0);
  updateActiveTab();
  renderAuthArea();
  const topbar = document.getElementById('topbar');
  topbar.classList.toggle('solid', currentPage !== 'home');
}

let heroTicking = false;
window.addEventListener('scroll', ()=>{
  const topbar = document.getElementById('topbar');
  if(currentPage === 'home') topbar.classList.toggle('solid', window.scrollY > window.innerHeight * 0.7);
  if(currentPage === 'home' && !heroTicking){
    heroTicking = true;
    requestAnimationFrame(()=>{ updateHeroScroll(); heroTicking = false; });
  }
}, { passive:true });
window.addEventListener('resize', updateActiveTab);

initTheme();
{ const vc = document.getElementById('videoCredit'); if(vc) vc.hidden = !IMG.heroVideo; }
readLocation();
bootstrap();
window.addEventListener('popstate', () => { readLocation(); render(); });
