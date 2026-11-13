'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const j=require('./owow-encrypted-review-journal.js');
const record=()=>({schema:'BENIN-OWNER-REVIEW-001',role:'terry',authority:false,crown:'HOLD',transaction:'BLOCKED',external_contact:'BLOCKED',decision:'OWNER_REVIEW_REQUIRED',real_customer_data:false,human_review_required:true,request_id:'BENIN-TRADER-001',sha256:'b'.repeat(64)});
function sandbox(fn){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'owow-outage-'));try{return fn(dir)}finally{fs.rmSync(dir,{recursive:true,force:true})}}
test('restart recovery replays persisted HOLD state',()=>sandbox(dir=>{
 const key=crypto.randomBytes(32),initial=j.init(record());j.store(dir,initial,key,-1);
 let s=j.transition(initial,'PREPARE','terry','Prepared before disconnect');j.store(dir,s,key,0);
 s=j.transition(s,'RECORD_HOLD','terry','Hold until owner evidence');j.store(dir,s,key,1);
 const script='const j=require('+JSON.stringify(path.join(__dirname,'owow-encrypted-review-journal.js'))+');const s=j.load(process.argv[1],"BENIN-TRADER-001",Buffer.from(process.argv[2],"hex"));console.log(JSON.stringify({state:s.state,revision:s.revision,authority:s.authority,transaction:s.transaction}));';
 const p=cp.spawnSync(process.execPath,['-e',script,dir,key.toString('hex')],{encoding:'utf8',timeout:5000});
 assert.equal(p.status,0,p.stderr);assert.deepEqual(JSON.parse(p.stdout),{state:'DECISION_RECORDED',revision:2,authority:false,transaction:'BLOCKED'});
}));
test('lost acknowledgement cannot replay committed transition',()=>sandbox(dir=>{
 const key=crypto.randomBytes(32),s=j.init(record());j.store(dir,s,key,-1);
 const next=j.transition(s,'PREPARE','terry','Prepared during outage');j.store(dir,next,key,0);
 assert.throws(()=>j.store(dir,next,key,0),/STALE_OR_SCOPE_HOLD/);
 assert.equal(j.load(dir,s.requestId,key).revision,1);
}));
test('stale browser state cannot overwrite later revision',()=>sandbox(dir=>{
 const key=crypto.randomBytes(32),s=j.init(record());j.store(dir,s,key,-1);
 const prepared=j.transition(s,'PREPARE','terry','Ready for owner review');j.store(dir,prepared,key,0);
 const revised=j.transition(prepared,'REQUEST_REVISION','terry','Need verified supplier quote');j.store(dir,revised,key,1);
 assert.throws(()=>j.store(dir,j.transition(prepared,'RECORD_HOLD','terry','Outdated review copy'),key,1),/STALE_OR_SCOPE_HOLD/);
 assert.equal(j.load(dir,s.requestId,key).state,'REVISION_REQUESTED');
}));
test('interrupted temporary file cannot replace valid committed state',()=>sandbox(dir=>{
 const key=crypto.randomBytes(32),s=j.init(record());j.store(dir,s,key,-1);
 fs.writeFileSync(path.join(dir,s.requestId+'.sealed.json.aborted.tmp'),'incomplete');
 assert.equal(j.load(dir,s.requestId,key).state,'DRAFT');
}));
test('stranded lock prevents writes safely and requires recovery procedure',()=>sandbox(dir=>{
 const key=crypto.randomBytes(32),s=j.init(record());fs.writeFileSync(path.join(dir,s.requestId+'.sealed.json.lock'),'interrupted');
 assert.throws(()=>j.store(dir,s,key,-1),/CONCURRENT_WRITE_HOLD/);
 assert.equal(fs.existsSync(path.join(dir,s.requestId+'.sealed.json')),false);
}));
test('corrupted committed record cannot be silently reset',()=>sandbox(dir=>{
 const key=crypto.randomBytes(32),s=j.init(record());j.store(dir,s,key,-1);
 fs.writeFileSync(path.join(dir,s.requestId+'.sealed.json'),'TRUNCATED');
 assert.throws(()=>j.load(dir,s.requestId,key),/ENVELOPE_HOLD/);
 assert.throws(()=>j.store(dir,s,key,-1),/DUPLICATE_HOLD/);
}));