(() => {
 'use strict';
 const G=window.StarGame,base=new URL('.',document.currentScript.src).href;
 const crops={"s3_1": {"top": 208, "center": 418.0}, "s3_2": {"top": 141, "center": 386.5}, "s3_3": {"top": 201, "center": 391.0}, "s3_4": {"top": 188, "center": 374.0}, "s3_5": {"top": 89, "center": 376.5}, "s3_6": {"top": 137, "center": 401.5}, "s3_7": {"top": 155, "center": 377.0}, "s3_8": {"top": 179, "center": 500.0}, "s3_9": {"top": 112, "center": 413.5}, "s3_10": {"top": 83, "center": 404.0}, "s3_11": {"top": 92, "center": 389.5}, "s3_12": {"top": 126, "center": 410.5}, "s3_65": {"top": 221, "center": 385.5}, "s3_72": {"top": 87, "center": 382.5}, "s3_74": {"top": 196, "center": 445.5}, "s3_75": {"top": 132, "center": 394.5}, "s3_76": {"top": 135, "center": 373.5}, "s3_77": {"top": 96, "center": 400.0}, "secretary": {"top": 200, "center": 385}};
 const recruitMobile=matchMedia('(max-width:540px)');
 const actors=new Map(),seenResults=new Set();let state=null,room='reception',select=()=>{};
 const fxBase=base+'assets/effects/';
 let greeting=null,greetingTimer=null,lastSecretaryGreeting=-Infinity,secretaryGreetingIndex=0;
 function clearGreeting(){clearTimeout(greetingTimer);document.getElementById('artist-greeting')?.remove();greeting=null;}
 function placeGreeting(){
  const b=document.getElementById('artist-greeting'),actor=actors.get(greeting?.id);if(!b||!actor)return;
  const host=document.querySelector('.company-room-visual').getBoundingClientRect(),scene=document.getElementById('company-room-image').getBoundingClientRect(),ar=actor.el.getBoundingClientRect(),w=b.offsetWidth,h=b.offsetHeight;
  const blocked=[...document.querySelectorAll('.company-hotspot,.dynamic-label,.dynamic-visual')].filter(e=>e.getClientRects().length).map(e=>{const q=e.getBoundingClientRect();return {left:q.left,right:q.right,top:q.top,bottom:e.matches('.dynamic-visual')?q.top+q.height*.55:q.bottom};});
  const candidates=[[ar.left+ar.width/2-w/2,ar.top-h-8],[ar.right+8,ar.top],[ar.left-w-8,ar.top],[scene.left+scene.width*.5-w/2,scene.bottom-h-8]];
  for(const fy of [.55,.68,.75,.25])for(const fx of [.1,.45,.8])candidates.push([scene.left+scene.width*fx-w/2,scene.top+scene.height*fy]);
  for(let y=scene.top+8;y<=scene.bottom-h-8;y+=12)for(let x=scene.left+8;x<=scene.right-w-8;x+=12)candidates.push([x,y]);
  const boxes=candidates.map(([x,y])=>({left:Math.max(scene.left+6,Math.min(scene.right-w-6,x)),top:Math.max(scene.top+6,Math.min(scene.bottom-h-6,y))}));
  const chosen=boxes.find(p=>blocked.every(q=>p.left+w+3<=q.left||p.left-3>=q.right||p.top+h+3<=q.top||p.top-3>=q.bottom))||boxes[0];
  b.style.left=(chosen.left-host.left)+'px';b.style.top=(chosen.top-host.top)+'px';
 }
 function speak(id){
  clearGreeting();const a=state?.artists.find(x=>x.id===id);if(!a||room!=='reception')return;
  const b=document.createElement('div');b.id='artist-greeting';b.className='artist-greeting';b.setAttribute('role','status');b.textContent=a.name+'：'+window.StarGreetings.nextLine(a,state);
  document.querySelector('.company-room-visual').append(b);greeting={id,state:window.StarGreetings.stateKey(a,state)};placeGreeting();greetingTimer=setTimeout(clearGreeting,3800);
 }
 function secretaryGreeting(){
  if(!state?.hasEverSigned||!state.artists.length||room!=='reception'||document.getElementById('company-stage').hidden||state.publicity.pending||state.events.length||performance.now()-lastSecretaryGreeting<45000)return;
  clearGreeting();lastSecretaryGreeting=performance.now();
  const lines=['今天，也一起向前一點。','窗邊的咖啡還溫著。','下一個舞台正在等你們。'],b=document.createElement('div');
  b.id='artist-greeting';b.className='artist-greeting';b.dataset.speaker='secretary';b.setAttribute('role','status');b.textContent=lines[secretaryGreetingIndex++%lines.length];b.setAttribute('aria-label','小秘書：'+b.textContent);
  document.querySelector('.company-room-visual').append(b);greeting={id:'secretary',state:'daily'};placeGreeting();greetingTimer=setTimeout(clearGreeting,3800);
 }
 document.addEventListener('click',e=>{if(e.target.closest('[data-location=home],[data-company-room=reception]'))setTimeout(secretaryGreeting,0);});
 document.addEventListener('click',e=>{if(e.target.closest('[data-location],[data-panel],[data-home],[data-secretary-menu],[data-company-room]'))clearGreeting();});
 document.addEventListener('change',e=>{if(e.target.id==='company-artist')clearGreeting();});
 addEventListener('resize',placeGreeting);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearGreeting();});
 function make(id){
  const p=id==='secretary'?{name:'小秘書',portrait:'assets/artists/secretary.png'}:G.identity(state,id);
  const el=document.createElement('div');el.className='dynamic-person portrait-card'+(id==='secretary'?' secretary-npc':'');el.dataset.dynamicId=id;el.dataset.draggable='false';
  const frame=document.createElement('button');frame.type='button';frame.className='dynamic-visual';frame.setAttribute('aria-label',id==='secretary'?'小秘書，開啟助理管理':'選擇'+p.name+'，查看活動');
  const image=document.createElement('img');image.alt=p.name+'，2D半身肖像';image.draggable=false;
  const c=['s3_1','s3_6','s3_12','s3_7'].includes(id)?null:crops[id];if(c){image.style.cssText=`position:absolute;left:${50-c.center/5}%;top:${-c.top/6.2}%;width:150%;height:auto;max-width:none`;}
  else image.className='original-half';
  const label=document.createElement('button');label.type='button';label.className='dynamic-label';
  const name=document.createElement('b');name.textContent=p.name;const status=document.createElement('span');label.append(name,status);
  const result=document.createElement('span');result.className='portrait-result';result.hidden=true;result.setAttribute('role','status');
  const ongoing=document.createElement('div');ongoing.className='portrait-ongoing';ongoing.setAttribute('aria-hidden','true');
  frame.append(image);el.append(frame,ongoing,label,result);document.getElementById('dynamic-layer').append(el);
  const actor={id,el,visual:image,status,ready:false,error:null,clip:'idle',reaction:null,pos:null};actors.set(id,actor);
  image.onload=()=>{actor.ready=true;el.dataset.ready='true';requestAnimationFrame(()=>{fitReception(actor);placePracticeFx(actor);});};image.onerror=()=>{actor.error='肖像載入失敗';status.textContent=actor.error;};StarImages.set(image,base+p.portrait,true);
  const choose=()=>{clearGreeting();if(id==='secretary'){if(!window.StarCompany.showRecruitment())window.StarCompany.openAssistant();}else{select(id);if(room==='reception')speak(id);}};frame.onclick=choose;label.onclick=choose;
  return actor;
 }
 function fitReception(actor){const img=actor.visual,frame=img.parentElement;if(actor.id==='secretary')return;if(!img.complete||!img.naturalWidth)return;if(room!=='reception'){if(actor.fitted){img.style.cssText=actor.originalStyle;actor.fitted=false;}return;}const b=window.StarPortraitBounds[img.dataset.originalSrc||img.src.slice(base.length)]||[0,0,1,1],w=img.naturalWidth,h=img.naturalHeight,scale=Math.min(frame.clientWidth/((b[2]-b[0])*w),frame.clientHeight/((b[3]-b[1])*h));actor.originalStyle??=img.style.cssText;actor.fitted=true;img.style.cssText=`position:absolute;width:${w*scale}px;height:${h*scale}px;max-width:none;left:${(frame.clientWidth-(b[2]-b[0])*w*scale)/2-b[0]*w*scale}px;top:${frame.clientHeight-b[3]*h*scale}px;object-fit:fill`;
 }
 addEventListener('resize',()=>{for(const a of actors.values())fitReception(a);});
 function update(next,newRoom,onSelect,visibleIds=null){const greetOnArrival=newRoom==='reception'&&(!state||room!==newRoom||(!state.hasEverSigned&&next.hasEverSigned));if(room!==newRoom){clearReactions();clearGreeting();}state=next;room=newRoom;select=onSelect;const ids=next.artists.filter(a=>G.locationOf(a)===room&&(!visibleIds||visibleIds.includes(a.id))).map(a=>a.id);if(room==='reception')ids.unshift('secretary');if(greeting){const talking=next.artists.find(a=>a.id===greeting.id);if(greeting.id==='secretary'){if(next.publicity.pending||next.events.length||!next.artists.length)clearGreeting();}else if(!talking||window.StarGreetings.stateKey(talking,next)!==greeting.state)clearGreeting();}
  for(const [id,a] of actors)if(!ids.includes(id)){if(greeting?.id===id)clearGreeting();a.el.remove();actors.delete(id);}
  for(const id of ids){const a=actors.get(id)||make(id),p=next.artists.find(p=>p.id===id);if(p)a.el.querySelector('.dynamic-visual').setAttribute('aria-label',p.name+(room==='reception'?(recruitMobile.matches?'，打招呼並查看場景下方近況':'，打招呼並查看右側近況'):'，切換目前藝人'));a.clip=p?G.activityClip(p):'idle';a.el.dataset.clip=a.clip;a.el.dataset.activity=p?.task?.action.kind||'idle';const people=ids.filter(x=>x!=='secretary'),slot=people.indexOf(id),xs=room==='reception'?(people.length===1?[64]:people.length===2?[47,78]:[39,63,85]):people.length===1?[50]:people.length===2?[34,70]:[22,50,79];a.el.style.left=(id==='secretary'?12:xs[slot])+'%';a.el.style.bottom=(id==='secretary'?3:room==='reception'?(people.length===3?[14,28,12][slot]:people.length===2?[14,24][slot]:15):people.length===3?[8,20,4][slot]:people.length===2?[7,17][slot]:9)+'%';a.el.style.setProperty('--reception-bottom',(people.length===3?[12,18,10][slot]:people.length===2?[12,15][slot]:12)+'%');updateOngoing(a,p);requestAnimationFrame(()=>{fitReception(a);placePracticeFx(a);});if(id==='secretary')updateSecretary(a,next.publicity.pending,next.events.length,!next.hasEverSigned&&!next.artists.length);a.status.textContent=p?G.currentActivityLabel(p):'公司櫃台 · 招募／代排';document.getElementById('dynamic-layer').append(a.el);}
  document.getElementById('dynamic-note').textContent=`本房間 ${ids.filter(id=>id!=='secretary').length} 位藝人`;
  if(greetOnArrival)requestAnimationFrame(secretaryGreeting);
 }
 function updateSecretary(a,pending,invitations,firstRecruit){
  a.el.querySelector('.dynamic-visual').setAttribute('aria-label',firstRecruit&&recruitMobile.matches&&!pending&&!invitations?'小秘書，捲到本頁候選藝人區':'小秘書，開啟助理管理');
  const expression=pending?'panic':'normal';
  if(a.el.dataset.expression!==expression){a.el.dataset.expression=expression;a.ready=false;delete a.el.dataset.ready;StarImages.set(a.visual,base+'assets/artists/secretary'+(pending?'-panic':'')+'.png',true);a.visual.alt='小秘書 · '+(pending?'慌張表情':'一般表情');}
  let bubble=a.el.querySelector('.secretary-bubble');
  if(!pending&&!invitations&&!firstRecruit){bubble?.remove();return;}
  const firstNotice=!pending&&!invitations&&firstRecruit,passive=firstNotice&&!recruitMobile.matches;
    if(bubble&&bubble.tagName!==(passive?'SPAN':'BUTTON')){bubble.remove();bubble=null;}
    if(!bubble){bubble=document.createElement(passive?'span':'button');if(!passive)bubble.type='button';bubble.className='secretary-bubble';a.el.append(bubble);}
    if(passive)bubble.setAttribute('role','status');
  if(firstNotice)delete bubble.dataset.panel;else bubble.dataset.panel=pending?'publicity':'opportunities';
    bubble.onclick=firstNotice&&!passive?()=>window.StarCompany.showRecruitment():null;
    bubble.dataset.notice=pending?'publicity':invitations?'invitation':'first-recruit';
    bubble.textContent=pending?'出事了，快看看！':invitations?`有重要邀約，等你決定（${invitations} 件）`:recruitMobile.matches?'老闆，公司準備好囉！點這裡，來認識第一位藝人吧！':'老闆，公司準備好囉！來認識第一位藝人吧！';
  bubble.setAttribute('aria-label',bubble.textContent+(pending?' 開啟公關事件':invitations?' 查看重要邀約':!passive?' 捲到本頁候選藝人區':''));
 }
 recruitMobile.addEventListener('change',()=>{const a=actors.get('secretary');if(a&&state)updateSecretary(a,state.publicity.pending,state.events.length,!state.hasEverSigned&&!state.artists.length);});
 function placePracticeFx(actor){
  const img=actor.visual,host=actor.el.querySelector('[data-fx-ongoing=practice]');if(!host||!img.complete||!img.naturalWidth)return;
  const ir=img.getBoundingClientRect(),fr=actor.el.querySelector('.dynamic-visual').getBoundingClientRect(),hr=host.getBoundingClientRect(),css=getComputedStyle(img),padL=parseFloat(css.paddingLeft)||0,padR=parseFloat(css.paddingRight)||0,padT=parseFloat(css.paddingTop)||0,padB=parseFloat(css.paddingBottom)||0;
  let width=ir.width-padL-padR,height=ir.height-padT-padB,left=ir.left+padL,top=ir.top+padT;
  if(css.objectFit==='contain'){const scale=Math.min(width/img.naturalWidth,height/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;left+=(width-w)/2;top+=(height-h)/2;width=w;height=h;}
  const path=img.src.slice(base.length),b=window.StarPortraitBounds[path]||[.15,.05,.85,.95];
  const x0=Math.max(fr.left,left+b[0]*width),x1=Math.min(fr.right,left+b[2]*width),y0=Math.max(fr.top,top+b[1]*height),y1=Math.min(fr.bottom,top+b[3]*height);
  actor.el.dataset.visibleBounds=JSON.stringify([x0-actor.el.getBoundingClientRect().left,y0-actor.el.getBoundingClientRect().top,x1-x0,y1-y0]);
  host.querySelectorAll('.fx-practice-spark').forEach(spark=>{const upper=spark.classList.contains('fx-practice-spark-upper'),w=parseFloat(getComputedStyle(spark).width),x=upper?x1-(x1-x0)*.02:x0+(x1-x0)*.04,y=y0+(y1-y0)*(upper?.34:.79);spark.style.left=(x-hr.left-w/2)+'px';spark.style.right='auto';spark.style.top=(y-hr.top-w/2)+'px';});
 }
 addEventListener('resize',()=>requestAnimationFrame(()=>{for(const a of actors.values())placePracticeFx(a);}));

 function updateOngoing(a,p){
  const t=p?.task,key=t?`${t.started}:${t.action.kind}:${t.action.skill||''}:${a.clip}`:'';if(a.effectKey===key)return;a.effectKey=key;
  const host=a.el.querySelector('.portrait-ongoing');host.innerHTML='';delete host.dataset.fxOngoing;
  if(!t||t.action.kind==='rest'||t.production?.rest)return;
  const music=['record','sing'].includes(a.clip);host.dataset.fxOngoing=music?'music':'focus';
  if(music)for(let i=0;i<3;i++){const img=document.createElement('img');img.src=fxBase+'music_single.png';img.alt='';img.className='fx-note fx-note-'+i;host.append(img);}
  else {const mark=document.createElement('span');mark.className='fx-focus';mark.textContent=t.action.kind==='train'?'專注練習':'演出進行中';host.append(mark);if(t.action.kind==='train'){host.dataset.fxOngoing='practice';host.dataset.course=t.action.skill;const glow=document.createElement('img');glow.src=fxBase+'sparkles.png';glow.alt='';glow.className='fx-practice-spark';host.append(glow);const upper=glow.cloneNode();upper.classList.add('fx-practice-spark-upper');host.append(upper);}}
 }
 function resultLayer(){let layer=document.getElementById('portrait-fx-layer');if(!layer){layer=document.createElement('div');layer.id='portrait-fx-layer';layer.setAttribute('aria-live','polite');document.querySelector('.company-room-visual').append(layer);}return layer;}
 function react(events){
  if(document.hidden)return;
  let newest=null;
  for(const e of events||[]){if(!['train','job','special'].includes(e.kind)&&e.kind!==undefined)continue;
   const key=`${e.id}:${e.kind}:${e.at}:${e.result}`;if(seenResults.has(key))continue;seenResults.add(key);if(seenResults.size>300)seenResults.delete(seenResults.values().next().value);
   newest=e;const a=actors.get(e.id);if(!a)continue;
   a.reaction={clip:e.result,until:performance.now()+2500};const badge=a.el.querySelector('.portrait-result');badge.textContent=e.result==='defeat'?'本次受挫 · 查看工作紀錄':'活動完成 ✓';badge.hidden=false;a.el.dataset.result=e.result;
   const layer=resultLayer(),rect=a.el.getBoundingClientRect(),bounds=layer.getBoundingClientRect();if(!bounds.width||!bounds.height)continue;
   layer.querySelector(`[data-result-artist="${e.id}"]`)?.remove();const burst=document.createElement('div');burst.className='fx-result '+(e.result==='defeat'?'fx-failure':'fx-success');burst.dataset.resultArtist=e.id;burst.dataset.result=e.result;
   burst.style.left=((rect.left+rect.width/2-bounds.left)/bounds.width*100)+'%';burst.style.top=((rect.top+rect.height*.42-bounds.top)/bounds.height*100)+'%';burst.style.width=Math.max(70,Math.min(145,rect.width-10))+'px';
   const title=document.createElement('strong');title.textContent=(G.identity(state,e.id)?.name||'')+' · '+(e.result==='defeat'?'失敗／受挫':'成功');
   const word=document.createElement('img');word.className='fx-word';word.src=fxBase+(e.result==='defeat'?'failure.png':'success.png');word.alt='';
   burst.append(word,title);if(e.result!=='defeat')for(let i=0;i<3;i++){const star=document.createElement('img');star.src=fxBase+'sparkles.png';star.alt='';star.className='fx-stars fx-stars-'+i;burst.append(star);}
   layer.append(burst);setTimeout(()=>burst.remove(),2500);
  }
  if(newest){const p=G.identity(state,newest.id),box=document.getElementById('portrait-feedback');box.textContent=`${p?.name||''} · ${newest.result==='defeat'?'本次受挫，請查看工作紀錄':'活動完成，成果已入帳'}`;box.hidden=false;clearTimeout(window.__portraitFeedbackTimer);window.__portraitFeedbackTimer=setTimeout(()=>{box.hidden=true;},3000);}
 }
 function clearReactions(){document.getElementById('portrait-fx-layer')?.replaceChildren();for(const a of actors.values()){a.reaction=null;a.el.querySelector('.portrait-result').hidden=true;delete a.el.dataset.result;}const box=document.getElementById('portrait-feedback');if(box)box.hidden=true;}
 setInterval(()=>{for(const a of actors.values())if(a.reaction&&performance.now()>=a.reaction.until){a.reaction=null;a.el.querySelector('.portrait-result').hidden=true;delete a.el.dataset.result;}},200);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearReactions();});
 window.StarDynamic={update,react,clearReactions,forget:()=>{},inspect:()=>[...actors.values()].map(a=>({id:a.id,ready:a.ready,clip:a.clip,bookVisible:false,reaction:a.reaction?.clip,pos:null,time:0,error:a.error,mode:'2d',draggable:false}))};
})();
