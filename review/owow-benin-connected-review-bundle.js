'use strict';
/* Synthetic canonical builder: remove legacy in-memory state controller, install only service-backed controls. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {buildGated}=require('./owow-benin-outage-gated-bundle.js');
function buildConnected(receipts,market,explanations,ownerReviews,viewSource,lifecycleSource){
 return buildGated(receipts,market,explanations,ownerReviews,viewSource,lifecycleSource).map(page=>{
  const records=ownerReviews.records.filter(r=>r.role===page.role);
  if(records.length!==2)throw Error('RECORD_SCOPE_HOLD');
  const original=page.html;
  const legacyStart=original.indexOf('<script>'+lifecycleSource+'</script>');
  if(legacyStart<0)throw Error('LEGACY_CONTROLLER_NOT_FOUND');
  const legacyEnd=original.indexOf('</script>',legacyStart+('<script>'+lifecycleSource+'</script>').length);
  if(legacyEnd<0)throw Error('LEGACY_CONTROLLER_END_HOLD');
  const removed=original.slice(0,legacyStart)+original.slice(legacyEnd+9);
  const primary=records[0].request_id;
  if(!/^BENIN-[A-Z]+-[0-9]{3}$/.test(primary))throw Error('REQUEST_ID_HOLD');
  const controller='<script>(function(){'+
   'var area=document.getElementById("review-lifecycle"),select=document.getElementById("owow-outage-select");'+
   'var records='+JSON.stringify(records.map(r=>r.request_id))+';'+
   'function render(){area.replaceChildren();records.forEach(function(id,index){var article=document.createElement("article"),title=document.createElement("h3"),status=document.createElement("p");title.textContent=id;status.textContent=index===0?"NOT VERIFIED — local service required":"BLOCKED — no encrypted fixture for this record";article.append(title,status);'+
   '[["PREPARE","Prepare"],["REQUEST_REVISION","Request revision"],["RECORD_HOLD","Record HOLD"]].forEach(function(pair){var b=document.createElement("button");b.type="button";b.dataset.reviewAction=pair[0];b.textContent=pair[1];b.disabled=index!==0||["power","storage","all"].includes(select.value);b.addEventListener("click",async function(){if(b.disabled)return;var unsafe=["power","storage","all"].includes(select.value);if(unsafe){status.textContent="BLOCKED DEVICE_OUTAGE";return;}var token=window.__OWOW_TEST_TOKEN;if(typeof token!=="string"||!token){status.textContent="BLOCKED SESSION_REQUIRED";return;}var revision=Number.isSafeInteger(window.__OWOW_REVISION)?window.__OWOW_REVISION:0;b.disabled=true;status.textContent="PENDING — confirmation required";try{var response=await fetch("/synthetic/review",{method:"POST",headers:{"content-type":"application/json","x-owow-session":token},body:JSON.stringify({requestId:id,action:pair[0],reason:"Synthetic role review: "+pair[0],expectedRevision:revision})});var receipt=await response.json();if(!response.ok){status.textContent="BLOCKED "+response.status+" "+receipt.error;return;}if(receipt.requestId!==id||receipt.role!=='+JSON.stringify(page.role)+'||receipt.authority!==false||receipt.transaction!=="BLOCKED"||receipt.revision!==revision+1){status.textContent="PENDING VERIFICATION — receipt mismatch";return;}window.__OWOW_REVISION=receipt.revision;status.textContent="SAVED "+receipt.state+" revision "+receipt.revision+" · BLOCKED";}catch(e){status.textContent="PENDING VERIFICATION — connection interrupted";}finally{b.disabled=["power","storage","all"].includes(select.value);}});article.append(b);});area.append(article);});}'+
   'select.addEventListener("change",render);render();'+
   '})();</script>';
  const html=removed.replace('</body>',controller+'</body>');
  if(html.includes('window.OWOW_OWNER_LIFECYCLE')||html.includes('states[i]=api.transition'))throw Error('DUAL_STATE_CONTROLLER_HOLD');
  return {...page,filename:page.filename.replace('-outage-gated.html','-connected.html'),html,sha256:crypto.createHash('sha256').update(html).digest('hex')};
 });
}
if(require.main===module){
 const [receiptDir,marketFile,explanationsFile,ownerFile,outDir]=process.argv.slice(2);
 if(!receiptDir||!marketFile||!explanationsFile||!ownerFile||!outDir||fs.existsSync(outDir))throw Error('ARGS_OR_OVERWRITE_HOLD');
 const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),receipts={};
 for(const role of ['terry','osayuki'])receipts[role]=read(path.join(receiptDir,role+'-synthetic-contract-receipt.json'));
 const pages=buildConnected(receipts,read(marketFile),read(explanationsFile),read(ownerFile),fs.readFileSync(path.join(__dirname,'owow-contract-receipt-view.js'),'utf8'),fs.readFileSync(path.join(__dirname,'owow-owner-lifecycle.js'),'utf8'));
 fs.mkdirSync(outDir);for(const page of pages)fs.writeFileSync(path.join(outDir,page.filename),page.html,{flag:'wx'});
 console.log(JSON.stringify(pages.map(({role,filename,sha256})=>({role,filename,sha256}))));
}
module.exports={buildConnected};