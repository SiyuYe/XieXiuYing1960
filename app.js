// 謝秀英藝術館 CMS v7.5
const DATA_VERSION='cms-v7.8.1-gallery-fix';
const LOCAL_FILES={config:'data/site-config.json',home:'data/home.json',pages:'data/pages.json',artworks:'data/artworks.json',exhibitions:'data/exhibitions.json'};
let siteConfig=null,homeData=null,pageData=null,artworks=[],exhibitions=[],historyItems=[],books=[],galleryShows=[],imageManifest={artworks:{},artworkOrder:[],teacherPhotos:{1600:['images/yingphoto/1600/xiexiuying001.webp'],600:['images/yingphoto/600/xiexiuying001.webp']}};
let heroTimer=null,uiEffectsReady=false;
const fallbackArtworks=[];
async function fetchJson(path){
 const key='xxy.static.'+path;
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),2200);
 try{const r=await fetch(`${path}?v=${DATA_VERSION}`,{cache:'force-cache',signal:controller.signal});if(!r.ok)throw new Error(path);const data=await r.json();try{localStorage.setItem(key,JSON.stringify(data));}catch(_){}return data;}
 catch(err){try{const cached=localStorage.getItem(key);if(cached)return JSON.parse(cached);}catch(_){}throw err;}
 finally{clearTimeout(timer);}
}
const truth=v=>v===true||String(v||'').toUpperCase()==='TRUE'||String(v||'')==='是';
function esc(s=''){return String(s).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[m]));}
function directImageUrl(url=''){const v=String(url||'').trim();if(!v)return '';const m=v.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=)([-\w]+)/i)||v.match(/[?&]id=([-\w]+)/i);return m?`https://drive.google.com/thumbnail?id=${m[1]}&sz=w1600`:v;}
function normalizeArtworkId(a){return String(a?.artworkId||a?.id||'').trim().toUpperCase();}
function staticArtworkUrl(a,size='1200'){const id=normalizeArtworkId(a);return /^XH\d{4}$/.test(id)?`images/artworks/${size}/${id}.webp`:'';}
function normalizeBundle(bundle,localConfig){
 if(!bundle||!bundle.ok)return null; const settings=bundle.settings||{},brand=localConfig?.brand||{};
 const config={...(localConfig||{}),backendMode:'appsScript',brand:{zh:settings.artistNameZh||brand.zh||'謝秀英',en:settings.artistNameEn||brand.en||'Xie Xiu-Ying',mark:settings.artistMark||brand.mark||'秀',siteName:settings.siteName||brand.siteName||'謝秀英書畫藝術館'},nav:settings.nav||localConfig?.nav||[],homeQuickNav:settings.homeQuickNav||localConfig?.homeQuickNav||[],facebookUrl:settings.facebookUrl||localConfig?.facebookUrl||'https://www.facebook.com/XieXiuYing1960/',facebookPostUrls:settings.facebookPostUrls||[],contactReasons:settings.contactReasons||localConfig?.contactReasons||[],showNotice:settings.showNotice==null?true:truth(String(settings.showNotice).trim())};
 const currentGallery=(bundle.gallery||[]).find(g=>truth(g.isCurrent)&&(g.isPublic==null||truth(g.isPublic)))||(bundle.gallery||[]).find(g=>g.isPublic==null||truth(g.isPublic))||null;
 const home=bundle.home?{hero:{eyebrow:bundle.home.heroEyebrow,title:bundle.home.heroTitle,subtitle:bundle.home.heroSubtitle,primaryButton:{label:bundle.home.heroPrimaryLabel,href:bundle.home.heroPrimaryHref},secondaryButton:{label:bundle.home.heroSecondaryLabel,href:bundle.home.heroSecondaryHref}},announcements:(bundle.announcements||[]).map(n=>({date:n.date||'',title:n.title||'',text:n.summary||n.text||''})),onlineShow:currentGallery?{eyebrow:'Online Exhibition',title:currentGallery.title,period:currentGallery.period,text:currentGallery.description,button:{label:'立即參觀',href:'gallery.html'}}:{},quote:{text:bundle.home.quoteText,author:bundle.home.quoteAuthor},facebook:{title:bundle.home.facebookTitle,text:bundle.home.facebookText,button:'前往粉專'}}:null;
 const mapped=(bundle.artworks||[]).map((a,index)=>({...a,__staticOrder:index,id:a.artworkId||a.id,titleZh:a.titleZh||'',titleEn:a.titleEn||'',image:staticArtworkUrl(a,'1200'),thumbnail:staticArtworkUrl(a,'1200'),featured:truth(a.isFeatured),hero:truth(a.isHomeHero),gallery:truth(a.isGallery),public:!(a.isPublic===false||String(a.isPublic).toUpperCase()==='FALSE')}));
 return {config,home,pages:bundle.pages||{},artworks:mapped,exhibitions:bundle.exhibitions||[],history:bundle.history||[],books:bundle.books||[],gallery:bundle.gallery||[]};
}
async function loadBackendBundle(config){
 if(!window.XxyCms)return null;
 const key='xxy.siteBundle.v773';
 try{const cached=JSON.parse(localStorage.getItem(key)||'null');if(cached&&Date.now()-cached.time<24*60*60*1000)return normalizeBundle(cached.data,config);}catch(_){}
 const api=await XxyCms.resolveApiUrl();if(!api)return null;
 const data=await XxyCms.siteBundle();
 try{localStorage.setItem(key,JSON.stringify({time:Date.now(),data}));}catch(_){}
 return normalizeBundle(data,config);
}
async function initData(){
 const local=await Promise.all([
  fetchJson(LOCAL_FILES.config).catch(()=>null),fetchJson('data/images-manifest.json').catch(()=>null),
  fetchJson(LOCAL_FILES.home).catch(()=>null),fetchJson(LOCAL_FILES.pages).catch(()=>null),
  fetchJson(LOCAL_FILES.artworks).catch(()=>[]),fetchJson(LOCAL_FILES.exhibitions).catch(()=>[])
 ]);
 siteConfig=local[0];if(local[1])imageManifest=local[1];homeData=local[2];pageData=local[3];artworks=local[4]||[];exhibitions=local[5]||[];
 seedArtworkImagesFromManifest_();normalizeArtworkList_();renderSite_();
 const refresh=()=>loadBackendBundle(siteConfig).then(b=>{if(!b)return;siteConfig=b.config||siteConfig;homeData=b.home||homeData;pageData=b.pages||pageData;artworks=b.artworks||artworks;exhibitions=b.exhibitions||exhibitions;historyItems=b.history||historyItems;books=b.books||books;galleryShows=b.gallery||galleryShows;normalizeArtworkList_();renderSite_();}).catch(()=>{});
 const schedule=()=>setTimeout(refresh,3500);
 if(document.readyState==='complete')schedule();else addEventListener('load',schedule,{once:true});
}
function seedArtworkImagesFromManifest_(){
 const valid=(Array.isArray(artworks)?artworks:[]).filter(a=>/^XH\d{4}$/.test(normalizeArtworkId(a)));
 if(valid.length){artworks=valid;return;}
 const ids=(imageManifest.artworkOrder||[]).map(v=>String(v||'').toUpperCase()).filter(v=>/^XH\d{4}$/.test(v));
 artworks=ids.map((id,index)=>({id,artworkId:id,titleZh:'',titleEn:'',year:'',size:'',featured:index<8,hero:index<3,gallery:true,public:true,isPublic:true,__staticOrder:index}));
}
function normalizeArtworkList_(){
 const seen=new Set();
 artworks=(Array.isArray(artworks)?artworks:[])
  .map((a,index)=>({...a,__staticOrder:Number.isInteger(a.__staticOrder)?a.__staticOrder:index}))
  .filter(a=>a.public!==false&&a.isPublic!==false)
  .filter(a=>{const id=normalizeArtworkId(a)||String(a.id||'').trim();if(!id)return true;if(seen.has(id))return false;seen.add(id);return true;});
}
function renderSite_(){renderCommonShell();renderHome();renderSubpage();requestAnimationFrame(()=>{initArtSections();renderCurrentGalleryInfo();renderExhibitions();renderHistory();initContactForm();if(!uiEffectsReady){initUiEffects();uiEffectsReady=true;}});}
function shuffle(list){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function valueList(a){return [a.artworkTypeName||a.categoryZh,a.subjectNames,a.material,a.medium].filter(v=>String(v||'').trim());}
function titleLines(a){return [a.titleZh,a.titleEn].filter(v=>String(v||'').trim());}
function infoLines(a){return [[a.year,a.size].filter(v=>String(v||'').trim()).join('｜'),valueList(a).join('｜')].filter(Boolean);}
function artTitle(a){return a.titleZh||a.titleEn||'';}
function imgSrc(a){return staticArtworkUrl(a,'1200')||'assets/images/art-placeholder-clean.svg';}
function imgLargeSrc(a){return staticArtworkUrl(a,'2400')||imgSrc(a);}
function artInfoHtml(a){const titles=titleLines(a),infos=infoLines(a);return `<div class="art-info">${titles.map((v,i)=>`<${i?'span':'strong'}>${esc(v)}</${i?'span':'strong'}>`).join('')}${infos.map(v=>`<small>${esc(v)}</small>`).join('')}</div>`;}
function card(a){return `<button class="art-card protected-image" type="button" data-watermark="謝秀英" data-art-id="${esc(a.id||a.artworkId||'')}"><img src="${esc(imgSrc(a))}" alt="${esc(artTitle(a)||'謝秀英作品')}" draggable="false" loading="lazy" decoding="async" width="1200" height="1200">${artInfoHtml(a)}</button>`;}
function renderCommonShell(){
 const brand=siteConfig?.brand||{};const isHome=document.body.dataset.page==='home';document.querySelectorAll('.brand').forEach(el=>el.innerHTML=`<span class="brand-mark"><img src="assets/icons/icon-192.png" alt="謝秀英代表作圖示"></span><span><strong>${esc(isHome?(brand.siteName||'謝秀英書畫藝術館'):(brand.zh||'謝秀英'))}</strong><small>${esc(isHome?'XIE XIU-YING ART MUSEUM':(brand.en||'Xie Xiu-Ying'))}</small></span>`);
 const page=document.body.dataset.page;document.querySelectorAll('.main-nav').forEach(nav=>nav.innerHTML=(siteConfig?.nav||[]).map(i=>`<a class="nav-link ${i.id===page?'active':''}" href="${esc(i.href)}">${esc(i.id==='home'?'首頁':i.label)}</a>`).join(''));
}
function nl(s=''){return esc(s).replace(/\r?\n/g,'<br>');}
function renderHome(){
 if(document.body.dataset.page!=='home'||!homeData)return;
 const h=homeData.hero||{},copy=document.querySelector('.hero-copy');
 if(copy)copy.innerHTML=`<div class="artist-profile-card is-loading"><div class="artist-photo-skeleton" aria-hidden="true"></div><img id="artistRandomPhoto" alt="謝秀英老師" decoding="async" fetchpriority="high"><div class="artist-profile-overlay"><h1>謝秀英</h1><p class="artist-name-en">Xie Xiu-Ying</p><p class="hero-sub multiline">${nl(h.subtitle||'以書畫來美化這個世界，以書畫來安慰人的心靈。')}</p><div class="hero-actions"><a class="btn primary" href="${esc(h.primaryButton?.href||'gallery.html')}">${esc(h.primaryButton?.label||'進入線上藝廊')}</a><a class="btn ghost" href="${esc(h.secondaryButton?.href||siteConfig?.facebookUrl||'#')}" target="_blank" rel="noopener">${esc(h.secondaryButton?.label||'Facebook 粉專')}</a></div></div></div>`;
 loadRandomArtistPhoto();
 const newsSection=document.querySelector('#news');const showNotice=siteConfig?.showNotice===true;
 if(!showNotice){newsSection?.remove();document.querySelector('.home-quick a[href="#news"]')?.remove();}
 const news=document.querySelector('.news-grid');if(news&&Array.isArray(homeData.announcements))news.innerHTML=homeData.announcements.map(n=>`<article><time>${esc(n.date)}</time><h3>${esc(n.title)}</h3><p class="multiline">${nl(n.text)}</p></article>`).join('');
 const fbInfo=document.querySelector('.fb-info');if(fbInfo)fbInfo.innerHTML=`<p class="eyebrow">Facebook</p><h2>粉專最新消息</h2><p>追蹤謝秀英老師近期創作、展覽活動、課程分享與藝術生活紀錄。</p><p>更多完整作品與最新消息，歡迎前往 Facebook 粉絲專頁。</p><a class="btn primary" href="${esc(siteConfig?.facebookUrl||'https://www.facebook.com/XieXiuYing1960/')}" target="_blank" rel="noopener">前往粉專</a>`;
 const show=homeData.onlineShow||{},st=document.querySelector('.show-text');if(st)st.innerHTML=`<p class="eyebrow">${esc(show.eyebrow||'Online Exhibition')}</p><h2>${esc(show.title||'')}</h2><p>${esc(show.period||'')}</p><p class="multiline">${nl(show.text||'')}</p><a class="btn light" href="${esc(show.button?.href||'gallery.html')}">${esc(show.button?.label||'立即參觀')}</a>`;
 renderRandomQuote();
 deferUntilVisible('#fb',()=>{const run=()=>renderFacebook();if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:2500});else setTimeout(run,900);},'120px');
}
async function loadRandomArtistPhoto(){
 const img=document.querySelector('#artistRandomPhoto'),card=document.querySelector('.artist-profile-card');if(!img)return;
 try{
  const large=(imageManifest.teacherPhotos?.['1600']||[]).filter(Boolean),small=(imageManifest.teacherPhotos?.['600']||[]).filter(Boolean);
  if(!large.length)throw new Error('empty photos');
  const pick=Math.floor(Math.random()*large.length);const src=(window.innerWidth<=720&&small[pick])?small[pick]:large[pick];
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=src;});
  card?.classList.remove('is-loading');card?.classList.add('is-ready');
 }catch(e){card?.classList.remove('is-loading');card?.classList.add('is-photo-error');}
}
function deferUntilVisible(selector,callback,rootMargin='180px'){
 const el=document.querySelector(selector);if(!el)return;
 if(!('IntersectionObserver'in window)){callback();return;}
 const io=new IntersectionObserver(entries=>{if(entries.some(x=>x.isIntersecting)){io.disconnect();callback();}},{rootMargin,threshold:.01});io.observe(el);
}
function renderRandomQuote(){const box=document.querySelector('#quote');if(!box)return;const raw=homeData?.quote?.text||'';let q=raw.split(/\r?\n|｜|\|/).map(x=>x.trim()).filter(Boolean);if(!q.length)q=['以書畫來美化這個世界','以書畫來安慰人的心靈','以書畫來累積一世香氣'];const pick=q[Math.floor(Math.random()*q.length)];box.innerHTML=`<p>「${esc(pick)}」</p><span>${esc(homeData?.quote?.author||'謝秀英')}</span>`;}
let fbResizeTimer=null;
function renderFacebook(){
 const host=document.querySelector('#facebookPosts');if(!host)return;
 const page=siteConfig?.facebookUrl||'https://www.facebook.com/XieXiuYing1960/';
 const urls=(siteConfig?.facebookPostUrls||[]).filter(Boolean).slice(0,3);
 const mobileInset=window.innerWidth<=620?24:0;const width=Math.max(260,Math.min(500,Math.floor((host.getBoundingClientRect().width||500)-mobileInset)));
 const height=window.innerWidth<=620?680:620;
 if(urls.length){
  host.innerHTML=urls.map(u=>`<div class="fb-slide" style="--fb-width:${width}px"><iframe width="${width}" height="${height}" src="https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(u)}&show_text=true&width=${width}" loading="lazy" scrolling="no" allowfullscreen="true" title="Facebook 最新貼文"></iframe></div>`).join('');
 }else{
  host.innerHTML=`<div class="fb-slide fb-page-slide" style="--fb-width:${width}px"><iframe width="${width}" height="${height}" src="https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(page)}&tabs=timeline&width=${width}&height=${height}&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false" loading="lazy" scrolling="no" allowfullscreen="true" title="謝秀英 Facebook 粉專最新貼文"></iframe></div>`;
 }
 if(!host.dataset.resizeBound){host.dataset.resizeBound='1';addEventListener('resize',()=>{clearTimeout(fbResizeTimer);fbResizeTimer=setTimeout(renderFacebook,180)},{passive:true});}
}
function renderSubpage(){
 const page=document.body.dataset.page;if(page==='home')return;
 const d=(pageData&&pageData[page])||{};
 const labels={
  about:['ABOUT ARTIST','謝秀英 字：馥宇，號：無心居士。'],
  gallery:['ONLINE GALLERY','歡迎蒞臨線上藝廊，欣賞每一期精選展覽與藝術收藏。'],
  works:['COLLECTIONS','歷年作品完整收藏'],
  exhibitions:['EXHIBITIONS','個展與聯展紀錄'],
  history:['ARCHIVE','歷史典藏與出版'],
  contact:['CONTACT','歡迎收藏、演講、展覽或合作邀約']
 };
 const pair=labels[page]||[d.eyebrow||'',d.subtitle||''];
 const hero=document.querySelector('.page-hero');if(hero)hero.innerHTML=`<p class="eyebrow">${esc(pair[0])}</p><p class="page-brief">${esc(pair[1])}</p>`;
 const c=document.querySelector('[data-dynamic-sections]');if(c)c.innerHTML=(page==='about'&&Array.isArray(d.sections))?d.sections.map(s=>`<section class="content-card"><h2>${esc(s.title||'')}</h2><p class="multiline">${nl(s.body||'')}</p></section>`).join(''):'';
}
function renderCurrentGalleryInfo(){
 const host=document.querySelector('#currentGalleryInfo');if(!host)return;
 const row=(galleryShows||[]).find(g=>truth(g.isCurrent)&&(g.isPublic==null||truth(g.isPublic)));
 if(!row){host.innerHTML='<p class="page-loading">讀取中…</p>';return;}
 host.innerHTML=`<div class="current-gallery-card"><h2>${esc(row.title||'')}</h2>${row.period?`<p class="gallery-period">${esc(row.period)}</p>`:''}${row.description?`<p class="multiline">${nl(row.description)}</p>`:''}</div>`;
}
function initArtSections(){
 const pool=shuffle(artworks.filter(a=>a.featured!==false)),heroes=pool.filter(a=>a.hero===true),heroPool=(heroes.length?heroes:pool).slice(0,3),ids=new Set(heroPool.map(a=>a.id));let feat=pool.filter(a=>!ids.has(a.id));
 const image=document.querySelector('#heroImage');if(image){if(heroTimer){clearInterval(heroTimer);heroTimer=null;}let slide=0;const t=document.querySelector('#heroTitle'),m=document.querySelector('#heroMeta');function draw(){const a=heroPool[slide];if(!a){image.removeAttribute('src');t.textContent='';m.textContent='';return;}image.src=imgSrc(a);t.textContent=titleLines(a).join('　');m.innerHTML=infoLines(a).map(esc).join('<br>');}document.querySelector('.next')?.addEventListener('click',()=>{slide=(slide+1)%heroPool.length;draw()});document.querySelector('.prev')?.addEventListener('click',()=>{slide=(slide-1+heroPool.length)%heroPool.length;draw()});draw();if(heroPool.length>1)heroTimer=setInterval(()=>{slide=(slide+1)%heroPool.length;draw()},5000);}
 const featured=document.querySelector('#featuredWorks');if(featured)featured.innerHTML=feat.slice(0,8).map(card).join('');
 const gallery=document.querySelector('#galleryGrid');if(gallery)gallery.innerHTML=shuffle(artworks.filter(a=>a.gallery===true||truth(a.isGallery))).map(card).join('');
 const works=document.querySelector('#worksGrid');if(works){const drawWorks=list=>{works.innerHTML=list.map(card).join('');bindArtworkCards();};drawWorks(artworks);document.querySelectorAll('.category-pills button').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.category-pills button').forEach(x=>x.classList.remove('active'));btn.classList.add('active');const key=btn.dataset.category||btn.textContent.trim();drawWorks(key==='全部'?artworks:artworks.filter(a=>[a.subjectNames,a.artworkTypeName,a.categoryZh].some(v=>String(v||'').includes(key))));}));}
 bindArtworkCards();
}
function bindArtworkCards(){document.querySelectorAll('[data-art-id]').forEach(el=>{if(el.dataset.bound)return;el.dataset.bound='1';el.addEventListener('click',()=>openArtwork(el.dataset.artId));});}
function openArtwork(id){const a=artworks.find(x=>String(x.id||x.artworkId)===String(id));if(!a)return;let modal=document.querySelector('#artModal');if(!modal){modal=document.createElement('div');modal.id='artModal';modal.className='modal-backdrop';modal.innerHTML='<div class="art-modal protected-image" data-watermark="謝秀英"><button class="modal-close" aria-label="關閉">×</button><div class="art-modal-image"><img draggable="false"></div><div class="art-modal-copy"></div></div>';document.body.appendChild(modal);modal.querySelector('.modal-close').onclick=()=>modal.classList.remove('open');modal.onclick=e=>{if(e.target===modal)modal.classList.remove('open')}}modal.querySelector('img').src=imgLargeSrc(a);modal.querySelector('img').alt=artTitle(a)||'謝秀英作品';modal.querySelector('.art-modal-copy').innerHTML=artInfoHtml(a)+(a.description?`<p class="multiline">${nl(a.description)}</p>`:'');modal.classList.add('open');}
function renderExhibitions(){const host=document.querySelector('#exhibitionTimeline');if(!host)return;const rows=(exhibitions||[]).filter(r=>r.isPublic==null||truth(r.isPublic)).sort((a,b)=>(Number(b.year||0)-Number(a.year||0))||(Number(a.sort||0)-Number(b.sort||0)));host.innerHTML=rows.map(r=>`<article class="exhibition-row"><time>${esc(r.year||r.date||'')}</time><strong>${esc(r.title||'')}</strong><span>${esc(r.location||'')}</span><span>${esc(r.type||'')}</span></article>`).join('');}
function renderHistory(){const host=document.querySelector('#historyCards');if(!host)return;const rows=[...(historyItems||[]),...(books||[])].filter(r=>r.isPublic==null||truth(r.isPublic));host.innerHTML=rows.map((r,i)=>{const src=directImageUrl(r.imageUrl||r.coverUrl||'');return `<button class="history-card" type="button" data-history="${i}">${src?`<img src="${esc(src)}" alt="${esc(r.title||r.name||'歷史資料')}">`:''}<span><strong>${esc(r.title||r.name||'歷史資料')}</strong><small>${esc(r.year||r.date||'')}</small></span></button>`;}).join('');host.querySelectorAll('[data-history]').forEach(b=>b.onclick=()=>openHistory(rows[Number(b.dataset.history)]));}
function openHistory(r){let m=document.querySelector('#historyModal');if(!m){m=document.createElement('div');m.id='historyModal';m.className='modal-backdrop';m.innerHTML='<div class="history-modal"><button class="modal-close">×</button><div class="history-modal-body"></div></div>';document.body.appendChild(m);m.querySelector('.modal-close').onclick=()=>m.classList.remove('open');m.onclick=e=>{if(e.target===m)m.classList.remove('open')}}m.querySelector('.history-modal-body').innerHTML=`${directImageUrl(r.imageUrl||r.coverUrl)?`<img src="${esc(directImageUrl(r.imageUrl||r.coverUrl))}" alt="${esc(r.title||r.name||'')}">`:''}<div><h2>${esc(r.title||r.name||'')}</h2><p class="multiline">${nl(r.description||r.summary||r.body||'')}</p></div>`;m.classList.add('open');}
function initContactForm(){
 const reason=document.querySelector('select[name="reason"]');
 if(reason&&siteConfig?.contactReasons)reason.innerHTML='<option value="">請選擇</option>'+siteConfig.contactReasons.map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join('');
 const form=document.querySelector('#contactForm'),msg=document.querySelector('#formMessage');if(!form||form.dataset.bound)return;form.dataset.bound='1';
 form.addEventListener('submit',async e=>{e.preventDefault();const btn=form.querySelector('button[type="submit"]');btn.disabled=true;msg.textContent='送出中…';
  try{const fd=new FormData(form),data=Object.fromEntries(fd.entries());data.sourcePage='contact.html';data.userAgent=navigator.userAgent;data.lineId=data.contactPlatform==='LINE'?data.contactId:'';const res=await XxyCms.post('contact',data);msg.textContent=res.message||'已收到您的聯絡需求。';form.reset();}
  catch(err){msg.textContent='送出失敗：'+err.message;}
  finally{btn.disabled=false;}
 });
}
function initNavProgress(){
 const nav=document.querySelector('.main-nav'),shell=document.querySelector('.nav-shell');if(!nav||!shell)return;
 shell.querySelector('.nav-progress')?.remove();
 let rail=shell.querySelector('.nav-rail');if(!rail){rail=document.createElement('span');rail.className='nav-rail';rail.setAttribute('aria-hidden','true');shell.appendChild(rail);}
 const links=[...nav.querySelectorAll('.nav-link')];
 const centerActive=(behavior='auto')=>{const active=links.find(x=>x.classList.contains('active'));if(!active)return;const left=active.offsetLeft-(nav.clientWidth-active.offsetWidth)/2;nav.scrollTo({left:Math.max(0,left),behavior});};
 const updateEdges=()=>{const max=Math.max(0,nav.scrollWidth-nav.clientWidth);shell.classList.toggle('can-scroll-left',nav.scrollLeft>8);shell.classList.toggle('can-scroll-right',nav.scrollLeft<max-8);};
 nav.addEventListener('scroll',updateEdges,{passive:true});
 addEventListener('resize',()=>{centerActive('auto');updateEdges();},{passive:true});
 addEventListener('pageshow',()=>setTimeout(()=>{centerActive('auto');updateEdges();},30),{once:true});
 requestAnimationFrame(()=>{centerActive('auto');updateEdges();});
}
function initUiEffects(){const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('visible')),{threshold:.1});document.querySelectorAll('.reveal').forEach(e=>io.observe(e));const top=document.querySelector('.to-top');if(top){addEventListener('scroll',()=>top.classList.toggle('show',scrollY>500));top.onclick=()=>scrollTo({top:0,behavior:'smooth'});}initNavProgress();}
document.addEventListener('contextmenu',e=>e.preventDefault());document.addEventListener('dragstart',e=>e.preventDefault());initData();if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
