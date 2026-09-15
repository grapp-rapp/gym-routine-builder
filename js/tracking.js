// Device-local workout history. Never included in routine shares or staff backups.
const WORKOUT_LOG_PREFIX = 'binyamin-workout-log-v1:';
let logContext = null;
let restTimer = { owner:'', label:'', total:60, remaining:60, deadline:0, interval:null };
const tr = (en, he) => currentLanguage === 'he' ? he : en;
function trackingIdentity(plan) {
  return plan.profile.logId || plan.profile.id || 'legacy:' + JSON.stringify([plan.profile.name, plan.workouts.map(w=>w.exercises.map(ex=>ex.key))]);
}
function validateWorkoutLogs(rows) {
  if (!Array.isArray(rows) || rows.length > 5000) throw Error('Invalid log backup');
  const ids = new Set();
  for (const row of rows) {
    if (!row || typeof row.id !== 'string' || row.id.length > 150 || ids.has(row.id) || !Object.hasOwn(EX,row.exercise) || !Number.isInteger(row.day) || row.day<0 || row.day>4 || !/^\d{4}-\d{2}-\d{2}$/.test(row.date) || (!Number.isFinite(Date.parse(row.date)) || new Date(row.date).toISOString().slice(0,10)!==row.date) || typeof row.created !== 'number' || !Number.isFinite(row.created) || !Array.isArray(row.sets) || row.sets.length<1 || row.sets.length>10) throw Error('Invalid log entry');
    ids.add(row.id);
    for (const set of row.sets) if (!set || !(set.kg === '' || (typeof set.kg==='number' && Number.isFinite(set.kg) && set.kg>=0 && set.kg<=2000)) || typeof set.result!=='string' || !set.result.trim() || set.result.length>40) throw Error('Invalid set');
  }
  return rows;
}
function readWorkoutLogs(identity) {
  return validateWorkoutLogs(JSON.parse(localStorage.getItem(WORKOUT_LOG_PREFIX + identity) || '[]'));
}
function writeWorkoutLogs(identity, rows) {
  validateWorkoutLogs(rows);
  localStorage.setItem(WORKOUT_LOG_PREFIX + identity, JSON.stringify(rows));
}
function trackingExerciseMarkup(ex, day, index) {
  let last = '';
  try {
    const previous = readWorkoutLogs(trackingIdentity(currentPlan)).filter(r=>r.exercise===ex.key).sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created)[0];
    if (previous) last = tr('Last session: ', 'אימון אחרון: ') + previous.date + ' · ' + previous.sets.map(s=>(s.kg!=='' ? s.kg+' kg × ' : '')+s.result).join(' / ');
  } catch { last = tr('Log unavailable. Export a backup before clearing browser data.', 'היומן אינו זמין. ייצאו גיבוי לפני מחיקת נתוני הדפדפן.'); }
  return '<div class="exercise-tracking no-print"><div class="tracking-actions"><button type="button" class="btn secondary" data-log-exercise="'+day+':'+index+'">'+tr('Log sets','רישום סטים')+'</button><button type="button" class="btn secondary" data-rest-exercise="'+day+':'+index+'">'+tr('Rest timer','טיימר מנוחה')+'</button></div><small class="last-session">'+esc(last)+'</small></div>';
}
function trackingToolbarMarkup(plan) {
  return '<section class="tracking-toolbar no-print" aria-label="'+tr('Workout tools','כלי אימון')+'"><p>'+tr('Workout history stays in this browser on this device. Export a backup to keep a copy.','היסטוריית האימונים נשמרת בדפדפן ובמכשיר הזה. ייצאו גיבוי לשמירת עותק.')+'</p><button type="button" class="btn secondary" data-log-history>'+tr('History & backup','היסטוריה וגיבוי')+'</button><div id="restTimerPanel" hidden></div></section>';
}
function restSeconds(value) {
  const values=String(value).match(/\d+(?:\.\d+)?/g);
  return values ? Math.min(1800,Math.max(1,Math.round(Math.max(...values.map(Number))*(/min/i.test(value)?60:1)))) : 60;
}
function timerRemaining(timer, now=Date.now()) { return timer.deadline ? Math.max(0,Math.ceil((timer.deadline-now)/1000)) : timer.remaining; }
function paintRestTimer() {
  const panel=$('#restTimerPanel');
  if (!panel || !currentPlan) return;
  panel.hidden=restTimer.owner!==trackingIdentity(currentPlan);
  if(panel.hidden) return;
  const seconds=timerRemaining(restTimer);
  if(restTimer.deadline && seconds===0){restTimer.deadline=0;restTimer.remaining=0;clearInterval(restTimer.interval);restTimer.interval=null;}
  const signature=JSON.stringify([restTimer.label,!!restTimer.deadline,seconds===0,currentLanguage]);
  if(panel.dataset.signature===signature){panel.querySelector('output').textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');return;}
  panel.dataset.signature=signature;
  panel.innerHTML='<small>'+tr('Keep this page open; the timer has a visual completion alert.','השאירו את הדף פתוח; הטיימר מציג הודעה בסיום.')+'</small><strong>'+esc(restTimer.label)+'</strong><output aria-label="'+tr('Time remaining','זמן שנותר')+'" dir="ltr">'+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')+'</output><span role="status">'+(seconds===0?tr('Rest finished','המנוחה הסתיימה'):'')+'</span><div class="tracking-actions">'+[['toggle',restTimer.deadline?tr('Pause','השהיה'):tr('Start','התחלה')],['reset',tr('Reset','איפוס')],['more',tr('+30 sec','עוד 30 שנ׳')],['stop',tr('Dismiss','סגירה')]].map(([a,label])=>'<button type="button" class="btn secondary" data-timer="'+a+'">'+label+'</button>').join('')+'</div>';
}
function startRestTick() { clearInterval(restTimer.interval);restTimer.interval=setInterval(paintRestTimer,250);paintRestTimer(); }
function openWorkoutLog(day,index) {
  const ex=currentPlan.workouts[day].exercises[index];
  logContext={identity:trackingIdentity(currentPlan),day,exercise:ex.key};
  const date=new Date();const today=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  const content=$('#workoutLogContent');
  content.innerHTML='<form id="setLogForm"><div class="dialog-head"><h2 id="logTitle">'+esc(tr(ex.name,ex.he))+'</h2><button type="button" class="btn secondary" data-log-close>'+tr('Cancel','ביטול')+'</button></div><p>'+tr('Enter completed sets only. Leave weight blank for bodyweight or cardio. For timed sets, include sec or min.','רשמו רק סטים שבוצעו. השאירו משקל ריק במשקל גוף או באירובי. בסטים לפי זמן ציינו שניות או דקות.')+'</p><label class="field">'+tr('Session date','תאריך אימון')+'<input name="sessionDate" type="date" required value="'+today+'"></label><div class="log-set-list">'+Array.from({length:Math.min(10,Math.max(1,Number(ex.sets)||1))},(_,i)=>'<div class="log-set"><strong>'+tr('Set ','סט ')+(i+1)+'</strong><label class="field">'+tr('Weight (kg)','משקל (ק״ג)')+'<input name="kg'+i+'" type="number" min="0" max="2000" step="any" inputmode="decimal"></label><label class="field">'+tr('Reps / time completed','חזרות / זמן שבוצעו')+'<input name="result'+i+'" maxlength="40" placeholder="'+tr('e.g. 10 or 30 sec','למשל 10 או 30 שנ׳')+'"></label></div>').join('')+'</div><p id="logError" role="alert"></p><button class="btn primary" type="submit">'+tr('Save session','שמירת אימון')+'</button></form>';
  const dialog=$('#workoutLogDialog');dialog.dir=currentLanguage==='he'?'rtl':'ltr';dialog.showModal();
}
function openLogHistory() {
  logContext={identity:trackingIdentity(currentPlan)};
  const content=$('#workoutLogContent');
  let rows;try{rows=readWorkoutLogs(logContext.identity);}catch{rows=null;}
  content.innerHTML='<div class="dialog-head"><h2 id="logTitle">'+tr('Workout history','היסטוריית אימונים')+'</h2><button type="button" class="btn secondary" data-log-close>'+tr('Close','סגירה')+'</button></div><p>'+esc(currentPlan.profile.name)+'</p><div class="tracking-actions"><button type="button" class="btn secondary" data-log-export>'+tr('Export log','ייצוא יומן')+'</button><label class="btn secondary">'+tr('Import log','ייבוא יומן')+'<input id="logImport" type="file" accept="application/json,.json"></label></div><div id="logExportLink"></div><p id="logError" role="alert"></p>'+(!rows?'<p>'+tr('Stored log could not be read. Export it to preserve the data.','לא ניתן לקרוא את היומן. ייצאו אותו כדי לשמור את הנתונים.')+'</p>':rows.length===0?'<p>'+tr('No sessions logged yet.','טרם נרשמו אימונים.')+'</p>':rows.slice().sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created).map(r=>'<section class="log-history-entry"><strong>'+esc(r.date+' · '+tr(EX[r.exercise].name,EX[r.exercise].he))+'</strong><p>'+esc(r.sets.map(s=>(s.kg!==''?s.kg+' kg × ':'')+s.result).join(' / '))+'</p><button type="button" class="btn secondary" data-log-delete="'+esc(r.id)+'">'+tr('Delete entry','מחיקת רשומה')+'</button></section>').join(''));
  const dialog=$('#workoutLogDialog');dialog.dir=currentLanguage==='he'?'rtl':'ltr';if(!dialog.open)dialog.showModal();
}
function logFailure() { $('#logError').textContent=tr('Could not save or import. Check the entries and available browser storage. Existing history has been kept.','השמירה או הייבוא נכשלו. בדקו את הרשומות ואת מקום האחסון בדפדפן. ההיסטוריה הקיימת נשמרה.'); }
function mergeWorkoutLogs(existing,incoming) {
  validateWorkoutLogs(existing);validateWorkoutLogs(incoming);
  const merged=existing.slice();const ids=new Map(existing.map(row=>[row.id,row]));
  for(const row of incoming){if(ids.has(row.id)){if(JSON.stringify(ids.get(row.id))!==JSON.stringify(row))throw Error('Conflicting log entry');}else{merged.push(row);ids.set(row.id,row);}}
  return validateWorkoutLogs(merged);
}
let logDownloadUrl = '';
document.addEventListener('click',e=>{
  const button=e.target.closest('button');if(!button)return;
  if(button.hasAttribute('data-log-close')){$('#workoutLogDialog').close();return;}
  if(button.hasAttribute('data-log-history')){openLogHistory();return;}
  if(button.dataset.logExercise){openWorkoutLog(...button.dataset.logExercise.split(':').map(Number));return;}
  if(button.dataset.restExercise){const [d,i]=button.dataset.restExercise.split(':').map(Number);const ex=currentPlan.workouts[d].exercises[i];const seconds=restSeconds(ex.rest);restTimer={...restTimer,owner:trackingIdentity(currentPlan),label:tr(ex.name,ex.he),total:seconds,remaining:seconds,deadline:Date.now()+seconds*1000};startRestTick();$('#restTimerPanel').scrollIntoView({block:'nearest',behavior:'smooth'});return;}
  if(button.dataset.timer){const action=button.dataset.timer;const left=timerRemaining(restTimer);if(action==='toggle'){restTimer.remaining=left||restTimer.total;restTimer.deadline=restTimer.deadline?0:Date.now()+restTimer.remaining*1000;}if(action==='reset'){restTimer.remaining=restTimer.total;restTimer.deadline=0;}if(action==='more'){restTimer.remaining=Math.min(1800,left+30);if(restTimer.deadline)restTimer.deadline=Date.now()+restTimer.remaining*1000;}if(action==='stop'){restTimer.owner='';restTimer.deadline=0;}if(restTimer.deadline)startRestTick();else{clearInterval(restTimer.interval);paintRestTimer();}return;}
  if(button.hasAttribute('data-log-export')){try{const raw=localStorage.getItem(WORKOUT_LOG_PREFIX+logContext.identity)||'[]';let data;try{data={version:1,identity:logContext.identity,entries:validateWorkoutLogs(JSON.parse(raw))};}catch{data={version:1,identity:logContext.identity,damagedData:raw};}if(logDownloadUrl)URL.revokeObjectURL(logDownloadUrl);logDownloadUrl=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));$('#logExportLink').innerHTML='<a class="btn secondary" download="binyamin-workout-log.json" href="'+logDownloadUrl+'">'+tr('Download prepared log backup','הורדת גיבוי היומן')+'</a>';}catch{logFailure();}return;}
  if(button.dataset.logDelete){try{const rows=readWorkoutLogs(logContext.identity).filter(r=>r.id!==button.dataset.logDelete);writeWorkoutLogs(logContext.identity,rows);openLogHistory();renderPlan(currentPlan);}catch{logFailure();}}
});
document.addEventListener('submit',e=>{
  if(e.target.id!=='setLogForm')return;e.preventDefault();
  try{const form=new FormData(e.target);const sets=[];for(let i=0;form.has('result'+i);i++){const result=String(form.get('result'+i)).trim();const kg=String(form.get('kg'+i)).trim();if(!result&&!kg)continue;if(!result)throw Error('Missing result');sets.push({kg:kg===''?'':Number(kg),result});}const rows=readWorkoutLogs(logContext.identity);rows.push({id:makeId(),date:String(form.get('sessionDate')),created:Date.now(),exercise:logContext.exercise,day:logContext.day,sets});writeWorkoutLogs(logContext.identity,rows);$('#workoutLogDialog').close();renderPlan(currentPlan);flashToast(tr('Session saved on this device','האימון נשמר במכשיר הזה'));}catch{logFailure();}
});
document.addEventListener('change',async e=>{
  if(e.target.id!=='logImport')return;
  const identity=logContext.identity;
  try{const file=e.target.files[0];if(!file)return;if(file.size>5000000)throw Error('Too large');const data=JSON.parse(await file.text());if(data.version!==1)throw Error('Invalid backup');if(data.identity!==identity)throw Error('Different member');const merged=mergeWorkoutLogs(readWorkoutLogs(identity),data.entries);writeWorkoutLogs(identity,merged);if(logContext.identity===identity){openLogHistory();renderPlan(currentPlan);$('#logError').textContent=tr('Log imported. Existing entries kept.','היומן יובא. הרשומות הקיימות נשמרו.');}}catch(error){if(error.message==='Different member')$('#logError').textContent=tr('This backup belongs to a different member or an older routine link. Open its original routine to import it.','הגיבוי שייך למתאמן אחר או לקישור תוכנית ישן. פתחו את התוכנית המקורית שלו כדי לייבא.');else logFailure();}finally{e.target.value='';}
});
document.addEventListener('visibilitychange',()=>{if(restTimer.owner)paintRestTimer();});
