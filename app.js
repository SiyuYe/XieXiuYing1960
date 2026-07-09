// Hsieh Hsiu-Ying Art Museum CMS v7.0
// Data-driven skeleton: GitHub Pages hosts the app; Google Sheets + Apps Script can supply all content.

const DATA_VERSION = 'cms-v7.0';
const LOCAL_FILES = {
  config: 'data/site-config.json',
  home: 'data/home.json',
  pages: 'data/pages.json',
  artworks: 'data/artworks.json',
  exhibitions: 'data/exhibitions.json'
};

let siteConfig = null;
let homeData = null;
let pageData = null;
let artworks = [];
let exhibitions = [];

const fallbackArtworks = [
 {id:'a001',titleZh:'花鳥清韻',titleEn:'Floral Birds in Grace',categoryZh:'花鳥',categoryEn:'Bird-and-Flower',size:'待補尺寸',medium:'水墨設色 / Ink and Color on Paper',image:'assets/images/art-placeholder-1.svg',featured:true,hero:true,public:true},
 {id:'a002',titleZh:'菩提墨影',titleEn:'Ink Shadow of Bodhi',categoryZh:'佛像',categoryEn:'Buddhist Painting',size:'待補尺寸',medium:'水墨 / Ink on Paper',image:'assets/images/art-placeholder-2.svg',featured:true,hero:true,public:true},
 {id:'a003',titleZh:'山水有情',titleEn:'Landscape with Sentiment',categoryZh:'山水',categoryEn:'Landscape',size:'待補尺寸',medium:'水墨設色 / Ink and Color on Paper',image:'assets/images/art-placeholder-3.svg',featured:true,hero:true,public:true},
 {id:'a004',titleZh:'一花一世界',titleEn:'A Flower, A World',categoryZh:'花鳥',categoryEn:'Bird-and-Flower',size:'待補尺寸',medium:'膠彩 / Gouache and Mineral Pigment',image:'assets/images/art-placeholder-4.svg',featured:true,public:true},
 {id:'a005',titleZh:'無心書意',titleEn:'Calligraphy of the Unattached Heart',categoryZh:'書法',categoryEn:'Calligraphy',size:'待補尺寸',medium:'墨 / Ink',image:'assets/images/art-placeholder-5.svg',featured:true,public:true},
 {id:'a006',titleZh:'禽鳥如來',titleEn:'Birds as Tathāgata',categoryZh:'禽獸',categoryEn:'Animals',size:'待補尺寸',medium:'水墨設色 / Ink and Color on Paper',image:'assets/images/art-placeholder-6.svg',featured:true,public:true}
];

