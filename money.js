(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.StarMoney=api;api.observe(document.body);}})(globalThis,function(){
 'use strict';
 const RATE=30,number=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:8});
 const format=n=>'NT$'+number(Number(n)*RATE),signed=n=>(n>=0?'+':'−')+format(Math.abs(n));
 // Only explicit dollar amounts and these documented historical money phrases
 // are interpreted. Bare counts, dates, percentages and IDs are never multiplied.
 function legacy(value){
  let text=String(value??'').replace(/簽約費 ([0-9]+(?:\.[0-9]+)?) 的/g,'簽約費 $$$1 的').replace(/(公司共用|共用公司)30\/(分鐘|現實60秒)/g,(_,lead,unit)=>lead+'$30/'+unit);
  return text.replace(/(?<![A-Za-z0-9])\$(-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)(?:([–～~至-])\$?((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?))?/g,(_,first,range,last)=>format(Number(first.replace(/,/g,'')))+(range?range+format(Number(last.replace(/,/g,''))):''));
 }
 function inputValue(base){return String(Number((Number(base)*RATE).toPrecision(15)));}
 function fillInput(el,base){el.value=inputValue(base);el.dataset.moneyBase=String(base);el.dataset.moneyDisplay=el.value;}
 function parseInput(el){const value=Number(el.value);if(el.value.trim()===''||!Number.isFinite(value)||value<0||value>100000*RATE)return null;return el.value===el.dataset.moneyDisplay?Number(el.dataset.moneyBase):value/RATE;}
 function signingFormula(G){const p=G.SIGNING_PRICE;return `簽約金＝${format(p.base)}＋九項平均×${format(p.averageWeight)}＋最高能力×${format(p.peakWeight)}，四捨五入至 ${format(p.step)}。含名氣；採初始能力，疲勞與稀有度不加價。`;}
 function observe(root){
  if(!root)return;const attrs=['title','aria-label','placeholder','alt'];
  const skip=node=>node.parentElement?.closest('script,style,textarea,[data-money-skip]');
  function textNode(node){if(skip(node)||!(/\$|簽約費 \d|(?:公司共用|共用公司)30\//.test(node.nodeValue||'')))return;const next=legacy(node.nodeValue);if(next!==node.nodeValue)node.nodeValue=next;}
  function attributes(el){if(el.closest('script,style,textarea,[data-money-skip]'))return;for(const key of attrs){const old=el.getAttribute(key);if(old?.includes('$')){const next=legacy(old);if(next!==old)el.setAttribute(key,next);}}}
  function sync(node){if(node.nodeType===3){textNode(node);return;}if(node.nodeType!==1)return;attributes(node);const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);while(walker.nextNode())textNode(walker.currentNode);for(const el of node.querySelectorAll('[title],[aria-label],[placeholder],[alt]'))attributes(el);}
  sync(root);const observer=new MutationObserver(records=>{for(const record of records){if(record.type==='characterData')textNode(record.target);else if(record.type==='attributes')attributes(record.target);else for(const node of record.addedNodes)sync(node);}});observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attrs});return {sync:()=>sync(root),disconnect:()=>observer.disconnect()};
 }
 return {RATE,format,signed,legacy,inputValue,fillInput,parseInput,signingFormula,observe};
});
