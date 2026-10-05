(()=>{'use strict';
const originals=new Set(['oc_muyu','oc_yan','oc_qiao','oc_sen','oc_an','oc_lin']),custom=new Set(['male1','male2','male3','female1','female2','female3']);
function path(a,emotion='basic',mobile=matchMedia('(max-width:540px)').matches){const e=['basic','happy','worried'].includes(emotion)?emotion:'basic';if(originals.has(a.id))return `assets/original-chibi/${mobile?'mobile':'desktop'}/${a.id}-${e}.webp`;if(custom.has(a.portraitId))return `assets/dialogue-portraits/${a.portraitId}-${e}.webp`;return a.portrait||null;}
window.StarChibi={path};
})();
