'use strict';
/* Build-time text-only explanation attachment; all authority remains HOLD. */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {assemble}=require('./owow-benin-bundle.js');
function attach(receipts,market,explanations,viewSource){
 if(!explanations||explanations.schema!=='BENIN-EXPLANATIONS-SYNTHETIC-001'||explanations.authority!==false||!Array.isArray(explanations.records)||explanations.records.length!==4)throw Error('EXPLANATION_SET_HOLD');
 const seen=new Set();
 for(const r of explanations.records){
  if(!r||typeof r.id!=='string'||seen.has(r.id)||!['terry','osayuki'].includes(r.role)||r.source!=='SYNTHETIC_FIXTURE'||r.authority!==false||r.transaction!=='BLOCKED'||r.human_review_required!==true||typeof r.text!=='string'||r.text.length>500||!r.text.includes('CROWN HOLD')||!r.text.includes('No be verified market price'))throw Error('EXPLANATION_RECORD_HOLD');
  seen.add(r.id);
 }
 const marketIds=new Set(market.records.map(r=>r.id));
 if(seen.size!==marketIds.size||[...seen].some(id=>!marketIds.has(id)))throw Error('EXPLANATION_MARKET_MISMATCH');
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return assemble(receipts,market,viewSource).map(page=>{
  const rows=explanations.records.filter(r=>r.role===page.role);
  if(rows.length!==2||rows.some(r=>market.records.find(m=>m.id===r.id)?.role!==page.role))throw Error('EXPLANATION_ROLE_HOLD');
  const panel='<section aria-label="Osayi deterministic explanations"><h2>Osayi: wetin the figures mean</h2><p>Deterministic synthetic explanations, not live AI conversation.</p>'+rows.map(r=>'<p data-scenario="'+esc(r.id)+'">'+esc(r.text)+'</p>').join('')+'</section>';
  const html=page.html.replace('</main>',panel+'</main>');
  return {...page,filename:page.filename.replace('-benin-connected.html','-explained.html'),html,sha256:crypto.createHash('sha256').update(html).digest('hex')};
 });
}
if(require.main===module){
 const [receiptDir,marketFile,explanationFile,outDir]=process.argv.slice(2);
 if(!receiptDir||!marketFile||!explanationFile||!outDir)throw Error('USAGE: node owow-benin-explained-bundle.js RECEIPTS MARKET EXPLANATIONS NEW_DIR');
 if(fs.existsSync(outDir))throw Error('REFUSE_OVERWRITE');
 const receipts={};for(const role of ['terry','osayuki'])receipts[role]=JSON.parse(fs.readFileSync(path.join(receiptDir,role+'-synthetic-contract-receipt.json'),'utf8'));
 const market=JSON.parse(fs.readFileSync(marketFile,'utf8'));
 const explanations=JSON.parse(fs.readFileSync(explanationFile,'utf8'));
 const outputs=attach(receipts,market,explanations,fs.readFileSync(path.join(__dirname,'owow-contract-receipt-view.js'),'utf8'));
 fs.mkdirSync(outDir);
 for(const x of outputs)fs.writeFileSync(path.join(outDir,x.filename),x.html,{flag:'wx'});
 console.log(JSON.stringify(outputs.map(({role,filename,sha256})=>({role,filename,sha256}))));
}
module.exports={attach};