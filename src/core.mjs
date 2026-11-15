import {investigations, tests, sources, auditDate, passages, quantitativeFindings, insights} from '../data/catalogue.mjs';
export {investigations, tests, sources, auditDate, passages, quantitativeFindings, insights};
const stop=new Set('the a an for in on of to and or is are what which how can i my research about do does with from me tell study studies nasa please compare between'.split(' '));
const synonyms={plastics:'plastic',materials:'material',fabrics:'fabric',detectors:'detector',sensors:'sensor',particles:'particle',extinguishing:'extinction',extinguishment:'extinction',extinguisher:'suppression',suppressants:'suppression',detection:'detector',prevent:'prevention',moon:'lunar',burning:'burn',fires:'fire'};
export const tokens=q=>[...new Set(String(q||'').toLowerCase().replace(/[^a-z0-9₂]+/g,' ').split(' ').filter(t=>t&&!stop.has(t)).map(t=>synonyms[t]||t))];
export function rankInvestigations({q='',category='',fuel='',gravity='',material='',oxygen='',airflow=''}={}){
 const words=tokens(q); const corpus=investigations.map(i=>tokens(i.tags.join(' ')+' '+i.name+' '+i.summary+' '+i.materials.join(' ')));
 return investigations.filter(i=>(!category||i.category===category)&&(!fuel||i.fuel===fuel)).map(i=>{
  const tag=tokens(i.tags.join(' ')+' '+i.category+' '+i.fuel+' '+i.name);const body=tokens(i.summary+' '+i.materials.join(' '));
  const strong=words.filter(w=>tag.includes(w)),weak=words.filter(w=>!strong.includes(w)&&body.includes(w));
  const weight=w=>(['combustion','fire','research','experiment','flame','study'].includes(w)?0.15:1)*Math.log(1+investigations.length/(1+corpus.filter(d=>d.includes(w)).length));
  const topicScore=strong.reduce((n,w)=>n+3*weight(w),0)+weak.reduce((n,w)=>n+weight(w),0);
  const conditionReasons=[];let conditionScore=0;
  if(material){const match=tokens(material).some(w=>tokens(i.materials.join(' ')).includes(w));if(match){conditionScore+=3;conditionReasons.push('Material metadata match: '+material);}else conditionReasons.push('Exact material coverage not established');}
  for(const [key,value,range] of [['oxygen',oxygen,i.oxygen_range],['airflow',airflow,i.airflow_range]])if(value!==''&&value!=null){if(range&&Number(value)>=range[0]&&Number(value)<=range[1]){conditionScore++;conditionReasons.push(key+' overlaps recorded conditions');}else conditionReasons.push(range?key+' outside recorded range':key+' range not verified');}
  if(gravity&&gravity!==i.gravity)conditionReasons.push('Gravity differs: no direct validation');
  const verified=tests.filter(t=>t.investigation===i.id&&t.verification==='Report verified').length;
  return {...i,score:Number((topicScore+conditionScore).toFixed(2)),topicScore,conditionScore,conditionReasons,reasons:[...strong.map(w=>'Topic match: '+w),...weak.map(w=>'Description match: '+w),...(category?['Selected goal: '+category]:[])],evidenceRecords:verified,coverageStatus:verified?'Report-verified test records':i.id==='bass2'?'Source CSV; interpretation pending':'Summary / metadata only'};
 }).filter(i=>!words.length||i.topicScore>0).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
}
export function searchPassages(q,limit=5){
 const words=tokens(q);return passages.map(p=>({...p,score:words.reduce((n,w)=>n+(tokens(p.text+' '+p.title).includes(w)?1:0),0)})).filter(p=>p.score>0).sort((a,b)=>b.score-a.score).slice(0,limit);
}
export function operationalQuestion(q){return /\b(?:safe|safest)\b|fire probability|(?:recommend|give me|what is|how much).{0,35}(?:safe threshold|safe dose|suppressant dose)|predict.{0,25}(?:risk|probability|safety)/i.test(q);}
export function scenarioGaps(i,s={}){
 const gaps=[];
 if(s.gravity&&s.gravity!=='Microgravity')gaps.push('Gravity mismatch: this investigation is microgravity evidence, not direct '+s.gravity+' validation.');
 for(const [key,range,label,unit] of [['oxygen',i.oxygen_range,'oxygen','%'],['airflow',i.airflow_range,'airflow','cm/s']]){
  if(s[key]!==''&&s[key]!=null){const n=Number(s[key]);if(!Number.isFinite(n))gaps.push('Invalid '+label+' input.');else if(!range)gaps.push('Verified '+label+' range unavailable.');else if(n<range[0]||n>range[1])gaps.push('Selected '+label+' '+n+' '+unit+' is outside the curated recorded range '+range.join('–')+' '+unit+'.');else gaps.push('Selected '+label+' overlaps recorded conditions; this is not a validated safety envelope.');}
 }
 if(s.pressure!==''&&s.pressure!=null)gaps.push('Pressure coverage is not verified in this catalogue; matching oxygen alone is insufficient.');
 if(s.material&&!i.materials.some(m=>m.toLowerCase().includes(s.material.toLowerCase())))gaps.push('Exact material match not established.');
 return gaps.length?gaps:['Check test geometry, atmosphere, scale and measurements before transferring findings.'];
}
export function comparison(ids){
 const selected=ids.map(id=>investigations.find(i=>i.id===id)).filter(Boolean);let warnings=[];
 if(new Set(selected.map(i=>i.fuel)).size>1)warnings.push('Different fuel regimes: qualitative comparison only; do not pool numerical outcomes.');
 if(new Set(selected.map(i=>i.hardware)).size>1)warnings.push('Different hardware or scale: direct numerical equivalence is not established.');
 warnings.push('A shared microgravity label does not make conditions equivalent. Missing fields are not matching conditions.');
 return {selected,warnings};
}
export function filterTests({q='',investigation='',preview=false,material=''}={}){return tests.filter(t=>(preview||t.verification==='Report verified')&&(!investigation||t.investigation===investigation)&&(!material||t.material===material)&&(!q||[t.id,t.raw_material,t.outcome].join(' ').toLowerCase().includes(q.toLowerCase())));}
export function evidenceAnswer(q){
 const query=String(q||'').trim();if(!query)return {mode:'Evidence retrieval',answer:'Enter a research question.',citations:[],matches:[]};
 if(operationalQuestion(query))return {mode:'Evidence retrieval',answer:'The curated collection cannot establish a safe material, fire probability, operational threshold or suppressant dose. It contains limited experimental conditions, not a validated safety model. Explore relevant investigations and inspect their original sources.',citations:[],matches:rankInvestigations({q:query}).slice(0,3).map(i=>i.id),limitations:['No certified safety or predictive conclusion.']};
 const findings=quantitativeFindings.filter(f=>f.investigations.some(id=>new RegExp(id==='saffire3'?'saffire[ -]?(iii|3)':id==='same-r'?'same[ -]?r':'same|smoke|particle','i').test(query)));
 if(findings.length&&/size|diameter|ratio|zero.flow|duration|burn|saffire[ -]?(iii|3)/i.test(query))return {mode:'Evidence retrieval',answer:findings.map(f=>f.text+' '+f.conditions+' Scope: '+f.scope+'. '+f.limitations).join('\n\n'),citations:[...new Set(findings.map(f=>f.source))],matches:[...new Set(findings.flatMap(f=>f.investigations))],passages:passages.filter(p=>findings.some(f=>p.id===f.id+'-'+p.investigation)),limitations:['Report-level findings are not independent test rows or validated safety thresholds.']};
 const mentioned=tests.filter(t=>new RegExp('(^|[^a-z0-9])'+t.id+'($|[^a-z0-9-])','i').test(query));
 if(mentioned.length){return {mode:'Evidence retrieval',answer:mentioned.map(t=>`${t.id}: ${t.raw_material}; initial O₂ ${t.oxygen_initial_pct??'not reported'}%; airflow ${t.airflow_cms==null?'not verified':t.airflow_cms+' cm/s'}; observation: ${t.outcome}; spread rate ${t.spread_rate_mms??'not reported'} mm/s; duration ${t.burn_duration_s??'not reported'} s. Verification: ${t.verification}.`).join('\n\n'),citations:[...new Set(mentioned.map(t=>t.source))],matches:[...new Set(mentioned.map(t=>t.investigation))],limitations:mentioned.flatMap(t=>t.flags)};}
 if(/\bco\b|carbon monoxide/i.test(query)&&/increase|higher|greater|change/i.test(query)){
  const data=tests.filter(t=>t.co_initial_ppm!=null&&t.co_final_ppm!=null&&t.co_final_ppm>t.co_initial_ppm);
  return {mode:'Evidence retrieval',answer:'In the source-transcribed BASS-II CSV, higher final CO is recorded for: '+data.slice(0,20).map(t=>`${t.id} (${t.co_initial_ppm} → ${t.co_final_ppm} ppm)`).join(', ')+'. Showing up to 20 matches of '+data.length+'. B2 has no final CO value. These are enclosure sensor readings, not fire-risk scores.',citations:['bass2'],matches:['bass2'],limitations:['CO values are transcribed source readings; independent sensor interpretation remains unverified. Negative initial B4 reading is preserved.']};
 }
 if(/spread rate|burn duration|burn time/i.test(query)){
  const rows=tests.filter(t=>t.spread_rate_mms!=null);
  return {mode:'Evidence retrieval',answer:rows.map(t=>`${t.id}: ${t.spread_rate_mms} mm/s, ${t.burn_duration_s} s; airflow ${t.airflow_cms} cm/s; initial O₂ ${t.oxygen_initial_pct}%; ${t.measurement_location}.`).join('\n\n'),citations:['saffire-report'],matches:['saffire1','saffire2'],passages:searchPassages(query).filter(p=>p.source==='saffire-report'),limitations:['Different sample scale, oxygen and airflow conditions: these values are not a controlled causal comparison.']};
 }
 const match=rankInvestigations({q:query}).slice(0,3); if(!match.length)return {mode:'Evidence retrieval',answer:'No matching evidence was found in this curated collection. Try a specific topic such as smoke detection, solid-material flame spread, or droplet suppression.',citations:[],matches:[],limitations:['No answer generated outside the retrieved evidence.']};
 return {mode:'Evidence retrieval',passages:searchPassages(query).filter(p=>match.some(i=>i.id===p.investigation)),answer:match.map(i=>`${i.name}: ${i.summary} ${i.finding}`).join('\n\n'),citations:[...new Set(match.flatMap(i=>i.sources))],matches:match.map(i=>i.id),limitations:[...( /moon|lunar|mars|martian/i.test(query)?['No direct partial-gravity conclusion is supported by the curated microgravity records.']:[]),'Curated summaries retrieved by keyword; this response is not generated by an LLM. Consult the original evidence for complete context.']};
}
export function exportBundle(rows){return {generatedAt:new Date().toISOString(),auditDate,description:'FlameWise curated research subset. No synthetic measurements. Null = not reported or not verified.',units:{thickness_mm:'mm',width_cm:'cm',length_cm:'cm',airflow_cms:'cm/s',air_display:'source display units unverified',oxygen_initial_pct:'volume %',oxygen_final_pct:'volume %',co_initial_ppm:'ppm',co_final_ppm:'ppm',co2_initial_pct:'volume %',co2_final_pct:'volume %',pressure_kpa:'kPa',spread_rate_mms:'mm/s',burn_duration_s:'s'},records:rows,quantitativeFindings,citations:sources.filter(s=>rows.some(r=>r.source===s.id)||quantitativeFindings.some(f=>f.source===s.id)),limitations:['Subset, not full PSI repository.','BASS-II CSV readings require calibration review; 129 nonempty CSV records match NASA; the extra displayed entry is blank.','No operational fire-safety certification.']};}
export function toCSV(rows){if(!rows.length)return '';const keys=[...new Set(rows.flatMap(r=>Object.keys(r)))];const cell=x=>'"'+String(x==null?'':Array.isArray(x)?x.join('; '):typeof x==='object'?JSON.stringify(x):x).replaceAll('"','""')+'"';return keys.map(cell).join(',')+'\r\n'+rows.map(r=>keys.map(k=>cell(r[k])).join(',')).join('\r\n');}
// Evidence strength = how much checkable material backs an insight in this collection. Not a danger or quality score.
export function rankInsights(){
 return insights.map(s=>{
  const verifiedRecords=s.tests.filter(id=>tests.some(t=>t.id===id&&t.verification==='Report verified')).length;
  const quantFindings=s.findings.filter(id=>quantitativeFindings.some(f=>f.id===id)).length;
  const locatedPassages=s.passages.filter(id=>passages.some(p=>p.id===id&&p.page)).length;
  return {...s,strength:{score:verifiedRecords+2*quantFindings+locatedPassages,tier:verifiedRecords||quantFindings?'Measured':'Reported',verifiedRecords,quantFindings,locatedPassages}};
 }).sort((a,b)=>b.strength.score-a.strength.score||a.title.localeCompare(b.title));
}
