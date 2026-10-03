(function(r,f){const api=f();if(typeof module==='object'&&module.exports)module.exports=api;else r.StarDevelopment=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_LEVEL=20;
const LATE_PRICE_RATIO=1.5;
function prices(first){const out=[...first];while(out.length<MAX_LEVEL)out.push(Math.round(out.at(-1)*(out.length<10?1.25:LATE_PRICE_RATIO)/100)*100);return out;}
function effect(kind,level){if(kind==='training')return (Math.min(level,3)*15+Math.min(Math.max(level-3,0),7)*2+Math.max(level-10,0))/100;return Math.min(level,3)*5+Math.min(Math.max(level-3,0),7)+Math.max(level-10,0)*.5;}
const EQUIPMENT={training:{name:'培育設備',prices:prices([800,1800,3600])},production:{name:'製作設備',prices:prices([1200,2600,5000])}};
function init(s){s.equipment={training:0,production:0};for(const a of s.artists)a.growthProgress={};}
function divisor(value){return value<300?1:value<600?4:value<800?8:16;}
function apply(s,a,plan,training=false){a.growthProgress??={};const k=plan.skill,before=a[k];if(plan.failed||before>=999)return {gain:0,progress:a.growthProgress[k]||0,failed:!!plan.failed};let units=plan.amount*(training?1+effect('training',s.equipment.training):1),progress=a.growthProgress[k]||0;
 while(units>1e-8&&a[k]<999){const d=divisor(a[k]),needed=(1-progress)*d;if(units+1e-8>=needed){units-=needed;a[k]++;progress=0;}else{progress+=units/d;units=0;}}
 a.growthProgress[k]=a[k]>=999?0:Math.round(progress*1e8)/1e8;return {gain:a[k]-before,progress:a.growthProgress[k],failed:false};}
function buy(s,kind,expectedLevel){const e=EQUIPMENT[kind],level=s.equipment[kind];if(!e||level!==expectedLevel||level>=MAX_LEVEL)return {ok:false,reason:'設備已升級、選項已過期或已滿級。'};const fee=e.prices[level];if(s.cash<fee)return {ok:false,reason:'資金不足，尚未購買設備。'};s.cash-=fee;s.equipment[kind]++;return {ok:true,fee,level:level+1};}
function validate(s,skills){if(!s.equipment||!Object.keys(EQUIPMENT).every(k=>Number.isInteger(s.equipment[k])&&s.equipment[k]>=0&&s.equipment[k]<=MAX_LEVEL))throw Error('設備資料損壞');for(const a of s.artists){a.growthProgress??={};if(!a.growthProgress||Array.isArray(a.growthProgress)||typeof a.growthProgress!=='object'||!Object.entries(a.growthProgress).every(([k,v])=>skills.includes(k)&&Number.isFinite(v)&&v>=0&&v<1))throw Error('成長進度損壞');}}
return {MAX_LEVEL,LATE_PRICE_RATIO,effect,EQUIPMENT,init,divisor,apply,buy,validate};
});
