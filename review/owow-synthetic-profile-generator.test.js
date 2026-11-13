'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {test}=require('node:test');
const generator=require('./owow-synthetic-profile-generator.js');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'owow-reusable-assembly-manifest-v1.json'),'utf8'));
test('two role-specific, standalone synthetic outputs',()=>{
 const outputs=generator.generate(manifest);
 assert.equal(outputs.length,2);
 assert.deepEqual(outputs.map(o=>o.role),['terry','osayuki']);
 assert.notEqual(outputs[0].html,outputs[1].html);
 for(const o of outputs){
  assert.equal((o.html.match(/data-workflow=/g)||[]).length,6);
  assert.match(o.html,/CROWN HOLD/);
  assert.match(o.html,/NOT CONNECTED/);
  assert.match(o.html,/addEventListener/);
  assert.match(o.html,/SYNTHETIC REVIEW DRAFT ONLY/);
  assert.equal(o.authority,false);
  assert.equal(o.network,false);
  assert.doesNotMatch(o.html,/fetch\(|XMLHttpRequest|localStorage|sessionStorage/);
 }
});
test('rejects weakened governance',()=>{
 for(const [key,value] of [['governance','OPEN'],['execution','ALLOWED'],['authority',true]]){
  const m=structuredClone(manifest);m[key]=value;
  assert.throws(()=>generator.generate(m));
 }
});
test('rejects false voice or reasoning claims',()=>{
 for(const key of ['voice_runtime','reasoning_runtime']){
  const m=structuredClone(manifest);m.shared[key]='CONNECTED';
  assert.throws(()=>generator.generate(m),/RUNTIME_CLAIM_HOLD/);
 }
});
test('rejects unapproved role and scope',()=>{
 const m=structuredClone(manifest);m.profiles[0].role='admin';
 assert.throws(()=>generator.generate(m),/PROFILE_SCOPE_HOLD/);
 const n=structuredClone(manifest);n.profiles[1].data_scope='REAL';
 assert.throws(()=>generator.generate(n),/PROFILE_SCOPE_HOLD/);
});
test('escapes untrusted profile titles and evidence identifiers',()=>{
 const m=structuredClone(manifest);
 m.profiles[0].id='<img src=x onerror=alert(1)>';
 m.profiles[0].candidate_workflows=['<script>alert(1)</script>'];
 const html=generator.generate(m)[0].html;
 assert.doesNotMatch(html,/<img src=x|<script>alert\(1\)<\/script>/);
 assert.match(html,/&lt;img/);
 assert.match(html,/&lt;script&gt;/);
});
