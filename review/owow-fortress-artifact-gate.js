'use strict';
/* FORTRESS synthetic artifact release policy. Metadata-only, no secret content inspection.
 * No external release or deployment. This is a build gate, not an anonymity guarantee. */
const PRIVATE=new Set(['fortress','generator','owow-internal','private-keys','source-map','credentials','internal-evidence']);
const ALLOWED=new Set(['app-ui','public-assets','public-api-contract','security-policy-runtime','release-notice']);
function assess(manifest){
 const deny=reason=>Object.freeze({decision:'HOLD',reason,deployable:false});
 if(!manifest||typeof manifest!=='object'||Array.isArray(manifest)||!Array.isArray(manifest.artifacts))return deny('MANIFEST_HOLD');
 if(manifest.synthetic!==true||manifest.ownerApproved!==false||manifest.deploymentApproved!==false)return deny('RELEASE_CONTEXT_HOLD');
 if(!/^[a-z][a-z0-9_-]{1,63}$/.test(manifest.product)||!/^[a-z][a-z0-9_-]{1,63}$/.test(manifest.tenant))return deny('SCOPE_HOLD');
 if(manifest.artifacts.length===0||manifest.artifacts.length>100)return deny('ARTIFACT_COUNT_HOLD');
 const paths=new Set();
 for(const a of manifest.artifacts){
  if(!a||typeof a.path!=='string'||!a.path.startsWith('dist/')||a.path.includes('..')||a.path.includes('\\')||/[^a-zA-Z0-9_.\/-]/.test(a.path)||paths.has(a.path))return deny('PATH_HOLD');
  paths.add(a.path);
  if(PRIVATE.has(a.kind)||!ALLOWED.has(a.kind))return deny('PRIVATE_ARTIFACT_HOLD');
  if(a.containsSecrets!==false||a.containsInternalSource!==false||a.containsSourceMap!==false||a.containsPersonalData!==false)return deny('DISCLOSURE_HOLD');
 }
 return Object.freeze({decision:'SYNTHETIC_BUILD_ELIGIBLE_ONLY',reason:'METADATA_POLICY_PASS',deployable:false,product:manifest.product,tenant:manifest.tenant});
}
module.exports={assess};