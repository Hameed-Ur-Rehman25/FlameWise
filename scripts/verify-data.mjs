import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {investigations,tests,sources,passages} from '../data/catalogue.mjs';
// Independent standard-library CSV reader; compare every original field, not just row counts.
const parsed=spawnSync('python3',['-c',`import csv,json;print(json.dumps([{k.strip():v for k,v in r.items()} for r in csv.DictReader(open('data/bass2-source.csv',encoding='utf-8-sig',newline=''))]))`],{encoding:'utf8'});assert.equal(parsed.status,0,parsed.stderr);
const raw=JSON.parse(parsed.stdout),bass=tests.filter(t=>t.investigation==='bass2');assert.equal(raw.length,bass.length);
const hash=crypto.createHash('sha256').update(fs.readFileSync('data/bass2-source.csv')).digest('hex');
const mapping={oxygen_initial_pct:'Calibrated  initial O2 % by vol',oxygen_final_pct:'Calibrated final O2 % by vol',co_initial_ppm:'Initial CO (ppm)',co_final_ppm:'Final CO (ppm)',co2_initial_pct:'Initial CO2 % by vol',co2_final_pct:'Final CO2 % by vol'};
let numericChecks=0;for(let index=0;index<raw.length;index++){
 const row=raw[index],t=bass[index];assert.deepEqual(t.raw,row);assert.equal(t.id,row['Test #']);assert.equal(t.source_sha256,hash);assert.equal(t.raw_material,row['Fuel Sample Material']);assert.ok(t.location.endsWith('row '+(index+2)));assert.equal(t.airflow_cms,null);
 for(const [field,column] of Object.entries(mapping)){const value=row[column].trim();const expected=/^-?\d+(?:\.\d+)?$/.test(value)?Number(value):null;assert.equal(t[field],expected,`${t.id}.${field}`);numericChecks++;if(expected===null)assert.ok(t.flags.some(f=>f.startsWith(column+':')));}
}
for(const group of [tests,investigations,sources,passages])assert.equal(new Set(group.map(x=>x.id)).size,group.length,'Duplicate IDs');
const sourceIds=new Set(sources.map(s=>s.id)),invIds=new Set(investigations.map(i=>i.id));
for(const t of tests){assert.ok(sourceIds.has(t.source));assert.ok(invIds.has(t.investigation));for(const [key,value] of Object.entries(t))if(typeof value==='number')assert.ok(Number.isFinite(value),`${t.id}.${key}`);}
for(const i of investigations){assert.ok(i.sources.every(id=>sourceIds.has(id)));}
for(const p of passages){assert.ok(sourceIds.has(p.source));assert.ok(invIds.has(p.investigation));assert.ok(p.location);}
const sourceCheck=JSON.parse(fs.readFileSync('data/source-verification.json'));assert.equal(sourceCheck.local_original_sha256,hash);
let normalized=JSON.stringify(raw.map(r=>Object.values(r).map(v=>v.replace(/\s+/g,' ').trim()))),fingerprint=2166136261;for(let n=0;n<normalized.length;n++)fingerprint=Math.imul(fingerprint^normalized.charCodeAt(n),16777619)>>>0;
assert.equal(fingerprint.toString(16).padStart(8,'0'),sourceCheck.normalized_fnv1a32);
const missing=Object.fromEntries(Object.keys(mapping).map(k=>[k,bass.filter(t=>t[k]===null).length]));
const audit={date:'2026-11-15',scope:'All included catalogue records; not the entire NASA repository',records:tests.length,bass2Records:bass.length,originalFieldsChecked:raw.reduce((n,r)=>n+Object.keys(r).length,0),numericMappingsChecked:numericChecks,reportVerifiedRecords:tests.filter(t=>t.verification==='Report verified').length,investigations:investigations.length,sources:sources.length,passages:passages.length,rawSourceSHA256:hash,sourceTableFingerprint:sourceCheck.normalized_fnv1a32,missingNumericCounts:missing,flagCounts:Object.fromEntries([...new Set(bass.flatMap(t=>t.flags))].map(flag=>[flag,bass.filter(t=>t.flags.includes(flag)).length])),checks:'PASS: local transcription, source-table checksum, normalized sensors, identifiers, source references, finite values',scientificStatus:'Partial: source values retained; anomalies, calibration interpretation and unavailable documentation remain unresolved'};
fs.writeFileSync('data/verification-results.json',JSON.stringify(audit,null,2)+'\n');console.log(JSON.stringify(audit,null,2));
