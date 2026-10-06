const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const live=process.argv.includes('--live');
if(live) process.loadEnvFile(path.join(root,'.env.local'));
else Object.assign(process.env,{DATABASE_URL:'postgresql://test:test@localhost/test',STAFF_CODE_HASH:'test',AUTH_SECRET:'test-secret-only'});
const s=require('../server/security.cjs');
const ctx=vm.createContext({console,TextEncoder,TextDecoder,URL,currentLanguage:'he'});
for(const file of ['exercise-catalog','translations','routine-engine','sharing','validation','cloud']) vm.runInContext(fs.readFileSync(path.join(root,'js',file+'.js'),'utf8'),ctx);
const run=code=>vm.runInContext(code,ctx);
const member=run(`({id:'qa-cloud-'+Date.now(),name:'QA shared storage',phone:'0501234567',age:35,height:175,weight:80,gender:'male',experience:'new',days:3,duration:60,goal:'general',activity:'one_two',cardioPreference:'jumpRope',issues:['lowBack'],issueNotes:'PRIVATE ISSUE'})`);
ctx.member=member;
const snapshot=run('publicSharePlan(buildPlan(member))');
const routineOverride=run('buildPlan(member).workouts.map(w=>({name:w.name,nameHe:w.nameHe,exercises:w.exercises.map(ex=>({key:ex.key,sets:ex.sets,reps:ex.reps,rest:ex.rest,note:ex.cue,noteHe:ex.cueHe}))}))');
member.routineOverride=routineOverride;
assert(s.validateMember(member));
assert(!JSON.stringify(s.validatePublic({...snapshot,p:{...snapshot.p,phone:member.phone,issueNotes:'PRIVATE ISSUE'}})).includes('PRIVATE'));
assert(!JSON.stringify(s.validatePublic(snapshot)).includes('0501234567'));
assert.throws(()=>s.validateMember({...member,days:9}));
assert.throws(()=>s.validatePublic({...snapshot,w:[{...snapshot.w[0],x:[['not-an-exercise',3,'10','60 sec']]}]}));
assert.equal(run("normalizeWhatsAppPhone('050-123-4567')"),'972501234567');
assert.equal(run("normalizeWhatsAppPhone('+44 7700 900123')"),'447700900123');
assert.equal(run("normalizeWhatsAppPhone('0044 7700 900123')"),'447700900123');
assert.equal(run("normalizeWhatsAppPhone('')"),'');
assert.throws(()=>run("normalizeWhatsAppPhone('050abc1234567')"));
assert.throws(()=>run("normalizeWhatsAppPhone('123')"));
assert.equal(run("new URL(whatsAppUrl('',whatsAppMessage('QA','https://example.com/?r=token','he'))).searchParams.get('text')").includes('https://example.com/?r=token'),true);
assert(s.sameOrigin({headers:{origin:'https://gym.example',host:'gym.example'}}));
assert(!s.sameOrigin({headers:{origin:'https://other.example',host:'gym.example'}}));
const cookie=s.sessionCookie().split(';')[0];
assert(s.authenticated({headers:{cookie}}));
assert(!s.authenticated({headers:{cookie:cookie+'x'}}));
assert(!s.authenticated({headers:{cookie:'binyamin_staff=9999999999999.fake'}}));
async function call(file,method,body,query={},cookie='') {
  const req={method,body,query,headers:{host:'gym.example',origin:'https://gym.example',cookie,'x-forwarded-for':'qa-integration'}};
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.statusCode=code;return this;},json(data){this.data=data;return this;}};
  await require('../api/'+file+'.js')(req,res);return res;
}
(async()=>{
  assert.equal((await call('members','GET')).statusCode,401);
  assert.equal((await call('routines','POST',snapshot)).statusCode,401);
  assert.equal((await call('routines','GET',null,{token:'invalid'})).statusCode,404);
  if(live) {
    let token;
    const sql=require('../server/db.cjs')();
    try {
      const code=fs.readFileSync(path.join(root,'tmp/gym-access-code.txt'),'utf8').split('\n')[2];
      assert.equal((await call('session','POST',{code:'incorrect'})).statusCode,401);
      const session=await call('session','POST',{code});assert.equal(session.statusCode,200);
      const staff=session.headers['Set-Cookie'].split(';')[0];
      assert.equal((await call('members','POST',{...member,days:9},{},staff)).statusCode,400);
      const saved=await call('members','POST',member,{},staff);assert.equal(saved.statusCode,200);assert.equal(saved.data.member.cloudRevision,1);
      const loaded=await call('members','GET',null,{id:member.id},staff);assert.equal(loaded.data.member.phone,member.phone);assert.equal(loaded.data.member.routineOverride[0].exercises.at(-1).key,'jumpRope');
      const list=await call('members','GET',null,{},staff);assert(!list.data.members.find(p=>p.id===member.id).routineOverride);
      assert.equal((await call('members','POST',{...member,name:'QA updated',cloudRevision:1},{},staff)).statusCode,200);
      assert.equal((await call('members','POST',{...member,cloudRevision:1},{},staff)).statusCode,409);
      const share=await call('routines','POST',snapshot,{},staff);assert.equal(share.statusCode,201);token=share.data.token;assert.equal(token.length,48);
      const opened=await call('routines','GET',null,{token});assert.equal(opened.statusCode,200);assert.equal(opened.data.routine.l,'he');assert(!JSON.stringify(opened.data).includes(member.phone));assert(!JSON.stringify(opened.data).includes('PRIVATE ISSUE'));
      assert.equal((await call('members','DELETE',null,{id:member.id,revision:1},staff)).statusCode,409);
      assert.equal((await call('members','DELETE',null,{id:member.id,revision:2},staff)).statusCode,200);
      assert.equal((await call('members','GET',null,{id:member.id},staff)).statusCode,404);
      assert.equal((await call('routines','GET',null,{token})).statusCode,200);
      console.log('PASS real Neon sign-in, save, load, edited routine, directory summaries, conflict protection, public short links, deletion and privacy');
    } finally {
      await sql`DELETE FROM gym_members WHERE id=${member.id}`;
      if(token)await sql`DELETE FROM gym_routines WHERE token_hash=${s.digest(token)}`;
      await sql`DELETE FROM gym_login_attempts WHERE id=${s.digest('qa-integration')}`;
    }
  }
  console.log('PASS staff session, origin protection, member/public validation and WhatsApp phone/message tests');
})().catch(err=>{console.error(err.message);process.exitCode=1;});
