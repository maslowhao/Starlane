(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./roster.js') : root.StarRoster, typeof module === 'object' && module.exports ? require('./works.js') : root.StarWorks, typeof module === 'object' && module.exports ? require('./publicity.js') : root.StarPublicity, typeof module === 'object' && module.exports ? require('./development.js') : root.StarDevelopment, typeof module === 'object' && module.exports ? require('./career.js') : root.StarCareer, typeof module === 'object' && module.exports ? require('./custom-artists.js') : root.StarCustomArtists, typeof module === 'object' && module.exports ? require('./domain-history.js') : root.StarDomainHistory, typeof module === 'object' && module.exports ? require('./first-work-story.js') : root.StarFirstWorkStory, typeof module === 'object' && module.exports ? require('./rival-growth.js') : root.StarRivalGrowth, typeof module === 'object' && module.exports ? require('./training-rotation.js') : root.StarTrainingRotation, typeof module==='object'&&module.exports?require('./music-chapter.js'):root.StarMusicChapter);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StarGame = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (ROSTER, WORKS, PUBLICITY, DEVELOPMENT, CAREER, CUSTOM, DOMAIN_HISTORY, FIRST_STORY, RIVALS, ROTATION, CHAPTER) {
  'use strict';
  const VERSION = 31;
  const MUSIC=CAREER.MUSIC,REVENUE=WORKS.REVENUE;
  const OFFLINE_SHORT_FACTOR=.7;
  // Only three ordinary short jobs use this curve. Integer units preserve fractional fame exactly.
  const SHORT_FAME=Object.freeze({unit:1000,base:Object.freeze({cafe:2,short:2.5,local:1.5}),tiers:Object.freeze([{below:150,rate:1},{below:400,rate:.4},{below:700,rate:.12},{below:900,rate:.04},{below:1000,rate:.01}].map(Object.freeze))});
  const LONG_FAME=Object.freeze({unit:1000,tiers:Object.freeze([{below:150,rate:1},{below:400,rate:.5},{below:700,rate:.15},{below:900,rate:.05},{below:1000,rate:.02}].map(Object.freeze))});
  const REPUTATION_GAIN=Object.freeze({cafe:2,short:2,local:2,radio:12,series:18,cover:10,lead:20,contract:20});
  const PRODUCTION_DAYS=Object.freeze({radio:4,series:7,cover:2});
  const ACTION_SECONDS = 5;
  const CANDIDATE_COUNT = 2;
  const SPECIAL_CHANCE = .08;
  const EXPANSIONS = Object.freeze({2:{fee:300,reputation:10},3:{fee:800,important:1,works:3,fans:100}});
  const MAX_ARTISTS = 3;
  const LEGACY_RECRUIT_COST = 300;
  // Initial balance design. Only these shared coefficients set new signing prices.
  const SIGNING_PRICE = Object.freeze({ base: 100, averageWeight: 2, peakWeight: 1, step: 10 });
  const RELEASE_RATIO = .5; // Adjustable first version: 50% of the actual signing fee.
  const SALARY_RATE = 30;
  const STAT_CAP = 999;
  const OFFLINE_CAP = 4 * 60 * 60 * 1000;
  const TYPES = { music: '音樂演出', drama: '戲劇演出', ad: '品牌通告' };
  const SKILLS = { act: '演技', sing: '歌藝', speech: '口才', poise: '儀態', movement: '動感', stamina: '體能', intellect: '才智', confidence: '自信' };
  const TRAINING = { act: { cost: 80, fatigue: 10 }, sing: { cost: 80, fatigue: 10 }, speech: { cost: 80, fatigue: 8 }, poise: { cost: 80, fatigue: 8 }, movement: { cost: 100, fatigue: 12 }, stamina: { cost: 100, fatigue: 12 }, intellect: { cost: 100, fatigue: 8 }, confidence: { cost: 100, fatigue: 8 } };
  const JOBS = [
    { id: 'cafe', type: 'music', name: 'EAMI 音樂短通告', desc: '練習生也能登上的小舞台。用一首歌讓人記住你。', duration: ACTION_SECONDS, pay: 250, fame: SHORT_FAME.base.cafe, fatigue: 15, skill: 'sing', min: 20, requirements: { sing: 20, confidence: 20 }, gain: 1, gains: { sing: 1, confidence: 1 } },
    { id: 'radio', type: 'music', name: 'EAMI 單曲錄製', desc: '正式錄製並推出一首單曲。完成後可在作品熱度查看七天播放與新粉；歌藝課及現場演出不產生唱片。', duration: WORKS.CONFIG.stageMs*4/1000, productionDays: 4, pay: 760, fame: 15, fatigue: 23, skill: 'sing', min: 42, fameMin: 40, debuted: true, requirements: { sing: 42, speech: 35, stamina: 40, confidence: 35 }, gains: { sing: 2, speech: 1, confidence: 1 } },
    { id: 'short', type: 'drama', name: '巷口短篇劇', desc: '從簡單臨演開始，練習台詞與真實的表情。', duration: ACTION_SECONDS, pay: 300, fame: SHORT_FAME.base.short, fatigue: 16, skill: 'act', min: 20, requirements: { act: 20, speech: 20 }, gain: 1, gains: { act: 1, speech: 1 } },
    { id: 'series', type: 'drama', name: '週末單元劇', desc: '讀懂劇本，完成長時間拍攝，讓角色留在心裡。', duration: WORKS.CONFIG.stageMs*7/1000, productionDays: 7, pay: 900, fame: 18, fatigue: 25, skill: 'act', min: 44, fameMin: 50, debuted: true, requirements: { act: 44, intellect: 40, stamina: 45 }, gains: { act: 2, intellect: 1 } },
    { id: 'local', type: 'ad', name: '街角品牌企劃', desc: '初階小廣告，低門檻練習儀態與介紹商品。', duration: ACTION_SECONDS, pay: 230, fame: SHORT_FAME.base.local, fatigue: 13, skill: 'poise', min: 20, requirements: { speech: 20, poise: 20 }, gains: { poise: 1, speech: 1 } },
    { id: 'cover', type: 'ad', name: '日常選物封面', desc: '儀態、動感與自信，讓每一格畫面都自在。', duration: WORKS.CONFIG.stageMs*2/1000, productionDays: 2, pay: 820, fame: 12, fatigue: 21, skill: 'poise', min: 40, fameMin: 30, debuted: true, requirements: { poise: 40, movement: 38, confidence: 38 }, gains: { poise: 2, movement: 1 } },
  ];
  const PEOPLE = ROSTER;
  const clone = x => JSON.parse(JSON.stringify(x));
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const SIGNING_STATS = Object.freeze([...Object.keys(SKILLS), 'fame']);
  function signingQuote(stats) {
    const values = SIGNING_STATS.map(k => stats[k]);
    if (!values.every(v => Number.isFinite(v) && v >= 0 && v <= STAT_CAP)) throw new Error('簽約報價需要完整九項能力');
    const average = values.reduce((sum, v) => sum + v, 0) / values.length, peak = Math.max(...values);
    const fee = Math.round((SIGNING_PRICE.base + SIGNING_PRICE.averageWeight * average + SIGNING_PRICE.peakWeight * peak) / SIGNING_PRICE.step) * SIGNING_PRICE.step;
    const strongest = SIGNING_STATS.filter(k => stats[k] === peak).map(k => SKILLS[k] || '名氣').join('／');
    return { fee, average, peak, strongest, basis: `九項平均 ${average.toFixed(1)} · 強項 ${strongest} ${peak}` };
  }
  // Always quote the initial roster, never mutable career stats, RNG or animation state.
  function recruitQuote(id) { const p = PEOPLE.find(p => p.id === id); return p ? signingQuote(p) : null; }
  function catalog(s){return [...PEOPLE,...CUSTOM.people(s)];}
  function identity(s,id){return PEOPLE.find(p=>p.id===id)||CUSTOM.people(s).find(p=>p.id===id);}
  function customQuote(s,d){if(s.customRecruitCardUsed||s.hasEverSigned||s.artists.length||s.customRegistry.length)return {ok:false,reason:'自創藝人僅限新公司第一位藝人；本局已完成首次簽約。'};const check=CUSTOM.inspect(d);if(!check.ok)return check;const normalized=check.name.normalize('NFKC').toLocaleLowerCase('en');if(s.artists.some(a=>a.name.normalize('NFKC').toLocaleLowerCase('en')===normalized)||PEOPLE.some(a=>a.name.normalize('NFKC').toLocaleLowerCase('en')===normalized))return {ok:false,reason:'這個姓名已由現有藝人使用，請換一個名字。'};const quote=signingQuote({...check.stats,fame:0}),candidate={...check.stats,fame:0,debuted:false};const eligible=JOBS.filter(j=>!j.productionDays&&!jobLocks(candidate,j).length).map(j=>j.name);if(s.artists.length>=s.capacity)return {ok:false,reason:'公司名額已滿，請先完成擴充或辦理解約。',quote,eligible};if(s.cash<quote.fee)return {ok:false,reason:'公司資金不足，簽約需要 $'+quote.fee+'。',quote,eligible};return {ok:true,...check,quote,eligible};}
  function createCustom(s,d){const q=customQuote(s,d);if(!q.ok)return q;const id='custom_'+(s.customSerial+1),record={id,name:q.name,portraitId:d.portraitId,personalityId:d.personalityId,stats:{...q.stats}},candidate=CUSTOM.definition(record);s.customSerial++;s.customRegistry.push(record);s.customRecruitCardUsed=true;refreshCandidates(s,s.candidates);s.cash-=q.quote.fee;s.artists.push({...candidate,assistantStrategy:strategySnapshot(DEFAULT_STRATEGY),contractFee:q.quote.fee,debuted:false,shortFameUnits:0,longFameUnits:0,fatigue:0,task:null,project:null,queue:[],growthProgress:{}});s.hasEverSigned=true;s.refreshRemaining=0;log(s,`${q.name}以自創素人身分加入公司，實付簽約金 $${q.quote.fee}；名氣0、總能力162。`,s.lastTick);CHAPTER.scan(s);return {ok:true,id,fee:q.quote.fee};}
  function signingFormula() { return `簽約金＝${SIGNING_PRICE.base}＋九項平均×${SIGNING_PRICE.averageWeight}＋最高能力×${SIGNING_PRICE.peakWeight}，四捨五入至 ${SIGNING_PRICE.step} 元。含名氣；採初始能力，疲勞與稀有度不加價。`; }
  function create(now = Date.now()) {
    const s = { version: VERSION, growthRng: 362436069, rng: 123456789, cash: 2500, totalEarned: 0, totalJobs: 0, companyReputation:0, startedAt: now, lastTick: now,
      independentStrategies:1, customRegistry:[],customSerial:0,customRecruitCardUsed:false,artists: [], capacity:1, hasEverSigned:false, refreshRemaining:3,
      assistant: { enabled: false, mode: 'work', priority: ['music', 'drama', 'ad'], minPay: 0, maxFatigue: 70, fallback: 'train', trainSkill: 'sing' },
      payroll: { rate: SALARY_RATE, paid: 0, activeMs: 0, remainder: 0, stoppedAt: null, lastCharge:null },
      events: [], resolvedEvents: [], log: [], report: null };
    RIVALS.init(s);WORKS.init(s);PUBLICITY.init(s);DEVELOPMENT.init(s);CAREER.init(s);MUSIC.init(s);s.candidateRng=(Math.floor(now)>>>0)||1; refreshCandidates(s); return s;
  }
  const SPECIAL_RECRUIT_IDS=Object.freeze(['s3_1','s3_6','s3_12','s3_7']);
  const recruitEligible=p=>p.origin==='original'||SPECIAL_RECRUIT_IDS.includes(p.id);
  const RARE_IDS = ['s3_65','s3_74','s3_75','s3_76','s3_77','s3_72'];
  const CANDIDATE_WEIGHTS = Object.fromEntries(PEOPLE.map(p=>[p.id,RARE_IDS.includes(p.id)?1:4]));
  function refreshCandidates(s,keep=[]) {
    const count=s.customRecruitCardUsed===false?1:CANDIDATE_COUNT;
    s.candidates=[...new Set(keep)].filter(id=>PEOPLE.some(p=>p.id===id&&recruitEligible(p))&&!s.artists.some(a=>a.id===id)).slice(0,count);const pool=PEOPLE.filter(p=>recruitEligible(p)&&(s.customRecruitCardUsed!==false||p.origin==='original')&&!s.artists.some(a=>a.id===p.id)&&!s.candidates.includes(p.id));
    for(let n=s.candidates.length;n<count&&pool.length;n++){
      s.candidateRng=(Math.imul(s.candidateRng,1664525)+1013904223)>>>0;
      const normal=pool.filter(p=>p.origin==='original'),special=pool.filter(p=>p.origin!=='original');
      const useSpecial=!normal.length||(special.length&&s.candidateRng/4294967296<SPECIAL_CHANCE),group=useSpecial?special:normal;
      s.candidateRng=(Math.imul(s.candidateRng,1664525)+1013904223)>>>0;
      let roll=s.candidateRng/4294967296*group.reduce((sum,p)=>sum+CANDIDATE_WEIGHTS[p.id],0),chosen=group[group.length-1];
      for(const p of group){roll-=CANDIDATE_WEIGHTS[p.id];if(roll<0){chosen=p;break;}}
      s.candidates.push(chosen.id);pool.splice(pool.indexOf(chosen),1);
    }
    return s.candidates;
  }
  function rerollCandidates(s){
    if(s.hasEverSigned||s.artists.length)return {ok:false,reason:'首次簽約後，開局免費刷新權益已結束'};
    if(s.refreshRemaining<=0)return {ok:false,reason:'三次開局免費刷新已用完；不會隨時間或重新整理恢復'};
    const before=[...s.candidates].sort().join(',');
    for(let attempt=0;attempt<32;attempt++){refreshCandidates(s);if([...s.candidates].sort().join(',')!==before)break;}
    s.refreshRemaining--;return {ok:true};
  }
  const WORK_SCENES={
    'work-audio':{label:'錄音通告現場',background:'work-audio.png',foreground:'work-audio-front.png',source:'原作通告05 唱片錄製',clip:'record'},
    'work-tv':{label:'電視劇拍攝現場',background:'work-tv.png',source:'原作通告01 電視劇拍攝',clip:'act'},
    'work-film':{label:'電影拍攝現場',background:'work-film.png',source:'原作通告03 電影拍攝',clip:'act'},
    'work-ad':{label:'廣告拍攝現場',background:'work-ad.png',source:'原作通告08 廣告拍攝',clip:'pose'},
    'work-live':{label:'音樂演出現場',background:'work-live.png',foreground:'work-live-front.png',source:'原作打工03 幕後合音',clip:'sing'}
  };
  function activityClip(a){if(a.task?.production?.rest)return 'rest';const t=a.task?.action;if(!t)return 'idle';if(t.kind==='rest')return 'rest';if(t.kind==='job'&&t.id==='cafe')return 'sing';if(t.kind==='train')return {sing:'record',speech:'speech',act:'act',poise:'pose',confidence:'pose',movement:'dance',stamina:'dance',intellect:'idle'}[t.skill]||'idle';return WORK_SCENES[locationOf(a)]?.clip||'idle';}
  function locationName(a){return WORK_SCENES[locationOf(a)]?.label||{reception:'公司大廳',practice:'表演訓練室',recording:'聲音訓練室',outside:'外出通告'}[locationOf(a)];}
  function locationOf(a) {
    if(a.task?.production?.rest)return 'reception';
    const t=a.task?.action;
    return t?.kind==='train'?(['sing','speech'].includes(t.skill)?'recording':'practice'):t?.kind==='job'?({cafe:'work-audio',radio:'work-audio',short:'work-tv',series:'work-tv',local:'work-ad',cover:'work-ad'}[t.id]||'outside'):t?.kind==='special'?({lead:'work-film',contract:'work-ad'}[t.event?.kindId||t.event?.id]||'outside'):'reception';
  }
  function log(s, text, at) { s.log.unshift({ text, at }); s.log = s.log.slice(0, 60); }
  function person(s, id) { return s.artists.find(a => a.id === id); }
  function expansionQuote(s){
    const target=s.capacity+1,rule=EXPANSIONS[target];if(!rule)return null;
    const ads=[...s.works,...s.archivedWorks].filter(w=>w.kind==='ad'),important=ads.filter(w=>w.quality>=10).length,fans=Object.values(s.fansByArtist).reduce((n,v)=>n+v,0);
    const conditions=target===2?[{label:'公司知名度（永久累積）',current:s.companyReputation,need:rule.reputation}]:[{label:'品質至少 10 的已推出廣告',current:important,need:rule.important},{label:'已推出廣告總數',current:ads.length,need:rule.works},{label:'作品累積新增粉絲',current:fans,need:rule.fans}];
    const missing=conditions.filter(c=>c.current<c.need).map(c=>`${c.label} ${c.current}/${c.need}`);
    if(s.cash<rule.fee)missing.push(`擴充費 $${rule.fee}，資金不足`);
    return {target,fee:rule.fee,conditions,missing,ok:!missing.length};
  }
  function expand(s,target){const q=expansionQuote(s);if(!q||q.target!==target)return {ok:false,reason:'名額已擴充或選擇已過期'};if(!q.ok)return {ok:false,reason:q.missing.join('；')};s.cash-=q.fee;s.capacity=q.target;log(s,`公司擴充為 ${q.target} 人名額，支付 $${q.fee}。`,s.lastTick);return {ok:true};}
  function recruit(s, id) {
    const candidate = PEOPLE.find(p => p.id === id);
    if (!candidate||!recruitEligible(candidate)) return { ok: false, reason: '這位藝人目前不開放新招募' };
    if (person(s,id)) return { ok: false, reason: '這位夥伴已加入公司，不能重複招募' };
    if (s.artists.length >= s.capacity) return { ok: false, reason: `公司目前 ${s.capacity} 人名額已滿，請先完成成果並擴充` };
    if (!s.candidates.includes(id)) return { ok:false, reason:'這位藝人目前不在洽談候選名單' };
    const quote = recruitQuote(id);
    if (s.cash < quote.fee) return { ok: false, reason: `簽約需要 $${quote.fee}，公司資金不足` };
    s.cash -= quote.fee;
    s.candidates=s.candidates.filter(x=>x!==id);
    s.artists.push({ ...clone(candidate), assistantStrategy:strategySnapshot(DEFAULT_STRATEGY), contractFee: quote.fee, debuted: false, fame: candidate.fame, shortFameUnits: 0,longFameUnits:0, fatigue: 0, task: null, project:null, queue: [] });
    s.artists.forEach(a=>a.growthProgress??={});s.hasEverSigned=true;s.customRecruitCardUsed=true;s.refreshRemaining=0;refreshCandidates(s,s.candidates);
    log(s, `${candidate.name}以練習生身分加入星序，實付簽約金 $${quote.fee}（${quote.basis}）。公司 ${s.artists.length}/${s.capacity} 人。`, s.lastTick);
    return { ok: true };
  }
  function releaseQuote(s,id){const a=person(s,id);return a?{name:a.name,fee:Math.ceil(a.contractFee*RELEASE_RATIO),base:a.contractFee,ratio:RELEASE_RATIO,busy:!!a.task||!!a.project}:null;}
  function release(s,id){const a=person(s,id),q=releaseQuote(s,id);
    if(!a)return {ok:false,reason:'這位藝人已不在公司'};
    if(q.busy)return {ok:false,reason:'請等目前活動及長案完成，或先明確取消長案後再辦理解約'};
    if(s.cash<q.fee)return {ok:false,reason:'資金不足以支付解約金'};
    if(s.trainingRotation)delete s.trainingRotation.artists[id];s.cash-=q.fee;PUBLICITY.expire(s,id);CAREER.release(s,id);s.artists=s.artists.filter(p=>p.id!==id);
    if(!s.artists.length)s.assistant.enabled=false;
    log(s,`${a.name}解約，支付簽約費 ${q.base} 的 ${q.ratio*100}%：$${q.fee}。再次簽約將從初始能力開始。`,s.lastTick);
    return {ok:true};
  }
  function fatigueCost(a, info) { return info.fatigue > 0 ? Math.ceil(info.fatigue * (1 - .4 * a.stamina / STAT_CAP)) : info.fatigue; }
  function isSetback(a, info) { return (info.debuted || info.kind === 'special') && a.fatigue + fatigueCost(a, info) >= 85; }
  function confidenceLoss(a) { return Math.ceil(8 * (1 - a.confidence / STAT_CAP)); }
  function payout(a, job) { return Math.round(job.pay * (a.bonusType === job.type && !(a.origin==='custom'&&(job.kind==='special'||job.fameExempt)) ? 1.15 : 1) * (1 + .2 * a.fame / STAT_CAP) * (isSetback(a, job) ? .8 : 1)); }
  function shortFamePreview(a,info) {
    if(info.kind==='special'||info.productionDays||!Object.hasOwn(SHORT_FAME.base,info.id))return null;
    const rate=SHORT_FAME.tiers.find(t=>a.fame<t.below)?.rate||.01;
    if(a.fame>=STAT_CAP)return {rate,amount:0,gain:0,unitsAfter:0};
    const units=Math.round(SHORT_FAME.base[info.id]*rate*SHORT_FAME.unit),total=(a.shortFameUnits||0)+units;
    const gain=Math.min(STAT_CAP-a.fame,Math.floor(total/SHORT_FAME.unit));
    return {rate,amount:units/SHORT_FAME.unit,gain,unitsAfter:a.fame+gain>=STAT_CAP?0:total%SHORT_FAME.unit};
  }
  function longFameAward(a,units) {const total=(a.longFameUnits||0)+units,gain=Math.min(STAT_CAP-a.fame,Math.floor(total/LONG_FAME.unit));return {gain,unitsAfter:a.fame+gain>=STAT_CAP?0:total%LONG_FAME.unit};}
  function longFamePreview(a,info) {
    const j=JOBS.find(j=>j.id===info.id);
    if(!j?.productionDays||info.kind==='special'||info.fameExempt||info.fame!==j.fame)return null;
    const rate=a.fame>=STAT_CAP?0:LONG_FAME.tiers.find(t=>a.fame<t.below).rate,units=Math.round(j.fame*rate*LONG_FAME.unit);
    return {rate,units,amount:units/LONG_FAME.unit,...longFameAward(a,units)};
  }
  function fameGain(a, info) { const short=shortFamePreview(a,info),long=longFamePreview(a,info);return short?short.gain:long?long.gain:Math.min(STAT_CAP - a.fame, Math.max(1, Math.floor((info.fame + Math.floor(5 * a.fame / STAT_CAP)) * (isSetback(a, info) ? .5 : 1)))); }
  // One primary ability per activity; fame retains its separate existing reward.
  function growthMax(info) { return info.kind === 'train' ? 3 : info.kind === 'special' || info.debuted ? 5 : 2; }
  function learningEfficiency(a) { return a.fatigue >= 80 ? .25 : a.fatigue >= 60 ? .5 : 1; }
  function trainingFailureChance(a) { return a.fatigue >= 80 ? .5 : .03; }
  function trainingGain(a, skill, roll = .5) {
    // Weights 1 : (1+I/999) : (1+2I/999). Intellect biases odds, never adds points.
    const i=a.intellect/STAT_CAP, x=clamp(roll,0,1-Number.EPSILON)*(3+3*i);
    return x<1 ? 1 : x<2+i ? 2 : 3;
  }
  function trainingPreview(a, skill) {
    const efficiency=learningEfficiency(a), remaining=STAT_CAP-a[skill];
    return {efficiency, failureChance:trainingFailureChance(a),
      min:Math.min(remaining,1), gain:Math.min(remaining,Math.max(1,Math.floor(3*efficiency)))};
  }
  function growthRoll(s) { s.growthRng=(Math.imul(s.growthRng,1664525)+1013904223)>>>0; return s.growthRng/4294967296; }
  function planGrowth(s,a,info) {
    if(info.kind==='rest')return null;
    const failed=info.kind==='train' && random(s)<trainingFailureChance(a);
    const roll=growthRoll(s),base=info.kind==='train'?trainingGain(a,info.skill,roll):1+Math.floor(roll*growthMax(info));
    const efficiency=learningEfficiency(a);
    return {skill:info.skill,base,efficiency,failed,amount:failed?0:Math.max(1,Math.floor(base*efficiency))};
  }
  function validGrowth(g,info) {
    if(info.kind==='rest')return g===null;
    return g && g.skill===info.skill && Number.isInteger(g.base) && g.base>=1 && g.base<=growthMax(info)
      && [1,.5,.25].includes(g.efficiency) && typeof g.failed==='boolean'
      && (!g.failed || info.kind==='train')
      && g.amount===(g.failed?0:Math.max(1,Math.floor(g.base*g.efficiency)));
  }
  function random(s) { s.rng = (Math.imul(s.rng, 1664525) + 1013904223) >>> 0; return s.rng / 4294967296; }
  function actionInfo(action) {
    if (!action || typeof action !== 'object') return null;
    if(action.playbackRevenueRule!==undefined&&action.playbackRevenueRule!==REVENUE.RULE)return null;
    if((action.projectName!==undefined&&(typeof action.projectName!=='string'||action.projectName.length>200))||(action.projectDesc!==undefined&&(typeof action.projectDesc!=='string'||action.projectDesc.length>2000))||(action.payOverride!==undefined&&(!Number.isSafeInteger(action.payOverride)||action.payOverride<0||action.payOverride>10000))||(action.exposure!==undefined&&![1,1.6].includes(action.exposure))||(action.creationQuality!==undefined&&(!Number.isInteger(action.creationQuality)||action.creationQuality<0||action.creationQuality>15)))return null;
    if(action.kind==='compose')return {kind:'compose',label:'原創歌曲寫詞／作曲',duration:5,skill:'intellect',fatigue:8,ideaId:action.ideaId};
    if (action.kind === 'job') { const job = JOBS.find(j => j.id === action.id); return job ? { ...job, ...(action.projectName&&job.id!=='cafe'?{name:action.projectName,desc:action.projectDesc||job.desc}:{}),...(Number.isFinite(action.payOverride)?{pay:action.payOverride}:{}),...(action.opportunityId||action.creationQuality!==undefined?{fameExempt:true}:{}),kind: 'job', label: job.id==='cafe'?job.name:action.projectName||job.name } : null; }
    if (action.kind === 'rest') return { kind: 'rest', label: '好好休息', duration: ACTION_SECONDS, fatigue: -45 };
    if (action.kind === 'train' && SKILLS[action.skill]) return { kind: 'train', skill: action.skill, label: SKILLS[action.skill] + '訓練', duration: ACTION_SECONDS, ...TRAINING[action.skill] };
    return null;
  }
  function canStart(s, a, action, assistant = false) {
    const info = actionInfo(action);
    if (!a || !info) return '行程不存在';
    if(action.kind==='compose'&&!s.career.ideas.some(i=>i.id===action.ideaId&&i.artistId===a.id&&i.status==='preparing'))return '沒有進行中的創作準備';
    if (a.task) return '藝人正在執行行程';
    if (info.kind === 'job' && jobLocks(a, info).length) return jobLocks(a, info).join('；');
    if(info.productionDays&&a.project)return '每位藝人同時只能有一件長案';
    if (!info.productionDays && (info.fatigue > 0) && a.fatigue + fatigueCost(a, info) > (assistant ? effectiveStrategy(s,a).maxFatigue : 100)) return '疲勞太高，請先休息';
    if (info.cost && s.cash < info.cost) return `資金不足，訓練需要 $${info.cost}`;
    return null;
  }
  function jobLocks(a, info) {
    const reasons = [];
    if (info.debuted && !a.debuted) reasons.push('需正式出道');
    const requirements = info.requirements || { [info.skill]: info.min };
    for (const [skill, min] of Object.entries(requirements)) if (a[skill] < min) reasons.push(`${SKILLS[skill]}需 ${min}（目前 ${a[skill]}）`);
    if (a.fame < (info.fameMin || 0)) reasons.push(`個人名氣需 ${info.fameMin}（目前 ${a.fame}）`);
    return reasons;
  }
  function debutLocks(a) {
    const reasons = [];
    if (a.fame < 30) reasons.push(`個人名氣 ${a.fame}/30`);
    const best = Math.max(a.sing, a.act, a.speech, a.movement);
    if (best < 45) reasons.push(`演技／歌藝／口才／動感任一 ${best}/45`);
    if (a.poise < 34) reasons.push(`儀態 ${a.poise}/34`);
    if (a.confidence < 34) reasons.push(`自信 ${a.confidence}/34`);
    return reasons;
  }
  function debut(s, id) {
    const a = person(s, id);
    if (!a || a.debuted) return { ok: false, reason: '藝人已出道或不存在' };
    if (a.task) return { ok: false, reason: '請等目前行程結束，或先取消行程再宣布出道' };
    const reasons = debutLocks(a);
    if (reasons.length) return { ok: false, reason: reasons.join('；') };
    a.debuted = true; log(s, `經紀人決定：${a.name}正式出道！可以挑戰更大的舞台。`, s.lastTick);
    return { ok: true };
  }
  function start(s, id, action, at = s.lastTick, source = 'manual') {
    const a = person(s, id), reason = canStart(s, a, action, source === 'assistant');
    if (reason) return { ok: false, reason };
    if(action.offerId && !action.titleRef && MUSIC.get(s,action.id)?.id!==action.offerId)return {ok:false,reason:"這份音樂洽談已被接受，請查看新洽談。"};
    // New queued jobs already have frozen names. Legacy queued jobs keep their old naming path.
    if(source!=='queue')action=REVENUE.mark(s,MUSIC.freeze(s,action));
    let info = actionInfo(action);
    if(info.productionDays&&!action.projectName){const n=CAREER.name(s,info.type==='music'?'music':info.type==='drama'?'drama':'brand');action={...action,projectName:n.title,projectDesc:n.desc,workInstance:n.instance};info=actionInfo(action);}
    if (info.cost) {s.cash -= info.cost;log(s,`${a.name}開始${info.label}，學費 -$${info.cost}（${source.includes('assistant')?'助理安排':'玩家安排'}）。`,at);}
    a.task = { action: clone(action), started: at, ends: at + info.duration * 1000, source, paid: info.cost || 0, growth:planGrowth(s,a,info) };
    if(info.kind==='job'&&!info.productionDays){a.task.shortBasePay=info.pay;if(a.origin==='custom')a.task.contract={earned:payout(a,info)};}
    if(info.productionDays){const template=a.task;const snapshot=clone(a);delete snapshot.task;delete snapshot.queue;delete snapshot.project;snapshot.fatigue=0;snapshot.productionQualityBonus=Math.min(30,DEVELOPMENT.effect('production',s.equipment.production)+(action.creationQuality||0));snapshot.exposureFactor=action.exposure||1;template.contract={earned:payout(snapshot,info),fame:fameGain(snapshot,info),fatigue:fatigueCost(a,info),setback:false,confidenceLoss:confidenceLoss(a),artist:snapshot};const famePlan=longFamePreview(snapshot,info);if(famePlan){template.contract.fameRule='ordinary-long-v1';template.contract.fameUnits=famePlan.units;}a.task=null;a.project={jobId:info.id,days:info.productionDays,done:0,acceptedAt:at,nextAt:at+WORKS.CONFIG.stageMs-5000,segmentMs:5000,assisted:s.cash>=1,template};if(a.project.assisted)s.payroll.stoppedAt=null;log(s,`${a.name}接受「${info.label}」${info.productionDays}日長案；每天日末製作5秒，空檔可接短案。${a.project.assisted?'長案管理開始，公司共用30/分鐘計薪。':'資金不足，先保留合約，管理未啟用。'}`,at);}

    if(source==='assistant'&&info.kind==='train')ROTATION.started(s,a,action.skill);
    MUSIC.consume(s,action);
    DOMAIN_HISTORY.accepted(s,id,action);CHAPTER.started(s,id,action);
    return { ok: true };
  }
  function serviceActive(s){return !!s.assistant.enabled||s.artists.some(a=>a.project?.assisted);}
  function serviceNames(s){return [...(s.assistant.enabled?['一般代排']:[]),...s.artists.filter(a=>a.project?.assisted).map(a=>`${a.name}的長案管理`)];}
  function stopServices(s){s.assistant.enabled=false;for(const a of s.artists)if(a.project?.assisted)pauseProject(s,a.id);log(s,'已停止全部助理服務，不再計薪；长案與製作進度保留，短行程可完成。'.replace('长','長'),s.lastTick);return {ok:true};}
  function projectFatigue(p){return Math.floor(p.template.contract.fatigue*(p.done+1)/p.days)-Math.floor(p.template.contract.fatigue*p.done/p.days);}
  function pauseProject(s,id,at=s.lastTick){const a=person(s,id),p=a?.project;if(!p)return {ok:false,reason:'沒有進行中長案'};p.assisted=false;if(a.task?.projectSegment){p.segmentMs=Math.max(.001,a.task.ends-at);a.task=null;}return {ok:true};}
  function manageProject(s,id,enabled){const a=person(s,id),p=a?.project;if(!p)return {ok:false,reason:'沒有進行中長案'};if(!enabled)return pauseProject(s,id);if(s.cash<1)return {ok:false,reason:'資金不足，請補足後恢復管理'};p.assisted=true;s.payroll.stoppedAt=null;dispatch(s,s.lastTick);return {ok:true};}
  function workProject(s,id,at=s.lastTick,source='manual-project'){const a=person(s,id),p=a?.project;if(!p||a.task)return {ok:false,reason:'請先完成目前活動'};if(at+.001<p.nextAt)return {ok:false,reason:'尚未到下一製作時段'};const limit=Math.min(80,effectiveStrategy(s,a).maxFatigue),cost=projectFatigue(p);if(a.fatigue+cost>limit)return {ok:false,reason:'疲勞偏高，請先休息'};a.task={action:p.template.action.titleRef?clone(p.template.action):{kind:'job',id:p.jobId},started:at,ends:at+p.segmentMs,paid:0,source,growth:clone(p.template.growth),projectSegment:true};return {ok:true};}
  function cancelProject(s,id){const a=person(s,id);if(!a?.project)return {ok:false,reason:'沒有進行中長案'};if(a.task?.projectSegment)a.task=null;CAREER.canceled(s,a.project.template.action.opportunityId);a.project=null;log(s,`${a.name}取消長案；已完成短案成果保留，長案不支付部分報酬。`,s.lastTick);return {ok:true};}
  function projectPhase(a,now){const p=a.project;if(!p)return '';if(a.task?.projectSegment)return '今日製作中';if(a.task?.action.kind==='rest')return '休息後續作';if(a.task)return '目前活動完成後待製作';return now+.001<p.nextAt?'等待下一製作日':p.assisted?'待安排今日製作':'待親自製作／恢復管理';}
  function receptionProjectStatus(a,now){const p=a?.project;if(!p)return '';const title=p.template.action.projectName||JOBS.find(j=>j.id===p.jobId).name;const mode=p.jobId==='radio'?'錄製':p.jobId==='series'?'拍攝':'製作';const phase=a.task?.projectSegment?'製作中':a.task?.action.kind==='rest'?'休息中':a.task?.action.kind==='train'?'訓練中':a.task?'穿插短行程':now+.001<p.nextAt?'等待下一段':p.assisted?'等待安排':'等待親自製作';return `${mode}《${title}》｜已完成${p.done}/${p.days}段｜${phase}`;}
  function currentActivityLabel(a){const current=a.task?taskInfo(a.task).label:'目前無短行程';if(!a.project)return a.task?current:'空閒 · 點擊查看';const p=a.project,name=p.template.action.projectName||JOBS.find(j=>j.id===p.jobId).name;return `${current} · 長案「${name}」${p.done}/${p.days}日 · ${a.task?.projectSegment?'製作中':a.task?.action.kind==='rest'?'休息續作':'待製作'}`;}
  function projectLabel(a,now){const p=a.project;if(!p)return '';const sec=Math.max(0,Math.ceil((p.nextAt-now)/1000));return `${p.template.action.projectName||JOBS.find(j=>j.id===p.jobId).name} · 已製作 ${p.done}/${p.days} 日 · ${projectPhase(a,now)}${sec?` · 下段 ${Math.floor(sec/60)}分${sec%60}秒`:''} · ${p.assisted?'長案管理中／公司計薪中':'長案管理已暫停'}`;}
  function productionProgress(task,now){const p=task?.production;if(!p)return null;const resting=p.rest?clamp(now-p.rest.started,0,ACTION_SECONDS*1000):0,elapsed=clamp(now-task.started-p.restedMs-resting,0,p.totalMs),stepped=Math.min(p.totalMs,Math.floor(elapsed/5000)*5000);return {days:p.days,done:stepped/WORKS.CONFIG.stageMs,remaining:Math.max(0,p.totalMs-stepped),percent:stepped/p.totalMs*100,resting:!!p.rest};}
  function taskCountdown(task,now){const p=productionProgress(task,now);if(!p)return Math.max(0,Math.ceil((task.ends-now)/1000))+' 秒';const sec=Math.ceil(p.remaining/1000);return `${p.resting?'休息後自動續作 · ':''}製作 ${p.done.toFixed(2)} / ${p.days} 日 · 剩 ${Math.floor(sec/60)} 分 ${sec%60} 秒`;}
  function restProduction(s,id){const a=person(s,id),t=a?.task,p=t?.production;if(!p||p.rest)return {ok:false,reason:'目前沒有可休息續作的製作案'};p.rest={started:s.lastTick,ends:s.lastTick+ACTION_SECONDS*1000};t.ends+=ACTION_SECONDS*1000;log(s,`${a.name}製作中休息5秒，保留進度並自動續作。`,s.lastTick);return {ok:true};}
  function enqueue(s, id, action) {
    const a = person(s, id);
    if((a?.project||a?.queue.some(q=>actionInfo(q)?.productionDays))&&actionInfo(action)?.productionDays)return {ok:false,reason:'每位藝人同時只能有一件長案'};
    if (!a || !actionInfo(action)) return { ok: false, reason: '無效行程' };
    if (!a.task && !a.queue.length) return start(s, id, action);
    if (a.queue.length >= 3) return { ok: false, reason: '待辦行程最多 3 項' };
    if(action.kind==='job'&&(a.task?.action.id===action.id||a.queue.some(q=>q.kind==='job'&&q.id===action.id)))return {ok:false,reason:'相同行程已在安排中'};
    if ((a.task && JSON.stringify(a.task.action) === JSON.stringify(action)) || a.queue.some(q => JSON.stringify(q) === JSON.stringify(action))) return { ok: false, reason: '相同行程已在安排中' };
    if(action.offerId && !action.titleRef && MUSIC.get(s,action.id)?.id!==action.offerId)return {ok:false,reason:"這份音樂洽談已被接受，請查看新洽談。"};
    action=REVENUE.mark(s,MUSIC.freeze(s,action));a.queue.push(clone(action));MUSIC.consume(s,action);
    if(!canStart(s,{...a,task:null},action))DOMAIN_HISTORY.accepted(s,id,action);
    return { ok: true };
  }
  function cancel(s, id) {
    const a = person(s, id);
    if (!a || !a.task) return false;
    if(a.task.projectSegment){pauseProject(s,id);return true;}
    s.cash += a.task.paid;
    if (a.task.action.kind === 'special') {
      const e = a.task.action.event;
      s.resolvedEvents = s.resolvedEvents.filter(id => id !== e.id);
      s.events.push(clone(e));
    }
    log(s, `${a.name}取消「${taskInfo(a.task).label}」；未結算報酬與疲勞，訓練費退回。`, s.lastTick);
    if(a.task.action.kind==='special'){const o=s.career.offers.find(o=>o.id===a.task.action.event.id);if(o)o.status='pending';}else CAREER.canceled(s,a.task.action.opportunityId);a.task = null;
    return true;
  }
  function removeQueue(s, id, index) { const a = person(s, id); if (a && Number.isInteger(index) && index >= 0) a.queue.splice(index, 1); }
  function assistantFunds(s, at) {
    if(!s.artists.length){s.assistant.enabled=false;return false;}
    if(serviceActive(s)&&s.cash<1){s.assistant.enabled=false;for(const a of s.artists)if(a.project?.assisted)pauseProject(s,a.id,at);s.payroll.stoppedAt=at;log(s,'助理服務暫停：資金不足。一般代排與長案管理均停止，合約與進度保留，補足後請手動恢復。',at);}
    return serviceActive(s);
  }
  function setAssistant(s, enabled) {
    s.assistant.enabled = !!enabled;
    if (enabled) s.payroll.stoppedAt = null;
    assistantFunds(s, s.lastTick);
    return s.assistant.enabled;
  }
  function setSalary(s, rate) {
    if (Number(rate) !== SALARY_RATE) return false;
    s.payroll.rate = SALARY_RATE; return true;
  }
  function settings(s, input) {
    const priority = input.priority;
    if (!Array.isArray(priority) || priority.length !== 3 || new Set(priority).size !== 3 || priority.some(t => !TYPES[t])) return false;
    s.assistant = { enabled: !!input.enabled, mode: input.mode === 'train' ? 'train' : 'work', priority: [...priority], minPay: clamp(Number(input.minPay) || 0, 0, 100000), maxFatigue: clamp(Number(input.maxFatigue) || 30, 30, 100), fallback: input.fallback === 'rest' ? 'rest' : 'train', trainSkill: SKILLS[input.trainSkill] ? input.trainSkill : 'sing' };
    return true;
  }
  const STRATEGY_FIELDS=['mode','priority','minPay','maxFatigue','fallback','trainSkill'];
  const DEFAULT_STRATEGY=Object.freeze({mode:'work',priority:Object.freeze(['music','drama','ad']),minPay:0,maxFatigue:70,fallback:'train',trainSkill:'sing'});
  function strategySnapshot(c){return Object.fromEntries(STRATEGY_FIELDS.map(k=>[k,k==='priority'?[...c[k]]:c[k]]));}
  function effectiveStrategy(s,a){return {...strategySnapshot(a?.assistantStrategy||DEFAULT_STRATEGY),enabled:s.assistant.enabled};}
  function setArtistStrategy(s,id,input){const a=person(s,id);if(!a)return false;if(!input||typeof input!=='object'||Array.isArray(input))return false;if(Object.hasOwn(input,'trainSkills')&&!ROTATION.valid(input.trainSkills))return false;const skills=Object.hasOwn(input,'trainSkills')?input.trainSkills:Object.hasOwn(input,'trainSkill')?[input.trainSkill]:null;if(skills&&!ROTATION.valid(skills))return false;const temp={};if(!settings(temp,{...effectiveStrategy(s,a),...input,...(skills?{trainSkill:skills[0]}:{}),enabled:s.assistant.enabled}))return false;if(skills)ROTATION.set(s,a,skills);a.assistantStrategy=strategySnapshot(temp.assistant);return true;}
  function nextAction(s, a) {
    const cfg = effectiveStrategy(s,a);
    const skill=ROTATION.next(s,a),train = { kind: 'train', skill };
    const trainOrRest = () => a.fatigue < 60 && skill && a[skill] < STAT_CAP && !canStart(s, a, train, true) ? train : { kind: 'rest' };
    if (cfg.mode === 'train') return trainOrRest();
    // Fatigue cap applies to the projected fatigue after completing the job.
    for (const type of cfg.priority) {
      const offers = JOBS.filter(j => j.type === type && payout(a, j) >= cfg.minPay && !canStart(s, a, { kind: 'job', id: j.id }, true)).sort((x, y) => payout(a, y) / y.duration - payout(a, x) / x.duration);
      if (offers.length) return { kind: 'job', id: offers[0].id };
    }
    return cfg.fallback === 'train' ? trainOrRest() : { kind: 'rest' };
  }
  function dispatch(s, at) {
    assistantFunds(s, at);
    for (const a of s.artists) {
      if (a.task) continue;
      const p=a.project;
      if(p?.assisted&&at+.001>=p.nextAt){if(a.fatigue+projectFatigue(p)>Math.min(80,effectiveStrategy(s,a).maxFatigue))start(s,a.id,{kind:'rest'},at,'project-assistant');else workProject(s,a.id,at,'project-assistant');if(a.task)continue;}
      // Explicit player schedules always take priority. Invalid queued items are reported.
      while (a.queue.length && !a.task) {
        const action = a.queue.shift();
        const r = start(s, a.id, action, at, 'queue');
        if (!r.ok) log(s, `${a.name}略過「${actionInfo(action).label}」：${r.reason}`, at);
      }
      if (!a.task && s.assistant.enabled && assistantFunds(s, at)) start(s, a.id, nextAction(s, a), at, 'assistant');
      if(!a.task&&a.project&&s.assistant.enabled&&assistantFunds(s,at))start(s,a.id,nextAction(s,a),at,'assistant');
    }
    assistantFunds(s, at);
  }
  function unlock(s,at,offline=false){CAREER.check(s,at,offline);}
  function canDecide(s,eventId,artistId){
    const e=s.events.find(e=>e.id===eventId);if(!e)return {ok:false,reason:'機會已處理'};
    if(artistId!==e.artistId)return {ok:false,reason:'這是指定藝人邀約，不能轉派。'};
    const a=person(s,e.artistId);if(!a||a.task||(e.record&&a.project))return {ok:false,reason:'指定藝人正在忙碌，請先完成目前行程。'};
    if(!CAREER.eligible(a,e))return {ok:false,reason:`需已出道、個人名氣 ${e.fameMin}、${SKILLS[e.skill]} ${e.min}、自信40。`};
    if(e.record){const reason=canStart(s,a,{kind:'job',id:'radio'});if(reason)return {ok:false,reason};}
    else if(a.fatigue+fatigueCost(a,{...e,kind:'special'})>100)return {ok:false,reason:'疲勞太高，請先休息'};
    return {ok:true};
  }
  function decide(s,eventId,artistId,accept){
    const e=s.events.find(e=>e.id===eventId);if(!e)return {ok:false,reason:'機會已處理'};
    if(accept){const eligibility=canDecide(s,eventId,artistId);if(!eligibility.ok)return eligibility;const a=person(s,e.artistId);
      if(e.record){const r=start(s,a.id,{kind:'job',id:'radio',projectName:e.title,projectDesc:e.desc,workInstance:e.workInstance,titleRef:e.titleRef,opportunityId:e.id,payOverride:e.pay,exposure:e.exposure});if(!r.ok)return r;a.project.template.contract.fame=fameGain(a,{...JOBS.find(j=>j.id==='radio'),fame:e.fame,fameExempt:true});}
      else{a.task={action:{kind:'special',event:clone(e)},started:s.lastTick,ends:s.lastTick+5000,source:'manual',paid:0,growth:planGrowth(s,a,{...e,kind:'special'})};}
      CAREER.accepted(s,e);if(!s.resolvedEvents.includes(e.id))s.resolvedEvents.push(e.id);
    }else CAREER.declined(s,e);
    s.events=s.events.filter(x=>x.id!==eventId);log(s,`${accept?'接受':'婉拒'}${e.artistName}的指名邀約「${e.title}」${accept?'':'；五分鐘後每五分鐘35%機率同名同人重邀，最多加價50%。'}`,s.lastTick);return {ok:true};
  }
  function originalChoice(s,id,choice){return CAREER.ideaChoice(s,id,choice);}
  function launchOriginal(s,id,title){const i=s.career.ideas.find(i=>i.id===id),a=person(s,i?.artistId);if(!i||i.status!=='ready'||!a)return {ok:false,reason:'創作準備尚未完成'};const named=title===undefined?{ok:true,title:i.title}:CAREER.titleValue(i,title);if(!named.ok)return named;const r=start(s,a.id,{kind:'job',id:'radio',projectName:named.title,projectDesc:i.desc,workInstance:i.instance,opportunityId:i.id,creationQuality:i.qualityBonus});if(r.ok){if(title!==undefined)i.suggestedTitle??=i.title;i.title=named.title;i.status='producing';}return r;}
  function taskInfo(task) { return task.action.kind === 'special' ? { ...task.action.event, kind: 'special', label: task.action.event.title } : actionInfo(task.action); }
  function complete(s, a, at, summary) {
    const t = a.task, info = taskInfo(t);
    if(t.projectSegment){const p=a.project;a.task=null;a.fatigue=clamp(a.fatigue+projectFatigue(p),0,100);p.done++;p.segmentMs=5000;summary.projectDays=(summary.projectDays||0)+1;log(s,`${a.name}完成「${info.label}」第${p.done}/${p.days}日製作；尚未整件交付不發報酬。`,at);if(p.done<p.days){p.nextAt=Math.max(p.nextAt+WORKS.CONFIG.stageMs,at+WORKS.CONFIG.stageMs-5000);return;}const final=clone(p.template);final.contract.fatigue=0;a.project=null;a.task=final;complete(s,a,at,summary);return;}
    a.task = null;
    if (info.kind === 'job' || info.kind === 'special') {
      const shortFame=shortFamePreview(a,info),longFame=t.contract?.fameRule==='ordinary-long-v1'?longFameAward(a,t.contract.fameUnits):null;
      const gross = t.contract?.earned ?? payout(a, t.shortBasePay===undefined?info:{...info,pay:t.shortBasePay}), shortOffline=summary.offline&&info.kind==='job'&&!info.productionDays;
      const earned = shortOffline?Math.round(gross*OFFLINE_SHORT_FACTOR):gross, fame = Math.min(STAT_CAP-a.fame,longFame?.gain ?? t.contract?.fame ?? fameGain(a, info)), fatigue = t.contract?.fatigue ?? fatigueCost(a, info), setback = t.contract?.setback ?? isSetback(a, info), setbackLoss = t.contract?.confidenceLoss ?? confidenceLoss(a);
      if(shortOffline){summary.shortJobs++;summary.shortGross+=gross;summary.shortEarned+=earned;summary.shortDiscount+=gross-earned;}
      if (info.kind==='job' && WORKS.JOB_KINDS[info.id]) { const work=WORKS.create(s,t.contract?.artist||a,{...info,workInstance:t.action.workInstance,playbackRevenueRule:t.action.playbackRevenueRule},at,setback);FIRST_STORY.record(s,work);log(s,`${a.name}的${work.kind==='music'?'音樂':work.kind==='drama'?'戲劇':'封面'}作品「${work.title}」推出，品質 ${work.quality}，七階段熱度開始。`,at); }
      MUSIC.complete(s,t.action.titleRef||t.action.event?.titleRef,a,at,earned);
      const rep=REPUTATION_GAIN[info.kindId||info.id]||0;s.companyReputation+=rep;summary.reputation=(summary.reputation||0)+rep;
      s.cash += earned; s.totalEarned += earned; s.totalJobs++; a.fame += fame;if(shortFame)a.shortFameUnits=shortFame.unitsAfter;if(longFame)a.longFameUnits=longFame.unitsAfter;if(a.fame>=STAT_CAP){a.shortFameUnits=0;a.longFameUnits=0;}
      const plan=t.growth,development=DEVELOPMENT.apply(s,a,plan),actual=development.gain;summary.growth[plan.skill]+=actual;
      const growth=[`${SKILLS[plan.skill]} +${actual}（基礎 ${plan.base}、效率 ${plan.efficiency*100}%、下點進度 ${Math.floor(development.progress*100)}%）`];
      summary.growth.fame += fame;
      summary.outcomes.push({id:a.id,kind:info.kind,result:setback?'defeat':'cheer',at});
      summary.earned += earned; summary.jobs++; summary.fame += fame;
      if (setback) { const loss = Math.min(a.confidence, setbackLoss); a.confidence = clamp(a.confidence - loss, 0, STAT_CAP); summary.growth.confidence -= loss; log(s, `${a.name}在大型通告中因疲勞失誤：報酬 80%、名氣 50%，自信 -${loss}（自信越高，挫折影響越小）。`, at); }
      log(s, `${a.name}完成「${info.label}」 +$${earned} / 名氣 +${fame}${shortFame?`（短案累積 +${shortFame.amount}，下點 ${a.shortFameUnits/10}%）`:""}${longFame?`（長作累積 +${t.contract.fameUnits/LONG_FAME.unit}，下點 ${a.longFameUnits/10}%）`:""} / 公司知名度 +${rep} / ${growth.join('、')}`, at);
      if(shortOffline)log(s,`離線短案70%：含藝人條件原額 $${gross} → $${earned}，一次折扣並四捨五入。`,at);
      CAREER.finished(s,t.action.opportunityId||t.action.event?.id,at);if(info.kind==='special'){s.career.completedWorks??=[];s.career.completedWorks.push({id:info.workInstance||info.id,artistId:a.id,artistName:a.name,title:info.title,desc:info.desc,kind:info.kindId==='lead'?'movie':'brand',at,earned});}
      a.fatigue = clamp(a.fatigue + fatigue, 0, 100);const pr=PUBLICITY.completed(s,a,at,info,summary.offline);if(pr)log(s,`${a.name}遇到公關事件，等待經紀人選擇；行程照常繼續。`,at);
    } else if(info.kind==='compose'){const i=CAREER.prepare(s,a,info.ideaId);a.fatigue=clamp(a.fatigue+fatigueCost(a,info),0,100);const g=DEVELOPMENT.apply(s,a,t.growth);summary.growth.intellect+=g.gain;log(s,`${a.name}完成一次寫詞／作曲準備：${i?.progress||0}/100；才智 +${g.gain}。`,at);
    } else if (info.kind === 'train') {
      CHAPTER.trained(s,a);
      const preview=t.growth, fatigue = fatigueCost(a, info), failed=preview.failed;
      const development=DEVELOPMENT.apply(s,a,preview,true),gain=development.gain; summary.training++; summary.growth[info.skill] += gain;
      summary.outcomes.push({id:a.id,kind:'train',result:failed?'defeat':'cheer',at});
      if (failed) summary.failedTraining++;
      a.fatigue = clamp(a.fatigue + fatigue, 0, 100);
      log(s, `${a.name}完成${info.label}，${SKILLS[info.skill]} +${gain}${failed ? `（${preview.efficiency===.25?'高疲勞，':''}訓練失敗；能力與累積進度保留，費用與疲勞照常計算）` : `（效率 ${preview.efficiency * 100}%、下點進度 ${Math.floor(development.progress*100)}%${gain===0?(a[info.skill]>=STAT_CAP?"；已達上限，非訓練失敗":"；累積中，非訓練失敗"):""}）`}`, at);
    }
    else { const recovered = Math.min(a.fatigue, 45); a.fatigue = clamp(a.fatigue - 45, 0, 100); summary.rests++; log(s, `${a.name}休息完畢，疲勞 -${recovered}`, at); }
    unlock(s, at,summary.offline);
  }
  function advance(s, now = Date.now(), offline = false) {
    const elapsed = Math.max(0, now - s.lastTick);
    const simulated = Math.min(elapsed, OFFLINE_CAP), target = s.lastTick + simulated;
    const summary = { offline:!!offline, shortGross:0,shortEarned:0,shortDiscount:0,shortJobs:0, views:0, fans:0, workStages:0, outcomes: [], elapsed, simulated, capped: elapsed > OFFLINE_CAP, earned: 0, salary: 0, jobs: 0, training: 0, failedTraining: 0, rests: 0, fame: 0, net: 0, growth: Object.fromEntries([...Object.keys(SKILLS), 'fame'].map(k => [k, 0])) };
    const before = s.cash, existingWorks=s.works.length;
    const priorSpecial=(s.career.completedWorks||[]).length, priorGrowth=s.artists.map(a=>({id:a.id,stats:Object.fromEntries(Object.keys(SKILLS).map(k=>[k,a[k]])),progress:clone(a.growthProgress||{})}));
    REVENUE.beginAdvance(s,offline);
    dispatch(s, s.lastTick);
    let cursor = s.lastTick;
    while (cursor < target) {
      const rate = SALARY_RATE / 60;
      const payday = serviceActive(s) ? cursor + Math.ceil((1000 - s.payroll.remainder) / rate) : Infinity;
      const next = Math.min(target, payday, REVENUE.nextAt(s,s.lastTick,existingWorks), ...s.artists.filter(a => a.task).flatMap(a => [a.task.ends,a.task.production?.rest?.ends??Infinity]),...s.artists.filter(a=>!a.task&&a.project?.assisted&&a.project.nextAt>cursor+.001).map(a=>a.project.nextAt));
      const chargingServices=serviceNames(s).join('、');
      if (serviceActive(s)) { s.payroll.activeMs += next - cursor; s.payroll.remainder += (next - cursor) * rate; }
      if(!s.rivalGrowth?.skipFirstAdvance)RIVALS.advance(s,next-cursor);
      cursor = next;
      for(const a of s.artists){const p=a.task?.production;if(p?.rest&&p.rest.ends<=cursor){p.restedMs+=ACTION_SECONDS*1000;p.rest=null;a.fatigue=clamp(a.fatigue-45,0,100);summary.rests++;log(s,`${a.name}休息完成，繼續製作。`,cursor);}}
      for (const a of s.artists) if (a.task && a.task.ends <= cursor) complete(s, a, cursor, summary);
      REVENUE.payDue(s,cursor,s.lastTick,existingWorks,summary);
      const salary = Math.floor(s.payroll.remainder / 1000);
      if (salary) { const paid = Math.min(s.cash, salary); s.cash -= paid; s.payroll.paid += paid; summary.salary += paid;if(paid)s.payroll.lastCharge={at:cursor,amount:paid,rate:SALARY_RATE,services:chargingServices||'剛完成的助理服務'}; s.payroll.remainder %= 1000; }
      dispatch(s, cursor);
    }
    if(s.rivalGrowth)s.rivalGrowth.skipFirstAdvance=false;
    WORKS.advance(s,simulated,summary,{existing:existingWorks,target});
    for(const p of summary.playbackPayments||[])log(s,`「${p.title}」七天播放收益一次結算 +$${p.amount}（作品 #${p.workId}）。`,p.at);
    // Excluded offline time shifts active tasks forward rather than granting a second catch-up.
    const skipped = elapsed - simulated;
    if (skipped) for (const a of s.artists) if (a.task) { a.task.started += skipped; a.task.ends += skipped;if(a.task.production?.rest){a.task.production.rest.started+=skipped;a.task.production.rest.ends+=skipped;} }
    if(skipped)for(const a of s.artists)if(a.project)a.project.nextAt+=skipped;
    s.lastTick = Math.max(now, s.lastTick);CHAPTER.scan(s);
    summary.net = s.cash - before;
    summary.cashBefore=before;summary.cashAfter=s.cash;summary.trainingCosts=Math.max(0,summary.earned+(summary.playbackEarned||0)-summary.salary-summary.net);
    summary.completedWorks=[...s.works.slice(existingWorks),...(s.career.completedWorks||[]).slice(priorSpecial)].map(w=>({title:w.title,artistName:w.artistName,kind:w.kind}));
    summary.artistGrowth=s.artists.map(a=>{const prior=priorGrowth.find(x=>x.id===a.id);return {id:a.id,name:a.name,skills:Object.keys(SKILLS).map(k=>({key:k,gain:a[k]-(prior?.stats[k]??a[k]),before:prior?.progress[k]||0,after:a.growthProgress?.[k]||0})).filter(x=>x.gain||Math.abs(x.after-x.before)>1e-8)};}).filter(x=>x.skills.length);
    summary.pending={publicity:s.publicity.pending?1:0,invitations:s.events.length,originals:s.career.ideas.filter(i=>['pending','revision','ready'].includes(i.status)).length};
    if (offline || elapsed > 5000) summary.outcomes=[];
    if (offline && elapsed >= 5000) s.report = summary;
    REVENUE.endAdvance(s);
    return summary;
  }
  function save(s) { return JSON.stringify(WORKS.encode(s)); }
  function restore(raw) {
    const s = WORKS.decode(JSON.parse(raw));
    const finite = (x, lo = 0, hi = Number.MAX_SAFE_INTEGER) => typeof x === 'number' && Number.isFinite(x) && x >= lo && x <= hi;
    // v1 was an already-working roster. Preserve careers, all stats and active jobs.
    const oldVersion = s?.version, oldRate=s?.payroll?.rate, knownFirstSign=typeof s?.hasEverSigned==='boolean';
    if (s && [1,2,3,4,5,6].includes(oldVersion)) {
      if (!Array.isArray(s.artists) || s.artists.length > MAX_ARTISTS || !finite(s.cash) || !Array.isArray(s.events) || !Array.isArray(s.resolvedEvents)) throw new Error('舊存檔資料損壞');
      let refund=0;
      for (const a of s.artists) {
        if (a.task?.action?.kind==='train' && finite(a.task.paid,0,120)) refund+=a.task.paid;
        if (a.task?.action?.kind==='special') {
          const e=a.task.action.event;
          if(e && !s.events.some(x=>x.id===e.id)){s.events.push(e);s.resolvedEvents=s.resolvedEvents.filter(id=>id!==e.id);}
        }
      }
      s.cash+=refund;s.artists=[];
      if(s.assistant)s.assistant.enabled=false;
      s.log=[{at:s.lastTick,text:'已切換明星志願藝人名單：原創藝人及排程已移除，公司資金與累計進度保留。未完成訓練退款 $'+refund+'；請重新招募。'}];
      s.migrationNotice='原創藝人與排程已移除；公司資金、累計收入／通告與重大邀約保留，未完成訓練已退款。助理暫停，請重新招募明星志願藝人。原存檔可由「升級前備份」匯出。';
      if(oldVersion>=5)s.version=VERSION;
    }
    if (s && [1, 2].includes(s.version) && Array.isArray(s.artists)) {
      s.artists.forEach((a, i) => {
        for (const skill of Object.keys(SKILLS)) if (a[skill] === undefined) a[skill] = skill === 'movement' && finite(a.dance, 0, STAT_CAP) ? a.dance : skill === 'poise' && finite(a.stage, 0, STAT_CAP) ? a.stage : PEOPLE[i]?.[skill] || 20;
        if (finite(a.fame)) a.fame = Math.min(STAT_CAP, a.fame);
        if (s.version === 1) a.debuted = true;
        delete a.dance; delete a.stage;
        for (const action of [...(a.queue || []), a.task?.action].filter(Boolean)) if (action.kind === 'train') { if (action.skill === 'dance') action.skill = 'movement'; if (action.skill === 'stage') action.skill = 'poise'; }
      });
      if (s.assistant?.trainSkill === 'dance') s.assistant.trainSkill = 'movement';
      if (s.assistant?.trainSkill === 'stage') s.assistant.trainSkill = 'poise';
      s.version = VERSION;
    }
    if (s && [1, 2, 3].includes(oldVersion)) {
      // Paid assistance is a new opt-in contract; never charge legacy offline time.
      s.version = VERSION; s.payroll = { rate: SALARY_RATE, paid: 0, activeMs: 0, remainder: 0, stoppedAt: null };
      if (s.assistant) s.assistant.enabled = false;
    }
    if (s && oldVersion === 4 && s.payroll && [60,120,180].includes(s.payroll.rate)) { s.version = VERSION; s.payroll.rate = SALARY_RATE; }
    if (s && oldVersion === 5) s.version = VERSION;
    if (s && oldVersion <= 7 && s.payroll && [60,180].includes(s.payroll.rate)) {
      s.version=VERSION;s.payroll.rate=SALARY_RATE;
      s.migrationNotice=(s.migrationNotice||'')+' 助理薪資已調整為每 60 秒服務時間 $30。藝人、行程與資金保留。';
    }
    if (s && [8,9,10,11,12,13,14,15,16,17,18].includes(oldVersion)) s.version = VERSION;
    if(s && oldVersion<=9){WORKS.init(s);s.capacity=Math.max(1,s.artists.length);if(Array.isArray(s.candidates)){s.candidates=[...new Set(s.candidates)].filter(id=>!s.artists.some(a=>a.id===id)).slice(0,CANDIDATE_COUNT);}s.migrationNotice=(s.migrationNotice||'')+' 新版每批候選改為兩位，保留原名單前兩位；已簽藝人與刷新次數不變，名額至少保留至現有藝人人數；可於作品頁繼續擴充。作品／粉絲從新完成的廣告開始累計，不追溯虛構舊作品。';}
    if (s && !Array.isArray(s.candidates) && oldVersion <= 7) {s.candidateRng=(s.lastTick>>>0)||1;refreshCandidates(s);}
    if (s && s.rng === undefined) s.rng = 123456789;
    if(s && oldVersion<=12 && s.growthRng===undefined)s.growthRng=((s.rng>>>0)^362436069)>>>0;
    if(s&&oldVersion<=19){s.version=VERSION;const known=[...(s.works||[]),...(s.archivedWorks||[])];s.companyReputation=known.reduce((n,w)=>n+(REPUTATION_GAIN[w.jobId]||0),0);s.migrationNotice=(s.migrationNotice||'')+' 公司知名度為獨立永久數值；舊檔僅依可核對的已完成作品逐件補記，不以收入、個人名氣或不完整日誌推造短案。既有名額不回收。';}
    if(s&&oldVersion<=20){s.version=VERSION;if(s.payroll){if(oldRate!==undefined&&![30,60,120,180].includes(oldRate))throw new Error('舊薪資資料損壞');s.payroll.remainder*=SALARY_RATE/(oldRate||SALARY_RATE);s.payroll.rate=SALARY_RATE;}s.migrationNotice=(s.migrationNotice||'')+' 助理費改為公司共用30/現實60秒（初版）。歷史已付薪資保留，不退款不追收；未扣款的零碎服務時間按新費率接續。';}
    if(s&&oldVersion<=26){s.version=VERSION;for(const a of s.artists||[])if(a.task?.action?.kind==='job'&&({cafe:360,short:420,local:330})[a.task.action.id]&&a.task.shortBasePay===undefined)a.task.shortBasePay=({cafe:360,short:420,local:330})[a.task.action.id];}
    if(s&&[27,28,29,30].includes(oldVersion))s.version=VERSION;
    if(s&&oldVersion<=30){s.customRegistry=[];s.customSerial=0;}
    if(s)CUSTOM.validate(s);
    if(s&&s.customRecruitCardUsed===undefined)s.customRecruitCardUsed=s.customRegistry.length>0;
    if(s&&(typeof s.customRecruitCardUsed!=='boolean'||(!s.customRecruitCardUsed&&s.customRegistry.length>0)))throw new Error('自創候選卡紀錄損壞');
    if(s?.payroll&&s.payroll.lastCharge===undefined)s.payroll.lastCharge=null;
    if(!s||!Number.isSafeInteger(s.companyReputation)||s.companyReputation<0)throw new Error('公司知名度資料損壞');
    if (!s || !Number.isInteger(s.growthRng) || !finite(s.growthRng,0,4294967295) || s.version !== VERSION || !finite(s.cash) || !finite(s.totalEarned) || !finite(s.totalJobs) || !finite(s.lastTick) || !finite(s.startedAt) || !Array.isArray(s.artists) || s.artists.length > MAX_ARTISTS || !Number.isInteger(s.capacity) || s.capacity<1 || s.capacity>3 || s.artists.length>s.capacity || new Set(s.artists.map(a=>a.id)).size !== s.artists.length) throw new Error('存檔格式不相容');
    if (!Array.isArray(s.events) || !Array.isArray(s.resolvedEvents) || !Array.isArray(s.log)) throw new Error('存檔缺少資料');
    const validEvent = e => e && (['lead', 'contract'].includes(e.id)||/^invite-[1-9][0-9]*$/.test(e.id)) && typeof e.title === 'string' && typeof e.desc === 'string' && finite(e.pay, 0, 10000) && finite(e.fame, 0, 100) && finite(e.fatigue, 0, 100) && finite(e.duration, 1, 120) && finite(e.min, 0, 999) && ['sing', 'act','poise'].includes(e.skill);
    if (s.events.length > 12 || !s.events.every(validEvent) || !s.resolvedEvents.every(e => (['lead', 'contract'].includes(e)||/^invite-[1-9][0-9]*$/.test(e)))) throw new Error('重大事件資料損壞');
    s.artists.forEach((a, i) => {
      const identity = catalog(s).find(p=>p.id===a.id);
      if(s.independentStrategies===1&&a.assistantStrategy===undefined)throw new Error('缺少藝人獨立策略');
      if(a.assistantStrategy!==undefined){const c=a.assistantStrategy;if(!c||typeof c!=='object'||Array.isArray(c)||Object.keys(c).length!==STRATEGY_FIELDS.length||!STRATEGY_FIELDS.every(k=>Object.hasOwn(c,k))||!['work','train'].includes(c.mode)||!['train','rest'].includes(c.fallback)||!SKILLS[c.trainSkill]||!finite(c.minPay,0,100000)||!finite(c.maxFatigue,30,100)||!Array.isArray(c.priority)||c.priority.length!==3||new Set(c.priority).size!==3||c.priority.some(t=>!TYPES[t]))throw new Error('藝人個別助理策略損壞');}
      if(oldVersion<=29)a.longFameUnits=0;
      if(!Number.isInteger(a.longFameUnits)||a.longFameUnits<0||a.longFameUnits>=LONG_FAME.unit)throw new Error('長作名氣累積資料損壞');
      if(oldVersion<=28)a.shortFameUnits=0;
      if(!Number.isInteger(a.shortFameUnits)||a.shortFameUnits<0||a.shortFameUnits>=SHORT_FAME.unit)throw new Error('短案名氣累積資料損壞');
       if(a.contractFee===undefined&&oldVersion<=8){a.contractFee=LEGACY_RECRUIT_COST;s.migrationNotice=(s.migrationNotice||'')+` ${identity?.name||a.id}的舊檔缺少實付簽約金，依舊版固定價補記 $300；沒有扣款。解約金仍為原實付的 50%。`;}
      if(!finite(a.contractFee,0,100000)||!Number.isInteger(a.contractFee))throw new Error('簽約費資料損壞');
      if (!identity || typeof a.debuted !== 'boolean' || ![...Object.keys(SKILLS), 'fame', 'fatigue'].every(k => finite(a[k], 0, k === 'fatigue' ? 100 : STAT_CAP)) || !Array.isArray(a.queue) || a.queue.length > 3 || !a.queue.every(actionInfo)) throw new Error('藝人資料損壞');
      if (a.task && (!finite(a.task.started) || !finite(a.task.ends) || a.task.ends <= s.lastTick || a.task.ends - a.task.started > 604800000 || a.task.ends <= a.task.started || !finite(a.task.paid, 0, 120) || !(a.task.action?.kind === 'special' ? validEvent(a.task.action.event) : actionInfo(a.task.action)))) throw new Error('行程資料損壞');
      if(a.task&&oldVersion<=11){
        const oldMs=a.task.ends-a.task.started,done=clamp((s.lastTick-a.task.started)/oldMs,0,1);
        a.task.started=s.lastTick-Math.min(ACTION_SECONDS*1000-1,Math.floor(done*ACTION_SECONDS*1000));
        a.task.ends=a.task.started+ACTION_SECONDS*1000;
        if(a.task.action.kind==='special')a.task.action.event.duration=ACTION_SECONDS;
      }
      if(a.task){const t=a.task,info=taskInfo(t);if(a.origin==='custom'&&info.kind==='job'&&!info.productionDays&&t.contract&&!finite(t.contract.earned,0,100000))throw new Error('自創短案約定金額損壞');if(t.shortBasePay!==undefined&&(!['cafe','short','local'].includes(t.action.id)||!finite(t.shortBasePay,0,100000)))throw new Error('短案約定報酬資料損壞');if(oldVersion<=16&&info.productionDays&&!t.production)t.legacyShort=true;
        if(t.production){const p=t.production,c=t.contract,rest=p.rest,expected=PRODUCTION_DAYS[t.action.id];if(t.action.kind!=='job'||p.days!==expected||(p.totalMs!==WORKS.CONFIG.stageMs*expected&&!(oldVersion<=18&&[600000/7*expected,1800000/7*expected].includes(p.totalMs)))||!Number.isSafeInteger(p.restedMs)||p.restedMs<0||p.restedMs%5000||p.restedMs>604800000||(rest&&(!finite(rest.started)||!finite(rest.ends)||rest.ends-rest.started!==5000||rest.started>s.lastTick||rest.ends<=s.lastTick))||Math.abs(t.ends-t.started-p.totalMs-p.restedMs-(rest?5000:0))>.01||!c||!finite(c.earned,0,100000)||!finite(c.fame,0,100)||!finite(c.fatigue,0,100)||typeof c.setback!=='boolean'||!finite(c.confidenceLoss,0,100)||c.artist?.id!==a.id||![...Object.keys(SKILLS),'fame'].every(k=>finite(c.artist[k],0,999)))throw new Error('製作進度或約定報酬資料損壞');
        }else if(t.projectSegment?(!a.project||t.action.id!==a.project.jobId||t.ends-t.started>5000.001):(Math.abs(t.ends-t.started-ACTION_SECONDS*1000)>.001||(info.productionDays&&t.legacyShort!==true)))throw new Error('行程時長資料損壞');
      }
      if(a.task){const info=taskInfo(a.task);if(oldVersion<=12 && a.task.growth===undefined)a.task.growth=planGrowth(s,a,info);if(!validGrowth(a.task.growth,info))throw new Error('行程成長資料損壞');}
      if(oldVersion<=18&&a.task?.production){const t=a.task,p=t.production,restElapsed=p.rest?clamp(s.lastTick-p.rest.started,0,5000):0,ratio=clamp((s.lastTick-t.started-p.restedMs-restElapsed)/p.totalMs,0,1);p.totalMs=WORKS.CONFIG.stageMs*p.days;t.started=s.lastTick-ratio*p.totalMs-p.restedMs-restElapsed;t.ends=t.started+p.totalMs+p.restedMs+(p.rest?5000:0);}
      if(oldVersion<=18&&a.task?.production){const t=a.task,p=t.production,rest=p.rest,restElapsed=rest?clamp(s.lastTick-rest.started,0,5000):0,progress=clamp((s.lastTick-t.started-p.restedMs-restElapsed)/p.totalMs*p.days,0,p.days-.000000001),done=Math.floor(progress),fraction=progress-done,segmentMs=Math.max(.001,5000*(1-fraction)),template=clone(t);delete template.production;delete template.legacyShort;a.project={jobId:t.action.id,days:p.days,done,acceptedAt:t.started,nextAt:s.lastTick+(rest?rest.ends-s.lastTick:0)+(1-fraction)*WORKS.CONFIG.stageMs-segmentMs,segmentMs,assisted:s.cash>=1,template};a.task=rest?{action:{kind:'rest'},started:rest.started,ends:rest.ends,paid:0,source:'project-assistant',growth:null}:null;}
      if(oldVersion>=19&&oldVersion<=21&&a.project&&!a.task?.projectSegment&&a.project.nextAt>s.lastTick){const p=a.project;p.nextAt=s.lastTick+Math.max(0,(p.nextAt-s.lastTick+p.segmentMs)/2-p.segmentMs);}
      if(a.project){const p=a.project,c=p.template?.contract,info=actionInfo({kind:'job',id:p.jobId});if(!info?.productionDays||p.days!==info.productionDays||!Number.isInteger(p.done)||p.done<0||p.done>=p.days||!finite(p.acceptedAt)||!finite(p.nextAt)||!finite(p.segmentMs,.001,5000)||typeof p.assisted!=='boolean'||p.template?.action?.id!==p.jobId||!validGrowth(p.template.growth,info)||!c||!finite(c.earned,0,100000)||!finite(c.fame,0,100)||!finite(c.fatigue,0,100)||typeof c.setback!=='boolean'||!finite(c.confidenceLoss,0,100)||c.artist?.id!==a.id||![...Object.keys(SKILLS),'fame'].every(k=>finite(c.artist[k],0,999)))throw new Error('分日長案資料損壞');}
      if(a.project===undefined)a.project=null;
      const stats = Object.fromEntries([...Object.keys(SKILLS), 'debuted', 'fame', 'shortFameUnits', 'longFameUnits', 'fatigue', 'task', 'project', 'queue', 'contractFee'].map(k => [k, a[k]]));
      for(const t of [a.task,a.project?.template].filter(Boolean)){const c=t.contract;if(c&&(c.fameRule!==undefined||c.fameUnits!==undefined)){const p=longFamePreview(c.artist,taskInfo(t));if(c.fameRule!=='ordinary-long-v1'||!p||!Number.isInteger(c.fameUnits)||c.fameUnits!==p.units)throw new Error('長作約定名氣資料損壞');}}
      if(identity.origin==='custom'&&a.task?.action.kind==='job'&&!taskInfo(a.task).productionDays&&!a.task.contract){const info=taskInfo(a.task);a.task.contract={earned:payout(a,a.task.shortBasePay===undefined?info:{...info,pay:a.task.shortBasePay})};}
      Object.assign(a, clone(identity), stats);
    });
    if (!s.payroll || s.payroll.rate !== SALARY_RATE || !finite(s.payroll.paid) || !Number.isInteger(s.payroll.paid) || !finite(s.payroll.activeMs) || (!finite(s.payroll.remainder,0,1000)||s.payroll.remainder>=1000) || (s.payroll.stoppedAt !== null && !finite(s.payroll.stoppedAt))) throw new Error('助理薪資資料損壞');
    if (!Number.isInteger(s.rng) || !finite(s.rng, 0, 4294967295) || !s.assistant || !settings(s, s.assistant)) throw new Error('助理或隨機狀態損壞');
    if(s.independentStrategies!==undefined&&s.independentStrategies!==1)throw new Error('藝人策略版本不相容');
    for(const a of s.artists)if(a.assistantStrategy===undefined)a.assistantStrategy=strategySnapshot(s.assistant);
    s.independentStrategies=1;
    s.log = s.log.filter(l => l && typeof l.text === 'string' && finite(l.at)).slice(0, 60);
    if(s.hasEverSigned===undefined){s.hasEverSigned=s.artists.length>0||s.totalJobs>0||s.totalEarned>0||s.log.some(l=>/以練習生身分加入|解約|加入公司/.test(l.text));s.refreshRemaining=s.hasEverSigned?0:3;s.migrationNotice=(s.migrationNotice||'')+(s.hasEverSigned?' 舊檔已有簽約／工作紀錄，不補發開局刷新。':' 舊檔未見簽約紀錄，補發三次開局刷新。');}
    if(typeof s.hasEverSigned!=='boolean'||!Number.isInteger(s.refreshRemaining)||s.refreshRemaining<0||s.refreshRemaining>3||(s.hasEverSigned&&s.refreshRemaining!==0))throw new Error('開局刷新資料損壞');
    if (!Array.isArray(s.candidates)||s.candidates.length>CANDIDATE_COUNT||new Set(s.candidates).size!==s.candidates.length||s.candidates.some(id=>!PEOPLE.some(p=>p.id===id)||s.artists.some(a=>a.id===id))||!Number.isInteger(s.candidateRng)||!finite(s.candidateRng,0,4294967295)) throw new Error('候選名單資料損壞');
    if(oldVersion<=11){for(const e of s.events)e.duration=ACTION_SECONDS;s.migrationNotice=(s.migrationNotice||'')+' 訓練、休息與所有通告統一5秒；舊行程按已完成比例換算，原付款保留。作品宣傳與助理薪資分別計時。';}
    if(oldVersion<=12)s.migrationNotice=(s.migrationNotice||'')+' 成長改為訓練1–3、普通通告1–2、重要通告1–5，只增加主能力。舊進行中活動按新規則固定結果，保留原時間與付款；不重算已完成活動。';
    if(oldVersion<=13){for(const w of s.works)if(w.kind===undefined)w.kind='ad';s.migrationNotice=(s.migrationNotice||'')+' EAMI 單曲錄製完成後開始記錄音樂作品；舊版未保存歌曲推出時間與品質，不補造歷史曲線，不重發獎勵。歌藝訓練與現場演出不產生唱片。';}
    if(oldVersion<=15)s.archivedWorks=[];
    WORKS.validate(s,catalog(s),oldVersion<=15);
    if(oldVersion<=21){for(const w of s.works){if(w.jobId==='local')continue;const days=w.ageMs/w.stageMs;w.stageMs=WORKS.CONFIG.stageMs;w.ageMs=Math.min(WORKS.CONFIG.totalMs,days*w.stageMs);}s.migrationNotice=(s.migrationNotice||'')+' 製作與熱度共用七遊戲日5分鐘；舊作品按已完成作品日含小數比例換算，已結算收益與曲線保留，不重領。';WORKS.validate(s,catalog(s),oldVersion<=15);}
    if(oldVersion<=15){const removed=s.works.filter(w=>w.jobId==='local');s.archivedWorks.push(...removed);s.works=s.works.filter(w=>w.jobId!=='local');s.migrationNotice=(s.migrationNotice||'')+` 作品熱度只收錄EAMI 單曲錄製、週末單元劇、日常選物封面。舊街角品牌企劃 ${removed.length} 件已完整封存並停止後續結算，已獲粉絲、名氣、資金及既有擴充資格保留；匯出存檔含封存資料。舊單元劇未記錄逐筆作品，不補造歷史。`;WORKS.validate(s,catalog(s));}
    if(oldVersion<=16)s.migrationNotice=(s.migrationNotice||'')+' 新接單曲製作4日、單元劇7日、封面2日（初版可調）；1日約43秒。舊版進行中通告保留原完成時間，待辦開始時採新製作期。整件完成才結算一次，再開始七日熱度。';
    if(oldVersion<=18)s.migrationNotice=(s.migrationNotice||'')+' 長案改為每日5秒製作段，日末自動安排，短案先做完，疲勞先休息。既有長案按比例換為完成日與當日工作量，約定成果不重算。長案管理也是助理服務，與一般代排共用公司30/分鐘薪時計；可暫停管理保留進度，資金不足停止服務。';
    if(oldVersion<=22)PUBLICITY.init(s);if(oldVersion<=24)PUBLICITY.migrate(s);PUBLICITY.validate(s);
    if(oldVersion<=25)DEVELOPMENT.init(s);DEVELOPMENT.validate(s,Object.keys(SKILLS));
    if(oldVersion<=26)CAREER.migrate(s);CAREER.validate(s,catalog(s));MUSIC.validate(s);REVENUE.validate(s);
    // A saved first-sign flag is authoritative; absent early history is conservatively closed.
    const signedEvidence=s.hasEverSigned||s.artists.length>0||s.customRegistry.length>0||s.totalJobs>0||s.totalEarned>0||s.works.length>0||s.archivedWorks.length>0||s.log.some(l=>/以練習生身分加入|以自創素人身分加入|解約|加入公司/.test(l.text));
    if(!s.customRecruitCardUsed&&(signedEvidence||!knownFirstSign)){s.customRecruitCardUsed=true;refreshCandidates(s,s.candidates);if(!knownFirstSign&&!signedEvidence)s.migrationNotice=(s.migrationNotice||'')+' 舊檔缺少首次簽約歷史，為避免開放後續創角，本局不補發自創候選卡；既有角色保留。';}
    if(s.candidates.some(id=>!PEOPLE.some(p=>p.id===id&&recruitEligible(p))))refreshCandidates(s,s.candidates);
    RIVALS.validate(s);ROTATION.validate(s,catalog(s));
    DOMAIN_HISTORY.validate(s,catalog(s));DOMAIN_HISTORY.backfill(s);FIRST_STORY.validate(s);FIRST_STORY.backfill(s);CHAPTER.validate(s);CHAPTER.scan(s);
    s.report = null;
    return s;
  }
  function resolvePublicity(s,id,choice){const r=PUBLICITY.resolve(s,id,choice);if(r.ok){log(s,`${r.artistName||'公關事件'}：${r.text}${r.expired?'':` 個人名氣 ${r.delta>=0?'+':''}${r.delta}。`}`,s.lastTick);unlock(s,s.lastTick);}return r;}
  return { CHAPTER,RIVALS,ROTATION,trainingSelection:ROTATION.get, FIRST_STORY, DOMAIN_HISTORY, REVENUE, MUSIC, SPECIAL_RECRUIT_IDS,recruitEligible,CUSTOM,catalog,identity,customQuote,createCustom, VERSION, LONG_FAME, longFamePreview, SHORT_FAME, shortFamePreview, CAREER,originalChoice,renameOriginal:CAREER.renameIdea,launchOriginal, DEVELOPMENT, buyEquipment:(s,k,l)=>DEVELOPMENT.buy(s,k,l), OFFLINE_SHORT_FACTOR, PUBLICITY,resolvePublicity, serviceNames,stopServices, receptionProjectStatus,projectPhase,currentActivityLabel, REPUTATION_GAIN, serviceActive, manageProject, workProject, cancelProject, projectLabel, PRODUCTION_DAYS, productionProgress, taskCountdown, restProduction, ACTION_SECONDS, WORKS, EXPANSIONS, expansionQuote, expand, CANDIDATE_COUNT, SPECIAL_CHANCE, activityClip, WORK_SCENES, locationName, rerollCandidates, RELEASE_RATIO, releaseQuote, release, CANDIDATE_WEIGHTS, refreshCandidates, locationOf, MAX_ARTISTS, LEGACY_RECRUIT_COST, SIGNING_PRICE, SIGNING_STATS, signingQuote, recruitQuote, signingFormula, SALARY_RATE, STAT_CAP, OFFLINE_CAP, TYPES, SKILLS, TRAINING, JOBS, PEOPLE, create, recruit, payout, fatigueCost, isSetback, confidenceLoss, fameGain, growthMax, trainingGain, trainingPreview, actionInfo, taskInfo, jobLocks, debutLocks, debut, canStart, start, enqueue, cancel, removeQueue, DEFAULT_STRATEGY, effectiveStrategy, setArtistStrategy, settings, setAssistant, setSalary, nextAction, decide, canDecide, advance, save, restore };
});
