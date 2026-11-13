/* Run: node tests/gcl-owow-regression.test.js
 * Synthetic review harness. Does NOT replace real browser/mobile or security testing.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'monarch-owow-three-interface-review-20261113.html'),'utf8');
const adapter=require(path.join(root,'review/gcl-synthetic-evidence-adapter.js'));
const inline=html.match(/<script>\s*([\s\S]*?)<\/script>/);
assert.ok(inline,'Inline application script exists');
assert.ok(html.indexOf('src="review/gcl-synthetic-evidence-adapter.js"')<html.indexOf('<script>'),'Adapter must load first');
class Element{
 constructor(){this.value='';this.textContent='';this.children=[];this.handlers={};this.classList={set:new Set(),add:x=>this.classList.set.add(x),remove:x=>this.classList.set.delete(x),contains:x=>this.classList.set.has(x)};}
 addEventListener(k,fn){this.handlers[k]=fn;}
 replaceChildren(...items){this.children=items;}
 append(item){this.children.push(item);}
 click(){(this.handlers.click||this.onclick||(()=>{}))();}
}
const ids=['role','language','heading','tiles','reviewDrafts','openEvidence','evidence','evidenceRecords','evidenceBack','editor','records','profit','subflows','subflowTitle','subflowButtons','subflowBack','status','category','details','area','requestForm','cancel','back','profitBack','recordList','revenue','cost','calculate','profitResult'];
const el=Object.fromEntries(ids.map(id=>[id,new Element()]));
Object.assign(el.role,{value:'terry'});el.language.value='pidgin';el.area.value='Benin City';el.category.value='Other';el.revenue.value='10000';el.cost.value='6500';
const document={getElementById:id=>{assert.ok(el[id],'Missing DOM element '+id);return el[id];},createElement:()=>new Element()};
vm.runInNewContext(inline[1],{document,window:{MONARCH_GCL_SYNTHETIC:adapter}});
let n=0;function check(name,fn){fn();n++;process.stdout.write('PASS '+name+'\n');}
check('Terry has six buttons',()=>assert.equal(el.tiles.children.length,6));
check('Terry onboarding preserved',()=>{el.tiles.children[0].click();assert.equal(el.editor.classList.contains('hidden'),false);el.cancel.click();});
check('Evidence panel has two synthetic placeholders',()=>{el.openEvidence.click();assert.equal(el.evidenceRecords.children.length,2);});
check('Evidence preserves source provenance',()=>assert.ok(el.evidenceRecords.children.every(x=>x.textContent.includes('OCCURRENCE')&&x.textContent.includes('CHECKPOINT'))));
check('Evidence preserves revision and rights UNKNOWN',()=>assert.ok(el.evidenceRecords.children.every(x=>x.textContent.includes('REVISION UNKNOWN')&&x.textContent.includes('RIGHTS UNKNOWN'))));
check('Evidence back navigation',()=>{el.evidenceBack.click();assert.equal(el.tiles.classList.contains('hidden'),false);});
check('Osayuki six buttons and subflows',()=>{el.role.value='osayuki';el.role.handlers.change();assert.equal(el.tiles.children.length,6);el.tiles.children[0].click();assert.equal(el.subflowButtons.children.length,4);});
check('Customer six buttons',()=>{el.subflowBack.click();el.role.value='customer';el.role.handlers.change();assert.equal(el.tiles.children.length,6);});
const ctx={tenant_or_context_id:'SYNTHETIC_DEMO',principal_ref:'REVIEW',purpose:'TEST'};
check('Synthetic projection accepted',()=>assert.equal(adapter.project(adapter.examples[0],ctx).decision,'SYNTHETIC_REVIEW'));
check('Tenant mismatch blocked',()=>assert.equal(adapter.project(adapter.examples[0],{...ctx,tenant_or_context_id:'OTHER'}).decision,'HOLD'));
check('Observed source elevation blocked',()=>assert.equal(adapter.project({...adapter.examples[0],evidence_status:'OBSERVED'},ctx).decision,'HOLD'));
check('Personal-data field blocked',()=>assert.equal(adapter.project({...adapter.examples[0],customer_name:'X'},ctx).decision,'HOLD'));
check('Unapproved rights blocked',()=>assert.equal(adapter.project({...adapter.examples[0],rights_status:'OPEN'},ctx).decision,'HOLD'));
check('No execution authority',()=>assert.equal(adapter.project(adapter.examples[0],ctx).projection.execution,'PROHIBITED'));
check('Impossible date blocked',()=>assert.equal(adapter.project({...adapter.examples[0],publication_date:'2026-02-30'},ctx).decision,'HOLD'));
check('Unrecognised workflow blocked',()=>assert.equal(adapter.project({...adapter.examples[0],workflow_id:'WF-UNKNOWN'},ctx).decision,'HOLD'));
process.stdout.write('TOTAL '+n+'/'+n+' simulated checks passed; real Safari/iPhone and production security UNKNOWN.\n');
