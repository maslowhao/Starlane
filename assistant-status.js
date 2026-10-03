(function(r,f){const api=f();if(typeof module==='object'&&module.exports)module.exports=api;else r.StarAssistantStatus=api;})(globalThis,function(){
 'use strict';
 function inspect(G,s,a){
  const cfg=G.effectiveStrategy(s,a),idle={...a,task:null};
  const offers=G.JOBS.map(j=>{const pay=G.payout(a,j),reasons=[];if(pay<cfg.minPay)reasons.push(`預估 $${pay}，低於最低報酬 $${cfg.minPay}`);const blocked=G.canStart(s,idle,{kind:'job',id:j.id},true);if(blocked)reasons.push(blocked);return {id:j.id,name:j.name,pay,reasons};});
  const next=G.nextAction(s,idle),label=G.actionInfo(next)?.label||'休息';
  const available=offers.filter(x=>!x.reasons.length);
  const current=a.task?`目前：${G.taskInfo(a.task).label}。本次完成後採用已儲存的${cfg.mode==='work'?'通告優先':'培養優先'}，不會取消現行活動。`:'目前空閒。';
  const plan=!cfg.enabled?'一般代排未啟用。':cfg.mode==='train'?`培養優先：空閒時安排${label}。`:available.length?`目前條件可接 ${available.length} 項；空閒時預計安排${label}。`:`沒有符合條件的通告，依備援設定安排${label}。`;
  return {current,plan,offers,available:available.length,queue:a.queue.length,project:!!a.project};
 }
 return {inspect};
});
