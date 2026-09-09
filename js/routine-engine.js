function calcBmi(height, weight) { return height && weight ? weight / Math.pow(height / 100, 2) : null; }
function effortPrescription(p) {
  if (p.experience === 'new') return { rpe: 'RPE 6–7', rpeHe: 'מאמץ 6–7 מתוך 10', rir: 'about 3–4 reps in reserve', rirHe: 'כ־3–4 חזרות ברזרבה', sets: 2 };
  if (p.experience === 'some') return { rpe: 'RPE 7–8', rpeHe: 'מאמץ 7–8 מתוך 10', rir: 'about 2–3 reps in reserve', rirHe: 'כ־2–3 חזרות ברזרבה', sets: 3 };
  return { rpe: 'RPE 7–8', rpeHe: 'מאמץ 7–8 מתוך 10', rir: 'about 2 reps in reserve', rirHe: 'כ־2 חזרות ברזרבה', sets: 3 };
}
function volumeFor(p, role='main') { let sets = effortPrescription(p).sets; if (p.duration === 30 && role !== 'main') sets = Math.max(1, sets - 1); if (p.goal === 'strength' && role === 'main' && p.experience !== 'new') sets += 1; return sets; }
function repRange(p, role='main') { if (p.goal === 'strength') return role === 'main' ? '5–8' : '8–12'; if (p.goal === 'muscle') return role === 'main' ? '6–10' : '10–15'; return role === 'main' ? '8–12' : '10–15'; }
function restRange(p, role='main') { return p.goal === 'strength' && role === 'main' ? '2–3 min' : role === 'main' ? '90–120 sec' : '60–90 sec'; }
function formatHebrewMeasure(value) { return String(value ?? '').replace(/\bmin\b/g, 'דק׳').replace(/\bsec\b/g, 'שנ׳').replace(/\/side\b/g, ' לכל צד'); }
function restHe(rest) { return formatHebrewMeasure(rest); }

function chooseCardio(p) {
  const map = { walk: EX.treadmill, bike: EX.bike, elliptical: EX.elliptical, row: EX.rower };
  let c = map[p.cardioPreference] || EX.treadmill;
  if (p.issues.includes('knee') && c === EX.treadmill) c = EX.bike;
  if ((p.issues.includes('lowBack') || p.issues.includes('hip')) && c === EX.rower) c = EX.bike;
  return c;
}

function safeExercise(key, p) {
  const issues = new Set(p.issues); const original = EX[key]; let replacement = original; let reason = ''; let reasonHe = '';
  const swap = (newKey, why, whyHe) => { replacement = EX[newKey]; reason = why; reasonHe = whyHe; };
  if (issues.has('lowBack')) {
    if (key === 'rdl' || key === 'cablePullThrough') swap('legCurl', 'swapped to reduce loaded spinal/hip-hinge demand', 'הוחלף כדי להפחית עומס בציר הירך והגב');
    if (key === 'gobletSquat') swap('legPress', 'swapped for more trunk support', 'הוחלף לתרגיל עם יותר תמיכה לגו');
    if (key === 'cableRow') swap('row', 'swapped for chest support', 'הוחלף לחתירה עם תמיכת חזה');
    if (key === 'plank') swap('birdDog', 'swapped for lower-load trunk control', 'הוחלף לתרגיל ליבה בעומס נמוך יותר');
    if (key === 'rower') swap('bike', 'swapped to reduce repetitive trunk flexion', 'הוחלף כדי להפחית כיפוף חוזר של הגו');
  }
  if (issues.has('shoulder')) {
    if (key === 'shoulderPress') swap('lateralRaise', 'overhead press replaced with a pain-free shoulder option', 'לחיצה מעל הראש הוחלפה באפשרות נוחה יותר לכתף');
    if (key === 'dbBench') swap('neutralPress', 'swapped to a supported neutral-grip press', 'הוחלף ללחיצה נתמכת באחיזה ניטרלית');
    if (key === 'pulldownWide') swap('pulldown', 'swapped to a shoulder-friendlier neutral grip', 'הוחלף לאחיזה ניטרלית ונוחה יותר לכתף');
    if (key === 'plank') swap('pallof', 'swapped to reduce weight-bearing through the shoulder', 'הוחלף כדי להפחית נשיאת משקל דרך הכתף');
  }
  if (issues.has('knee')) {
    if (key === 'gobletSquat') swap('legPress', 'use a comfortable range and foot position', 'יש לעבוד בטווח ובמנח רגליים נוחים');
    if (key === 'splitSquat') swap('legCurl', 'single-leg knee-dominant work reduced initially', 'עבודה חד־רגלית דומיננטית לברך הופחתה בשלב הראשון');
    if (key === 'stepUp') swap('hipThrust', 'step work replaced initially', 'תרגיל המדרגה הוחלף בשלב הראשון');
  }
  if (issues.has('hip')) {
    if (key === 'splitSquat') swap('legPress', 'use a controlled, comfortable hip range', 'יש לעבוד בטווח ירך נוח ומבוקר');
    if (key === 'rdl') swap('legCurl', 'loaded hip hinge reduced initially', 'עומס בציר הירך הופחת בשלב הראשון');
  }
  if (issues.has('neck')) {
    if (key === 'shoulderPress') swap('lateralRaise', 'overhead loading reduced initially', 'עומס מעל הראש הופחת בשלב הראשון');
    if (key === 'suitcase') swap('pallof', 'carry replaced to reduce neck/upper-trap loading', 'הנשיאה הוחלפה כדי להפחית עומס על הצוואר והטרפז העליון');
  }
  if (issues.has('elbowWrist')) {
    if (key === 'cableCurl') swap('hammerCurl', 'neutral wrist/grip selected', 'נבחרה אחיזה ניטרלית לשורש כף היד');
    if (key === 'dbBench') swap('neutralPress', 'supported neutral grip selected', 'נבחרה לחיצה נתמכת באחיזה ניטרלית');
    if (key === 'inclinePushup') swap('chestPress', 'machine handle allows more neutral wrist position', 'ידית המכונה מאפשרת מנח ניטרלי יותר לשורש כף היד');
  }
  return { ...replacement, key: replacement.key, substituted: replacement.name !== original.name, reason, reasonHe, originalName: original.name };
}

