'use strict';
/* Local boundary adapter. Trusted session is injected by host, never accepted from request body.
 * Synthetic-only; no HTTP listener, login system, or external action.
 */
const crypto=require('node:crypto');
const orchestrator=require('./owow-committed-review-orchestrator.js');
const ACTIONS=new Set(['PREPARE','REQUEST_REVISION','RECORD_HOLD']);
const ID=/^BENIN-[A-Z]+-[0-9]{3}$/;
function boundary({trustedSession,request,services}){
 if(!trustedSession||trustedSession.provenance!=='HOST_BOUND_TEST_SESSION'||trustedSession.synthetic!==true||trustedSession.authority!==false||!['terry','osayuki'].includes(trustedSession.role)||!Buffer.isBuffer(trustedSession.key)||trustedSession.key.length!==32)throw Error('SESSION_HOLD');
 if(!request||typeof request!=='object'||Array.isArray(request)||Object.keys(request).some(k=>!['requestId','action','reason','expectedRevision'].includes(k)))throw Error('REQUEST_SHAPE_HOLD');
 if(!ID.test(request.requestId)||!ACTIONS.has(request.action)||typeof request.reason!=='string'||request.reason.length<5||request.reason.length>180||/[<>\u0000-\u001f]/.test(request.reason)||!Number.isSafeInteger(request.expectedRevision)||request.expectedRevision<0)throw Error('REQUEST_VALIDATION_HOLD');
 if(!services||typeof services.directory!=='string'||typeof services.now!=='number'||!services.health)throw Error('SERVICE_SCOPE_HOLD');
 const outcome=orchestrator.execute({directory:services.directory,requestId:request.requestId,actor:trustedSession.role,action:request.action,reason:request.reason,expectedRevision:request.expectedRevision,health:services.health,now:services.now,key:trustedSession.key});
 if(outcome.role!==trustedSession.role||outcome.authority!==false||outcome.transaction!=='BLOCKED')throw Error('RECEIPT_SCOPE_HOLD');
 return Object.freeze({schema:'OWOW-LOCAL-BOUNDARY-RECEIPT-001',requestId:outcome.requestId,role:outcome.role,revision:outcome.revision,state:outcome.state,fingerprint:outcome.fingerprint,authority:false,transaction:'BLOCKED',humanReviewRequired:true});
}
module.exports={boundary};