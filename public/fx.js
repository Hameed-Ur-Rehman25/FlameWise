'use strict';
// FlameWise motion layer: a raymarched 3D flame for the briefing hero, scroll reveals, count-ups and card tilt.
// Everything here is decoration on top of app.js. Without WebGL/observers (or in the offline test VM) it does nothing.
(()=>{
if(typeof MutationObserver==='undefined'||typeof IntersectionObserver==='undefined')return;
const page=document.querySelector('#page');if(!page||!page.isConnected)return;
const calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease='cubic-bezier(.2,.8,.2,1)';

/* ---------- 3D flame ---------- */
// G: 1 = Earth gravity (buoyant teardrop), 0 = microgravity (spherical shell). Values between are hatched:
// the collection holds no partial-gravity data, so the picture refuses to look like evidence there.
const FRAG=`precision highp float;
uniform vec2 R;uniform float T,G,I;uniform vec2 C;
float h(vec3 p){p=fract(p*.3183+.1)*17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
vec3 flame(vec3 p){
 float up=max(p.y,0.);
 float tb=n(vec3(p.xz*2.4,p.y*1.5-T*2.6))-.5,tb2=n(vec3(p.zx*5.+7.,p.y*3.-T*4.))-.5;
 p.x+=G*(tb*.55+tb2*.18+sin(T*3.1+p.y*2.)*.06)*up;p.z+=G*(tb2*.4-tb*.2)*up;
 float H=mix(1.,4.3,G),r0=mix(.8,.44,G)*(1.+(1.-G)*.025*sin(T*1.3));
 float t=clamp(up/(H*r0),0.,1.);
 vec3 q=vec3(p.x*(1.+G*1.5*t),p.y>0.?p.y/H:p.y*(1.+G*1.3),p.z*(1.+G*1.5*t));
 float s=length(q)/r0;
 float body=smoothstep(1.,.25,s)*smoothstep(.02,.4,s*.6+t*1.2);
 vec3 hot=mix(vec3(1.,.28,.06),vec3(1.,.78,.3),smoothstep(.95,.35,s));
 hot=mix(hot,vec3(1.,.95,.8),smoothstep(.5,.1,s)*.7);
 hot=mix(vec3(.1,.22,.6),hot,smoothstep(-.25,.3,p.y/r0));
 float w=(s-.82)/.13,shell=exp(-w*w)+.1*smoothstep(1.,0.,s);
 vec3 cool=mix(vec3(.16,.4,1.),vec3(.62,.5,1.),smoothstep(.85,.2,s))*(.85+.3*n(p*3.+T*.25));
 return mix(cool*shell*1.25,hot*body*1.7,smoothstep(0.,1.,G));}
void main(){
 vec2 uv=(gl_FragCoord.xy*2.-R)/min(R.x,R.y);
 float ya=C.x,pi=C.y;vec3 tg=vec3(0.,mix(-.12,.42,G),0.);
 vec3 ro=tg+3.05*vec3(sin(ya)*cos(pi),sin(pi),cos(ya)*cos(pi));
 vec3 f=normalize(tg-ro),r=normalize(cross(f,vec3(0,1,0))),u=cross(r,f);
 vec3 rd=normalize(f*2.1+uv.x*r+uv.y*u);
 vec3 oc=ro-tg;float b=dot(oc,rd),c=dot(oc,oc)-5.3,d=b*b-c;
 vec3 col=vec3(0.);float a=0.;
 if(d>0.){d=sqrt(d);float t0=max(-b-d,0.),t1=-b+d;
  float bw=dot(ro,rd),dw=bw*bw-dot(ro,ro)+.006;bool core=dw>0.&&-bw-sqrt(max(dw,0.))>0.;
  if(core)t1=min(t1,-bw-sqrt(dw));
  float st=(t1-t0)/34.,t=t0+st*fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
  for(int i=0;i<34;i++){col+=flame(ro+rd*t)*st;t+=st;}
  col=1.-exp(-col*1.5*I);a=max(col.r,max(col.g,col.b));
  if(core){vec3 nn=normalize(ro+rd*t1);col+=(1.-a)*(vec3(.015,.02,.035)+pow(1.-abs(dot(nn,rd)),2.)*mix(vec3(.2,.4,.9),vec3(.9,.45,.15),G)*.5*I);a=1.;}
 }
 float gh=smoothstep(.03,.12,G)*smoothstep(.97,.88,G);
 float lum=dot(col,vec3(.3,.59,.11)),ht=step(.5,fract((gl_FragCoord.x+gl_FragCoord.y)/5.));
 col=mix(col,vec3(.72,.86,1.)*lum*mix(.18,1.,ht),gh);a=mix(a,a*mix(.3,1.,ht),gh);
 gl_FragColor=vec4(col,a);}`;
const state={g:1,i:calm?1:0,yaw:0,pitch:.12,ty:0,tp:.12,played:calm};
let canvas,gl,U,raf=0;
function initGL(){
 canvas=document.createElement('canvas');canvas.className='flame-gl';canvas.setAttribute('aria-hidden','true');
 gl=canvas.getContext('webgl',{alpha:true,antialias:false,powerPreference:'low-power'});if(!gl)return false;
 const sh=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
 try{const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,FRAG));gl.bindAttribLocation(p,0,'p');gl.linkProgram(p);gl.useProgram(p);
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  U=Object.fromEntries(['R','T','G','I','C'].map(k=>[k,gl.getUniformLocation(p,k)]));
 }catch(e){console.warn('FlameWise 3D flame unavailable:',e.message);gl=null;return false;}
 return true;
}
function draw(now){
 raf=0;if(!canvas.isConnected)return;
 const box=canvas.getBoundingClientRect();
 if(box.bottom>0&&box.top<innerHeight&&box.width){
  // ponytail: fixed half-ish resolution, the flame is soft so upscaling is invisible; add adaptive scaling if low-end GPUs stutter
  const k=Math.min(devicePixelRatio||1,2)*.55,w=Math.round(box.width*k),hh=Math.round(box.height*k);
  if(canvas.width!==w||canvas.height!==hh){canvas.width=w;canvas.height=hh;gl.viewport(0,0,w,hh);}
  state.yaw+=(state.ty-state.yaw)*.06;state.pitch+=(state.tp-state.pitch)*.06;
  gl.uniform2f(U.R,w,hh);gl.uniform1f(U.T,now/1000);gl.uniform1f(U.G,state.g);gl.uniform1f(U.I,state.i);gl.uniform2f(U.C,state.yaw,state.pitch);
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,3);
 }
 if(!calm)raf=requestAnimationFrame(draw);
}
const kick=()=>{if(!raf&&canvas?.isConnected)raf=requestAnimationFrame(draw);};
function tween(key,to,ms,done){const from=state[key],t0=performance.now(),id=tween[key]=Symbol();
 (function step(now){if(tween[key]!==id)return;const x=Math.min((now-t0)/ms,1),e=x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;state[key]=from+(to-from)*e;sync();x<1?requestAnimationFrame(step):done?.();})(t0);}
