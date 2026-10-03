(function(r,f){const api=f();if(typeof module==='object'&&module.exports)module.exports=api;else r.StarPlaybackRevenue=api;})(globalThis,function(){
'use strict';
const RULE='music-003-v1',amount=views=>Math.floor(views*3/1000),legacyCatchup=new WeakSet(),suppressed=new WeakSet();
function register(s,w,eligible=false){if(w.kind!=='music')return;const rows=s.playbackRevenue.works;if(rows[w.id])return;rows[w.id]={workId:w.id,rule:eligible?RULE:'legacy',status:eligible?'pending':'legacy',amount:0,settledAt:null};}
function init(s){s.playbackRevenue={version:1,works:{}};for(const w of [...(s.works||[]),...(s.archivedWorks||[])])register(s,w,false);}
function beginAdvance(s,offline){if(offline&&legacyCatchup.has(s))suppressed.add(s);}
function endAdvance(s){legacyCatchup.delete(s);suppressed.delete(s);}
function mark(s,action){if(suppressed.has(s))return action;return action.kind==='job'&&action.id==='radio'?{...action,playbackRevenueRule:RULE}:action;}
function pay(s,w,summary,at,views){const row=s.playbackRevenue.works[w.id];if(w.kind!=='music'||row?.status!=='pending')return;row.amount=amount(views);row.status='settled';row.settledAt=at;s.cash+=row.amount;s.totalEarned+=row.amount;summary.playbackEarned=(summary.playbackEarned||0)+row.amount;(summary.playbackPayments??=[]).push({workId:w.id,title:w.title,artistName:w.artistName,amount:row.amount,at});}
function settle(s,w,summary,at){if(w.settled===7)pay(s,w,summary,at,w.views);}
function due(s,start,existing){return s.works.flatMap((w,i)=>s.playbackRevenue.works[w.id]?.status==='pending'?[{w,at:i<existing?start+w.stageMs*7-w.ageMs:w.releasedAt+w.stageMs*7}]:[]);}
function nextAt(s,start,existing){return Math.min(Infinity,...due(s,start,existing).map(x=>x.at));}
function payDue(s,at,start,existing,summary){for(const x of due(s,start,existing))if(x.at<=at+.0001)pay(s,x.w,summary,x.at,x.w.stages.reduce((n,p)=>n+p.views,0));}
function validate(s){if(s.playbackRevenue===undefined){init(s);legacyCatchup.add(s);return;}const c=s.playbackRevenue,works=[...(s.works||[]),...(s.archivedWorks||[])].filter(w=>w.kind==='music'),n=x=>Number.isSafeInteger(x)&&x>=0;if(!c||c.version!==1||!c.works||Array.isArray(c.works)||Object.keys(c.works).length!==works.length)throw Error('播放收益紀錄損壞');for(const w of works){const r=c.works[w.id];if(!r||r.workId!==w.id||!n(r.amount)||!['legacy','pending','settled'].includes(r.status))throw Error('播放收益身分損壞');if(r.status==='legacy'){if(r.rule!=='legacy'||r.amount!==0||r.settledAt!==null)throw Error('舊案播放收益紀錄損壞');}else if(r.rule!==RULE||(r.status==='pending'&&(r.amount!==0||r.settledAt!==null||w.settled===7))||(r.status==='settled'&&(w.settled!==7||r.amount!==amount(w.views)||!Number.isFinite(r.settledAt)||r.settledAt<0)))throw Error('播放收益結算紀錄損壞');}}
return {RULE,amount,register,init,mark,beginAdvance,endAdvance,settle,nextAt,payDue,validate};
});
