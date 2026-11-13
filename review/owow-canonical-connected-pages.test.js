'use strict';
/* Real Chromium role-page review controls routed to the encrypted loopback service.
 * Synthetic-only fixture; non-bound controls fail closed. No production authentication. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),crypto=require('node:crypto');
const puppeteer=require('/home/ehigiej2/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const {createServer}=require('./owow-loopback-review-service.js');
const journal=require('./owow-durable-review-journal.js');
const {DEPENDENCIES}=require('./owow-chaos-resilience.js');
const now=900000,chrome='/home/ehigiej2/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome';
const pages='/tmp/owow-benin-connected-pages-20261113-01';
const record=role=>({schema:'BENIN-OWNER-REVIEW-001',role,authority:false,crown:'HOLD',transaction:'BLOCKED',external_contact:'BLOCKED',decision:'OWNER_REVIEW_REQUIRED',real_customer_data:false,human_review_required:true,request_id:role==='terry'?'BENIN-TRADER-001':'BENIN-HAUL-003',sha256:'a'.repeat(64)});
function html(role){return fs.readFileSync(pages+'/owow-'+role+'-synthetic-review-connected.html','utf8');}
async function fixture(role,fn){
 const directory=fs.mkdtempSync(os.tmpdir()+'/owow-connected-controls-');fs.chmodSync(directory,0o700);
 const key=crypto.randomBytes(32),initial=journal.init(record(role));journal.durableStore(directory,initial,key,-1);
 const health=Object.fromEntries(DEPENDENCIES.map(x=>[x,{state:'HEALTHY',checkedAt:now}]));
 const token=crypto.randomBytes(32).toString('hex'),sessions=new Map([[token,{provenance:'HOST_BOUND_TEST_SESSION',synthetic:true,authority:false,role,key}]]);
 let server,browser;
 try{
  const net=require('node:net'),probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
  const origin='http://127.0.0.1:'+port;server=createServer({sessions,services:{directory,health,now},origin});
  const handler=server.listeners('request')[0];server.removeAllListeners('request');
  server.on('request',(req,res)=>{if(req.method==='GET'&&req.url==='/review'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'"});res.end(html(role));return;}handler(req,res)});
  await new Promise((r,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',r)});
  browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/review');await page.evaluate(t=>window.__OWOW_TEST_TOKEN=t,token);
  await fn({page,directory,key,initial,health,errors});
 }finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));fs.rmSync(directory,{recursive:true,force:true})}
}
const selector=action=>'#review-lifecycle article:first-child button[data-review-action="'+action+'"]';
const status=page=>page.$eval('#review-lifecycle article:first-child p',e=>e.textContent);
test('Terry and Osayuki original review buttons commit encrypted lifecycle',async()=>{
 for(const role of ['terry','osayuki'])await fixture(role,async x=>{
  assert.equal((await x.page.$$('button[data-workflow]')).length,6);
  assert.equal((await x.page.$$('#review-lifecycle article')).length,2);
  for(const [action,state,rev] of [['PREPARE','PREPARED_FOR_REVIEW',1],['REQUEST_REVISION','REVISION_REQUESTED',2],['PREPARE','PREPARED_FOR_REVIEW',3],['RECORD_HOLD','DECISION_RECORDED',4]]){
   await x.page.click(selector(action));
   await x.page.waitForFunction(n=>document.querySelector('#review-lifecycle article:first-child p').textContent.includes('revision '+n),{},rev);
   assert.match(await status(x.page),new RegExp('SAVED '+state));
   assert.equal(journal.durableLoad(x.directory,x.initial.requestId,x.key).revision,rev);
  }
  await x.page.click(selector('PREPARE'));
  await x.page.waitForFunction(()=>document.querySelector('#review-lifecycle article:first-child p').textContent.includes('BLOCKED 409'));
  assert.equal(journal.durableLoad(x.directory,x.initial.requestId,x.key).revision,4);
  assert.deepEqual(x.errors,[]);
  console.log(role.toUpperCase()+'_ORIGINAL_BUTTONS_ENCRYPTED_PASS');
 });
});
test('browser token forgery cannot create a saved state',async()=>fixture('terry',async x=>{
 await x.page.evaluate(()=>window.__OWOW_TEST_TOKEN='forged');await x.page.click(selector('PREPARE'));
 await x.page.waitForFunction(()=>document.querySelector('#review-lifecycle article:first-child p').textContent.includes('BLOCKED 401'));
 assert.equal(journal.durableLoad(x.directory,x.initial.requestId,x.key).revision,0);
}));
test('simulated device outage disables original controls',async()=>fixture('terry',async x=>{
 await x.page.select('#owow-outage-select','storage');
 assert.equal(await x.page.$eval(selector('PREPARE'),e=>e.disabled),true);
 assert.equal(journal.durableLoad(x.directory,x.initial.requestId,x.key).revision,0);
}));