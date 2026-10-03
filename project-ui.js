(() => {
 const G=window.StarGame,esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function card(a,s){if(!a?.project)return '';const p=a.project;return `<section class="project-card"><small>長案合約</small><p data-project-label="${a.id}">${esc(G.projectLabel(a,s.lastTick))}</p><progress max="${p.days}" value="${p.done}" aria-label="已完成製作日"></progress><p>約定報酬 $${p.template.contract.earned} · 完成後入帳</p><div class="project-buttons"><button data-project-manage="${a.id}" data-enable="${!p.assisted}">${p.assisted?'暫停長案管理（保留進度）':'恢復長案管理 · 公司30/分鐘'}</button><button data-project-work="${a.id}" ${a.task||s.lastTick+.001<p.nextAt?'disabled':''}>親自執行今日製作</button><button data-project-cancel="${a.id}">取消整件合約</button></div><small>${p.assisted?'長案管理期間持續計薪；多人及一般代排共用一份薪资。'.replace('薪资','薪資'):G.serviceActive(s)?'此案已暫停管理；其他助理服務仍計薪。':'助理服務已停止，親自安排不計薪。'}</small></section>`;}
 window.StarProjectUI={card};
})();