async function fetchJson(path){
  const res = await fetch(`${path}?site=${DATA_VERSION}&t=${Date.now()}`, { cache: 'no-store' });
  if(!res.ok) throw new Error(path);
  return res.json();
}
function normalizeBundle(bundle, localConfig){
  if(!bundle || !bundle.ok) return null;
  const settings = bundle.settings || bundle.config || {};
  const brand = localConfig?.brand || {};
  const config = Object.assign({}, localConfig || {}, {
    backendMode: 'appsScript',
    brand: {
      zh: settings.artistNameZh || brand.zh || '謝秀英',
      en: settings.artistNameEn || brand.en || 'Hsieh Hsiu-Ying',
      mark: settings.artistMark || brand.mark || '秀',
      siteName: settings.siteName || brand.siteName || '謝秀英書畫藝術館'
    },
    nav: settings.nav || localConfig?.nav || [],
    homeQuickNav: settings.homeQuickNav || localConfig?.homeQuickNav || [],
    facebookUrl: settings.facebookUrl || localConfig?.facebookUrl || '',
    contactReasons: settings.contactReasons || localConfig?.contactReasons || []
  });
  const home = bundle.home ? {
    hero: {
      eyebrow: bundle.home.heroEyebrow, title: bundle.home.heroTitle, subtitle: bundle.home.heroSubtitle,
      primaryButton: { label: bundle.home.heroPrimaryLabel, href: bundle.home.heroPrimaryHref },
      secondaryButton: { label: bundle.home.heroSecondaryLabel, href: bundle.home.heroSecondaryHref }
    },
    announcements: (bundle.announcements || []).map(n => ({date:n.date||'', title:n.title||'', text:n.summary||n.text||''})),
    onlineShow: (bundle.gallery && bundle.gallery[0]) ? {eyebrow:'Online Exhibition', title:bundle.gallery[0].title, period:bundle.gallery[0].period, text:bundle.gallery[0].description, button:{label:'立即參觀', href:'gallery.html'}} : {},
    quote: {text: bundle.home.quoteText, author: bundle.home.quoteAuthor},
    facebook: {title: bundle.home.facebookTitle, text: bundle.home.facebookText, button:'前往粉專'}
  } : null;
  const mappedArtworks = (bundle.artworks || []).map(a => Object.assign({}, a, {
    id: a.artworkId || a.id,
    titleZh: a.titleZh || a.originalFileName || a.artworkId,
    titleEn: a.titleEn || '',
    categoryZh: a.artworkTypeName || a.subjectNames || a.collectionStatus || '',
    categoryEn: a.artworkTypeId || '',
    image: a.imageUrl || a.thumbUrl || a.image || '',
    thumbnail: a.thumbUrl || a.imageUrl || '',
    medium: [a.medium, a.material].filter(Boolean).join(' / '),
    featured: a.isFeatured === true || String(a.isFeatured).toUpperCase() === 'TRUE',
    hero: a.isHomeHero === true || String(a.isHomeHero).toUpperCase() === 'TRUE',
    public: !(a.isPublic === false || String(a.isPublic).toUpperCase() === 'FALSE')
  }));
  return {config, home, pages: bundle.pages || {}, artworks: mappedArtworks, exhibitions: bundle.exhibitions || []};
}
async function loadBackendBundle(config){
  if(window.XxyCms){
    const api = await window.XxyCms.resolveApiUrl();
    if(api) return normalizeBundle(await window.XxyCms.siteBundle(), config);
  }
  if(!config || config.backendMode !== 'appsScript' || !config.appsScriptApiUrl) return null;
  const res = await fetch(`${config.appsScriptApiUrl}?action=siteBundle&t=${Date.now()}`, { cache: 'no-store' });
  if(!res.ok) throw new Error('Apps Script API failed');
  return normalizeBundle(await res.json(), config);
}
async function initData(){
  siteConfig = await fetchJson(LOCAL_FILES.config).catch(()=>null);
  const bundle = await loadBackendBundle(siteConfig).catch(()=>null);
  if(bundle){
    siteConfig = bundle.config || siteConfig;
    homeData = bundle.home || null;
    pageData = bundle.pages || null;
    artworks = Array.isArray(bundle.artworks) ? bundle.artworks : [];
    exhibitions = Array.isArray(bundle.exhibitions) ? bundle.exhibitions : [];
  } else {
    homeData = await fetchJson(LOCAL_FILES.home).catch(()=>null);
    pageData = await fetchJson(LOCAL_FILES.pages).catch(()=>null);
    artworks = await fetchJson(LOCAL_FILES.artworks).catch(()=>[]);
    exhibitions = await fetchJson(LOCAL_FILES.exhibitions).catch(()=>[]);
  }
  if(!Array.isArray(artworks) || !artworks.length) artworks = fallbackArtworks;
  artworks = artworks.filter(a => a.public !== false && a.isPublic !== false);
  renderCommonShell();
  renderHome();
  renderSubpage();
  initArtSections();
  initContactForm();
  initUiEffects();
}

function shuffle(list){const arr=[...list];for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
function esc(s=''){return String(s).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[m]));}
function artTitle(a){return a.titleZh || a.title || '未命名作品';}
function artEn(a){return a.titleEn || a.en || 'Untitled';}
function artMeta(a){return [a.categoryZh, a.categoryEn, a.size, a.medium || a.material || a.meta, a.year].filter(Boolean).join('｜');}
function imgSrc(a){return a.imageUrl || a.thumbUrl || a.image || a.img || a.thumbnail || 'assets/images/art-placeholder-1.svg';}
function card(a){return `<article class="art-card protected-image" data-watermark="謝秀英"><img src="${esc(imgSrc(a))}" alt="${esc(artTitle(a))}" draggable="false" loading="lazy"><div><strong>${esc(artTitle(a))}</strong><small>${esc(artEn(a))}<br>${esc(artMeta(a))}</small></div></article>`;}

