const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const STORAGE_KEY = 'binyamin-gym-member-profiles-v2';
let currentPlan = null;
let editingProfileId = null;
let currentLanguage = 'en';
let activeDayIndex = 0;
let memberShareMode = false;
let swapContext = null;
let swapSelectionKey = null;
let swapFilter = 'recommended';

function makeId() {
  return (globalThis.crypto && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : `member-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const LOGO_SRC = './binyamin-gym-logo.png';
const LOGO_FALLBACK_SRC = './image-removebg-preview%20(1).png';

// Temporary equipment reference photography / diagrams. We use resized
// Wikimedia Commons redirects to keep mobile payloads light. Replace these with
// photos of Binyamin Gym's exact machines once the equipment inventory is final.
function commonsPhoto(filename, width=720) {
  return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(filename)}?width=${width}`;
}

const EQUIPMENT_PHOTOS = {
  legPress: commonsPhoto('Gym Leg Press Machine.jpg'),
  hackSquat: commonsPhoto('Hack squat machine 1.svg'),
  legCurl: commonsPhoto('Lying leg curl machine 2.svg'),
  chestPress: commonsPhoto('Chest Incline.jpg'),
  neutralPress: commonsPhoto('Chest Incline.jpg'),
  shoulderPress: commonsPhoto('Shoulder Press.jpg'),
  reverseFly: commonsPhoto('Multifunctional cable and row machines in a gym.jpg'),
  pulldown: commonsPhoto('Lat pulldown machine 20180112.jpg'),
  pulldownWide: commonsPhoto('Lat pulldown machine 20180112.jpg'),
  row: commonsPhoto('Multifunctional cable and row machines in a gym.jpg'),
  cableRow: commonsPhoto('Multifunctional cable and row machines in a gym.jpg'),
  calf: commonsPhoto('Seated calf machine.jpg'),
  treadmill: commonsPhoto('Treadmill-gym.jpg'),
  bike: commonsPhoto('Stationary bicycle.jpg'),
  elliptical: commonsPhoto('Elliptical machine.jpg'),
  rower: commonsPhoto('Rowing Machine.jpg'),
  cable: commonsPhoto('Multifunctional cable and row machines in a gym.jpg'),
  dumbbell: commonsPhoto('Dumbbells in a local health club.jpg'),
  bench: commonsPhoto('Dumbbells in a local health club.jpg'),
  machine: commonsPhoto('Multifunctional cable and row machines in a gym.jpg')
};

function equipmentPhoto(ex) {
  return EQUIPMENT_PHOTOS[ex.key] || EQUIPMENT_PHOTOS[ex.equipmentType] || '';
}

function equipmentVisual(ex, className='equipment-thumb', label='') {
  const photo = equipmentPhoto(ex);
  const safeLabel = esc(label || ex.equipment || ex.name || 'Gym equipment');
  const fallback = `<span class="equipment-icon-fallback" ${photo ? 'hidden' : ''}>${equipmentIcon(ex.equipmentType)}</span>`;
  if (!photo) return `<div class="${className}" title="${safeLabel}">${fallback}</div>`;
  const image = `<img src="${esc(photo)}" alt="${safeLabel}" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false">${fallback}`;
  // Only the main routine thumbnail is interactive. Swap-dialog thumbnails sit
  // inside buttons already, so making them buttons would create invalid nesting.
  if (className === 'equipment-thumb') {
    const zoomLabel = currentLanguage === 'he' ? `הגדלת תמונת ציוד: ${safeLabel}` : `Enlarge equipment image: ${safeLabel}`;
    return `<button type="button" class="${className} has-photo equipment-photo-button no-print-border" data-equipment-image="${esc(photo)}" data-equipment-label="${safeLabel}" aria-label="${esc(zoomLabel)}" title="${safeLabel}">${image}<span class="equipment-zoom-badge" aria-hidden="true">＋</span></button>`;
  }
  return `<div class="${className} has-photo" title="${safeLabel}">${image}</div>`;
}

const EX = {
  legPress: { name: 'Leg Press', he: 'לחיצת רגליים', pattern: 'squat', cue: 'Controlled depth; keep back supported.', cueHe: 'טווח נוח ומבוקר, עם גב נתמך.', equipment: 'Leg press machine', equipmentHe: 'מכונת לחיצת רגליים', equipmentType: 'machine' },
  gobletSquat: { name: 'Goblet Squat to Box', he: 'סקוואט גביע לספסל', pattern: 'squat', cue: 'Sit to a comfortable box height; smooth tempo.', cueHe: 'שב לגובה נוח ושמור על קצב מבוקר.', equipment: 'Dumbbell + box', equipmentHe: 'משקולת יד + ספסל', equipmentType: 'dumbbell' },
  hackSquat: { name: 'Hack Squat / Supported Squat', he: 'האק סקוואט / סקוואט נתמך', pattern: 'squat', cue: 'Use a pain-free range and stable foot position.', cueHe: 'עבוד בטווח ללא כאב ובמנח רגליים יציב.', equipment: 'Hack squat machine', equipmentHe: 'מכונת האק סקוואט', equipmentType: 'machine' },
  splitSquat: { name: 'Supported Split Squat', he: 'מכרע מפוצל עם תמיכה', pattern: 'singleLeg', cue: 'Hold support if needed; keep range comfortable.', cueHe: 'היעזר בתמיכה לפי הצורך ושמור על טווח נוח.', equipment: 'Bench / support', equipmentHe: 'ספסל / תמיכה', equipmentType: 'bench' },
  stepUp: { name: 'Low Step-Up', he: 'עלייה למדרגה נמוכה', pattern: 'singleLeg', cue: 'Drive through whole foot; choose a low box.', cueHe: 'דחוף דרך כל כף הרגל ובחר מדרגה נמוכה.', equipment: 'Low step / box', equipmentHe: 'מדרגה / קופסה נמוכה', equipmentType: 'box' },
  legCurl: { name: 'Seated / Lying Leg Curl', he: 'כפיפת ברך במכונה', pattern: 'hinge', cue: 'Slow lowering; avoid arching the back.', cueHe: 'הורדה איטית ומבוקרת, בלי לקשת את הגב.', equipment: 'Leg curl machine', equipmentHe: 'מכונת כפיפת ברך', equipmentType: 'machine' },
  hipThrust: { name: 'Hip Thrust / Glute Bridge', he: 'היפ תראסט / גשר ישבן', pattern: 'hinge', cue: 'Finish with glutes, not low-back extension.', cueHe: 'סיים בכיווץ ישבן, בלי להאריך את הגב התחתון.', equipment: 'Bench + pad', equipmentHe: 'ספסל + כרית', equipmentType: 'bench' },
  cablePullThrough: { name: 'Cable Pull-Through', he: 'פול-ת׳רו בכבל', pattern: 'hinge', cue: 'Hip hinge with neutral spine.', cueHe: 'תנועת ציר מהירך עם עמוד שדרה ניטרלי.', equipment: 'Cable station', equipmentHe: 'תחנת כבלים', equipmentType: 'cable' },
  rdl: { name: 'Dumbbell Romanian Deadlift', he: 'דדליפט רומני עם משקולות יד', pattern: 'hinge', cue: 'Hinge at hips; stop before spinal position changes.', cueHe: 'ציר מהירך; עצור לפני שמנח הגב משתנה.', equipment: 'Dumbbells', equipmentHe: 'משקולות יד', equipmentType: 'dumbbell' },
  chestPress: { name: 'Machine Chest Press', he: 'לחיצת חזה במכונה', pattern: 'push', cue: 'Shoulder blades supported; neutral, comfortable grip.', cueHe: 'שכמות נתמכות ואחיזה נוחה וניטרלית.', equipment: 'Chest press machine', equipmentHe: 'מכונת לחיצת חזה', equipmentType: 'machine' },
  dbBench: { name: 'Dumbbell Bench Press', he: 'לחיצת חזה עם משקולות יד', pattern: 'push', cue: 'Keep elbows in a comfortable path.', cueHe: 'שמור את המרפקים במסלול נוח.', equipment: 'Bench + dumbbells', equipmentHe: 'ספסל + משקולות יד', equipmentType: 'dumbbell' },
  inclinePushup: { name: 'Incline Push-Up', he: 'שכיבות סמיכה בשיפוע', pattern: 'push', cue: 'Choose bench height that feels smooth and stable.', cueHe: 'בחר גובה ספסל שמרגיש יציב ונוח.', equipment: 'Bench', equipmentHe: 'ספסל', equipmentType: 'bench' },
  cablePress: { name: 'Standing Cable Press', he: 'לחיצת חזה בעמידה בכבל', pattern: 'push', cue: 'Light load; ribs stacked; smooth press.', cueHe: 'משקל קל, גוף יציב ולחיצה חלקה.', equipment: 'Cable station', equipmentHe: 'תחנת כבלים', equipmentType: 'cable' },
  neutralPress: { name: 'Neutral-Grip Machine Press', he: 'לחיצה במכונה באחיזה ניטרלית', pattern: 'push', cue: 'Use neutral grip and pain-free range.', cueHe: 'אחיזה ניטרלית וטווח ללא כאב.', equipment: 'Press machine', equipmentHe: 'מכונת לחיצה', equipmentType: 'machine' },
  row: { name: 'Chest-Supported Row', he: 'חתירה עם תמיכת חזה', pattern: 'pull', cue: 'Keep chest supported; pull elbows toward ribs.', cueHe: 'השאר את החזה נתמך ומשוך מרפקים לכיוון הצלעות.', equipment: 'Supported row machine', equipmentHe: 'מכונת חתירה עם תמיכת חזה', equipmentType: 'machine' },
  cableRow: { name: 'Seated Cable Row', he: 'חתירה בישיבה בכבל', pattern: 'pull', cue: 'Stay tall; do not rock through the low back.', cueHe: 'שב זקוף ואל תתנדנד דרך הגב התחתון.', equipment: 'Cable row', equipmentHe: 'חתירה בכבל', equipmentType: 'cable' },
  pulldown: { name: 'Neutral-Grip Lat Pulldown', he: 'משיכת פולי עליון באחיזה ניטרלית', pattern: 'verticalPull', cue: 'Pull to upper chest without leaning back.', cueHe: 'משוך לכיוון החזה העליון בלי להישען לאחור.', equipment: 'Lat pulldown', equipmentHe: 'מכונת פולי עליון', equipmentType: 'cable' },
  pulldownWide: { name: 'Lat Pulldown', he: 'משיכת פולי עליון', pattern: 'verticalPull', cue: 'Comfortable grip; avoid forcing shoulder range.', cueHe: 'אחיזה נוחה; אל תכריח טווח כתף.', equipment: 'Lat pulldown', equipmentHe: 'מכונת פולי עליון', equipmentType: 'cable' },
  facePull: { name: 'Cable Face Pull', he: 'פייס פול בכבל', pattern: 'rearDelt', cue: 'Light load; move through a comfortable shoulder range.', cueHe: 'משקל קל ותנועה בטווח כתף נוח.', equipment: 'Cable station + rope', equipmentHe: 'כבל + חבל', equipmentType: 'cable' },
  reverseFly: { name: 'Reverse Pec Deck', he: 'פרפר הפוך במכונה', pattern: 'rearDelt', cue: 'Keep shoulders down; control both directions.', cueHe: 'שמור כתפיים נמוכות ושלוט בשני הכיוונים.', equipment: 'Reverse pec deck', equipmentHe: 'מכונת פרפר הפוך', equipmentType: 'machine' },
  lateralRaise: { name: 'Cable / Machine Lateral Raise', he: 'הרחקת כתפיים בכבל / מכונה', pattern: 'shoulder', cue: 'Light load; stop before discomfort.', cueHe: 'משקל קל; עצור לפני אי-נוחות.', equipment: 'Cable / shoulder machine', equipmentHe: 'כבל / מכונת כתפיים', equipmentType: 'cable' },
  shoulderPress: { name: 'Machine Shoulder Press', he: 'לחיצת כתפיים במכונה', pattern: 'shoulder', cue: 'Do not force overhead range; stop if pinching.', cueHe: 'אל תכריח טווח מעל הראש; עצור אם יש צביטה.', equipment: 'Shoulder press machine', equipmentHe: 'מכונת לחיצת כתפיים', equipmentType: 'machine' },
  cableCurl: { name: 'Cable Curl', he: 'כפיפת מרפק בכבל', pattern: 'arms', cue: 'Keep wrist neutral and elbows quiet.', cueHe: 'שורש כף יד ניטרלי ומרפקים יציבים.', equipment: 'Cable station', equipmentHe: 'תחנת כבלים', equipmentType: 'cable' },
  hammerCurl: { name: 'Hammer Curl', he: 'כפיפת פטיש', pattern: 'arms', cue: 'Neutral wrist; controlled reps.', cueHe: 'שורש כף יד ניטרלי וחזרות מבוקרות.', equipment: 'Dumbbells', equipmentHe: 'משקולות יד', equipmentType: 'dumbbell' },
  pressdown: { name: 'Rope Triceps Pressdown', he: 'פשיטת מרפק בכבל עם חבל', pattern: 'arms', cue: 'Keep elbows at sides and wrists comfortable.', cueHe: 'מרפקים צמודים לגוף ושורשי כף יד נוחים.', equipment: 'Cable station + rope', equipmentHe: 'כבל + חבל', equipmentType: 'cable' },
  calf: { name: 'Standing / Seated Calf Raise', he: 'הרמות תאומים בעמידה / ישיבה', pattern: 'calves', cue: 'Pause at top and bottom; controlled range.', cueHe: 'עצירה קצרה למעלה ולמטה, בטווח מבוקר.', equipment: 'Calf machine', equipmentHe: 'מכונת תאומים', equipmentType: 'machine' },
  pallof: { name: 'Pallof Press', he: 'פאלוף פרס', pattern: 'core', cue: 'Brace; resist rotation. No breath holding.', cueHe: 'ייצב את הגו והתנגד לסיבוב. אל תעצור נשימה.', equipment: 'Cable station', equipmentHe: 'תחנת כבלים', equipmentType: 'cable' },
  deadBug: { name: 'Dead Bug', he: 'דד באג', pattern: 'core', cue: 'Keep ribs down; only extend as far as you can control.', cueHe: 'שמור צלעות למטה והארך רק עד הטווח שבשליטה.', equipment: 'Mat', equipmentHe: 'מזרן', equipmentType: 'bodyweight' },
  birdDog: { name: 'Bird Dog', he: 'בירד דוג', pattern: 'core', cue: 'Reach long; avoid twisting or arching.', cueHe: 'הארך את הגפיים בלי להסתובב או לקשת את הגב.', equipment: 'Mat', equipmentHe: 'מזרן', equipmentType: 'bodyweight' },
  plank: { name: 'Incline Plank', he: 'פלאנק בשיפוע', pattern: 'core', cue: 'Brace gently; stop before back or shoulder discomfort.', cueHe: 'ייצב בעדינות; עצור לפני אי-נוחות בגב או בכתף.', equipment: 'Bench', equipmentHe: 'ספסל', equipmentType: 'bench' },
  suitcase: { name: 'Suitcase Carry', he: 'נשיאת מזוודה', pattern: 'carry', cue: 'Walk tall; do not lean toward or away from the weight.', cueHe: 'לך זקוף בלי לנטות אל המשקל או ממנו.', equipment: 'Dumbbell / kettlebell', equipmentHe: 'משקולת יד / קטלבל', equipmentType: 'dumbbell' },
  bike: { name: 'Stationary Bike', he: 'אופני כושר', pattern: 'cardio', cue: 'Conversational pace unless otherwise noted.', cueHe: 'קצב שבו עדיין אפשר לדבר, אלא אם צוין אחרת.', equipment: 'Exercise bike', equipmentHe: 'אופני כושר', equipmentType: 'bike' },
  treadmill: { name: 'Treadmill Walk', he: 'הליכה על הליכון', pattern: 'cardio', cue: 'Comfortable pace; incline optional.', cueHe: 'קצב נוח; שיפוע לפי הצורך.', equipment: 'Treadmill', equipmentHe: 'הליכון', equipmentType: 'treadmill' },
  elliptical: { name: 'Elliptical', he: 'אליפטיקל', pattern: 'cardio', cue: 'Smooth, moderate effort.', cueHe: 'מאמץ מתון ותנועה חלקה.', equipment: 'Elliptical', equipmentHe: 'אליפטיקל', equipmentType: 'elliptical' },
  rower: { name: 'Rower', he: 'מכשיר חתירה', pattern: 'cardio', cue: 'Easy technique-focused pace.', cueHe: 'קצב קל עם דגש על טכניקה.', equipment: 'Rowing machine', equipmentHe: 'מכשיר חתירה', equipmentType: 'rower' },
  balanceStand: { name: 'Balance: supported single-leg stand', he: 'שיווי משקל: עמידה על רגל אחת עם תמיכה', pattern: 'balance', cue: 'Use a stable support. Stop if dizzy or unsteady.', cueHe: 'היעזר בתמיכה יציבה. עצור במקרה של סחרחורת או חוסר יציבות.', equipment: 'Stable support', equipmentHe: 'משטח / תמיכה יציבה', equipmentType: 'bodyweight' }
};
Object.entries(EX).forEach(([key, value]) => { value.key = key; });

const SWAP_FAMILIES = [
  ['legPress', 'gobletSquat', 'hackSquat', 'splitSquat', 'stepUp'],
  ['legCurl', 'hipThrust', 'cablePullThrough', 'rdl'],
  ['chestPress', 'dbBench', 'inclinePushup', 'cablePress', 'neutralPress'],
  ['row', 'cableRow', 'pulldown', 'pulldownWide', 'facePull', 'reverseFly'],
  ['facePull', 'reverseFly', 'lateralRaise', 'shoulderPress'],
  ['cableCurl', 'hammerCurl', 'pressdown'],
  ['pallof', 'deadBug', 'birdDog', 'plank', 'suitcase'],
  ['bike', 'treadmill', 'elliptical', 'rower'],
  ['calf'],
  ['balanceStand']
];

const GOAL_LABEL = { general: 'General fitness', fatloss: 'Fat loss', muscle: 'Build muscle', strength: 'Get stronger' };
const GOAL_LABEL_HE = { general: 'כושר כללי', fatloss: 'ירידה באחוזי שומן', muscle: 'בניית שריר', strength: 'התחזקות' };
const ISSUE_LABEL = { lowBack: 'low-back considerations', shoulder: 'shoulder considerations', knee: 'knee considerations', hip: 'hip considerations', neck: 'neck considerations', elbowWrist: 'elbow/wrist considerations' };
const ISSUE_LABEL_HE = { lowBack: 'גב תחתון', shoulder: 'כתף', knee: 'ברך', hip: 'ירך', neck: 'צוואר', elbowWrist: 'מרפק / שורש כף יד' };

const COPY = {
  en: {
    starter: 'STARTER PROGRAM', daysWeek: 'days / week', session: 'session length', experience: 'experience',
    day: 'Workout', exercise: 'Exercise', sets: 'Sets', reps: 'Reps / time', rest: 'Rest', equipment: 'Equipment', modified: 'MODIFIED',
    warmup: 'Warm-up', cardio: 'Weekly cardio', progress: 'How to progress', rules: 'First 4–6 weeks',
    rule1: 'Leave reps in reserve; do not train to failure.', rule2: 'Technique and comfortable range come before load.',
    rule3: 'Use controlled, comfortable movement and adjust any exercise that does not feel right.', rule4: 'Ask staff for a form check before increasing loads aggressively.',
    trainerNote: 'Trainer note', target: 'planned length', startAt: 'Starting effort', programAdjusted: 'Program adjusted for',
    painRule: 'Use a comfortable range and adjust any movement that does not suit the member.',
    noIssues: 'No movement considerations selected. Use controlled technique and a comfortable range.',
    memberNote: 'Member note', minor: 'Minor member', minorText: 'Follow the gym’s youth-supervision policy and applicable instructor requirements.',
    equipmentGuide: 'Equipment', prev: 'Previous workout', next: 'Next workout', routineFor: 'Routine for',
    replace: 'Replace', edited: 'TRAINER EDIT', swapTitle: 'Replace exercise', saveChange: 'Save change',
    resetExercise: 'Reset to generated', recommended: 'Recommended', allSafe: 'All suitable exercises',
    referenceImage: 'Reference image — your exact Binyamin Gym machine may differ.'
  },
  he: {
    starter: 'תוכנית התחלה', daysWeek: 'אימונים בשבוע', session: 'משך אימון', experience: 'רמת ניסיון',
    day: 'אימון', exercise: 'תרגיל', sets: 'סטים', reps: 'חזרות / זמן', rest: 'מנוחה', equipment: 'ציוד', modified: 'מותאם',
    warmup: 'חימום', cardio: 'אירובי שבועי', progress: 'איך מתקדמים', rules: 'כללים ל־4–6 השבועות הראשונים',
    rule1: 'השאירו חזרות ברזרבה ואל תתאמנו עד כשל.', rule2: 'טכניקה וטווח תנועה נוח קודמים להוספת משקל.',
    rule3: 'עבדו בתנועה מבוקרת ונוחה והתאימו כל תרגיל שאינו מרגיש מתאים.', rule4: 'בקשו מאיש צוות לבדוק טכניקה לפני העלאה משמעותית של המשקל.',
    trainerNote: 'הערת מאמן', target: 'משך מתוכנן', startAt: 'עצימות התחלתית', programAdjusted: 'התוכנית הותאמה עבור',
    painRule: 'עבדו בטווח נוח והתאימו כל תנועה שאינה מתאימה למתאמן.',
    noIssues: 'לא סומנו מגבלות תנועה. יש לעבוד בטכניקה מבוקרת ובטווח נוח.',
    memberNote: 'הערת מתאמן', minor: 'מתאמן קטין', minorText: 'יש לפעול לפי מדיניות הפיקוח לנוער ודרישות ההדרכה הרלוונטיות.',
    equipmentGuide: 'ציוד', prev: 'האימון הקודם', next: 'האימון הבא', routineFor: 'תוכנית עבור',
    replace: 'החלפה', edited: 'נערך ע״י מאמן', swapTitle: 'החלפת תרגיל', saveChange: 'שמירת שינוי',
    resetExercise: 'חזרה לתרגיל המקורי', recommended: 'מומלץ', allSafe: 'כל התרגילים המתאימים',
    referenceImage: 'תמונת המחשה — המכשיר בפועל בבנימין ג׳ים עשוי להיראות אחרת.'
  }
};

function esc(s) {
  return String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function getFormData() {
  const issues = $$('#issueToggles input:checked').map(x => x.value);
  const genderInput = $('input[name="gender"]:checked');
  return {
    id: editingProfileId || makeId(),
    name: $('#name').value.trim(), age: Number($('#age').value), height: Number($('#height').value), weight: Number($('#weight').value),
    gender: genderInput?.value || '',
    goal: $('input[name="goal"]:checked').value, experience: $('#experience').value, days: Number($('#days').value), duration: Number($('#duration').value),
    activity: $('#activity').value, cardioPreference: $('#cardioPreference').value, issues, issueNotes: $('#issueNotes').value.trim(),
    trainerNotes: $('#trainerNotes').value.trim(), updatedAt: new Date().toISOString()
  };
}

function setFormData(p) {
  editingProfileId = p.id || null;
  $('#name').value = p.name || ''; $('#age').value = p.age ?? 35; $('#height').value = p.height ?? 175; $('#weight').value = p.weight ?? 80;
  $$('input[name="gender"]').forEach(x => x.checked = !!p.gender && x.value === p.gender);
  const goal = $(`input[name="goal"][value="${p.goal || 'general'}"]`); if (goal) goal.checked = true;
  $('#experience').value = p.experience || 'new'; $('#days').value = String(p.days || 3); $('#duration').value = String(p.duration || 60);
  $('#activity').value = p.activity || 'moderate'; $('#cardioPreference').value = p.cardioPreference || 'any';
  $$('#issueToggles input').forEach(x => x.checked = (p.issues || []).includes(x.value)); $('#issueNotes').value = p.issueNotes || '';
  $('#trainerNotes').value = p.trainerNotes || '';
}

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
    if (key === 'rdl') swap('legCurl', 'swapped to reduce loaded spinal/hip-hinge demand', 'הוחלף כדי להפחית עומס בציר הירך והגב');
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
    sets: override.sets || volumeFor(p, role),
    reps: override.reps || repRange(p, role),
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
    let exercises = rows.slice(0, maxExercises).map(([k, role]) => exerciseRow(k, p, role));
    if (p.goal === 'muscle' && p.duration >= 60 && exercises.length < 7) exercises.push(exerciseRow(i % 2 ? 'cableCurl' : 'pressdown', p, 'accessory'));
    if (p.goal === 'fatloss' && p.duration >= 45) {
      const c = chooseCardio(p);
      exercises.push({ ...c, key: c.key, sets: '1', reps: p.duration >= 60 ? '10–15 min' : '6–10 min', rest: '—', role: 'cardio', note: 'Steady moderate pace; you should still be able to speak in short sentences.', noteHe: 'קצב מתון ויציב; עדיין אמור להיות אפשרי לדבר במשפטים קצרים.', substituted: false, generatedKey: c.key, manualSwap: false });
    }
    if (p.age >= 65 && p.duration >= 45) exercises.push({ ...EX.balanceStand, key: EX.balanceStand.key, sets: '2', reps: '20–30 sec/side', rest: '30 sec', role: 'balance', note: EX.balanceStand.cue, noteHe: EX.balanceStand.cueHe, substituted: false, generatedKey: EX.balanceStand.key, manualSwap: false });
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


function equipmentIcon(type='machine') {
  const common = 'viewBox="0 0 64 64" aria-hidden="true"';
  const icons = {
    dumbbell: `<svg ${common}><path d="M12 23v18M18 19v26M46 19v26M52 23v18M18 32h28"/></svg>`,
    cable: `<svg ${common}><path d="M14 52V12h36v40M14 18h36M32 18v10M32 28c0 6-10 6-10 13M22 41h8M40 29v19M35 48h10"/></svg>`,
    bench: `<svg ${common}><path d="M14 40h30l6 8M22 40v10M42 40v10M18 31h25v9"/></svg>`,
    box: `<svg ${common}><rect x="14" y="27" width="36" height="23" rx="2"/><path d="M18 27l5-10h28"/></svg>`,
    bodyweight: `<svg ${common}><circle cx="32" cy="15" r="5"/><path d="M32 20v16M22 28l10-7 10 7M32 36l-9 15M32 36l9 15"/></svg>`,
    treadmill: `<svg ${common}><path d="M10 46h38l6 6H16zM40 46l6-28h8M46 18h8M20 50v4M48 50v4"/></svg>`,
    bike: `<svg ${common}><circle cx="18" cy="43" r="10"/><circle cx="47" cy="43" r="10"/><path d="M18 43l11-18 8 18M29 25h9M34 20h9M37 43h10"/></svg>`,
    elliptical: `<svg ${common}><path d="M18 52c11-4 18-15 20-31M26 52c8-5 14-13 18-24M38 21h8M44 28h7M13 52h38"/></svg>`,
    rower: `<svg ${common}><path d="M10 48h44M18 45l22-18M37 27h10M26 38l-6-10M20 28h-7"/></svg>`,
    machine: `<svg ${common}><path d="M16 52V14h32v38M16 20h32M24 42h20M28 42V30h12v12M22 52h20"/></svg>`
  };
  return icons[type] || icons.machine;
}

function localizedExercise(ex, lang) {
  return {
    name: lang === 'he' ? (ex.he || ex.name) : ex.name,
    cue: lang === 'he' ? (ex.noteHe || ex.cueHe || ex.note || ex.cue) : (ex.note || ex.cue),
    equipment: lang === 'he' ? (ex.equipmentHe || ex.equipment) : ex.equipment,
    reason: lang === 'he' ? ex.reasonHe : ex.reason,
    rest: lang === 'he' ? restHe(ex.rest) : ex.rest
  };
}

function issueNotice(plan, lang) {
  const c = COPY[lang]; const p = plan.profile;
  if (!p.issues?.length) return c.noIssues;
  const labels = p.issues.map(i => lang === 'he' ? ISSUE_LABEL_HE[i] : ISSUE_LABEL[i]);
  return `${c.programAdjusted}: ${labels.join(lang === 'he' ? '، ' : ', ')}. ${c.painRule}`;
}

function experienceLabel(value, lang) {
  const en = { new: 'New / returning', some: '6–24 months', experienced: '2+ years' };
  const he = { new: 'חדש / חוזר', some: '6–24 חוד׳', experienced: '2+ שנים' };
  return (lang === 'he' ? he : en)[value] || value;
}

function renderExercise(ex, lang, dayIndex, exerciseIndex) {
  const c = COPY[lang]; const l = localizedExercise(ex, lang);
  const displayReps = lang === 'he' ? formatHebrewMeasure(ex.reps) : ex.reps;
  const editable = !memberShareMode;
  const editMarkup = editable
    ? `<button type="button" class="exercise-edit-btn no-print" data-edit-exercise="${dayIndex}:${exerciseIndex}" aria-label="${esc(c.replace)} ${esc(l.name)}" title="${esc(c.replace)}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7h-9M20 7l-3-3M20 7l-3 3M4 17h9M4 17l3-3M4 17l3 3"/></svg>
        <span>${c.replace}</span>
      </button>`
    : '';
  const trainerTag = ex.manualSwap && editable ? `<span class="trainer-edit-tag no-print">${c.edited}</span>` : '';
  return `<div class="exercise-item ${editable ? 'editable-exercise' : ''}" data-exercise-row="${dayIndex}:${exerciseIndex}">
    ${equipmentVisual(ex, 'equipment-thumb', l.equipment)}
    <div class="exercise-main">
      <div class="exercise-name-line"><strong>${esc(l.name)}</strong>${ex.substituted ? `<span class="sub-tag">${c.modified}</span>` : ''}${trainerTag}</div>
      <p>${esc(l.cue || '')}${ex.substituted && l.reason ? ` · ${esc(l.reason)}` : ''}</p>
      <span class="equipment-pill">${esc(l.equipment || c.equipmentGuide)}</span>
    </div>
    <div class="exercise-stat sets-stat"><b>${esc(ex.sets)}</b><span>${c.sets}</span></div>
    <div class="exercise-stat reps-stat"><b>${esc(displayReps)}</b><span>${c.reps}</span></div>
    <div class="exercise-stat rest-stat"><b>${esc(l.rest)}</b><span>${c.rest}</span></div>
    ${editMarkup}
  </div>`;
}

function renderPlan(plan) {
  const lang = currentLanguage; const c = COPY[lang]; const p = plan.profile; const rtl = lang === 'he';
  const goal = lang === 'he' ? GOAL_LABEL_HE[p.goal] : GOAL_LABEL[p.goal];
  const issueText = issueNotice(plan, lang);
  const tabs = plan.workouts.map((w,i) => `<button type="button" class="day-tab ${i===activeDayIndex?'active':''}" data-day-index="${i}"><span>${c.day} ${i+1}</span><b>${esc(lang==='he'?w.nameHe:w.name)}</b></button>`).join('');
  const pages = plan.workouts.map((w,i) => `<section class="day-page ${i===activeDayIndex?'active':''}" data-day="${i}">
      <div class="print-day-brand"><img src="${LOGO_SRC}" alt="Binyamin Gym" onerror="this.onerror=null;this.src='${LOGO_FALLBACK_SRC}'"><div><b>Binyamin Gym</b><span>${esc(p.name || (rtl ? 'מתאמן' : 'Member'))}</span></div></div>
      <div class="day-head"><div><span>${c.day} ${i+1}</span><h3>${esc(rtl?w.nameHe:w.name)}</h3></div><div class="day-duration"><b>${p.duration} ${rtl?'דק׳':'min'}</b><span>${c.target}</span></div></div>
      <div class="exercise-list">${w.exercises.map((ex, exerciseIndex) => renderExercise(ex, lang, i, exerciseIndex)).join('')}</div>
      <div class="day-guidance">
        <div><span>${c.warmup}</span><p>${esc(rtl?plan.warmupHe:plan.warmup)}</p></div>
        <div><span>${c.startAt}</span><p><b>${esc(rtl ? plan.effort.rpeHe : plan.effort.rpe)}</b> · ${esc(rtl?plan.effort.rirHe:plan.effort.rir)}</p></div>
      </div>
    </section>`).join('');

  $('#routineView').innerHTML = `<article class="routine ${rtl?'routine-rtl':''}" dir="${rtl?'rtl':'ltr'}">
    <div class="routine-brand-row"><img src="${LOGO_SRC}" alt="Binyamin Gym" onerror="this.onerror=null;this.src='${LOGO_FALLBACK_SRC}'"><div><b>Binyamin Gym</b><span>${rtl?'תוכנית אימונים אישית':'Personal training plan'}</span></div></div>
    <div class="routine-hero">
      <div class="routine-title"><p class="step">${c.starter}</p><h2>${esc(p.name || (rtl?'תוכנית מתאמן':'Member routine'))}</h2><p>${esc(goal)}</p></div>
      <div class="routine-meta-grid">
        <div><b>${p.days}</b><span>${c.daysWeek}</span></div>
        <div><b>${p.duration} ${rtl?'דק׳':'min'}</b><span>${c.session}</span></div>
        <div><b>${esc(experienceLabel(p.experience, lang))}</b><span>${c.experience}</span></div>
      </div>
    </div>
    <div class="notice ${p.issues?.length?'warn':'success'}">${esc(issueText)}${p.issueNotes ? `<br><b>${c.memberNote}:</b> ${esc(p.issueNotes)}` : ''}</div>
    ${p.age < 18 ? `<div class="notice warn"><b>${c.minor}:</b> ${c.minorText}</div>` : ''}
    <div class="day-tabs no-print">${tabs}</div>
    <div class="day-pages">${pages}</div>
    <div class="routine-bottom">
      <div class="bottom-card"><h3>${c.cardio}</h3><p>${esc(rtl?plan.weeklyCardioHe:plan.weeklyCardio)}</p></div>
      <div class="bottom-card"><h3>${c.progress}</h3><p>${esc(rtl?plan.progressionHe:plan.progression)}</p></div>
      <div class="bottom-card rules-card"><h3>${c.rules}</h3><ul><li>${c.rule1}</li><li>${c.rule2}</li><li>${c.rule3}</li><li>${c.rule4}</li></ul></div>
      ${p.trainerNotes ? `<div class="bottom-card"><h3>${c.trainerNote}</h3><p>${esc(p.trainerNotes)}</p></div>` : ''}
    </div>
    <div class="routine-nav no-print"><button type="button" class="btn secondary" id="prevDayBtn" ${activeDayIndex===0?'disabled':''}>${c.prev}</button><span>${activeDayIndex+1} / ${plan.workouts.length}</span><button type="button" class="btn secondary" id="nextDayBtn" ${activeDayIndex===plan.workouts.length-1?'disabled':''}>${c.next}</button></div>
    <p class="print-footer">${rtl?'תוכנית התחלה המבוססת על שאלון הקבלה. מומלץ לבצע הערכה מחדש לאחר כ־4–6 שבועות או כאשר המטרות, ההעדפות או היכולת משתנות.':'Starter routine based on member intake. Reassess after ~4–6 weeks or when goals, preferences or ability change.'}</p>
  </article>`;
  bindRoutineNavigation();
}

function bindRoutineNavigation() {
  $$('.day-tab').forEach(btn => btn.addEventListener('click', () => { activeDayIndex = Number(btn.dataset.dayIndex); renderPlan(currentPlan); }));
  $('#prevDayBtn')?.addEventListener('click', () => { if (activeDayIndex > 0) { activeDayIndex -= 1; renderPlan(currentPlan); } });
  $('#nextDayBtn')?.addEventListener('click', () => { if (currentPlan && activeDayIndex < currentPlan.workouts.length - 1) { activeDayIndex += 1; renderPlan(currentPlan); } });
  $$('[data-edit-exercise]').forEach(btn => btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const [dayIndex, exerciseIndex] = btn.dataset.editExercise.split(':').map(Number);
    openExerciseSwap(dayIndex, exerciseIndex);
  }));
  $$('.editable-exercise').forEach(row => row.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    const [dayIndex, exerciseIndex] = row.dataset.exerciseRow.split(':').map(Number);
    openExerciseSwap(dayIndex, exerciseIndex);
  }));
}

