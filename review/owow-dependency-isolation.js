'use strict';
/* MONARCH synthetic resilience policy. Pure, offline and fail-closed. */
const STATES=Object.freeze(['HEALTHY','DEGRADED','ISOLATED','RECOVERY_REVIEW']);
const FEATURES=Object.freeze({
 local_review:{requires:[],writes:false},
 local_commercial_calculation:{requires:[],writes:false},
 local_deterministic_explanation:{requires:[],writes:false},
 cloud_reasoning:{requires:['cloud_ai'],writes:false},
 cloud_document_sync:{requires:['cloud_storage'],writes:true},
 remote_dispatch:{requires:['dispatch_api'],writes:true},
 external_payment:{requires:['payments_api'],writes:true}
});
function assess(dependencies,feature,context){
 if(!Object.hasOwn(FEATURES,feature))throw Error('UNKNOWN_FEATURE_HOLD');
 if(!context||context.crown!=='HOLD'||context.synthetic!==true||context.authority!==false)throw Error('CONTEXT_HOLD');
 const policy=FEATURES[feature],required=policy.requires;
 if(!dependencies||typeof dependencies!=='object'||Array.isArray(dependencies))throw Error('DEPENDENCY_HOLD');
 for(const dep of required)if(!Object.hasOwn(dependencies,dep)||!STATES.includes(dependencies[dep]))throw Error('DEPENDENCY_HOLD');
 const unhealthy=required.filter(dep=>dependencies[dep]!=='HEALTHY');
 if(policy.writes)return Object.freeze({feature,decision:'BLOCKED',reason:'CROWN_HOLD_NO_EXTERNAL_WRITES',dependencies:unhealthy,authority:false});
 if(unhealthy.length)return Object.freeze({feature,decision:'UNAVAILABLE',reason:'DEPENDENCY_NOT_HEALTHY',dependencies:unhealthy,authority:false});
 return Object.freeze({feature,decision:'LOCAL_REVIEW_ONLY',reason:'SYNTHETIC_NO_AUTHORITY',dependencies:[],authority:false});
}
function transition(current,observation){
 if(!STATES.includes(current)||!['SUCCESS','FAILURE','RECOVERY_PROBE_PASS','OWNER_RELEASE_REVIEW'].includes(observation))throw Error('STATE_INPUT_HOLD');
 if(observation==='FAILURE')return 'ISOLATED';
 if(current==='ISOLATED'&&observation==='RECOVERY_PROBE_PASS')return 'RECOVERY_REVIEW';
 if(current==='RECOVERY_REVIEW'&&observation==='OWNER_RELEASE_REVIEW')return 'DEGRADED';
 if(current==='DEGRADED'&&observation==='SUCCESS')return 'HEALTHY';
 return current;
}
module.exports={assess,transition,FEATURES,STATES};