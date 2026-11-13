/* MONARCH GCL synthetic evidence adapter v0.1
 * Derived projection ONLY. Not a source of truth, authority, data ingestion service,
 * licence clearance, or production implementation. CROWN HOLD.
 * Pure functions; no network, storage, third-party packages or side effects.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.MONARCH_GCL_SYNTHETIC=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const STATES=Object.freeze(['OBSERVED','SECONDARY-REPORTED','SYNTHETIC','INFERRED','UNKNOWN','VERIFIED EXECUTION']);
const WORKFLOWS=Object.freeze(['WF-TRADE-001','WF-BUY-002','WF-SOURCE-003','WF-LOG-004','WF-PROC-005']);
const INVARIANTS=Object.freeze(['CTX-INV-001','CTX-INV-002','CTX-INV-003','CTX-INV-004','CTX-INV-005','CTX-INV-006','CTX-INV-007','CTX-INV-008','CTX-INV-009','CTX-INV-010','CTX-INV-011','CTX-INV-012','CTX-INV-013']);
const allowedFields=['record_id','source_occurrence_id','source_system','locator','report_title','country','publication_date','claim_id','claim_text','evidence_status','rights_status','revision_status','verified_at','tenant_or_context_id','disclosure_policy','retention_class','workflow_id','source_checkpoint','is_synthetic'];
const fail=(reason)=>({decision:'HOLD',reason,projection:null});
function project(input,context){
  if(!input||typeof input!=='object'||Array.isArray(input))return fail('INVALID_RECORD');
  if(!context||typeof context!=='object'||!context.tenant_or_context_id||!context.principal_ref||!context.purpose)return fail('MISSING_REQUEST_CONTEXT');
  if(Object.keys(input).some(k=>!allowedFields.includes(k)))return fail('UNRECOGNISED_OR_SENSITIVE_FIELD');
  if(input.is_synthetic!==true||input.evidence_status!=='SYNTHETIC')return fail('NON_SYNTHETIC_RECORD');
  if(input.tenant_or_context_id!==context.tenant_or_context_id)return fail('TENANT_CONTEXT_MISMATCH');
  if(input.disclosure_policy!=='SYNTHETIC_REVIEW_ONLY')return fail('DISCLOSURE_NOT_ALLOWED');
  if(input.rights_status!=='UNKNOWN'&&input.rights_status!=='SYNTHETIC_NOT_APPLICABLE')return fail('RIGHTS_STATE_NOT_ADMITTED');
  if(input.retention_class!=='EPHEMERAL_SYNTHETIC')return fail('RETENTION_NOT_ADMITTED');
  for(const field of ['record_id','source_occurrence_id','source_system','locator','report_title','country','publication_date','claim_id','claim_text','source_checkpoint']){
    if(typeof input[field]!=='string'||!input[field].trim())return fail('MISSING_'+field.toUpperCase());
    if(input[field].length>600)return fail('FIELD_TOO_LONG');
  }
  if(!/^\d{4}-\d{2}-\d{2}$/.test(input.publication_date)||Number.isNaN(Date.parse(input.publication_date+'T00:00:00Z'))||new Date(input.publication_date+'T00:00:00Z').toISOString().slice(0,10)!==input.publication_date)return fail('INVALID_DATE');
  if(!WORKFLOWS.includes(input.workflow_id))return fail('UNKNOWN_WORKFLOW');
  if(input.verified_at!==null&&input.verified_at!==undefined)return fail('SYNTHETIC_NOT_ORIGINALLY_VERIFIED');
  if(input.revision_status!=='UNKNOWN')return fail('REVISION_NOT_VERIFIED');
  const projection={...input,derived_type:'CONTEXT_PROJECTION',authority:'NONE',execution:'PROHIBITED',verification:'SYNTHETIC_ONLY',context_binding:{tenant_or_context_id:context.tenant_or_context_id,principal_ref:context.principal_ref,purpose:context.purpose}};
  return {decision:'SYNTHETIC_REVIEW',reason:'NOT_AUTHORITATIVE',projection};
}
function example(id,country,report,source,locator,workflow){
 return {record_id:id,source_occurrence_id:id+'-occurrence',source_system:source,locator,report_title:report,country,publication_date:'2026-11-13',claim_id:id+'-claim',claim_text:'Fictional placeholder: no statistical value asserted.',evidence_status:'SYNTHETIC',rights_status:'UNKNOWN',revision_status:'UNKNOWN',verified_at:null,tenant_or_context_id:'SYNTHETIC_DEMO',disclosure_policy:'SYNTHETIC_REVIEW_ONLY',retention_class:'EPHEMERAL_SYNTHETIC',workflow_id:workflow,source_checkpoint:'SYNTHETIC_NO_SOURCE_CHECKPOINT',is_synthetic:true};
}
const examples=Object.freeze([
 example('SYN-UK-001','United Kingdom','UK trade September 2026 — fictional placeholder','ONS','https://www.ons.gov.uk/economy/nationalaccounts/balanceofpayments/bulletins/uktrade/september2026','WF-TRADE-001'),
 example('SYN-FI-001','Finland','Consumer confidence October 2026 — fictional placeholder','Statistics Finland','https://stat.fi/en/publication/cmf5hh1ea3scf07up16lx33ar','WF-BUY-002')
]);
return Object.freeze({project,examples,STATES,WORKFLOWS,INVARIANTS});
});
