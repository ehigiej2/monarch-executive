'use strict';
/* Fail-closed simulated operator control gating. No production health assertions. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {buildOutage}=require('./owow-benin-outage-dashboard-bundle.js');
function buildGated(receipts,market,explanations,ownerReviews,viewSource,lifecycleSource){
 return buildOutage(receipts,market,explanations,ownerReviews,viewSource,lifecycleSource).map(page=>{
  const script='<script>(function(){var select=document.getElementById("owow-outage-select");'+
  'function update(){var unsafe=["power","storage","all"].includes(select.value);'+
  'document.querySelectorAll("#review-lifecycle [data-review-action],button[data-workflow]").forEach(function(b){b.disabled=unsafe;b.setAttribute("aria-disabled",String(unsafe));});'+
  'var s=document.getElementById("owow-outage-actions");if(unsafe)s.textContent="SIMULATED DEVICE FAILURE: controls disabled. Do not record a new decision.";'+
  '}select.addEventListener("change",update);update();'+
  'new MutationObserver(update).observe(document.getElementById("review-lifecycle"),{childList:true,subtree:true});'+
  '})();</script>';
  const html=page.html.replace('</body>',script+'</body>');
  return {...page,filename:page.filename.replace('-outage-review.html','-outage-gated.html'),html,sha256:crypto.createHash('sha256').update(html).digest('hex')};
 });
}
if(require.main===module){
 const [receiptDir,marketFile,explanationsFile,ownerFile,outDir]=process.argv.slice(2);
 if(!receiptDir||!marketFile||!explanationsFile||!ownerFile||!outDir||fs.existsSync(outDir))throw Error('ARGS_OR_OVERWRITE_HOLD');
 const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),receipts={};
 for(const role of ['terry','osayuki'])receipts[role]=read(path.join(receiptDir,role+'-synthetic-contract-receipt.json'));
 const outputs=buildGated(receipts,read(marketFile),read(explanationsFile),read(ownerFile),fs.readFileSync(path.join(__dirname,'owow-contract-receipt-view.js'),'utf8'),fs.readFileSync(path.join(__dirname,'owow-owner-lifecycle.js'),'utf8'));
 fs.mkdirSync(outDir);for(const x of outputs)fs.writeFileSync(path.join(outDir,x.filename),x.html,{flag:'wx'});
 console.log(JSON.stringify(outputs.map(({role,filename,sha256})=>({role,filename,sha256}))));
}
module.exports={buildGated};