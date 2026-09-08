const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const STORAGE_KEY = 'gym-routine-builder-profiles-v1';
let currentPlan = null;
let editingProfileId = null;

function makeId() {
  return (globalThis.crypto && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : `member-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const EX = {
  legPress: { name: 'Leg Press', pattern: 'squat', cue: 'Controlled depth; keep back supported.' },
  gobletSquat: { name: 'Goblet Squat to Box', pattern: 'squat', cue: 'Sit to a comfortable box height; smooth tempo.' },
  hackSquat: { name: 'Hack Squat / Supported Squat', pattern: 'squat', cue: 'Use a pain-free range and stable foot position.' },
  splitSquat: { name: 'Supported Split Squat', pattern: 'singleLeg', cue: 'Hold support if needed; keep range comfortable.' },
  stepUp: { name: 'Low Step-Up', pattern: 'singleLeg', cue: 'Drive through whole foot; choose a low box.' },
  legCurl: { name: 'Seated / Lying Leg Curl', pattern: 'hinge', cue: 'Slow lowering; avoid arching the back.' },
  hipThrust: { name: 'Hip Thrust / Glute Bridge', pattern: 'hinge', cue: 'Finish with glutes, not low-back extension.' },
  cablePullThrough: { name: 'Cable Pull-Through', pattern: 'hinge', cue: 'Hip hinge with neutral spine.' },
  rdl: { name: 'Dumbbell Romanian Deadlift', pattern: 'hinge', cue: 'Hinge at hips; stop before spinal position changes.' },
  chestPress: { name: 'Machine Chest Press', pattern: 'push', cue: 'Shoulder blades supported; neutral, comfortable grip.' },
  dbBench: { name: 'Dumbbell Bench Press', pattern: 'push', cue: 'Keep elbows in a comfortable path.' },
  inclinePushup: { name: 'Incline Push-Up', pattern: 'push', cue: 'Choose bench height that feels smooth and stable.' },
  cablePress: { name: 'Standing Cable Press', pattern: 'push', cue: 'Light load; ribs stacked; smooth press.' },
  neutralPress: { name: 'Neutral-Grip Machine Press', pattern: 'push', cue: 'Use neutral grip and pain-free range.' },
  row: { name: 'Chest-Supported Row', pattern: 'pull', cue: 'Keep chest supported; pull elbows toward ribs.' },
  cableRow: { name: 'Seated Cable Row', pattern: 'pull', cue: 'Stay tall; do not rock through the low back.' },
  pulldown: { name: 'Neutral-Grip Lat Pulldown', pattern: 'verticalPull', cue: 'Pull to upper chest without leaning back.' },
  pulldownWide: { name: 'Lat Pulldown', pattern: 'verticalPull', cue: 'Comfortable grip; avoid forcing shoulder range.' },
  facePull: { name: 'Cable Face Pull', pattern: 'rearDelt', cue: 'Light load; move through a comfortable shoulder range.' },
  reverseFly: { name: 'Reverse Pec Deck', pattern: 'rearDelt', cue: 'Keep shoulders down; control both directions.' },
  lateralRaise: { name: 'Cable / Machine Lateral Raise', pattern: 'shoulder', cue: 'Light load; stop before discomfort.' },
  shoulderPress: { name: 'Machine Shoulder Press', pattern: 'shoulder', cue: 'Do not force overhead range; stop if pinching.' },
  cableCurl: { name: 'Cable Curl', pattern: 'arms', cue: 'Keep wrist neutral and elbows quiet.' },
  hammerCurl: { name: 'Hammer Curl', pattern: 'arms', cue: 'Neutral wrist; controlled reps.' },
  pressdown: { name: 'Rope Triceps Pressdown', pattern: 'arms', cue: 'Keep elbows at sides and wrists comfortable.' },
  calf: { name: 'Standing / Seated Calf Raise', pattern: 'calves', cue: 'Pause at top and bottom; controlled range.' },
  pallof: { name: 'Pallof Press', pattern: 'core', cue: 'Brace; resist rotation. No breath holding.' },
  deadBug: { name: 'Dead Bug', pattern: 'core', cue: 'Keep ribs down; only extend as far as you can control.' },
  birdDog: { name: 'Bird Dog', pattern: 'core', cue: 'Reach long; avoid twisting or arching.' },
  plank: { name: 'Incline Plank', pattern: 'core', cue: 'Brace gently; stop before back or shoulder discomfort.' },
  suitcase: { name: 'Suitcase Carry', pattern: 'carry', cue: 'Walk tall; do not lean toward or away from the weight.' },
  bike: { name: 'Stationary Bike', pattern: 'cardio', cue: 'Conversational pace unless otherwise noted.' },
  treadmill: { name: 'Treadmill Walk', pattern: 'cardio', cue: 'Comfortable pace; incline optional.' },
  elliptical: { name: 'Elliptical', pattern: 'cardio', cue: 'Smooth, moderate effort.' },
  rower: { name: 'Rower', pattern: 'cardio', cue: 'Easy technique-focused pace.' }
};

const GOAL_LABEL = {
  general: 'General fitness',
  fatloss: 'Fat loss',
  muscle: 'Build muscle',
  strength: 'Get stronger'
};

const ISSUE_LABEL = {
  lowBack: 'low-back considerations',
  shoulder: 'shoulder considerations',
  knee: 'knee considerations',
  hip: 'hip considerations',
  neck: 'neck considerations',
  elbowWrist: 'elbow/wrist considerations'
};

function getFormData() {
  const issues = $$('#issueToggles input:checked').map(x => x.value);
  const redFlags = $$('#redFlags input:checked').map(x => x.value);
  return {
    id: editingProfileId || makeId(),
    name: $('#name').value.trim(),
    age: Number($('#age').value),
    height: Number($('#height').value),
    weight: Number($('#weight').value),
    goal: $('input[name="goal"]:checked').value,
    experience: $('#experience').value,
    days: Number($('#days').value),
    duration: Number($('#duration').value),
    activity: $('#activity').value,
    cardioPreference: $('#cardioPreference').value,
    issues,
    issueNotes: $('#issueNotes').value.trim(),
    redFlags,
    trainerNotes: $('#trainerNotes').value.trim(),
    updatedAt: new Date().toISOString()
  };
}

function setFormData(p) {
  editingProfileId = p.id || null;
  $('#name').value = p.name || '';
  $('#age').value = p.age ?? 35;
  $('#height').value = p.height ?? 175;
  $('#weight').value = p.weight ?? 80;
  const goal = $(`input[name="goal"][value="${p.goal || 'general'}"]`);
  if (goal) goal.checked = true;
  $('#experience').value = p.experience || 'new';
  $('#days').value = String(p.days || 3);
  $('#duration').value = String(p.duration || 60);
  $('#activity').value = p.activity || 'moderate';
  $('#cardioPreference').value = p.cardioPreference || 'any';
  $$('#issueToggles input').forEach(x => x.checked = (p.issues || []).includes(x.value));
  $('#issueNotes').value = p.issueNotes || '';
  $$('#redFlags input').forEach(x => x.checked = (p.redFlags || []).includes(x.value));
  $('#trainerNotes').value = p.trainerNotes || '';
}

function calcBmi(height, weight) {
  if (!height || !weight) return null;
  return weight / Math.pow(height / 100, 2);
}

function effortPrescription(p) {
  if (p.experience === 'new') return { rpe: 'RPE 6–7', rir: 'about 3–4 reps in reserve', sets: 2 };
  if (p.experience === 'some') return { rpe: 'RPE 7–8', rir: 'about 2–3 reps in reserve', sets: 3 };
  return { rpe: 'RPE 7–8', rir: 'about 2 reps in reserve', sets: 3 };
}

function volumeFor(p, role='main') {
  const e = effortPrescription(p);
  let sets = e.sets;
  if (p.duration === 30 && role !== 'main') sets = Math.max(1, sets - 1);
  if (p.goal === 'strength' && role === 'main' && p.experience !== 'new') sets += 1;
  return sets;
}

function repRange(p, role='main') {
  if (p.goal === 'strength') return role === 'main' ? '5–8' : '8–12';
  if (p.goal === 'muscle') return role === 'main' ? '6–10' : '10–15';
  return role === 'main' ? '8–12' : '10–15';
}

function restRange(p, role='main') {
  if (p.goal === 'strength' && role === 'main') return '2–3 min';
  return role === 'main' ? '90–120 sec' : '60–90 sec';
}

function chooseCardio(p) {
  const map = { walk: EX.treadmill, bike: EX.bike, elliptical: EX.elliptical, row: EX.rower };
  let c = map[p.cardioPreference] || EX.treadmill;
  if (p.issues.includes('knee') && c === EX.treadmill) c = EX.bike;
  if ((p.issues.includes('lowBack') || p.issues.includes('hip')) && c === EX.rower) c = EX.bike;
  return c;
}

function safeExercise(key, p) {
  const issues = new Set(p.issues);
  const original = EX[key];
  let replacement = original;
  let reason = '';

  const swap = (newKey, why) => { replacement = EX[newKey]; reason = why; };

  if (issues.has('lowBack')) {
    if (key === 'rdl') swap('legCurl', 'swapped to reduce loaded spinal/hip-hinge demand');
    if (key === 'gobletSquat') swap('legPress', 'swapped for more trunk support');
    if (key === 'cableRow') swap('row', 'swapped for chest support');
    if (key === 'plank') swap('birdDog', 'swapped for lower-load trunk control');
    if (key === 'rower') swap('bike', 'swapped to reduce repetitive trunk flexion');
  }
  if (issues.has('shoulder')) {
    if (key === 'shoulderPress') swap('lateralRaise', 'overhead press replaced with a pain-free shoulder option');
    if (key === 'dbBench') swap('neutralPress', 'swapped to a supported neutral-grip press');
    if (key === 'pulldownWide') swap('pulldown', 'swapped to a shoulder-friendlier neutral grip');
    if (key === 'plank') swap('pallof', 'swapped to reduce weight-bearing through the shoulder');
  }
  if (issues.has('knee')) {
    if (key === 'gobletSquat') swap('legPress', 'use a comfortable range and foot position');
    if (key === 'splitSquat') swap('legCurl', 'single-leg knee-dominant work reduced initially');
    if (key === 'stepUp') swap('hipThrust', 'step work replaced initially');
  }
  if (issues.has('hip')) {
    if (key === 'splitSquat') swap('legPress', 'use a controlled, comfortable hip range');
    if (key === 'rdl') swap('legCurl', 'loaded hip hinge reduced initially');
  }
  if (issues.has('neck')) {
    if (key === 'shoulderPress') swap('lateralRaise', 'overhead loading reduced initially');
    if (key === 'suitcase') swap('pallof', 'carry replaced to reduce neck/upper-trap loading');
  }
  if (issues.has('elbowWrist')) {
    if (key === 'cableCurl') swap('hammerCurl', 'neutral wrist/grip selected');
    if (key === 'dbBench') swap('neutralPress', 'supported neutral grip selected');
    if (key === 'inclinePushup') swap('chestPress', 'machine handle allows more neutral wrist position');
  }

  return { ...replacement, substituted: replacement.name !== original.name, reason, originalName: original.name };
}

function exerciseRow(key, p, role='main', override={}) {
  const ex = safeExercise(key, p);
  return {
    ...ex,
    sets: override.sets || volumeFor(p, role),
    reps: override.reps || repRange(p, role),
    rest: override.rest || restRange(p, role),
    role,
    note: override.note || ex.cue
  };
}

function makeWorkouts(p) {
  const fullA = [
    ['legPress','main'], ['chestPress','main'], ['row','main'], ['legCurl','accessory'], ['lateralRaise','accessory'], ['pallof','accessory']
  ];
  const fullB = [
    ['gobletSquat','main'], ['pulldown','main'], ['dbBench','main'], ['hipThrust','accessory'], ['facePull','accessory'], ['deadBug','accessory']
  ];
  const fullC = [
    ['legPress','main'], ['row','main'], ['neutralPress','main'], ['splitSquat','accessory'], ['pulldown','accessory'], ['suitcase','accessory']
  ];

  const upperA = [
    ['chestPress','main'], ['row','main'], ['pulldown','main'], ['lateralRaise','accessory'], ['cableCurl','accessory'], ['pressdown','accessory'], ['pallof','accessory']
  ];
  const lowerA = [
    ['legPress','main'], ['rdl','main'], ['splitSquat','accessory'], ['legCurl','accessory'], ['calf','accessory'], ['deadBug','accessory']
  ];
  const upperB = [
    ['neutralPress','main'], ['pulldown','main'], ['row','main'], ['facePull','accessory'], ['hammerCurl','accessory'], ['pressdown','accessory'], ['pallof','accessory']
  ];
  const lowerB = [
    ['gobletSquat','main'], ['hipThrust','main'], ['stepUp','accessory'], ['legCurl','accessory'], ['calf','accessory'], ['birdDog','accessory']
  ];

  let schemas;
  if (p.days === 2) schemas = [['Full Body A', fullA], ['Full Body B', fullB]];
  else if (p.days === 3) schemas = [['Full Body A', fullA], ['Full Body B', fullB], ['Full Body C', fullC]];
  else if (p.days === 4) schemas = [['Upper A', upperA], ['Lower A', lowerA], ['Upper B', upperB], ['Lower B', lowerB]];
  else schemas = [['Upper A', upperA], ['Lower A', lowerA], ['Full Body', fullC], ['Upper B', upperB], ['Lower B', lowerB]];

  let maxExercises = p.duration <= 30 ? 4 : p.duration <= 45 ? 5 : p.duration <= 60 ? 6 : 7;
  if (p.age >= 70 && p.experience === 'new') maxExercises = Math.min(maxExercises, 5);

  return schemas.map(([name, rows], i) => {
    let exercises = rows.slice(0, maxExercises).map(([k, role]) => exerciseRow(k, p, role));

    // Goal-specific bias without making the plan exotic.
    if (p.goal === 'muscle' && p.duration >= 60 && exercises.length < 7) {
      exercises.push(exerciseRow(i % 2 ? 'cableCurl' : 'pressdown', p, 'accessory'));
    }
    if (p.goal === 'fatloss' && p.duration >= 45) {
      exercises.push({ ...chooseCardio(p), sets: '1', reps: p.duration >= 60 ? '10–15 min' : '6–10 min', rest: '—', role: 'cardio', note: 'Steady moderate pace; you should still be able to speak in short sentences.' });
    }
    if (p.age >= 65 && p.duration >= 45) {
      exercises.push({ name: 'Balance: supported single-leg stand', sets: '2', reps: '20–30 sec/side', rest: '30 sec', role: 'balance', note: 'Use a stable support. Stop if dizzy or unsteady.', substituted: false });
    }
    return { name, exercises };
  });
}

function buildPlan(p) {
  if (p.redFlags.length) {
    return { blocked: true, profile: p, reason: 'Safety-screen item selected. Do not auto-prescribe a routine until the member has been reviewed by an appropriately qualified professional.' };
  }

  const effort = effortPrescription(p);
  const bmi = calcBmi(p.height, p.weight);
  const workouts = makeWorkouts(p);
  const hasSubs = workouts.some(w => w.exercises.some(e => e.substituted));

  let warmup = '5–8 min easy cardio, then 1 light practice set before the first 2 strength exercises.';
  if (p.activity === 'low' || p.experience === 'new') warmup = '6–10 min easy cardio, then 1–2 light practice sets before the first 2 strength exercises.';

  let weeklyCardio = 'Optional: 2 × 15–25 min easy-to-moderate cardio on non-lifting days.';
  if (p.goal === 'fatloss') weeklyCardio = 'Aim for 2–3 × 20–30 min easy-to-moderate cardio weekly, building gradually from current activity.';
  if (p.goal === 'strength') weeklyCardio = 'Keep 1–2 easy cardio sessions weekly for general conditioning and recovery.';

  const progression = p.experience === 'new'
    ? 'Start deliberately light. When every set reaches the top of the rep range with clean form and ~3 reps still available, add the smallest weight increase next time.'
    : 'Use double progression: build reps within the range first. Once all sets reach the top of the range at the target effort, increase load by the smallest practical amount.';

  const issueNotes = p.issues.length
    ? `Program adjusted for ${p.issues.map(i => ISSUE_LABEL[i]).join(', ')}. Pain is not a target: use a comfortable range and stop/modify any movement that reproduces concerning symptoms.`
    : 'No movement issues selected. Still use pain-free ranges and controlled technique.';

  return {
    blocked: false,
    profile: p,
    bmi,
    workouts,
    effort,
    warmup,
    weeklyCardio,
    progression,
    issueNotes,
    hasSubs
  };
}

function renderBlocked(plan) {
  const p = plan.profile;
  $('#routineView').innerHTML = `
    <article class="routine">
      <div class="routine-header">
        <div class="routine-title"><p class="step">SAFETY REVIEW</p><h2>${esc(p.name || 'New member')}</h2><p>Automated routine paused</p></div>
      </div>
      <div class="notice danger"><b>Do not generate a routine yet.</b><br>${esc(plan.reason)}</div>
      <div class="bottom-card">
        <h3>Selected screen items</h3>
        <p>${p.redFlags.map(flagLabel).join(' • ')}</p>
      </div>
      <p class="print-footer">This tool supports gym onboarding and is not medical diagnosis or treatment.</p>
    </article>`;
}

function flagLabel(v) {
  return ({
    chestPain: 'Chest pain/pressure', fainting: 'Fainting/severe dizziness', breath: 'Unusual shortness of breath',
    doctorRestriction: 'Doctor restriction / clearance requested', acuteInjury: 'Acute injury / severe worsening pain'
  })[v] || v;
}

function renderPlan(plan) {
  if (plan.blocked) return renderBlocked(plan);
  const p = plan.profile;
  const bmi = plan.bmi ? plan.bmi.toFixed(1) : '—';
  
  const workoutHtml = plan.workouts.map(w => `
    <section class="workout-card">
      <div class="workout-head"><h3>${esc(w.name)}</h3><span>${p.duration} min target</span></div>
      <table class="exercise-table">
        <thead><tr><th>Exercise</th><th>Sets</th><th>Reps / time</th><th>Rest</th></tr></thead>
        <tbody>${w.exercises.map(e => `
          <tr>
            <td><span class="ex-name">${esc(e.name)}</span>${e.substituted ? '<span class="sub-tag">MODIFIED</span>' : ''}
              <small>${esc(e.note || '')}${e.substituted && e.reason ? ` • ${esc(e.reason)}` : ''}</small></td>
            <td>${esc(String(e.sets))}</td><td>${esc(String(e.reps))}</td><td>${esc(String(e.rest))}</td>
          </tr>`).join('')}</tbody>
      </table>
    </section>`).join('');

  $('#routineView').innerHTML = `
    <article class="routine">
      <div class="routine-header">
        <div class="routine-title">
          <p class="step">STARTER PROGRAM</p>
          <h2>${esc(p.name || 'Member routine')}</h2>
          <p>${esc(GOAL_LABEL[p.goal])} • ${p.days} days/week • ${p.duration}-minute sessions</p>
        </div>
        <div class="member-chip"><strong>Start at ${plan.effort.rpe}</strong><span>${plan.effort.rir}</span></div>
      </div>

      <div class="metrics">
        <div class="metric"><b>${p.age}</b><span>Age</span></div>
        <div class="metric"><b>${p.height} cm</b><span>Height</span></div>
        <div class="metric"><b>${p.weight} kg</b><span>Weight</span></div>
        <div class="metric"><b>${bmi}</b><span>BMI (reference only)</span></div>
      </div>

      <div class="notice ${p.issues.length ? 'warn' : 'success'}">${esc(plan.issueNotes)}${p.issueNotes ? `<br><b>Member note:</b> ${esc(p.issueNotes)}` : ''}</div>
      ${p.age < 18 ? '<div class="notice warn"><b>Minor member:</b> follow the gym’s youth-supervision policy and applicable instructor requirements.</div>' : ''}

      <div class="program-intro">
        <div class="info-card"><h3>Warm-up</h3><p>${esc(plan.warmup)}</p></div>
        <div class="info-card"><h3>Weekly cardio</h3><p>${esc(plan.weeklyCardio)}</p></div>
      </div>

      ${workoutHtml}

      <div class="bottom-grid">
        <div class="bottom-card"><h3>How to progress</h3><p>${esc(plan.progression)}</p></div>
        <div class="bottom-card"><h3>Rules for the first 4–6 weeks</h3><ul>
          <li>Leave reps in reserve; do not train to failure.</li>
          <li>Technique and comfortable range come before load.</li>
          <li>Normal muscular effort is OK; sharp, radiating or worsening pain is not.</li>
          <li>Ask staff for a form check before increasing loads aggressively.</li>
        </ul></div>
      </div>
      ${p.trainerNotes ? `<div class="bottom-card" style="margin-top:12px"><h3>Trainer note</h3><p>${esc(p.trainerNotes)}</p></div>` : ''}
      <p class="print-footer">Starter routine generated from member intake. This is fitness programming support, not medical diagnosis or treatment. Reassess after ~4–6 weeks or sooner if symptoms/goals change.</p>
    </article>`;
}

function esc(s) {
  return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function getProfiles() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function setProfiles(arr) { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }

function saveCurrentProfile() {
  const p = getFormData();
  if (!p.name) {
    alert('Add a member name before saving the profile.');
    return;
  }
  const profiles = getProfiles();
  const idx = profiles.findIndex(x => x.id === p.id);
  if (idx >= 0) profiles[idx] = p; else profiles.unshift(p);
  setProfiles(profiles);
  editingProfileId = p.id;
  $('#saveProfileBtn').textContent = 'Saved ✓';
  setTimeout(() => $('#saveProfileBtn').textContent = 'Save profile', 1000);
}

function renderSaved() {
  const profiles = getProfiles();
  $('#savedList').innerHTML = profiles.length ? profiles.map(p => `
    <div class="saved-row">
      <div><strong>${esc(p.name || 'Unnamed')}</strong><small>${p.age} yrs • ${GOAL_LABEL[p.goal] || p.goal} • ${p.days} days/week</small></div>
      <div class="row-actions">
        <button class="btn ghost" data-load="${p.id}">Load</button>
        <button class="btn danger" data-delete="${p.id}">Delete</button>
      </div>
    </div>`).join('') : '<p class="muted">No profiles saved yet.</p>';

  $$('[data-load]').forEach(b => b.addEventListener('click', () => {
    const p = profiles.find(x => x.id === b.dataset.load);
    if (p) { setFormData(p); $('#savedDialog').close(); window.scrollTo({top:0, behavior:'smooth'}); }
  }));
  $$('[data-delete]').forEach(b => b.addEventListener('click', () => {
    setProfiles(profiles.filter(x => x.id !== b.dataset.delete));
    renderSaved();
  }));
}

function resetForm() {
  editingProfileId = null;
  $('#intakeForm').reset();
  $('#age').value = 35; $('#height').value = 175; $('#weight').value = 80;
  $('#days').value = '3'; $('#duration').value = '60'; $('#activity').value = 'moderate';
  $('#emptyState').hidden = false; $('#routineView').hidden = true; $('#printBtn').disabled = true;
  currentPlan = null;
}

$('#intakeForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const p = getFormData();
  currentPlan = buildPlan(p);
  renderPlan(currentPlan);
  $('#emptyState').hidden = true;
  $('#routineView').hidden = false;
  $('#printBtn').disabled = false;
  if (window.innerWidth < 1050) $('#outputPanel').scrollIntoView({behavior:'smooth', block:'start'});
});

$('#printBtn').addEventListener('click', () => window.print());
$('#newMemberBtn').addEventListener('click', resetForm);
$('#saveProfileBtn').addEventListener('click', saveCurrentProfile);
$('#savedBtn').addEventListener('click', () => { renderSaved(); $('#savedDialog').showModal(); });
$('#closeDialogBtn').addEventListener('click', () => $('#savedDialog').close());
$('#clearSavedBtn').addEventListener('click', () => {
  if (confirm('Delete all locally saved member profiles?')) { setProfiles([]); renderSaved(); }
});

$('#exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(getProfiles(), null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `gym-member-profiles-${new Date().toISOString().slice(0,10)}.json`;
  a.click(); URL.revokeObjectURL(a.href);
});

$('#importInput').addEventListener('change', async (e) => {
  const file = e.target.files?.[0]; if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data)) throw new Error('Backup must contain a profile array.');
    setProfiles(data); renderSaved();
  } catch (err) { alert(`Could not import backup: ${err.message}`); }
  e.target.value = '';
});
