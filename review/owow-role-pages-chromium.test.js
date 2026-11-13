'use strict';
/* Test-only integration of EXISTING Terry and Osayuki generated pages.
 * No production login, no deployed service, no browser-held encryption keys.
 */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),crypto=require('node:crypto');
const puppeteer=require('/home/ehigiej2/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const {createServer}=require('./owow-loopback-review-service.js');
const j=require('./owow-durable-review-journal.js');
const {DEPENDENCIES}=require('./owow-chaos-resilience.js');
const now=900000,chrome='/home/ehigiej2/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome';
const PAGE_DIR='/tmp/owow-benin-outage-gated-pages-20261113-01';
const record=role=>({schema:'BENIN-OWNER-REVIEW-001',role,authority:false,crown:'HOLD',transaction:'BLOCKED',external_contact:'BLOCKED',decision:'OWNER_REVIEW_REQUIRED',real_customer_data:false,human_review_required:true,request_id:role==='terry'?'BENIN-TRADER-001':'BENIN-HAUL-003',sha256:'a'.repeat(64)});
function html(role){
 const filename=PAGE_DIR+'/owow-'+role+'-synthetic-review-outage-gated.html';
 const source=fs.readFileSync(filename,'utf8');
 const widget='<section id="owow-connected" aria-label="Connected synthetic review"><h2>Connected encrypted review — TEST ONLY</h2><button type="button" id="owow-submit-review">Prepare encrypted review</button><p role="status" id="owow-connected-status">Not submitted</p></section>';
 const code='<script>(function(){var b=document.getElementById("owow-submit-review"),s=document.getElementById("owow-connected-status");b.addEventListener("click",async function(){b.disabled=true;s.textContent="Submitting to local encrypted journal";try{var r=await fetch("/synthetic/review",{method:"POST",headers:{"content-type":"application/json","x-owow-session":window.__OWOW_TEST_TOKEN||""},body:JSON.stringify({requestId:"'+(role==='terry'?'BENIN-TRADER-001':'BENIN-HAUL-003')+'",action:"PREPARE",reason:"Prepared from role review interface",expectedRevision:0})});var data=await r.json();s.textContent=r.ok?"COMMITTED "+data.state+" revision "+data.revision+" · "+data.transaction:"HOLD "+r.status+" "+data.error;}catch(e){s.textContent="HOLD CONNECTION_UNAVAILABLE";}finally{b.disabled=false}})})();</script>';
 return source.replace('</main>',widget+'</main>').replace('</body>',code+'</body>');
}
async function fixture(role,fn){
 const directory=fs.mkdtempSync(os.tmpdir()+'/owow-role-page-');fs.chmodSync(directory,0o700);
 const key=crypto.randomBytes(32),initial=j.init(record(role));j.durableStore(directory,initial,key,-1);
 const health=Object.fromEntries(DEPENDENCIES.map(x=>[x,{state:'HEALTHY',checkedAt:now}]));
 const token=crypto.randomBytes(32).toString('hex'),session={provenance:'HOST_BOUND_TEST_SESSION',synthetic:true,authority:false,role,key};
 const sessions=new Map([[token,session]]);let server,browser;
 try{
  const net=require('node:net'),probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
  const origin='http://127.0.0.1:'+port;server=createServer({sessions,services:{directory,health,now},origin});
  const reviewListener=server.listeners('request')[0];server.removeAllListeners('request');
  server.on('request',(req,res)=>{
   if(req.method==='GET'&&req.url==='/review'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'"});res.end(html(role));return}
   reviewListener(req,res);
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve)});
  browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/review');await page.evaluate(t=>{window.__OWOW_TEST_TOKEN=t},token);
  await fn({page,directory,key,initial,health,errors,origin});
 }finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));fs.rmSync(directory,{recursive:true,force:true})}
}
test('real Terry and Osayuki pages commit through encrypted service and reject replay',async()=>{
 for(const role of ['terry','osayuki'])await fixture(role,async x=>{
  assert.equal((await x.page.$$('button[data-workflow]')).length,6);
  assert.equal((await x.page.$$('#review-lifecycle article')).length,2);
  await x.page.click('#owow-submit-review');
  await x.page.waitForFunction(()=>document.querySelector('#owow-connected-status').textContent.includes('COMMITTED'));
  assert.match(await x.page.$eval('#owow-connected-status',e=>e.textContent),/COMMITTED PREPARED_FOR_REVIEW revision 1 · BLOCKED/);
  assert.equal(j.durableLoad(x.directory,x.initial.requestId,x.key).revision,1);
  await x.page.click('#owow-submit-review');
  await x.page.waitForFunction(()=>document.querySelector('#owow-connected-status').textContent.includes('HOLD 409'));
  assert.equal(j.durableLoad(x.directory,x.initial.requestId,x.key).revision,1);
  assert.deepEqual(x.errors,[]);
  console.log(role.toUpperCase()+'_ROLE_PAGE_COMMIT_AND_REPLAY_PASS');
 });
});
test('real role page rejects forged test token without changing encrypted state',async()=>fixture('terry',async x=>{
 await x.page.evaluate(()=>{window.__OWOW_TEST_TOKEN='forged'});
 await x.page.click('#owow-submit-review');
 await x.page.waitForFunction(()=>document.querySelector('#owow-connected-status').textContent.includes('HOLD 401'));
 assert.equal(j.durableLoad(x.directory,x.initial.requestId,x.key).revision,0);
}));