function swapFamilyScore(currentKey, candidateKey) {
  const current = EX[currentKey]; const candidate = EX[candidateKey];
  if (!current || !candidate) return 99;
  if (current.pattern === candidate.pattern) return 0;
  if (SWAP_FAMILIES.some(group => group.includes(currentKey) && group.includes(candidateKey))) return 1;
  return 2;
}

function isCandidateSafe(key, profile) {
  const safe = safeExercise(key, profile);
  return safe.key === key;
}

function candidateCategory(key) {
  const p = EX[key]?.pattern;
  if (p === 'cardio') return 'cardio';
  if (p === 'balance') return 'balance';
  return 'strength';
}

function getSwapCandidates(current, profile, mode='recommended', search='') {
  const currentKey = current.key;
  const category = candidateCategory(currentKey);
  let candidates = Object.keys(EX)
    .filter(key => key !== currentKey)
    .filter(key => candidateCategory(key) === category)
    .filter(key => isCandidateSafe(key, profile))
    .map(key => ({ key, score: swapFamilyScore(currentKey, key) }));

  if (mode === 'recommended') candidates = candidates.filter(x => x.score <= 1);

  const q = search.trim().toLowerCase();
  if (q) {
    candidates = candidates.filter(({key}) => {
      const ex = EX[key];
      return [ex.name, ex.he, ex.equipment, ex.equipmentHe].some(v => String(v || '').toLowerCase().includes(q));
    });
  }

  candidates.sort((a, b) => a.score - b.score || EX[a.key].name.localeCompare(EX[b.key].name));
  return candidates;
}

