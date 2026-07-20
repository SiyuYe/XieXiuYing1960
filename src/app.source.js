// 謝秀英藝術館 CMS v7.5
const DATA_VERSION='cms-v7.9.0-step9b';
const CACHE_CLEANUP_VERSION='xxy.cacheCleanup.v8140';
const IMAGE_PLACEHOLDER='assets/images/art-placeholder-clean.svg';
const CDN_REPO_BASE='https://cdn.jsdelivr.net/gh/siyuye/XieXiuYing1960@main/';
const GITHUB_PAGES_BASE='https://siyuye.github.io/XieXiuYing1960/';
const CLIENT_ERROR_LOG_KEY='xxy.clientErrors.v7909b';
const JSON_TIMEOUT_MS=12000;
const SITE_DATA_FILE='data/site-data.json';
const SITE_VERSION_FILE='data/site-version.json';
const SITE_DATA_CACHE_PREFIX='xxy.siteData.';
const SITE_DATA_CURRENT_VERSION_KEY='xxy.siteData.currentVersion';
const SITE_VERSION_CACHE_KEY='xxy.siteVersion.latest';
let artworkAssetVersion=DATA_VERSION;
let siteConfig=null,homeData=null,pageData=null,artworks=[],exhibitions=[],historyItems=[],books=[],galleryShows=[],imageManifest={artworks:{},artworkOrder:[],teacherPhotos:{1600:['images/yingphoto/1600/xiexiuying001.webp'],600:['images/yingphoto/600/xiexiuying001.webp']}};
const ART_BATCH_SIZE=16;
let heroTimer=null,uiEffectsReady=false;
const fallbackArtworks=[];

function rememberClientError_(kind,error,extra){
 try{
  const list=JSON.parse(sessionStorage.getItem(CLIENT_ERROR_LOG_KEY)||'[]');
  list.push({time:new Date().toISOString(),kind:String(kind||'error'),message:String(error&&error.message?error.message:error||''),stack:String(error&&error.stack?error.stack:''),extra:extra||null,page:location.pathname});
  while(list.length>20)list.shift();
  sessionStorage.setItem(CLIENT_ERROR_LOG_KEY,JSON.stringify(list));
 }catch(_){}
 if(window.console&&typeof window.console.error==='function')console.error('[XieXiuYing '+kind+']',error,extra||'');
}
function showGlobalErrorNotice_(message){
 if(!document.body)return;
 let box=document.querySelector('#siteErrorNotice');
 if(!box){box=document.createElement('div');box.id='siteErrorNotice';box.className='site-error-notice';box.setAttribute('role','status');box.setAttribute('aria-live','polite');document.body.appendChild(box);}
 box.textContent=message||'網站部分內容暫時無法載入，請重新整理頁面。';
 box.hidden=false;
}
function installGlobalErrorHandling_(){
 window.addEventListener('error',function(event){
  if(event&&event.target&&event.target.tagName==='IMG')return;
  rememberClientError_('javascript',event&&event.error?event.error:(event&&event.message)||'Unknown script error',{file:event&&event.filename,line:event&&event.lineno,column:event&&event.colno});
  showGlobalErrorNotice_('網站部分功能暫時發生錯誤，請重新整理頁面。');
 });
 window.addEventListener('unhandledrejection',function(event){
  rememberClientError_('promise',event?event.reason:'Unhandled promise rejection');
  showGlobalErrorNotice_('網站資料暫時無法完整載入，請重新整理頁面。');
 });
}
function installImageFallback_(){
 document.addEventListener('error',function(event){
  const img=event&&event.target;
  if(!img||img.tagName!=='IMG')return;
  if(img.dataset&&img.dataset.manualFallback==='1')return;
  const current=String(img.getAttribute('src')||'');
  if(current.indexOf('art-placeholder-clean.svg')>=0)return;
  rememberClientError_('image',new Error('圖片載入失敗：'+current),{alt:img.getAttribute('alt')||''});
  const step=Number((img.dataset&&img.dataset.fallbackStep)||0);
  const githubFallback=(img.dataset&&img.dataset.fallbackSrc)||'';
  const finalFallback=(img.dataset&&img.dataset.finalFallback)||IMAGE_PLACEHOLDER;
  if(step===0&&githubFallback&&githubFallback!==current){
   if(img.dataset)img.dataset.fallbackStep='1';
   img.removeAttribute('srcset');
   img.src=githubFallback;
   return;
  }
  if(img.dataset)img.dataset.fallbackStep='2';
  img.removeAttribute('srcset');
  img.src=finalFallback;
  const card=img.closest?img.closest('.art-card,.hero-art,.artist-profile-card,.admin-preview'):null;
  if(card&&card.classList)card.classList.add('is-photo-error');
 },true);
}
function cleanupLegacyCachesOnce_(){
 try{if(localStorage.getItem(CACHE_CLEANUP_VERSION)==='1')return;}catch(_){}
 const preserve={'xxy.cms.apiUrl':true,'xxy.cms.adminToken':true};
 try{
  const remove=[];
  for(let i=0;i<localStorage.length;i++){
   const key=localStorage.key(i)||'';
   if(preserve[key])continue;
   if(key.indexOf('xxy.static.')===0||key.indexOf('xxy.siteBundle.')===0||key.indexOf('xxy.cms.v')===0||key==='xxy.cms.authError')remove.push(key);
  }
  remove.forEach(function(key){localStorage.removeItem(key);});
  localStorage.setItem(CACHE_CLEANUP_VERSION,'1');
 }catch(err){rememberClientError_('cache-cleanup',err);}
 if('serviceWorker' in navigator&&navigator.serviceWorker.getRegistrations){
  navigator.serviceWorker.getRegistrations().then(function(registrations){return Promise.all(registrations.map(function(registration){return registration.unregister();}));}).catch(function(err){rememberClientError_('service-worker-cleanup',err);});
 }
 if('caches' in window&&window.caches&&caches.keys){
  caches.keys().then(function(keys){return Promise.all(keys.filter(function(key){return key.indexOf('xxy-')===0;}).map(function(key){return caches.delete(key);}));}).catch(function(err){rememberClientError_('cache-storage-cleanup',err);});
 }
}

