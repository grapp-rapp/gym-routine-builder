const crypto = require('node:crypto');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const cookieName = 'binyamin_staff';
function configured() { return !!(process.env.DATABASE_URL && process.env.STAFF_CODE_HASH && process.env.AUTH_SECRET); }
function digest(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function equal(a, b) { return typeof a === 'string' && typeof b === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b)); }
function sign(value) { return crypto.createHmac('sha256', process.env.AUTH_SECRET).update(value).digest('hex'); }
function sessionCookie() { const expiry = String(Date.now() + 8 * 3600000); return `${cookieName}=${expiry}.${sign(expiry)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`; }
function authenticated(req) {
  if (!configured()) return false;
  const token = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(cookieName + '='))?.slice(cookieName.length + 1) || '';
  const [expiry, signature] = token.split('.');
  return /^\d{13}$/.test(expiry || '') && Number(expiry) > Date.now() && Number(expiry) <= Date.now() + 8 * 3600000 && equal(signature, sign(expiry));
}
function sameOrigin(req) { try { return new URL(req.headers.origin).host === req.headers.host; } catch { return false; } }
function json(res, status, data) { res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('X-Content-Type-Options', 'nosniff'); return res.status(status).json(data); }
function body(req) { const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; if (!data || JSON.stringify(data).length > 150000) throw Error('Request is too large or invalid.'); return data; }
let validationContext;
function validators() {
  if (!validationContext) {
    validationContext = vm.createContext({ console, TextEncoder, TextDecoder });
    for (const file of ['js/exercise-catalog.js', 'js/translations.js', 'js/routine-engine.js', 'js/sharing.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), validationContext);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/validation.js'), 'utf8'), validationContext);
  }
  return validationContext;
}
function validateMember(data) {
  const context = validators(); context.input = data;
  try { vm.runInContext('validateProfiles([input])', context); } finally { delete context.input; }
  if (data.phone !== undefined && (typeof data.phone !== 'string' || data.phone.length > 30)) throw Error('Invalid phone number.');
  return data;
}
function validatePublic(data) {
  const context = validators(); context.input = data;
  try {
    vm.runInContext('validateSharedPlan(normalizeSharedPlan(input))', context);
    if (data.v !== 4) throw Error('Unsupported routine.');
    // Allowlist the public payload; intake details and phone never enter this table.
    const p = data.p;
    return { v:4, l:data.l === 'he' ? 'he' : 'en', p:{a:p.a,i:p.i,n:p.n,g:p.g,e:p.e,d:p.d,t:p.t,m:p.m}, guidance:data.guidance,
      w:data.w.map(w => ({n:w.n,h:w.h,x:w.x.map(x => x.slice(0,9))})) };
  } finally { delete context.input; }
}
module.exports = { configured, digest, equal, sessionCookie, authenticated, sameOrigin, json, body, validateMember, validatePublic };
