(function(){
  'use strict';
  var dialog=null,lastTrigger=null;
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function isMobileShare(){return !!(navigator.share&&(window.matchMedia('(pointer: coarse)').matches||window.innerWidth<=820));}
  function copyText(text){
    if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(text);
    return new Promise(function(resolve,reject){var area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();try{document.execCommand('copy')?resolve():reject(new Error('copy failed'));}catch(err){reject(err);}area.remove();});
  }
  function toast(message){var node=document.querySelector('.artwork-share-toast');if(!node){node=document.createElement('div');node.className='artwork-share-toast';node.setAttribute('role','status');node.setAttribute('aria-live','polite');document.body.appendChild(node);}node.textContent=message;node.classList.add('show');clearTimeout(node._timer);node._timer=setTimeout(function(){node.classList.remove('show');},1800);}
  function close(){if(!dialog)return;dialog.classList.remove('open');dialog.setAttribute('aria-hidden','true');document.documentElement.classList.remove('artwork-share-open');if(lastTrigger&&lastTrigger.focus)lastTrigger.focus();}
  function ensureDialog(){
    if(dialog)return dialog;
    dialog=document.createElement('div');dialog.className='artwork-share-backdrop';dialog.setAttribute('aria-hidden','true');
    dialog.innerHTML='<section class="artwork-share-panel" role="dialog" aria-modal="true" aria-labelledby="artworkShareTitle"><button type="button" class="artwork-share-close" aria-label="關閉分享選單">×</button><p class="eyebrow">SHARE</p><h2 id="artworkShareTitle">分享這件作品</h2><p class="artwork-share-name"></p><div class="artwork-share-options"><a class="share-option share-facebook" target="_blank" rel="noopener noreferrer"><span class="share-brand-icon icon-facebook" aria-hidden="true">f</span><span>Facebook</span></a><a class="share-option share-line" target="_blank" rel="noopener noreferrer"><span class="share-brand-icon icon-line" aria-hidden="true">L</span><span>LINE</span></a><a class="share-option share-x" target="_blank" rel="noopener noreferrer"><span class="share-brand-icon icon-x" aria-hidden="true">𝕏</span><span>X</span></a><button type="button" class="share-option share-copy"><span class="share-brand-icon icon-copy" aria-hidden="true">🔗</span><span>複製連結</span></button></div><p class="artwork-share-help">Instagram、微信、Discord、Threads 可先複製作品連結，再貼到對應平台。</p></section>';
    document.body.appendChild(dialog);
    dialog.querySelector('.artwork-share-close').addEventListener('click',close);
    dialog.addEventListener('click',function(event){if(event.target===dialog)close();});
    document.addEventListener('keydown',function(event){if(event.key==='Escape'&&dialog.classList.contains('open'))close();});
    return dialog;
  }
  function desktop(payload,trigger){
    var box=ensureDialog(),url=encodeURIComponent(payload.url),title=payload.title||'謝秀英作品',text=payload.text||title;
    lastTrigger=trigger||document.activeElement;
    box.querySelector('.artwork-share-name').textContent=title;
    box.querySelector('.share-facebook').href='https://www.facebook.com/sharer/sharer.php?u='+url;
    box.querySelector('.share-line').href='https://social-plugins.line.me/lineit/share?url='+url;
    box.querySelector('.share-x').href='https://twitter.com/intent/tweet?text='+encodeURIComponent(text)+'&url='+url;
    box.querySelector('.share-copy').onclick=function(){copyText(payload.url).then(function(){toast('作品連結已複製');close();}).catch(function(){toast('無法自動複製，請手動複製網址列');});};
    box.classList.add('open');box.setAttribute('aria-hidden','false');document.documentElement.classList.add('artwork-share-open');setTimeout(function(){box.querySelector('.artwork-share-close').focus();},0);
  }
  function open(payload,trigger){
    payload=payload||{};payload.url=payload.url||location.href;payload.title=payload.title||document.title;payload.text=payload.text||payload.title;
    if(isMobileShare()){
      navigator.share({title:payload.title,text:payload.text,url:payload.url}).catch(function(err){if(!err||err.name!=='AbortError')desktop(payload,trigger);});
      return;
    }
    desktop(payload,trigger);
  }
  function bind(root){(root||document).querySelectorAll('[data-share-artwork]').forEach(function(button){if(button.dataset.shareBound)return;button.dataset.shareBound='1';button.addEventListener('click',function(){open({title:button.dataset.shareTitle||document.title,text:button.dataset.shareText||button.dataset.shareTitle||document.title,url:button.dataset.shareUrl||location.href},button);});});}
  window.XxyArtworkShare={open:open,bind:bind,close:close};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){bind(document);});else bind(document);
})();
