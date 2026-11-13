/* OWOW build-time contract receipt display adapter.
 * Receipts are produced offline by the recovered Python contracts.
 * No fetch, storage, microphone, inference, sending or authority.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.OWOW_RECEIPT_VIEW=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const ROLES=['terry','osayuki'];
 const REQUIRED=['state','role','authority','network','asr','tts','model_inference','human_review_required','voice_state','reasoning_state','crown','source','kind'];
 function validate(role,receipt){
  if(!ROLES.includes(role)||!receipt||typeof receipt!=='object'||Array.isArray(receipt))throw Error('RECEIPT_INVALID');
  if(REQUIRED.some(k=>!Object.prototype.hasOwnProperty.call(receipt,k)))throw Error('RECEIPT_INCOMPLETE');
  if(receipt.role!==role||receipt.state!=='SYNTHETIC_REVIEW_PREPARED'||receipt.authority!==false||
    receipt.network!==false||receipt.model_inference!==false||receipt.human_review_required!==true||
    receipt.asr!=='NOT_EXECUTED'||receipt.tts!=='NOT_EXECUTED'||receipt.crown!=='HOLD'||
    receipt.voice_state!=='OFFLINE_ADVISORY_FALLBACK_ONLY'||receipt.reasoning_state!=='REVIEWED_PREPARATION_ONLY'||
    receipt.source!=='RECOVERED_LOCAL_CONTRACTS'||receipt.kind!=='BUILD_TIME_SYNTHETIC_SNAPSHOT')
   throw Error('RECEIPT_SCOPE_HOLD');
  return true;
 }
 function display(role,receipt,target){
  if(!target||typeof target.textContent!=='string')throw Error('TARGET_INVALID');
  try{
   validate(role,receipt);
   target.textContent='Offline contract snapshot: '+role.toUpperCase()+
     '\nAION voice: preflight only; ASR/TTS NOT EXECUTED.'+
     '\nDual reasoning: preparation reviewed; no independent assurance.'+
     '\nCROWN HOLD. Human review required. No action authorised.';
   return true;
  }catch(e){
   target.textContent='HOLD — contract receipt unavailable or invalid. No action authorised.';
   return false;
  }
 }
 return Object.freeze({validate,display});
});
