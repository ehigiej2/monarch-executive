const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');
const js=html.split('<script>').pop().split('</script>')[0];
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);
const duplicate=ids.filter((x,i)=>ids.indexOf(x)!==i);
assert.deepStrictEqual(duplicate,[],'Duplicate HTML IDs');
const elements=new Map(ids.map(id=>[id,{value:'0',innerHTML:'',textContent:'',classList:{toggle(){}},append(){},replaceChildren(){},getContext(){return {createLinearGradient(){return {addColorStop(){}}},fillRect(){},beginPath(){},arc(){},fill(){},fillText(){},measureText(t){return {width:String(t).length*10}}}}}]));
const doc={getElementById(id){if(!elements.has(id))elements.set(id,{value:'0',innerHTML:'',textContent:'',classList:{toggle(){}},append(){},replaceChildren(){},getContext(){return {createLinearGradient(){return {addColorStop(){}}},fillRect(){},beginPath(){},arc(){},fill(){},fillText(){},measureText(t){return {width:String(t).length*10}}}}});return elements.get(id)},querySelectorAll(){return []},querySelector(){return {textContent:""}},createElement(){return {append(){},set textContent(x){},className:''}}};
const storage=new Map();const localStorage={getItem(k){return storage.get(k)||null},setItem(k,v){storage.set(k,v)},removeItem(k){storage.delete(k)}};
const context={document:doc,localStorage,window:{scrollTo(){},addEventListener(){}},location:{hash:'',origin:'https://example.test',pathname:'/waka/'},navigator:{},console,Math,JSON,Number,String,Array,Date,setInterval(){},clearInterval(){},setTimeout(){},clearTimeout(){},alert(){},URL:{createObjectURL(){return ''},revokeObjectURL(){}},Blob:function(){},MediaRecorder:function(){}};
vm.createContext(context);vm.runInContext(js,context,{timeout:1500});
function set(k,v){doc.getElementById(k).value=String(v)}
const ids1=new Set(),ids2=new Set(),ids3=new Set();
for(let r=0;r<25;r++)for(let n=0;n<20;n++)for(let c=0;c<10;c++){
 set('flowRole',r);set('flowNeed',n);set('flowChallenge',c);vm.runInContext('runFlow()',context);
 let result=doc.getElementById('flowResult').innerHTML,match=result.match(/Workflow (\d+) \/ 5,000/);assert(match,'5k path missing');ids1.add(+match[1]);
 for(let m=0;m<3;m++){set('evRole',r);set('evNeed',n);set('evChallenge',c);set('evMission',m);vm.runInContext('enterprisePlan()',context);
 result=doc.getElementById('evPlan').innerHTML;match=result.match(/Value path (\d+) \/ 15,000/);assert(match,'15k path missing');ids2.add(+match[1]);}
}
for(let t=0;t<3;t++)for(let r=0;r<15;r++)for(let n=0;n<10;n++)for(let f=0;f<20;f++){
 set('chainType',t);set('chainRole',r);set('chainTarget',n);set('chainFriction',f);vm.runInContext('chainPlan()',context);
 const match=doc.getElementById('chainResult').innerHTML.match(/Chain (\d+) \/ 9,000/);assert(match,'9k path missing');ids3.add(+match[1]);
}
for(const [set,expected] of [[ids1,5000],[ids2,15000],[ids3,9000]]){assert.strictEqual(set.size,expected);assert.strictEqual(Math.min(...set),1);assert.strictEqual(Math.max(...set),expected)}
set('evPrice',2500);set('evUnits',20);set('evCost',1600);set('evOverhead',5000);vm.runInContext('enterpriseCalc()',context);
assert(doc.getElementById('evMath').innerHTML.includes('13,000'),'cash calculator');
set('evPrice',-1);vm.runInContext('enterpriseCalc()',context);assert(doc.getElementById('evMath').textContent.includes('valid'),'reject negative price');
set('chainA',8000);set('chainB',3500);set('chainC',2500);vm.runInContext('chainValue()',context);assert(doc.getElementById('chainMath').innerHTML.includes('14,000'),'chain calculator');
set('chainA',-1);vm.runInContext('chainValue()',context);assert(doc.getElementById('chainMath').textContent.includes('valid'),'reject negative chain');
assert(vm.runInContext('safe("<script>alert(1)</script>")',context).includes('&lt;script&gt;'),'escape unsafe HTML');
console.log(JSON.stringify({status:'PASS',uniqueIds:{scenarios:ids1.size,valuePaths:ids2.size,valueChains:ids3.size,total:ids1.size+ids2.size+ids3.size},checks:['HTML unique IDs','JS loads in DOM mock','all workflow IDs generated','no duplicate workflow IDs','cash calculator','negative value rejection','chain value calculator','HTML escaping'],limitations:['No real browser tested','No live Context Lake','No real agents or external transactions']},null,2));
