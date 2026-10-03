(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f();else r.StarOriginals=f();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const rows=[
  {id:'oc_muyu',name:'余沐雨',tag:'雨天裡的創作嗓音',role:'歌唱新人',color:'mint',trait:'安靜細膩，會把練習心得寫成小歌。音樂通告報酬 +15%。',bonusType:'music',sing:38,act:10,speech:16,poise:14,movement:12,stamina:22,intellect:28,confidence:20,fame:0},
  {id:'oc_yan',name:'沈硯',tag:'總在觀察人群的說故事者',role:'戲劇新人',color:'lavender',trait:'慢熱認真，開演前會反覆推敲角色。戲劇通告報酬 +15%。',bonusType:'drama',sing:8,act:40,speech:20,poise:12,movement:10,stamina:22,intellect:28,confidence:14,fame:0},
  {id:'oc_qiao',name:'唐小喬',tag:'把緊張變成笑聲',role:'廣告新人',color:'peach',trait:'開朗健談，擅長親切地介紹事物。廣告報酬 +15%，作品契合度 100%。',bonusType:'ad',sing:10,act:16,speech:36,poise:32,movement:18,stamina:20,intellect:18,confidence:22,fame:0},
  {id:'oc_sen',name:'陸森',tag:'練到最後一盞燈熄滅',role:'歌舞新人',color:'honey',trait:'直率有耐心，喜歡用節奏帶動大家。音樂通告報酬 +15%。',bonusType:'music',sing:24,act:10,speech:12,poise:16,movement:40,stamina:34,intellect:10,confidence:20,fame:0},
  {id:'oc_an',name:'許知安',tag:'鏡頭前的冷面笑匠',role:'戲劇新人',color:'mint',trait:'外表冷靜，熟了卻很愛即興演出。戲劇通告報酬 +15%。',bonusType:'drama',sing:8,act:36,speech:30,poise:16,movement:12,stamina:18,intellect:20,confidence:18,fame:0},
  {id:'oc_lin',name:'江映琳',tag:'願意聽完每一個故事',role:'主持新人',color:'lavender',trait:'溫和機靈，善於接住現場話題。廣告報酬 +15%，作品契合度 100%。',bonusType:'ad',sing:12,act:14,speech:40,poise:22,movement:10,stamina:18,intellect:30,confidence:16,fame:0}
 ];
 return rows.map(p=>({...p,origin:'original',portrait:'assets/originals/'+p.id+'-portrait.png',sdPortrait:'assets/originals/'+p.id+'.svg',uncertainFields:[],portraitStatus:'已批准原創2D立繪',sdStatus:'原創靜態形象 · 尚無骨架動畫'}));
});
