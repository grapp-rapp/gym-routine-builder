const s = require('../server/security.cjs');
const db = require('../server/db.cjs');
module.exports = async (req,res) => {
  if (!s.configured()) return s.json(res,503,{error:'Shared storage is not connected yet.'});
  if (!s.authenticated(req)) return s.json(res,401,{error:'Sign in with the gym access code.'});
  if (req.method !== 'GET' && !s.sameOrigin(req)) return s.json(res,403,{error:'Please use the gym app.'});
  const id=req.query?.id;
  if (id !== undefined && (typeof id !== 'string' || id.length > 150)) return s.json(res,400,{error:'Invalid member.'});
  try {
    const sql=db();
    if (req.method === 'GET') {
      if (id) { const [row]=await sql`SELECT data, revision FROM gym_members WHERE id=${id}`; return row ? s.json(res,200,{member:{...row.data,cloudRevision:row.revision}}) : s.json(res,404,{error:'This saved member was deleted.'}); }
      const rows=await sql`SELECT data - 'routineOverride' - 'planProfile' AS data, revision FROM gym_members ORDER BY updated_at DESC LIMIT 10000`;
      return s.json(res,200,{members:rows.map(row=>({...row.data,cloudRevision:row.revision,cloudSummary:true}))});
    }
    if (req.method === 'POST') {
      let member; try { member=s.validateMember(s.body(req)); } catch { return s.json(res,400,{error:'The member profile is invalid.'}); }
      const revision=Number(member.cloudRevision || 0);
      const clean={...member};delete clean.cloudRevision;delete clean.cloudSummary;
      const [row]=await sql`INSERT INTO gym_members (id,data) VALUES (${member.id},${JSON.stringify(clean)}::jsonb) ON CONFLICT (id) DO UPDATE SET data=EXCLUDED.data, revision=gym_members.revision+1, updated_at=now() WHERE gym_members.revision=${revision} RETURNING revision`;
      if (!row) return s.json(res,409,{error:'Another staff member updated this profile. Reload it before saving.'});
      return s.json(res,200,{member:{...clean,cloudRevision:row.revision}});
    }
    if (req.method === 'DELETE' && id) {
      const revision=Number(req.query.revision);
      const rows=await sql`DELETE FROM gym_members WHERE id=${id} AND revision=${revision} RETURNING id`;
      return rows.length ? s.json(res,200,{ok:true}) : s.json(res,409,{error:'This member changed. Refresh the library before deleting.'});
    }
    return s.json(res,405,{error:'Method not allowed.'});
  } catch { return s.json(res,503,{error:'Shared storage is unavailable. Your browser copy is still available.'}); }
};
