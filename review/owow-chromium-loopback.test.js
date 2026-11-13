'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),crypto=require('node:crypto');
const puppeteer=require('/home/ehigiej2/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer');
const {createTestBridge}=require('./owow-browser-test-bridge.js');
const j=require('./owow-durable-review-journal.js');
const {DEPENDENCIES}=require('./owow-chaos-resilience.js');
const now=900000,chrome='/home/ehigiej2/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome';
test('real Chromium submits synthetic review through loopback and rejects replay',async()=>{
 const directory=fs.mkdtempSync(os.tmpdir()+'/owow-chromium-');fs.chmodSync(directory,0o700);
 const key=crypto.randomBytes(32),record={schema:'BENIN-OWNER-REVIEW-001',role:'terry',authority:false,crown:'HOLD',transaction:'BLOCKED',external_contact:'BLOCKED',decision:'OWNER_REVIEW_REQUIRED',real_customer_data:false,human_review_required:true,request_id:'BENIN-TRADER-001',sha256:'a'.repeat(64)};
 const initial=j.init(record);j.durableStore(directory,initial,key,-1);
 const health=Object.fromEntries(DEPENDENCIES.map(x=>[x,{state:'HEALTHY',checkedAt:now}]));
 const net=require('node:net');const reserve=net.createServer();await new Promise(r=>reserve.listen(0,'127.0.0.1',r));const port=reserve.address().port;await new Promise(r=>reserve.close(r));const origin='http://127.0.0.1:'+port;
 const bridge=createTestBridge({session:{provenance:'HOST_BOUND_TEST_SESSION',synthetic:true,authority:false,role:'terry',key},services:{directory,health,now},origin});
 let browser;
 try{
  const addr=await new Promise((resolve,reject)=>{bridge.server.once('error',reject);bridge.server.listen(port,'127.0.0.1',()=>resolve(bridge.server.address()))});browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:'+addr.port+'/synthetic/review');
  const result=await page.evaluate(async({token})=>{
   const req={requestId:'BENIN-TRADER-001',action:'PREPARE',reason:'Prepare synthetic review',expectedRevision:0};
   async function send(){const r=await fetch('/synthetic/review',{method:'POST',headers:{'content-type':'application/json','x-owow-session':token},body:JSON.stringify(req)});return {status:r.status,data:await r.json()}}
   return {first:await send(),second:await send()}
  },{token:bridge.token});
  assert.equal(result.first.status,200);
  assert.equal(result.first.data.transaction,'BLOCKED');
  assert.equal(result.second.status,409);
  assert.equal(j.durableLoad(directory,'BENIN-TRADER-001',key).revision,1);
  console.log('CHROMIUM_LOOPBACK_COMMIT_PASS');
 }finally{if(browser)await browser.close();await bridge.close();fs.rmSync(directory,{recursive:true,force:true})}
});