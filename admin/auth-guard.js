// CMS v7.3-A2｜後台 API / Token 自動檢查
(function(){
  const SETTINGS_PAGE = 'settings.html';
  const isSettings = location.pathname.endsWith('/admin/settings.html');
  const currentFile = location.pathname.split('/').pop() || 'index.html';
  const returnPath = currentFile + location.search;

  function goSettings(reason){
    const url = new URL(SETTINGS_PAGE, location.href);
    if(!isSettings) url.searchParams.set('return', returnPath);
    if(reason) url.searchParams.set('reason', reason);
    location.replace(url.toString());
  }

  function badge(label, ok, detail){
    const span=document.createElement('span');
    span.className='admin-connection-badge '+(ok?'ok':'bad');
    span.title=detail||'';
    span.textContent=label+'：● '+(ok?(label==='API'?'已連線':'已驗證'):(label==='API'?'未連線':'未設定'));
    return span;
  }

  function mountStatus(access){
    const host=document.querySelector('.admin-top > div:last-child') || document.querySelector('.admin-actions') || document.querySelector('.admin-card');
    if(!host) return;
    let box=document.getElementById('adminConnectionStatus');
    if(!box){
      box=document.createElement('div');
      box.id='adminConnectionStatus';
      box.className='admin-connection-status';
      host.prepend(box);
    }
    box.replaceChildren(
      badge('API', !!access.api, access.error||''),
      badge('Token', !!access.token, access.error||'')
    );
  }

  window.XxyAdminReady = (async()=>{
    if(isSettings) return {ok:true, settings:true};
    const api = XxyCms.getStoredApiUrl();
    const token = XxyCms.getAdminToken();
    if(!api){ goSettings('missing-api'); throw new Error('缺少 API URL'); }
    if(!token){ goSettings('missing-token'); throw new Error('缺少 Token'); }
    const access=await XxyCms.validateAdminAccess();
    if(!access.ok){
      try{sessionStorage.setItem('xxy.cms.authError', access.error||'驗證失敗');}catch(e){}
      goSettings(access.api?'invalid-token':'api-error');
      throw new Error(access.error||'驗證失敗');
    }
    mountStatus(access);
    document.documentElement.classList.add('admin-auth-ready');
    return access;
  })();
})();