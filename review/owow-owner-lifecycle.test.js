'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {init,transition}=require('./owow-owner-lifecycle.js');
const record=role=>({schema:'BENIN-OWNER-REVIEW-001',role,authority:false,crown:'HOLD',transaction:'BLOCKED',external_contact:'BLOCKED',decision:'OWNER_REVIEW_REQUIRED',real_customer_data:false,human_review_required:true,request_id:role==='terry'?'BENIN-TRADER-001':'BENIN-HAUL-003',sha256:'a'.repeat(64)});
test('both roles can prepare revise and record HOLD only',()=>{
 for(const role of ['terry','osayuki']){
  let s=init(record(role));
  for(const [action,reason] of [['PREPARE','Ready for synthetic review'],['REQUEST_REVISION','Missing cost evidence'],['PREPARE','Revised synthetic request'],['RECORD_HOLD','Keep CROWN HOLD active']])s=transition(s,action,role,reason);
  assert.equal(s.state,'DECISION_RECORDED');assert.equal(s.revision,4);assert.equal(s.authority,false);assert.equal(s.transaction,'BLOCKED');
  assert.throws(()=>transition(s,'PREPARE',role,'Should not reopen'));
 }
});
test('rejects cross-role, payment and unknown transitions',()=>{
 let s=init(record('terry'));
 assert.throws(()=>transition(s,'PREPARE','osayuki','Cross role attempt'));
 assert.throws(()=>transition(s,'PAY','terry','Try to pay'));
 assert.throws(()=>transition(s,'RECORD_HOLD','terry','Skip review'));
});
test('rejects tampered record and state',()=>{
 assert.throws(()=>init({...record('terry'),authority:true}));
 assert.throws(()=>init({...record('terry'),transaction:'ALLOWED'}));
 const s=init(record('terry'));
 assert.throws(()=>transition({...s,authority:true},'PREPARE','terry','Invalid state'));
});
test('rejects HTML and short reasons',()=>{
 const s=init(record('terry'));
 assert.throws(()=>transition(s,'PREPARE','terry','<script>bad</script>'));
 assert.throws(()=>transition(s,'PREPARE','terry','no'));
});
test('immutable event history, no mutation',()=>{
 const s=transition(init(record('terry')),'PREPARE','terry','Synthetic review only');
 assert.ok(Object.isFrozen(s));assert.ok(Object.isFrozen(s.history));assert.ok(Object.isFrozen(s.history[0]));
});