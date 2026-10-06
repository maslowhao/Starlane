(() => {
  'use strict';
  const base = new URL('assets/company/', document.currentScript.src).href;
  const G = window.StarGame;
  const courseIcons=new Set(['sing','act','stamina','speech','movement','intellect','poise','confidence']);
  const courseIcon=k=>courseIcons.has(k)?StarQIcons.markup(k,'course'):'';
  const $ = id => document.getElementById(id);
  const esc = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let lastWorkScene=null,room='reception', desk='recruit', skill='act', artist=null, api=null, current=null;
  const secretaryLines=['今天，也一起向前一點。','窗邊的咖啡還溫著，下一個舞台正在等你們。'];
  let secretaryLine=-1;
  const roomNames={reception:'',practice:'表演訓練室・肢體與表演',recording:'聲音訓練室・歌藝與聲音表情'};
  function render(ctx) {
    api=ctx;current=ctx.state;
    const host=$('company-stage');if(!host)return;
    if(!current.artists.some(a=>a.id===artist))artist=current.artists[0]?.id||null;
    if(room==='work'&&!current.artists.some(x=>x.id===artist&&(x.project||G.WORK_SCENES[G.locationOf(x)])))artist=current.artists.find(x=>G.WORK_SCENES[G.locationOf(x)])?.id||artist;
    const a=current.artists.find(x=>x.id===artist);const speechScene=room==='recording'&&(a?.task?.action.kind==='train'?a.task.action.skill==='speech':skill==='speech');if(room==='recording'&&a?.task?.action.kind==='train'&&['sing','speech'].includes(a.task.action.skill))skill=a.task.action.skill;let work=room==='work'?(G.WORK_SCENES[a&&G.locationOf(a)]||G.WORK_SCENES[{radio:'work-audio',series:'work-tv',cover:'work-ad'}[a?.project?.jobId]]):null;if(room==='work'&&!a?.task?.projectSegment&&!a?.project&&lastWorkScene&&window.StarDynamic?.inspect().some(x=>x.reaction))work=G.WORK_SCENES[lastWorkScene];
    const renderRoom=room==='work'?(work?(Object.entries(G.WORK_SCENES).find(([k,v])=>v===work)[0]):'work-empty'):room;if(work)lastWorkScene=renderRoom;
    $('company-room-title').textContent=room==='work'?(a?.project?`${work?.label||'通告現場'} · ${G.projectPhase(a,current.lastTick)}`:work?.label||'通告現場・目前無拍攝行程'):roomNames[room];
    const image=$('company-room-image'), src=room==='work'&&work?.background?base+work.background:StarArt.assets[room==='practice'?'acting-training':room==='recording'?'voice-training':'reception'].desktop;
    StarImages.set(image,src,true);
    $('company-room-title').hidden=room==='reception';
    image.alt=room==='reception'?'公司接待空間；點藝人打招呼，辦事請找小秘書':roomNames[room]+'，點選設備安排培育';
    host.dataset.room=room;host.dataset.workScene=work?renderRoom:'';
    const front=$('work-foreground');front.hidden=!work?.foreground;if(work?.foreground)StarImages.set(front,base+work.foreground,true);else{front.removeAttribute('src');delete front.dataset.originalSrc;}
    $('company-source').textContent=room==='reception'?'點藝人打招呼，辦事情找小秘書':(room==='recording'?'歌藝與聲音表情（口才）共用此室。':'演技、儀態、動感等課程使用此室。');
    if(speechScene){$('company-room-title').textContent='聲音訓練室・聲音表現教室';image.alt='口才培育，聲音表情教室';$('company-source').textContent='練習聲音表情，提升口才。';}
    if(room==='work'){$('company-source').textContent=work?`${work.label} · 工作結束後可查看成果。`:'目前無對應通告；未支援的活動維持外出狀態。';image.alt=work?.label||'目前無通告現場';}
    document.querySelectorAll('[data-company-room]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.companyRoom===room)));
    $('company-hotspots').innerHTML=room==='reception'
      ? '<button class="company-hotspot practice-door" data-company-room="practice"><span class="door-title-group"><b>前往表演訓練室</b></span></button><button class="company-hotspot recording-door" data-company-room="recording"><span class="door-title-group"><b>前往聲音訓練室</b></span></button>'
      : `<button class="company-hotspot equipment-spot" data-company-equipment="${room}"><b>${room==='recording'?'麥克風與耳機':'鏡面與練習把桿'}</b><span>選人・選課・開始培育</span></button>`;
    if(room==='work')$('company-hotspots').innerHTML='';
    $('company-controls').innerHTML=room==='work'?workPanel(a,work):room==='reception'?(desk==='recruit'?(current.artists.length?teamInfo(a):recruitment()):desk==='team'?teamInfo(a):desk==='secretary'?secretaryMenu():desk==='closed'?'<p>點小秘書，可招募夥伴或設定助理。</p>':management()):training(a);
    const activity=$('reception-activity');
    activity.hidden=room!=='reception'||!a;
    activity.innerHTML=activity.hidden?'':receptionActivity(a);
    const rows=$('reception-contracts');rows.hidden=true;rows.replaceChildren();
    $('training-actions').hidden=true;$('training-actions').innerHTML='';
    host.dataset.selectedArtist=artist||'';
    const sceneIds=room==='recording'?current.artists.filter(x=>G.locationOf(x)==='recording'&&(x.task?.action.skill==='speech')===speechScene).map(x=>x.id):null;
    window.StarDynamic?.update(current,renderRoom,id=>{artist=id;api.selectArtist?.(id);if(room==='reception')desk='team';render(api);},sceneIds);
    window.StarRoomStats.render(current,speechScene?'speech':room,artist,id=>{artist=id;render(api);});
    let guide=$('training-secretary-guide');
    if(!guide){guide=document.createElement('div');guide.id='training-secretary-guide';guide.className='training-secretary-guide';guide.innerHTML=`<span class="art-cutline-frame"><img data-art-id="secretary" ${StarImages.attrs(StarArt.assets.secretary.desktop)} alt="小秘書" draggable="false"></span><p>今天想練哪一項？選好課程，我們就開始吧！</p>`;document.querySelector('.company-room-visual').append(guide);}
    guide.hidden=!['practice','recording'].includes(room)||current.artists.some(x=>G.locationOf(x)===room);requestAnimationFrame(()=>StarArt.watch(guide.querySelector('img')));

    window.StarIntegrated?.refresh();
    if(matchMedia('(max-width:540px)').matches&&room==='reception'){
     const info=document.querySelector('.reception-team-info'),background=info?.querySelector('.growth-background');
     if(background){const story=document.createElement('details');story.className='reception-mobile-story';story.innerHTML='<summary>成長故事</summary>';story.append(background);info.append(story);}
     for(const el of document.querySelectorAll('[data-dynamic-id]:not([data-dynamic-id=secretary]) .dynamic-visual'))el.setAttribute('aria-pressed',String(el.closest('[data-dynamic-id]').dataset.dynamicId===artist));
    }
  }
  function receptionActivity(a){
    const t=a.task,pct=t?(t.production?G.productionProgress(t,current.lastTick).percent:Math.min(100,(current.lastTick-t.started)/(t.ends-t.started)*100)):0;
    return `<small class="reception-activity-artist">${esc(a.name)} · 目前行程</small>
        <p class="current-activity">${esc(t?G.taskInfo(t).label:a.project?'無短行程 · 長案待製作':'空閒')}</p>
        ${t?`<div class="company-task"><span id="company-countdown">${G.taskCountdown(t,current.lastTick)}</span><progress id="company-progress" max="100" value="${pct}" aria-label="目前行程進度"></progress></div><div class="reception-task-actions"><button data-cancel="${esc(a.id)}">取消目前行程</button>${t.production?`<button data-production-rest="${esc(a.id)}" ${t.production.rest?'disabled':''}>休息5秒後續作</button>`:''}</div>`:''}
    `;
  }
  function teamInfo(a){
    if(!a)return recruitment();
    const t=a.task,locks=G.debutLocks(a),ready=!a.debuted&&!locks.length&&!t,person=window.StarPersonas?.[a.id];
    const pct=t?(t.production?G.productionProgress(t,current.lastTick).percent:Math.min(100,(current.lastTick-t.started)/(t.ends-t.started)*100)):0;
    return `<section class="reception-team-info" data-team-artist="${esc(a.id)}">
      <div class="company-panel-heading"><span>RECEPTION · OUR TEAM</span><h3>旗下夥伴，今天的近況。</h3><p>已簽約 ${current.artists.length}/${current.capacity} 人 · 資料與行程即時同步</p></div>${picker()}
      <div class="reception-profile"><img class="journal-chibi" src="${esc(StarChibi.path({...G.identity(current,a.id),...a}))}" alt="${esc(a.name)}"><div><small>${a.debuted?'正式出道':'練習生'} · ${esc(a.role.replace(/新人$/,'藝人'))}</small>${StarSingingRanksUI.chips(current,a)}<h3>${esc(a.name)}</h3><p>${esc(a.tag)}</p><small>粉絲 ${(current.fansByArtist[a.id]||0).toLocaleString('zh-TW')} 人</small></div></div>
      <div class="reception-debut">${a.debuted?'<small>已正式出道 · 通告仍須符合各項門檻</small>':`<button data-debut="${esc(a.id)}" ${ready?'':'disabled'}>宣布出道</button><small class="reception-debut-reason">${esc(locks.length?'出道還需：'+locks.join('、'):t?'已達門檻，請等目前行程完成後再宣布出道。':'已達出道門檻，由你決定下一步。')}</small>`}</div>
      ${StarMusicChapterUI.card(current,a)}${StarFirstWorkUI.card(current,a)}<section class="reception-status-panel" aria-label="藝人待辦與近況">
        <div class="reception-queue"><h4>待辦 ${a.queue.length} / 3</h4>${a.queue.length?a.queue.map((q,n)=>`<div><span>${n+1}. ${esc(G.actionInfo(q).label)}</span><button data-remove="${esc(a.id)}" data-index="${n}" aria-label="移除${esc(a.name)}的待辦${n+1}">移除</button></div>`).join(''):'<small>目前沒有待辦行程。</small>'}</div>
        ${a.project?`<p class="reception-contract-status">${esc(G.receptionProjectStatus(a,current.lastTick))}</p><button data-company-contract="${esc(a.id)}">查看合約／通告現場</button>${window.StarProjectUI.card(a,current)}`:''}
        
        <details class="reception-persona"><summary>藝人介紹與成長</summary><p>${esc(StarDisplayCopy.trait(a.trait))}</p>${person?`<p>${esc(person.personality)}</p>${api.backgroundCard(a)}<dl><dt>目標</dt><dd>${esc(person.goal)}</dd><dt>說話方式</dt><dd>${esc(person.voice)}</dd></dl>`:api.backgroundCard(a)}${window.StarDevelopmentUI.progress(a)}<button data-company-release="${esc(a.id)}">辦理解約 · 原簽約金的50%</button></details>
      </section>
      <section class="reception-ability-panel" aria-label="九項屬性與休息"><div class="reception-stats" aria-label="九項能力">${[...Object.entries(G.SKILLS),['fame','個人名氣']].map(([k,v])=>`<div><span>${v}</span><b data-team-stat="${k}">${a[k]}</b><meter min="0" max="999" value="${a[k]}" aria-label="${v}"></meter></div>`).join('')}</div><div class="reception-fatigue"><span>疲勞</span><strong>${a.fatigue}/100</strong><progress max="100" value="${a.fatigue}" aria-label="疲勞"></progress></div><div class="reception-rest"><button data-company-rest="${esc(a.id)}" ${G.canStart(current,a,{kind:'rest'})?'disabled':''}>休息 5 秒 · 疲勞 −45</button><small>${esc(G.canStart(current,a,{kind:'rest'})||'依既有規則安排休息，保留長案與助理設定。')}</small></div></section>
      <p class="company-footnote">招募請點小秘書，再選「招募藝人」；招募頁最上方可擴充名額，也保留「作品與公司擴充」入口。</p>
    </section>`;
  }
  function workPanel(a,work){const t=a?.task;return `<div class="company-panel-heading"><span>ON LOCATION · WORK IN PROGRESS</span><h3>${a?.project?esc(G.projectPhase(a,current.lastTick)):work?work.label:'目前沒有對應活動'}</h3><p>目前活動與長案合約分開顯示；只有每日製作段會留在片場，等待期間可穿插工作。</p></div>${picker()}${a?`<p class="current-activity">目前：${esc(G.currentActivityLabel(a))}</p>`:''}${a?window.StarProjectUI.card(a,current):''}${t?`<h3>${esc(G.taskInfo(t).label)}</h3><div class="company-task"><span id="company-countdown">${G.taskCountdown(t,current.lastTick)}</span><progress id="company-progress" max="100" value="0"></progress></div><p>${t.source?.includes('assistant')?'助理安排':'玩家安排'} · ${esc(a.name)}${t.projectSegment?' · 本段完成只增加製作日，整案完成才交付報酬。':t.action.kind==='job'?` · 預估報酬 $${t.contract?.earned??G.payout(a,G.taskInfo(t))}`:''}</p>`:a?.project?'<p>合約仍在進行，下一製作段前不占用藝人。</p>':'<p>目前沒有製作中合約；已交付作品請到「作品熱度」查看。</p>'}<button data-company-room="reception">回公司接待</button><p class="company-result">${a?esc(current.log.find(l=>l.text.includes(a.name))?.text||''):''}</p>`;}
  function secretaryMenu(){return `<div class="company-panel-heading"><span>SECRETARY · WELCOME</span><h3>今天有什麼需要幫忙？</h3><p>查看招募或助理設定不會啟用代排，也不會扣薪。</p></div><div class="company-management secretary-menu"><button data-panel="recruit">招募藝人</button><button data-ui-roster>旗下藝人</button><button data-panel="assistant" data-assistant-focus>助理設定／代排</button><button data-panel="publicity" class="secretary-pr ${current.publicity.pending?'is-pending':''}">公關事件<span data-publicity-count>${current.publicity.pending?' · 1 待處理':''}</span></button><button data-panel="office">公司經營／設備</button><button data-panel="opportunities">重要邀約／原創企劃</button><button data-panel="works">作品與公司擴充</button><button data-heat>作品熱度／收益歷史</button><button data-panel="rivals">競爭公司</button><button data-panel="journal">工作日誌</button><button data-company-desk="team">回到手帳</button></div>`;}
  function recruitment(){return `<div class="company-panel-heading"><span>RECEPTION · MEET YOUR TEAM</span><h3>讓小秘書介紹下一位夥伴。</h3></div><button data-panel="works">查看作品／擴充 ${current.capacity} → ${Math.min(3,current.capacity+1)} 人名額</button><div class="company-candidates">${G.PEOPLE.filter(p=>current.candidates.slice(0,current.customRecruitCardUsed?2:1).includes(p.id)).map(p=>{
    const quote=G.recruitQuote(p.id),owned=current.artists.some(a=>a.id===p.id),full=current.artists.length>=current.capacity,lack=current.cash<quote.fee;
    return `<article>${api.recruitmentPortrait(p.id)}<b>${esc(p.name)}</b><small>${p.role}</small><p><strong>簽約金 $${quote.fee}</strong><br><small>${quote.basis}</small></p><p>歌藝 ${p.sing} · 演技 ${p.act}<br>口才 ${p.speech} · 自信 ${p.confidence}</p><details><summary>個性與九項能力</summary><p>${esc(StarDisplayCopy.trait(p.trait))}<br>${Object.entries(G.SKILLS).map(([k,v])=>`${v} ${p[k]}`).join(' · ')} · 名氣 ${p.fame}</p></details>${api.backgroundCard(p)}<button data-company-recruit="${p.id}" ${owned||full||lack?'disabled':''}>${owned?'已加入':full?'公司已滿':lack?'資金不足':'邀請加入 · $'+quote.fee}</button></article>`;
  }).join('')}${customRecruitCard()}</div><details><summary>簽約金怎麼算？</summary><p>${StarMoney.signingFormula(G)}已簽藝人保留實付金額，成長不追溯調價；解約支付原實付的 50%。</p></details><div class="recruit-refresh"><small>${current.hasEverSigned?'首次簽約後，開局刷新權益已結束。':`開局免費刷新剩 ${current.refreshRemaining}/3 次；無時間恢復。`}</small><button data-company-refresh="true" ${current.hasEverSigned||!current.refreshRemaining?'disabled':''}>免費刷新 · ${current.refreshRemaining}/3</button></div><p class="company-footnote">${current.customRecruitCardUsed?'每批兩位普通候選。':'自創卡保留期間：一位原創候選＋自創藝人；刷新只更換原創候選。'}招募名單僅包含 6 位原創藝人，候選不重複。名單會隨存檔保存。招募成功後，點圖中入口前往表演訓練室或聲音訓練室。</p>`;}
  function customRecruitCard(){if(current.customRecruitCardUsed)return '';return `<article class="custom-recruit-card"><button type="button" class="custom-slot-symbol" data-custom-create aria-label="建立自創藝人">＋</button><b>自創藝人</b><small>由你決定姓名、肖像與個性</small><p>八能力基礎141＋自由配點21<br>單項上限36 · 名氣0</p><p>簽約金依現有能力公式計算。刷新或取消不會移除此卡；首次簽下任何藝人後，此卡換成普通候選；自創僅限第一位。</p><button data-custom-create ${current.artists.length>=current.capacity?'disabled':''}>${current.artists.length>=current.capacity?'公司已滿，請先擴充':'建立我的藝人'}</button></article>`;}
  function management(){return `<div class="company-panel-heading"><span>FRONT DESK · DAILY MANAGEMENT</span><h3>今天，怎麼陪大家成長？</h3><p>旗下 ${current.artists.length}/${current.capacity} 人 · 資金 $${current.cash}</p></div>${picker()}${window.StarProjectUI.card(current.artists.find(a=>a.id===artist),current)}${artist?`<button data-company-release="${artist}">辦理解約 · 簽約費的 ${G.RELEASE_RATIO*100}%</button>`:''}<div class="company-management"><button data-company-room="work">查看通告現場 →</button><button data-company-room="practice">帶夥伴去表演訓練室 →</button><button data-company-room="recording">帶夥伴去聲音訓練室 →</button><button data-panel="recruit">請小秘書介紹新人</button></div><div class="company-inline-assistant"><b>助理 ${current.assistant.enabled?'一般代排中':G.serviceActive(current)?'長案管理中／計薪中':'未啟用'}</b><p>接通告與助理設定可由小秘書分別開啟。</p><button data-panel="assistant">助理設定／代排 →</button></div>`;}
  function picker(){return current.artists.length?`<label class="company-picker">選擇藝人<select id="company-artist">${current.artists.map(a=>`<option value="${a.id}" ${a.id===artist?'selected':''}>${esc(a.name)} · ${G.locationName(a)} · 疲勞 ${a.fatigue}</option>`).join('')}</select></label>`:'<p>公司目前還沒有藝人。先請小秘書介紹第一位夥伴。</p>';}
  function restButton(a){const reason=G.canStart(current,a,{kind:'rest'}),high=a.fatigue>=80;return `<button data-company-rest="${a.id}" class="${high?'rest-needed':''}" ${reason?'disabled':''}>${high?(reason?'需要休息 · 行程完成後':'需要休息 · '):''}${high&&reason?'':'休息 5 秒 · 疲勞 −45'}</button>`;}
  function trainingActions(a){
    if(!a)return '<span>先招募一位藝人，即可安排訓練。</span>';
    const course=G.TRAINING[skill],reason=G.canStart(current,a,{kind:'train',skill}),full=a[skill]>=999,task=a.task;
    return `<span class="training-action-person">${esc(a.name)} · ${G.SKILLS[skill]}${task?' · 行程中':''}</span><div class="company-action-buttons"><button id="company-start" class="primary" data-company-start="${skill}" ${reason||full?'disabled':''}>開始${G.SKILLS[skill]}訓練 · $${course.cost}</button>${restButton(a)}${task?`<button data-company-cancel="${a.id}">取消目前行程</button>`:''}</div>`;
  }
  function training(a){
    if(!a)return `<div class="company-panel-heading"><h3>設備準備好了，還缺一位夥伴。</h3><p>招募後即可直接在房間裡選課與訓練。</p></div><button class="primary" data-company-desk="recruit">請小秘書介紹 →</button>`;
    const course=G.TRAINING[skill],p=G.trainingPreview(a,skill),reason=G.canStart(current,a,{kind:'train',skill}),full=a[skill]>=999;
    const task=a.task,pct=task?Math.min(100,(current.lastTick-task.started)/(task.ends-task.started)*100):0;
    return `<div class="company-panel-heading"><span>${room==='recording'?'RECORDING · VOICE TRAINING':'PRACTICE · EVERY LITTLE STEP'}</span><h3>${room==='recording'?'站到麥克風前，再唱一次。':'從今天的第一堂課開始。'}</h3></div>${picker()}
      <div class="course-picker"><b>${room==='recording'?'聲音訓練室課程':'培育課程'}</b><div class="course-options" role="group" aria-label="選擇培育課程">${Object.entries(G.SKILLS).filter(([k])=>room==='recording'?['sing','speech'].includes(k):!['sing','speech'].includes(k)).map(([k,v])=>`<button type="button" data-company-course="${k}" aria-pressed="${k===skill}">${courseIcon(k)}<span>${k==='speech'?'聲音表現（口才）':v+'訓練'}</span></button>`).join('')}</div></div>
      <div class="company-current"><b>${G.SKILLS[skill]} <strong id="company-stat">${a[skill]}</strong><small>/999</small></b><span>疲勞 <strong id="company-fatigue">${a.fatigue}</strong>/100</span></div>
      <div class="training-inline-actions">${trainingActions(a)}</div>
      <div class="mobile-course-summary"><b>本次基礎 ${G.SKILLS[skill]} +${full?0:p.min}–${full?0:p.gain}</b><span>費用 $${course.cost} · 5 秒 · 疲勞 +${G.fatigueCost(a,course)}</span>${full||reason?`<small>${esc(full?'此能力已滿':reason)}</small>`:''}</div>
      <details class="mobile-training-rules"><summary>訓練規則與疲勞提醒</summary><p>才智提高高點機率，單項基礎1–3點。效率 ${p.efficiency*100}%；${p.failureChance*100}% 訓練失敗率，失敗零成長，學費與疲勞照常。</p><p>${esc(full?'此能力已滿':reason||'開始後顯示活動狀態；完成時更新能力、疲勞及結果提示。')}</p></details>
      ${room==='recording'?'<p>這裡是培育課程，不會推出歌曲。要發行作品，請接唱片錄製通告。</p><button data-panel="board" data-filter="music">前往單曲錄製通告 →</button>':''}<div class="company-course-preview" id="company-preview"><b>本次基礎 ${G.SKILLS[skill]} +${full?0:p.min}–${full?0:p.gain}</b><p>費用 $${course.cost} · 5 秒<br>才智提高高點機率，單項基礎1–3點<br>疲勞 +${G.fatigueCost(a,course)} · 效率 ${p.efficiency*100}%<br>${p.failureChance*100}% 訓練失敗率；失敗零成長，學費與疲勞照常</p></div>

      ${window.StarDevelopmentUI.progress(a)}<div class="company-task"><b id="company-task-label">${task?esc(G.taskInfo(task).label):'空閒，可以開始'}</b><span id="company-countdown">${task?Math.max(0,Math.ceil((task.ends-current.lastTick)/1000))+' 秒':''}</span><progress id="company-progress" max="100" value="${pct}"></progress></div>
      <p class="company-reason">${full?'此能力已滿':reason||'開始後顯示活動狀態；完成時更新能力、疲勞及結果提示。'}</p>
      <p class="company-footnote">訓練完成後可查看成果。${a.queue.length?`已排 ${a.queue.length} 項待辦。`:'目前無待辦。'}助理${a.assistantEnabled?'已啟用，完成後會繼續代排':'未啟用，由你親自安排'}。</p><div class="company-result" id="company-result">${esc(current.log.find(l=>l.text.includes(a.name))?.text||'每一次練習，都算數。')}</div>`;
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||b.disabled||!api)return;
    if(b.dataset.companyContract){artist=b.dataset.companyContract;room='work';render(api);return;}
    if(b.dataset.companyCourse){const keepFocus=b.matches(':focus-visible');skill=b.dataset.companyCourse;render(api);if(keepFocus)document.querySelector('[data-company-course="'+skill+'"]')?.focus({preventScroll:true});}
    if(b.dataset.companyRoom){if(['practice','recording'].includes(b.dataset.companyRoom))requestAnimationFrame(()=>document.querySelector('.company-room-bar').scrollIntoView({block:'start',behavior:'instant'}));room=b.dataset.companyRoom;if(room==='reception')desk=current.artists.length?'team':'recruit';skill=room==='recording'?(['sing','speech'].includes(skill)?skill:'sing'):(['sing','speech'].includes(skill)?'act':skill);render(api);}
    if(b.dataset.companyDesk){room='reception';desk=b.dataset.companyDesk;render(api);}
    if(b.dataset.companyEquipment||b.dataset.companyPerson)$('company-controls').scrollIntoView({block:'nearest',behavior:'smooth'});
    if(b.dataset.companyRefresh)api.refresh();
    if(b.dataset.companyRecruit)api.recruit(b.dataset.companyRecruit, id=>{artist=id;desk='team';});
    if(b.dataset.companyStart)api.action(artist,{kind:'train',skill:b.dataset.companyStart});
    if(b.dataset.companyRest)api.action(b.dataset.companyRest,{kind:'rest'});
    if(b.dataset.companyCancel)api.cancel(b.dataset.companyCancel);
    if(b.dataset.companyAssistant)api.assistant(b.dataset.companyAssistant==='on');
    if(b.dataset.companyRelease)api.release(b.dataset.companyRelease);
    if(b.dataset.companyMode)api.mode(artist,b.dataset.companyMode);
  });
  document.addEventListener('change',e=>{
    if(e.target.id==='company-artist'){artist=e.target.value;api.selectArtist?.(artist);render(api);}
    if(e.target.id==='company-course'){skill=e.target.value;render(api);}
  });
  function tick(state){const a=state.artists.find(x=>x.id===artist);if(a?.task&&$('company-countdown')){const t=a.task;$('company-countdown').textContent=G.taskCountdown(t,state.lastTick);$('company-progress').value=t.production?G.productionProgress(t,state.lastTick).percent:Math.min(100,(state.lastTick-t.started)/(t.ends-t.started)*100);}}
  window.StarCompany={render,tick,selectArtist:id=>{if(!current.artists.some(a=>a.id===id))return;artist=id;api.selectArtist?.(id);room='reception';desk='team';render(api);},roster:()=>current.artists.map(a=>{const happy=StarChibi.path({...G.identity(current,a.id),...a},'happy');return {id:a.id,name:a.name,storyPending:G.CHAPTER.get(current,a.id)?.pending!=null||(G.FIRST_STORY.get(current,a.id)?.status==='pending'&&G.FIRST_STORY.get(current,a.id)?.work.kind!=='music'),happyPortrait:happy?.endsWith('-happy.webp')?happy:null};}),showRecruitment:()=>{if(!matchMedia('(max-width:540px)').matches||current.hasEverSigned||current.artists.length||current.publicity.pending||current.events.length)return false;room='reception';desk='recruit';render(api);document.querySelector('#company-controls .company-candidates')?.scrollIntoView({block:'start'});return true;},showWork:id=>{const a=current?.artists.find(x=>x.id===id);if(!a?.task||!G.WORK_SCENES[G.locationOf(a)])return false;artist=id;room='work';render(api);return true;},refresh:()=>render(api),openAssistant:()=>{room='reception';desk='secretary';secretaryLine=(secretaryLine+1)%secretaryLines.length;render(api);document.getElementById('company-controls').scrollIntoView({block:'nearest'});document.querySelector('#company-controls [data-panel="recruit"]')?.focus({preventScroll:true});}};
})();