function swapMatchLabel(score, lang='en') {
  if (lang === 'he') return score === 0 ? 'התאמה קרובה' : score === 1 ? 'אפשרות דומה' : 'אפשרות נוספת';
  return score === 0 ? 'Closest match' : score === 1 ? 'Similar option' : 'Other option';
}

function renderSwapDialog() {
  if (!swapContext || !currentPlan) return;
  const { dayIndex, exerciseIndex } = swapContext;
  const current = currentPlan.workouts?.[dayIndex]?.exercises?.[exerciseIndex];
  if (!current) return;
  const lang = currentLanguage;
  const currentL = localizedExercise(current, lang);
  const search = $('#swapSearch')?.value || '';
  const candidates = getSwapCandidates(current, currentPlan.profile, swapFilter, search);

  $('#swapCurrentExercise').innerHTML = `
    ${equipmentVisual(current, 'swap-current-icon')}
    <div>
      <span>${lang === 'he' ? 'תרגיל נוכחי' : 'Current exercise'}</span>
      <strong>${esc(currentL.name)}</strong>
      <small>${esc(currentL.equipment || '')} · ${esc(current.sets)} × ${esc(current.reps)}</small>
    </div>`;

  $('#swapSuggestionList').innerHTML = candidates.length ? candidates.map(({key, score}) => {
    const ex = EX[key];
    const l = localizedExercise({ ...ex, note: ex.cue, noteHe: ex.cueHe, rest: '' }, lang);
    const selected = swapSelectionKey === key;
    return `<button type="button" class="swap-option ${selected ? 'selected' : ''}" data-swap-key="${key}">
      ${equipmentVisual(ex, 'swap-option-icon')}
      <span class="swap-option-copy">
        <span class="swap-match">${esc(swapMatchLabel(score, lang))}</span>
        <strong>${esc(l.name)}</strong>
        <small>${esc(l.equipment)} · ${esc(l.cue)}</small>
      </span>
      <span class="swap-check" aria-hidden="true">${selected ? '✓' : ''}</span>
    </button>`;
  }).join('') : `<div class="swap-empty">${lang === 'he' ? 'לא נמצאו חלופות מתאימות. נסו לעבור ל״כל התרגילים המתאימים״ או לשנות את החיפוש.' : 'No matching alternatives found. Try “All suitable exercises” or change the search.'}</div>`;

  $$('.swap-option').forEach(btn => btn.addEventListener('click', () => {
    swapSelectionKey = btn.dataset.swapKey;
    renderSwapDialog();
  }));
  $$('.swap-filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.swapFilter === swapFilter));
  $('#saveSwapBtn').disabled = !swapSelectionKey;
  const resetBtn = $('#resetExerciseBtn');
  if (resetBtn) resetBtn.hidden = !current.manualSwap;
}

function openExerciseSwap(dayIndex, exerciseIndex) {
  if (memberShareMode || !currentPlan) return;
  swapContext = { dayIndex, exerciseIndex };
  swapSelectionKey = null;
  swapFilter = 'recommended';
  const dialog = $('#exerciseSwapDialog');
  if (!dialog) return;
  const day = currentPlan.workouts[dayIndex];
  $('#swapDialogTitle').textContent = currentLanguage === 'he' ? COPY.he.swapTitle : COPY.en.swapTitle;
  $('#swapDialogSub').textContent = currentLanguage === 'he'
    ? `${day.nameHe || day.name} · בחרו חלופה ושמרו את השינוי. הסטים, החזרות והמנוחה יישארו כפי שהם.`
    : `${day.name} · Choose a replacement and save. Sets, reps and rest stay unchanged.`;
  $('#swapSearch').value = '';
  $('#swapSearch').placeholder = currentLanguage === 'he' ? 'חיפוש לפי תרגיל או ציוד…' : 'Search exercise or equipment…';
  $('#saveSwapBtn').textContent = currentLanguage === 'he' ? COPY.he.saveChange : COPY.en.saveChange;
  $('#resetExerciseBtn').textContent = currentLanguage === 'he' ? COPY.he.resetExercise : COPY.en.resetExercise;
  $('#cancelSwapBtn').textContent = currentLanguage === 'he' ? 'ביטול' : 'Cancel';
  $('#swapRecommendedBtn').textContent = currentLanguage === 'he' ? COPY.he.recommended : COPY.en.recommended;
  $('#swapAllBtn').textContent = currentLanguage === 'he' ? COPY.he.allSafe : COPY.en.allSafe;
  $('#swapGuidanceNoteText').textContent = currentLanguage === 'he'
    ? 'החלופות מסוננות לפי מגבלות התנועה שסומנו. שיקול הדעת של המאמן קודם לכל.'
    : "Suggestions are filtered using the member's movement considerations. Trainer judgement still comes first.";
  dialog.dir = currentLanguage === 'he' ? 'rtl' : 'ltr';
  renderSwapDialog();
  dialog.showModal();
}

function applyExerciseSwap(dayIndex, exerciseIndex, newKey) {
  const workout = currentPlan?.workouts?.[dayIndex];
  const current = workout?.exercises?.[exerciseIndex];
  const base = EX[newKey];
  if (!current || !base) return;
  workout.exercises[exerciseIndex] = {
    ...base,
    key: newKey,
    sets: current.sets,
    reps: current.reps,
    rest: current.rest,
    role: current.role,
    note: base.cue,
    noteHe: base.cueHe,
    substituted: false,
    reason: '',
    reasonHe: '',
    originalName: '',
    generatedKey: current.generatedKey || current.key,
    manualSwap: true
  };
  activeDayIndex = dayIndex;
  renderPlan(currentPlan);
  flashToast(currentLanguage === 'he' ? 'התרגיל עודכן' : 'Exercise updated');
}

function resetExerciseToGenerated(dayIndex, exerciseIndex) {
  const regenerated = buildPlan(currentPlan.profile);
  const original = regenerated?.workouts?.[dayIndex]?.exercises?.[exerciseIndex];
  if (!original) return;
  currentPlan.workouts[dayIndex].exercises[exerciseIndex] = original;
  activeDayIndex = dayIndex;
  renderPlan(currentPlan);
  flashToast(currentLanguage === 'he' ? 'התרגיל הוחזר לתוכנית שנוצרה' : 'Restored generated exercise');
}

function serializeRoutineState(plan) {
  if (!plan) return null;
  return plan.workouts.map(w => ({
    name: w.name,
    nameHe: w.nameHe,
    exercises: w.exercises.map(ex => ({
      key: ex.key,
      sets: ex.sets,
      reps: ex.reps,
      rest: ex.rest,
      role: ex.role,
      substituted: !!ex.substituted,
      reason: ex.reason || '',
      reasonHe: ex.reasonHe || '',
      originalName: ex.originalName || '',
      generatedKey: ex.generatedKey || ex.key,
      manualSwap: !!ex.manualSwap
    }))
  }));
}

function restoreRoutineState(profile) {
  const plan = buildPlan(profile);
  if (!profile.routineOverride) return plan;
  plan.workouts = profile.routineOverride.map((w, dayIndex) => ({
    name: w.name || plan.workouts[dayIndex]?.name || `Day ${dayIndex + 1}`,
    nameHe: w.nameHe || plan.workouts[dayIndex]?.nameHe || `אימון ${dayIndex + 1}`,
    exercises: (w.exercises || []).map((item, exerciseIndex) => {
      const base = EX[item.key] || plan.workouts[dayIndex]?.exercises?.[exerciseIndex] || EX.chestPress;
      return {
        ...base,
        key: base.key,
        sets: item.sets,
        reps: item.reps,
        rest: item.rest,
        role: item.role,
        note: base.cue,
        noteHe: base.cueHe,
        substituted: !!item.substituted,
        reason: item.reason || '',
        reasonHe: item.reasonHe || '',
        originalName: item.originalName || '',
        generatedKey: item.generatedKey || item.key,
        manualSwap: !!item.manualSwap
      };
    })
  }));
  return plan;
}

function flashToast(message) {
  const toast = $('#appToast');
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(flashToast.timer);
  flashToast.timer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.hidden = true; }, 180);
  }, 1600);
}

