import {loadEnv} from './env.mjs';
const env=loadEnv();
if(!env.GEMINI_API_KEY){console.error('Set GEMINI_API_KEY in .env first.');process.exitCode=1;}else{
 try{
  let pageToken='';let count=0;
  do{
   const url=new URL('https://generativelanguage.googleapis.com/v1beta/models');url.searchParams.set('pageSize','100');if(pageToken)url.searchParams.set('pageToken',pageToken);
   const r=await fetch(url,{headers:{'x-goog-api-key':env.GEMINI_API_KEY},signal:AbortSignal.timeout(15000)});
   if(!r.ok)throw new Error('Gemini HTTP '+r.status+' while listing models.');
   const data=await r.json();for(const m of data.models||[])if(m.supportedGenerationMethods?.includes('generateContent')){console.log(m.name.replace(/^models\//,''));count++;}pageToken=data.nextPageToken||'';
  }while(pageToken);
  console.log('\n'+count+' compatible models. Availability does not guarantee free-tier quota. Choose a free-tier model in AI Studio, then set AI_MODEL in .env and restart.');
 }catch(error){console.error(error.message.startsWith('Gemini HTTP')?error.message:'Could not reach Gemini. Run this command from your local VS Code terminal with internet access.');process.exitCode=1;}
}
