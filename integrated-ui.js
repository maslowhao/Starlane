(()=>{'use strict';
const $=s=>document.querySelector(s),scene=$('.studio-world');
const routes=document.createElement('div');routes.className='travel-tools';routes.innerHTML='<button id="travel-open" aria-expanded="false">外出洽談</button><button data-location="home" data-company-room="reception">回公司</button><nav id="travel-menu" hidden aria-label="外出目的地"><button data-location="eami">穗光唱片</button><button data-location="sosa">澄曜電視台</button><button data-location="creative">拾色廣告</button><button data-location="global">遠映影業</button></nav>';scene.prepend(routes);
const roster=document.createElement('dialog');roster.id='integrated-roster';roster.innerHTML='<header><h2>旗下藝人</h2><button data-roster-close>關閉</button></header><div></div>';document.body.append(roster);
let journalTab='ability';
function refresh(){
 const stage=$('#company-stage'),selected=stage.dataset.selectedArtist;
 document.querySelectorAll('#dynamic-layer .dynamic-person').forEach(el=>el.classList.toggle('current-artist',el.dataset.dynamicId===selected));
 const controls=$('#company-controls');controls.classList.toggle('secretary-open',!!controls.querySelector('.secretary-menu'));
 const info=controls.querySelector('.reception-team-info');if(info){info.dataset.tab=journalTab;let tabs=info.querySelector('.journal-tabs');if(!tabs){tabs=document.createElement('div');tabs.className='journal-tabs';tabs.innerHTML='<button data-journal-tab="status">近況</button><button data-journal-tab="ability">能力</button>';(info.querySelector('.reception-debut')||info.querySelector('.reception-profile')).after(tabs);}for(const b of tabs.children)b.setAttribute('aria-pressed',String(b.dataset.journalTab===journalTab));}
 window.StarQIcons.refresh();
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='travel-open'){const m=$('#travel-menu');m.hidden=!m.hidden;b.setAttribute('aria-expanded',String(!m.hidden));}if(b.dataset.location){$('#travel-menu').hidden=true;$('#travel-open').setAttribute('aria-expanded','false');}if(b.hasAttribute('data-ui-roster')){const host=roster.querySelector('div');host.replaceChildren();for(const a of StarCompany.roster()){const button=document.createElement('button');button.dataset.rosterArtist=a.id;const name=document.createElement('span');name.textContent=a.name;if(a.happyPortrait){const img=document.createElement('img');img.className='roster-happy';img.src=a.happyPortrait;img.alt='';img.width=48;img.height=48;img.decoding='async';img.addEventListener('error',()=>img.remove(),{once:true});button.append(img);}button.append(name);button.onclick=()=>{StarCompany.selectArtist(a.id);roster.close();};host.append(button);}if(!host.children.length)host.textContent='尚未簽約藝人，請先招募夥伴。';roster.showModal();}if(b.hasAttribute('data-roster-close'))roster.close();});
document.addEventListener('click',e=>{const b=e.target.closest('[data-journal-tab]');if(b){journalTab=b.dataset.journalTab;refresh();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('#travel-menu').hidden=true;$('#travel-open').setAttribute('aria-expanded','false');}});
window.StarIntegrated={refresh};refresh();
})();