function sync(){
 const dial=document.querySelector('#gravity-dial'),hud=document.querySelector('.gravity-hud');if(!dial||!hud)return;
 const g=state.g,zone=g>.97?'earth':g<.03?'micro':'gap';
 if(document.activeElement!==dial)dial.value=String(1-g);
 hud.dataset.zone=zone;hud.querySelector('output').textContent=g.toFixed(2);
 const copy={earth:['Earth gravity','Hot gas rises. Buoyancy pulls fresh oxygen in at the base and stretches the flame upward.'],micro:['Microgravity','Nothing rises. Oxygen arrives only by diffusion, so the flame settles into a dim blue sphere.'],gap:['Partial gravity · no data here','No lunar or Martian combustion records are in this collection. This shape is a drawn guess, hatched so it cannot pass for evidence.']}[zone];
 hud.querySelector('b').textContent=copy[0];hud.querySelector('p').textContent=copy[1];dial.setAttribute('aria-valuetext',g.toFixed(2)+' g, '+copy[0]);
}
function mountFlame(){
 const field=document.querySelector('.gl-stage');if(!field||field.querySelector('.flame-gl'))return;
 if(gl===undefined&&!initGL())return;if(!gl)return;
 field.prepend(canvas);
 field.insertAdjacentHTML('beforeend','<div class="gravity-hud"><span class="hud-label">GRAVITY</span><div class="hud-value"><output for="gravity-dial">1.00</output><i>g</i></div><b></b><p></p></div><div class="gravity-dial"><input id="gravity-dial" type="range" autocomplete="off" min="0" max="1" step="0.01" value="0" aria-label="Gravity, from Earth to microgravity"><div class="dial-ticks" aria-hidden="true"><span data-at="earth">EARTH<br>1 g</span><span data-at="mars">MARS<br>no data</span><span data-at="moon">MOON<br>no data</span><span data-at="micro">ISS<br>µg</span></div><small>Drag to remove gravity. An illustration of flame shape, not a simulation or a measurement.</small></div>');
 sync();kick();
 // play the gravity release the first time the stage is mostly on screen
 if(!state.played){const io=new IntersectionObserver(([e])=>{if(!e.isIntersecting||state.played)return;state.played=true;io.disconnect();tween('i',1,900);state.timer=setTimeout(()=>tween('g',0,3200),1400);},{threshold:.55});io.observe(field);}
}
document.addEventListener('input',e=>{if(e.target.id!=='gravity-dial')return;clearTimeout(state.timer);tween.g=null;state.i=1;state.g=1-Number(e.target.value);sync();kick();});
document.addEventListener('pointermove',e=>{
 const field=e.target.closest?.('.mission-hero');
 if(field){const b=field.getBoundingClientRect();state.ty=((e.clientX-b.left)/b.width-.5)*1.3;state.tp=.12-((e.clientY-b.top)/b.height-.5)*.9;}
 if(calm||e.pointerType==='touch')return;
 const card=e.target.closest?.('.card,.route-card');
 if(tilted&&tilted!==card){tilted.style.removeProperty('--rx');tilted.style.removeProperty('--ry');}
 if(card){const b=card.getBoundingClientRect();card.style.setProperty('--ry',((e.clientX-b.left)/b.width-.5)*7+'deg');card.style.setProperty('--rx',(.5-(e.clientY-b.top)/b.height)*6+'deg');}
 tilted=card;
},{passive:true});
let tilted=null;

