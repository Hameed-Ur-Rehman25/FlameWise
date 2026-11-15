import {loadEnv} from './env.mjs';
import {api} from '../src/server.mjs';
const env=loadEnv();
console.log('Provider:',env.AI_PROVIDER);console.log('Model:',env.AI_MODEL);
const key=env.GEMINI_API_KEY||'';
const redact=s=>String(s).split(key||'__none__').join('[REDACTED]').replace(/AIza[A-Za-z0-9_-]+/g,'[REDACTED]').slice(0,1200);
const original=globalThis.fetch;
globalThis.fetch=async(...args)=>{const r=await original(...args);console.log('Provider HTTP:',r.status);if(!r.ok){try{const d=await r.clone().json();console.log('Provider message:',redact(d.error?.message||'Unavailable'));}catch{}}return r;};
try{const result=await(await api(new Request('http://localhost/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:'What are cool flames?'})}),env)).json();console.log('Application mode:',result.mode);if(result.notice)console.log('Notice:',redact(result.notice));if(result.mode==='AI synthesis')console.log('Citations:',result.citations.join(', '));}finally{globalThis.fetch=original;}
