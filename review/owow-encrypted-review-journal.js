'use strict';
/* Isolated Node-only encrypted synthetic review journal. NOT browser storage or production authentication. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {init,transition}=require('./owow-owner-lifecycle.js');
const STATES=new Set(['DRAFT','PREPARED_FOR_REVIEW','REVISION_REQUESTED','DECISION_RECORDED']);
function check(snapshot){
 if(!snapshot||!['terry','osayuki'].includes(snapshot.role)||snapshot.authority!==false||snapshot.transaction!=='BLOCKED'||!STATES.has(snapshot.state)||!Number.isSafeInteger(snapshot.revision)||snapshot.revision<0||snapshot.revision>20||!Array.isArray(snapshot.history)||snapshot.history.length!==snapshot.revision||!/^BENIN-[A-Z]+-[0-9]{3}$/.test(snapshot.requestId)||!/^[a-f0-9]{64}$/.test(snapshot.sourceFingerprint))throw Error('SNAPSHOT_HOLD');
 let state='DRAFT';
 for(let i=0;i<snapshot.history.length;i++){
  const e=snapshot.history[i];
  if(!e||e.sequence!==i+1||e.from!==state||e.actor!==snapshot.role||e.authority!==false||e.transaction!=='BLOCKED'||typeof e.reason!=='string'||e.reason.length<5||e.reason.length>180)throw Error('HISTORY_HOLD');
  const expected=e.action==='PREPARE'&&['DRAFT','REVISION_REQUESTED'].includes(state)?'PREPARED_FOR_REVIEW':e.action==='REQUEST_REVISION'&&state==='PREPARED_FOR_REVIEW'?'REVISION_REQUESTED':e.action==='RECORD_HOLD'&&state==='PREPARED_FOR_REVIEW'?'DECISION_RECORDED':null;
  if(e.to!==expected||!expected)throw Error('REPLAY_HOLD');
  state=expected;
 }
 if(state!==snapshot.state)throw Error('STATE_HOLD');
 return snapshot;
}
function seal(snapshot,key){
 check(snapshot);
 if(!Buffer.isBuffer(key)||key.length!==32)throw Error('KEY_HOLD');
 const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
 cipher.setAAD(Buffer.from('OWOW-BENIN-REVIEW-V1'));
 const ciphertext=Buffer.concat([cipher.update(JSON.stringify(snapshot),'utf8'),cipher.final()]);
 return JSON.stringify({schema:'OWOW-BENIN-SEALED-V1',iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:ciphertext.toString('base64')});
}
function unseal(blob,key){
 if(!Buffer.isBuffer(key)||key.length!==32)throw Error('KEY_HOLD');
 let x;try{x=JSON.parse(blob)}catch{throw Error('ENVELOPE_HOLD')}
 if(!x||x.schema!=='OWOW-BENIN-SEALED-V1'||typeof x.iv!=='string'||typeof x.tag!=='string'||typeof x.data!=='string'||Buffer.from(x.iv,'base64').length!==12||Buffer.from(x.tag,'base64').length!==16)throw Error('ENVELOPE_HOLD');
 try{
  const decipher=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(x.iv,'base64'));
  decipher.setAAD(Buffer.from('OWOW-BENIN-REVIEW-V1'));decipher.setAuthTag(Buffer.from(x.tag,'base64'));
  const raw=Buffer.concat([decipher.update(Buffer.from(x.data,'base64')),decipher.final()]).toString('utf8');
  return check(JSON.parse(raw));
 }catch{throw Error('TAMPER_OR_KEY_HOLD')}
}
function store(directory,snapshot,key,expectedRevision){
 check(snapshot);
 if(!Number.isSafeInteger(expectedRevision)||expectedRevision< -1)throw Error('REVISION_HOLD');
 if(!fs.existsSync(directory)||!fs.statSync(directory).isDirectory())throw Error('DIRECTORY_HOLD');
 const file=path.join(directory,snapshot.requestId+'.sealed.json'),lock=file+'.lock';
 let fd;
 try{fd=fs.openSync(lock,'wx',0o600)}catch{throw Error('CONCURRENT_WRITE_HOLD')}
 try{
  const exists=fs.existsSync(file);
  if(expectedRevision===-1&&exists)throw Error('DUPLICATE_HOLD');
  if(expectedRevision!==-1){
   if(!exists)throw Error('MISSING_PRIOR_HOLD');
   const old=unseal(fs.readFileSync(file,'utf8'),key);
   if(old.revision!==expectedRevision||old.requestId!==snapshot.requestId||old.role!==snapshot.role||old.sourceFingerprint!==snapshot.sourceFingerprint||snapshot.revision!==old.revision+1)throw Error('STALE_OR_SCOPE_HOLD');
   const event=snapshot.history.at(-1);
   const next=transition(old,event.action,event.actor,event.reason);
   if(JSON.stringify(next)!==JSON.stringify(snapshot))throw Error('REPLAY_MISMATCH_HOLD');
  }else if(snapshot.revision!==0)throw Error('INITIAL_REVISION_HOLD');
  const temp=file+'.'+crypto.randomBytes(8).toString('hex')+'.tmp';
  try{fs.writeFileSync(temp,seal(snapshot,key),{flag:'wx',mode:0o600});fs.renameSync(temp,file)}finally{if(fs.existsSync(temp))fs.unlinkSync(temp)}
  return {requestId:snapshot.requestId,revision:snapshot.revision,encrypted:true,authority:false};
 }finally{fs.closeSync(fd);fs.unlinkSync(lock)}
}
function load(directory,requestId,key){
 if(!/^BENIN-[A-Z]+-[0-9]{3}$/.test(requestId))throw Error('ID_HOLD');
 return unseal(fs.readFileSync(path.join(directory,requestId+'.sealed.json'),'utf8'),key);
}
module.exports={check,seal,unseal,store,load,init,transition};