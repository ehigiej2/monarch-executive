'use strict';
/* OWOW durability wrapper: isolated synthetic-only local journal, fail-closed.
 * Does not manage or persist encryption keys. Never clears abandoned locks automatically.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const base=require('./owow-encrypted-review-journal.js');
function directoryCheck(directory){
 if(typeof directory!=='string'||!path.isAbsolute(directory))throw Error('ABSOLUTE_DIRECTORY_REQUIRED');
 const stat=fs.lstatSync(directory);
 if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('DIRECTORY_SCOPE_HOLD');
 const mode=stat.mode&0o777;
 if(mode&0o077)throw Error('DIRECTORY_PERMISSION_HOLD');
 return directory;
}
function durableStore(directory,snapshot,key,expectedRevision){
 directoryCheck(directory);
 base.check(snapshot);
 if(!Buffer.isBuffer(key)||key.length!==32)throw Error('KEY_HOLD');
 const file=path.join(directory,snapshot.requestId+'.sealed.json'),lock=file+'.lock';
 const lockFd=(()=>{try{return fs.openSync(lock,'wx',0o600)}catch{throw Error('CONCURRENT_WRITE_HOLD')}})();
 let temp=null;
 try{
  const exists=fs.existsSync(file);
  if(expectedRevision===-1){
   if(exists)throw Error('DUPLICATE_HOLD');
   if(snapshot.revision!==0)throw Error('INITIAL_REVISION_HOLD');
  }else{
   if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0||!exists)throw Error('MISSING_PRIOR_HOLD');
   const old=base.load(directory,snapshot.requestId,key);
   if(old.revision!==expectedRevision||old.role!==snapshot.role||old.sourceFingerprint!==snapshot.sourceFingerprint||snapshot.revision!==old.revision+1)throw Error('STALE_OR_SCOPE_HOLD');
   const event=snapshot.history.at(-1);
   const replay=base.transition(old,event.action,event.actor,event.reason);
   if(JSON.stringify(replay)!==JSON.stringify(snapshot))throw Error('REPLAY_MISMATCH_HOLD');
  }
  temp=file+'.'+crypto.randomBytes(12).toString('hex')+'.tmp';
  const fd=fs.openSync(temp,'wx',0o600);
  try{
   fs.writeFileSync(fd,base.seal(snapshot,key),'utf8');
   fs.fsyncSync(fd);
  }finally{fs.closeSync(fd)}
  fs.renameSync(temp,file);
  temp=null;
  const dirFd=fs.openSync(directory,'r');
  try{fs.fsyncSync(dirFd)}finally{fs.closeSync(dirFd)}
  return {requestId:snapshot.requestId,revision:snapshot.revision,authority:false,durableSyncAttempted:true};
 }finally{
  if(temp&&fs.existsSync(temp))fs.unlinkSync(temp);
  fs.closeSync(lockFd);
  fs.unlinkSync(lock);
 }
}
function durableLoad(directory,requestId,key){
 directoryCheck(directory);
 return base.load(directory,requestId,key);
}
module.exports={durableStore,durableLoad,directoryCheck,init:base.init,transition:base.transition};