/* ---------- scroll reveals + count-ups ---------- */
const REVEAL='.gravity-lab-copy>*,.dash-insight,.gap-matrix,.page-head,.panel,.card,.route-card,.source-card,.notice,.searchbar,.empty,.hero-copy>*,.planner-head,.planner-choice,.planner-response,.evidence-intro>*,.product-copy,.product-preview,.use-cases>*,.ledger-title,.ledger-stats>div,.briefing-note,.research-banner';
const seen=new IntersectionObserver(entries=>{
 entries.filter(e=>e.isIntersecting).forEach((e,i)=>{const el=e.target;seen.unobserve(el);el.classList.remove('rv');
  el.animate([{opacity:0,transform:'translateY(26px)'},{opacity:1,transform:'none'}],{duration:760,delay:Math.min(i,8)*70,easing:ease,fill:'backwards'});
  const num=el.matches('.ledger-stats>div')&&el.querySelector('strong');const end=num&&Number(num.textContent);
  if(end){const t0=performance.now()+i*70;(function tick(now){const x=Math.min(Math.max((now-t0)/1100,0),1);num.textContent=Math.round(end*(1-Math.pow(1-x,3)));if(x<1)requestAnimationFrame(tick);})(t0);}
 });
},{rootMargin:'0px 0px -8% 0px'});
function arm(){
 mountFlame();if(calm)return;
 // skip anything nested in an element that is already revealing, and anything inside the drawer
 for(const el of page.querySelectorAll(REVEAL)){if(el.dataset.rv)continue;el.dataset.rv='1';if(el.parentElement.closest('[data-rv]'))continue;el.classList.add('rv');seen.observe(el);}
}
new MutationObserver(arm).observe(page,{childList:true,subtree:true});arm();
})();
