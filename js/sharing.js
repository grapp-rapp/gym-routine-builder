function publicSharePlan(plan) {
  const p = plan.profile;
  return {v:4, l:currentLanguage,
    p:{n:p.name || '',g:p.goal,e:p.experience,d:plan.workouts.length,t:p.duration,m:p.age < 18 ? 1 : 0,
       q:p.memberNotes || '',h:p.memberNotesHe || ''},
    guidance:[plan.warmup,plan.warmupHe,plan.weeklyCardio,plan.weeklyCardioHe,plan.progression,plan.progressionHe],
    w:plan.workouts.map(w=>({n:w.name,h:w.nameHe,x:w.exercises.map(ex=>[ex.key,ex.sets,ex.reps,ex.rest,ex.role || '',0,0,ex.note || '',ex.noteHe || ''])}))};
}

function normalizeSharedPlan(raw) {
  // v3 compact payload
  if ((raw?.v === 3 || raw?.v === 4) && raw?.p && Array.isArray(raw?.w)) {
    return {
      lang: raw.l === 'he' ? 'he' : 'en', guidance: raw.v === 4 ? raw.guidance : null,
      profile: {
        name: raw.p.n || '', goal: raw.p.g || 'general', experience: raw.p.e || 'new',
        days: Number(raw.p.d || 3), duration: Number(raw.p.t || 60), activity: raw.p.a || 'moderate',
        memberNotes: raw.v === 4 ? raw.p.q || '' : '', memberNotesHe: raw.v === 4 ? raw.p.h || '' : '', isMinor: !!raw.p.m
      },
      workouts: raw.w.map(w => ({
        name: w.n || 'Workout', nameHe: w.h || 'אימון',
        exercises: (w.x || []).map(x => ({ key:x[0], sets:x[1], reps:x[2], rest:x[3], role:x[4], substituted:!!x[5], manualSwap:!!x[6], note:x[7], noteHe:x[8] }))
      }))
    };
  }
  // Backward compatibility with v2 links already sent to members.
  return raw;
}

function inflateSharedPlan(raw) {
  const shared = normalizeSharedPlan(raw);
  validateSharedPlan(shared);
  const sp = shared.profile || {};
  const profile = {
    name: sp.name || '', goal: sp.goal || 'general', experience: sp.experience || 'new', days: Number(sp.days || 3), duration: Number(sp.duration || 60),
    activity: sp.activity || 'moderate', cardioPreference: 'any', trainerNotes: '', memberNotes: sp.memberNotes || '', memberNotesHe: sp.memberNotesHe || '',
    age: sp.isMinor ? 17 : 18, height: 175, weight: 75, gender: '', issues: [], issueNotes: ''
  };
  const plan = buildPlan(profile);
  plan.workouts = (shared.workouts || []).map(w => ({
    name: w.name,
    nameHe: w.nameHe,
    exercises: (w.exercises || []).map(item => {
      const base = EX[item.key] || EX.chestPress;
      return { ...base, key: base.key, sets: item.sets, reps: item.reps, rest: item.rest, role: item.role, note: item.note ?? base.cue, noteHe: item.noteHe ?? base.cueHe, substituted: false, reason: '', reasonHe: '', generatedKey: base.key, manualSwap: !!item.manualSwap };
    })
  }));
  if (shared.guidance) ['warmup','warmupHe','weeklyCardio','weeklyCardioHe','progression','progressionHe'].forEach((key,i)=>plan[key]=shared.guidance[i]);
  return { ...plan, sharedLanguage: shared.lang || 'en' };
}

function encodeShare(payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload)); let binary = ''; for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function decodeShare(encoded) {
  if (typeof encoded !== 'string' || encoded.length > 100000 || !/^[A-Za-z0-9_-]+$/.test(encoded)) throw Error('Invalid routine encoding');
  const padded = encoded.replace(/-/g,'+').replace(/_/g,'/') + '='.repeat((4 - encoded.length % 4) % 4);
  const binary = atob(padded); const bytes = Uint8Array.from(binary, c => c.charCodeAt(0)); return JSON.parse(new TextDecoder().decode(bytes));
}

function buildMemberUrl() {
  if (!currentPlan) return '';
  const encoded = encodeShare(publicSharePlan(currentPlan));
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.hash = 'routine=' + encoded;
  return url.toString();
}