function renderCommonShell(){
  if(!siteConfig) return;
  const brand = siteConfig.brand || {};
  document.querySelectorAll('.brand').forEach(el=>{
    el.innerHTML = `<span class="brand-mark">${esc(brand.mark || '秀')}</span><span><strong>${esc(brand.zh || '謝秀英')}</strong><small>${esc(brand.en || 'Hsieh Hsiu-Ying')}</small></span>`;
  });
  const page = document.body.dataset.page;
  document.querySelectorAll('.main-nav').forEach(nav=>{
    nav.innerHTML = (siteConfig.nav || []).map(item=>`<a class="nav-link ${item.id===page?'active':''}" href="${esc(item.href)}">${esc(item.label)}</a>`).join('');
  });
  const quick = document.querySelector('.home-quick');
  if(quick && siteConfig.homeQuickNav){
    quick.innerHTML = '<span class="quick-line"></span>' + siteConfig.homeQuickNav.map((item,idx)=>`<a href="#${esc(item.id)}" class="quick-dot ${idx===0?'active':''}"><i></i><span>${esc(item.label)}</span></a>`).join('');
  }
}

function renderHome(){
  if(document.body.dataset.page !== 'home' || !homeData) return;
  const h = homeData.hero || {};
  const heroCopy = document.querySelector('.hero-copy');
  if(heroCopy){
    heroCopy.innerHTML = `<p class="eyebrow">${esc(h.eyebrow || '')}</p><h1>${esc(h.title || '').replace(/\n/g,'<br>')}</h1><p class="hero-sub">${esc(h.subtitle || '')}</p><div class="hero-actions"><a class="btn primary" href="${esc(h.primaryButton?.href || 'gallery.html')}">${esc(h.primaryButton?.label || '進入線上藝廊')}</a><a class="btn ghost" href="${esc(h.secondaryButton?.href || siteConfig?.facebookUrl || '#')}" target="_blank" rel="noopener">${esc(h.secondaryButton?.label || 'Facebook 粉專')}</a></div>`;
  }
  const news = document.querySelector('.news-grid');
  if(news && Array.isArray(homeData.announcements)) news.innerHTML = homeData.announcements.map(n=>`<article><time>${esc(n.date)}</time><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></article>`).join('');
  const show = homeData.onlineShow || {};
  const showText = document.querySelector('.show-text');
  if(showText) showText.innerHTML = `<p class="eyebrow">${esc(show.eyebrow || 'Online Exhibition')}</p><h2>${esc(show.title || '')}</h2><p>${esc(show.period || '')}</p><p>${esc(show.text || '')}</p><a class="btn light" href="${esc(show.button?.href || 'gallery.html')}">${esc(show.button?.label || '立即參觀')}</a>`;
  const quote = document.querySelector('#quote');
  if(quote && homeData.quote) quote.innerHTML = `<p>「${esc(homeData.quote.text)}」</p><span>${esc(homeData.quote.author)}</span>`;
  const fbInfo = document.querySelector('.fb-info');
  if(fbInfo && homeData.facebook) fbInfo.innerHTML = `<p class="eyebrow">Facebook</p><h2>${esc(homeData.facebook.title)}</h2><p>${esc(homeData.facebook.text)}</p><a class="btn primary" href="${esc(siteConfig?.facebookUrl || '#')}" target="_blank" rel="noopener">${esc(homeData.facebook.button || '前往粉專')}</a>`;
}

function renderSubpage(){
  const page = document.body.dataset.page;
  if(!pageData || page === 'home') return;
  const data = pageData[page];
  if(!data) return;
  const hero = document.querySelector('.page-hero');
  if(hero) hero.innerHTML = `<p class="eyebrow">${esc(data.eyebrow || '')}</p><h1>${esc(data.title || '')}</h1><p>${esc(data.subtitle || '')}</p>`;
  const content = document.querySelector('[data-dynamic-sections]');
  if(content && Array.isArray(data.sections)) content.innerHTML = data.sections.map(s=>`<section class="content-card"><h2>${esc(s.title)}</h2><p>${esc(s.body)}</p></section>`).join('');
}

