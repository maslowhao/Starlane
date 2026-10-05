(()=>{
 'use strict';
 const small=matchMedia('(max-width:540px)'),music=document.querySelector('.reception-music'),assistant=document.querySelector('.studio-assistant'),banner=document.querySelector('.service-banner');
 const originals=[music,assistant,banner].map(node=>{const mark=document.createComment('responsive-original-position');node.before(mark);return {node,mark};});
 const controls=document.getElementById('company-controls'),controlsHome=document.createComment('company-controls-original');controls.before(controlsHome);
 const services=document.createElement('div');services.className='mobile-services';services.setAttribute('aria-label','助理服務狀態與控制');
 function arrange(){
  const home=document.getElementById('company-stage'),inline=small.matches&&home.dataset.room==='reception';
  if(inline){const anchor=document.getElementById('reception-activity')||home.querySelector('.company-room-visual');if(anchor.nextElementSibling!==controls)anchor.after(controls);}else if(controls.previousSibling!==controlsHome)controlsHome.after(controls);
  if(assistant.parentElement!==services)services.append(assistant);if(banner.parentElement!==services)services.append(banner);
  if(!small.matches){const m=originals[0];if(m.node.previousSibling!==m.mark)m.mark.after(m.node);const anchor=originals[1].mark;if(services.previousSibling!==anchor)anchor.after(services);return;}
  const header=document.querySelector('main>header');if(music.parentElement!==header)header.append(music);
  if(assistant.parentElement!==services)services.append(assistant);if(banner.parentElement!==services)services.append(banner);
  if(!home.hidden&&['practice','recording'].includes(home.dataset.room)){const layout=home.querySelector('.company-layout');if(services.parentElement!==layout)layout.append(services);return;}
  if(home.hidden){const location=document.getElementById('location-stage');if(location.lastElementChild!==services)location.append(services);return;}
  const visual=document.querySelector('.company-room-visual');
  const after=inline&&!home.hidden?controls:visual;if(after&&after.nextElementSibling!==services)after.after(services);
 }
 const tradeoffs=document.getElementById('work-tradeoffs'),tradeoffsHome=document.createComment('business-rules-original');tradeoffs.before(tradeoffsHome);
 const rules=document.createElement('details');rules.className='mobile-business-rules';rules.innerHTML='<summary>短案 5 秒／長作品分日製作 · 規則</summary>';
 function arrangeRules(){
  if(small.matches&&document.getElementById('company-business-dialog').open){if(tradeoffs.parentElement!==rules){rules.open=false;tradeoffsHome.after(rules);rules.append(tradeoffs);}}
  else{if(tradeoffs.previousSibling!==tradeoffsHome)tradeoffsHome.after(tradeoffs);rules.remove();}
 }
 new MutationObserver(arrangeRules).observe(document.getElementById('company-business-dialog'),{attributes:true,attributeFilter:['open']});
 small.addEventListener('change',()=>{window.StarCompany.refresh();arrange();arrangeRules();});
 new MutationObserver(arrange).observe(document.getElementById('company-stage'),{attributes:true,attributeFilter:['hidden','data-room']});
 arrange();
})();
