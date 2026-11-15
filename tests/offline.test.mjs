import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
function element(){return {innerHTML:'',textContent:'',value:'',hidden:false,checked:false,disabled:false,classList:{add(){},remove(){},toggle(){}},remove(){},setAttribute(){},removeAttribute(){},focus(){},showModal(){this.open=true;},close(){this.open=false;}};}
async function boot(){const html=fs.readFileSync('FlameWise.html','utf8');const code=html.match(/<script>([\s\S]*)<\/script>/)[1];const nodes=new Map();const get=s=>{if(!nodes.has(s))nodes.set(s,element());return nodes.get(s);};const context={URL,Request,Response,AbortSignal,Blob,Set,Map,Date,JSON,console,setTimeout,clearTimeout,location:{hash:''},document:{querySelector:get,querySelectorAll:()=>[],addEventListener(){},createElement:()=>element(),body:{append(){}}},addEventListener(){},scrollTo(){}};context.window=context;vm.createContext(context);new vm.Script(code).runInContext(context);await new Promise(setImmediate);return {context,get};}
test('offline application boots mission briefing without a network server',async()=>{const {get}=await boot();assert.match(get('#page').innerHTML,/Fire changes when gravity disappears/);assert.match(get('#page').innerHTML,/BASS-II source/);});
test('offline explorer, lab and assistant render from shared API',async()=>{const {context,get}=await boot();for(const [page,expected]of [['explorer',/Find the right investigation/],['lab',/Data laboratory/],['assistant',/Evidence retrieval mode/],['sources',/Every insight needs a source/],['scenario',/Explore a research scenario/]]){context.location.hash='#'+page;await vm.runInContext('render()',context);assert.match(get('#page').innerHTML,expected);}context.location.hash='#lab';await vm.runInContext('render()',context);assert.match(get('#test-table').innerHTML,/S2-1/);assert.doesNotMatch(get('#test-table').innerHTML,/>B1 /);});
test('offline API returns source-grounded answers',async()=>{const {context}=await boot();const result=await vm.runInContext('request("/api/ask",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:"Compare B1 and B4"})})',context);assert.equal(result.mode,'Evidence retrieval');assert.match(result.answer,/B1/);assert.ok(result.citations.includes('bass2'));});

test('investigation evidence dialog opens with current source passages',async()=>{const {context,get}=await boot();vm.runInContext('details("same")',context);assert.equal(get('#detail').open,true);assert.match(get('#detail-body').innerHTML,/Smoke aging and airflow/);});
test('evidence dialog tolerates an older backend catalogue',async()=>{const {context,get}=await boot();vm.runInContext('delete catalogue.passages; for(const i of catalogue.investigations){delete i.objective;delete i.findingStatus;} details("same")',context);assert.equal(get('#detail').open,true);assert.match(get('#detail-body').innerHTML,/SAME/);assert.match(get('#detail-body').innerHTML,/Investigation summary/);});

