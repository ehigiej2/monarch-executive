/* OWOW synthetic profile generator v1 — no IO, no network, no authority.
 * Input is an approved manifest object; output is standalone HTML text.
 * Voice/reasoning are intentionally unavailable until independently verified.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OWOW_SYNTHETIC_GENERATOR=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const labels={
 terry:['Onboard traders','Compare suppliers','Local services','Review requests','Commercial evidence','Ask Osayi'],
 osayuki:['Transport partners','Farmers & cooperatives','Suppliers & trade','Pets & veterinary','Partnerships & training','Ask Osayi']
};
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function assertManifest(m){
 if(!m||m.schema!=='MONARCH-OWOW-REUSABLE-ASSEMBLY-V1'||m.mode!=='SYNTHETIC_REVIEW_ONLY'||m.governance!=='CROWN_HOLD'||m.execution!=='PROHIBITED'||m.authority!==false)throw Error('GOVERNANCE_HOLD');
 if(!m.generation_gates||m.generation_gates.no_network!==true||m.generation_gates.no_personal_data!==true||m.generation_gates.no_deployment!==true||m.generation_gates.no_payment!==true)throw Error('GATE_HOLD');
 if(!m.shared||m.shared.voice_runtime!=='UNKNOWN'||m.shared.reasoning_runtime!=='UNKNOWN')throw Error('RUNTIME_CLAIM_HOLD');
 if(!Array.isArray(m.profiles)||m.profiles.length!==2||new Set(m.profiles.map(p=>p.role)).size!==2)throw Error('PROFILE_HOLD');
 if(m.profiles.some(p=>!labels[p.role]||p.data_scope!=='SYNTHETIC_DEMO'||p.allowed_output!=='OWNER_REVIEW_DRAFT_ONLY'||p.interface!=='SIX_BUTTON_EXISTING'))throw Error('PROFILE_SCOPE_HOLD');
 if(m.profiles.some(p=>p.jurisdiction!=='NG-EDO'||!Array.isArray(p.candidate_workflows)||p.candidate_workflows.length===0||p.candidate_workflows.length>6||p.candidate_workflows.some(w=>!/^WF-[A-Z]+-[0-9]{3}$/.test(w))))throw Error('WORKFLOW_SCOPE_HOLD');
 if(m.profiles.some(p=>p.id!==p.role.toUpperCase()))throw Error('IDENTITY_SCOPE_HOLD');
}
function generate(m){
 assertManifest(m);
 return m.profiles.map(p=>{
 const title=escapeHTML(p.id);
 const buttons=labels[p.role].map((name,i)=>'<button type="button" data-workflow="'+i+'">'+escapeHTML(name)+'</button>').join('');
 const evidence=p.candidate_workflows.map(id=>'<li>'+escapeHTML(id)+' — proposed; no live evidence or execution</li>').join('');
 const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MONARCH '+title+' synthetic review</title><style>body{font:18px system-ui;margin:0;background:#f3f6fb;color:#14213d}main{max-width:640px;margin:auto;padding:22px}button{display:block;width:100%;padding:19px;margin:12px 0;border:2px solid #164ca6;border-radius:16px;background:white;color:#14213d;font-size:19px;text-align:left}button:focus-visible{outline:4px solid #ffbf47}section{background:white;border-radius:16px;padding:18px;margin:18px 0}small{display:block}#output{white-space:pre-wrap}</style></head><body><main><h1>MONARCH · '+title+'</h1><p>👑 CROWN HOLD · SYNTHETIC REVIEW ONLY</p><p>Osayi conversational voice and reasoning: UNKNOWN / NOT CONNECTED.</p><section aria-label="Six role workflows">'+buttons+'</section><section><h2>Review-only workflow</h2><p id="output" role="status" aria-live="polite">Choose a workflow. No transaction will occur.</p></section><section><h2>Country evidence candidates</h2><p>Rights, source freshness and production data: UNKNOWN.</p><ul>'+evidence+'</ul></section></main><script>(function(){var b=document.querySelectorAll("button[data-workflow]"),o=document.getElementById("output");b.forEach(function(x){x.addEventListener("click",function(){o.textContent=x.textContent+" — SYNTHETIC REVIEW DRAFT ONLY. No data sent, saved, or authorised.";});});})();<\/script></body></html>';
 return {filename:'owow-'+p.role+'-synthetic-review.html',role:p.role,html,authority:false,network:false};
 });
}
return Object.freeze({generate,assertManifest});
});
