import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {investigations,tests,passages} from '../data/catalogue.mjs';
const row=id=>tests.find(t=>t.id===id);
test('Saffire records agree with 2017 Table I on page 29',()=>{
 // Independently transcribed report reference: id, thickness, flow, initial ISS O2, spread, duration.
 for(const [id,thickness,flow,o2,spread,duration] of [['S1-main',.37,20,21.7,1.8,420],['S2-1',.27,20,22.1,null,null],['S2-2',.61,20,22.1,null,null],['S2-3',1.03,20,22.1,null,null],['S2-4',.37,20,22.1,null,null],['S2-5',.37,20,22.1,2.1,145],['S2-6',.37,25,22.1,2.6,115]]){
  const r=row(id);assert.equal(r.thickness_mm,thickness);assert.equal(r.airflow_cms,flow);assert.equal(r.oxygen_initial_pct,o2);assert.equal(r.spread_rate_mms??null,spread);assert.equal(r.burn_duration_s??null,duration);assert.match(r.field_provenance.thickness_mm,/page 29/);
 }
 assert.equal(row('S2-4').flow_direction,'Opposed');
});
test('row count explained by the live source blank row',()=>{const a=JSON.parse(fs.readFileSync('data/ingestion-audit.json'));assert.equal(a.discrepancy_resolved,true);assert.equal(a.repository_display_count-a.repository_blank_rows,a.record_count);});
test('censored, invalid and missing measurements keep raw values and flags',()=>{assert.equal(row('M5').co_final_ppm,null);assert.equal(row('M5').raw['Final CO (ppm)'],'>500');assert.ok(row('M5').flags.some(f=>f.includes('>500')));assert.equal(row('O12').co_initial_ppm,null);assert.ok(row('O12').flags.some(f=>f.includes("'OR'")));assert.equal(row('T28b').oxygen_final_pct,40.4);assert.ok(row('T28b').flags.some(f=>f.includes('Unusual oxygen')));});
test('source dates are preserved with consistency flags',()=>{assert.ok(row('O10').flags.some(f=>f.includes('day-of-year')));assert.equal(row('T9').raw.Date,'6/24/2018');assert.ok(row('T9').flags.some(f=>f.includes('Date year')));});
test('explicit mm thickness is retained in varying description order',()=>{assert.equal(row('M15').thickness_mm,4);assert.equal(row('M19').thickness_mm,4);assert.equal(row('B6').width_cm,null);});
test('SAME report is labeled as combined-flight evidence',()=>{assert.match(passages.find(p=>p.id==='same-particles').scope,/SAME-1 and SAME-2/);assert.match(investigations.find(i=>i.id==='same').limitations.join(' '),/both flights|both|combined/i);});
