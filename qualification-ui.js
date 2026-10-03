(() => {
 const G=StarGame;
 function value(a,key,min){const n=a?.[key]??0,missing=n<min,label=key==='fame'?'個人名氣':G.SKILLS[key];return `<span class="requirement-value ${missing?'requirement-missing':'requirement-met'}" data-requirement="${key}">${label} ${n} / ${min}${missing?` · 未達標，差 ${min-n}`:' · 已達標'}</span>`;}
 function job(a,j){return `<span class="requirement-condition">${j.debuted?(a.debuted?'正式出道 · 已符合':'尚未正式出道'):'練習生可接'}</span><br>`+Object.entries({...j.requirements,fame:j.fameMin||0}).map(([k,n])=>value(a,k,n)).join('<br>');}
 function invitation(s,e){const a=s.artists.find(a=>a.id===e.artistId);return [value(a,e.skill,e.min),value(a,'fame',e.fameMin),value(a,'confidence',40)].join('<br>')+`<br><span class="requirement-condition">${a?.debuted?'正式出道 · 已符合':'尚未正式出道'} · 指定藝人，不可轉派</span>`;}
 window.StarQualificationUI={value,job,invitation};
})();
