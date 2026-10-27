/* geo.js - geolocalização compartilhada entre o front e o servidor.
   Sem serviço de mapas, o CEP é convertido em coordenadas por uma regra determinística
   (aproximada para a região de Joinville). Para produção, troque geocodeCep por uma API de CEP + geocoding. */
(function(root){
  const BASE = [-26.3044, -48.8456];
  const COORDS = { torino:[-26.3044,-48.8456], renato:[-26.2890,-48.8290], siam:[-26.3260,-48.8570], bosque:[-26.2780,-48.8700], lume:[-26.3150,-48.8380], recanto:[-26.3400,-48.8100], bufalo:[-26.2950,-48.8820], verde:[-26.3330,-48.8650] };
  const BASE_RADIUS = { torino:5, renato:8, siam:6, bosque:4, lume:5, recanto:6, bufalo:5, verde:4 };
  const BASE_NAMES = { torino:'Osteria Torino', renato:'Chef Renato Aveiro', siam:'Casa Siam', bosque:'Padaria do Bosque', lume:'Confeitaria Lume', recanto:'Recanto Mineiro', bufalo:'Búfalo Burgers', verde:'Verde Vivo' };
  function coordsOf(chefId){
    if(COORDS[chefId]) return COORDS[chefId];
    let h = 0; for(const c of String(chefId)) h = (h * 31 + c.charCodeAt(0)) % 9973;
    return [BASE[0] + ((h % 100) / 100 - .5) * .08, BASE[1] + (((h / 100) | 0) % 100 / 100 - .5) * .08];
  }
  function geocodeCep(cep){
    const n = String(cep).replace(/\D/g, ''); if(n.length !== 8) return null;
    return [BASE[0] + ((+n.slice(0, 4)) % 1000 / 1000 - .5) * .10, BASE[1] + ((+n.slice(4)) % 1000 / 1000 - .5) * .10];
  }
  function haversine(a, b){
    const r = x => x * Math.PI / 180, dLa = r(b[0] - a[0]), dLo = r(b[1] - a[1]);
    const h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLo / 2) ** 2;
    return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)) * 10) / 10;
  }
  const distanceKm = (cep, chefId) => { const g = geocodeCep(cep); return g ? haversine(g, coordsOf(chefId)) : null; };
  root.GEO = { BASE, COORDS, BASE_RADIUS, BASE_NAMES, coordsOf, geocodeCep, haversine, distanceKm };
  if(typeof module !== 'undefined') module.exports = root.GEO;
})(typeof window !== 'undefined' ? window : globalThis);
