const s = require('../server/security.cjs');
const db = require('../server/db.cjs');
module.exports = async (req,res) => {
  if (req.method === 'GET') return s.json(res,200,{configured:s.configured(),authenticated:s.authenticated(req)});
  if (!s.configured()) return s.json(res,503,{error:'Shared storage is not connected yet.'});
  if (!s.sameOrigin(req)) return s.json(res,403,{error:'Open the gym app to sign in.'});
  if (req.method === 'DELETE') { res.setHeader('Set-Cookie','binyamin_staff=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'); return s.json(res,200,{ok:true}); }
  if (req.method !== 'POST') return s.json(res,405,{error:'Method not allowed.'});
  try {
    const sql=db(); const ip = s.digest((req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0]);
    const [attempt] = await sql`INSERT INTO gym_login_attempts (id, attempts, started_at) VALUES (${ip},1,now()) ON CONFLICT (id) DO UPDATE SET attempts=CASE WHEN gym_login_attempts.started_at < now()-interval '15 minutes' THEN 1 ELSE gym_login_attempts.attempts+1 END, started_at=CASE WHEN gym_login_attempts.started_at < now()-interval '15 minutes' THEN now() ELSE gym_login_attempts.started_at END RETURNING attempts`;
    if (attempt.attempts > 10) return s.json(res,429,{error:'Too many attempts. Try again in 15 minutes.'});
    const {code}=s.body(req);
    if (typeof code !== 'string' || code.length > 200 || !s.equal(s.digest(code),process.env.STAFF_CODE_HASH)) return s.json(res,401,{error:'That gym access code is incorrect.'});
    await sql`DELETE FROM gym_login_attempts WHERE id=${ip} OR started_at < now()-interval '1 day'`;
    res.setHeader('Set-Cookie',s.sessionCookie());return s.json(res,200,{ok:true});
  } catch { return s.json(res,503,{error:'Could not sign in. Please try again.'}); }
};
