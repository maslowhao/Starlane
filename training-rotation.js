(function(r,f){const a=f();if(typeof module==='object'&&module.exports)module.exports=a;else r.StarTrainingRotation=a;})(globalThis,function(){
 'use strict';
 const SKILLS=['act','sing','speech','poise','movement','stamina','intellect','confidence'];
 function valid(skills){return Array.isArray(skills)&&skills.length>0&&skills.length<=8&&new Set(skills).size===skills.length&&skills.every(k=>SKILLS.includes(k));}
 function get(s,a){const r=s.trainingRotation?.artists?.[a?.id];return r?{skills:[...r.skills],cursor:r.cursor}:{skills:[a?.assistantStrategy?.trainSkill||'sing'],cursor:0};}
 function set(s,a,skills){if(!valid(skills))return false;const prior=get(s,a),next=prior.skills[prior.cursor],cursor=Math.max(0,skills.indexOf(next));s.trainingRotation??={version:1,artists:{}};s.trainingRotation.artists[a.id]={skills:[...skills],cursor};return true;}
 function next(s,a){const r=get(s,a);for(let n=0;n<r.skills.length;n++){const k=r.skills[(r.cursor+n)%r.skills.length];if(a[k]<999)return k;}return null;}
 function started(s,a,skill){const r=get(s,a),index=r.skills.indexOf(skill);if(index<0)return;s.trainingRotation??={version:1,artists:{}};s.trainingRotation.artists[a.id]={skills:[...r.skills],cursor:(index+1)%r.skills.length};}
 function validate(s,people){const h=s.trainingRotation;if(h===undefined)return;if(!h||h.version!==1||!h.artists||typeof h.artists!=='object'||Array.isArray(h.artists))throw Error('訓練輪替資料損壞');for(const [id,r]of Object.entries(h.artists))if(!people.some(a=>a.id===id)||!r||!valid(r.skills)||!Number.isInteger(r.cursor)||r.cursor<0||r.cursor>=r.skills.length)throw Error('訓練轮替順序損壞');}
 return {valid,get,set,next,started,validate};
});
