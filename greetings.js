(function(r,f){const a=f();if(typeof module==='object'&&module.exports)module.exports=a;else r.StarGreetings=a;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function line(a,s){
  const p=(typeof module==='object'&&module.exports?require('./personas'):globalThis.StarPersonas)?.[a.id];
  if(p){
   if(a.task?.action.kind==='rest')return p.rest;
   if(a.task?.action.kind==='train')return p.train;
   if(a.task)return p.work;
   if(a.fatigue>=60)return p.tired;
   if(a.project)return p.project;
   if((s.works||[]).some(w=>w.artistId===a.id)||(s.career?.completedWorks||[]).some(w=>w.artistId===a.id))return p.released;
   return p.idle;
  }
  if(a.task?.action.kind==='rest')return '我先休息一下，等等再聊。';
  if(a.task?.action.kind==='train')return '我正在練習，等一下再聊。';
  if(a.task)return '這份工作還在忙，晚點見！';
  if(a.fatigue>=60)return '有點累了，想先休息一下。';
  if(a.project)return '下一段製作還沒開始，我先準備。';
  if((s.works||[]).some(w=>w.artistId===a.id)||(s.career?.completedWorks||[]).some(w=>w.artistId===a.id))return '有作品推出了，謝謝你陪我走到這裡。';
  return a.debuted?'我準備好了，有安排再叫我。':'嗨，今天也一起加油吧！';
 }
 const last=new Map(),RECENT_MS=60000;
 function stateKey(a,s){if(a.task?.action.kind==='rest')return 'rest';if(a.task?.action.kind==='train')return 'train';if(a.task)return 'work';if(a.fatigue>=60)return 'tired';if(a.project)return 'project';const now=s.lastTick;const recent=w=>{const at=w.releasedAt??w.at;return w.artistId===a.id&&Number.isFinite(at)&&Number.isFinite(now)&&now>=at&&now-at<=RECENT_MS;};if((s.works||[]).some(recent)||(s.career?.completedWorks||[]).some(recent))return 'released';return 'idle';}
 function nextLine(a,s){if(a.origin==='custom'&&['idle','released'].includes(stateKey(a,s))){const S=typeof module==='object'&&module.exports?require('./first-work-story'):globalThis.StarFirstWorkStory;const memory=S?.memory(s,a.id);if(memory)return memory;}const p=(typeof module==='object'&&module.exports?require('./personas'):globalThis.StarPersonas)?.[a.id];if(!p){if(a.origin==='custom'&&stateKey(a,s)==='idle'){const C=typeof module==='object'&&module.exports?require('./custom-artists'):globalThis.StarCustomArtists;return C.PERSONALITIES[a.personalityId]?.idle||line(a,s);}return line(a,s);}const rows=typeof module==='object'&&module.exports?require('./dialogue'):globalThis.StarDialogue;const state=stateKey(a,s),pool=[p[state],...(rows?.[a.id]?.[state]||[])],key=a.id+':'+state,n=((last.get(key)??-1)+1)%pool.length;last.set(key,n);return pool[n];}
 return {line,nextLine,stateKey,RECENT_MS};
});
