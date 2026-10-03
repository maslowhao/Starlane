(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f(require('./playback-revenue.js'));else r.StarWorks=f(r.StarPlaybackRevenue);})(typeof globalThis!=='undefined'?globalThis:this,function(REVENUE){
 'use strict';
 const CONFIG=Object.freeze({totalMs:300000,stageMs:300000/7,stages:7,baseViews:2000,qualityViews:80,baseConversion:.004,qualityConversion:.00012});
 const CURVES=[{name:'首波話題',weights:[1.4,1.2,1,.8,.6,.4,.2]},{name:'口碑升溫',weights:[.5,.8,1.2,1.5,1.2,.8,.5]},{name:'細水長流',weights:[1,1.1,1.1,1,.9,.8,.6]}];
 const finite=n=>Number.isFinite(n)&&n>=0&&n<=Number.MAX_SAFE_INTEGER;
 const integer=(n,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
 const LEGACY_FIELDS=['id','artistId','artistName','title','jobId','releasedAt','ageMs','stageMs','settled','quality','fit','related','launchFame','conversion','curve','views','fans'];
 const SAVE_FIELDS=[...LEGACY_FIELDS,'kind'];
 const JOB_KINDS=Object.freeze({radio:'music',series:'drama',cover:'ad'});
 function encode(s){if(!s.works||s.works.length+(s.archivedWorks||[]).length<500)return s;const rows=list=>list.map(w=>[...SAVE_FIELDS.map(k=>w[k]),w.stages.map(p=>[p.views,p.fans])]);return {...s,compactWorks:3,works:rows(s.works),archivedWorks:rows(s.archivedWorks||[])};}
 function decode(s){if(!s||s.compactWorks===undefined)return s;if(![1,2,3].includes(s.compactWorks)||!Array.isArray(s.works))throw Error('作品壓縮資料損壞');const fields=s.compactWorks===1?LEGACY_FIELDS:SAVE_FIELDS;const rows=list=>list.map(row=>{if(!Array.isArray(row)||row.length!==fields.length+1||!Array.isArray(row.at(-1))||row.at(-1).length!==7)throw Error('作品壓縮資料損壞');const w=Object.fromEntries(fields.map((k,i)=>[k,row[i]]));w.stages=row.at(-1).map(p=>{if(!Array.isArray(p)||p.length!==2)throw Error('作品壓縮資料損壞');return {views:p[0],fans:p[1]};});return w;});s.works=rows(s.works);if(s.compactWorks===3){if(!Array.isArray(s.archivedWorks))throw Error('封存作品資料損壞');s.archivedWorks=rows(s.archivedWorks);}delete s.compactWorks;return s;}
 function init(s){s.works=[];s.archivedWorks=[];s.workSerial=0;s.workRng=((s.rng||1)^(s.startedAt||1)^0x51A72026)>>>0;s.fansByArtist={};REVENUE.init(s);}
 function random(s){s.workRng=(Math.imul(s.workRng,1664525)+1013904223)>>>0;return s.workRng/4294967296;}
 function profile(a,setback=false,kind='ad'){const related=kind==='music'?.7*a.sing+.2*a.confidence+.1*a.intellect:kind==='drama'?.7*a.act+.2*a.speech+.1*a.intellect:.45*a.poise+.35*a.speech+.2*a.confidence;const quality=Math.max(0,Math.min(100,Math.round(related/999*100*(setback?.8:1)+(a.productionQualityBonus||0))));const fit=a.bonusType===kind?1:.85;return {quality,fit,related,fame:a.fame,conversion:(CONFIG.baseConversion+CONFIG.qualityConversion*quality)*fit};}
 function create(s,a,job,at,setback=false){
  const kind=JOB_KINDS[job.id];if(!kind)throw Error('此活動不產生作品');
  const p=profile(a,setback,kind),curve=CURVES[Math.floor(random(s)*CURVES.length)],base=(CONFIG.baseViews+CONFIG.qualityViews*p.quality)*p.fit*(1+.5*p.fame/999)*(a.exposureFactor||1);
  const stages=curve.weights.map(weight=>{const views=Math.round(base*weight*(.85+.3*random(s)));return {views,fans:Math.floor(views*p.conversion)};});
  const w={kind,id:++s.workSerial,artistId:a.id,artistName:a.name,title:job.name,jobId:job.id,releasedAt:at,ageMs:0,stageMs:CONFIG.stageMs,settled:0,quality:p.quality,fit:p.fit,related:p.related,launchFame:p.fame,conversion:p.conversion,curve:curve.name,stages,views:0,fans:0};
  s.workDescriptions??={};s.workDescriptions[w.id]={desc:job.desc||'',instance:job.workInstance||'work-'+w.id};s.works.push(w);REVENUE.register(s,w,job.playbackRevenueRule===REVENUE.RULE);return w;
 }
 function advance(s,ms,summary,batch){
  for(const [index,w] of s.works.entries()){if(w.settled===7)continue;const priorAge=w.ageMs,elapsed=batch&&index>=batch.existing?Math.max(0,batch.target-w.releasedAt):ms;w.ageMs=Math.min(w.stageMs*7,w.ageMs+elapsed);const due=Math.min(7,Math.floor((w.ageMs+.001)/w.stageMs));
   if(due===7)w.ageMs=w.stageMs*7;
   while(w.settled<due){const stage=w.stages[w.settled++];w.views+=stage.views;w.fans+=stage.fans;s.fansByArtist[w.artistId]=(s.fansByArtist[w.artistId]||0)+stage.fans;summary.views+=stage.views;summary.fans+=stage.fans;summary.workStages++;}
   REVENUE.settle(s,w,summary,(batch?.target??s.lastTick+ms)-Math.max(0,elapsed-(w.stageMs*7-priorAge)));
  }
 }
 function validate(s,people,legacy=false){
  const fail=()=>{throw Error('作品或粉絲資料損壞');};
  if(!Array.isArray(s.works)||!Array.isArray(s.archivedWorks)||!integer(s.workSerial)||!integer(s.workRng,4294967295)||!s.fansByArtist||Array.isArray(s.fansByArtist)||typeof s.fansByArtist!=='object')fail();
  const ids=new Set(),fans={};
  for(const w of [...s.works,...s.archivedWorks]){
   const archived=s.archivedWorks.includes(w),allowed=archived?w.jobId==='local'&&w.kind==='ad':JOB_KINDS[w.jobId]===w.kind||(legacy&&w.jobId==='local'&&w.kind==='ad');
   if(!integer(w.id)||!w.id||w.id>s.workSerial||ids.has(w.id)||!people.some(p=>p.id===w.artistId)||typeof w.artistName!=='string'||typeof w.title!=='string'||!allowed||!finite(w.releasedAt)||!finite(w.stageMs)||!w.stageMs||w.stageMs>86400000||(!finite(w.ageMs)||w.ageMs>w.stageMs*7)||!integer(w.settled,7)||w.settled!==Math.floor((w.ageMs+.001)/w.stageMs)||!integer(w.quality,100)||![.85,1].includes(w.fit)||!Number.isFinite(w.related)||w.related<0||w.related>999||!integer(w.launchFame,999)||!Number.isFinite(w.conversion)||w.conversion<0||w.conversion>1||!CURVES.some(c=>c.name===w.curve)||!Array.isArray(w.stages)||w.stages.length!==7||!w.stages.every(x=>integer(x.views,10000000)&&integer(x.fans,x.views)))fail();
   ids.add(w.id);const settled=w.stages.slice(0,w.settled);if(w.views!==settled.reduce((n,x)=>n+x.views,0)||w.fans!==settled.reduce((n,x)=>n+x.fans,0))fail();fans[w.artistId]=(fans[w.artistId]||0)+w.fans;
  }
  for(const h of s.publicity?.history||[]){if(h.fanDelta){if(!Number.isInteger(h.fanDelta)||h.fanDelta>0||h.fanDelta < -30)fail();fans[h.artistId]=(fans[h.artistId]||0)+h.fanDelta;}}
  for(const id of new Set([...Object.keys(fans),...Object.keys(s.fansByArtist)]))if(!people.some(p=>p.id===id)||(s.fansByArtist[id]!==undefined&&!integer(s.fansByArtist[id]))||(s.fansByArtist[id]||0)!==(fans[id]||0))fail();
 }
 return {REVENUE,CONFIG,CURVES,JOB_KINDS,init,profile,create,advance,validate,encode,decode};
});
