'use strict';
/* Browser-side review receipt attachment. Only prepared synthetic records. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {attach}=require('./owow-benin-explained-bundle.js');
function render(receipts,market,explanations,ownerReviews,viewSource){
 if(!ownerReviews||ownerReviews.schema!=='BENIN-OWNER-REVIEW-SET-001'||ownerReviews.authority!==false||ownerReviews.live_data!==false||!Array.isArray(ownerReviews.records)||ownerReviews.records.length!==4)throw Error('OWNER_SET_HOLD');
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const ids=new Set();
 for(const r of ownerReviews.records){
  if(!r||ids.has(r.request_id)||r.schema!=='BENIN-OWNER-REVIEW-001'||r.authority!==false||r.crown!=='HOLD'||r.transaction!=='BLOCKED'||r.external_contact!=='BLOCKED'||r.real_customer_data!==false||r.human_review_required!==true||r.decision!=='OWNER_REVIEW_REQUIRED'||!Array.isArray(r.missing_evidence)||r.missing_evidence.length!==6||!Array.isArray(r.stages)||r.stages.length!==5||!/^([a-f0-9]{64})$/.test(r.sha256))throw Error('OWNER_RECORD_HOLD');
  ids.add(r.request_id);
  const m=market.records.find(x=>x.id===r.request_id);
  if(!m||m.role!==r.role||m.net_contribution_ngn!==r.calculation?.net_contribution_ngn)throw Error('OWNER_MARKET_MISMATCH');
 }
 return attach(receipts,market,explanations,viewSource).map(page=>{
  const rows=ownerReviews.records.filter(r=>r.role===page.role);
  if(rows.length!==2)throw Error('OWNER_ROLE_HOLD');
  const panel='<section aria-label="Owner review queue"><h2>Owner review queue</h2><p>All requests require evidence and human approval. No transaction possible.</p>'+rows.map(r=>'<article><h3>'+escape(r.request_id)+'</h3><p>Prepared only · '+escape(r.decision)+'</p><p>Missing evidence: '+escape(r.missing_evidence.join(', '))+'</p><small>Review fingerprint: '+escape(r.sha256)+'</small></article>').join('')+'</section>';
  const html=page.html.replace('</main>',panel+'</main>');
  return {...page,filename:page.filename.replace('-explained.html','-owner-review.html'),html,sha256:crypto.createHash('sha256').update(html).digest('hex')};
 });
}
if(require.main===module){
 const [receiptDir,marketFile,explanationsFile,ownerFile,outDir]=process.argv.slice(2);
 if(!receiptDir||!marketFile||!explanationsFile||!ownerFile||!outDir||fs.existsSync(outDir))throw Error('ARGS_OR_OVERWRITE_HOLD');
 const receipts={};for(const role of ['terry','osayuki'])receipts[role]=JSON.parse(fs.readFileSync(path.join(receiptDir,role+'-synthetic-contract-receipt.json'),'utf8'));
 const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
 const output=render(receipts,read(marketFile),read(explanationsFile),read(ownerFile),fs.readFileSync(path.join(__dirname,'owow-contract-receipt-view.js'),'utf8'));
 fs.mkdirSync(outDir);
 for(const x of output)fs.writeFileSync(path.join(outDir,x.filename),x.html,{flag:'wx'});
 console.log(JSON.stringify(output.map(({role,filename,sha256})=>({role,filename,sha256}))));
}
module.exports={render};