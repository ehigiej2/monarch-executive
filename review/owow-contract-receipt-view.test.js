'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {validate,display}=require('./owow-contract-receipt-view.js');
const valid=role=>({
 state:'SYNTHETIC_REVIEW_PREPARED',role,authority:false,network:false,
 asr:'NOT_EXECUTED',tts:'NOT_EXECUTED',model_inference:false,human_review_required:true,
 voice_state:'OFFLINE_ADVISORY_FALLBACK_ONLY',reasoning_state:'REVIEWED_PREPARATION_ONLY',
 crown:'HOLD',source:'RECOVERED_LOCAL_CONTRACTS',kind:'BUILD_TIME_SYNTHETIC_SNAPSHOT'
});
test('separate Terry and Osayuki synthetic receipts',()=>{
 for(const role of ['terry','osayuki']){
  const target={textContent:''};
  assert.equal(display(role,valid(role),target),true);
  assert.match(target.textContent,/CROWN HOLD/);
  assert.match(target.textContent,/NOT EXECUTED/);
 }
});
test('cross-role receipt rejected',()=>{
 const target={textContent:''};
 assert.equal(display('terry',valid('osayuki'),target),false);
 assert.match(target.textContent,/HOLD/);
});
test('missing and privileged receipt rejected',()=>{
 for(const receipt of [null,{}, {...valid('terry'),authority:true},{...valid('terry'),network:true},{...valid('terry'),model_inference:true},{...valid('terry'),asr:'EXECUTED'}]){
  assert.throws(()=>validate('terry',receipt));
 }
});
test('no HTML rendering and no false success',()=>{
 const target={textContent:''};
 assert.equal(display('terry',{...valid('terry'),kind:'<script>alert(1)</script>'},target),false);
 assert.doesNotMatch(target.textContent,/<script>/);
});
