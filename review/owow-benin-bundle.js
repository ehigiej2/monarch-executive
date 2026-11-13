'use strict';
/* Build-time Benin synthetic opportunity overlay. No network, no authority. */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {bundle}=require('./owow-offline-bundle.js');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'owow-reusable-assembly-manifest-v1.json'),'utf8'));
function assemble(receipts,market,viewSource){
 if(!market||market.schema!=='BENIN-COMMERCIAL-SYNTHETIC-001'||market.live_data!==false||market.authority!==false||!Array.isArray(market.records)||market.records.length!==4)throw Error('MARKET_SCOPE_HOLD');
 const seen=new Set();
 for(const r of market.records){
  if(!r||typeof r.id!=='string'||seen.has(r.id)||!['terry','osayuki'].includes(r.role)||r.source!=='SYNTHETIC_FIXTURE'||r.authority!==false||r.market_price_verified!==false||r.transaction!=='BLOCKED'||r.crown!=='HOLD'||r.human_review_required!==true||!['REVIEW_ONLY','NEGATIVE_MARGIN_REVIEW'].includes(r.decision)||!/^[-]?[0-9]+(?:\.[0-9]+)?$/.test(r.net_contribution_ngn))throw Error('MARKET_RECORD_HOLD');
  seen.add(r.id);
 }
 return bundle(manifest,receipts,viewSource).map(page=>{
  const records=market.records.filter(r=>r.role===page.role);
  if(records.length!==2)throw Error('ROLE_MARKET_HOLD');
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
  const items=records.map(r=>'<li><strong>'+esc(r.area)+'</strong> · '+esc(r.sector)+' · synthetic contribution ₦'+esc(r.net_contribution_ngn)+' · '+esc(r.decision)+'</li>').join('');
  const panel='<section aria-label="Benin synthetic opportunities"><h2>Benin City opportunity review</h2><p>Illustrative amounts only. Not market prices, earnings forecasts or transaction approval.</p><ul>'+items+'</ul><p>CROWN HOLD · All transactions blocked · Human review required.</p></section>';
  const html=page.html.replace('</main>',panel+'</main>');
  return {...page,filename:page.filename.replace('-connected.html','-benin-connected.html'),html,sha256:crypto.createHash('sha256').update(html).digest('hex')};
 });
}
if(require.main===module){
 const [receiptDir,marketFile,outDir]=process.argv.slice(2);
 if(!receiptDir||!marketFile||!outDir)throw Error('USAGE: node owow-benin-bundle.js RECEIPT_DIR MARKET_JSON NEW_OUTPUT_DIR');
 if(fs.existsSync(outDir))throw Error('REFUSE_OVERWRITE');
 const receipts={};for(const role of ['terry','osayuki'])receipts[role]=JSON.parse(fs.readFileSync(path.join(receiptDir,role+'-synthetic-contract-receipt.json'),'utf8'));
 const market=JSON.parse(fs.readFileSync(marketFile,'utf8'));
 const files=assemble(receipts,market,fs.readFileSync(path.join(__dirname,'owow-contract-receipt-view.js'),'utf8'));
 fs.mkdirSync(outDir);
 for(const f of files)fs.writeFileSync(path.join(outDir,f.filename),f.html,{flag:'wx'});
 console.log(JSON.stringify(files.map(({role,filename,sha256})=>({role,filename,sha256}))));
}
module.exports={assemble};