// Old broad categories map conservatively; new selections are stored precisely.
function normalizeActivity(value) {
  const legacy = {low:'inactive',moderate:'one_two',high:'three_four'};
  return ['inactive','one_two','three_four','five_plus'].includes(value) ? value : (typeof value==='string' && Object.hasOwn(legacy,value) ? legacy[value] : 'one_two');
}
function activityLabel(value) {
  return {inactive:'Mostly inactive',one_two:'Exercise 1–2×/week',three_four:'Exercise 3–4×/week',five_plus:'Exercise 5+×/week'}[normalizeActivity(value)];
}
function introductoryWorkload(p) { return normalizeActivity(p.activity)==='inactive' || (p.experience==='new' && p.days>=4); }
function cardioDuration(p) {
  const standard=(p.goal==='fatloss' ? {30:6,45:8,60:12,75:15} : {30:4,45:6,60:8,75:10})[p.duration];
  const activity=normalizeActivity(p.activity);
  if(activity==='inactive') return Math.min(standard,{30:3,45:4,60:5,75:6}[p.duration]);
  if(activity==='one_two') return Math.max(3,Math.floor(standard*0.8));
  return standard;
}
function calcBmi(height, weight) { return height && weight ? weight / Math.pow(height / 100, 2) : null; }
function effortPrescription(p) {
  if (p.experience === 'new' || normalizeActivity(p.activity)==='inactive') return { rpe: 'RPE 6–7', rpeHe: 'מאמץ 6–7 מתוך 10', rir: 'about 3–4 reps in reserve', rirHe: 'כ־3–4 חזרות ברזרבה', sets: 2 };
  if (p.experience === 'some') return { rpe: 'RPE 7–8', rpeHe: 'מאמץ 7–8 מתוך 10', rir: 'about 2–3 reps in reserve', rirHe: 'כ־2–3 חזרות ברזרבה', sets: 3 };
  return { rpe: 'RPE 7–8', rpeHe: 'מאמץ 7–8 מתוך 10', rir: 'about 2 reps in reserve', rirHe: 'כ־2 חזרות ברזרבה', sets: 3 };
}
function volumeFor(p, role='main') {
  let sets=effortPrescription(p).sets;
  if(p.goal==='strength' && role==='main' && p.experience!=='new') sets+=1;
  if(p.duration===30 && role!=='main') sets=Math.max(1,sets-1);
  if(introductoryWorkload(p)) return Math.min(sets,role==='main'?2:1);
  if(normalizeActivity(p.activity)==='one_two') return role==='main'?Math.min(sets,3):Math.max(1,sets-1);
  return sets;
}
function repRange(p, role='main') { if (p.goal === 'strength') return role === 'main' ? '5–8' : '8–12'; if (p.goal === 'muscle') return role === 'main' ? '6–10' : '10–15'; return role === 'main' ? '8–12' : '10–15'; }
function restRange(p, role='main', reps=repRange(p, role)) {
  // Mixed ranges use their lower bound; timed exercises use the 60-second default.
  if (/sec|min/i.test(reps)) return '60 sec';
  const lower = Number(String(reps).match(/^\s*(\d+)/)?.[1]);
  return lower > 0 && lower <= 6 ? '90–120 sec' : '60 sec';
}
function formatHebrewMeasure(value) { return String(value ?? '').replace(/\bmin\b/g, 'דק׳').replace(/\bsec\b/g, 'שנ׳').replace(/\/side\b/g, ' לכל צד'); }
function restHe(rest) { return formatHebrewMeasure(rest); }

function chooseCardio(p) {
  const map = { walk: EX.treadmill, bike: EX.bike, elliptical: EX.elliptical, row: EX.rower, jumpRope: EX.jumpRope };
  let c = map[p.cardioPreference] || EX.treadmill;
  if (p.issues.includes('knee') && c === EX.treadmill) c = EX.bike;
  if ((p.issues.includes('lowBack') || p.issues.includes('hip')) && c === EX.rower) c = EX.bike;
  if (c === EX.jumpRope) c = safeExercise('jumpRope', p);
  return c;
}