test('successful synthesis updates status and retains it across navigation and safety retrieval',async()=>{
 const {context,get}=await boot();context.location.hash='#assistant';await vm.runInContext('health.aiConfigured=true;render()',context);
 vm.runInContext('showAnswer({mode:"AI synthesis",answer:"Evidence [flex-results]",citations:["flex-results"],matches:[]})',context);assert.equal(get('#ai-status').textContent,'AI verified this session');
 context.location.hash='#overview';await vm.runInContext('render()',context);context.location.hash='#assistant';await vm.runInContext('render()',context);assert.match(get('#page').innerHTML,/AI verified this session/);
 vm.runInContext('showAnswer({mode:"Evidence retrieval",answer:"No supported safety conclusion",citations:[],matches:[]})',context);assert.equal(get('#ai-status').textContent,'AI verified this session');
 vm.runInContext('showAnswer({mode:"Evidence retrieval",notice:"Provider quota reached",answer:"Retrieved evidence",citations:[],matches:[]})',context);assert.equal(get('#ai-status').textContent,'Last AI request used fallback');
});
test('inline citations are source links while model text remains escaped',async()=>{
 const {context,get}=await boot();vm.runInContext('showAnswer({mode:"AI synthesis",answer:"<img src=x onerror=alert(1)> [flex-results] [unknown]",citations:["flex-results"],matches:[]})',context);
 const html=get('#answer-panel').innerHTML;assert.match(html,/class="inline-citation"/);assert.match(html,/href="https:\/\/www.nasa.gov\/missions\/station\/iss-research\/youre-hot-then-youre-cold\/"/);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img/);assert.match(html,/\[unknown\]/);
});
test('unlisted and unsafe citation targets never become answer links',async()=>{
 const {context}=await boot();const html=vm.runInContext('catalogue.sources.push({id:"unsafe",title:"Unsafe",url:"javascript:alert(1)"});renderAnswerText("[unsafe] [bass2]",["unsafe"])',context);assert.doesNotMatch(html,/<a/);assert.match(html,/\[unsafe\]/);assert.match(html,/\[bass2\]/);
});

test('mission briefing explains the evidence journey and distinguishes evidence status',async()=>{
 const {context,get}=await boot();const html=get('#page').innerHTML;
 assert.ok(html.indexOf('Plan for a lunar habitat')<html.indexOf('Ask a research question'));assert.match(html,/class="flame-path"/);assert.match(html,/gl-stage/);assert.match(html,/What the evidence says/);
 assert.match(html,/Report-verified/);assert.match(html,/BASS-II source/);
 assert.match(vm.runInContext('evidenceStatus(getInv("saffire2"))',context),/Report-verified/);
});
test('chart metric uses reported durations and comparison marks differences',async()=>{
 const {context,get}=await boot();context.location.hash='#lab';await vm.runInContext('render();chartMetric="burn_duration_s";updateLab()',context);
 assert.match(get('#chart').innerHTML,/420 s/);assert.match(get('#chart').innerHTML,/115 s/);
 context.location.hash='#compare';await vm.runInContext('selected.add("same");selected.add("flex");render()',context);
 assert.match(get('#page').innerHTML,/diff-row/);assert.match(get('#page').innerHTML,/same-row/);
});
test('answers use numbered citations and collapsed evidence sections',async()=>{
 const {context,get}=await boot();vm.runInContext('showAnswer({mode:"AI synthesis",answer:"Finding [flex-results]",citations:["flex-results"],passages:[{title:"Finding",text:"Public evidence",kind:"Finding paraphrase",location:"Section",source:"flex-results"}],limitations:["Limited scope"],matches:[]})',context);
 const html=get('#answer-panel').innerHTML;assert.match(html,/>\[1\]<\/a>/);assert.match(html,/<summary>Supporting evidence \(1\)<\/summary>/);assert.match(html,/<summary>Limitations<\/summary>/);
});
test('insights page ranks findings and shows empty Moon and Mars evidence cells',async()=>{
 const {context,get}=await boot();context.location.hash='#insights';await vm.runInContext('render()',context);const html=get('#page').innerHTML;
 assert.match(html,/What it means for a crew/);assert.match(html,/strength 5/);assert.equal(html.match(/gap-cell no-evidence/g).length,8);assert.equal(html.match(/gap-cell has-evidence/g).length,4);
});
test('dashboard shows top insights, measurements and the partial-gravity gap',async()=>{
 const {context,get}=await boot();context.location.hash='#dashboard';await vm.runInContext('render()',context);const html=get('#page').innerHTML;
 assert.match(html,/The whole collection on one screen/);assert.equal(html.match(/class="dash-insight"/g).length,3);assert.match(html,/8 of 8 partial-gravity cells/);assert.match(html,/Reported flame spread rates/);assert.match(html,/Investigations by theme/);
});
