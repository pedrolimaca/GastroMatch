/* Execute against a fresh, local SQLite server. This test creates and deletes test accounts. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

const origin = new URL(process.env.GM_TEST_URL || 'http://127.0.0.1:3811');
assert.ok(['127.0.0.1','localhost'].includes(origin.hostname), 'Use um servidor de teste local.');
const evidence = process.env.GM_TEST_EVIDENCE;
const screenshot = (page, name) => evidence && page.screenshot({ path: evidence + '/' + name + '.png', animations:'disabled' });

async function api(path, body, token){
  const res = await fetch(new URL('/api' + path, origin), {
    method:body ? 'POST' : 'GET',
    headers:{ 'Content-Type':'application/json', ...(token && {Authorization:'Bearer ' + token}) },
    body:body && JSON.stringify(body),
  });
  const data = await res.json();
  assert.equal(res.status,200,JSON.stringify(data));
  return data;
}

(async () => {
  if(evidence) fs.mkdirSync(evidence,{recursive:true});
  const healthy = await api('/health');
  assert.equal(healthy.db,'sqlite');
  const chef = await api('/auth/login',{ email:'chef@gastromatch.com', password:'chef123' });
  const { recipe } = await api('/recipes',{ name:'Receita de teste sem kit', price:21.50, minutes:20,
    categoria:'vegetarianas', restricao:'vegano', ingredientes:'Cogumelo fresco', instrucoes:'Refogue' },chef.token);

  const browser = await chromium.launch({ executablePath:process.env.CHROMIUM_BIN || undefined, args:['--no-sandbox'] });
  try{
    const page = await browser.newPage({ viewport:{ width:1280,height:900 } });
    const errors = [];
    page.on('pageerror',e => errors.push(e.message));
    await page.goto(new URL('/#recipes',origin).href,{waitUntil:'domcontentloaded'});
    await page.locator('#catalogSearch').fill('COGUMELO');
    await page.locator('#recipe-results').getByText(recipe.name,{exact:true}).first().waitFor();
    assert.equal(await page.evaluate(() => API.mode()),'servidor');
    await screenshot(page,'01-catalogo');
    await page.goto(new URL('/#recipe/'+recipe.id,origin).href);
    await page.locator('.detail-title').waitFor();
    assert.equal(await page.locator('.detail-title').textContent(),recipe.name);
    assert.equal(await page.getByText('Pedir kit de ingredientes',{exact:true}).count(),0);
    await page.reload();
    await page.locator('.detail-title').waitFor();
    await page.goto(new URL('/#checkout/'+recipe.id,origin).href);
    await page.getByText('Kit indisponível para esta receita',{exact:true}).waitFor();
    await page.goto(new URL('/#recipe/sem-receita',origin).href);
    await page.getByText('Receita indisponível',{exact:true}).waitFor();
    await page.goto(new URL('/#chef/sem-criador',origin).href);
    await page.getByText('Criador indisponível',{exact:true}).waitFor();
    console.log('PASS  Links diretos, recarga, busca por ingrediente, receita inexistente e receita sem kit.');

    const email = 'qa-' + Date.now() + '@example.test';
    await page.goto(new URL('/#register-amador',origin).href);
    await page.locator('#regName').fill('Pessoa Teste');
    await page.locator('#regEmail').fill(email);
    await page.locator('#regPass').fill('123456');
    await page.locator('#content').getByRole('button',{name:'Criar conta',exact:true}).click();
    await page.locator('.userchip').waitFor();
    await page.goto(new URL('/#recipe/risoto-funghi',origin).href);
    await page.locator('.detail-title').waitFor();
    await page.locator('.purchase-panel button', {hasText:'R$ 34,90'}).click();
    await page.locator('#payCard').fill('4242424242420000');
    await page.locator('#payBtn').click();
    await page.locator('#payError').getByText(/Erro 402/).waitFor();
    await screenshot(page,'02-pagamento-recusado');
    await page.locator('#payBox').getByText('PIX',{exact:true}).click();
    await page.locator('#payCupom').fill('GASTRO10');
    await page.locator('#payBox').getByText('aplicar',{exact:true}).click();
    assert.match(await page.locator('#payBox .total-row').textContent(), /31,41/);
    await page.locator('#payBtn').click();
    await page.locator('.unlocked-recipe-body').waitFor();
    await screenshot(page,'03-modo-cozinha');
    console.log('PASS  Cadastro, cartão recusado, PIX simulado com cupom e modo cozinha liberado.');
    if(process.env.GM_TEST_JSPDF){
      await page.route('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
        route => route.fulfill({path:process.env.GM_TEST_JSPDF,contentType:'application/javascript'}));
    }
    const pdf = page.waitForEvent('download',{timeout:15000});
    await page.getByRole('button',{name:/baixar ficha em PDF/}).click();
    const download = await pdf;
    const contents = fs.readFileSync(await download.path());
    assert.equal(contents.subarray(0,4).toString(),'%PDF');
    assert.ok(contents.includes(Buffer.from(email)));
    console.log('PASS  Ficha PDF baixada com identificação da conta autenticada.');

    await page.setViewportSize({width:390,height:844});
    await page.goto(new URL('/#checkout/risoto-funghi',origin).href);
    const purchase = page.locator('#kitBuyBtn');
    await page.locator('#kitSlots [data-pickup]').click();
    await purchase.waitFor({state:'visible'});
    await page.locator('#kitSlots button').first().click();
    await purchase.waitFor({state:'hidden'});
    const sample = await page.evaluate(() => {
      for(let cep = 10000000; cep < 99999999; cep += 7919){
        if(GEO.distanceKm(String(cep),'torino') > 5) return String(cep);
      }
    });
    assert.ok(sample);
    await page.locator('#cepInput').fill(sample);
    await page.locator('#geoResult').getByText(/fora do raio/).waitFor();
    assert.equal(await purchase.isVisible(),false);
    await page.locator('#kitSlots [data-pickup]').click();
    await page.locator('#terms').check();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await screenshot(page,'04-retirada-mobile');
    await purchase.click();
    await page.locator('#payBox').getByText('PIX',{exact:true}).click();
    await page.locator('#payBtn').click();
    await page.waitForURL('**/#community');
    console.log('PASS  CEP fora do raio, troca de modalidade, retirada e checkout móvel a 390 px.');

    await page.goto(new URL('/#profile',origin).href);
    await page.locator('#delPass').fill('123456');
    await page.locator('#delConfirm').fill('EXCLUIR');
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#delBtn').click();
    await page.waitForURL('**/#home');
    assert.equal((await api('/me')).user,null);
    const login = await fetch(new URL('/api/auth/login',origin),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'123456'})});
    assert.equal(login.status,401);
    assert.deepEqual(errors,[]);
    console.log('PASS  Exclusão da conta pela interface; credenciais revogadas, sem erros de execução no navegador.');
  }finally{
    await browser.close();
  }
})().catch(e=>{ console.error(e); process.exitCode=1; });
