// Vercel entry: every /api/* call is rewritten here; rebuild the original URL and hand it to the shared API.
import {api} from '../src/server.mjs';
async function handle(request){
 const url=new URL(request.url);const path=url.searchParams.get('__path')||'';url.searchParams.delete('__path');url.pathname='/api/'+path;
 const init={method:request.method,headers:request.headers};if(!['GET','HEAD'].includes(request.method)){init.body=await request.text();}
 return api(new Request(url,init),process.env);
}
export const GET=handle;export const POST=handle;
