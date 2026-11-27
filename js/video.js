/* Formatos que o player consegue abrir. O link original é mantido para edição. */
(function(root){
  const youtube = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com']);
  const vimeo = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']);
  const message = 'Informe um link HTTPS de uma videoaula. Use YouTube, Vimeo ou um link para o arquivo.';
  function parse(value, allowHttp = false){
    const text = String(value ?? '').trim();
    if(!text || text.length > 4096 || /[\s\\]/.test(text)) return null;
    let url;
    try{ url = new URL(text); }catch(e){ return null; }
    if(url.username || url.password || !url.hostname) return null;
    if(url.protocol === 'http:' && allowHttp) return { type:'external', url:url.href };
    if(url.protocol !== 'https:' || !/^https:\/\/[^/]/i.test(text)) return null;
    const [, first, second, extra] = url.pathname.split('/');
    if(youtube.has(url.hostname)){
      const id = url.hostname === 'youtu.be' && !second ? first
        : first === 'watch' ? url.searchParams.get('v')
        : ['shorts', 'embed', 'live'].includes(first) && !extra ? second : null;
      if(!/^[\w-]{11}$/.test(id || '')) return null;
      return { type:'embed', url:url.href, src:'https://www.youtube-nocookie.com/embed/' + id };
    }
    if(vimeo.has(url.hostname)){
      const id = url.hostname === 'player.vimeo.com' && first === 'video' ? second : first;
      if(!/^\d+$/.test(id || '')) return null;
      const hash = url.searchParams.get('h') || (first === id ? second : '');
      if(hash && !/^[a-z0-9]+$/i.test(hash)) return null;
      return { type:'embed', url:url.href, src:'https://player.vimeo.com/video/' + id + (hash ? '?h=' + hash : '') };
    }
    if(/\.(mp4|webm|ogv|ogg)$/i.test(url.pathname)) return { type:'file', url:url.href, src:url.href };
    return { type:'external', url:url.href };
  }
  function validate(value, previous, fail){
    if(value === undefined) return previous;
    if(typeof value !== 'string') fail(422, message);
    const text = value.trim();
    if(text && text !== previous && !parse(text)) fail(422, message);
    return text;
  }
  const video = { parse, validate, message };
  if(typeof module !== 'undefined') module.exports = video;
  else root.LinksVideo = video;
})(globalThis);
