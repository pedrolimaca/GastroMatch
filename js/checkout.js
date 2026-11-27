/* Regras compartilhadas pelo modo de demonstração e pelo servidor Node. */
(function(root){
  const catalog = Object.fromEntries([
    ['risoto-funghi', 'Risoto de Funghi Porcini', 'torino', 34.90, 46.00],
    ['tagliatelle-ragu', 'Tagliatelle ao Ragu', 'torino', 27.90, 38.00],
    ['cordeiro-porto', 'Cordeiro ao Vinho do Porto', 'renato', 42.00, 68.00],
    ['curry-verde', 'Curry Verde Tailandês', 'siam', 28.50, 35.00],
    ['pao-fermentacao', 'Pão de Fermentação Natural', 'bosque', 19.90, 24.00],
    ['torta-limao', 'Torta de Limão Siciliano', 'lume', 24.90, 30.00],
    ['feijoada-completa', 'Feijoada Completa', 'recanto', 32.90, 64.00],
    ['hamburguer-artesanal', 'Hambúrguer Artesanal de Cordeiro', 'bufalo', 26.90, 41.00],
    ['bowl-vegetariano', 'Bowl Vegetariano de Grãos', 'verde', 22.90, 33.00],
    ['mousse-chocolate', 'Mousse de Chocolate 70%', 'lume', 18.90, 27.00],
  ].map(([id, name, chefId, price, kitPrice]) => [id, { id, name, chefId, price, kitPrice }]));
  const CUPONS = Object.freeze({ GASTRO10: 0.10, CHEF20: 0.20 });
  const ASSINATURA = 29;
  const demoRecipe = id => Object.hasOwn(catalog, id) ? catalog[id] : null;

  function total(price, cupom){
    const discount = Object.hasOwn(CUPONS, cupom) ? CUPONS[cupom] : 0;
    return Math.round(Math.round(price * 100) * (100 - Math.round(discount * 100)) / 100) / 100;
  }

  function resolve(b, findRecipe, findCreator, fail, distanceKm){
    const { type } = b;
    if(!['receita', 'assinatura', 'kit'].includes(type)) fail(422, 'Tipo de compra inválido.');
    const refId = String(b.refId || '');
    const recipe = type === 'assinatura' ? null : (demoRecipe(refId) || findRecipe(refId));
    if(type !== 'assinatura' && !recipe) fail(404, 'Receita indisponível.');
    const chefId = recipe ? recipe.chefId : refId;
    const creator = findCreator(chefId);
    if(!creator) fail(404, 'Criador indisponível.');
    if(b.chefId != null && b.chefId !== chefId) fail(422, 'A compra não corresponde ao criador informado.');
    const price = type === 'assinatura' ? ASSINATURA : type === 'kit' ? recipe.kitPrice : recipe.price;
    if(!Number.isFinite(price) || price <= 0) fail(422, 'Kit indisponível para esta receita.');
    const cupom = String(b.cupom || '').trim().toUpperCase();
    if(cupom && !Object.hasOwn(CUPONS, cupom)) fail(422, 'Cupom inválido.');
    const valor = total(price, cupom);
    if(type === 'kit'){
      if(b.termo !== true) fail(422, 'É obrigatório aceitar as normas da Vigilância Sanitária para prosseguir.');
      if(!['entrega', 'retirada'].includes(b.entrega)) fail(422, 'Escolha entrega ou retirada.');
      if(b.entrega === 'entrega'){
        const distance = distanceKm(String(b.cep || ''), chefId);
        if(distance === null) fail(422, 'Informe um CEP válido.');
        if(distance > creator.raio) fail(422, 'Endereço fora do raio de entrega. Escolha retirar no estabelecimento.');
      }
    }
    return { refId, chefId, recipeName:recipe?.name, valor, cupom };
  }

  const checkout = { demoRecipe, resolve, total, CUPONS, ASSINATURA };
  if(typeof module !== 'undefined') module.exports = checkout;
  else root.Checkout = checkout;
})(globalThis);
