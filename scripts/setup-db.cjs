const fs=require('node:fs');
process.loadEnvFile('.env.local');
if(!require('../server/security.cjs').configured())throw Error('Missing database or access settings.');
const sql=require('../server/db.cjs')();
(async()=>{
  for(const statement of fs.readFileSync('server/schema.sql','utf8').split(';').filter(x=>x.trim())) await sql.query(statement);
  console.log('Binyamin Gym database tables ready.');
})().catch(()=>{console.error('Database setup failed. Check the project connection.');process.exitCode=1;});