function createCompatSet_(initialValues){
 if(typeof Set==='function')return new Set(initialValues||[]);
 const values=[];
 (initialValues||[]).forEach(function(value){if(values.indexOf(value)<0)values.push(value);});
 return {
  has:function(value){return values.indexOf(value)>=0;},
  add:function(value){if(values.indexOf(value)<0)values.push(value);return this;}
 };
}
function readJsonStorage_(key){
 try{
  const raw=localStorage.getItem(key);
  return raw?JSON.parse(raw):null;
 }catch(_){return null;}
}
function writeJsonStorage_(key,value){
 try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}
}
function siteDataCacheKey_(version){return SITE_DATA_CACHE_PREFIX+String(version||'unknown');}
function cleanupVersionedSiteDataCache_(keepVersion){
 try{
  const keepKey=siteDataCacheKey_(keepVersion);
  const remove=[];
  for(let i=0;i<localStorage.length;i++){
   const key=localStorage.key(i)||'';
   if(key.indexOf(SITE_DATA_CACHE_PREFIX)===0&&key!==keepKey&&key!==SITE_DATA_CURRENT_VERSION_KEY)remove.push(key);
  }
  remove.forEach(function(key){localStorage.removeItem(key);});
  localStorage.removeItem('xxy.static.'+SITE_DATA_FILE);
 }catch(err){rememberClientError_('site-data-cache-cleanup',err);}
}
async function fetchJsonRequest_(url,cacheMode){
 const supportsAbort=typeof window.AbortController==='function';
 const controller=supportsAbort?new window.AbortController():null;
 let timer=null;
 if(controller)timer=setTimeout(function(){controller.abort();},JSON_TIMEOUT_MS);
 try{
  const options={cache:cacheMode||'default'};
  if(controller)options.signal=controller.signal;
  const response=await fetch(url,options);
  if(!response.ok)throw new Error('HTTP '+response.status+'：'+url);
  return await response.json();
 }finally{if(timer!==null)clearTimeout(timer);}
}
async function fetchLatestSiteVersion_(){
 try{
  const versionUrl=SITE_VERSION_FILE+'?t='+Date.now();
  const manifest=await fetchJsonRequest_(versionUrl,'no-store');
  const version=String(manifest&&manifest.dataVersion||'').trim();
  if(!version)throw new Error('site-version.json 缺少 dataVersion');
  writeJsonStorage_(SITE_VERSION_CACHE_KEY,manifest);
  return manifest;
 }catch(err){
  const cached=readJsonStorage_(SITE_VERSION_CACHE_KEY);
  if(cached&&cached.dataVersion)return cached;
  let current='';
  try{current=localStorage.getItem(SITE_DATA_CURRENT_VERSION_KEY)||'';}catch(_){}
  if(current)return {schemaVersion:1,dataVersion:current,generatedAt:'',publishedAt:'',cached:true};
  const wrapped=new Error('版本資料讀取失敗：'+SITE_VERSION_FILE);
  wrapped.cause=err;
  throw wrapped;
 }
}
async function fetchSiteDataByVersion_(version){
 const normalizedVersion=String(version||'').trim();
 if(!normalizedVersion)throw new Error('缺少網站資料版本號');
 const cacheKey=siteDataCacheKey_(normalizedVersion);
 try{
  const dataUrl=SITE_DATA_FILE+'?v='+encodeURIComponent(normalizedVersion);
  const data=await fetchJsonRequest_(dataUrl,'default');
  writeJsonStorage_(cacheKey,data);
  try{localStorage.setItem(SITE_DATA_CURRENT_VERSION_KEY,normalizedVersion);}catch(_){}
  cleanupVersionedSiteDataCache_(normalizedVersion);
  return data;
 }catch(err){
  const exactCached=readJsonStorage_(cacheKey);
  if(exactCached)return exactCached;
  let lastVersion='';
  try{lastVersion=localStorage.getItem(SITE_DATA_CURRENT_VERSION_KEY)||'';}catch(_){}
  if(lastVersion){
   const lastCached=readJsonStorage_(siteDataCacheKey_(lastVersion));
   if(lastCached)return lastCached;
  }
  const message=err&&err.name==='AbortError'?'資料讀取逾時：'+SITE_DATA_FILE:'資料讀取失敗：'+SITE_DATA_FILE;
  const wrapped=new Error(message);
  wrapped.cause=err;
  throw wrapped;
 }
}
async function fetchCurrentSiteData_(){
 const manifest=await fetchLatestSiteVersion_();
 const data=await fetchSiteDataByVersion_(manifest.dataVersion);
 return {manifest,data};
}
const truth=v=>v===true||String(v||'').toUpperCase()==='TRUE'||String(v||'')==='是';
function esc(s=''){return String(s).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[m]));}
function directImageUrl(url=''){const v=String(url||'').trim();if(!v)return '';const m=v.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=)([-\w]+)/i)||v.match(/[?&]id=([-\w]+)/i);return m?`https://drive.google.com/thumbnail?id=${m[1]}&sz=w1600`:v;}
function normalizeArtworkId(a){return String(a?.artworkId||a?.id||'').trim().toUpperCase();}
function validArtworkImageId_(id){return /^[A-Z0-9_-]+$/.test(String(id||''));}
function appendArtworkVersion_(url){
 const value=String(url||'').trim();
 if(!value||value.indexOf('art-placeholder-clean.svg')>=0)return value;
 const version=String(artworkAssetVersion||DATA_VERSION||'').trim();
 if(!version)return value;
 try{
  const parsed=new URL(value,location.href);
  parsed.searchParams.set('v',version);
  if(/^[a-z][a-z0-9+.-]*:/i.test(value)||value.startsWith('//'))return parsed.href;
  return parsed.pathname.replace(/^\/XieXiuYing1960\//,'')+parsed.search+parsed.hash;
 }catch(_){return value+(value.indexOf('?')>=0?'&':'?')+'v='+encodeURIComponent(version);}
}
function staticArtworkUrl(a,size='1200'){const id=normalizeArtworkId(a);return validArtworkImageId_(id)?appendArtworkVersion_(`images/artworks/${size}/${id}.webp`):'';}
function cdnArtworkUrl_(a,size='1200'){const id=normalizeArtworkId(a);return validArtworkImageId_(id)?appendArtworkVersion_(`${CDN_REPO_BASE}images/artworks/${size}/${id}.webp`):'';}
function githubArtworkFallback_(a,size='1200'){
 const explicit=size==='2400'?(a.imageUrl||''):(a.thumbUrl||a.imageUrl||'');
 const value=String(explicit||'').trim();
 if(value)return appendArtworkVersion_(value);
 return staticArtworkUrl(a,size)||'';
}
function artworkImageSources_(a,size='1200'){
 const githubPrimary=githubArtworkFallback_(a,size);
 const cdnField=size==='2400'?(a.CDNimageUrl||a.cdnImageUrl||''):(a.CDNthumbUrl||a.cdnThumbUrl||'');
 const cdnFallback=appendArtworkVersion_(String(cdnField||'').trim())||cdnArtworkUrl_(a,size);
 const primary=githubPrimary||cdnFallback||IMAGE_PLACEHOLDER;
 return {primary,fallback:cdnFallback&&cdnFallback!==primary?cdnFallback:'',final:IMAGE_PLACEHOLDER};
}
function teacherLocalPath_(path,size){
 const value=String(path||'').trim();
 if(value)return value.replace(/^\/+/, '');
 return `images/yingphoto/${size}/xiexiuying001.webp`;
}
function teacherCdnPath_(path,size){return CDN_REPO_BASE+teacherLocalPath_(path,size);}
function imageFallbackAttrs_(sources){
 return `data-fallback-src="${esc(sources.fallback||'')}" data-final-fallback="${esc(sources.final||IMAGE_PLACEHOLDER)}" data-fallback-step="0"`;
}
function defaultPublicConfig_(){
 return {
  version:DATA_VERSION,
  backendMode:'staticJson',
  brand:{zh:'謝秀英',en:'Xie Xiu-Ying',mark:'秀',siteName:'謝秀英書畫藝術館'},
  facebookUrl:'https://www.facebook.com/XieXiuYing1960/',
  nav:[
   {id:'home',label:'首頁',href:'index.html'},{id:'about',label:'關於秀英',href:'about.html'},
   {id:'gallery',label:'藝廊',href:'gallery.html'},{id:'works',label:'作品集',href:'works.html'},
   {id:'exhibitions',label:'展覽經歷',href:'exhibitions.html'},{id:'history',label:'歷史回顧',href:'history.html'},
   {id:'contact',label:'聯絡',href:'contact.html'}
  ],
  homeQuickNav:[
   {id:'hero',label:'藝術焦點'},{id:'news',label:'最新消息'},{id:'online-show',label:'線上藝廊'},
   {id:'featured',label:'精選作品'},{id:'quote',label:'畫家語錄'},{id:'fb',label:'粉專消息'}
  ],
  contactReasons:['作品收藏洽詢','展覽邀約','課程／教學','媒體採訪','其他合作'],
  showNotice:false
 };
}
function normalizeSiteData_(bundle){
 if(!bundle||bundle.ok!==true)throw new Error('site-data.json 格式不正確或尚未發布');
 if(Number(bundle.schemaVersion)!==1)throw new Error('site-data.json schemaVersion 不支援');
 artworkAssetVersion=String(bundle.dataVersion||bundle.version||DATA_VERSION).trim()||DATA_VERSION;
 const settings=bundle.settings||{};
 const base=defaultPublicConfig_();
 const config={
  ...base,
  ...(bundle.config||{}),
  version:bundle.dataVersion||bundle.version||DATA_VERSION,
  backendMode:'staticJson',
  brand:{
   ...(base.brand||{}),
   ...((bundle.config&&bundle.config.brand)||{}),
   zh:settings.artistNameZh||((bundle.config&&bundle.config.brand&&bundle.config.brand.zh)||base.brand.zh),
   en:settings.artistNameEn||((bundle.config&&bundle.config.brand&&bundle.config.brand.en)||base.brand.en),
   mark:settings.artistMark||((bundle.config&&bundle.config.brand&&bundle.config.brand.mark)||base.brand.mark),
   siteName:settings.siteName||((bundle.config&&bundle.config.brand&&bundle.config.brand.siteName)||base.brand.siteName)
  },
  nav:Array.isArray(settings.nav)?settings.nav:((bundle.config&&bundle.config.nav)||base.nav),
  homeQuickNav:Array.isArray(settings.homeQuickNav)?settings.homeQuickNav:((bundle.config&&bundle.config.homeQuickNav)||base.homeQuickNav),
  facebookUrl:settings.facebookUrl||((bundle.config&&bundle.config.facebookUrl)||base.facebookUrl),
  contactReasons:Array.isArray(settings.contactReasons)?settings.contactReasons:((bundle.config&&bundle.config.contactReasons)||base.contactReasons),
  showNotice:settings.showNotice===true
 };
 const h=bundle.home||{};
 const currentGallery=(bundle.gallery||[]).find(g=>truth(g.isCurrent)&&(g.isPublic==null||truth(g.isPublic)))||(bundle.gallery||[]).find(g=>g.isPublic==null||truth(g.isPublic))||null;
 const home=(h.hero||h.quote||h.onlineShow)?h:{
  hero:{eyebrow:h.heroEyebrow||'XIE XIU-YING ART MUSEUM',title:h.heroTitle||'謝秀英\n書畫藝術館',subtitle:h.heroSubtitle||'以書畫來美化這個世界，以書畫來安慰人的心靈。',primaryButton:{label:h.heroPrimaryLabel||'進入線上藝廊',href:h.heroPrimaryHref||'gallery.html'},secondaryButton:{label:h.heroSecondaryLabel||'Facebook 粉專',href:h.heroSecondaryHref||config.facebookUrl}},
  announcements:(bundle.notices||bundle.announcements||[]).map(n=>({date:n.date||'',title:n.title||'',text:n.summary||n.text||n.body||''})),
  onlineShow:currentGallery?{eyebrow:'Online Exhibition',title:currentGallery.title||'',period:currentGallery.period||'',text:currentGallery.description||'',button:{label:'立即參觀',href:'gallery.html'}}:{},
  quote:{text:h.quoteText||'一花一草皆佛性，昆蟲飛鳥皆如來。',author:h.quoteAuthor||'謝秀英　無心居士合十'},
  facebook:{title:h.facebookTitle||'粉專最新消息',text:h.facebookText||'',button:'前往粉專'}
 };
 const mapped=(bundle.artworks||[]).map((a,index)=>({...a,__staticOrder:index,id:a.artworkId||a.id,titleZh:a.titleZh||'',titleEn:a.titleEn||'',image:a.CDNthumbUrl||a.cdnThumbUrl||a.image||a.thumbUrl||cdnArtworkUrl_(a,'1200')||staticArtworkUrl(a,'1200'),thumbnail:a.CDNthumbUrl||a.cdnThumbUrl||a.thumbnail||a.thumbUrl||cdnArtworkUrl_(a,'1200')||staticArtworkUrl(a,'1200'),featured:a.featured===true||truth(a.isFeatured),hero:a.hero===true||truth(a.isHomeHero),gallery:a.gallery===true||truth(a.isGallery),public:!(a.isPublic===false||String(a.isPublic).toUpperCase()==='FALSE')}));
 const manifest=bundle.imageManifest||{artworks:{},artworkOrder:[],teacherPhotos:{1600:['images/yingphoto/1600/xiexiuying001.webp'],600:['images/yingphoto/600/xiexiuying001.webp']}};
 return {config,home,pages:bundle.pages||{},artworks:mapped,exhibitions:bundle.exhibitions||[],history:bundle.history||[],books:bundle.books||[],gallery:bundle.gallery||[],imageManifest:manifest};
}
async function initData(){
 try{
  const loaded=await fetchCurrentSiteData_();
  const bundle=loaded.data;
  const normalized=normalizeSiteData_(bundle);
  siteConfig=normalized.config;homeData=normalized.home;pageData=normalized.pages;artworks=normalized.artworks;exhibitions=normalized.exhibitions;historyItems=normalized.history;books=normalized.books;galleryShows=normalized.gallery;imageManifest=normalized.imageManifest||imageManifest;
  seedArtworkImagesFromManifest_();normalizeArtworkList_();renderSite_();
 }catch(err){
  siteConfig=defaultPublicConfig_();homeData={};pageData={};artworks=[];exhibitions=[];historyItems=[];books=[];galleryShows=[];
  try{renderSite_();}catch(renderErr){rememberClientError_('render-after-site-data-failure',renderErr);}
  renderDataLoadFailure_([{path:SITE_DATA_FILE,error:err}]);
 }
}
function renderDataLoadFailure_(failures){
 const hasArtworkData=Array.isArray(artworks)&&artworks.length>0;
 const message=hasArtworkData?'部分即時資料暫時無法更新，已顯示可用內容。':'作品資料暫時載入失敗，請重新整理頁面。';
 ['#worksGrid','#galleryGrid','#featuredGrid'].forEach(function(selector){
  const host=document.querySelector(selector);
  if(host&&!host.children.length)host.innerHTML='<p class="page-loading data-load-error" role="status">'+esc(message)+'</p>';
 });
 const current=document.querySelector('#currentGalleryInfo');
 if(current)current.innerHTML='<p class="page-loading data-load-error" role="status">'+esc(message)+'</p>';
 failures.forEach(function(item){rememberClientError_('json',item.error,{path:item.path});});
 if(window.console&&typeof window.console.warn==='function')console.warn('[XieXiuYing] JSON load warning',failures);
}
function seedArtworkImagesFromManifest_(){
 const valid=(Array.isArray(artworks)?artworks:[]).filter(a=>/^XH\d{4}$/.test(normalizeArtworkId(a)));
 if(valid.length){artworks=valid;return;}
 const ids=(imageManifest.artworkOrder||[]).map(v=>String(v||'').toUpperCase()).filter(v=>/^XH\d{4}$/.test(v));
 artworks=ids.map((id,index)=>({id,artworkId:id,titleZh:'',titleEn:'',year:'',size:'',featured:index<8,hero:index<3,gallery:true,public:true,isPublic:true,__staticOrder:index}));
}
function normalizeArtworkList_(){
 const seen=createCompatSet_();
 artworks=(Array.isArray(artworks)?artworks:[])
  .map((a,index)=>({...a,__staticOrder:Number.isInteger(a.__staticOrder)?a.__staticOrder:index}))
  .filter(a=>a.public!==false&&a.isPublic!==false)
  .filter(a=>{const id=normalizeArtworkId(a)||String(a.id||'').trim();if(!id)return true;if(seen.has(id))return false;seen.add(id);return true;});
}
function renderSite_(){renderCommonShell();renderHome();renderSubpage();requestAnimationFrame(()=>{initArtSections();renderCurrentGalleryInfo();renderExhibitions();renderHistory();initContactForm();if(!uiEffectsReady){initUiEffects();uiEffectsReady=true;}});}
function shuffle(list){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

let artworkSeoDefault_=null,collectionSeoDefault_=null;
let artworkUrlOpened_=false;
function ensureMeta_(selector,attrs){
 let el=document.head.querySelector(selector);
 if(!el){el=document.createElement(attrs.tag||'meta');Object.keys(attrs).forEach(k=>{if(k!=='tag'&&k!=='content')el.setAttribute(k,attrs[k]);});document.head.appendChild(el);}
 return el;
}
function rememberArtworkSeoDefault_(){
 if(artworkSeoDefault_)return;
 const description=document.head.querySelector('meta[name="description"]');
 const canonical=document.head.querySelector('link[rel="canonical"]');
 artworkSeoDefault_={title:document.title,description:description?description.content:'',canonical:canonical?canonical.href:location.href.split('?')[0]};
}
function applyArtworkSeo_(a){
 if(!a||!window.SeoHelper)return;
 rememberArtworkSeoDefault_();
 const canonical=window.SeoHelper.generateCanonical(a);
 document.title=window.SeoHelper.generateTitle(a);
 ensureMeta_('meta[name="description"]',{name:'description'}).content=window.SeoHelper.generateDescription(a);
 ensureMeta_('link[rel="canonical"]',{tag:'link',rel:'canonical'}).href=canonical;
 const url=new URL(location.href);url.searchParams.set('id',a.id||a.artworkId||'');history.replaceState({artworkId:a.id||a.artworkId||''},'',url.href);
}
function restoreArtworkSeo_(){
 if(!artworkSeoDefault_)return;
 document.title=artworkSeoDefault_.title;
 ensureMeta_('meta[name="description"]',{name:'description'}).content=artworkSeoDefault_.description;
 ensureMeta_('link[rel="canonical"]',{tag:'link',rel:'canonical'}).href=artworkSeoDefault_.canonical;
 const url=new URL(location.href);url.searchParams.delete('id');history.replaceState({},'',url.href);
}
function openArtworkFromUrl_(){
 if(artworkUrlOpened_)return;
 const id=new URLSearchParams(location.search).get('id');
 if(!id)return;
 artworkUrlOpened_=true;openArtwork(id);
}


const COLLECTION_FILTERS={
 type:{label:'作品類型',fields:['artworkTypeName','categoryZh','artworkType','typeName']},
 subject:{label:'題材',fields:['subjectNames','subjectName','subject']},
 material:{label:'材質',fields:['materialNames','materialName','material']},
 medium:{label:'媒材',fields:['mediumNames','mediumName','medium']}
};
function collectionFilterFromUrl_(){
 const params=new URLSearchParams(location.search);
 for(const key of ['type','subject','material','medium']){
  const value=String(params.get(key)||'').trim();
  if(value)return {key,value,config:COLLECTION_FILTERS[key]};
 }
 return null;
}
function collectionSearchFromUrl_(){return String(new URLSearchParams(location.search).get('q')||'').trim();}
function filterSearchArtworks_(list,query){
 const q=String(query||'').trim().toLocaleLowerCase();if(!q)return list;
 return (list||[]).filter(a=>[a.titleZh,a.titleEn,a.artworkTypeName,a.categoryZh,a.subjectNames,a.material,a.medium,a.year,a.size].join(' ').toLocaleLowerCase().includes(q));
}
function collectionFieldTerms_(artwork,fields){
 const terms=[];
 (fields||[]).forEach(field=>{
  const raw=artwork&&artwork[field];
  const values=Array.isArray(raw)?raw:String(raw||'').split(/[、,，;；|｜/]+/);
  values.forEach(value=>{const text=String(value||'').trim();if(text&&terms.indexOf(text)<0)terms.push(text);});
 });
 return terms;
}
function filterCollectionArtworks_(list,filter){
 if(!filter||!filter.value)return list;
 return (list||[]).filter(artwork=>collectionFieldTerms_(artwork,filter.config.fields).some(term=>term===filter.value||term.includes(filter.value)||filter.value.includes(term)));
}
function rememberCollectionSeoDefault_(){
 if(collectionSeoDefault_)return;
 const description=document.head.querySelector('meta[name="description"]');
 const canonical=document.head.querySelector('link[rel="canonical"]');
 collectionSeoDefault_={title:document.title,description:description?description.content:'',canonical:canonical?canonical.href:location.href.split('?')[0]};
}
function applyCollectionSeo_(filter,replaceUrl=true){
 rememberCollectionSeoDefault_();
 const base='https://siyuye.github.io/XieXiuYing1960/works.html';
 if(!filter||!filter.value){
  document.title=collectionSeoDefault_.title;
  ensureMeta_('meta[name="description"]',{name:'description'}).content=collectionSeoDefault_.description;
  ensureMeta_('link[rel="canonical"]',{tag:'link',rel:'canonical'}).href=base;
  if(replaceUrl){const url=new URL(location.href);['type','subject','material','medium'].forEach(k=>url.searchParams.delete(k));history.replaceState({},'',url.href);}
  artworkSeoDefault_=null;
  return;
 }
 const value=filter.value;
 document.title=value+'作品集｜謝秀英';
 ensureMeta_('meta[name="description"]',{name:'description'}).content='瀏覽謝秀英書畫藝術館「'+value+'」'+filter.config.label+'作品集，欣賞謝秀英相關書畫創作。';
 const canonical=base+'?'+filter.key+'='+encodeURIComponent(value);
 ensureMeta_('link[rel="canonical"]',{tag:'link',rel:'canonical'}).href=canonical;
 if(replaceUrl){const url=new URL(location.href);url.search='';url.searchParams.set(filter.key,value);history.replaceState({collectionFilter:filter.key,collectionValue:value},'',url.href);}
 artworkSeoDefault_=null;
}
function activateCollectionPill_(filter){
 document.querySelectorAll('.category-pills button').forEach(btn=>{
  const key=String(btn.dataset.category||btn.textContent||'').trim();
  btn.classList.toggle('active',!filter?key==='全部':key===filter.value);
 });
}

function valueList(a){return [a.artworkTypeName||a.categoryZh,a.subjectNames,a.material,a.medium].filter(v=>String(v||'').trim());}
function detailList(a){return [a.artworkTypeName||a.categoryZh,a.subjectNames,a.material].filter(v=>String(v||'').trim());}
function mediumValue(a){return String(a.medium||'').trim();}
function titleLines(a){return [a.titleZh,a.titleEn].filter(v=>String(v||'').trim());}
function infoLines(a){return [[a.year,a.size].filter(v=>String(v||'').trim()).join('｜'),detailList(a).join('｜'),mediumValue(a)].filter(Boolean);}
function homePrimaryParts(a){return [a.titleZh,a.titleEn,a.year,a.size].filter(v=>String(v||'').trim());}
function homePrimaryHtml(a){const parts=homePrimaryParts(a);return parts.map((v,i)=>{const cls=i<([a.titleZh,a.titleEn].filter(x=>String(x||'').trim()).length)?'home-art-name':'home-art-detail';return `${i?'<span class="home-art-separator">｜</span>':''}<span class="${cls}">${esc(v)}</span>`;}).join('');}
function homeArtInfoHtml(a){const second=valueList(a).join('｜');return `<div class="art-info home-art-info"><div class="home-art-primary">${homePrimaryHtml(a)}</div>${second?`<small>${esc(second)}</small>`:''}</div>`;}
function featuredArtInfoHtml(a){const titles=titleLines(a),meta=[a.year,a.size].filter(v=>String(v||'').trim()).join('｜'),details=detailList(a).join('｜'),medium=mediumValue(a);return `<div class="art-info">${titles.map((v,i)=>`${i?'<span>｜</span>':''}<${i?'span':'strong'}>${esc(v)}</${i?'span':'strong'}>`).join('')}${meta?`<small>${esc(meta)}</small>`:''}${details?`<small class="art-details-main">${esc(details)}</small>`:''}${medium?`<small class="art-medium-line">${esc(medium)}</small>`:''}</div>`;}
function heroCaptionLines(a){return [homePrimaryParts(a).join('｜'),valueList(a).join('｜')].filter(Boolean);}
function artTitle(a){return a.titleZh||a.titleEn||'';}
function artworkAlt_(a){return window.SeoHelper?window.SeoHelper.generateAlt(a):(artTitle(a)||'謝秀英作品');}
function imgSrc(a){return artworkImageSources_(a,'1200').primary;}
function imgLargeSrc(a){return artworkImageSources_(a,'2400').primary;}
function artInfoHtml(a){const titles=titleLines(a),meta=[a.year,a.size].filter(v=>String(v||'').trim()).join('｜'),details=detailList(a).join('｜'),medium=mediumValue(a);return `<div class="art-info">${titles.map((v,i)=>`<${i?'span':'strong'}>${esc(v)}</${i?'span':'strong'}>`).join('')}${meta?`<small>${esc(meta)}</small>`:''}${details?`<small class="art-details-main">${esc(details)}</small>`:''}${medium?`<small class="art-medium-line">${esc(medium)}</small>`:''}</div>`;}
function card(a,imageIndex=1){const first=imageIndex===0,sources=artworkImageSources_(a,'1200');return `<button class="art-card protected-image" type="button" data-art-id="${esc(a.id||a.artworkId||'')}"><img src="${esc(sources.primary)}" ${imageFallbackAttrs_(sources)} alt="${esc(artworkAlt_(a))}" draggable="false" loading="${first?'eager':'lazy'}" decoding="async" fetchpriority="${first?'high':'low'}" width="1200" height="1200">${artInfoHtml(a)}</button>`;}
function clearPagedArtGrid_(host){
 if(!host)return;
 const state=host._xxyPaging;
 if(state&&state.observer)state.observer.disconnect();
 if(state&&state.controls&&state.controls.parentNode)state.controls.parentNode.removeChild(state.controls);
 host._xxyPaging=null;host.innerHTML='';
}
function appendArtBatch_(host){
 const state=host&&host._xxyPaging;if(!state)return;
 const start=state.index,end=Math.min(start+state.batchSize,state.items.length),batch=state.items.slice(start,end);
 if(batch.length){host.insertAdjacentHTML('beforeend',batch.map((a,i)=>card(a,start+i)).join(''));state.index=end;bindArtworkCards();}
 const remaining=Math.max(0,state.items.length-state.index);
 if(state.button){state.button.hidden=remaining===0;state.button.textContent=remaining?`載入更多作品（尚有 ${remaining} 件）`:'已顯示全部作品';}
 if(state.sentinel)state.sentinel.hidden=remaining===0;
 if(!remaining&&state.observer){state.observer.disconnect();state.observer=null;}
}
function renderPagedArtGrid_(host,items,emptyText='目前尚無公開作品。'){
 if(!host)return;clearPagedArtGrid_(host);
 const list=Array.isArray(items)?items:[];
 if(!list.length){host.innerHTML=`<p class="page-loading art-empty">${esc(emptyText)}</p>`;return;}
 const controls=document.createElement('div');controls.className='art-paging-controls';controls.innerHTML='<button type="button" class="btn ghost art-load-more">載入更多作品</button><span class="art-load-sentinel" aria-hidden="true"></span>';
 host.insertAdjacentElement('afterend',controls);
 const state={items:list,index:0,batchSize:ART_BATCH_SIZE,controls,button:controls.querySelector('.art-load-more'),sentinel:controls.querySelector('.art-load-sentinel'),observer:null};host._xxyPaging=state;
 state.button.addEventListener('click',()=>appendArtBatch_(host));
 appendArtBatch_(host);
 if('IntersectionObserver'in window&&state.index<state.items.length){state.observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))appendArtBatch_(host);},{rootMargin:'500px 0px',threshold:.01});state.observer.observe(state.sentinel);}
}
function preloadArtworkImage_(src){if(!src)return;const img=new Image();img.decoding='async';img.src=src;}
function preloadHeroNeighbors_(list,index){if(!Array.isArray(list)||list.length<2)return;const prev=(index-1+list.length)%list.length,next=(index+1)%list.length;preloadArtworkImage_(imgSrc(list[prev]));if(next!==prev)preloadArtworkImage_(imgSrc(list[next]));}
function renderCommonShell(){
 const brand=siteConfig?.brand||{};const isHome=document.body.dataset.page==='home';document.querySelectorAll('.brand').forEach(el=>el.innerHTML=`<span class="brand-mark"><img src="assets/icons/icon-192.png" alt="謝秀英代表作圖示"></span><span><strong>${esc(isHome?(brand.siteName||'謝秀英書畫藝術館'):(brand.zh||'謝秀英'))}</strong><small>${esc(isHome?'XIE XIU-YING ART MUSEUM':(brand.en||'Xie Xiu-Ying'))}</small></span>`);
 const page=document.body.dataset.page;document.querySelectorAll('.main-nav').forEach(nav=>nav.innerHTML=(siteConfig?.nav||[]).map(i=>`<a class="nav-link ${i.id===page?'active':''}" href="${esc(i.href)}">${esc(i.id==='home'?'首頁':i.label)}</a>`).join(''));
}
function nl(s=''){return esc(s).replace(/\r?\n/g,'<br>');}
function renderHome(){
 if(document.body.dataset.page!=='home'||!homeData)return;
 const h=homeData.hero||{},copy=document.querySelector('.hero-copy');
 if(copy)copy.innerHTML=`<div class="artist-profile-card is-loading"><div class="artist-photo-skeleton" aria-hidden="true"></div><img id="artistRandomPhoto" alt="謝秀英老師" decoding="async" fetchpriority="high"><div class="artist-profile-overlay"><h1>謝秀英</h1><p class="artist-name-en">Xie Xiu-Ying</p><p class="hero-sub multiline">${nl(h.subtitle||'以書畫來美化這個世界，以書畫來安慰人的心靈。')}</p><div class="hero-actions"><a class="btn primary" data-short="線上藝廊" href="${esc(h.primaryButton?.href||'gallery.html')}">${esc(h.primaryButton?.label||'進入線上藝廊')}</a><a class="btn ghost" data-short="Facebook" href="${esc(h.secondaryButton?.href||siteConfig?.facebookUrl||'#')}" target="_blank" rel="noopener">${esc(h.secondaryButton?.label||'Facebook 粉專')}</a></div></div></div>`;
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
 const large=(imageManifest.teacherPhotos?.['1600']||[]).filter(Boolean),small=(imageManifest.teacherPhotos?.['600']||[]).filter(Boolean);
 if(!large.length){card?.classList.remove('is-loading');card?.classList.add('is-photo-error');return;}
 const pick=Math.floor(Math.random()*large.length),mobile=window.innerWidth<=720,size=mobile?'600':'1600';
 const chosenLocal=teacherLocalPath_((mobile&&small[pick])?small[pick]:large[pick],size);
 const candidates=[teacherCdnPath_(chosenLocal,size),chosenLocal,IMAGE_PLACEHOLDER];
 img.dataset.manualFallback='1';
 let loaded=false;
 for(let i=0;i<candidates.length&&!loaded;i++){
  const src=candidates[i];
  try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=src;});loaded=true;}
  catch(e){rememberClientError_('teacher-image',e,{src});}
 }
 img.onload=null;img.onerror=null;delete img.dataset.manualFallback;
 card?.classList.remove('is-loading');
 if(loaded&&img.src.indexOf('art-placeholder-clean.svg')<0)card?.classList.add('is-ready');else card?.classList.add('is-photo-error');
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
 if(!row){host.innerHTML='<p class="page-loading">目前尚無公開線上展覽。</p>';return;}
 host.innerHTML=`<div class="current-gallery-card"><h2>${esc(row.title||'')}</h2>${row.period?`<p class="gallery-period">${esc(row.period)}</p>`:''}${row.description?`<p class="multiline">${nl(row.description)}</p>`:''}</div>`;
}
function initArtSections(){
 const pool=shuffle(artworks.filter(a=>a.featured!==false)),heroes=pool.filter(a=>a.hero===true),heroPool=(heroes.length?heroes:pool).slice(0,3),ids=createCompatSet_(heroPool.map(a=>a.id));let feat=pool.filter(a=>!ids.has(a.id));
 const image=document.querySelector('#heroImage');if(image){if(heroTimer){clearInterval(heroTimer);heroTimer=null;}image.loading='eager';image.decoding='async';image.setAttribute('fetchpriority','high');let slide=0;const t=document.querySelector('#heroTitle'),m=document.querySelector('#heroMeta');function draw(){const a=heroPool[slide];if(!a){image.removeAttribute('src');t.textContent='';m.textContent='';return;}image.src=imgSrc(a);t.innerHTML=homePrimaryHtml(a);m.textContent=valueList(a).join('｜');preloadHeroNeighbors_(heroPool,slide);}document.querySelector('.next')?.addEventListener('click',()=>{slide=(slide+1)%heroPool.length;draw()});document.querySelector('.prev')?.addEventListener('click',()=>{slide=(slide-1+heroPool.length)%heroPool.length;draw()});draw();if(heroPool.length>1)heroTimer=setInterval(()=>{slide=(slide+1)%heroPool.length;draw()},5000);}
 const featured=document.querySelector('#featuredWorks');if(featured)featured.innerHTML=feat.slice(0,8).map((a,i)=>{const first=i===0,sources=artworkImageSources_(a,'1200');return `<button class="art-card protected-image" type="button" data-art-id="${esc(a.id||a.artworkId||'')}"><img src="${esc(sources.primary)}" ${imageFallbackAttrs_(sources)} alt="${esc(artworkAlt_(a))}" draggable="false" loading="${first?'eager':'lazy'}" decoding="async" fetchpriority="${first?'high':'low'}" width="1200" height="1200">${featuredArtInfoHtml(a)}</button>`;}).join('');
 const gallery=document.querySelector('#galleryGrid');if(gallery)renderPagedArtGrid_(gallery,shuffle(artworks.filter(a=>a.gallery===true||truth(a.isGallery))),'目前尚無公開線上藝廊作品。');
 const works=document.querySelector('#worksGrid');if(works){const drawWorks=list=>renderPagedArtGrid_(works,list,'目前沒有符合此分類或搜尋條件的公開作品。');const initialFilter=collectionFilterFromUrl_(),initialQuery=collectionSearchFromUrl_();drawWorks(filterSearchArtworks_(filterCollectionArtworks_(artworks,initialFilter),initialQuery));activateCollectionPill_(initialFilter);applyCollectionSeo_(initialFilter,false);if(initialQuery){document.title='搜尋「'+initialQuery+'」｜謝秀英作品集';ensureMeta_('meta[name="description"]',{name:'description'}).content='搜尋謝秀英書畫藝術館中與「'+initialQuery+'」相關的公開作品。';ensureMeta_('link[rel="canonical"]',{tag:'link',rel:'canonical'}).href='https://siyuye.github.io/XieXiuYing1960/works.html?q='+encodeURIComponent(initialQuery);}document.querySelectorAll('.category-pills button').forEach(btn=>btn.addEventListener('click',()=>{const key=String(btn.dataset.category||btn.textContent||'').trim();const filter=key==='全部'?null:{key:'type',value:key,config:COLLECTION_FILTERS.type};activateCollectionPill_(filter);drawWorks(filterCollectionArtworks_(artworks,filter));applyCollectionSeo_(filter,true);}));}
 bindArtworkCards();openArtworkFromUrl_();
}
function bindArtworkCards(){document.querySelectorAll('[data-art-id]').forEach(el=>{if(el.dataset.bound)return;el.dataset.bound='1';el.addEventListener('click',()=>openArtwork(el.dataset.artId));});}
function openArtwork(id){const a=artworks.find(x=>String(x.id||x.artworkId)===String(id));if(!a)return;let modal=document.querySelector('#artModal');if(!modal){modal=document.createElement('div');modal.id='artModal';modal.className='modal-backdrop';modal.innerHTML='<div class="art-modal protected-image"><button class="modal-close" aria-label="關閉">×</button><div class="art-modal-image"><img draggable="false" loading="eager" decoding="async" fetchpriority="high"></div><div class="art-modal-copy"></div></div>';document.body.appendChild(modal);modal.querySelector('.modal-close').onclick=()=>{modal.classList.remove('open');restoreArtworkSeo_();};modal.onclick=e=>{if(e.target===modal){modal.classList.remove('open');restoreArtworkSeo_();}}}const modalImage=modal.querySelector('img'),sources=artworkImageSources_(a,'2400');modalImage.removeAttribute('src');modalImage.dataset.fallbackSrc=sources.fallback||'';modalImage.dataset.finalFallback=sources.final||IMAGE_PLACEHOLDER;modalImage.dataset.fallbackStep='0';modalImage.alt=artworkAlt_(a);const aid=String(a.artworkId||a.id||'').trim(),shareUrl='https://siyuye.github.io/XieXiuYing1960/works/'+encodeURIComponent(aid)+'.html',shareTitle=(a.titleZh||a.nameZh||a.title||aid)+'｜謝秀英作品';modal.querySelector('.art-modal-copy').innerHTML=artInfoHtml(a)+(a.description?`<p class="multiline">${nl(a.description)}</p>`:'')+`<div class="art-modal-actions"><a class="btn ghost" href="${esc(shareUrl)}">🔍 查看作品頁面</a><button class="btn share" type="button" data-share-artwork data-share-title="${esc(shareTitle)}" data-share-text="${esc(shareTitle)}" data-share-url="${esc(shareUrl)}">🔗 分享作品</button></div>`;window.XxyArtworkShare?.bind(modal);applyArtworkSeo_(a);modal.classList.add('open');requestAnimationFrame(()=>{modalImage.src=sources.primary;});}
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
function initUiEffects(){const reveals=[...document.querySelectorAll('.reveal')];if('IntersectionObserver'in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}}),{threshold:.05,rootMargin:'120px'});reveals.forEach(e=>io.observe(e));}else{reveals.forEach(e=>e.classList.add('visible'));}const top=document.querySelector('.to-top');if(top){addEventListener('scroll',()=>top.classList.toggle('show',scrollY>500),{passive:true});top.onclick=()=>scrollTo({top:0,behavior:'smooth'});}initNavProgress();}
installGlobalErrorHandling_();installImageFallback_();cleanupLegacyCachesOnce_();document.addEventListener('contextmenu',function(e){e.preventDefault();});document.addEventListener('dragstart',function(e){e.preventDefault();});initData();
