(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StarScene=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const PANELS={publicity:'公關事件',works:'作品與公司擴充',artist:'藝人與行程',board:'通告佈告欄',assistant:'助理設定與代排',office:'公司經營與設備',rivals:'競爭公司',journal:'工作日誌',opportunities:'重要邀約',recruit:'尋找／招募藝人'};
  const ROOMS={practice:{panel:'artist',skill:'act',hint:'表演訓練室 · 先選夥伴，再選想練習的課程。安排前可確認費用與疲勞。'},recording:{panel:'artist',skill:'sing',hint:'聲音訓練室 · 替這位夥伴安排歌藝課。培育課程仍可自由切換。'},office:{panel:'assistant',hint:'助理設定與代排 · 管理策略、服務與薪資。'},lounge:{panel:'artist',hint:'窗邊休息區 · 好好休息也是成長的一部分。按「休息」安排行程。'},board:{panel:'board',hint:'通告佈告欄 · 為選中的夥伴，找一個合適的舞台。'}};
  function basicActivity(a){
    const t=a.task;if(!t)return{room:'lounge',short:'等你安排',mood:'今天想從哪裡開始？'};
    const q=t.action;if(q.kind==='rest')return{room:'lounge',short:'喝茶休息中',mood:'充飽電，再出發。'};
    if(q.kind==='train')return q.skill==='sing'?{room:'recording',short:'練唱中',mood:'再唱一次，會更好。'}:{room:'practice',short:({act:'排戲',speech:'練口才',poise:'練儀態',movement:'練動感',stamina:'體能訓練',intellect:'研讀課程',confidence:'表達練習'})[q.skill]+'中',mood:'每一次練習，都算數。'};
    if(q.kind==='special')return{room:'board',short:'重要通告外出中',mood:'今天，是新的挑戰。'};
    return{room:'board',short:({cafe:'外出演唱中',radio:'電台錄製中',short:'臨演拍攝中',series:'戲劇拍攝中',local:'拍小廣告中',cover:'封面拍攝中'})[q.id]||'外出工作中',mood:'把握每一次被看見。'};
  }
  function activity(a){const v=basicActivity(a),p=a.project;if(!p)return v;const name=p.template.action.projectName||{radio:'穗光唱片 單曲錄製',series:'週末單元劇',cover:'日常選物封面'}[p.jobId];return {...v,short:`${a.task?v.short:'無短行程'} · ${name} ${p.done}/${p.days}日 · ${a.task?.projectSegment?'製作中':a.task?.action.kind==='rest'?'休息續作':'待製作'}`};}
  function positions(artists){const groups={};return artists.map(a=>{const status=activity(a);const slot=groups[status.room]||0;groups[status.room]=slot+1;const base={lounge:[40,70],practice:[15,28],recording:[67,28],board:[78,71]}[status.room];return{id:a.id,...status,x:base[0]+slot*8.5,y:base[1]};});}
  return{PANELS,ROOMS,activity,positions};
});
