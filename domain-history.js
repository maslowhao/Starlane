(function(r,f){const api=f();if(typeof module==='object'&&module.exports)module.exports=api;else r.StarDomainHistory=api;})(globalThis,function(){
 'use strict';
 const DOMAINS=Object.freeze(['music','model','drama']),JOBS=Object.freeze({cafe:'music',radio:'music',local:'model',cover:'model',short:'drama',series:'drama'});
 function entered(s,id,domain){return !!s.domainHistory?.artists?.[id]?.includes(domain);}
 function mark(s,id,domain){if(!DOMAINS.includes(domain)||typeof id!=='string')return;s.domainHistory??={version:1,artists:{}};const list=s.domainHistory.artists[id]||[];if(!list.includes(domain)){list.push(domain);s.domainHistory.artists[id]=DOMAINS.filter(k=>list.includes(k));}}
 function accepted(s,id,action){if(action?.kind==='job')mark(s,id,JOBS[action.id]);}
 function validate(s,people){const h=s.domainHistory;if(h===undefined)return;if(!h||h.version!==1||!h.artists||typeof h.artists!=='object'||Array.isArray(h.artists)||Object.entries(h.artists).some(([id,ds])=>!people.some(p=>p.id===id)||!Array.isArray(ds)||new Set(ds).size!==ds.length||ds.some(d=>!DOMAINS.includes(d))))throw Error('藝人涉足領域紀錄損壞');}
 function backfill(s){for(const a of s.artists||[]){accepted(s,a.id,a.task?.action);if(a.project)mark(s,a.id,JOBS[a.project.jobId]);}for(const w of [...(s.works||[]),...(s.archivedWorks||[])]){const domain=JOBS[w.jobId],kind=domain==='music'?'music':domain==='model'?'ad':'drama';if(domain&&w.kind===kind&&Number.isSafeInteger(w.id)&&w.id>0&&Number.isFinite(w.releasedAt))mark(s,w.artistId,domain);}for(const o of s.career?.offers||[])if(['record_pay','record_buzz'].includes(o.kindId)&&['active','completed'].includes(o.status))mark(s,o.artistId,'music');for(const i of s.career?.ideas||[])if(['producing','done'].includes(i.status))mark(s,i.artistId,'music');return s;}
 return {DOMAINS,JOBS,entered,mark,accepted,validate,backfill};
});
