(function(r,f){const api=f(typeof module==='object'&&module.exports?require('./music-title-data.js'):r.StarMusicTitleData,typeof module==='object'&&module.exports?require('./music-title-source-data.js'):r.StarMusicTitleSourceData);if(typeof module==='object'&&module.exports)module.exports=api;else r.StarMusicTitles=api;})(globalThis,function(rows,sourceRows){
'use strict';
const jobs=['radio'],pool='music_work_unclassified',source='明星志願3原始音樂作品名';
const clone=x=>JSON.parse(JSON.stringify(x));
function next(s,kind){const c=s.musicTitles,row=rows[c.cursor++%rows.length];return {id:'music-offer-'+(++c.serial),title:row.title,key:row.key,pool,source,version:1,kind,sourceIds:[...row.source_ids],sourceKeys:[...row.source_keys],catalogVersion:'adaptation-2026-10-03-v1',adaptation:'single-name-only'};}
function init(s){s.musicTitles={version:1,serial:0,cursor:0,offers:{},history:[]};for(const id of jobs)s.musicTitles.offers[id]=next(s,id);}
function get(s,id){return jobs.includes(id)?s.musicTitles?.offers[id]||null:null;}
function freeze(s,action){if(action.kind!=='job'||action.projectName||!jobs.includes(action.id))return action;const o=get(s,action.id);return {...action,projectName:o.title,workInstance:o.id,titleRef:clone(o)};}
function consume(s,action){if(action.titleRef&&get(s,action.id)?.id===action.titleRef.id)s.musicTitles.offers[action.id]=next(s,action.id);}
function invitation(s){return next(s,'invitation');}
function complete(s,ref,a,at,earned){if(!ref||s.musicTitles.history.some(x=>x.id===ref.id))return;s.musicTitles.history.push({...clone(ref),artistId:a.id,artistName:a.name,at,earned});}
function normalize(x){return x.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();}
function validRef(x){return x&&/^music-offer-[1-9][0-9]*$/.test(x.id)&&x.version===1&&x.pool===pool&&x.source===source&&['cafe','radio','invitation'].includes(x.kind)&&typeof x.title==='string'&&x.title.length>0&&x.title.length<=200&&sourceRows.some(r=>r.key===x.key&&normalize(r.title)===normalize(x.title));}
function validate(s){if(s.musicTitles===undefined){init(s);return;}const c=s.musicTitles,n=x=>Number.isSafeInteger(x)&&x>=0;if(c.version!==1||!n(c.serial)||!n(c.cursor)||!c.offers||!Array.isArray(c.history)||Object.keys(c.offers).some(id=>!['cafe','radio'].includes(id))||!jobs.every(id=>validRef(c.offers[id])&&c.offers[id].kind===id)||!c.history.every(x=>validRef(x)&&typeof x.artistId==='string'&&typeof x.artistName==='string'&&Number.isFinite(x.at)&&x.at>=0&&Number.isFinite(x.earned)&&x.earned>=0))throw Error('音樂名稱存檔損壞');const refs=[...Object.values(c.offers),...c.history,...s.artists.flatMap(a=>[a.task?.action?.titleRef,a.project?.template?.action?.titleRef,...a.queue.map(q=>q.titleRef)]),...s.events.map(e=>e.titleRef),...s.career.offers.map(e=>e.titleRef)].filter(Boolean);if(refs.some(x=>!validRef(x)||Number(x.id.slice(12))>c.serial))throw Error('音樂合約身分損壞');}
return {jobs,source,pool,init,get,freeze,consume,invitation,complete,validate,validRef};
});
