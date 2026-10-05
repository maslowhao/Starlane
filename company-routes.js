(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StarCompanyRoutes=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const companies=Object.freeze({
    eami:Object.freeze({name:'穗光唱片',owner:'黎弦',image:"assets/original-v2/desktop/backgrounds/suiguang-records.webp",portrait:"assets/original-v2/desktop/characters/suiguang-li-xian.webp",type:'music',panel:'board',business:'音樂通告',note:'音樂短通告與單曲錄製。先選藝人，再親自決定承接。'}),
    sosa:Object.freeze({name:'澄曜電視台',owner:'聞晉川',image:"assets/original-v2/desktop/backgrounds/chengyao-tv.webp",portrait:"assets/original-v2/desktop/characters/chengyao-wen-jinchuan.webp",type:'drama',panel:'board',business:'戲劇通告',note:'戲劇與綜藝業務窗口。目前開放短篇劇、單元劇；綜藝通告尚未開放。'}),
    global:Object.freeze({name:'遠映影業',owner:'杜衡',image:"assets/original-v2/desktop/backgrounds/yuanying-film.webp",portrait:"assets/original-v2/desktop/characters/yuanying-du-heng.webp",type:null,panel:'opportunities',business:'電影邀約',note:'目前承接電影主演指名邀約，需等待符合資格的邀請；一般電影通告尚未開放。'}),
    creative:Object.freeze({name:'拾色廣告',owner:'夏知繪',image:"assets/original-v2/desktop/backgrounds/shise-advertising.webp",portrait:"assets/original-v2/desktop/characters/shise-xia-zhihui.webp",type:'ad',panel:'board',business:'廣告通告',note:'品牌短案與封面長作的接案窗口。報酬、門檻與製作流程依原合約規則。'})
  });
  const jobs=Object.freeze({cafe:'eami',radio:'eami',short:'sosa',series:'sosa',local:'creative',cover:'creative'});
  const invitations=Object.freeze({lead:'global',contract:'creative',record_pay:'eami',record_buzz:'eami'});
  const jobCompany=id=>jobs[id]||null;
  const invitationCompany=e=>invitations[e.kindId||e.key||e.id]||null;
  return Object.freeze({companies,jobs,invitations,jobCompany,invitationCompany});
});
