(function(r,f){const api=f(typeof module==='object'&&module.exports?require('./custom-artists.js'):r.StarCustomArtists);if(typeof module==='object'&&module.exports)module.exports=api;else r.StarSingingRanks=api;})(globalThis,function(CUSTOM){
 'use strict';
 const tier=(label,primary,secondary,works)=>Object.freeze({label,primary,secondary,works});
 const DOMAINS=Object.freeze({
  music:Object.freeze({title:'歌唱',primary:'sing',secondary:'movement',primaryLabel:'歌藝',secondaryLabel:'動感',kind:'music',jobId:'radio',workLabel:'單曲',tiers:Object.freeze([tier('歌唱新人',0,0,0),tier('歌手',150,75,3),tier('資深歌手',350,175,10),tier('唱將',600,300,20)]),reserved:['歌神','歌后','頂尖歌手'],reservedReason:'音樂獎項尚未開放，動感與作品件數待定'}),
  model:Object.freeze({title:'廣告／模特',primary:'poise',secondary:'confidence',primaryLabel:'儀態',secondaryLabel:'自信',kind:'ad',jobId:'cover',workLabel:'封面',tiers:Object.freeze([tier('廣告新人',0,0,0),tier('模特兒',150,75,6),tier('名模',350,175,20),tier('超級名模',600,300,40)]),reserved:['國際名模','國際名模','國際名模'],reservedReason:'自信、作品件數與獎項條件待定'}),
  drama:Object.freeze({title:'電視戲劇',primary:'act',secondary:'speech',primaryLabel:'演技',secondaryLabel:'口才',kind:'drama',jobId:'series',workLabel:'電視長案',tiers:Object.freeze([tier('電視新人',0,0,0),tier('電視演員',150,75,2),tier('演員',350,175,6),tier('實力派演員',600,300,12)]),reserved:['戲劇天王','戲劇天后','頂尖演員'],reservedReason:'口才、作品件數與獎項條件待定'})
 });
 // Released work records are created only at the end of formal production.
 // Never count invitations, pending projects, short-job logs or heat stages.
 function completed(s,artistId,domain='music'){const d=DOMAINS[domain];if(!d)return 0;const ids=new Set();for(const w of [...(s.works||[]),...(s.archivedWorks||[])])if(w&&w.artistId===artistId&&w.kind===d.kind&&w.jobId===d.jobId&&Number.isSafeInteger(w.id)&&w.id>0&&Number.isFinite(w.releasedAt)&&w.releasedAt>=0&&(!w.status||['completed','released'].includes(w.status)))ids.add(w.id);return ids.size;}
 function gender(s,a){if(['male','female'].includes(a.gender))return a.gender;const record=(s.customRegistry||[]).find(r=>r.id===a.id);return CUSTOM.PORTRAITS.find(p=>p.id===record?.portraitId)?.gender||null;}
 function rank(s,a,domain='music'){const d=DOMAINS[domain];if(!d)throw Error('未知階級領域');const value=k=>Number.isFinite(a[k])?Math.max(0,a[k]):0,primary=value(d.primary),secondary=value(d.secondary),works=completed(s,a.id,domain);let index=0;for(let i=1;i<d.tiers.length;i++)if(primary>=d.tiers[i].primary&&secondary>=d.tiers[i].secondary&&works>=d.tiers[i].works)index=i;const next=d.tiers[index+1]||null,g=gender(s,a);return {domain,index,label:d.tiers[index].label,primary,secondary,works,next:next?{...next,missingPrimary:Math.max(0,next.primary-primary),missingSecondary:Math.max(0,next.secondary-secondary),missingWorks:Math.max(0,next.works-works)}:null,reserved:{label:d.reserved[g==='male'?0:g==='female'?1:2],primary:900,secondary:null,works:null,locked:true,reason:d.reservedReason}};}
 return {DOMAINS,completed,gender,rank};
});
