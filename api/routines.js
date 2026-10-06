const crypto = require('node:crypto');
const s = require('../server/security.cjs');
const db = require('../server/db.cjs');
module.exports = async (req,res) => {
  if (!s.configured()) return s.json(res,503,{error:'Shared storage is not connected yet.'});
  try {
    const sql=db();
    if (req.method === 'GET') {
      const token=req.query?.token;
      if (typeof token !== 'string' || !/^[a-f0-9]{48}$/.test(token)) return s.json(res,404,{error:'Routine not found.'});
      const [row]=await sql`SELECT snapshot FROM gym_routines WHERE token_hash=${s.digest(token)}`;
      return row ? s.json(res,200,{routine:row.snapshot}) : s.json(res,404,{error:'Routine not found.'});
    }
    if (!s.authenticated(req)) return s.json(res,401,{error:'Sign in with the gym access code.'});
    if (!s.sameOrigin(req)) return s.json(res,403,{error:'Please use the gym app.'});
    if (req.method === 'POST') {
      let snapshot;try { snapshot=s.validatePublic(s.body(req)); } catch { return s.json(res,400,{error:'The routine is invalid.'}); }
      const token=crypto.randomBytes(24).toString('hex');
      await sql`INSERT INTO gym_routines (token_hash,snapshot) VALUES (${s.digest(token)},${JSON.stringify(snapshot)}::jsonb)`;
      return s.json(res,201,{token});
    }
    return s.json(res,405,{error:'Method not allowed.'});
  } catch { return s.json(res,503,{error:'Could not store the routine. Please try again.'}); }
};
