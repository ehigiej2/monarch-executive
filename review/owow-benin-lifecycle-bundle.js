'use strict';
/* Synthetic interactive lifecycle overlay; isolated in-memory and role-bound. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {render}=require('./owow-benin-owner-review-bundle.js');
function build(receipts,market,explanations,ownerReviews,viewSource,lifecycleSource){
 if(typeof lifecycleSource!=='string'||!lifecycleSource.includes('OWOW_OWNER_LIFECYCLE')||lifecycleSource.includes('</script'))throw Error('LIFECYCLE_SOURCE_HOLD');
 return render(receipts,market,explanations,ownerReviews,viewSource).map(page=>{
  const records=ownerReviews.records.filter(r=>r.role===page.role);
  if(records.length!==2)throw Error('ROLE_RECORD_HOLD');
  const encoded=Buffer.from(JSON.stringify(records),'utf8').toString('base64');
  const safeRole=page.role;
  const panel='<section aria-label="Interactive owner review"><h2>Controlled review (this session only)</h2><p>No persistence, no payment, no external action. Decision means HOLD only.</p><div id="review-lifecycle"></div></section>';
  const script='<script>'+lifecycleSource+'</script><script>(function(){'+
   'var role="'+safeRole+'",records=JSON.parse(atob("'+encoded+'")),api=window.OWOW_OWNER_LIFECYCLE,states=records.map(api.init),container=document.getElementById("review-lifecycle");'+
   'function paint(){container.replaceChildren();states.forEach(function(s,i){var article=document.createElement("article"),title=document.createElement("h3"),status=document.createElement("p");title.textContent=s.requestId;status.textContent="Status: "+s.state+" · revision "+s.revision+" · CROWN HOLD";article.append(title,status);'+
   '[["PREPARE","Prepare"],["REQUEST_REVISION","Request revision"],["RECORD_HOLD","Record HOLD"]].forEach(function(pair){var button=document.createElement("button");button.type="button";button.textContent=pair[1];button.dataset.reviewAction=pair[0];button.dataset.reviewIndex=String(i);button.addEventListener("click",function(){try{states[i]=api.transition(states[i],pair[0],role,"Synthetic owner review: "+pair[1]);paint();}catch(e){status.textContent="HOLD — action not permitted. "+s.state;}});article.append(button);});container.append(article);});}paint();})();</script>';
  const html=page.html.replace('</main>',panel+'</main>').replace('</body>',script+'</body>');
  return {...page,filename:page.filename.replace('-owner-review.html','-lifecycle.html'),html,sha256:crypto.createHash('sha256').update(html).digest('hex')};
 });
}
if(require.main===module){
 const [receiptDir,marketFile,explanationsFile,ownerFile,outDir]=process.argv.slice(2);
 if(!receiptDir||!marketFile||!explanationsFile||!ownerFile||!outDir||fs.existsSync(outDir))throw Error('ARGS_OR_OVERWRITE_HOLD');
 const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
 const receipts={};for(const role of ['terry','osayuki'])receipts[role]=read(path.join(receiptDir,role+'-synthetic-contract-receipt.json'));
 const outputs=build(receipts,read(marketFile),read(explanationsFile),read(ownerFile),fs.readFileSync(path.join(__dirname,'owow-contract-receipt-view.js'),'utf8'),fs.readFileSync(path.join(__dirname,'owow-owner-lifecycle.js'),'utf8'));
 fs.mkdirSync(outDir);for(const o of outputs)fs.writeFileSync(path.join(outDir,o.filename),o.html,{flag:'wx'});
 console.log(JSON.stringify(outputs.map(({role,filename,sha256})=>({role,filename,sha256}))));
}
module.exports={build};