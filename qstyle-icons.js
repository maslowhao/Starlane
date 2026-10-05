/* Approved Q-style icon presentation only. No game/save/event-handler changes. */
(() => {
 'use strict';
 const skills=['act','sing','speech','poise','movement','stamina','intellect','confidence'];
 const panels={recruit:'recruit',assistant:'assistant',publicity:'publicity',office:'office',opportunities:'opportunities',artist:'progress',works:'works',rivals:'rivals',journal:'journal'};
 const mobile=matchMedia('(max-width:540px)'),deferred=new Set();
 const lazyIcons=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.removeAttribute('data-qicon-pending');lazyIcons.unobserve(entry.target);deferred.delete(entry.target);}},{rootMargin:'80px 0px'}):null;
 mobile.addEventListener('change',()=>{if(!mobile.matches)for(const icon of deferred){icon.removeAttribute('data-qicon-pending');lazyIcons?.unobserve(icon);}if(!mobile.matches)deferred.clear();});
 const markup=(key,slot='small')=>`<span class="qicon" data-icon="${key}" data-slot="${slot}" aria-hidden="true"></span>`;
 function decorate(host,key,slot='small',target=host){
  if(!host||!target)return;
  host.classList.add('qicon-host');
  let icon=target.querySelector(':scope > .qicon');
  if(!icon){icon=document.createElement('span');icon.className='qicon';icon.setAttribute('aria-hidden','true');if(slot==='stat'&&mobile.matches&&lazyIcons){icon.dataset.qiconPending='';deferred.add(icon);lazyIcons.observe(icon);}target.prepend(icon);}
  if(icon.dataset.icon!==key)icon.dataset.icon=key;
  if(icon.dataset.slot!==slot)icon.dataset.slot=slot;
 }
 function refresh(){
  for(const icon of deferred)if(!icon.isConnected){lazyIcons.unobserve(icon);deferred.delete(icon);}
  for(const b of document.querySelectorAll('button[data-panel]'))if(panels[b.dataset.panel])decorate(b,panels[b.dataset.panel],b.closest('.secretary-menu')?'menu':'small');
  for(const [selector,key] of [['[data-ui-roster]','roster'],['[data-heat]','heat'],['[data-company-desk="team"]','handbook'],['[data-music-story]','music-story'],['details[data-first-story] > summary','first-story']])for(const b of document.querySelectorAll(selector))decorate(b,key,b.closest('.secretary-menu')?'menu':'small');
  for(const b of document.querySelectorAll('[data-secretary-menu],.secretary-npc .dynamic-label'))decorate(b,'secretary',b.matches('.dynamic-label')?'secretary':'small');
  for(const b of document.querySelectorAll('[data-company-room="practice"],[data-company-room="recording"]'))decorate(b,b.dataset.companyRoom,b.matches('.company-hotspot')?'door':'small',b.querySelector('.door-title-group')||b);
  for(const b of document.querySelectorAll('[data-company-room="reception"],[data-location="home"],[data-home]'))decorate(b,'home',b.closest('.travel-tools')?'travel':'small');
  decorate(document.getElementById('travel-open'),'outbound','travel');
  for(const key of ['eami','sosa','creative','global'])for(const b of document.querySelectorAll(`[data-location="${key}"]`))decorate(b,key,b.closest('#travel-menu')?'destination':'small');
  for(const key of skills){
   for(const b of document.querySelectorAll(`[data-company-course="${key}"]`))decorate(b,key,'course');
   for(const b of document.querySelectorAll(`[data-company-start="${key}"],[data-action="${key}"]`))decorate(b,key,'small');
   for(const input of document.querySelectorAll(`[data-train-skill][value="${key}"]`))decorate(input.closest('label'),key,'small');
  }
  for(const stat of document.querySelectorAll('[data-team-stat],[data-room-stat]')){
   const key=stat.dataset.teamStat||stat.dataset.roomStat;if(!skills.includes(key)&&key!=='fame')continue;
   const label=stat.parentElement.querySelector(stat.hasAttribute('data-team-stat')?'span':'dt');if(!label)continue;
   if(stat.hasAttribute('data-team-stat')){if(!label.querySelector('.qicon')){label.setAttribute('aria-label',label.textContent);label.title=label.textContent;label.replaceChildren();}decorate(label,key,'stat');if(!label.querySelector('.qstat-name')){const name=document.createElement('span');name.className='qstat-name';name.textContent=label.getAttribute('aria-label')||label.title;label.append(name);}}
   else decorate(label,key,'small');
  }
 }
 let queued=false;
 const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh();});});
 window.StarQIcons={refresh,markup};
 observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-pressed','aria-expanded','open']});
 refresh();
})();
