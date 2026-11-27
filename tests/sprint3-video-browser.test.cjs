/* Use um servidor SQLite local com banco descartável. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const origin = new URL(process.env.GM_TEST_URL || 'http://127.0.0.1:3922');
assert.ok(['127.0.0.1','localhost'].includes(origin.hostname));
const evidence = process.env.GM_TEST_EVIDENCE;
async function capture(page, file){
  if(!evidence) return;
  fs.mkdirSync(evidence, {recursive:true});
  await page.screenshot({ path:path.join(evidence, file), animations:'disabled' });
}
async function open(page, section){
  await page.goto(new URL('/#'+section, origin).href, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(section => location.hash === '#' + section && document.querySelector('#content')?.classList.contains('page-in'), section);
}
async function signIn(page, email, password){
  await open(page,'login');
  await page.locator('#loginEmail').fill(email);
  await page.locator('#loginPass').fill(password);
  await page.locator('#loginBtn').click();
  await page.locator('#authArea .userchip').waitFor({state:'attached'});
}

(async () => {
  const browser = await chromium.launch({ executablePath:process.env.CHROMIUM_BIN || undefined, args:['--no-sandbox'] });
  const errors = [];
  async function newPage(viewport = {width:1280,height:900}){
    const page = await browser.newPage({viewport});
    page.setDefaultTimeout(9000);
    page.on('pageerror', error => errors.push(error.message));
    return page;
  }
  try{
    const guest = await newPage();
    const routes = ['home','recipes','chef/torino','recipe/risoto-funghi','checkout/risoto-funghi','community',
      'help','contact','terms','privacy','login','register-choice','register-amador','register-criador',
      'dashboard','new-recipe','admin','profile'];
    for(const width of [360, 768, 1280]){
      await guest.setViewportSize({width, height:900});
      for(const route of routes){
        await open(guest, route);
        const spill = await guest.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        assert.ok(spill <= 1, route+' a '+width+' px excedeu '+spill+' px');
      }
    }
    console.log('PASS  18 rotas públicas e portões de acesso em 360, 768 e 1280 px.');
    await open(guest,'recipe/risoto-funghi');
    await guest.getByRole('button',{name:'Vídeo',exact:true}).click();
    const demo = guest.locator('[data-p="video"] video');
    await demo.evaluate(video => video.play());
    await guest.waitForFunction(() => document.querySelector('[data-p="video"] video').currentTime > 0.25);
    await demo.scrollIntoViewIfNeeded();
    await capture(guest,'05-videoaula-demo.png');
    await guest.getByRole('button',{name:'Receita',exact:true}).click();
    assert.ok(await demo.evaluate(video => video.paused));
    console.log('PASS  Demonstração WebM reproduziu e pausou ao trocar de seção.');

    const admin = await newPage();
    await signIn(admin,'admin@gastromatch.com','admin123');
    await admin.locator('#admin-root').getByText('Beatriz', {exact:false}).first().waitFor();
    await admin.locator('#admin-root tr').filter({hasText:'beatriz@email.com'}).getByText('aprovar',{exact:true}).click();
    await admin.locator('#admin-root tr').filter({hasText:'beatriz@email.com'}).getByText('APROVADO',{exact:true}).waitFor();
    console.log('PASS  Curadoria aprova uma criadora pendente pela interface.');

    const creator = await newPage();
    await signIn(creator,'beatriz@email.com','123456');
    await open(creator,'new-recipe');
    await creator.locator('#nrTitle').fill('Aula teste GastroMatch');
    await creator.locator('#nrPreco').fill('20.00');
    await creator.locator('#nrTempo').fill('15');
    await creator.locator('#nrIng').fill('Arroz');
    await creator.locator('#nrPassos').fill('Toste o arroz.');
    await creator.locator('#nrVideo').fill('http://example.test/aula.mp4');
    await creator.getByRole('button',{name:'Salvar rascunho',exact:true}).click();
    await creator.locator('#nrVideoPreview').getByText(/link HTTPS/).waitFor();
    const sample = 'https://media.example.test/aula.webm';
    await creator.route(sample, route => route.fulfill({path:path.resolve(__dirname,'../assets/risoto-demo.webm'),contentType:'video/webm'}));
    await creator.locator('#nrVideo').fill(sample);
    await creator.getByRole('button',{name:'Testar videoaula'}).click();
    const preview = creator.locator('#nrVideoPreview video');
    await preview.evaluate(video => video.play());
    await creator.waitForFunction(() => document.querySelector('#nrVideoPreview video').currentTime > 0.25);
    await preview.scrollIntoViewIfNeeded();
    await capture(creator,'06-previa-do-criador.png');
    const embed = 'https://player.vimeo.com/video/123456789?h=hash123';
    await creator.route(embed, route => route.fulfill({body:'<title>Player Vimeo de teste</title>',contentType:'text/html'}));
    await creator.locator('#nrVideo').fill('https://vimeo.com/123456789/hash123');
    await creator.getByRole('button',{name:'Testar videoaula'}).click();
    assert.equal(await creator.locator('#nrVideoPreview iframe').getAttribute('src'),embed);
    await creator.getByRole('button',{name:'Salvar rascunho',exact:true}).click();
    const row = creator.locator('#dash-root tr').filter({hasText:'Aula teste GastroMatch'});
    await row.getByText('RASCUNHO',{exact:true}).waitFor();
    await row.getByText('publicar',{exact:true}).click();
    await row.getByText('PUBLICADA',{exact:true}).waitFor();
    await row.getByText('ver',{exact:true}).click();
    await creator.getByRole('button',{name:'Vídeo',exact:true}).click();
    assert.equal(await creator.locator('[data-p="video"] iframe').getAttribute('src'),embed);
    const section = new URL(creator.url()).hash.slice(1);
    console.log('PASS  Prévia reproduziu um WebM. Link Vimeo, rascunho, publicação e visualização pelo criador.');

    const buyer = await newPage({width:390,height:844});
    await buyer.route('https://www.youtube-nocookie.com/embed/abcdefghijk', route =>
      route.fulfill({body:'<title>Player YouTube de teste</title>',contentType:'text/html'}));
    await open(buyer,section);
    await buyer.getByRole('button',{name:'Vídeo',exact:true}).click();
    await buyer.getByText('Videoaula exclusiva',{exact:true}).waitFor();
    assert.equal(await buyer.locator('[data-p="video"] iframe').count(),0);
    await signIn(buyer,'marina@email.com','123456');

    await open(creator,'new-recipe/'+section.split('/')[1]);
    await creator.locator('#nrVideo').fill('https://youtu.be/abcdefghijk');
    await creator.getByRole('button',{name:'Publicar',exact:true}).click();
    await row.getByText('PUBLICADA',{exact:true}).waitFor();
    await buyer.goto(new URL('/#'+section, origin).href);
    await buyer.reload({waitUntil:'domcontentloaded'});
    await buyer.locator('.detail-title').waitFor();
    await buyer.locator('.purchase-panel').getByRole('button',{name:'R$ 20,00',exact:true}).click();
    await buyer.locator('#payBox').getByText('PIX',{exact:true}).click();
    await buyer.locator('#payBtn').click();
    await buyer.locator('#payBox').waitFor({state:'detached'});
    await buyer.locator('.unlocked-recipe-body').waitFor();
    await buyer.getByRole('button',{name:'Vídeo',exact:true}).click();
    assert.equal(await buyer.locator('[data-p="video"] iframe').getAttribute('src'),'https://www.youtube-nocookie.com/embed/abcdefghijk');
    assert.ok(await buyer.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await buyer.getByRole('button',{name:'Receita',exact:true}).click();
    assert.equal(await buyer.locator('[data-p="video"] iframe').count(),0);
    console.log('PASS  Compra simulada libera YouTube no celular e trocar de seção remove o player.');
    assert.deepEqual(errors,[]);
  }finally{
    await browser.close();
  }
})().catch(e=>{ console.error(e); process.exitCode=1; });
