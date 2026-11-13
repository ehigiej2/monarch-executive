'use strict';
/* Test-only browser-to-loopback bridge. Session token never embedded in HTML.
 * Browser receives a transient test token from the harness, NOT production authentication.
 */
const {createServer,listenLoopback}=require('./owow-loopback-review-service.js');
const http=require('node:http');
const {randomBytes}=require('node:crypto');
function createTestBridge({session,services,origin}){
 if(!session||session.provenance!=='HOST_BOUND_TEST_SESSION'||session.synthetic!==true||session.authority!==false)throw Error('TEST_SESSION_HOLD');
 const token=randomBytes(32).toString('hex');
 const sessions=new Map([[token,session]]);
 const server=createServer({sessions,services,origin});
 return Object.freeze({server,token,listen:()=>listenLoopback(server),close:()=>new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()))});
}
module.exports={createTestBridge};