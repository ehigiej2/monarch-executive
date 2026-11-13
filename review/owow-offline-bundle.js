'use strict';
/* Offline OWOW bundle builder. Only synthetic receipts; no network or runtime Python bridge. */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const generator=require('./owow-synthetic-profile-generator.js');
const view=require('./owow-contract-receipt-view.js');
function bundle(manifest, receipts, viewSource){
 const outputs=generator.generate(manifest);
 return outputs.map(({role,filename,html})=>{
  const receipt=receipts[role];
  view.validate(role,receipt);
  if(typeof viewSource!=='string'||!viewSource.includes('OWOW_RECEIPT_VIEW'))throw Error('VIEW_SOURCE_HOLD');
  if(viewSource.includes('</script'))throw Error('SCRIPT_BOUNDARY_HOLD');
  const payload=Buffer.from(JSON.stringify(receipt),'utf8').toString('base64');
  const injected='<section aria-label="Recovered Osayi contract receipt"><h2>Osayi contract verification</h2><p id="contract-receipt" role="status" aria-live="polite">Receipt not loaded. CROWN HOLD.</p></section>'+
   '<script>'+viewSource+'</script>'+
   '<script>(function(){var receipt=JSON.parse(atob("'+payload+'"));window.OWOW_RECEIPT_VIEW.display("'+role+'",receipt,document.getElementById("contract-receipt"));})();</script>';
  if(!html.includes('</main>'))throw Error('HTML_BOUNDARY_HOLD');
  const page=html.replace('</main>',injected+'</main>');
  return {role,filename:filename.replace('.html','-connected.html'),html:page,sha256:crypto.createHash('sha256').update(page).digest('hex')};
 });
}
function main(){
 const args=process.argv.slice(2);
 if(args.length!==2)throw Error('USAGE: node owow-offline-bundle.js RECEIPT_DIR NEW_OUTPUT_DIR');
 const [receiptDir,outDir]=args;
 if(fs.existsSync(outDir))throw Error('REFUSE_OVERWRITE');
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'owow-reusable-assembly-manifest-v1.json'),'utf8'));
 const receipts={};
 for(const role of ['terry','osayuki'])receipts[role]=JSON.parse(fs.readFileSync(path.join(receiptDir,role+'-synthetic-contract-receipt.json'),'utf8'));
 const files=bundle(manifest,receipts,fs.readFileSync(path.join(__dirname,'owow-contract-receipt-view.js'),'utf8'));
 fs.mkdirSync(outDir,{recursive:false});
 for(const f of files)fs.writeFileSync(path.join(outDir,f.filename),f.html,{flag:'wx'});
 process.stdout.write(JSON.stringify(files.map(({role,filename,sha256})=>({role,filename,sha256})))+'\n');
}
if(require.main===module)main();
module.exports={bundle};