function getProfiles() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
function setProfiles(arr) { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }
function saveCurrentProfile() {
  const p = getFormData(); if (!p.name) { alert('Add a member name before saving the profile.'); return; } if (!p.gender) { alert('Select Male or Female before saving the profile.'); return; }
  if (currentPlan && currentPlan.profile?.id === p.id) p.routineOverride = serializeRoutineState(currentPlan);
  const profiles = getProfiles(); const idx = profiles.findIndex(x => x.id === p.id); if (idx >= 0) profiles[idx] = p; else profiles.unshift(p);
  setProfiles(profiles); editingProfileId = p.id;
  const lower = $('#saveProfileBtn'); if (lower) { const old = lower.textContent; lower.textContent = 'Saved ✓'; setTimeout(() => lower.textContent = old, 1000); }
  const top = $('#saveProfileBtnTop'); if (top) { const old = top.innerHTML; top.textContent = 'Saved ✓'; setTimeout(() => top.innerHTML = old, 1000); }
}

function renderSaved() {
  const profiles = getProfiles();
  $('#savedList').innerHTML = profiles.length ? profiles.map(p => `<div class="saved-row"><div><strong>${esc(p.name || 'Unnamed')}</strong><small>${p.age} yrs • ${p.gender === 'female' ? 'Female' : p.gender === 'male' ? 'Male' : 'Gender not set'} • ${GOAL_LABEL[p.goal] || p.goal} • ${p.days} days/week</small></div><div class="row-actions"><button class="btn ghost" data-load="${p.id}">Load</button><button class="btn danger" data-delete="${p.id}">Delete</button></div></div>`).join('') : '<p class="muted">No profiles saved yet.</p>';
  $$('[data-load]').forEach(b => b.addEventListener('click', () => {
    const p = profiles.find(x => x.id === b.dataset.load);
    if (p) {
      setFormData(p);
      currentPlan = p.routineOverride ? restoreRoutineState(p) : null;
      activeDayIndex = 0;
      if (currentPlan) { renderPlan(currentPlan); setOutputState(true); } else { $('#routineView').innerHTML = ''; setOutputState(false); }
      $('#savedDialog').close();
      window.scrollTo({top:0, behavior:'smooth'});
    }
  }));
  $$('[data-delete]').forEach(b => b.addEventListener('click', () => { setProfiles(profiles.filter(x => x.id !== b.dataset.delete)); renderSaved(); }));
}

