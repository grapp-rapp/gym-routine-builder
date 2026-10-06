function validateSharedPlan(shared) {
  const text = (x,max=1000) => typeof x === 'string' && x.length <= max;
  if (!shared || !shared.profile || !Array.isArray(shared.workouts) || shared.workouts.length < 1 || shared.workouts.length > 5) throw Error('Invalid routine');
  const p=shared.profile;
  if (p.logId !== undefined && (typeof p.logId !== 'string' || p.logId.length > 150)) throw Error('Invalid log identity');
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
