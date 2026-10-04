(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else if(!root.StarUpdateNotice)root.StarUpdateNotice=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Public release version is independent of the engine's save schema number.
  const RELEASE={version:'0.15.5',items:['劇情：新增自創藝人音樂第一章','演出：新增Q版表情頭像與劇情對話框','調整：優化對話操作與文字']};
  const KEY='starlane-seen-release';
  function create({existing,enabled=true,storage,session,release=RELEASE}){
    let pending=false,seen=null,writable=false;
    if(enabled){
      // Probe only our own metadata; never read or change the gameplay save.
      for(const store of [storage,session])try{if(!store)continue;const value=store.getItem(KEY);if(value===release.version)seen=value;store.setItem(KEY,value||'');writable=true;}catch{}
      pending=!!existing&&writable&&seen!==release.version;
    }
    function remember(){pending=false;for(const store of [storage,session])try{store?.setItem(KEY,release.version);}catch{}}
    if(enabled&&!existing)remember();
    return {pending:()=>pending,acknowledge:remember,defer(){pending=false;},newGame:remember};
  }
  let controller=null,dialog=null,scheduled=false;
  function init(options){
    if(controller)return controller;
    let storage,session;try{storage=window.localStorage;}catch{}try{session=window.sessionStorage;}catch{}
    controller=create({...options,storage,session});
    if(!controller.pending())return controller;
    dialog=document.createElement('dialog');dialog.id='release-notice';dialog.setAttribute('aria-labelledby','release-notice-title');
    const heading=document.createElement('h2');heading.id='release-notice-title';heading.textContent='本次更新 · v'+RELEASE.version;
    const list=document.createElement('ul');for(const item of RELEASE.items){const li=document.createElement('li');li.textContent=item;list.append(li);}
    const note=document.createElement('p');note.className='release-notice-note';note.textContent='按「知道了」後，本版本不再提醒；選「稍後」或按 Esc，下次進入會再提醒。';
    const actions=document.createElement('div');actions.className='release-notice-actions';
    const later=document.createElement('button');later.type='button';later.textContent='稍後';later.dataset.releaseLater='';
    const ok=document.createElement('button');ok.type='button';ok.className='primary';ok.textContent='知道了';ok.dataset.releaseAck='';
    later.onclick=()=>{controller.defer();dialog.close();};ok.onclick=()=>{controller.acknowledge();dialog.close();};
    dialog.addEventListener('cancel',e=>{e.preventDefault();controller.defer();dialog.close();});actions.append(later,ok);dialog.append(heading,list,note,actions);document.body.append(dialog);
    function schedule(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;if(!controller.pending()||document.hidden||document.querySelector('.conflict-banner'))return;const busy=[...document.querySelectorAll('dialog[open]')].some(d=>d!==dialog);if(busy){if(dialog.open)dialog.close();return;}if(!dialog.open)dialog.showModal();},0);}
    // Yield synchronously before another dialog opens, then resume after it closes.
    document.addEventListener('beforetoggle',e=>{if(e.target.tagName==='DIALOG'&&e.target!==dialog&&e.newState==='open'&&dialog.open)dialog.close();},true);
    document.addEventListener('close',schedule,true);document.addEventListener('visibilitychange',schedule);
    new MutationObserver(schedule).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open'],childList:true});
    schedule();return controller;
  }
  function newGame(){controller?.newGame();if(dialog?.open)dialog.close();}
  return {RELEASE,KEY,create,init,newGame};
});