function setOutputState(hasPlan=false) {
  $('#emptyState').hidden = hasPlan; $('#routineView').hidden = !hasPlan;
  $('#outputPanel').classList.toggle('has-routine', hasPlan);
  const he = currentLanguage === 'he';
  $('#outputStepLabel').textContent = hasPlan && he ? 'תוכנית מתאמן' : 'MEMBER ROUTINE';
  $('#outputSubtext').textContent = hasPlan ? (he ? 'תוכנית אישית לפי אימונים' : 'Workout-by-workout member program') : 'Generate a program to preview it here';
  $('#previewStatusText').textContent = hasPlan ? (he ? 'נוצרה' : 'Generated') : 'Ready';
  $('#printBtn').disabled = !hasPlan; $('#shareBtn').disabled = !hasPlan;
}

function resetForm() {
  editingProfileId = null; $('#intakeForm').reset(); $('#age').value=35; $('#height').value=175; $('#weight').value=80; $('#days').value='3'; $('#duration').value='60'; $('#activity').value='moderate';
  currentPlan=null; activeDayIndex=0; setOutputState(false); $('#routineView').innerHTML='';
}

function publicSharePlan(plan) {
  // Compact v3 payload keeps no-backend member links comfortably short.
  // Deliberately excludes height, weight, gender and movement-consideration details.
  const p = plan.profile;
  return {
    v: 3,
    l: currentLanguage,
    p: { n: p.name || '', g: p.goal, e: p.experience, d: p.days, t: p.duration, a: p.activity, q: p.trainerNotes || '', m: p.age < 18 ? 1 : 0 },
    w: plan.workouts.map(w => ({
      n: w.name,
      h: w.nameHe,
      x: w.exercises.map(ex => [ex.key, ex.sets, ex.reps, ex.rest, ex.role || '', ex.substituted ? 1 : 0, ex.manualSwap ? 1 : 0])
    }))
  };
}

