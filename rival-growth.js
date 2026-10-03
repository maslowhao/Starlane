(function(r,f){const a=f();if(typeof module==='object'&&module.exports)module.exports=a;else r.StarRivalGrowth=a;})(globalThis,function(){
 'use strict';
 const SKILLS=['act','sing','speech','poise','movement','stamina','intellect','confidence'];
 const PEOPLE=[
 [14,'馬智文',2,[40,15,20,15,20,30,15,25],'act',96,'stamina',64],
 [25,'林妮雯',2,[25,20,15,40,20,15,30,15],'poise',88,'intellect',56],
 [26,'古芊菁',3,[25,15,15,40,30,20,15,20],'poise',104,'movement',72],
 [16,'童靖陽',3,[40,20,15,15,20,25,15,30],'act',104,'confidence',72],
 [20,'史蒂芬',4,[20,40,15,15,30,20,25,15],'sing',96,'movement',64],
 [21,'丹尼斯',4,[15,40,15,20,30,20,15,25],'sing',112,'movement',80],
 [15,'彭胡',5,[20,25,40,15,30,15,15,20],'speech',96,'movement',64],
 [27,'甄紅',5,[40,15,30,25,15,15,15,25],'act',88,'speech',56]
 ].map(([sourceId,name,company,initial,primary,primaryRate,secondary,secondaryRate])=>Object.freeze({id:'npc_'+sourceId,sourceId,name,company,initial:Object.freeze(Object.fromEntries(SKILLS.map((k,i)=>[k,initial[i]]))),primary,primaryRate,secondary,secondaryRate}));
 function init(s,skipFirstAdvance=false){s.rivalGrowth={version:1,effectiveMs:0,compensation:0,skipFirstAdvance};}
 function validate(s){if(s.rivalGrowth===undefined){init(s,true);return;}const g=s.rivalGrowth;if(!g||g.version!==1||typeof g.skipFirstAdvance!=='boolean'||!Number.isFinite(g.effectiveMs)||g.effectiveMs<0||g.effectiveMs>Number.MAX_SAFE_INTEGER||!Number.isFinite(g.compensation)||Math.abs(g.compensation)>1)throw Error('競爭公司成長紀錄損壞');}
 function active(a){const t=a.task;return !!t&&!t.production?.rest&&(t.action.kind==='train'||(t.action.kind==='job'&&(t.projectSegment||!a.project)&&!t.production));}
 function advance(s,ms){if(ms<=0||!s.artists.some(active))return;if(!s.rivalGrowth)init(s);const g=s.rivalGrowth,y=ms-g.compensation,total=g.effectiveMs+y;g.compensation=(total-g.effectiveMs)-y;g.effectiveMs=total;}
 function grow(initial,budget){let value=initial;for(const [cap,cost]of [[300,1],[600,4],[800,8],[999,16]]){if(value>=cap)continue;const spend=Math.min(budget,(cap-value)*cost);value+=spend/cost;budget-=spend;if(budget<=0)break;}return Math.min(999,value);}
 function stats(s,id){const p=PEOPLE.find(p=>p.id===id);if(!p)return null;const hours=(s.rivalGrowth?.effectiveMs||0)/3600000;return Object.fromEntries(SKILLS.map(k=>[k,grow(p.initial[k],hours*(k===p.primary?p.primaryRate:k===p.secondary?p.secondaryRate:80/3))]));}
 return {PEOPLE,SKILLS,init,validate,active,advance,grow,stats};
});
