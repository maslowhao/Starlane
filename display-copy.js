/* Presentation only: historical save text and source metadata remain intact. */
window.StarDisplayCopy={
 workTitle:w=>typeof w.title==='string'&&w.title.trim()?w.title:({music:'未命名單曲',drama:'未命名戲劇作品',ad:'未命名封面作品',movie:'未命名電影作品',brand:'未命名品牌作品'}[w.kind]||'未命名作品'),
 trait:text=>text==='原作特質效果尚未移植；不套用原創加成'?'目前無額外特質加成':text,
 description:text=>text==='借用原始音樂作品名，在星序作為單曲指名企劃；原作單曲／專輯分類未確認。'?'單曲指名企劃，等待經紀人回覆。':text,
 migration:text=>String(text).replace('已切換明星志願藝人名單：原創藝人及排程已移除','已更新藝人名單：舊版藝人及排程已移除').replace('請重新招募明星志願藝人','請重新招募藝人')
};
