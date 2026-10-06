(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StarArt=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const assets={
  "secretary": {
    "kind": "character",
    "desktop": "assets/original-v2/desktop/characters/secretary.webp?v=art-v4",
    "mobile": "assets/original-v2/mobile/characters/secretary.webp?v=art-v4",
    "bounds": [
      0.1708984375,
      0.07161458333333333,
      0.828125,
      0.96875
    ],
    "cutline": 0.96875
  },
  "suiguang-li-xian": {
    "kind": "character",
    "desktop": "assets/original-v2/desktop/characters/suiguang-li-xian.webp",
    "mobile": "assets/original-v2/mobile/characters/suiguang-li-xian.webp",
    "bounds": [
      0.15234375,
      0.07161458333333333,
      0.8466796875,
      0.96875
    ],
    "cutline": 0.96875
  },
  "chengyao-wen-jinchuan": {
    "kind": "character",
    "desktop": "assets/original-v2/desktop/characters/chengyao-wen-jinchuan.webp",
    "mobile": "assets/original-v2/mobile/characters/chengyao-wen-jinchuan.webp",
    "bounds": [
      0.091796875,
      0.142578125,
      0.908203125,
      0.96875
    ],
    "cutline": 0.9680989583333334
  },
  "shise-xia-zhihui": {
    "kind": "character",
    "desktop": "assets/original-v2/desktop/characters/shise-xia-zhihui.webp",
    "mobile": "assets/original-v2/mobile/characters/shise-xia-zhihui.webp",
    "bounds": [
      0.1494140625,
      0.07161458333333333,
      0.849609375,
      0.96875
    ],
    "cutline": 0.9680989583333334
  },
  "yuanying-du-heng": {
    "kind": "character",
    "desktop": "assets/original-v2/desktop/characters/yuanying-du-heng.webp",
    "mobile": "assets/original-v2/mobile/characters/yuanying-du-heng.webp",
    "bounds": [
      0.158203125,
      0.07161458333333333,
      0.841796875,
      0.96875
    ],
    "cutline": 0.96875
  },
  "reception": {
    "kind": "background",
    "desktop": "assets/original-v2/desktop/backgrounds/reception.webp",
    "mobile": "assets/original-v2/mobile/backgrounds/reception.webp"
  },
  "acting-training": {
    "kind": "background",
    "desktop": "assets/original-v2/desktop/backgrounds/acting-training.webp",
    "mobile": "assets/original-v2/mobile/backgrounds/acting-training.webp"
  },
  "voice-training": {
    "kind": "background",
    "desktop": "assets/original-v2/desktop/backgrounds/voice-training.webp",
    "mobile": "assets/original-v2/mobile/backgrounds/voice-training.webp"
  },
  "suiguang-records": {
    "kind": "background",
    "desktop": "assets/original-v2/desktop/backgrounds/suiguang-records.webp",
    "mobile": "assets/original-v2/mobile/backgrounds/suiguang-records.webp"
  },
  "chengyao-tv": {
    "kind": "background",
    "desktop": "assets/original-v2/desktop/backgrounds/chengyao-tv.webp",
    "mobile": "assets/original-v2/mobile/backgrounds/chengyao-tv.webp"
  },
  "shise-advertising": {
    "kind": "background",
    "desktop": "assets/original-v2/desktop/backgrounds/shise-advertising.webp",
    "mobile": "assets/original-v2/mobile/backgrounds/shise-advertising.webp"
  },
  "yuanying-film": {
    "kind": "background",
    "desktop": "assets/original-v2/desktop/backgrounds/yuanying-film.webp",
    "mobile": "assets/original-v2/mobile/backgrounds/yuanying-film.webp"
  },
  "principal-2": {
    "kind": "character",
    "desktop": "assets/original-v2/desktop/characters/principal-2-v018.webp?v=art-v5",
    "mobile": "assets/original-v2/mobile/characters/principal-2-v018.webp?v=art-v5",
    "bounds": [
      0.1376953125,
      0.07161458333333333,
      0.861328125,
      0.96875
    ],
    "cutline": 0.96875
  },
  "principal-3": {
    "kind": "character",
    "desktop": "assets/original-v2/desktop/characters/principal-3.webp?v=art-v4",
    "mobile": "assets/original-v2/mobile/characters/principal-3.webp?v=art-v4",
    "bounds": [
      0.1337890625,
      0.072265625,
      0.865234375,
      0.96875
    ],
    "cutline": 0.96875
  },
  "work-audio": {
    "kind": "background",
    "desktop": "assets/original-v2/desktop/backgrounds/work-audio.webp?v=art-v4",
    "mobile": "assets/original-v2/mobile/backgrounds/work-audio.webp?v=art-v4"
  },
  "work-tv": {
    "kind": "background",
    "desktop": "assets/original-v2/desktop/backgrounds/work-tv.webp?v=art-v4",
    "mobile": "assets/original-v2/mobile/backgrounds/work-tv.webp?v=art-v4"
  },
  "work-ad": {
    "kind": "background",
    "desktop": "assets/original-v2/desktop/backgrounds/work-ad.webp?v=art-v4",
    "mobile": "assets/original-v2/mobile/backgrounds/work-ad.webp?v=art-v4"
  },
  "work-film": {
    "kind": "background",
    "desktop": "assets/original-v2/desktop/backgrounds/work-film.webp?v=art-v4",
    "mobile": "assets/original-v2/mobile/backgrounds/work-film.webp?v=art-v4"
  },
  "secretary-panic": {
    "kind": "character",
    "desktop": "assets/original-v2/desktop/characters/secretary-panic.webp?v=art-v5",
    "mobile": "assets/original-v2/mobile/characters/secretary-panic.webp?v=art-v5",
    "bounds": [
      0.1630859375,
      0.07161458333333333,
      0.8359375,
      0.96875
    ],
    "cutline": 0.96875
  },
  "debut-announcement": {
    "kind": "background",
    "desktop": "assets/original-v2/desktop/backgrounds/debut-announcement.webp?v=art-v5",
    "mobile": "assets/original-v2/mobile/backgrounds/debut-announcement.webp?v=art-v5"
  },
  "work-audio-long": {
    "kind": "background",
    "desktop": "assets/original-v2/desktop/backgrounds/work-audio-long.webp?v=art-v5",
    "mobile": "assets/original-v2/mobile/backgrounds/work-audio-long.webp?v=art-v5"
  },
  "work-tv-long": {
    "kind": "background",
    "desktop": "assets/original-v2/desktop/backgrounds/work-tv-long.webp?v=art-v5",
    "mobile": "assets/original-v2/mobile/backgrounds/work-tv-long.webp?v=art-v5"
  },
  "work-ad-long": {
    "kind": "background",
    "desktop": "assets/original-v2/desktop/backgrounds/work-ad-long.webp?v=art-v5",
    "mobile": "assets/original-v2/mobile/backgrounds/work-ad-long.webp?v=art-v5"
  },
  "work-film-long": {
    "kind": "background",
    "desktop": "assets/original-v2/desktop/backgrounds/work-film-long.webp?v=art-v5",
    "mobile": "assets/original-v2/mobile/backgrounds/work-film-long.webp?v=art-v5"
  }
};
 const aliases={
  "assets/artists/secretary.png": "secretary",
  "assets/npcs/eami-owner.png": "suiguang-li-xian",
  "assets/npcs/sosa-owner.png": "chengyao-wen-jinchuan",
  "assets/npcs/creative-owner.png": "shise-xia-zhihui",
  "assets/npcs/global-owner.png": "yuanying-du-heng",
  "assets/company/reception.png": "reception",
  "assets/company/practice.png": "acting-training",
  "assets/company/recording.png": "voice-training",
  "assets/locations/eami-music.png": "suiguang-records",
  "assets/locations/sosa-tv.png": "chengyao-tv",
  "assets/locations/creative-ad.png": "shise-advertising",
  "assets/locations/global-film.png": "yuanying-film",
  "assets/company/training-speech.png": "voice-training",
  "assets/artists/secretary-panic.png": "secretary-panic"
};
 const lookup=key=>assets[aliases[key]]||Object.values(assets).find(a=>a.desktop===key||a.mobile===key);
 const canonical=key=>lookup(key)?.desktop||key;
 const observed=new WeakSet();let observer;
 function fit(img){const a=assets[img.dataset.artId],frame=img.parentElement;if(!a?.bounds||!img.naturalWidth||!frame.clientWidth||!frame.clientHeight)return;
  const actor=frame.closest('.secretary-npc');if(actor){const scene=actor.closest('.company-room-visual'),layer=actor.parentElement;actor.style.setProperty('--art-floor-offset',-(scene.clientHeight-layer.offsetTop-layer.clientHeight)+'px');}
  const w=img.naturalWidth,h=img.naturalHeight,b=a.bounds,s=Math.min(frame.clientWidth/((b[2]-b[0])*w),frame.clientHeight/((a.cutline-b[1])*h));
  for(const [k,v]of Object.entries({width:w*s,height:h*s,left:(frame.clientWidth-(b[2]-b[0])*w*s)/2-b[0]*w*s,top:frame.clientHeight-a.cutline*h*s}))img.style.setProperty('--art-'+k,v+'px');
 }
 function watch(img){if(!img?.dataset.artId)return;if(!observed.has(img)){observed.add(img);img.addEventListener('load',()=>fit(img));observer??=new ResizeObserver(entries=>{for(const e of entries)for(const i of e.target.querySelectorAll(':scope>img[data-art-id]'))fit(i);});observer.observe(img.parentElement);}fit(img);}
 if(typeof document!=='undefined'){document.addEventListener('load',e=>{if(e.target instanceof HTMLImageElement)watch(e.target);},true);document.addEventListener('DOMContentLoaded',()=>document.querySelectorAll('img[data-art-id]').forEach(watch));addEventListener('resize',()=>document.querySelectorAll('img[data-art-id]').forEach(fit));}
 return {assets,aliases,lookup,canonical,fit,watch};
});