function initArtSections(){
  const pool = shuffle(artworks.filter(a=>a.featured !== false));
  const heroCandidates = pool.filter(a=>a.hero === true || a.isHero === true);
  const heroPool = (heroCandidates.length ? heroCandidates : pool).slice(0, Math.min(3, pool.length));
  const heroIds = new Set(heroPool.map(a=>a.id));
  let featuredPool = pool.filter(a=>!heroIds.has(a.id));
  if(featuredPool.length < 3) featuredPool = shuffle(artworks).filter(a=>!heroIds.has(a.id));
  const heroImage=document.querySelector('#heroImage');
  if(heroImage){
    let slide=0;const heroTitle=document.querySelector('#heroTitle'),heroMeta=document.querySelector('#heroMeta');
    function renderSlide(){const a=heroPool[slide] || artworks[0];heroImage.src=imgSrc(a);heroTitle.textContent=artTitle(a);heroMeta.textContent=artEn(a)+'｜'+artMeta(a);}
    const next=document.querySelector('.next'), prev=document.querySelector('.prev');
    if(next) next.onclick=()=>{slide=(slide+1)%heroPool.length;renderSlide();};
    if(prev) prev.onclick=()=>{slide=(slide-1+heroPool.length)%heroPool.length;renderSlide();};
    renderSlide();
    if(heroPool.length>1) setInterval(()=>{slide=(slide+1)%heroPool.length;renderSlide();},5000);
  }
  const featured=document.querySelector('#featuredWorks'); if(featured) featured.innerHTML=featuredPool.slice(0,8).map(card).join('');
  const gallery=document.querySelector('#galleryGrid'); if(gallery) gallery.innerHTML=shuffle(artworks).slice(0,12).map(card).join('');
  const works=document.querySelector('#worksGrid'); if(works) works.innerHTML=artworks.map(card).join('');
}

function initContactForm(){
  const reasonSelect = document.querySelector('select[name="reason"]');
  if(reasonSelect && siteConfig?.contactReasons){
    reasonSelect.innerHTML = '<option value="">請選擇</option>' + siteConfig.contactReasons.map(r=>`<option>${esc(r)}</option>`).join('');
  }
  const loginBtns=document.querySelectorAll('[data-login]');
  const formLock=document.querySelector('#formLock');
  const contactForm=document.querySelector('#contactForm');
  loginBtns.forEach(btn=>btn.addEventListener('click',()=>{
    if(formLock) formLock.hidden=true;
    if(contactForm) contactForm.hidden=false;
  }));
  if(contactForm){
    contactForm.addEventListener('submit',async e=>{
      e.preventDefault();
      const msg=document.querySelector('#formMessage');
      const data = Object.fromEntries(new FormData(contactForm).entries());
      if(siteConfig?.backendMode === 'appsScript' && siteConfig?.appsScriptApiUrl){
        try{
          await fetch(siteConfig.appsScriptApiUrl, {method:'POST', body:JSON.stringify({action:'contact', data}), headers:{'Content-Type':'text/plain;charset=utf-8'}});
          if(msg) msg.textContent='需求已送出，我們會再主動聯繫您。';
          contactForm.reset(); return;
        }catch(err){}
      }
      if(msg) msg.textContent='需求已暫存於前端示範版。正式上線後會送入 Google 試算表後台。';
      contactForm.reset();
    });
  }
}

function initUiEffects(){
  const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');});},{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  const quick=[...document.querySelectorAll('.quick-dot')];
  const homeIds=(siteConfig?.homeQuickNav || []).map(x=>document.getElementById(x.id)).filter(Boolean);
  if(quick.length){
    const qspy=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){quick.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id));}});},{rootMargin:'-32% 0px -45% 0px',threshold:.05});
    homeIds.forEach(s=>qspy.observe(s));
  }
  const topBtn=document.querySelector('.to-top');
  if(topBtn){window.addEventListener('scroll',()=>{topBtn.classList.toggle('show',scrollY>500);});topBtn.onclick=()=>scrollTo({top:0,behavior:'smooth'});}
}

document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('dragstart',e=>e.preventDefault());
document.addEventListener('selectstart',e=>e.preventDefault());
let pressTimer=null;
document.addEventListener('touchstart',e=>{pressTimer=setTimeout(()=>e.preventDefault(),450);}, {passive:false});
document.addEventListener('touchend',()=>clearTimeout(pressTimer));

initData();
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));}