function safeExercise(key, p) {
  const issues = new Set(p.issues); const original = EX[key]; let replacement = original; let reason = ''; let reasonHe = '';
  const swap = (newKey, why, whyHe) => { replacement = EX[newKey]; reason = why; reasonHe = whyHe; };
  if (key === 'jumpRope' && ['knee','hip','lowBack'].some(issue => issues.has(issue))) {
    swap('bike', 'jumping replaced with a lower-impact option', 'קפיצות הוחלפו באפשרות עם פחות זעזועים');
  }
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
  const reps = override.reps || (ex.pattern === 'carry' ? '20–30 sec/side' : ex.key === 'plank' ? '20–30 sec' : repRange(p, role));
  return {
    ...ex,
    key: ex.key,
    sets: override.sets ?? volumeFor(p, role),
    reps,
    rest: override.rest || restRange(p, role, reps),
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

  if(normalizeActivity(p.activity)==='inactive') maxExercises=Math.min(maxExercises,4);
  else if(p.experience==='new' && p.days>=4) maxExercises=Math.min(maxExercises,5);

  return schemas.map(([name, nameHe, rows], i) => {
    // Substitutions can converge on the same machine: keep it once per workout.
    let exercises = rows.map(([k, role]) => exerciseRow(k, p, role));
    exercises = exercises.filter((ex, index, all) => all.findIndex(other => other.key === ex.key) === index).slice(0, maxExercises);
    if (p.goal === 'muscle' && p.duration >= 60 && exercises.length < 7 && !introductoryWorkload(p) && normalizeActivity(p.activity)!=='one_two') exercises.push(exerciseRow(i % 2 ? 'cableCurl' : 'pressdown', p, 'accessory'));
    const c = chooseCardio(p);
    const cardioMinutes = cardioDuration(p);
    exercises.push({ ...c, key:c.key, sets:1, reps:cardioMinutes+' min', rest:'—', role:'cardio', note:c.key==='jumpRope' ? c.cue : 'Comfortable, moderate pace; keep enough breath to speak.', noteHe:c.key==='jumpRope' ? c.cueHe : 'קצב מתון ונוח, שמאפשר לדבר.', generatedKey:c.key, manualSwap:false });
    if(normalizeActivity(p.activity)==='inactive') {
      const card=exercises[exercises.length-1];
      card.note='Start easy; use short intervals with walking or rest breaks within the allotted time. Build duration gradually after 2–3 weeks.';
      card.noteHe='התחילו בקלות; שלבו מקטעים קצרים עם הפסקות הליכה או מנוחה בתוך הזמן שהוקצב. האריכו בהדרגה לאחר 2–3 שבועות.';
    }
    if (p.age >= 65 && p.duration >= 45) exercises.push({ ...EX.balanceStand, key: EX.balanceStand.key, sets: '2', reps: '20–30 sec/side', rest: '30 sec', role: 'balance', note: EX.balanceStand.cue, noteHe: EX.balanceStand.cueHe, substituted: false, generatedKey: EX.balanceStand.key, manualSwap: false });
    exercises = exercises.filter((ex,index,all)=>all.findIndex(other=>other.key===ex.key)===index);
    // The warm-up and transitions are included, not added on top of session time.
    const budget = p.duration - warmupMinutes(p);
    const minutes = () => exercises.reduce((sum,ex)=>sum+estimateExerciseMinutes(ex),0);
    while (minutes() > budget && exercises.some(ex=>Number(ex.sets)>2)) {
      [...exercises].reverse().find(ex=>Number(ex.sets)>2).sets -= 1;
    }
    while (minutes() > budget && exercises.filter(ex=>ex.role!=='cardio' && ex.role!=='balance').length>3) {
      let index=exercises.findLastIndex(ex=>ex.role==='accessory');
      if(index<0) index=exercises.findLastIndex(ex=>ex.role==='main');
      exercises.splice(index,1);
    }
    while (minutes() > budget && exercises.some(ex=>ex.role!=='cardio' && Number(ex.sets)>1)) {
      [...exercises].reverse().find(ex=>ex.role!=='cardio' && Number(ex.sets)>1).sets -= 1;
    }
    return { name, nameHe, exercises };
  });
}

function buildPlan(p) {
  p={...p,activity:normalizeActivity(p.activity)};
  const effort = effortPrescription(p); const workouts = makeWorkouts(p);
  const total = warmupMinutes(p); const cardio = chooseCardio(p);
  const easyMinutes = (p.duration===30 ? 2 : 4)+(p.activity==='inactive'?2:0); const practiceMinutes = total-easyMinutes-1;
  const requested = {walk:'treadmill',bike:'bike',elliptical:'elliptical',row:'rower',jumpRope:'jumpRope'}[p.cardioPreference];
  const changed = requested && requested!==cardio.key;
  const adjustment = changed ? ' Requested '+EX[requested].name+'; using '+cardio.name+' because of the selected movement considerations.' : '';
  const adjustmentHe = changed ? ' ההעדפה: '+EX[requested].he+'; בתוכנית: '+cardio.he+' בהתאם למגבלות התנועה שסומנו.' : '';
  const warmup = total+' min total — included in your '+p.duration+'-minute session.\n1. '+easyMinutes+' min easy '+cardio.name+(cardio.key==='jumpRope' ? ': short easy intervals with walking breaks.' : ': begin slowly and build gently.')+adjustment+'\n2. 1 min gentle movement preparation: shoulder circles, marching and comfortable unloaded practice of today’s movements.\n3. '+practiceMinutes+' min light practice sets for the first two strength exercises, before their working sets. These do not count toward the listed sets.';
  const warmupHe = total+' דקות בסך הכול — כלולות באימון של '+p.duration+' דקות.\n1. '+easyMinutes+' דקות של '+cardio.he+' בקצב קל'+(cardio.key==='jumpRope' ? ': מקטעים קצרים עם הפסקות הליכה.' : ': התחילו לאט והגבירו בהדרגה.')+adjustmentHe+'\n2. דקה של הכנת תנועה עדינה: סיבובי כתפיים, צעידה ותרגול נוח ללא משקל של תנועות היום.\n3. '+practiceMinutes+' דקות של סטים קלים לתרגול שני תרגילי הכוח הראשונים, לפני הסטים העיקריים. הם אינם נספרים כחלק מהסטים הרשומים.';
  let weeklyCardio = 'Optional: 2 × 15–25 min easy-to-moderate cardio on non-lifting days.';
  let weeklyCardioHe = 'אופציונלי: פעמיים בשבוע 15–25 דקות אירובי קל־מתון בימים ללא כוח.';
  if (p.goal === 'fatloss') { weeklyCardio = 'Aim for 2–3 × 20–30 min easy-to-moderate cardio weekly, building gradually from current activity.'; weeklyCardioHe = 'שאפו ל־2–3 אימוני אירובי של 20–30 דקות בשבוע, ולהעלות בהדרגה לפי רמת הפעילות הנוכחית.'; }
  if (p.goal === 'strength') { weeklyCardio = 'Keep 1–2 easy cardio sessions weekly for general conditioning and recovery.'; weeklyCardioHe = 'שמרו על 1–2 אימוני אירובי קלים בשבוע לטובת כושר כללי והתאוששות.'; }
  let progression = p.experience === 'new'
    ? 'Start deliberately light. When every set reaches the top of the rep range with clean form and ~3 reps still available, add the smallest weight increase next time.'
    : 'Use double progression: build reps within the range first. Once all sets reach the top of the range at the target effort, increase load by the smallest practical amount.';
  let progressionHe = p.experience === 'new'
    ? 'התחילו בכוונה במשקל קל. כאשר בכל הסטים מגיעים לקצה העליון של טווח החזרות בטכניקה טובה ונשארות כ־3 חזרות ברזרבה, העלו בפעם הבאה את המשקל במדרגה הקטנה ביותר.'
    : 'התקדמו קודם בחזרות בתוך הטווח. כאשר כל הסטים מגיעים לקצה העליון בעצימות היעד, העלו את המשקל במדרגה הקטנה ביותר האפשרית.';
  if(p.activity==='inactive') {
    weeklyCardio='For the first 2–3 weeks, use only the short, easy cardio blocks already included in each day. Add 1–2 minutes at a time once comfortable, keeping the whole session within the selected duration.';
    weeklyCardioHe='ב־2–3 השבועות הראשונים השתמשו במקטעי האירובי הקצרים והקלים שכבר כלולים בכל יום. כשנוח, הוסיפו 1–2 דקות בכל פעם תוך שמירה על משך האימון שנבחר.';
  } else if(p.activity==='one_two') {
    weeklyCardio='Start with the cardio blocks included in the routine. Optional easy activity on other days should build gradually from your current 1–2 sessions per week.';
    weeklyCardioHe='התחילו במקטעי האירובי הכלולים בתוכנית. פעילות קלה נוספת בימים אחרים תתווסף בהדרגה מתוך שגרת האימונים הנוכחית.';
  }
  if(introductoryWorkload(p)) {
    const intro=p.days>=4 ? 'First 2–3 weeks: these are reduced-volume starter days. Keep the extra gym visits short and easy; take a rest day when recovery is incomplete. Shorter sessions are intentional. Review recovery with staff before adding sets or increasing cardio. ' : 'First 2–3 weeks: use the reduced starting sets and easy cardio shown here. Shorter sessions are intentional. Review with staff before adding workload. ';
    const introHe=p.days>=4 ? 'ב־2–3 השבועות הראשונים: אלה ימי התחלה בנפח מופחת. שמרו על הביקורים הנוספים קצרים וקלים; קחו יום מנוחה אם ההתאוששות אינה מספקת. אימונים קצרים יותר הם מכוונים. בדקו התאוששות עם הצוות לפני הוספת סטים או אירובי. ' : 'ב־2–3 השבועות הראשונים: השתמשו בסטים המופחתים ובאירובי הקל שבתוכנית. אימונים קצרים יותר הם מכוונים. בדקו עם הצוות לפני העלאת העומס. ';
    progression=intro+progression;progressionHe=introHe+progressionHe;
  }
  return { blocked: false, profile: p, bmi: calcBmi(p.height,p.weight), workouts, effort, warmup, warmupHe, weeklyCardio, weeklyCardioHe, progression, progressionHe };
}



function warmupMinutes(p) { return (p.duration===30 ? 5 : 8)+(normalizeActivity(p.activity)==='inactive'?2:0); }
function estimateExerciseMinutes(ex) {
  const numbers=value=>(String(value).match(/\d+(?:\.\d+)?/g)||[]).map(Number);
  const upper=value=>Math.max(0,...numbers(value));
  const rest=upper(ex.rest)*(/min/i.test(ex.rest)?1:1/60);
  const work=/sec|min/i.test(ex.reps) ? upper(ex.reps)*(/min/i.test(ex.reps)?1:1/60)*(/side/i.test(ex.reps)?2:1) : Math.max(0.75,upper(ex.reps)*3/60);
  return Number(ex.sets)*work + Math.max(0,Number(ex.sets)-1)*rest + 1;
}
