import fs from 'node:fs';
fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/.openai',{recursive:true});
const data=fs.readFileSync('data/document-passages.mjs','utf8').replaceAll('export const','const')+'\n'+fs.readFileSync('data/bass2-generated.mjs','utf8').replaceAll('export const','const')+'\n'+fs.readFileSync('data/catalogue.mjs','utf8').replace(/^import .*;$/gm,'').replaceAll('export const','const');
const core=fs.readFileSync('src/core.mjs','utf8').replace(/^import .*;$/gm,'').replace(/^export \{.*\};$/m,'').replaceAll('export function','function').replaceAll('export const','const');
const server=fs.readFileSync('src/server.mjs','utf8').replace(/^import .*;$/gm,'').replace('export async function api','async function api');
const assets=Object.fromEntries(['index.html','app.js','styles.css'].map(p=>['/'+(p==='index.html'?'':p),fs.readFileSync('public/'+p,'utf8')]));
const worker=data+'\n'+core+'\n'+server+'\nconst assets='+JSON.stringify(assets)+';\nexport default {async fetch(request,env){const p=new URL(request.url).pathname;if(p.startsWith("/api/"))return api(request,env);const body=assets[p];if(body===undefined)return new Response("Not found",{status:404});return new Response(body,{headers:{"Content-Type":p.endsWith(".js")?"text/javascript":p.endsWith(".css")?"text/css":"text/html; charset=utf-8","X-Content-Type-Options":"nosniff","Referrer-Policy":"strict-origin-when-cross-origin","Content-Security-Policy":"default-src \'self\'; script-src \'self\'; style-src \'self\'; connect-src \'self\'; img-src \'self\' data: https://svs.gsfc.nasa.gov; object-src \'none\'; base-uri \'self\'; frame-ancestors \'self\' https://chatgpt.com https://*.chatgpt.com"}})}};';
fs.writeFileSync('dist/server/index.js',worker);fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');console.log('Worker built:',Buffer.byteLength(worker),'bytes');

await import('./offline.mjs');
