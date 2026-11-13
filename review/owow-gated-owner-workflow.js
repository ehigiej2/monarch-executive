'use strict';
/* OWOW fail-closed synthetic workflow gate, not authentication or live monitoring. */
const {evaluate}=require('./owow-chaos-resilience.js');
const lifecycle=require('./owow-owner-lifecycle.js');
const CONTEXT=Object.freeze({crown:'HOLD',synthetic:true,authority:false});
function apply(snapshot,action,actor,reason,health,now){
 const assessment=evaluate(health,now,CONTEXT);
 if(assessment.features.local_review!=='LOCAL_REVIEW_ONLY')throw Error('DEVICE_OUTAGE_HOLD');
 if(!snapshot||snapshot.role!==actor)throw Error('ROLE_SCOPE_HOLD');
 const next=lifecycle.transition(snapshot,action,actor,reason);
 if(next.authority!==false||next.transaction!=='BLOCKED')throw Error('AUTHORITY_HOLD');
 return Object.freeze({snapshot:next,assessment:Object.freeze({schema:assessment.schema,reasons:assessment.reasons,authority:false,transactions:'BLOCKED'})});
}
module.exports={apply};