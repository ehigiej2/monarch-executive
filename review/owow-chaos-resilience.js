'use strict';
/* Multi-failure MONARCH synthetic-only operational circuit breaker.
   Pure function; no real network checks, transactions, or automatic reopening. */
const {assess}=require('./owow-dependency-isolation.js');
const DEPENDENCIES=Object.freeze(['cloud_ai','cloud_storage','dispatch_api','payments_api','electricity','internet','device_storage']);
const MAX_AGE_MS=30000;
function evaluate(health,now,context){
 if(!Number.isSafeInteger(now)||now<0||!context||context.crown!=='HOLD'||context.synthetic!==true||context.authority!==false)throw Error('HEALTH_CONTEXT_HOLD');
 if(!health||typeof health!=='object'||Array.isArray(health))throw Error('HEALTH_INPUT_HOLD');
 const state={},reasons=[];
 for(const dep of DEPENDENCIES){
  const item=health[dep];
  if(!item||typeof item!=='object'||!['HEALTHY','DEGRADED','ISOLATED','RECOVERY_REVIEW'].includes(item.state)||!Number.isSafeInteger(item.checkedAt)||item.checkedAt<0||item.checkedAt>now) {
   state[dep]='ISOLATED';reasons.push(dep+':INVALID_OR_MISSING');continue;
  }
  if(now-item.checkedAt>MAX_AGE_MS){state[dep]='ISOLATED';reasons.push(dep+':STALE');continue;}
  state[dep]=item.state;
  if(item.state!=='HEALTHY')reasons.push(dep+':'+item.state);
 }
 const localAvailable=state.electricity==='HEALTHY'&&state.device_storage==='HEALTHY';
 const localFeatures=['local_review','local_commercial_calculation','local_deterministic_explanation'];
 const features={};
 for(const feature of localFeatures)features[feature]=localAvailable?assess({},feature,context).decision:'UNAVAILABLE';
 const cloudAvailable=localAvailable&&state.internet==='HEALTHY';
 features.cloud_reasoning=cloudAvailable?assess({cloud_ai:state.cloud_ai},'cloud_reasoning',context).decision:'UNAVAILABLE';
 for(const feature of ['cloud_document_sync','remote_dispatch','external_payment'])features[feature]='BLOCKED';
 return Object.freeze({schema:'OWOW-CHAOS-SYNTHETIC-001',state:Object.freeze(state),features:Object.freeze(features),reasons:Object.freeze(reasons),authority:false,transactions:'BLOCKED',recovery:'MANUAL_REVIEW_ONLY'});
}
module.exports={evaluate,DEPENDENCIES,MAX_AGE_MS};