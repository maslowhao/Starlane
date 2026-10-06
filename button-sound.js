(()=>{
 'use strict';
 const KEY='starlane-button-sound-v1',base=document.currentScript.src;
 let enabled=true,volume=.5,pageHidden=false,pending=false,storageFailed=false,plays=0;
 try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.enabled==='boolean')enabled=s.enabled;if(Number.isFinite(s?.volume))volume=Math.max(0,Math.min(1,s.volume));}catch{storageFailed=true;}
 const audio=document.createElement('audio');Object.assign(audio,{id:'button-audio',src:new URL('assets/music/button-v018.mp3',base).href,preload:'none',volume,hidden:true});document.body.append(audio);
 const controls=document.createElement('div');controls.className='reception-music button-sound';controls.innerHTML='<button type="button" id="button-sound-toggle" aria-controls="button-audio">關閉按鈕音效</button><label for="button-sound-volume">音效 <output id="button-sound-level"></output></label><input id="button-sound-volume" type="range" min="0" max="100" value="50" aria-label="按鈕音效音量"><span id="button-sound-status" role="status"></span>';document.querySelector('.reception-music').append(controls);
 const toggle=controls.querySelector('button'),slider=controls.querySelector('input'),level=controls.querySelector('output'),status=controls.querySelector('[role=status]');slider.value=Math.round(volume*100);
 function paint(){toggle.textContent=enabled?'關閉按鈕音效':'開啟按鈕音效';toggle.setAttribute('aria-pressed',String(enabled));level.value=Math.round(volume*100)+'%';status.textContent=storageFailed?'設定暫時無法保存':!enabled||volume===0?'音效靜音':'點擊時播放';}
 function save(){try{localStorage.setItem(KEY,JSON.stringify({enabled,volume}));storageFailed=false;}catch{storageFailed=true;}paint();}
 toggle.addEventListener('click',()=>{enabled=!enabled;if(!enabled)audio.pause();save();});
 slider.addEventListener('input',()=>{volume=Number(slider.value)/100;audio.volume=volume;save();});
 // One capturing click listener catches nested button content and keyboard clicks exactly once.
 // Synthetic clicks, background activity, and changes to sliders never generate notification sounds.
 document.addEventListener('click',e=>{
   const button=e.target.closest?.('button,[role="button"],input[type="button"],input[type="submit"],summary,.file-label');
   if(!e.isTrusted||!button||button.disabled||button.getAttribute('aria-disabled')==='true'||!enabled||!volume||document.hidden||pageHidden)return;
   if(button===toggle)return;
   audio.pause();audio.currentTime=0;plays++;pending=true;
   try{Promise.resolve(audio.play()).catch(()=>{}).finally(()=>{pending=false;if(document.hidden||pageHidden||!enabled)audio.pause();});}catch{pending=false;}
 },true);
 const stop=()=>{if(document.hidden||pageHidden){audio.pause();audio.currentTime=0;}};
 document.addEventListener('visibilitychange',stop);addEventListener('pagehide',()=>{pageHidden=true;stop();});addEventListener('pageshow',()=>{pageHidden=false;});
 window.StarButtonSound={inspect:()=>({enabled,volume,plays,pending})};paint();
})();