function exerciseRow(key, p, role='main', override={}) {
  const ex = safeExercise(key, p);
  return {
    ...ex,
    key: ex.key,
    sets: override.sets ?? volumeFor(p, role),
    reps: override.reps || (ex.pattern === 'carry' ? '20–30 sec/side' : ex.key === 'plank' ? '20–30 sec' : repRange(p, role)),
    rest: override.rest || restRange(p, role),
    role,
    note: override.note || ex.cue,
    noteHe: override.noteHe || ex.cueHe,
    generatedKey: ex.key,
    manualSwap: false
  };
}

function makeWorkouts(p) {
  const fullA = [['legPress','main'], ['chestPress','main'], ['row','main'], ['legCurl','accessory'], ['lateralRaise','accessory'], ['pallof','accessory']];
  const fullB = [['gobletSquat','main'], ['pulldown','main'], ['dbBench','main'], ['hipThrust','accessory'], ['facePull','accessory'], ['deadBug','accessory']];
  const fullC = [['legPress','main'], ['row','main'], ['neutralPress','main'], ['splitSquat','accessory'], ['pulldown','accessory'], ['suitcase','accessory']];
  const upperA = [['chestPress','main'], ['row','main'], ['pulldown','main'], ['lateralRaise','accessory'], ['cableCurl','accessory'], ['pressdown','accessory'], ['pallof','accessory']];
  const lowerA = [['legPress','main'], ['rdl','main'], ['splitSquat','accessory'], ['legCurl','accessory'], ['calf','accessory'], ['deadBug','accessory']];
  const upperB = [['neutralPress','main'], ['pulldown','main'], ['row','main'], ['facePull','accessory'], ['hammerCurl','accessory'], ['pressdown','accessory'], ['pallof','accessory']];
  const lowerB = [['gobletSquat','main'], ['hipThrust','main'], ['stepUp','accessory'], ['legCurl','accessory'], ['calf','accessory'], ['birdDog','accessory']];
  let schemas;
  if (p.days === 2) schemas = [['Full Body A','גוף מלא א',fullA], ['Full Body B','גוף מלא ב',fullB]];
  else if (p.days === 3) schemas = [['Full Body A','גוף מלא א',fullA], ['Full Body B','גוף מלא ב',fullB], ['Full Body C','גוף מלא ג',fullC]];
  else if (p.days === 4) schemas = [['Upper A','פלג גוף עליון א',upperA], ['Lower A','פלג גוף תחתון א',lowerA], ['Upper B','פלג גוף עליון ב',upperB], ['Lower B','פלג גוף תחתון ב',lowerB]];
  else schemas = [['Upper A','פלג גוף עליון א',upperA], ['Lower A','פלג גוף תחתון א',lowerA], ['Full Body','גוף מלא',fullC], ['Upper B','פלג גוף עליון ב',upperB], ['Lower B','פלג גוף תחתון ב',lowerB]];

  let maxExercises = p.duration <= 30 ? 4 : p.duration <= 45 ? 5 : p.duration <= 60 ? 6 : 7;
  if (p.age >= 70 && p.experience === 'new') maxExercises = Math.min(maxExercises, 5);

  return schemas.map(([name, nameHe, rows], i) => {
    // Substitutions can converge on the same machine: keep it once per workout.
    let exercises = rows.map(([k, role]) => exerciseRow(k, p, role));
    exercises = exercises.filter((ex, index, all) => all.findIndex(other => other.key === ex.key) === index).slice(0, maxExercises);
    if (p.goal === 'muscle' && p.duration >= 60 && exercises.length < 7) exercises.push(exerciseRow(i % 2 ? 'cableCurl' : 'pressdown', p, 'accessory'));
    if (p.goal === 'fatloss' && p.duration >= 45) {
      const c = chooseCardio(p);
      exercises.push({ ...c, key: c.key, sets: '1', reps: p.duration >= 60 ? '10–15 min' : '6–10 min', rest: '—', role: 'cardio', note: 'Steady moderate pace; you should still be able to speak in short sentences.', noteHe: 'קצב מתון ויציב; עדיין אמור להיות אפשרי לדבר במשפטים קצרים.', substituted: false, generatedKey: c.key, manualSwap: false });
    }
    if (p.age >= 65 && p.duration >= 45) exercises.push({ ...EX.balanceStand, key: EX.balanceStand.key, sets: '2', reps: '20–30 sec/side', rest: '30 sec', role: 'balance', note: EX.balanceStand.cue, noteHe: EX.balanceStand.cueHe, substituted: false, generatedKey: EX.balanceStand.key, manualSwap: false });
    exercises = exercises.filter((ex,index,all)=>all.findIndex(other=>other.key===ex.key)===index);
    // Reserve time for warm-up, practice sets and changing stations.
    const budget = p.duration - (p.experience === 'new' ? 12 : 10);
    const estimate = ex => Number(ex.sets) * (0.75 + (ex.rest.includes('min') ? 2.5 : ex.role === 'main' ? 1.75 : 1.25)) + 1;
    const minutes = () => exercises.reduce((sum, ex) => sum + (ex.role === 'cardio' ? (p.duration >= 60 ? 15 : 10) : estimate(ex)), 0);
    while (minutes() > budget && exercises.some(ex => Number(ex.sets) > 2)) {
      const ex = [...exercises].reverse().find(ex => Number(ex.sets) > 2); ex.sets -= 1;
    }
    while (minutes() > budget && exercises.length > 3) {
      const index = exercises.findLastIndex(ex => ex.role === 'accessory');
      exercises.splice(index >= 0 ? index : exercises.length - 1, 1);
    }
    return { name, nameHe, exercises };
  });
}

