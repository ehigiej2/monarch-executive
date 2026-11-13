'use strict';
/* OWOW synthetic request -> health gate -> encrypted commit -> verified receipt.
 * Never executes transactions, external writes, or authorisation.
 */
const crypto=require('node:crypto');
const gate=require('./owow-gated-owner-workflow.js');
const journal=require('./owow-durable-review-journal.js');
function receipt(snapshot,healthAssessment){
 if(!snapshot||snapshot.authority!==false||snapshot.transaction!=='BLOCKED')throw Error('RECEIPT_AUTHORITY_HOLD');
 const body={schema:'OWOW-SYNTHETIC-COMMIT-RECEIPT-001',requestId:snapshot.requestId,role:snapshot.role,revision:snapshot.revision,state:snapshot.state,sourceFingerprint:snapshot.sourceFingerprint,healthSchema:healthAssessment.schema,authority:false,transaction:'BLOCKED',humanReviewRequired:true};
 return Object.freeze({...body,fingerprint:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')});
}
function execute({directory,requestId,actor,action,reason,health,now,key,expectedRevision}){
 if(!['terry','osayuki'].includes(actor)||!Buffer.isBuffer(key)||key.length!==32||!Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw Error('EXECUTION_CONTEXT_HOLD');
 const current=journal.durableLoad(directory,requestId,key);
 if(current.role!==actor||current.revision!==expectedRevision)throw Error('STALE_OR_ROLE_HOLD');
 const result=gate.apply(current,action,actor,reason,health,now);
 journal.durableStore(directory,result.snapshot,key,expectedRevision);
 const committed=journal.durableLoad(directory,requestId,key);
 if(JSON.stringify(committed)!==JSON.stringify(result.snapshot))throw Error('POST_COMMIT_VERIFICATION_HOLD');
 return receipt(committed,result.assessment);
}
function recover({directory,requestId,key}){
 const snapshot=journal.durableLoad(directory,requestId,key);
 return Object.freeze({schema:'OWOW-SYNTHETIC-RECOVERY-001',requestId:snapshot.requestId,role:snapshot.role,revision:snapshot.revision,state:snapshot.state,authority:false,transaction:'BLOCKED',requiresHumanReview:true});
}
module.exports={execute,recover,receipt};