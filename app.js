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

// Resolve exact product photos first, then local reference drawings.
function equipmentAsset(ex) {
  return EQUIPMENT_ASSETS[ex.key] || EQUIPMENT_ASSETS[ex.equipmentType] || EQUIPMENT_ASSETS.machine;
}

function equipmentPhoto(ex) {
  return equipmentAsset(ex).src;
}

function equipmentVisual(ex, className='equipment-thumb', label='') {
  const photo = equipmentPhoto(ex);
  const asset = equipmentAsset(ex);
  const safeLabel = esc([label || ex.equipment || ex.name || 'Gym equipment', asset.model].filter(Boolean).join(' · '));
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
    memberNotes: $('#memberNotes').value.trim(), memberNotesHe: $('#memberNotesHe').value.trim(),
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
  $('#memberNotes').value = p.memberNotes || ''; $('#memberNotesHe').value = p.memberNotesHe || '';
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
  return `${c.programAdjusted}: ${labels.join(', ')}. ${c.painRule}`;
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
      <div class="exercise-name-line"><strong>${esc(l.name)}</strong>${ex.substituted && editable ? `<span class="sub-tag no-print">${c.modified}</span>` : ''}${trainerTag}</div>
      <p>${esc(l.cue || '')}${ex.substituted && !memberShareMode && l.reason ? ` · ${esc(l.reason)}` : ''}</p>
      <span class="equipment-pill">${esc(l.equipment || c.equipmentGuide)}</span>
    </div>
    <div class="exercise-stat sets-stat"><b>${esc(ex.sets)}</b><span>${c.sets}</span></div>
    <div class="exercise-stat reps-stat"><b>${routineText(displayReps)}</b><span>${c.reps}</span></div>
    <div class="exercise-stat rest-stat"><b>${routineText(l.rest)}</b><span>${c.rest}</span></div>
    ${editMarkup}
  </div>`;
}

function renderPlan(plan) {
  const lang = currentLanguage; const c = COPY[lang]; const p = plan.profile; const rtl = lang === 'he';
  const goal = lang === 'he' ? GOAL_LABEL_HE[p.goal] : GOAL_LABEL[p.goal];
  const issueText = issueNotice(plan, lang);
  const tabs = plan.workouts.map((w,i) => `<button type="button" class="day-tab ${i===activeDayIndex?'active':''}" data-day-index="${i}"><span>${c.day} ${i+1}</span><b>${routineText(lang==='he'?w.nameHe:w.name)}</b></button>`).join('');
  const pages = plan.workouts.map((w,i) => `<section class="day-page ${i===activeDayIndex?'active':''}" data-day="${i}">
      <div class="print-day-brand"><img src="${LOGO_SRC}" alt="Binyamin Gym" onerror="this.onerror=null;this.src='${LOGO_FALLBACK_SRC}'"><div><b>Binyamin Gym</b><span>${routineText(p.name || (rtl ? 'מתאמן' : 'Member'))}</span></div></div>
      <div class="day-head"><div><span>${c.day} ${i+1}</span><h3>${routineText(rtl?w.nameHe:w.name)}</h3></div><div class="day-duration"><b>${p.duration} ${rtl?'דק׳':'min'}</b><span>${c.target}</span></div></div>
      <div class="exercise-list">${w.exercises.map((ex, exerciseIndex) => renderExercise(ex, lang, i, exerciseIndex)).join('')}</div>
      <div class="day-guidance">
        <div><span>${c.warmup}</span><p>${routineText(rtl?plan.warmupHe:plan.warmup)}</p></div>
        <div class="print-progression"><span>${c.progress}</span><p>${routineText(rtl ? plan.progressionHe : plan.progression)}</p></div><div><span>${c.startAt}</span><p><b>${routineText(rtl ? plan.effort.rpeHe : plan.effort.rpe)}</b> · ${routineText(rtl?plan.effort.rirHe:plan.effort.rir)}</p></div>
      </div>
    </section>`).join('');

  $('#routineView').innerHTML = `<article class="routine ${rtl?'routine-rtl':''}" dir="${rtl?'rtl':'ltr'}">
    <div class="routine-brand-row"><img src="${LOGO_SRC}" alt="Binyamin Gym" onerror="this.onerror=null;this.src='${LOGO_FALLBACK_SRC}'"><div><b>Binyamin Gym</b><span>${rtl?'תוכנית אימונים אישית':'Personal training plan'}</span></div></div>
    <div class="routine-hero">
      <div class="routine-title"><p class="step">${c.starter}</p><h2>${routineText(p.name || (rtl?'תוכנית מתאמן':'Member routine'))}</h2><p>${routineText(goal)}</p></div>
      <div class="routine-meta-grid">
        <div><b>${p.days}</b><span>${c.daysWeek}</span></div>
        <div><b>${p.duration} ${rtl?'דק׳':'min'}</b><span>${c.session}</span></div>
        <div><b>${routineText(experienceLabel(p.experience, lang))}</b><span>${c.experience}</span></div>
      </div>
    </div>
    <div class="notice no-print staff-notice ${p.issues?.length?'warn':'success'}">${routineText(issueText)}${p.issueNotes ? `<br><b>${c.memberNote}:</b> ${routineText(p.issueNotes)}` : ''}</div>
    ${p.age < 18 ? `<div class="notice warn"><b>${c.minor}:</b> ${c.minorText}</div>` : ''}
    <div class="day-tabs no-print">${tabs}</div>
    <div class="day-pages">${pages}</div>
    <div class="routine-bottom"><div class="print-day-brand"><img src="${LOGO_SRC}" alt="Binyamin Gym"><div><b>Binyamin Gym</b><span>${routineText(p.name)}</span></div></div>
      <div class="bottom-card"><h3>${c.cardio}</h3><p>${routineText(rtl?plan.weeklyCardioHe:plan.weeklyCardio)}</p></div>
      <div class="bottom-card"><h3>${c.progress}</h3><p>${routineText(rtl?plan.progressionHe:plan.progression)}</p></div>
      <div class="bottom-card rules-card"><h3>${c.rules}</h3><ul><li>${c.rule1}</li><li>${c.rule2}</li><li>${c.rule3}</li><li>${c.rule4}</li></ul></div>
      ${(rtl ? p.memberNotesHe : p.memberNotes) ? `<div class="bottom-card"><h3>${c.trainerNote}</h3><p>${routineText(rtl ? p.memberNotesHe : p.memberNotes)}</p></div>` : ''}
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
      <small>${esc(currentL.equipment || '')} · ${esc(current.sets)} × ${esc(lang === 'he' ? formatHebrewMeasure(current.reps) : current.reps)}</small>
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
  $('#saveSwapBtn').disabled = false;
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
    ? `${day.nameHe || day.name} · בחרו חלופה ושמרו את השינוי. ניתן לערוך את פרטי התרגיל או לבחור תרגיל אחר.`
    : `${day.name} · Choose a replacement and save. Edit the prescription below, or choose another exercise.`;
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
  fillPrescriptionEditor(currentPlan.workouts[dayIndex].exercises[exerciseIndex]);
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
    generated: current.generated || { ...current },
    generatedKey: current.generatedKey || current.key,
    manualSwap: true
  };
  activeDayIndex = dayIndex;
  renderPlan(currentPlan);
  flashToast(currentLanguage === 'he' ? 'התרגיל עודכן' : 'Exercise updated');
}

