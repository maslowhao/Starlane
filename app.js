(() => {
  'use strict';
  const G = window.StarGame, DEMO=new URLSearchParams(location.search).get('experience')==='seven', KEY = DEMO?'starlane-experience-save-v1':'starlane-save-v1', LOCK = DEMO?'starlane-experience-owner-v1':'starlane-owner-v1', BACKUP = DEMO?'starlane-experience-backup-v1':'starlane-before-v07';
  const ARCHIVE_BACKUP=KEY+'-before-v0107',PRODUCTION_BACKUP=KEY+'-before-v0108',SPEED_BACKUP=KEY+'-before-v0109',DAILY_BACKUP=KEY+'-before-v0110',SALARY_BACKUP=KEY+'-before-v0112',FIVE_BACKUP=KEY+'-before-v0113',CAREER_BACKUP=KEY+'-before-v0120',EQUIPMENT_BACKUP=KEY+'-before-v0121';
  const clock=()=>DEMO&&state?state.lastTick:Date.now();
  function newExperience(){const s=G.create(Date.now());s.experience='seven';s.candidates=['oc_qiao','oc_muyu'];G.recruit(s,'oc_qiao');return s;}
  const $ = id => document.getElementById(id);
  const esc = x => String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = StarMoney.format;
  const confirm = text => window.confirm(StarMoney.legacy(text));
  const uid = Date.now() + '-' + Math.random();
  let lastSignature = '';
  let state, selected = null, filter = 'all', lastSave = 0, stopped = false, toastTimer, storageOK = true, channel;
  const trainChoices = Object.fromEntries(G.PEOPLE.map(p=>[p.id,'sing']));
  const Scene = window.StarScene;
  let activePanel = 'artist', activeRoom = null, panelOpener = null, boardCompany = null, opportunityCompany = null;
  let loadError = '', migrated = false, loadedExisting = false;
  try {
    const raw = localStorage.getItem(KEY);
    if(raw&&JSON.parse(raw).version<16&&!localStorage.getItem(ARCHIVE_BACKUP))localStorage.setItem(ARCHIVE_BACKUP,raw);
    if(raw&&JSON.parse(raw).version<17&&!localStorage.getItem(PRODUCTION_BACKUP))localStorage.setItem(PRODUCTION_BACKUP,raw);
    if(raw&&JSON.parse(raw).version<18&&!localStorage.getItem(SPEED_BACKUP))localStorage.setItem(SPEED_BACKUP,raw);
    if(raw&&JSON.parse(raw).version<19&&!localStorage.getItem(DAILY_BACKUP))localStorage.setItem(DAILY_BACKUP,raw);
    if(raw&&JSON.parse(raw).version<21&&!localStorage.getItem(SALARY_BACKUP))localStorage.setItem(SALARY_BACKUP,raw);
    if(raw&&JSON.parse(raw).version<22&&!localStorage.getItem(FIVE_BACKUP))localStorage.setItem(FIVE_BACKUP,raw);
    if(raw&&JSON.parse(raw).version<27&&!localStorage.getItem(CAREER_BACKUP))localStorage.setItem(CAREER_BACKUP,raw);
    if(raw&&JSON.parse(raw).version<28&&!localStorage.getItem(EQUIPMENT_BACKUP))localStorage.setItem(EQUIPMENT_BACKUP,raw);
    state = raw ? G.restore(raw) : DEMO?newExperience():G.create();
    loadedExisting = !!raw;
    if (raw && JSON.parse(raw).version !== G.VERSION) {
      if (!localStorage.getItem(BACKUP)) localStorage.setItem(BACKUP, raw);
      migrated = true;
    }
    if (raw && !DEMO) G.advance(state, clock(), true);
  } catch (e) {
    state = G.create();
    loadError = (e.code==='REMOVED_ARTIST_SAVE'?'此存檔包含已移除的明星志願藝人或其作品紀錄，與目前純原創版本不相容。請先匯出原存檔備份，再按「重新開局」。原資料不會自動刪除。':null) || '無法讀取原存檔。為保護資料，本次不會覆寫原存檔。可匯入備份，或按「重新開局」建立新存檔。';
    storageOK = false;
  }
  // Newest tab takes control; a background tab must never overwrite a newer save.
  try { localStorage.setItem(LOCK, uid); } catch { storageOK = false; }
  try {
    channel = new BroadcastChannel(DEMO?'starlane-experience-player':'starlane-single-player');
    channel.onmessage = e => { if (e.data === 'takeover') stopTab(); };
    channel.postMessage('takeover');
  } catch { /* localStorage lock remains available */ }
  window.addEventListener('storage', e => { if (e.key === LOCK && e.newValue !== uid) stopTab(); });
  function stopTab() {
    if (stopped) return;
    stopped = true;
    const overlay = document.createElement('div'); overlay.className = 'conflict-banner';
    overlay.innerHTML = '<div><h2>工作室已在另一個分頁開啟</h2><p>這個分頁已暫停，以免存檔互相覆蓋。請使用最新開啟的遊戲分頁，或關閉其他分頁後重新整理。</p></div>';
    document.body.append(overlay);
  }
  function ownTab() {
    if (stopped) return false;
    try { if (localStorage.getItem(LOCK) !== uid) { stopTab(); return false; } } catch { /* allow ephemeral play */ }
    return true;
  }
  function persist() {
    if (!ownTab()) return;
    if(DEMO)state.experience='seven';
    if (!storageOK) { $('save-status').textContent = '未自動儲存 · 請匯出備份'; return; }
    try { localStorage.setItem(KEY, G.save(state)); $('save-status').textContent = DEMO?'已儲存獨立體驗進度':'已儲存於這個瀏覽器'; lastSave = Date.now(); }
    catch { storageOK = false; $('save-status').textContent = '儲存空間不足 · 請匯出備份'; toast('自動存檔失敗，請匯出存檔保留進度。'); }
  }
  let pendingManualView=null;
  function showManualWork(id){
    const a=state.artists.find(x=>x.id===id);if(!a?.task||!G.WORK_SCENES[G.locationOf(a)])return false;
    pendingManualView=null;selected=id;closeHeat();closeWorkspace();window.StarLocations.select('home');
    if(!window.StarCompany.showWork(id))return false;
    $('company-room-image').scrollIntoView({block:'center',behavior:'instant'});return true;
  }
  function followManualBooking(id,action){
    if(action.kind!=='job')return;
    const a=state.artists.find(x=>x.id===id);
    if(a?.task?.action.id===action.id&&a.task.started===state.lastTick){if(['cafe','short','local'].includes(action.id)&&panelOpener?.dataset.company&&!$('location-stage').hidden&&$('location-stage').dataset.place===panelOpener.dataset.company){pendingManualView=null;closeWorkspace();window.StarWorkPreview.open(a,state,recruitmentPortrait,toast);}else showManualWork(id);return;}
    if(a?.project?.jobId===action.id&&a.project.acceptedAt===state.lastTick){
      pendingManualView={id,acceptedAt:a.project.acceptedAt};
      toast('長案已接受，尚待製作時段；開工時帶你前往現場。自行切換畫面會取消跟隨。');
    }
  }
  function checkManualView(){
    if(!pendingManualView)return;const a=state.artists.find(x=>x.id===pendingManualView.id);
    if(!a?.project||a.project.acceptedAt!==pendingManualView.acceptedAt||!a.project.assisted){pendingManualView=null;return;}
    if(a.task?.projectSegment)showManualWork(a.id);
  }
  document.addEventListener('click',e=>{if(e.target.closest('[data-location],[data-home],[data-panel],[data-company-room],[data-select],[data-switch-artist],[data-secretary-menu]'))pendingManualView=null;},true);
  document.addEventListener('change',e=>{if(e.target.id==='company-artist')pendingManualView=null;if(e.target.id==='heat-select'){window.StarWorksUI.setHeatWork(e.target.value);window.StarWorksUI.renderHeat(state,DEMO);}if(e.target.dataset.training&&Object.hasOwn(G.SKILLS,e.target.value)&&state.artists.some(a=>a.id===e.target.dataset.training)){const id=e.target.dataset.training;trainChoices[id]=e.target.value;renderArtists();document.getElementById('training-'+id)?.focus({preventScroll:true});}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pendingManualView=null;});
  $('workspace-dialog').addEventListener('cancel',()=>{pendingManualView=null;});
  function toast(text) { $('toast').textContent = text; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 3400); }
  function modal(html) { $('modal-content').innerHTML = html; if (!$('modal').open) $('modal').showModal(); }
  function sync() { if (!ownTab()) return false; liveAdvance(); return true; }
  function mutate(fn) { if (!sync()) return; const result = fn(); persist(); render(); return result; }
  const portraitBase = new URL('.', document.currentScript.src).href;
  function portrait(id) { const p=typeof id==='number'?G.PEOPLE[id]:G.identity(state,id);return p?`<img class="artist-portrait" ${StarImages.attrs(portraitBase+p.portrait)} alt="${esc(p.name)}肖像">`:''; }
  const emptyCompany = message => `<div class="empty-company"><span>✦</span><h3>公司還在等待第一位夥伴。</h3><p>${message}</p><button class="primary" data-panel="recruit">尋找／招募藝人 →</button></div>`;
  function recruitmentPortrait(id) {const p=G.identity(state,id);return `<div class="half-portrait original-portrait ${p.portraitStatus==='已批准原創2D立繪'?'approved-portrait':''}"><img ${StarImages.attrs(portraitBase+p.portrait)} alt="${esc(p.name)}半身肖像"></div>`;}
  let presence=window.StarPresence.create(G,state,clock,document.hidden);
  function liveAdvance(){const r=presence.tick();window.StarDynamic?.react(r.outcomes,state);return r;}
  let expansionCooldownUntil=0;
  function renderRecruitment() {
    StarExpansionUI.render($('recruit-expansion'),state);
    $('signing-formula').textContent=StarMoney.signingFormula(G)+' 此為初版平衡公式。';
    
    $('recruit-candidates').innerHTML=G.PEOPLE.filter(p=>state.candidates.slice(0,state.customRecruitCardUsed?2:1).includes(p.id)).map(p=>{const quote=G.recruitQuote(p.id),hired=state.artists.some(a=>a.id===p.id),full=state.artists.length>=state.capacity,poor=state.cash<quote.fee;
      return `<article class="recruit-card ${p.color}"><div class="recruit-person">${recruitmentPortrait(p.id)}<div><h3>${esc(p.name)}</h3><span>${p.role}方向</span><p>${p.tag}</p></div></div><p><strong>簽約金 ${money(quote.fee)}</strong><br><small>${quote.basis}</small></p><div class="recruit-skills">${Object.entries(G.SKILLS).map(([k,label])=>`${label} ${p[k]}`).join(' · ')} · 名氣 ${p.fame}</div><small>${esc(StarDisplayCopy.trait(p.trait))}</small>${backgroundCard(p)}<button class="primary" data-recruit="${p.id}" ${hired||full||poor?'disabled':''}>${hired?'已加入公司':full?'目前名額已滿，請先擴充':poor?'資金不足，需要 '+money(quote.fee):'招募 '+p.name+' · '+money(quote.fee)}</button></article>`;
    }).join('')+(state.customRecruitCardUsed?'':`<article class="recruit-card custom-recruit-card"><button type="button" class="custom-slot-symbol" data-custom-create aria-label="建立自創藝人">＋</button><h3>自創藝人</h3><p>姓名、肖像、個性由你決定。基礎141＋自由21點；單項上限36，名氣0。</p><p>刷新或取消均保留此卡；首次簽下任何藝人後即轉普通候選；自創僅限第一位。簽約費沿用能力公式。</p><button data-custom-create ${state.artists.length>=state.capacity?'disabled':''}>${state.artists.length>=state.capacity?'公司已滿，請先擴充':'建立我的藝人'}</button></article>`);
  }
  function closeHeat(){document.body.classList.remove('heat-mode');$('heat-page').hidden=true;$('heat-page').innerHTML='';document.querySelector('[data-heat]').classList.remove('active');document.querySelector('[data-home]').classList.add('active');}
  function openHeat(){if($('workspace-dialog').open)closeWorkspace();document.body.classList.add('heat-mode');$('heat-page').hidden=false;window.StarWorksUI.renderHeat(state,DEMO);document.querySelector('[data-home]').classList.remove('active');document.querySelector('[data-heat]').classList.add('active');window.scrollTo(0,0);$('heat-title').focus({preventScroll:true});}
  const businessDialog=document.createElement('dialog');businessDialog.id='company-business-dialog';businessDialog.className='company-business-dialog';businessDialog.setAttribute('aria-labelledby','company-business-title');businessDialog.innerHTML='<header><div><small id="company-business-owner"></small><h2 id="company-business-title"></h2></div><button type="button" id="close-company-business" aria-label="關閉公司業務，返回大廳">關閉 ✕</button></header><details class="job-rules"><summary>公司業務說明</summary><p id="company-business-note"></p></details><div id="company-business-content"></div>';document.body.append(businessDialog);
  const businessSlots=new Map(['panel-artist-switch','pane-board','pane-opportunities'].map(id=>{const node=$(id),anchor=document.createComment('business-slot:'+id);node.before(anchor);return [id,anchor];}));
  function closeCompanyBusiness(){if(businessDialog.open)businessDialog.close();for(const [id,anchor]of businessSlots)if($(id).closest('#company-business-dialog'))anchor.after($(id));}
  function openCompanyBusiness(opener){
    const id=opener.dataset.company,c=StarCompanyRoutes.companies[id];if(!c)return;
    closeCompanyBusiness();$('workspace-dialog').close();window.StarWorkPreview.close();panelOpener=opener;activeRoom=null;activePanel=c.panel;businessDialog.dataset.company=id;
    $('company-business-title').textContent=c.name+' · '+c.business;$('company-business-owner').textContent=c.owner+' · 公司業務';$('company-business-note').textContent=c.note;
    const content=$('company-business-content');
    if(c.panel==='board'){boardCompany=id;filter=c.type;renderScene();renderOffers();$('panel-artist-switch').hidden=false;$('pane-board').hidden=false;content.append($('panel-artist-switch'),$('pane-board'));}
    else{opportunityCompany=id;renderEvents();$('pane-opportunities').hidden=false;content.append($('pane-opportunities'));}
    businessDialog.showModal();businessDialog.scrollTop=0;
  }
  function dismissCompanyBusiness(){pendingManualView=null;closeCompanyBusiness();panelOpener?.focus({preventScroll:true});}
  $('close-company-business').addEventListener('click',dismissCompanyBusiness);businessDialog.addEventListener('cancel',e=>{e.preventDefault();dismissCompanyBusiness();});

  function openPanel(panel, hint = '', opener = null) {
    closeCompanyBusiness();
    if (!Scene.PANELS[panel]) return;
    activePanel = panel;
    if(panel==='board'){boardCompany=opener?.dataset.company||null;if(boardCompany)filter=StarCompanyRoutes.companies[boardCompany].type;renderOffers();}
    if(panel==='opportunities'){opportunityCompany=opener?.dataset.company||null;renderEvents();}
    $('workspace-dialog').dataset.activePanel=panel;
    if (opener) panelOpener = opener;
    for (const name of Object.keys(Scene.PANELS)) $('pane-' + name).hidden = name !== panel;
    $('workspace-title').textContent = Scene.PANELS[panel];
    $('room-hint').textContent = hint || ({publicity:'抽到事件後，由你決定回應方式。結果與選擇會保留。',artist:'每個人都有自己的步調。看看近況，再決定下一步。',board:'先選夥伴，再親自安排工作。助理策略與服務請回小秘書開啟「助理設定／代排」。',assistant:'設定策略、訓練方向與服務。只開此頁或套用未啟用策略，不會啟用代排。',office:'公司營運與設備升級。通告及助理設定可從小秘書選單分別開啟。',rivals:'這座城市還有其他正在努力的人。認識兩家經紀公司與負責人。',journal:'把每一次努力，留在公司的日誌裡。',opportunities:'有些機會，值得親自做決定。',recruit:'六位原創藝人；首次簽約前保留自創入口，可免費刷新三次。公司從一人名額擴至三人。'})[panel];
    const company=StarCompanyRoutes.companies[opener?.dataset.company];
    if(company){$('workspace-title').textContent=company.name+' · '+company.business;$('room-hint').textContent=company.note;}
    $('panel-artist-switch').hidden = !['artist','board'].includes(panel);
    if (!$('workspace-dialog').open) $('workspace-dialog').showModal();
    $('workspace-dialog').scrollTop = 0;
  }
  function closeWorkspace() {
    closeCompanyBusiness();
    $('workspace-dialog').close();
    const target = $('workspace-dialog').dataset.activePanel==='publicity' ? document.querySelector('.secretary-npc .dynamic-visual')||document.querySelector('[data-home]') : panelOpener && document.contains(panelOpener) ? panelOpener : document.querySelector('[data-home]');
    target?.focus({preventScroll:true});
  }
  function renderSceneStatus() {
    $('scene-payroll').textContent = G.serviceActive(state) ? `${state.assistant.enabled?'一般代排':'長案管理中／計薪中'} · ${money(state.payroll.rate)}/分鐘 · 已付 ${money(state.payroll.paid)}` : '助理未啟用 · 不計薪';
    const services=G.serviceNames(state),charge=state.payroll.lastCharge;
    $('cash-service-detail').textContent=services.length?'計薪服務：'+services.join('、')+' · 全公司30/分鐘（每2秒扣1）':'全部助理服務已停止 · 不計薪';
    $('cash-last-charge').textContent=charge?`最近助理扣款 $${charge.amount} · ${charge.services} · ${new Date(charge.at).toLocaleTimeString('zh-TW')}`:'尚無本版助理扣款紀錄；學費等其他支出請看日誌。';
    $('board-service-detail').textContent=$('cash-service-detail').textContent;
    $('board-last-charge').textContent=$('cash-last-charge').textContent;
    document.querySelectorAll('[data-stop-services]').forEach(b=>b.disabled=!services.length);
    const warning = state.migrationNotice ? StarDisplayCopy.migration(state.migrationNotice) : !storageOK ? '目前無法自動存檔，請按頁首「匯出存檔」保留進度。' : state.payroll.stoppedAt !== null ? '助理因資金不足已停用；短行程會完成；長案保留進度，補足資金後請恢復管理。' : '';
    $('scene-warning').hidden = !warning; $('scene-warning').textContent = warning;
    const ideas=state.career.ideas.filter(i=>!['done','shelved','withdrawn'].includes(i.status)).length;
    $('scene-opportunity').hidden = !state.events.length&&!ideas;
    $('scene-opportunity').classList.toggle('has-invitations',state.events.length>0);
    $('scene-opportunity').dataset.pendingCount=state.events.length;
    $('scene-opportunity').textContent = `✉ ${state.events.length} 件重要邀約、${ideas} 件原創企劃，等你回覆`;
  }
  function renderScene() {
    const places = Scene.positions(state.artists);
    $('scene-actors').innerHTML = state.artists.map((a,i) => {
      const status=places[i];
      return `<button class="scene-actor ${a.color} ${a.id===selected?'selected':''}" data-scene-artist="${a.id}" data-location="${status.room}" style="left:${status.x}%;top:${status.y}%" aria-label="${esc(a.name)}，${status.short}，點選查看能力與行程"><span class="actor-bubble">${status.mood}</span>${portrait(a.id)}<span class="actor-name">${esc(a.name)}</span><span class="actor-status">${status.short}</span></button>`;
    }).join('');
    $('scene-team').innerHTML = state.artists.length?state.artists.map(a => `<button class="teammate ${a.color} ${a.id===selected?'selected':''}" data-scene-artist="${a.id}">${portrait(a.id)}<span><strong>${esc(a.name)}</strong><small>${a.debuted?a.role:'練習生'} · ${Scene.activity(a).short}${a.fatigue>=60?' · 需要休息':''}</small></span><span class="team-chevron">↗</span></button>`).join(''):emptyCompany('先尋找一位願意和你一起出發的人，再安排第一場練習或通告。');
    $('roster-count').textContent=`旗下 ${state.artists.length}/${state.capacity} 人`;
    $('next-step-action').dataset.panel=state.artists.length?'board':'recruit';$('next-step-action').textContent=state.artists.length?'去看看通告 →':'尋找第一位夥伴 →';
    $('panel-artist-switch').innerHTML = state.artists.map(a=>`<button data-switch-artist="${a.id}" class="${a.id===selected?'selected':''}" aria-pressed="${a.id===selected}">${esc(a.name)}</button>`).join('');
    $('scene-note').textContent = StarDisplayCopy.migration(state.log[0]?.text || '') || '工作室剛亮起燈。挑一個小小舞台，開始今天的故事。';
    const ready=state.artists.find(a=>!a.debuted&&!a.task&&!G.debutLocks(a).length);
    const tired=state.artists.find(a=>a.fatigue>=60);
    $('next-step').textContent = !state.artists.length?'公司剛成立，還沒有藝人。先去招募一位練習生吧，公司初始一人名額，可在招募藝人頁擴充。':ready ? `${ready.name}已準備好出道，請從小秘書的「旗下藝人」親自決定。` : tired ? `${tired.name}有點累了。到休息區，替他留一點喘息的時間吧。` : state.artists.every(a=>a.task) ? '大家都在為下一個舞台努力。你可以看看日誌，或預排接下來的行程。' : '點選一位夥伴，再到佈告欄挑份小通告；想先培育，也可以走進表演訓練室。';
    renderSceneStatus();
  }
  function statsRow(label, val, cls = '') { const cap = cls.includes('fatigue') ? 100 : G.STAT_CAP; return `<div class="skill-row ${cls}"><span>${label}</span><div class="meter"><i style="width:${val / cap * 100}%"></i></div><b>${val}<small>/${cap}</small></b></div>`; }
  function backgroundCard(a) {const p=window.StarPersonas?.[a.id];return p?`<section class="growth-background" data-background="${a.id}"><h4>成長背景</h4><p>${esc(p.backgroundSummary)}</p><details><summary>閱讀完整背景</summary>${p.background.split('\n\n').map(t=>`<p>${esc(t)}</p>`).join('')}</details></section>`:'';}
  function personaCard(a) {
    const p=window.StarPersonas?.[a.id];if(!p)return '';
    return `<section class="artist-persona" aria-label="${esc(a.name)}的介紹"><h4>認識${esc(a.name)}</h4><p>${esc(p.personality)}</p>${backgroundCard(a)}<dl><dt>目標</dt><dd>${esc(p.goal)}</dd><dt>說話方式</dt><dd>${esc(p.voice)}</dd></dl></section>`;
  }
  function renderArtists() {
    if(!state.artists.length){$('artists').innerHTML=emptyCompany('表演訓練室與聲音訓練室已準備好，招募第一位夥伴後就能開始培育。');return;}
    $('artists').innerHTML = state.artists.map((a, i) => {
      const t = a.task, info = t ? G.taskInfo(t) : null;
      const pct = t?.production?G.productionProgress(t,state.lastTick).percent:t ? Math.min(100, Math.max(0, (state.lastTick - t.started) / (t.ends - t.started) * 100)) : 0;
      const skill = trainChoices[a.id]||'sing', course = G.TRAINING[skill], locks = G.debutLocks(a), debutReady = !a.debuted && !locks.length && !a.task, preview = G.trainingPreview(a, skill);
      return `<article class="artist ${a.color} ${a.id === selected ? 'selected' : ''}" data-artist="${a.id}">
        <div class="portrait-area" data-select="${a.id}"><div class="artist-identity"><span class="artist-type">${a.debuted ? (a.role.replace(/新人$/,'藝人')) : '練習生 · ' + (a.role.replace(/新人$/,'藝人'))}</span>${StarSingingRanksUI.chips(state,a)}<h3>${esc(a.name)}</h3><p>${a.tag}</p></div>${portrait(a.id)}${a.id === selected ? '<span class="selection-dot">●</span>' : ''}</div>
        <div class="artist-body">${StarMusicChapterUI.card(state,a)}${StarFirstWorkUI.card(state,a)}<div class="trait">✦ ${esc(StarDisplayCopy.trait(a.trait))}</div>${personaCard(a)}
        <div class="ability-grid">${Object.entries(G.SKILLS).map(([k, label]) => statsRow(label, a[k])).join('')}</div>
        <div class="artist-mini"><b>名氣 ${a.fame.toLocaleString()}/999 · 粉絲 ${(state.fansByArtist[a.id]||0).toLocaleString()}</b><span>${a.debuted ? '正式出道' : '培育中 · 出道由你決定'}</span></div>
        ${statsRow('疲勞', a.fatigue, 'fatigue ' + (a.fatigue >= 70 ? 'high' : ''))}
        <div class="debut-box">${a.debuted ? '✦ 已出道 · 能力與名氣仍須符合各通告門檻' : `<span>${locks.length ? '出道還需：' + locks.join('、') : a.task?'已達門檻，請等目前行程完成後再宣布出道。':'已達出道門檻！請親自決定下一步。'}</span><button data-debut="${a.id}" class="${debutReady?'debut-ready':''}" ${debutReady?'':'disabled'}>宣布出道${debutReady?' <span class="debut-ready-label">可出道</span>':''}</button>`}</div>
        <div class="task-box"><div class="task-top"><b>${info ? esc(info.label) : a.project?'○ 無短行程 · 長案待製作':'○ 目前空閒'}</b><span data-countdown="${a.id}">${t ? G.taskCountdown(t,state.lastTick) : '可安排行程'}</span>${t?.production?`<button data-production-rest="${a.id}" ${t.production.rest?'disabled':''}>休息5秒後續作</button>`:''}${t ? `<button class="text-button" data-cancel="${a.id}" aria-label="取消${esc(a.name)}目前行程">取消</button>` : ''}</div><div class="task-progress"><i data-progress="${a.id}" style="width:${pct}%"></i></div></div>
        ${window.StarDevelopmentUI.progress(a)}${window.StarProjectUI.card(a,state)}<div class="training-picker"><label for="training-${a.id}">培育課程</label><select id="training-${a.id}" data-training="${a.id}">${Object.entries(G.SKILLS).map(([k, label]) => `<option value="${k}" ${k === skill ? 'selected' : ''}>${label}訓練</option>`).join('')}</select><small>${G.SKILLS[skill]}基礎 +${preview.min}–${preview.gain} · ${money(course.cost)} · 疲勞 +${G.fatigueCost(a, course)} · 5 秒<br>才智 ${a.intellect}（提高高點機率） · 效率 ${preview.efficiency * 100}% · ${preview.failureChance * 100}% 訓練失敗率（當次零成長）${a.fatigue >= 60 ? '<br>建議先休息；失敗仍扣費並增加疲勞。' : ''}</small></div>
        <div class="artist-actions"><button data-action="${skill}" data-id="${a.id}" ${a[skill] >= G.STAT_CAP ? 'disabled' : ''}>${a[skill] >= G.STAT_CAP ? '能力已滿' : '安排訓練'}</button><button data-action="rest" data-id="${a.id}">休息 −45 / 5 秒</button></div>
        <div class="queue">${a.queue.length ? a.queue.map((q, n) => `<div><span>${n + 1}. ${G.actionInfo(q).label}</span><button class="text-button" data-remove="${a.id}" data-index="${n}" aria-label="移除待辦${n + 1}">移除</button></div>`).join('') : '待辦 0 / 3 · 可預排接下來的行程'}</div><button data-company-release="${a.id}">辦理解約 · 原簽約金的50%</button><button class="select-artist" data-select="${a.id}">${a.id === selected ? '✓ 已選擇 · 為他安排行程' : '選擇藝人 →'}</button></div></article>`;
    }).join('');
  }
  function renderOffers() {
    document.querySelector('.board-toolbar .tabs').hidden=!!boardCompany;
    const a = state.artists.find(x => x.id === selected);
    if(!a){$('selected-label').textContent='尚無藝人可安排';$('offers').innerHTML=emptyCompany('招募後才能承接通告。新人也有低門檻小廣告與臨演可做。');return;}
    $('selected-label').textContent = '安排給 ' + a.name;
    $('offers').innerHTML = G.JOBS.filter(j => boardCompany ? StarCompanyRoutes.jobCompany(j.id)===boardCompany : filter === 'all' || j.type === filter).map(j => {
      const musicOffer=G.MUSIC.get(state,j.id);
      const locks = G.jobLocks(a, j), tooLow = locks.length > 0;
      const duplicate = (j.productionDays && !!a.project) || a.task?.action.id === j.id || a.queue.some(q => q.id === j.id);
      const fatigued = !j.productionDays && !a.task && a.fatigue + G.fatigueCost(a, j) > 100;
      const full = a.queue.length >= 3;
      const requirements = window.StarQualificationUI.job(a,j);
      const shortFame=G.shortFamePreview(a,j), rewardArtist=j.productionDays?{...a,fatigue:0}:a, longFame=G.longFamePreview(rewardArtist,j), durationSeconds=Math.round(j.duration);
      return `<article class="offer"><div class="offer-top"><span class="type-tag type-${j.type}">${G.TYPES[j.type]}</span><small>${j.productionDays?'長案 · '+j.productionDays+'日':'短案 · '+j.duration+'秒'}</small></div><h3>${musicOffer?'《'+esc(musicOffer.title)+'》':j.name}</h3>${musicOffer?'<small>'+esc(j.name)+'</small>':''}<p class="booking-assignee">派給 <b>${esc(a.name)}</b></p><div class="requirement">條件：${requirements}</div><div class="offer-details"><strong>報酬 ${money(G.payout(rewardArtist,j))}</strong><span>費用：${j.productionDays?'管理薪資約 '+money(Math.ceil(j.duration/60*G.SALARY_RATE)):'親自安排無費用'}</span><span>名氣 +${shortFame?shortFame.amount:longFame?longFame.gain:G.fameGain(rewardArtist,j)}</span><span>疲勞 +${G.fatigueCost(a,j)}</span></div><div class="unlock-reason ${tooLow?'locked':''}">${tooLow?'尚未符合：'+locks.join('；'):'已符合門檻'}</div><p class="booking-condition">${duplicate?'已有同案或進行中長案。':full?'待辦已滿。':fatigued?'疲勞太高，請先休息。':a.task?'目前忙碌，接受後加入待辦。':''}</p>${!j.productionDays&&G.isSetback(a,j)?'<p class="risk-note">疲勞失誤：報酬80%、名氣50%（已反映），自信 −'+G.confidenceLoss(a)+'</p>':''}<button data-job="${j.id}" ${musicOffer?'data-offer-id="'+musicOffer.id+'"':''} ${tooLow||duplicate||fatigued||full?'disabled':''}>${tooLow?'尚未符合門檻':duplicate?'已在行程中':fatigued?'請先休息':full?'待辦已滿':a.task?'加入待辦 ＋':j.productionDays?'接受長案並啟用管理':'安排行程'}</button><details class="job-rules" data-job-rules="${j.id}"><summary>工作說明與結算規則</summary><p>${j.desc}</p><p>公司知名度 +${G.REPUTATION_GAIN[j.id]}。${j.productionDays?'約 '+Math.floor(durationSeconds/60)+' 分 '+durationSeconds%60+' 秒；整案交付才結算報酬。接受時鎖定報酬與名氣，可暫停管理改親自製作。':'成長只增加'+G.SKILLS[j.skill]+'，基礎 +1–'+G.growthMax(j)+'；離線現金實收70%。'}</p>${shortFame?'<p>名氣按階段累積，本次入帳 +'+shortFame.gain+'；不足1點保存。</p>':''}<p>報酬已含藝人條件，未扣助理薪資；公司共用 ${money(G.SALARY_RATE)}/分鐘。手排待辦優先，實際結果依執行時狀態。</p></details></article>`;
    }).join('');
  }
  let eventKey = '';
  function renderEvents(){window.StarCareerUI.render(state,opportunityCompany);}
  function renderCompany() {
    window.StarCompany?.render({state,portrait,recruitmentPortrait,backgroundCard,selectArtist:id=>{selected=id;},refresh:()=>{const r=mutate(()=>G.rerollCandidates(state));if(r)toast(r.ok?'候選名單已更新，剩 '+state.refreshRemaining+' 次免費刷新。':r.reason);},
      release:id=>{if(!sync())return;const q=G.releaseQuote(state,id);if(!q)return;if(q.busy){toast('請等目前活動與長案完成，或先取消長案合約再辦理解約。');return;}if(state.cash<q.fee){toast('資金不足以支付解約金。');return;}if(confirm(`${q.name}：確定解約？\n簽約費 $${q.base} × ${q.ratio*100}% = 解約金 $${q.fee}（初版預設比例）。\n解約會清除培養能力、名氣、出道與待辦；公司知名度永久保留；旗下藝人合計名氣會移除這位藝人的數值。再次成為候選並簽約時，從初始能力開始。`)){const r=mutate(()=>G.release(state,id));if(r?.ok){window.StarDynamic?.forget(id);toast('已辦理解約，名額已釋出。');}else if(r)toast(r.reason);}},
      recruit:(id,done)=>{const r=mutate(()=>{const v=G.recruit(state,id);if(v.ok){selected=id;done(id);}return v;});if(r)toast(r.ok?'新夥伴加入了！點圖中入口去練習或錄音。':r.reason);},
      action:(id,action)=>{window.StarDynamic?.clearReactions();const r=mutate(()=>G.enqueue(state,id,action));if(r)toast(r.ok?'行程開始，留在房間看進度吧。':r.reason);},
      cancel:id=>{mutate(()=>G.cancel(state,id));toast('已取消目前行程；訓練費依原規則退回。');},
      assistant:enabled=>{mutate(()=>G.setAssistant(state,enabled,selected));populateSettings();},
      mode:(id,mode)=>{mutate(()=>G.setArtistStrategy(state,id,{mode}));populateSettings();}
    });
  }
  let assistantTarget=null;
  function targetArtist(){return state.artists.find(a=>a.id===assistantTarget);}
  function targetStrategy(){return G.effectiveStrategy(state,targetArtist());}
  function saveTargetStrategy(input){return G.setArtistStrategy(state,assistantTarget,input);}
  function renderAssistantRoster(){
    $('assistant-enabled-roster').innerHTML=state.artists.map(a=>`<label class="assistant-artist-toggle"><input type="checkbox" data-assistant-enabled="${a.id}" ${a.assistantEnabled?'checked':''}><span><b>${esc(a.name)}</b><small>${a.assistantEnabled?'代排啟用':'親自安排'}${a.project?.assisted?' · 長案管理另已啟用':''}</small></span></label>`).join('')||'<p>請先招募藝人。</p>';
    $('assistant-toggle-status').textContent=G.serviceActive(state)?'計薪中 · '+G.serviceNames(state).join('、'):'全部服務關閉 · 不計薪';
    $('assistant-toggle-status').dataset.enabled=String(G.serviceActive(state));
    $('assistant-roster-note').textContent='只勾選要代排的藝人；新夥伴預設關閉。薪資全公司只計一份。';
  }
  function renderStrategyTarget(){
    if(!targetArtist())assistantTarget=state.artists[0]?.id||null;
    const select=$('assistant-target'),options=state.artists.length?state.artists.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join(''):'<option value="">請先招募藝人</option>';
    if(select.innerHTML!==options)select.innerHTML=options;select.value=assistantTarget||'';select.disabled=!state.artists.length;
    const a=targetArtist(),c=targetStrategy();
    $('assistant-target-note').textContent=a?`正在編輯：${a.name}。只修改這位藝人的策略，不影響其他夥伴。`:'請先招募一位藝人，再設定他的代排行程。';
    $('minimum-pay-status').textContent=(a?a.name:'尚無藝人')+' · 已儲存最低報酬：'+(c.minPay===0?'不限（$0）':money(c.minPay)+'；低於門檻不代接');
    $('minimum-pay-unlimited').disabled=!a||c.minPay===0;
    for(const el of $('assistant-form').querySelectorAll('input,select,button'))el.disabled=!a;
    const next=a?G.ROTATION.next(state,a):null;$('training-rotation-status').textContent=a?(next?'下一堂：'+(next==='speech'?'聲音表現（口才）':G.SKILLS[next]+'訓練'):'所選課程皆已滿級，需訓練時改為休息。'):'請先招募藝人。';
  }
  function renderSignature(){return state.artists.map(a => [a.task?.started, a.task?.action.kind, a.task?.production?.rest?.ends, a.project?.done,a.project?.assisted,a.project?.nextAt,a.assistantEnabled,a.fame, a.fatigue, ...Object.keys(G.SKILLS).map(k => a[k])].join(',')).join('|') + ':' + state.assistant.enabled+':'+state.works.length+':'+Object.values(state.fansByArtist).join(',')+':'+state.works.reduce((n,w)=>n+w.settled,0)+':'+state.events.map(e=>e.id).join(',')+':'+(state.publicity.pending?.id||'');}
  function render() {
    G.CHAPTER.scan(state);
    window.StarDevelopmentUI.render(state);
    $('assistant-projects').innerHTML='<h3>進行中的長案管理</h3>'+(state.artists.filter(a=>a.project).map(a=>window.StarProjectUI.card(a,state)).join('')||'<p>目前沒有進行中的長案。</p>');
    if(!state.artists.some(a=>a.id===selected))selected=state.artists[0]?.id||null;
    const fame = state.artists.reduce((n, a) => n + a.fame, 0);
    $('cash').textContent = money(state.cash); $('fame').innerHTML = fame.toLocaleString() + ' <em>名氣</em>';
    $('jobs').innerHTML = state.totalJobs.toLocaleString() + ' <em>場</em>'; $('earnings').textContent = '累積收入 ' + money(state.totalEarned);
    $('assistant-state').textContent = state.assistant.enabled ? '一般代排中' : G.serviceActive(state)?'長案管理中／計薪中':'親自帶班';
    renderAssistantRoster();
    renderStrategyTarget();
    const diagnostic=$('assistant-diagnostics'),openDiagnostics=new Set([...$('assistant-diagnostics').querySelectorAll('article:has(details[open])')].map(e=>e.dataset.id));
    diagnostic.innerHTML=state.artists.map(a=>{const d=window.StarAssistantStatus.inspect(G,state,a);return `<article data-id="${a.id}"><strong>${esc(a.name)} · 獨立策略</strong><p>${esc(d.current)}</p><p>${esc(d.plan)}</p>${d.queue||d.project?'<small>玩家待辦與既有長案製作優先；以下為目前能力、疲勞與報酬條件預覽。</small>':'<small>以下以目前狀態預覽，完成活動後會依新狀態重新判斷。</small>'}<details ${openDiagnostics.has(a.id)?'open':''}><summary>查看各通告資格與報酬</summary><ul>${d.offers.map(o=>`<li><b>${esc(o.name)}</b>：${esc(o.reasons.length?o.reasons.join('；'):'符合條件 · 預估 $'+o.pay)}</li>`).join('')}</ul></details></article>`;}).join('');
    $('payroll-status').textContent = `目前 ${money(state.payroll.rate)}/分鐘 · 累計支出 ${money(state.payroll.paid)} · 值班 ${Math.floor(state.payroll.activeMs / 1000)} 秒${state.payroll.stoppedAt !== null ? ' · 資金不足，已停止代排' : ''}`;
    $('assistant-caption').textContent = state.assistant.enabled ? '依策略自動安排 · 離線上限 4 小時' : G.serviceActive(state)?'長案管理仍在計薪；可於藝人卡暫停':'助理服務未啟用 · 不計薪';
    $('office-reputation').textContent='公司知名度 '+state.companyReputation+'（永久累積，解約不扣回）';
    $('company-reputation').textContent='公司知名度 '+state.companyReputation+' · 永久累積';
    $('phase').textContent = fame >= 600 ? '閃耀經紀公司' : fame >= 240 ? '城市新聲' : fame >= 90 ? '嶄露頭角' : '新芽工作室';
    $('goal').textContent = fame >= 600 ? '切片目標達成！繼續打造你們的故事' : fame >= 240 ? `旗下藝人合計名氣 ${fame} / 600，朝閃耀經紀公司前進` : fame >= 90 ? `旗下藝人合計名氣 ${fame} / 240；重要邀約另看個人資格` : `旗下藝人合計名氣 ${fame} / 90；重要邀約另看個人資格`;
    const focused = document.activeElement;
    const focusId = focused?.id;
    const focusData = focused?.dataset ? Object.entries(focused.dataset).find(([k]) => ['job', 'action', 'select', 'cancel', 'remove', 'debut'].includes(k)) : null;
    const focusArtist = focused?.dataset?.id;
    window.StarPublicityUI.render(state);window.StarWorksUI.render(state,DEMO);window.StarWorksUI.renderHeat(state,DEMO);renderArtists(); renderOffers(); renderEvents(); renderScene(); renderRecruitment(); renderCompany();
    if (focused && !document.contains(focused)) {
      const replacement = focusId ? $(focusId) : focusData ? [...document.querySelectorAll('[data-' + focusData[0] + ']')].find(el => el.dataset[focusData[0]] === focusData[1] && (!focusArtist || el.dataset.id === focusArtist)) : null;
      replacement?.focus({ preventScroll: true });
    }
    $('logs').innerHTML = state.log.length ? state.log.slice(0, 12).map(l => `<div class="log-row"><time>${new Date(l.at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}</time><span>${esc(StarDisplayCopy.migration(l.text))}</span></div>`).join('') : '<div class="empty-log">工作室剛亮起燈。先選一位藝人，接下第一場通告吧。</div>';
    lastSignature=renderSignature();
  }
  function populateSettings() {
    renderStrategyTarget();const c = targetStrategy();
    $('priority').value = c.priority.join(','); StarMoney.fillInput($('min-pay'),c.minPay);
    $('assistant-mode').value=c.mode;
    $('salary-rate').textContent = '$30 / 每 60 秒服務時間 · 初版薪資';
    if (![...$('max-fatigue').options].some(o => +o.value === c.maxFatigue)) $('max-fatigue').add(new Option(String(c.maxFatigue), String(c.maxFatigue)));
    $('max-fatigue').value = String(c.maxFatigue); $('fallback').value = c.fallback; for(const el of document.querySelectorAll('[data-train-skill]'))el.checked=G.trainingSelection(state,targetArtist()).skills.includes(el.value);
  }
  function showReport(r) {
    // An auto-saved, never-staffed company has no work to report. Keep settlement intact.
    if(!state.hasEverSigned&&!state.artists.length&&!state.works.length&&!state.totalJobs&&!state.totalEarned&&!state.payroll.paid&&!state.events.length&&!state.publicity.pending&&!state.career.ideas.length&&!state.career.completedWorks?.length)return;
    const pending=r.pending||{publicity:state.publicity.pending?1:0,invitations:state.events.length,originals:state.career.ideas.filter(i=>['pending','revision','ready'].includes(i.status)).length},cost=r.trainingCosts??Math.max(0,r.earned+(r.playbackEarned||0)-(r.salary||0)-r.net);
    modal(`<div class="eyebrow">WELCOME BACK, MANAGER</div><h2>這段時間，公司做了什麼？</h2><p>結算 ${Math.floor(r.simulated/60000)} 分 ${Math.floor(r.simulated/1000)%60} 秒${r.capped?'；超過4小時未計入':''}。日常依原有安排與服務設定推進，待決事項沒有代選。</p>
    <section class="return-section"><h3>等你決定</h3><p data-report-pending>公關 ${pending.publicity} 件 · 重要邀約 ${pending.invitations} 件 · 原創企劃 ${pending.originals} 件</p><small>待決事項不阻擋無關日常。原創修改中的企劃仍依原時程等待。</small><div class="return-actions">${pending.publicity?'<button data-report-panel="publicity">查看公關</button>':''}${pending.invitations||pending.originals?'<button data-report-panel="opportunities">查看邀約／原創企劃</button>':''}</div></section>
    <div class="report-grid"><div><span>現金淨變動</span><strong data-report-net>${r.net>=0?'+':'−'}${money(Math.abs(r.net))}</strong></div><div><span>完成通告</span><strong data-report-jobs>${r.jobs} 次</strong></div><div><span>休息次數</span><strong data-report-rests>${r.rests} 次</strong></div><div><span>助理支出</span><strong data-report-salary>${money(r.salary||0)}</strong></div></div>
    ${state.payroll.stoppedAt!==null?'<p data-report-stopped>資金不足，全部助理服務已停用；補足後請手動重啟。</p>':''}
    <details class="return-section report-cost-details"><summary>收入與成本明細</summary><p data-report-ledger>通告收入 ${money(r.earned)} ＋ 播放收益 ${money(r.playbackEarned||0)} − 本段訓練等費用 ${money(cost)} − 助理薪資 ${money(r.salary||0)} ＝ 淨變動 ${r.net>=0?'+':'−'}${money(Math.abs(r.net))}</p><small>只計這段時間發生的收支；離開前已付學費不會重算。${state.payroll.stoppedAt!==null?'資金不足，全部助理服務已停用；補足後由你手動重啟。':''}</small></details>
    <section class="return-section"><h3>能力與練習</h3><p>訓練 ${r.training} 次（失敗 ${r.failedTraining||0} 次）· 個人名氣 +${r.fame} · 公司知名度 +${r.reputation||0}</p><div data-report-growth>${(r.artistGrowth||[]).map(a=>`<p><b>${esc(a.name)}</b><br>${a.skills.map(x=>`${G.SKILLS[x.key]} +${x.gain}；下點累積 ${(x.before*100).toFixed(1)}% → ${(x.after*100).toFixed(1)}%`).join('<br>')}</p>`).join('')||'<p>本段沒有能力或累積進度變動。</p>'}</div><small>下點累積轉為整數能力後會歸零；未滿一點的進度仍已保存。</small></section>


    <details><summary>離線收益規則與明細</summary><p>離線短案收入70%：${r.shortJobs||0} 件，含藝人條件原額 ${money(r.shortGross||0)} → 實收 ${money(r.shortEarned||0)}，減額 ${money(r.shortDiscount||0)}。每案只折一次並四捨五入；長作品報酬、成長、粉絲與熱度不折。離線上限4小時。</p></details>`);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('button,[data-select]'); if (!b || b.disabled || stopped) return;
    if(b.dataset.idea){const r=mutate(()=>G.originalChoice(state,b.dataset.idea,b.dataset.ideaChoice));if(r)toast(r.ok?'企劃決定已記錄。':r.reason);return;}
    if(b.dataset.compose){const r=mutate(()=>G.enqueue(state,b.dataset.composer,{kind:'compose',ideaId:b.dataset.compose}));if(r)toast(r.ok?'創作準備開始。':r.reason);return;}
    if(b.hasAttribute('data-first-story-open')){const id=b.dataset.firstStoryOpen;openPanel('artist','',b);const card=document.querySelector(`[data-first-story="${id}"]`);if(card){card.open=true;card.scrollIntoView({block:'center'});}return;}
    if(b.hasAttribute('data-music-story')){const id=b.dataset.musicStory||G.CHAPTER.pending(state)?.artist.id;if(id)window.StarMusicChapterUI.open(state,id,mutate);return;}
    if(b.dataset.firstStoryChoice){b.disabled=true;const r=mutate(()=>G.FIRST_STORY.resolve(state,b.dataset.firstStoryId,b.dataset.firstStoryChoice));if(r&&!r.ok)toast(r.reason);return;}
    if(b.hasAttribute('data-custom-create')){closeHeat();closeWorkspace();window.StarCustomUI.open({state:()=>state,confirm:d=>{const r=mutate(()=>{const result=G.createCustom(state,d);if(result.ok){selected=result.id;trainChoices[result.id]='sing';}return result;});if(r?.ok)toast('自創藝人已簽約加入，可開始安排培育。');return r;}});return;}
    if(b.hasAttribute('data-secretary-menu')){closeHeat();closeWorkspace();document.querySelector('[data-location=home]').click();window.StarCompany.openAssistant();return;}
    if(b.dataset.reportPanel){$('modal').close();state.report=null;persist();openPanel(b.dataset.reportPanel);return;}
    if(b.dataset.originalNameSave||b.dataset.originalLaunch){const id=b.dataset.originalNameSave||b.dataset.originalLaunch,value=b.closest('article').querySelector('[data-original-title]')?.value;const r=mutate(()=>{const result=b.dataset.originalLaunch?G.launchOriginal(state,id,value):G.renameOriginal(state,id,value);if(result.ok)StarCareerUI.clearDraft(id);return result;});if(r)toast(r.ok?(b.dataset.originalLaunch?'原創單曲開始四天製作，歌名已鎖定。':'歌名已儲存。'):r.reason);return;}
    if(b.dataset.equipment){const r=mutate(()=>G.buyEquipment(state,b.dataset.equipment,Number(b.dataset.level)));if(r)toast(r.ok?'設備升級完成，已付款 $'+r.fee:r.reason);return;}
    if(b.hasAttribute('data-stop-services')){mutate(()=>G.stopServices(state));toast('全部助理服務已停止；長案進度保留，親自安排不計薪。');return;}
    if(b.dataset.publicityId){const r=mutate(()=>G.resolvePublicity(state,b.dataset.publicityId,b.dataset.publicityChoice));if(r)toast(r.ok?r.text+' '+StarPublicityUI.result(r):r.reason);return;}
    if(b.dataset.projectManage){const result=mutate(()=>G.manageProject(state,b.dataset.projectManage,b.dataset.enable==='true'));if(result)toast(result.ok?(b.dataset.enable==='true'?'長案管理已恢復，與其他服務共用公司30/分鐘薪時計。':'這件長案管理已暫停；進度保留，其他服務是否計薪請看資金欄。'):result.reason);return;}
    if(b.dataset.projectWork){const result=mutate(()=>G.workProject(state,b.dataset.projectWork));if(result){if(result.ok)showManualWork(b.dataset.projectWork);else toast(result.reason);}return;}
    if(b.dataset.projectCancel){if(confirm('確認取消整件長案？已完成製作日不支付部分報酬；短案收入與能力保留。'))mutate(()=>G.cancelProject(state,b.dataset.projectCancel));return;}
    if(b.dataset.productionRest){mutate(()=>G.restProduction(state,b.dataset.productionRest));return;}
    if(b.id==='career-backup'||b.id==='equipment-backup'){const raw=localStorage.getItem(b.id==='equipment-backup'?EQUIPMENT_BACKUP:CAREER_BACKUP);if(raw){const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([raw],{type:'application/json'}));link.download=b.id==='equipment-backup'?'starlane-before-v0121.json':'starlane-before-v0120.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);}return;}
    if(b.id==='daily-backup'||b.id==='salary-backup'||b.id==='five-backup'){const raw=localStorage.getItem(b.id==='daily-backup'?DAILY_BACKUP:b.id==='five-backup'?FIVE_BACKUP:SALARY_BACKUP);if(raw){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([raw],{type:'application/json'}));a.download=b.id==='daily-backup'?'starlane-before-v0110.json':b.id==='five-backup'?'starlane-before-v0113.json':'starlane-before-v0112.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}return;}
    if(b.hasAttribute('data-heat')){openHeat();return;}
    if(b.dataset.heatPage!==undefined){window.StarWorksUI.setHeatPage(b.dataset.heatPage);window.StarWorksUI.renderHeat(state,DEMO);return;}
    if(b.dataset.workPage!==undefined){window.StarWorksUI.setPage(Number(b.dataset.workPage));window.StarWorksUI.render(state,DEMO);return;}
    if(b.dataset.expand){if(performance.now()<expansionCooldownUntil)return;const target=Number(b.dataset.expand),q=G.expansionQuote(state);if(q?.ok&&q.target===target&&confirm(`確認支付 $${q.fee}，將公司名額擴充至 ${target} 人？`)){const result=mutate(()=>G.expand(state,target));if(result){if(result.ok)expansionCooldownUntil=performance.now()+600;toast(result.ok?'工作室擴充完成！':result.reason);}}return;}
    if(b.dataset.demo&&DEMO){
      if(b.dataset.demo==='reset'){if(confirm('只重設獨立體驗，不影響正式進度？')){state=newExperience();window.StarDynamic?.clearReactions();persist();render();}return;}
      const result=mutate(()=>{const a=state.artists[0];if(['music','drama','ad'].includes(b.dataset.demo)){if(!a)return {ok:false,reason:'請先建立體驗藝人'};const id={music:'radio',drama:'series',ad:'cover'}[b.dataset.demo],job=G.JOBS.find(j=>j.id===id);a.debuted=true;a.fame=Math.max(a.fame,job.fameMin);for(const [k,v]of Object.entries(job.requirements))a[k]=Math.max(a[k],v);a.fatigue=0;return G.enqueue(state,a.id,{kind:'job',id});}
        const ms=b.dataset.demo==='stage'?G.WORKS.CONFIG.stageMs:b.dataset.demo==='offline'?24*3600000:a?.project?Math.max(1,a.project.nextAt+(a.project.days-a.project.done-1)*G.WORKS.CONFIG.stageMs+a.project.segmentMs-state.lastTick)+15000:a?.task?Math.max(0,a.task.ends-state.lastTick):0;
        if(!ms)return {ok:false,reason:'先安排一支廣告或其他行程'};
        const report=G.advance(state,state.lastTick+ms,true);return {ok:true,report};});
      if(result?.report)showReport(result.report);else if(result)toast(result.ok?'錄製／拍攝已安排，按「完成目前行程」推出作品。':result.reason);return;
    }
    if(b.dataset.companyBusiness){openCompanyBusiness(b);return;}
    if (b.dataset.home !== undefined) {closeHeat();closeWorkspace();}
    if (b.dataset.panel) { if(b.closest('.sidebar'))closeHeat();activeRoom=null; openPanel(b.dataset.panel, '', b); if(b.hasAttribute('data-assistant-focus'))$('assistant').scrollIntoView({block:'start'}); }
    if (b.dataset.room) { const room=Scene.ROOMS[b.dataset.room]; if(room) { activeRoom=b.dataset.room; if(room.skill) trainChoices[selected]=room.skill; render(); openPanel(room.panel,room.hint,b); } }
    if (b.dataset.sceneArtist) { activeRoom=null; selected=b.dataset.sceneArtist; render(); openPanel('artist','',b); }
    if (b.dataset.switchArtist) { selected=b.dataset.switchArtist; if(activeRoom&&Scene.ROOMS[activeRoom].skill)trainChoices[selected]=Scene.ROOMS[activeRoom].skill; render(); }
    if (b.dataset.recruit) { const r=mutate(()=>{const result=G.recruit(state,b.dataset.recruit);if(result.ok)selected=b.dataset.recruit;return result;});if(r)toast(r.ok?'新夥伴加入了！可點肖像打招呼，或找小秘書安排行程。':r.reason); }
    if (b.dataset.select) { selected = b.dataset.select; render(); }
    if (b.dataset.filter) { filter = b.dataset.filter; document.querySelectorAll('[data-filter]').forEach(x => x.classList.toggle('selected', x === b)); renderOffers(); }
    if (b.dataset.job || b.dataset.action) {
      const id = b.dataset.id || selected;
      const action = b.dataset.job ? { kind: 'job', id: b.dataset.job, ...(b.dataset.offerId?{offerId:b.dataset.offerId}:{}) } : b.dataset.action === 'rest' ? { kind: 'rest' } : { kind: 'train', skill: b.dataset.action };
      const result = mutate(() => G.enqueue(state, id, action)); if (result) {toast(result.ok ? '行程安排完成' : result.reason);if(result.ok)followManualBooking(id,action);}
    }
    if (b.dataset.cancel) { mutate(() => G.cancel(state, b.dataset.cancel)); toast('已取消。助理開啟時，下一秒會重新代排。'); }
    if (b.dataset.remove) { mutate(() => G.removeQueue(state, b.dataset.remove, Number(b.dataset.index))); toast('已移除待辦'); }
    if (b.dataset.debut && confirm('確定讓這位練習生正式出道？這個選擇不會由助理代做。')) { const r = mutate(() => G.debut(state, b.dataset.debut)); if(r?.ok)window.StarDebutUI.show(state.artists.find(a=>a.id===b.dataset.debut),recruitmentPortrait);else if(r)toast(r.reason); }
    if (b.dataset.accept) { const id = b.dataset.accept, artist = $('event-' + id).value; const r = mutate(() => G.decide(state, id, artist, true)); if (r) {toast(r.ok ? '邀約已接受，期待新的代表作！' : r.reason);if(r.ok&&opportunityCompany==='global')showManualWork(artist);} }
    if (b.dataset.decline && confirm('確定婉拒？五分鐘後可能同名同人加價重邀，最多加價50%。')) mutate(() => G.decide(state, b.dataset.decline, null, false));
  });
  $('assistant-target').addEventListener('change',()=>{assistantTarget=$('assistant-target').value;populateSettings();$('strategy-status').textContent='已切換編輯對象，尚未套用新的修改。';});
  $('minimum-pay-unlimited').addEventListener('click',()=>{const ok=mutate(()=>saveTargetStrategy({...targetStrategy(),minPay:0}));if(ok){$('min-pay').value=0;$('strategy-status').textContent='最低報酬已儲存為不限（$0）。目前活動完成後，依原策略重新挑選通告。';toast('已套用不限報酬；目前活動照常完成');}});
  $('assistant-form').addEventListener('input',()=>{$('strategy-status').textContent='策略變更尚未套用。上方開關是已儲存的服務狀態；請按套用儲存策略。';});
  $('assistant-form').addEventListener('submit', e => {
    e.preventDefault();
    if(!targetArtist())return;
    const trainSkills=[...document.querySelectorAll('[data-train-skill]:checked')].map(el=>el.value);if(!trainSkills.length){$('strategy-status').textContent='請至少勾選一門課程；已儲存的策略保持不變。';toast('請至少勾選一門課程。');return;}
    const minPay=StarMoney.parseInput($('min-pay'));if(minPay===null){toast('請輸入 NT$0 到 NT$3,000,000 的最低報酬。');return;}
    mutate(() => saveTargetStrategy({ mode: $('assistant-mode').value, priority: $('priority').value.split(','), minPay, maxFatigue: +$('max-fatigue').value, fallback: $('fallback').value, trainSkills }));
    $('strategy-status').textContent = '策略已儲存。目前活動完成後會用新策略；不取消已付費訓練或既有長案。請看上方逐人接案診斷。'; toast(targetArtist().name+'的助理策略已套用');
  });
  $('close-workspace').addEventListener('click', closeWorkspace);
  $('workspace-dialog').addEventListener('cancel', e => { e.preventDefault(); closeWorkspace(); });
  $('assistant-enabled-roster').addEventListener('change',e=>{const id=e.target.dataset.assistantEnabled;if(!id)return;const a=state.artists.find(a=>a.id===id);if(!a)return;const enabled=e.target.checked;mutate(()=>G.setAssistant(state,enabled,id));toast(enabled?(a.assistantEnabled?a.name+'的代排已啟用；公司共用薪資 '+money(state.payroll.rate)+'/分鐘':'資金不足，未啟用'):a.name+'的代排已關閉；目前行程與手排待辦保留');});
  $('close-modal').addEventListener('click', () => { $('modal').close(); state.report = null; persist(); });
  $('help')?.addEventListener('click', () => modal('<div class="eyebrow">THE FIRST DAY AT STARLANE</div><h2>從練習生，走向第一個舞台。</h2><p>新公司從 0 人開始。先按「尋找／招募藝人」，從本次出現的兩位候選人選一位（依卡片確定報價簽約、公司初始 1 人名額，可擴至 3 人），再接「街角品牌企劃」或「巷口短篇劇」，5 秒後拿到收入與名氣。再選培育課程，補足出道與通告門檻。</p><ul><li>簽約金採初始九項能力平均與最高值計算，卡片顯示確定報價；已簽藝人保留實付金額，解約支付原實付的 50%。這是初版平衡設計。</li><li>九項能力為演技、歌藝、口才、儀態、動感、體能、才智、自信、名氣。前八項可訓練；名氣由工作累積。疲勞是獨立狀態。</li><li>每則通告所有門檻都必須達標。畫面列出目前值與差距；手動、待辦與助理共用同一檢查。</li><li>出道需名氣 30、儀態 34、自信 34，以及演技／歌藝／口才／動感任一 45。空閒時由你宣布，助理不代做。</li><li>單曲製作4日、單元劇7日、封面2日（初版）；1日約43秒，每5秒更新進度，整件完成才付一次報酬並啟動7日熱度。製作中可休息5秒自動續作；取消不保留進度。普通小通告維持5秒。訓練 5 秒，每次 $80–100、疲勞 +8–12。每次僅指定能力隨機 +1–3；才智提高抽到高點的機率，不額外疊加，才智課也適用。短通告名氣另以2／2.5／1.5為基礎，名氣0–149／150–399／400–699／700–899／900–998時依序按100%／40%／12%／4%／1%累積；不足整點存檔保留。普通通告僅主能力 +1–2；三項需出道的進階通告與主演／長約為重要通告，僅主能力 +1–5。名氣依各類通告的獨立規則計算。疲勞60起成長50%、80起25%，向下取整、成功至少1；訓練基礎失敗率3%，疲勞80以上改為50%（單次判定、不疊加）；失敗當次零成長，原有能力與小數進度保留，學費與疲勞照常、不額外罰款。能力上限999。成長與失敗在開始時固定，重載不重抽。休息 5 秒，疲勞 −45。</li><li>體能0–999 點降低 0–40% 工作疲勞（向上取整）；名氣0–999 點增加 0–20% 報酬；普通長作以15／18／12為基礎，名氣0–149／150–399／400–699／700–899／900–998依100%／50%／15%／5%／2%累積，接案時鎖定，完工才入帳，小數另存。重要邀約及原創企劃維持原規則；三種短案另用短案曲線。</li><li>大型通告完成後疲勞達 85 會失誤：報酬 80%、名氣 50%；自信越高，自信損失越少。自信不是全局成功率。</li><li>可排 3 項不同待辦。無資格、體力或資金不足時略過並記錄。取消不獲得成長或報酬，訓練費退回。</li><li>助理可選開啟：培養優先會依指定能力訓練，通告優先則依已儲存的類型、最低報酬及完成後疲勞上限代排；不符合時訓練或休息。手排優先，出道／主演／長約留你決定。</li><li>每 5 秒及操作後存檔。離線最多結算 4 小時；只有助理開啟才自動接新工作。請固定使用相同瀏覽器與位置，並定期匯出 JSON 備份。</li><li>旗下藝人合計名氣 600 為這版小目標；創作曲目／劇本系統尚未實作。</li></ul>'));
  function downloadSave(raw, prefix) { const blob = new Blob([raw], { type: 'application/json' }); const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = prefix + '-' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  $('export').addEventListener('click', () => { if(loadError){const raw=localStorage.getItem(KEY);if(raw){downloadSave(raw,'星序經紀-原始存檔備份');toast('已匯出未變更的原存檔');}return;} if (!sync()) return; persist(); downloadSave(G.save(state), '星序經紀-存檔'); toast('已匯出存檔，請保留下載的 JSON 檔'); });
  $('speed-backup').addEventListener('click',()=>{const raw=localStorage.getItem(SPEED_BACKUP);if(raw)downloadSave(raw,'星序經紀-十分鐘改版前原檔');});
  $('production-backup').addEventListener('click',()=>{const raw=localStorage.getItem(PRODUCTION_BACKUP);if(raw)downloadSave(raw,'星序經紀-製作期前原檔');});
  $('archive-backup').addEventListener('click',()=>{const raw=localStorage.getItem(ARCHIVE_BACKUP);if(raw)downloadSave(raw,'星序經紀-作品白名單前原檔');});
  $('backup').addEventListener('click', () => { const raw = localStorage.getItem(BACKUP); if (raw) downloadSave(raw, '星序經紀-升級前原檔'); });
  $('import').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file || stopped) return;
    try {
      if (file.size > 10000000) throw new Error('存檔過大');
      const raw = await file.text(), loaded = G.restore(raw);if(JSON.parse(raw).version<22&&!localStorage.getItem(FIVE_BACKUP))localStorage.setItem(FIVE_BACKUP,raw);if(JSON.parse(raw).version<21&&!localStorage.getItem(SALARY_BACKUP))localStorage.setItem(SALARY_BACKUP,raw);if(JSON.parse(raw).version<19&&!localStorage.getItem(DAILY_BACKUP))localStorage.setItem(DAILY_BACKUP,raw);if(!DEMO&&loaded.experience)throw new Error('體驗存檔不能匯入正式遊戲');
      if (!confirm('匯入會取代目前進度。確定使用這份存檔？')) return;
      if (!ownTab()) return;
      localStorage.setItem(DEMO?'starlane-experience-before-import-v1':'starlane-before-import-v1', G.save(state));
      if(JSON.parse(raw).version<16&&!localStorage.getItem(ARCHIVE_BACKUP))localStorage.setItem(ARCHIVE_BACKUP,raw);
      if(JSON.parse(raw).version<17&&!localStorage.getItem(PRODUCTION_BACKUP))localStorage.setItem(PRODUCTION_BACKUP,raw);
      if(JSON.parse(raw).version<18&&!localStorage.getItem(SPEED_BACKUP))localStorage.setItem(SPEED_BACKUP,raw);
      $('five-backup').hidden=!localStorage.getItem(FIVE_BACKUP);$('salary-backup').hidden=!localStorage.getItem(SALARY_BACKUP);$('daily-backup').hidden=!localStorage.getItem(DAILY_BACKUP);$('speed-backup').hidden=!localStorage.getItem(SPEED_BACKUP);$('production-backup').hidden=!localStorage.getItem(PRODUCTION_BACKUP);$('archive-backup').hidden=!localStorage.getItem(ARCHIVE_BACKUP);
      if (JSON.parse(raw).version !== G.VERSION && !localStorage.getItem(BACKUP)) localStorage.setItem(BACKUP, raw);
      $('backup').hidden = !localStorage.getItem(BACKUP);
      window.StarDynamic?.clearReactions();if(!DEMO)G.advance(loaded, Date.now(), true); state = loaded; presence=window.StarPresence.create(G,state,clock,document.hidden); storageOK = true; eventKey = ''; populateSettings(); persist(); render(); if (state.report) showReport(state.report); toast('存檔匯入完成'); if(loaded.migrationNotice) modal('<h2>新版進度保留與規則說明</h2><p>'+esc(StarDisplayCopy.migration(loaded.migrationNotice))+'</p>');
    } catch (error) { toast('無法匯入：' + error.message + '。目前進度未變更。'); }
    finally { e.target.value = ''; }
  });
  $('reset').addEventListener('click', () => {
    if (confirm('確定重新開局？目前進度會被清除；建議先匯出備份。')) { if (!ownTab()) return; window.StarUpdateNotice?.newGame(); state = DEMO?newExperience():G.create(); presence=window.StarPresence.create(G,state,clock,document.hidden); storageOK = true; selected = 'lin'; eventKey = ''; populateSettings(); persist(); render(); toast('新的工作室開張了'); }
  });
  window.addEventListener('pageshow',()=>{if(state.musicChapter?.reader)StarMusicChapterUI.resume(state,mutate);});
  window.addEventListener('pagehide', () => { if(ownTab()){presence.close();persist();} });
  window.addEventListener('pageshow', () => { if(ownTab()&&!document.hidden){const r=presence.show();if(r){persist();render();if(r.elapsed>=10000)showReport(r);}} });
  document.addEventListener('visibilitychange', () => {
    if (!ownTab()) return;
    if (document.hidden) { presence.hide(); persist(); }
    else { const r = presence.show(); persist(); render(); if (r&&r.elapsed >= 10000) showReport(r); }
  });
  setInterval(() => {
    if (document.hidden || !ownTab()) return;
    const liveReport = liveAdvance();
    // Preserve open selection menus. Timers update in place between meaningful state changes.
    $('cash').textContent = money(state.cash);
    renderSceneStatus();
    $('payroll-status').textContent = `目前 ${money(state.payroll.rate)}/分鐘 · 累計支出 ${money(state.payroll.paid)} · 值班 ${Math.floor(state.payroll.activeMs / 1000)} 秒${state.payroll.stoppedAt !== null ? ' · 資金不足，已停止代排' : ''}`;
    const signature = renderSignature();
    if (signature !== lastSignature || liveReport.rests > 0) { render(); lastSignature = signature; }
    else for (const a of state.artists) if (a.task) {
      const time = document.querySelector('[data-countdown="' + a.id + '"]'), bar = document.querySelector('[data-progress="' + a.id + '"]');
      if (time) time.textContent = G.taskCountdown(a.task,state.lastTick);
      if (bar) bar.style.width = a.task.production?G.productionProgress(a.task,state.lastTick).percent+'%':Math.max(0, Math.min(100, (state.lastTick - a.task.started) / (a.task.ends - a.task.started) * 100)) + '%';
    }
    document.querySelectorAll('[data-project-label]').forEach(el=>{const a=state.artists.find(a=>a.id===el.dataset.projectLabel);if(a?.project)el.textContent=G.projectLabel(a,state.lastTick);});
    document.querySelectorAll('[data-project-work]').forEach(el=>{const a=state.artists.find(a=>a.id===el.dataset.projectWork);el.disabled=!a?.project||!!a.task||state.lastTick+.001<a.project.nextAt;});
    checkManualView();window.StarWorkPreview?.tick(state);window.StarCompany?.tick(state);window.StarWorksUI.tick(state);
    if (Date.now() - lastSave >= 5000) persist();
  }, 500);
  // Clicking controls re-renders the relevant area immediately; blur resumes live updates.
  $('rival-cards').innerHTML=window.StarRivals.map(company=>`<article class="rival-card" data-rival="${company.id}"><div class="rival-identity"><div class="rival-identity-text"><div class="rival-banner"><h3>${esc(company.name)}</h3></div><p class="rival-principal">負責人：<strong>${esc(company.principal)}</strong></p><h4>旗下藝人</h4>${G.RIVALS.PEOPLE.filter(p=>p.company===company.id).map(p=>`<p class="rival-artist-name">${esc(p.name)}</p>`).join('')}</div><figure class="rival-principal-portrait art-cutline-frame"><img data-art-id="principal-${company.id}" ${StarImages.attrs(company.portrait)} alt="${esc(company.principal)}的半身立繪"></figure></div></article>`).join('');
  $('train-skills').innerHTML=Object.entries(G.SKILLS).map(([k,label])=>`<label><input type="checkbox" data-train-skill value="${k}">${k==='speech'?'聲音表現（口才）':label+'訓練'}</label>`).join('');
  try { $('equipment-backup').hidden=!localStorage.getItem(EQUIPMENT_BACKUP);$('career-backup').hidden=!localStorage.getItem(CAREER_BACKUP);$('five-backup').hidden=!localStorage.getItem(FIVE_BACKUP);$('salary-backup').hidden=!localStorage.getItem(SALARY_BACKUP);$('daily-backup').hidden=!localStorage.getItem(DAILY_BACKUP);$('speed-backup').hidden=!localStorage.getItem(SPEED_BACKUP);$('production-backup').hidden=!localStorage.getItem(PRODUCTION_BACKUP);$('archive-backup').hidden=!localStorage.getItem(ARCHIVE_BACKUP); $('backup').hidden = !localStorage.getItem(BACKUP); } catch { /* storage may be unavailable */ }
  populateSettings(); render(); persist();
  if(DEMO){const banner=document.createElement('div');banner.className='experience-banner';banner.innerHTML='<b>七天作品體驗 · 時間暫停 · 獨立存檔</b><span>正式資金與粉絲不受影響；關閉此分頁即可回到原遊戲。</span><button data-heat>回作品體驗</button>';document.body.prepend(banner);document.title='星序經紀｜獨立七天作品體驗';openHeat();}
  if (loadError) modal('<h2>存檔需要確認</h2><p>' + esc(loadError) + '</p>');
  else if (!storageOK) modal('<h2>目前是暫存遊玩模式</h2><p>這個瀏覽器無法自動存檔。請使用「匯出存檔」保留進度，或改用一般 Chrome／Edge 視窗開啟。</p>');
  else if (state.report) showReport(state.report);
  if (migrated && state.migrationNotice) modal('<h2>新版進度保留與規則說明</h2><p>'+esc(StarDisplayCopy.migration(state.migrationNotice))+'</p>');
  window.StarStartup?.ready();
  window.StarUpdateNotice?.init({existing:loadedExisting,enabled:!DEMO&&!loadError&&storageOK});
})();