function normalizeSharedPlan(raw) {
  // v3 compact payload
  if (raw?.v === 3 && raw?.p && Array.isArray(raw?.w)) {
    return {
      lang: raw.l === 'he' ? 'he' : 'en',
      profile: {
        name: raw.p.n || '', goal: raw.p.g || 'general', experience: raw.p.e || 'new',
        days: Number(raw.p.d || 3), duration: Number(raw.p.t || 60), activity: raw.p.a || 'moderate',
        trainerNotes: raw.p.q || '', isMinor: !!raw.p.m
      },
      workouts: raw.w.map(w => ({
        name: w.n || 'Workout', nameHe: w.h || 'אימון',
        exercises: (w.x || []).map(x => ({ key:x[0], sets:x[1], reps:x[2], rest:x[3], role:x[4], substituted:!!x[5], manualSwap:!!x[6] }))
      }))
    };
  }
  // Backward compatibility with v2 links already sent to members.
  return raw;
}

function inflateSharedPlan(raw) {
  const shared = normalizeSharedPlan(raw);
  const sp = shared.profile || {};
  const profile = {
    name: sp.name || '', goal: sp.goal || 'general', experience: sp.experience || 'new', days: Number(sp.days || 3), duration: Number(sp.duration || 60),
    activity: sp.activity || 'moderate', cardioPreference: 'any', trainerNotes: sp.trainerNotes || '',
    age: sp.isMinor ? 17 : 18, height: 175, weight: 75, gender: '', issues: [], issueNotes: ''
  };
  const plan = buildPlan(profile);
  plan.workouts = (shared.workouts || []).map(w => ({
    name: w.name,
    nameHe: w.nameHe,
    exercises: (w.exercises || []).map(item => {
      const base = EX[item.key] || EX.chestPress;
      return { ...base, key: base.key, sets: item.sets, reps: item.reps, rest: item.rest, role: item.role, note: base.cue, noteHe: base.cueHe, substituted: !!item.substituted, reason: '', reasonHe: '', generatedKey: base.key, manualSwap: !!item.manualSwap };
    })
  }));
  return { ...plan, sharedLanguage: shared.lang || 'en' };
}

