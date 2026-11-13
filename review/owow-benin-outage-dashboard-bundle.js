'use strict';
/* Browser-only synthetic outage visualisation, no live health probe or external action. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {build}=require('./owow-benin-lifecycle-bundle.js');
function buildOutage(receipts,market,explanations,ownerReviews,viewSource,lifecycleSource){
 return build(receipts,market,explanations,ownerReviews,viewSource,lifecycleSource).map(page=>{
 const panel='<section aria-label="Synthetic outage dashboard"><h2>Benin City connection resilience</h2><p>SIMULATION ONLY — not live service monitoring.</p><label for="owow-outage-select">Simulate interruption</label><select id="owow-outage-select"><option value="healthy">All dependencies simulated healthy</option><option value="cloud">Cloud AI and storage unavailable</option><option value="internet">Internet unavailable</option><option value="power">Electricity unavailable</option><option value="storage">Device storage unavailable</option><option value="all">Combined failure</option></select><p id="owow-outage-status" role="status" aria-live="polite"></p><p id="owow-outage-actions"></p><p>External payments, dispatch and cloud writes: ALWAYS BLOCKED (CROWN HOLD).</p></section>';
 const script='<script>(function(){var select=document.getElementById("owow-outage-select"),status=document.getElementById("owow-outage-status"),actions=document.getElementById("owow-outage-actions");function render(){var x=select.value,local=x!=="power"&&x!=="storage"&&x!=="all",cloud=x==="healthy";status.textContent="Synthetic state: "+x.toUpperCase()+" · local review: "+(local?"AVAILABLE FOR REVIEW":"UNAVAILABLE")+" · cloud reasoning: "+(cloud?"SIMULATED AVAILABLE":"UNAVAILABLE");actions.textContent=local?"Local synthetic calculation and deterministic explanation available. No external replay.":"Local work blocked. Preserve prior encrypted records; do not claim new writes succeeded.";document.body.dataset.outageMode=x;}select.addEventListener("change",render);render();})();</script>';
 const html=page.html.replace('</main>',panel+'</main>').replace('</body>',script+'</body>');
 return {...page,filename:page.filename.replace('-lifecycle.html','-outage-review.html'),html,sha256:crypto.createHash('sha256').update(html).digest('hex')};
 });
}
if(require.main===module){
 const [receiptDir,marketFile,explanationsFile,ownerFile,outDir]=process.argv.slice(2);
 if(!receiptDir||!marketFile||!explanationsFile||!ownerFile||!outDir||fs.existsSync(outDir))throw Error('ARGS_OR_OVERWRITE_HOLD');
 const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),receipts={};
 for(const role of ['terry','osayuki'])receipts[role]=read(path.join(receiptDir,role+'-synthetic-contract-receipt.json'));
 const outputs=buildOutage(receipts,read(marketFile),read(explanationsFile),read(ownerFile),fs.readFileSync(path.join(__dirname,'owow-contract-receipt-view.js'),'utf8'),fs.readFileSync(path.join(__dirname,'owow-owner-lifecycle.js'),'utf8'));
 fs.mkdirSync(outDir);for(const x of outputs)fs.writeFileSync(path.join(outDir,x.filename),x.html,{flag:'wx'});
 console.log(JSON.stringify(outputs.map(({role,filename,sha256})=>({role,filename,sha256}))));
}
module.exports={buildOutage};