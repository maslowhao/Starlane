(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StarPresence=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Presence is independent of elapsed duration: a slow foreground tick stays foreground.
  // Hidden/pagehide checkpoints preserve lastTick; reopening settles that gap exactly once.
  function create(G,state,now,hidden){
    let background=!!hidden;
    function mark(mode){state.presence={mode,at:state.lastTick};}
    mark(background?'hidden':'visible');
    return {
      tick(){return G.advance(state,now(),background);},
      hide(){if(background)return null;const r=G.advance(state,now(),false);background=true;mark('hidden');return r;},
      show(){if(!background)return null;const r=G.advance(state,now(),true);background=false;mark('visible');return r;},
      close(){if(!background)G.advance(state,now(),false);background=true;mark('closed');},
      isBackground(){return background;}
    };
  }
  return {create};
});
