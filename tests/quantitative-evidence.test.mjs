import test from 'node:test';
import assert from 'node:assert/strict';
import {quantitativeFindings,tests,sources,evidenceAnswer,exportBundle} from '../src/core.mjs';
import {api} from '../src/server.mjs';
test('report aggregates retain scope and are not fabricated individual tests',()=>{
 assert.equal(quantitativeFindings.length,3);
 for(const f of quantitativeFindings){assert.ok(sources.some(s=>s.id===f.source));assert.ok(f.page>0);assert.ok(f.conditions&&f.limitations&&f.scope);assert.ok(!tests.some(t=>t.id===f.id));}
 assert.deepEqual(quantitativeFindings.find(f=>f.id==='same-size-range').range,[200,400]);
 assert.deepEqual(quantitativeFindings.find(f=>f.id==='same-size-range').investigations,['same','same-r']);
 assert.equal(quantitativeFindings.find(f=>f.id==='same-zero-flow-ratio').value,1.7);
});
test('Saffire-III retrieval keeps source conflict and unknown atmosphere explicit',()=>{
 const a=evidenceAnswer('Saffire III burn duration');assert.match(a.answer,/320 s/);assert.match(a.answer,/25 cm\/s/);assert.match(a.answer,/420/);assert.match(a.answer,/not extracted/);assert.ok(a.citations.includes('saffire-iii-results'));
});
test('smoke size retrieval and exports expose aggregate provenance',async()=>{
 assert.match(evidenceAnswer('smoke particle size').answer,/200 and 400 nm/);
 const bundle=exportBundle([]);assert.equal(bundle.records.length,0);assert.equal(bundle.quantitativeFindings.length,3);assert.ok(bundle.citations.some(s=>s.id==='same-report'));
 const response=await api(new Request('http://localhost/api/catalogue'),{});assert.equal((await response.json()).quantitativeFindings.length,3);
});
