(function(global){
  'use strict';
  var CDN_BASE='https://cdn.jsdelivr.net/gh/siyuye/XieXiuYing1960@main';
  var PAGES_BASE='https://siyuye.github.io/XieXiuYing1960';
  var PLACEHOLDER='../assets/images/art-placeholder-clean.svg';
  function text(v){return String(v==null?'':v).trim();}
  function idOf(a){return text(a&&(a.artworkId||a.id)).toUpperCase();}
  function localUrl(url){
    url=text(url);
    if(!url)return '';
    if(/^(?:https?:|data:|blob:|\/|\.\.\/)/i.test(url))return url;
    if(/^(?:images|assets|data)\//i.test(url))return '../'+url;
    return url;
  }
  function unique(list){var out=[],seen={};for(var i=0;i<list.length;i++){var u=text(list[i]);if(!u||seen[u])continue;seen[u]=true;out.push(u);}return out;}
  function candidates(a,size){
    a=a||{};var id=idOf(a),isLarge=size==='large';
    var cdnField=isLarge?(a.CDNimageUrl||a.cdnImageUrl):(a.CDNthumbUrl||a.cdnThumbUrl);
    var normalField=isLarge?(a.imageUrl||a.thumbUrl):(a.thumbUrl||a.imageUrl);
    var folder=isLarge?'2400':'1200';
    var list=[localUrl(cdnField)];
    if(id)list.push(CDN_BASE+'/images/artworks/'+folder+'/'+encodeURIComponent(id)+'.webp');
    list.push(localUrl(normalField));
    if(id)list.push(PAGES_BASE+'/images/artworks/'+folder+'/'+encodeURIComponent(id)+'.webp');
    list.push(PLACEHOLDER);
    return unique(list);
  }
  function configure(img,a,size){
    if(!img)return;
    var list=candidates(a,size);
    img._xxyImageCandidates=list;
    img._xxyImageIndex=0;
    img.onerror=function(){next(img);};
    img.src=list[0]||PLACEHOLDER;
  }
  function next(img){
    var list=img&&img._xxyImageCandidates||[PLACEHOLDER];
    var index=(img._xxyImageIndex||0)+1;
    if(index>=list.length){img.onerror=null;img.src=PLACEHOLDER;return;}
    img._xxyImageIndex=index;
    img.src=list[index];
  }
  function primary(a,size){var list=candidates(a,size);return list[0]||PLACEHOLDER;}
  global.XxyAdminImages={candidates:candidates,configure:configure,next:next,primary:primary,placeholder:PLACEHOLDER};
})(window);
