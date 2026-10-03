(() => {
 const money=StarMoney.format;
 function render(host,s){
  const q=StarGame.expansionQuote(s);
  const labels={'品質至少 10 的已推出廣告':'品質達 10 的正式廣告作品','已推出廣告總數':'正式廣告作品總數'};
  host.innerHTML=`<div class="recruit-expansion-heading"><div><span class="eyebrow">COMPANY · ROOM FOR MORE</span><h3>擴充藝人</h3></div><strong data-recruit-capacity>${s.artists.length} / ${s.capacity}<small> 已簽／人數上限</small></strong></div>${q?`<p>下一名額：擴充至 <b>${q.target} 人</b> · 費用 <b>${money(q.fee)}</b></p><ul class="expansion-requirements">${q.conditions.filter(c=>c.need).map(c=>`<li class="${c.current>=c.need?'met':'missing'}"><span>${c.current>=c.need?'✓':'○'} ${labels[c.label]||c.label}</span><b>${c.current} / ${c.need}${c.current<c.need?` · 還差 ${c.need-c.current}`:''}</b></li>`).join('')}<li class="${s.cash>=q.fee?'met':'missing'}"><span>${s.cash>=q.fee?'✓':'○'} 公司資金</span><b>${money(s.cash)} / ${money(q.fee)}${s.cash<q.fee?` · 還差 ${money(q.fee-s.cash)}`:''}</b></li></ul>${q.target===3?'<p class="expansion-note">正式廣告作品需完成「日常選物封面」整件製作；街角品牌企劃等短案不計。粉絲看作品累積新增數，不是藝人名氣。舊檔已保留的擴充資格照舊。</p>':''}<button class="primary" data-expand="${q.target}" ${q.ok?'':'disabled'}>${q.ok?`支付 ${money(q.fee)}，擴充至 ${q.target} 人`:'尚有缺項，請先完成上列條件'}</button><small class="expansion-note">擴充後留在這裡，繼續挑選新夥伴。簽約金另計。</small>`:'<p>已達 3 人名額上限，無需再支付擴充費。</p>'}`;
 }
 window.StarExpansionUI={render};
})();