function resetExerciseToGenerated(dayIndex, exerciseIndex) {
  const savedOriginal = currentPlan.workouts[dayIndex].exercises[exerciseIndex].generated;
  const regenerated = buildPlan(currentPlan.profile);
  const original = savedOriginal || regenerated?.workouts?.[dayIndex]?.exercises?.[exerciseIndex];
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
      note: ex.note, noteHe: ex.noteHe, generated: ex.generated,
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
  const plan = buildPlan(profile.planProfile || profile);
  plan.profile = { ...plan.profile, id: profile.id, name: profile.name, memberNotes: profile.memberNotes, memberNotesHe: profile.memberNotesHe };
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
        note: item.note ?? base.cue,
        noteHe: item.noteHe ?? base.cueHe,
        generated: item.generated,
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

function getProfiles() {
  const raw=localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try { return validateProfiles(JSON.parse(raw)); }
  catch { throw Error('Saved data could not be read. Export or recover your backup before saving new members.'); }
}
function setProfiles(arr) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); return true; }
  catch { alert('Could not save. Browser storage may be full or unavailable. Export a backup before closing.'); return false; }
}

function saveCurrentProfile() {
  if (!$('#intakeForm').reportValidity()) return;
  const p = getFormData(); p.language = currentLanguage; p.activeDayIndex = activeDayIndex; if (!p.name) { alert('Add a member name before saving the profile.'); return; } if (!p.gender) { alert('Select Male or Female before saving the profile.'); return; }
  if (currentPlan && currentPlan.profile?.id === p.id) {
    p.routineOverride = serializeRoutineState(currentPlan);
    p.planProfile = { ...currentPlan.profile }; delete p.planProfile.routineOverride; delete p.planProfile.planProfile;
  }
  const profiles = getProfiles(); const idx = profiles.findIndex(x => x.id === p.id); if (idx >= 0) profiles[idx] = p; else profiles.unshift(p);
  if (!setProfiles(profiles)) return; editingProfileId = p.id;
  if(currentPlan) {Object.assign(currentPlan.profile,{name:p.name,memberNotes:p.memberNotes,memberNotesHe:p.memberNotesHe});renderPlan(currentPlan);}
  flashToast('Member saved in this browser');
}

