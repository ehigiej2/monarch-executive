'use strict';
/* In-memory owner review state machine. No execution, network or persistence. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.OWOW_OWNER_LIFECYCLE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const STATES=Object.freeze(['DRAFT','PREPARED_FOR_REVIEW','REVISION_REQUESTED','DECISION_RECORDED']);
 const ACTIONS=Object.freeze({
  PREPARE:{DRAFT:'PREPARED_FOR_REVIEW',REVISION_REQUESTED:'PREPARED_FOR_REVIEW'},
  REQUEST_REVISION:{PREPARED_FOR_REVIEW:'REVISION_REQUESTED'},
  RECORD_HOLD:{PREPARED_FOR_REVIEW:'DECISION_RECORDED'}
 });
 function init(record){
  if(!record||record.schema!=='BENIN-OWNER-REVIEW-001'||!['terry','osayuki'].includes(record.role)||record.authority!==false||record.crown!=='HOLD'||record.transaction!=='BLOCKED'||record.external_contact!=='BLOCKED'||record.decision!=='OWNER_REVIEW_REQUIRED'||record.real_customer_data!==false||!record.human_review_required||!/^BENIN-[A-Z]+-[0-9]{3}$/.test(record.request_id)||!/^[a-f0-9]{64}$/.test(record.sha256))throw Error('INIT_HOLD');
  return Object.freeze({requestId:record.request_id,role:record.role,sourceFingerprint:record.sha256,state:'DRAFT',revision:0,history:Object.freeze([]),authority:false,transaction:'BLOCKED'});
 }
 function transition(snapshot,action,actor,reason){
  if(!snapshot||!STATES.includes(snapshot.state)||snapshot.authority!==false||snapshot.transaction!=='BLOCKED'||!['terry','osayuki'].includes(snapshot.role)||snapshot.role!==actor||!ACTIONS[action]||!ACTIONS[action][snapshot.state]||!Number.isSafeInteger(snapshot.revision)||snapshot.revision<0||!Array.isArray(snapshot.history)||snapshot.history.length!==snapshot.revision||snapshot.history.length>=20)throw Error('TRANSITION_HOLD');
  if(typeof reason!=='string'||reason.length<5||reason.length>180||/[<>\u0000-\u001f]/.test(reason))throw Error('REASON_HOLD');
  const next=ACTIONS[action][snapshot.state];
  const event=Object.freeze({sequence:snapshot.revision+1,action,from:snapshot.state,to:next,actor,reason,authority:false,transaction:'BLOCKED'});
  return Object.freeze({...snapshot,state:next,revision:snapshot.revision+1,history:Object.freeze([...snapshot.history,event]),authority:false,transaction:'BLOCKED'});
 }
 return Object.freeze({init,transition,STATES});
});