function buildPlan(p) {
  const effort = effortPrescription(p); const workouts = makeWorkouts(p);
  let warmup = '5–8 min easy cardio, then 1 light practice set before the first 2 strength exercises.';
  let warmupHe = '5–8 דקות אירובי קל, ואז סט חימום קל לפני שני תרגילי הכוח הראשונים.';
  if (p.activity === 'low' || p.experience === 'new') { warmup = '6–10 min easy cardio, then 1–2 light practice sets before the first 2 strength exercises.'; warmupHe = '6–10 דקות אירובי קל, ואז 1–2 סטים קלים לפני שני תרגילי הכוח הראשונים.'; }
  let weeklyCardio = 'Optional: 2 × 15–25 min easy-to-moderate cardio on non-lifting days.';
  let weeklyCardioHe = 'אופציונלי: פעמיים בשבוע 15–25 דקות אירובי קל־מתון בימים ללא כוח.';
  if (p.goal === 'fatloss') { weeklyCardio = 'Aim for 2–3 × 20–30 min easy-to-moderate cardio weekly, building gradually from current activity.'; weeklyCardioHe = 'שאפו ל־2–3 אימוני אירובי של 20–30 דקות בשבוע, ולהעלות בהדרגה לפי רמת הפעילות הנוכחית.'; }
  if (p.goal === 'strength') { weeklyCardio = 'Keep 1–2 easy cardio sessions weekly for general conditioning and recovery.'; weeklyCardioHe = 'שמרו על 1–2 אימוני אירובי קלים בשבוע לטובת כושר כללי והתאוששות.'; }
  const progression = p.experience === 'new'
    ? 'Start deliberately light. When every set reaches the top of the rep range with clean form and ~3 reps still available, add the smallest weight increase next time.'
    : 'Use double progression: build reps within the range first. Once all sets reach the top of the range at the target effort, increase load by the smallest practical amount.';
  const progressionHe = p.experience === 'new'
    ? 'התחילו בכוונה במשקל קל. כאשר בכל הסטים מגיעים לקצה העליון של טווח החזרות בטכניקה טובה ונשארות כ־3 חזרות ברזרבה, העלו בפעם הבאה את המשקל במדרגה הקטנה ביותר.'
    : 'התקדמו קודם בחזרות בתוך הטווח. כאשר כל הסטים מגיעים לקצה העליון בעצימות היעד, העלו את המשקל במדרגה הקטנה ביותר האפשרית.';
  return { blocked: false, profile: p, bmi: calcBmi(p.height,p.weight), workouts, effort, warmup, warmupHe, weeklyCardio, weeklyCardioHe, progression, progressionHe };
}