function renderSaved() {
  const profiles = getProfiles();
  $('#savedList').innerHTML = profiles.length ? profiles.map(p => `<div class="saved-row"><div><strong>${esc(p.name || 'Unnamed')}</strong><small>${esc(p.age)} yrs • ${p.gender === 'female' ? 'Female' : p.gender === 'male' ? 'Male' : 'Gender not set'} • ${esc(GOAL_LABEL[p.goal] || p.goal)} • ${esc(p.days)} days/week</small></div><div class="row-actions"><button class="btn ghost" data-load="${esc(p.id)}">Load</button><button class="btn danger" data-delete="${esc(p.id)}">Delete</button></div></div>`).join('') : '<p class="muted">No profiles saved yet.</p>';
  $$('[data-load]').forEach(b => b.addEventListener('click', () => {
    const p = profiles.find(x => x.id === b.dataset.load);
    if (p) {
      setFormData(p);
      currentPlan = p.routineOverride ? restoreRoutineState(p) : null;
      activeDayIndex = Math.min(p.activeDayIndex || 0, (currentPlan?.workouts.length || 1) - 1);
      setLanguage(p.language || 'en');
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

async function copyMemberLink() {
  const url = buildMemberUrl();
  if (!url) return;
  try { await navigator.clipboard.writeText(url); }
  catch {
    const t=document.createElement('textarea'); t.value=url; document.body.appendChild(t); t.select(); const copied = document.execCommand('copy'); t.remove(); if (!copied) { window.prompt(currentLanguage === 'he' ? 'העתיקו את הקישור:' : 'Copy this member link:', url); return; }
  }
  flashToast(currentLanguage === 'he' ? 'קישור אישי לתוכנית הועתק ✓' : 'Member routine link copied ✓');
  const btn=$('#shareBtn'); const old=btn.innerHTML; btn.textContent=currentLanguage === 'he' ? 'הקישור הועתק ✓' : 'Link copied ✓'; setTimeout(()=>btn.innerHTML=old,1400);
}

function readSharedPayloadFromUrl() {
  const queryPayload = new URLSearchParams(location.search).get('routine');
  if (queryPayload) return queryPayload;
  const hashMatch = location.hash.match(/^#(?:share|routine)=(.+)$/);
  return hashMatch ? hashMatch[1] : '';
}

function initSharedRoutine() {
  const encoded = readSharedPayloadFromUrl();
  if (!encoded && !new URLSearchParams(location.search).has('routine') && !/^#(?:share|routine)=/.test(location.hash)) return false;
  memberShareMode = true; document.body.classList.add('member-share-mode');
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
    $('#emptyState').hidden = true; $('#routineView').hidden = false;
    $('#routineView').innerHTML = '<div class="link-error"><img src="'+LOGO_SRC+'" alt="Binyamin Gym"><h1>This routine link could not be opened</h1><p>Ask Binyamin Gym staff for a new link.</p><div dir="rtl" lang="he"><h2>לא ניתן לפתוח את התוכנית</h2><p>בקשו מצוות כושר בנימין קישור חדש.</p></div></div>';
    $('#outputSubtext').textContent = ''; $('#previewStatusText').textContent = ''; $('#languageToggle').hidden = true;
    return true;
  }
}

function setLanguage(lang) {
  currentLanguage = lang === 'he' ? 'he' : 'en';
  $('#routineView').lang = currentLanguage;
  $('#languageToggle').setAttribute('aria-label',currentLanguage==='he'?'שפת התוכנית':'Routine language');
  if (memberShareMode) { document.title=(currentPlan?.profile.name || 'Binyamin Gym')+' — '+(currentLanguage==='he'?'תוכנית אימונים':'Training routine'); document.documentElement.lang = currentLanguage; $('#outputPanel').dir = currentLanguage === 'he' ? 'rtl' : 'ltr'; }
  $('#closeEquipmentImageBtn').setAttribute('aria-label', currentLanguage === 'he' ? 'סגירת תמונת הציוד' : 'Close equipment photo');
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
  const asset = Object.values(EQUIPMENT_ASSETS).find(item => item.src === src);
  $('#equipmentImageHint').textContent = asset?.kind === 'photo'
    ? (currentLanguage === 'he'
      ? 'תמונת מוצר מרשימת הציוד שסופקה. לזיהוי הציוד; אינה הדגמת תרגיל. משקל שמופיע בתמונה אינו המלצת אימון.'
      : 'Product photo from the supplied equipment list. Equipment identification, not an exercise demonstration. Any weight shown is not a training recommendation.')
    : COPY[currentLanguage].referenceImage;
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
  if (window.innerWidth < 1650) $('#outputPanel').scrollIntoView({behavior:'smooth', block:'start'});
});
$('#printBtn').addEventListener('click', () => {
  document.body.classList.add('print-preview'); $('#printStyles').media='all';
  $('.print-preview-toolbar').hidden=false;
  $('#closePrintPreview').textContent=currentLanguage==='he'?'חזרה לתוכנית':'Back to routine';
  $('#confirmPrint').textContent=currentLanguage==='he'?'הדפסה / שמירה כקובץ':'Print / Save PDF'; window.scrollTo(0,0);
});
$('#closePrintPreview').addEventListener('click',()=>{document.body.classList.remove('print-preview');$('#printStyles').media='print';$('.print-preview-toolbar').hidden=true;$('#outputPanel').scrollIntoView();});
$('#confirmPrint').addEventListener('click',()=>window.print());
$('#shareBtn').addEventListener('click', copyMemberLink);
$('#newMemberBtn').addEventListener('click', resetForm);
$('#saveProfileBtn').addEventListener('click', () => {try {saveCurrentProfile();} catch(err){alert(err.message);}});
$('#savedBtn').addEventListener('click', () => { try {renderSaved(); $('#backupStatus').textContent='';} catch(err){$('#savedList').textContent=''; $('#backupStatus').textContent=err.message;} $('#savedDialog').showModal(); });
$('#closeDialogBtn').addEventListener('click', () => $('#savedDialog').close());
$('#clearSavedBtn').addEventListener('click', () => { if (confirm('Delete all locally saved member profiles?')) { setProfiles([]); renderSaved(); } });
$('#exportBtn').addEventListener('click', () => {
  try {
    const raw=localStorage.getItem(STORAGE_KEY) || '[]';
    const link=$('#backupDownload'); if(link.href.startsWith('blob:')) URL.revokeObjectURL(link.href);
    link.href=URL.createObjectURL(new Blob([raw],{type:'application/json'}));
    link.download='binyamin-gym-members-'+new Date().toISOString().slice(0,10)+'.json'; link.hidden=false;
    $('#backupStatus').textContent='Backup ready. Use Download prepared backup if the download does not start.';
    link.click();
  } catch(err) {$('#backupStatus').textContent='Could not export backup: '+err.message;}
});
$('#importInput').addEventListener('change', async (e) => { const file=e.target.files?.[0]; if(!file)return; try { if(file.size>10000000) throw Error('Backup exceeds 10 MB.'); const data=JSON.parse(await file.text()); validateProfiles(data); const existing = getProfiles(); const merged = new Map(existing.map(p=>[p.id,p])); for (const p of data) { if (!merged.has(p.id)) merged.set(p.id,p); else merged.set(makeId(),{...p,id:makeId(),name:p.name}); } if (setProfiles([...merged.values()])) {renderSaved(); $('#backupStatus').textContent='Backup imported. Existing members were kept.';} } catch(err){ $('#backupStatus').textContent='Could not import backup: '+err.message; } e.target.value=''; });
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
  if (!swapContext || !$('#prescriptionForm').reportValidity()) return;
  const { dayIndex, exerciseIndex } = swapContext;
  savePrescription(dayIndex, exerciseIndex);
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

function fillPrescriptionEditor(ex) {
  const he = currentLanguage === 'he';
  for (const [id, value] of Object.entries({editSets:ex.sets,editReps:ex.reps,editRest:ex.rest,editNote:ex.note || ex.cue,editNoteHe:ex.noteHe || ex.cueHe})) $('#'+id).value = value || '';
  $('#editSetsLabel').textContent = he ? 'סטים' : 'Sets';
  $('#editRepsLabel').textContent = he ? 'חזרות / זמן' : 'Reps / time';
  $('#editRestLabel').textContent = he ? 'מנוחה' : 'Rest';
  $('#prescriptionHint').textContent = he ? 'זמן: sec לשניות או min לדקות; התוכנית מתרגמת את היחידות. הערות אלו מוצגות למתאמן.' : 'Use sec or min for time; the routine translates units. These coaching notes are visible to the member.';
}
function savePrescription(dayIndex, exerciseIndex) {
  const current = currentPlan.workouts[dayIndex].exercises[exerciseIndex];
  const fields = {sets:Number($('#editSets').value),reps:$('#editReps').value.trim(),rest:$('#editRest').value.trim(),note:$('#editNote').value.trim(),noteHe:$('#editNoteHe').value.trim()};
  if (swapSelectionKey && swapSelectionKey !== current.key) {
    // Preserve a customized cue, but update unchanged catalog cues to the replacement.
    if (fields.note === current.note) fields.note = EX[swapSelectionKey].cue;
    if (fields.noteHe === current.noteHe) fields.noteHe = EX[swapSelectionKey].cueHe;
    applyExerciseSwap(dayIndex, exerciseIndex, swapSelectionKey);
  }
  const target = currentPlan.workouts[dayIndex].exercises[exerciseIndex];
  target.generated ||= { ...current }; Object.assign(target, fields, {manualSwap:true});
  renderPlan(currentPlan); flashToast(currentLanguage === 'he' ? 'השינוי נשמר בתוכנית' : 'Routine updated — save member to keep it');
}

function validateSharedPlan(shared) {
  const text = (x,max=1000) => typeof x === 'string' && x.length <= max;
  if (!shared || !shared.profile || !Array.isArray(shared.workouts) || shared.workouts.length < 1 || shared.workouts.length > 5) throw Error('Invalid routine');
  const p=shared.profile;
  if (!text(p.name,120) || !Object.hasOwn(GOAL_LABEL,p.goal) || !['new','some','experienced'].includes(p.experience) || ![30,45,60,75].includes(Number(p.duration)) || Number(p.days)!==shared.workouts.length) throw Error('Invalid routine profile');
  for(const w of shared.workouts) {
    if (!text(w.name,100) || !text(w.nameHe,100) || !Array.isArray(w.exercises) || w.exercises.length < 1 || w.exercises.length > 12) throw Error('Invalid workout');
    for(const ex of w.exercises) if (!Object.hasOwn(EX,ex.key) || !Number.isInteger(Number(ex.sets)) || Number(ex.sets)<1 || Number(ex.sets)>10 || !text(ex.reps,40) || !text(ex.rest,40) || (ex.note !== undefined && !text(ex.note,500)) || (ex.noteHe !== undefined && !text(ex.noteHe,500))) throw Error('Invalid exercise');
  }
  if(shared.guidance && (!Array.isArray(shared.guidance) || shared.guidance.length!==6 || !shared.guidance.every(s=>text(s,2000)))) throw Error('Invalid guidance');
  if ((p.memberNotes !== undefined && !text(p.memberNotes)) || (p.memberNotesHe !== undefined && !text(p.memberNotesHe))) throw Error('Invalid member note');
}
function validateProfiles(data) {
  if(!Array.isArray(data) || data.length>2000) throw Error('Backup must contain up to 2,000 member profiles.');
  const ids=new Set();
  for(const p of data) {
    if(!p || typeof p.id!=='string' || p.id.length>150 || ids.has(p.id) || typeof p.name!=='string' || p.name.length>120 || !Object.hasOwn(GOAL_LABEL,p.goal) || !['new','some','experienced'].includes(p.experience) || ![2,3,4,5].includes(Number(p.days)) || ![30,45,60,75].includes(Number(p.duration)) || !Array.isArray(p.issues) || !p.issues.every(i=>Object.hasOwn(ISSUE_LABEL,i))) throw Error('Backup contains an invalid member profile.');
    ids.add(p.id);
    if(p.routineOverride) validateSharedPlan({profile:{...p,...p.planProfile},workouts:p.routineOverride});
  }
  return data;
}
window.addEventListener('hashchange', () => window.location.reload());
function routineText(value) { return esc(value).replace(/\d+(?:[–-]\d+)?/g, '<bdi dir="ltr">$&</bdi>'); }