function encodeShare(payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload)); let binary = ''; for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function decodeShare(encoded) {
  const padded = encoded.replace(/-/g,'+').replace(/_/g,'/') + '='.repeat((4 - encoded.length % 4) % 4);
  const binary = atob(padded); const bytes = Uint8Array.from(binary, c => c.charCodeAt(0)); return JSON.parse(new TextDecoder().decode(bytes));
}

function buildMemberUrl() {
  if (!currentPlan) return '';
  const encoded = encodeShare(publicSharePlan(currentPlan));
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('routine', encoded);
  return url.toString();
}

async function copyMemberLink() {
  const url = buildMemberUrl();
  if (!url) return;
  try { await navigator.clipboard.writeText(url); }
  catch {
    const t=document.createElement('textarea'); t.value=url; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove();
  }
  flashToast(currentLanguage === 'he' ? 'קישור אישי לתוכנית הועתק ✓' : 'Member routine link copied ✓');
  const btn=$('#shareBtn'); const old=btn.innerHTML; btn.textContent='Link copied ✓'; setTimeout(()=>btn.innerHTML=old,1400);
}

function readSharedPayloadFromUrl() {
  const queryPayload = new URLSearchParams(location.search).get('routine');
  if (queryPayload) return queryPayload;
  const hashMatch = location.hash.match(/^#(?:share|routine)=(.+)$/);
  return hashMatch ? hashMatch[1] : '';
}

function initSharedRoutine() {
  const encoded = readSharedPayloadFromUrl();
  if (!encoded) return false;
  try {
    const raw = decodeShare(encoded);
    const shared = normalizeSharedPlan(raw);
    if (!shared?.workouts?.length || !shared?.profile) throw new Error('Invalid shared routine');
    memberShareMode = true;
    currentLanguage = shared.lang === 'he' ? 'he' : 'en';
    currentPlan = inflateSharedPlan(raw);
    activeDayIndex = 0;
    document.body.classList.add('member-share-mode');
    document.documentElement.classList.remove('shared-routine-loading');
    document.title = `${currentPlan.profile.name ? currentPlan.profile.name + ' — ' : ''}Binyamin Gym Routine`;
    setLanguage(currentLanguage);
    setOutputState(true);
    renderPlan(currentPlan);
    $('#shareBtn').hidden = true;
    $('#saveProfileBtnTop').hidden = true;
    return true;
  } catch (err) {
    document.documentElement.classList.remove('shared-routine-loading');
    console.warn('Could not open shared routine', err);
    flashToast('This routine link could not be opened. Please ask Binyamin Gym for a new link.');
    return false;
  }
}

function setLanguage(lang) {
  currentLanguage = lang === 'he' ? 'he' : 'en';
  $$('.lang-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === currentLanguage));
  if (currentPlan) { renderPlan(currentPlan); setOutputState(true); }
}

function openEquipmentImage(src, label='Equipment') {
  const dialog = $('#equipmentImageDialog');
  const img = $('#equipmentImageLarge');
  if (!dialog || !img || !src) return;
  img.src = src;
  img.alt = label;
  $('#equipmentImageTitle').textContent = label;
  $('#equipmentImageHint').textContent = COPY[currentLanguage].referenceImage;
  dialog.dir = currentLanguage === 'he' ? 'rtl' : 'ltr';
  dialog.showModal();
}

document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-equipment-image]');
  if (!trigger) return;
  e.preventDefault();
  e.stopPropagation();
  openEquipmentImage(trigger.dataset.equipmentImage, trigger.dataset.equipmentLabel || 'Equipment');
});

