(() => {
  const G=StarGame,history={practice:[],recording:[],speech:[]},selected={practice:null,recording:null,speech:null};
  const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let choose=null;
  const belongs=(a,room)=>room==='speech'?a.task?.action.kind==='train'&&a.task.action.skill==='speech':G.locationOf(a)===room&&!(room==='recording'&&a.task?.action.skill==='speech');
  function render(state,room,artist,onChoose){
    choose=onChoose;
    for(const key of Object.keys(history)){
      const present=state.artists.filter(a=>belongs(a,key)).map(a=>a.id);
      history[key]=[...new Set([...present,...history[key]])].filter(id=>state.artists.some(a=>a.id===id)).slice(0,3);
    }
    const host=document.getElementById('room-stats');host.hidden=!Object.hasOwn(history,room);if(host.hidden)return;
    const ids=history[room],present=state.artists.filter(a=>belongs(a,room)).map(a=>a.id);
    if(ids.includes(artist))selected[room]=artist;
    if(!ids.includes(selected[room]))selected[room]=present[0]||ids[0]||null;
    const a=state.artists.find(a=>a.id===selected[room]);host.dataset.artist=a?.id||'';host.dataset.room=room;
    const names={practice:'表演訓練室',recording:'聲音訓練室',speech:'聲音表現教室'};
    host.innerHTML=`<div class="room-stats-heading"><b>${names[room]} · 藝人素質</b><small>${present.length?'訓練中 '+present.length+' 人':'目前無藝人在本室訓練'}</small></div>${a?`<div class="room-stats-tabs" role="group" aria-label="選擇本室藝人">${ids.map(id=>{const p=state.artists.find(p=>p.id===id);return `<button type="button" data-room-stat-artist="${id}" aria-pressed="${id===a.id}" title="${esc(p.name)}">${esc(p.name)}${present.includes(id)?'':' · 課後'}</button>`;}).join('')}</div><div class="room-stats-identity"><strong>${esc(a.name)}</strong><span>${present.includes(a.id)?esc(G.currentActivityLabel(a)):'本室課程已結束 · 目前'+esc(G.locationName(a))}</span></div><dl class="room-stats-values">${[...Object.entries(G.SKILLS),['fame','個人名氣']].map(([k,v])=>`<div><dt>${v}</dt><dd data-room-stat="${k}">${a[k]}</dd></div>`).join('')}</dl>`:`<p class="room-stats-empty">${state.artists.length?'開始本室課程後，這裡會顯示該藝人的九項現值。':'公司還沒有藝人，招募後即可在這裡練習。'}</p>`}`;
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-room-stat-artist]');if(!b)return;const room=document.getElementById('room-stats').dataset.room;if(history[room]?.includes(b.dataset.roomStatArtist)){selected[room]=b.dataset.roomStatArtist;choose?.(b.dataset.roomStatArtist);document.querySelector(`[data-room-stat-artist="${b.dataset.roomStatArtist}"]`)?.focus({preventScroll:true});}});
  window.StarRoomStats={render};
})();
