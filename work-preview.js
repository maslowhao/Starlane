(() => {
 'use strict';
 const G=window.StarGame,esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const dialog=document.createElement('dialog');dialog.id='eami-work-preview';dialog.setAttribute('aria-labelledby','eami-preview-title');document.body.append(dialog);
 let tracked=null,onEnd=null;
 function close(){tracked=null;if(dialog.open)dialog.close();document.getElementById((dialog.dataset.company||'eami')+'-owner')?.focus({preventScroll:true});}
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 dialog.addEventListener('click',e=>{if(e.target.closest('[data-preview-close]'))close();});
 function tick(s){if(!tracked||!dialog.open)return;const a=s.artists.find(a=>a.id===tracked.id),t=a?.task;if(!t||t.started!==tracked.started||t.action.id!==tracked.jobId){const finished=s.lastTick>=tracked.ends;close();if(finished)onEnd?.('這段通告已結束，結果已自動結算；可在工作日誌查看。');return;}const remaining=Math.max(0,t.ends-s.lastTick);document.getElementById('eami-preview-countdown').textContent=`${a.name} · ${G.taskCountdown(t,s.lastTick)}`;document.getElementById('eami-preview-progress').value=Math.min(100,Math.max(0,(s.lastTick-t.started)/(t.ends-t.started)*100));dialog.dataset.remainingMs=String(remaining);}
 function open(a,s,portrait,notify){const t=a?.task,work=t&&G.WORK_SCENES[G.locationOf(a)];if(!t||t.action.kind!=='job'||!['cafe','short','local'].includes(t.action.id)||t.projectSegment||!work)return false;close();tracked={id:a.id,started:t.started,ends:t.ends,jobId:t.action.id};onEnd=notify;dialog.dataset.artist=a.id;const company=StarCompanyRoutes.jobCompany(t.action.id),place=StarCompanyRoutes.companies[company];dialog.dataset.company=company;
  dialog.innerHTML=`<header><div><small>${place.name} · 工作進行中</small><h2 id="eami-preview-title">${esc(G.taskInfo(t).label)}</h2></div><button type="button" data-preview-close aria-label="關閉工作小視窗，通告繼續進行">✕</button></header><div class="eami-preview-scene"><img class="eami-preview-background" src="assets/company/${work.background}" alt="${esc(work.label)}"><div class="eami-preview-artist">${portrait(a.id)}<div class="portrait-ongoing" aria-hidden="true">${G.taskInfo(t).type==='music'?[0,1,2].map(i=>`<img class="fx-note fx-note-${i}" src="assets/effects/music_single.png" alt="">`).join(''):'<span class="fx-focus">拍攝進行中</span>'}</div></div>${work.foreground?`<img class="eami-preview-foreground" src="assets/company/${work.foreground}" alt="">`:''}</div><div class="eami-preview-status"><strong id="eami-preview-countdown" role="timer"></strong><progress id="eami-preview-progress" max="100" value="0" aria-label="通告進度"></progress><p>留在${place.name}大廳即可。關閉小視窗，工作仍會照常完成並自動結算。</p><button type="button" data-preview-close>收起畫面，留在大廳</button></div>`;
  dialog.showModal();tick(s);return true;
 }
 window.StarWorkPreview={open,tick,close};
})();