$('#closeEquipmentImageBtn')?.addEventListener('click', () => $('#equipmentImageDialog')?.close());
$('#equipmentImageDialog')?.addEventListener('click', (e) => {
  if (e.target === $('#equipmentImageDialog')) $('#equipmentImageDialog').close();
});

$('#intakeForm').addEventListener('submit', (e) => {
  e.preventDefault(); const p=getFormData(); editingProfileId = p.id; currentPlan=buildPlan(p); activeDayIndex=0; renderPlan(currentPlan); setOutputState(true);
  if (window.innerWidth < 1180) $('#outputPanel').scrollIntoView({behavior:'smooth', block:'start'});
});
$('#printBtn').addEventListener('click', () => window.print());
$('#shareBtn').addEventListener('click', copyMemberLink);
$('#newMemberBtn').addEventListener('click', resetForm);
$('#saveProfileBtn').addEventListener('click', saveCurrentProfile);
$('#savedBtn').addEventListener('click', () => { renderSaved(); $('#savedDialog').showModal(); });
$('#closeDialogBtn').addEventListener('click', () => $('#savedDialog').close());
$('#clearSavedBtn').addEventListener('click', () => { if (confirm('Delete all locally saved member profiles?')) { setProfiles([]); renderSaved(); } });
$('#exportBtn').addEventListener('click', () => { const blob=new Blob([JSON.stringify(getProfiles(),null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`binyamin-gym-members-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(a.href); });
$('#importInput').addEventListener('change', async (e) => { const file=e.target.files?.[0]; if(!file)return; try { const data=JSON.parse(await file.text()); if(!Array.isArray(data)) throw new Error('Backup must contain a profile array.'); setProfiles(data); renderSaved(); } catch(err){ alert(`Could not import backup: ${err.message}`); } e.target.value=''; });
$$('.lang-btn').forEach(btn => btn.addEventListener('click', () => setLanguage(btn.dataset.lang)));

$('#closeSwapDialogBtn')?.addEventListener('click', () => $('#exerciseSwapDialog')?.close());
$('#cancelSwapBtn')?.addEventListener('click', () => $('#exerciseSwapDialog')?.close());
$('#swapSearch')?.addEventListener('input', renderSwapDialog);
$$('.swap-filter-btn').forEach(btn => btn.addEventListener('click', () => {
  swapFilter = btn.dataset.swapFilter || 'recommended';
  swapSelectionKey = null;
  renderSwapDialog();
}));
$('#saveSwapBtn')?.addEventListener('click', () => {
  if (!swapContext || !swapSelectionKey) return;
  const { dayIndex, exerciseIndex } = swapContext;
  applyExerciseSwap(dayIndex, exerciseIndex, swapSelectionKey);
  $('#exerciseSwapDialog')?.close();
});
$('#resetExerciseBtn')?.addEventListener('click', () => {
  if (!swapContext) return;
  const { dayIndex, exerciseIndex } = swapContext;
  resetExerciseToGenerated(dayIndex, exerciseIndex);
  $('#exerciseSwapDialog')?.close();
});

setOutputState(false);
if (!initSharedRoutine()) document.documentElement.classList.remove('shared-routine-loading');
