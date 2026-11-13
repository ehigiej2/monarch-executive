'use strict';
/* Synthetic-only loopback test server. No production identity, no external network. */
const http=require('node:http');
const {boundary}=require('./owow-local-review-boundary.js');
const MAX_BYTES=2048;
function createServer({sessions,services,origin='http://127.0.0.1:3997'}){
 if(!(sessions instanceof Map)||!services||typeof services.directory!=='string'||!/^http:\/\/127\.0\.0\.1:[0-9]{2,5}$/.test(origin))throw Error('SERVER_CONFIG_HOLD');
 return http.createServer((req,res)=>{
  const deny=(status,reason)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify({error:reason,authority:false}))};
  if(req.socket.remoteAddress!=='127.0.0.1'&&req.socket.remoteAddress!=='::ffff:127.0.0.1')return deny(403,'LOOPBACK_ONLY');
  if(req.headers.origin!==origin)return deny(403,'ORIGIN_HOLD');
  if(req.method!=='POST'||req.url!=='/synthetic/review')return deny(404,'ROUTE_HOLD');
  if(req.headers['content-type']!=='application/json')return deny(415,'CONTENT_TYPE_HOLD');
  const length=Number(req.headers['content-length']);
  if(!Number.isSafeInteger(length)||length<2||length>MAX_BYTES)return deny(413,'SIZE_HOLD');
  const token=req.headers['x-owow-session'];
  if(typeof token!=='string'||!sessions.has(token))return deny(401,'SESSION_HOLD');
  const session=sessions.get(token);
  if(!session||session.provenance!=='HOST_BOUND_TEST_SESSION')return deny(401,'SESSION_HOLD');
  let size=0,chunks=[],finished=false;
  req.on('data',chunk=>{size+=chunk.length;if(size>MAX_BYTES){finished=true;req.destroy();return}chunks.push(chunk)});
  req.on('end',()=>{
   if(finished||size!==length)return deny(400,'BODY_LENGTH_HOLD');
   let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{return deny(400,'JSON_HOLD')}
   try{const result=boundary({trustedSession:session,request:body,services});res.writeHead(200,{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(result))}
   catch{return deny(409,'REVIEW_HOLD')}
  });
 });
}
function listenLoopback(server){return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address()))})}
module.exports={createServer,listenLoopback,MAX_BYTES};