let sharedStorage = { configured:false, authenticated:false, checked:false };
let cloudMembers = [];
let editingCloudRevision = 0;
async function cloudRequest(path, options={}) {
  const response = await fetch('/api/' + path, {credentials:'same-origin', ...options, headers:{'Content-Type':'application/json',...options.headers}});
  let data;try { data=await response.json(); } catch { throw Error('Shared storage is unavailable. Your browser copy is still available.'); }
  if (!response.ok) { if (response.status===401) {sharedStorage.authenticated=false;paintStorageStatus();} throw Error(data.error || 'Could not complete the request.'); }
  return data;
}
async function checkSharedStorage() {
  try { Object.assign(sharedStorage,await cloudRequest('session')); }
  catch { sharedStorage.configured=false; }
  sharedStorage.checked=true;paintStorageStatus();
}
function paintStorageStatus() {
  const status=$('.side-status');
  const text=sharedStorage.authenticated ? 'Shared' : sharedStorage.configured ? 'Sign in' : 'Local';
  status.querySelector('span:last-child').textContent=text;
  status.title=sharedStorage.authenticated ? 'Shared gym member library' : sharedStorage.configured ? 'Sign in to use shared saved members' : 'Member data stays in this browser';
  $('#storageAction').hidden=!sharedStorage.configured;
  $('#storageAction').textContent=sharedStorage.authenticated ? 'Sign out' : 'Staff sign in';
  $('#libraryStorageHint').textContent=sharedStorage.authenticated ? 'Shared gym library and profiles saved in this browser.' : sharedStorage.configured ? 'Browser copies shown. Sign in to see the shared gym library.' : 'Profiles are stored only in this browser.';
  $('#uploadLocalBtn').hidden=!sharedStorage.authenticated;
}
async function requireStaffSession() {
  if (!sharedStorage.checked) await checkSharedStorage();
  if (!sharedStorage.configured || sharedStorage.authenticated) return true;
  const dialog=$('#staffAccessDialog');$('#staffAccessError').textContent='';$('#staffCode').value='';dialog.showModal();
  return new Promise(resolve=>dialog.addEventListener('close',()=>resolve(sharedStorage.authenticated),{once:true}));
}
async function refreshCloudMembers() {
  if (sharedStorage.authenticated) cloudMembers=(await cloudRequest('members')).members;
}
function libraryProfiles() {
  const profiles=new Map(getProfiles().map(p=>[p.id,p]));
  for (const p of cloudMembers) profiles.set(p.id,p);
  return [...profiles.values()];
}
async function openMemberLibrary() {
  try {
    await requireStaffSession(); await refreshCloudMembers();renderSaved();$('#backupStatus').textContent='';
  } catch(err) { renderSaved();$('#backupStatus').textContent=err.message; }
  $('#savedDialog').showModal();
}
async function loadLibraryProfile(p) {
  if (p.cloudRevision) p=(await cloudRequest('members?id='+encodeURIComponent(p.id))).member;
  editingCloudRevision=p.cloudRevision || 0;
  setFormData(p);
  currentPlan=p.routineOverride ? restoreRoutineState(p) : null;
  activeDayIndex=Math.min(p.activeDayIndex || 0,(currentPlan?.workouts.length || 1)-1);
  setLanguage(p.language || 'en');
  if(currentPlan){renderPlan(currentPlan);setOutputState(true);}else{$('#routineView').innerHTML='';setOutputState(false);}
  $('#savedDialog').close();window.scrollTo({top:0,behavior:'smooth'});
}
async function deleteLibraryProfile(p) {
  if (!confirm('Delete this saved member? Routine links already sent will still work.')) return;
  if(p.cloudRevision) await cloudRequest('members?id='+encodeURIComponent(p.id)+'&revision='+p.cloudRevision,{method:'DELETE'});
  setProfiles(getProfiles().filter(x=>x.id!==p.id));cloudMembers=cloudMembers.filter(x=>x.id!==p.id);renderSaved();
}
async function syncLocalMembers() {
  const button=$('#uploadLocalBtn');button.disabled=true;
  let count=0;
  try {
    await refreshCloudMembers();
    const ids=new Set(cloudMembers.map(p=>p.id));
    for(const p of getProfiles()) {
      if(ids.has(p.id)) continue;
      const clean={...p};delete clean.cloudRevision;
      await cloudRequest('members',{method:'POST',body:JSON.stringify(clean)});count++;
      $('#backupStatus').textContent=`Saved ${count} browser profiles to the shared library…`;
    }
    await refreshCloudMembers();renderSaved();$('#backupStatus').textContent=`${count} browser profiles added. Existing shared profiles were kept.`;
  } catch(err) {$('#backupStatus').textContent=`${count} profiles added. ${err.message}`;}
  finally {button.disabled=false;}
}
function normalizeWhatsAppPhone(value) {
  const raw=String(value || '').trim();if(!raw)return '';
  if(!/^[+\d\s().-]+$/.test(raw)) throw Error('Enter a phone number, or leave it blank to choose a contact in WhatsApp.');
  let digits=raw.replace(/\D/g,'');
  if(digits.startsWith('00'))digits=digits.slice(2);
  if(digits.startsWith('0')&&digits.length===10)digits='972'+digits.slice(1);
  if(!/^[1-9]\d{7,14}$/.test(digits))throw Error('Use an Israeli number such as 050-123-4567, or an international number with its country code.');
  return digits;
}
function whatsAppMessage(name,url,lang) {
  return lang==='he' ? `שלום${name ? ' '+name : ''}, הנה תוכנית האימונים שלך בכושר בנימין. אפשר לפתוח בטלפון או להדפיס:\n${url}` : `Hi${name ? ' '+name : ''}, here is your Binyamin Gym routine. Open it on your phone or print it:\n${url}`;
}
function whatsAppUrl(phone,message) { return 'https://wa.me/'+phone+'?text='+encodeURIComponent(message); }
async function openWhatsAppShare() {
  if(!currentPlan)return;
  if(routineSettingsDiffer(getFormData(),currentPlan.profile) && !confirm('Intake settings changed. Share the currently displayed routine?'))return;
  const dialog=$('#whatsAppDialog');
  $('#whatsAppPhone').value=$('#phone').value;
  $('#whatsAppStatus').textContent='Preparing the routine link…';
  $('#openWhatsAppBtn').hidden=true;$('#prepareWhatsAppBtn').disabled=true;
  dialog.showModal();
  try {
    let url=buildMemberUrl();
    if(!sharedStorage.checked)await checkSharedStorage();
    if(sharedStorage.configured) {
      dialog.close();if(!await requireStaffSession())return;dialog.showModal();
      const {token}=await cloudRequest('routines',{method:'POST',body:JSON.stringify(publicSharePlan(currentPlan))});
      const link=new URL(location.href);link.search='';link.hash='';link.searchParams.set('r',token);url=link.toString();
    }
    dialog.dataset.routineUrl=url;
    $('#whatsAppStatus').textContent='Review the message, then open WhatsApp. You choose when to send it.';
    $('#prepareWhatsAppBtn').disabled=false;prepareWhatsAppLink();
  } catch(err) {$('#whatsAppStatus').textContent=err.message;}
}
function prepareWhatsAppLink() {
  try {
    const phone=normalizeWhatsAppPhone($('#whatsAppPhone').value);
    const url=$('#whatsAppDialog').dataset.routineUrl;
    if(!url)throw Error('Close this window and try sharing again.');
    const message=whatsAppMessage(currentPlan.profile.name,url,currentLanguage);
    $('#whatsAppMessage').value=message;$('#whatsAppMessage').dir=currentLanguage==='he'?'rtl':'ltr';$('#whatsAppMessage').lang=currentLanguage;
    $('#openWhatsAppBtn').href=whatsAppUrl(phone,message);$('#openWhatsAppBtn').hidden=false;
    $('#whatsAppStatus').textContent=phone ? 'WhatsApp will open for this number. Review and press Send there.' : 'WhatsApp will let you choose a contact. Review and press Send there.';
  } catch(err) {$('#openWhatsAppBtn').hidden=true;$('#whatsAppStatus').textContent=err.message;}
}
async function initDatabaseRoutine() {
  const token=new URLSearchParams(location.search).get('r');if(token===null)return false;
  memberShareMode=true;document.body.classList.add('member-share-mode');
  try {
    const {routine}=await cloudRequest('routines?token='+encodeURIComponent(token));
    currentPlan=inflateSharedPlan(routine);currentLanguage=currentPlan.sharedLanguage;activeDayIndex=0;
    setLanguage(currentLanguage);setOutputState(true);renderPlan(currentPlan);
    $('#shareBtn').hidden=true;$('#saveProfileBtnTop').hidden=true;
  } catch {
    $('#emptyState').hidden=true;$('#routineView').hidden=false;
    $('#routineView').innerHTML='<div class="link-error"><h1>This routine could not be opened</h1><p>Check your connection and try again, or ask gym staff for a new link.</p><div dir="rtl" lang="he"><h2>לא ניתן לפתוח את התוכנית</h2><p>בדקו את החיבור ונסו שוב, או בקשו מהצוות קישור חדש.</p></div></div>';
    $('#languageToggle').hidden=true;
  } finally {document.documentElement.classList.remove('shared-routine-loading');}
  return true;
}
