import {loadEnv} from './env.mjs';
const env=loadEnv();const key=env.GEMINI_API_KEY?.trim();
const model=String(env.AI_MODEL||'gemini-3.5-flash-lite').trim().replace(/^models\//,'');
const redact=text=>String(text).split(key||'__no_key__').join('[REDACTED]').replace(/AIza[A-Za-z0-9_-]+/g,'[REDACTED]').slice(0,1500);
console.log('Provider:',env.AI_PROVIDER||'(not set)');console.log('Model:',model);console.log('Key present:',!!key);
if(!key){console.error('Missing GEMINI_API_KEY in .env.');process.exitCode=1;}else{
 try{
  const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{role:'user',parts:[{text:'Reply with OK.'}]}],generationConfig:{maxOutputTokens:128}}),signal:AbortSignal.timeout(20000)});
  console.log('Google HTTP status:',r.status);
  const data=await r.json();
  if(!r.ok){console.log('Google error status:',redact(data.error?.status||'Unknown'));console.log('Google error message:',redact(data.error?.message||'No error message'));process.exitCode=1;}
  else console.log('Generation request accepted. Finish reason:',data.candidates?.[0]?.finishReason||'No candidate returned');
 }catch(error){console.error('Network check failed:',redact(error.cause?.code||error.name));process.exitCode=1;}
}
