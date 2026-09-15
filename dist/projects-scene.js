import * as THREE from './vendor/three.module.min.js';

const host=document.querySelector('#cloud-stage');
const canvas=document.querySelector('#project-cloud');
const labelsHost=document.querySelector('#orbit-labels');
const button=document.querySelector('#project-motion');
const fallback=document.querySelector('#cloud-fallback');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let renderer, frame=0, lost=false;
function fail(error){cancelAnimationFrame(frame);frame=0;lost=true;button.hidden=true;labelsHost.hidden=true;fallback.hidden=false;console.warn('Project cloud unavailable.',error);}

try {
 renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.25:1.6));
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(39,1,.1,50);
 camera.position.z=9;
 const volume=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
  uniforms:{time:{value:0},eye:{value:camera.position.clone()}},
  vertexShader:`varying vec3 localPosition;void main(){localPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`precision highp float;
   varying vec3 localPosition;uniform vec3 eye;uniform float time;
   float hash4(vec4 p){p=fract(p*vec4(.1031,.1030,.0973,.1099));p+=dot(p,p.wzxy+33.33);return fract((p.x+p.y)*(p.z+p.w));}
   float slice4(vec4 i,vec3 f){
    return mix(mix(mix(hash4(i),hash4(i+vec4(1,0,0,0)),f.x),mix(hash4(i+vec4(0,1,0,0)),hash4(i+vec4(1,1,0,0)),f.x),f.y),
     mix(mix(hash4(i+vec4(0,0,1,0)),hash4(i+vec4(1,0,1,0)),f.x),mix(hash4(i+vec4(0,1,1,0)),hash4(i+vec4(1,1,1,0)),f.x),f.y),f.z);
   }
   // Interpolate 16 independent lattice corners in x, y, z and time.
   // Quintic interpolation keeps motion smooth across temporal cell boundaries.
   float noise4(vec4 p){vec4 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);return mix(slice4(i,f.xyz),slice4(i+vec4(0,0,0,1),f.xyz),f.w);}
   float mist(vec4 q){return noise4(q)*.57+noise4(q*2.03)*.28+noise4(q*4.07)*.15;}
   void main(){vec3 ray=normalize(localPosition-eye);float b=dot(eye,ray),h=b*b-dot(eye,eye)+4.;if(h<0.)discard;
    float root=sqrt(h),start=-b-root,stepSize=root*2./48.;float alpha=0.;vec3 light=vec3(0.);
    // A ten-second breath with gentle, continuous acceleration at each turn.
    float breath=sin(time*.62831853);
    float expansion=1.+breath*.065;
    for(int i=0;i<48;i++){
     vec3 p=(eye+ray*(start+(float(i)+.5)*stepSize))/expansion;
     float angle=p.y*.8+time*.065;float c=cos(angle),s=sin(angle);
     vec3 q=vec3(c*p.x-s*p.z,p.y,s*p.x+c*p.z)*1.8;
     vec3 sway=vec3(sin(time*.18),cos(time*.15),sin(time*.12))*.12;
     float evolution=time*.075;
     float warp=noise4(vec4(q*.7+sway,evolution*.7));
     float n=mist(vec4(q+vec3(warp)*.9+sway,evolution));
     float envelope=1.-smoothstep(.65,1.85,length(p*vec3(1.,1.12,1.)));
     float density=smoothstep(.28,.72,n)*envelope*(1.+breath*.07);
     float a=1.-exp(-density*stepSize*1.55);
     vec3 color=mix(vec3(.35,.23,.12),vec3(1.,.89,.69),smoothstep(.32,.72,n+p.y*.08));
     light+=(1.-alpha)*a*color;alpha+=(1.-alpha)*a;
    }
    gl_FragColor=vec4(light/max(alpha,.001)*1.25,alpha*.85);
   }`
 });
 scene.add(new THREE.Mesh(new THREE.SphereGeometry(2,48,32),volume));
 // Each circular orbit has its own plane through the centre of the cloud.
 // The paths and labels use exactly the same transformed world coordinates.
 const lanes=[
  {rotation:new THREE.Euler(1.0,.3,-.5),radius:2.7,speed:.055},
  {rotation:new THREE.Euler(.85,-.45,.8),radius:2.8,speed:-.045},
  {rotation:new THREE.Euler(.9,.3,2.0),radius:2.9,speed:.04},
 ];
 const point=new THREE.Vector3();
 function orbitPoint(angle,lane,target){return target.set(Math.cos(angle)*lane.radius,Math.sin(angle)*lane.radius,0).applyEuler(lane.rotation);}
 for(const lane of lanes){
  const points=Array.from({length:181},(_,i)=>orbitPoint(i/180*Math.PI*2,lane,new THREE.Vector3()));
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xc7a06c,transparent:true,opacity:.16,depthWrite:false}));scene.add(line);
 }
 const projects=[...document.querySelectorAll('[data-project-name]')].map(el=>({name:el.textContent,type:Number(el.dataset.projectType)}));
 const assigned=[0,0,0];
 const labels=projects.map(({name,type})=>{
  const count=projects.filter(project=>project.type===type).length;
  const el=document.createElement('span');el.className='orbit-name';el.textContent=name;labelsHost.append(el);
  return {el,lane:lanes[type],phase:assigned[type]++/count*Math.PI*2+type*.6};
 });
 let paused=reduced.matches,visible=true,elapsed=0,last=0,w=1,h=1;
 function draw(){
  volume.uniforms.time.value=elapsed;
  renderer.render(scene,camera);
  for(const {el,lane,phase} of labels){
   orbitPoint(phase+elapsed*lane.speed,lane,point);
   const depth=point.z;point.project(camera);
   // Project the same coordinates as the paths; fit the camera on resize.
   const proximity=THREE.MathUtils.clamp((depth+lane.radius)/(2*lane.radius),0,1);
   const scale=.82+proximity*.25;
   const x=(point.x*.5+.5)*w;
   const y=(-point.y*.5+.5)*h;
   el.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%) scale(${scale})`;
   el.style.opacity=String(.42+proximity*.58);
   el.style.zIndex=String(Math.round(proximity*100));
  }
 }
 function tick(now){frame=0;if(paused||!visible||document.hidden||lost)return;elapsed+=Math.min((now-last)/1000,.05);last=now;draw();frame=requestAnimationFrame(tick);}
 function start(){if(!frame&&!paused&&visible&&!document.hidden&&!lost){last=performance.now();frame=requestAnimationFrame(tick);}}
 function stop(){cancelAnimationFrame(frame);frame=0;}
 function sync(){button.textContent=paused?'Resume motion':'Pause motion';button.setAttribute('aria-pressed',String(paused));}
 function resize(){
  w=host.clientWidth;h=host.clientHeight;if(!w||!h||lost)return;
  renderer.setSize(w,h,false);camera.aspect=w/h;
  const widest=Math.max(...labels.map(({el})=>el.offsetWidth))*1.07;
  const usable=Math.max(.25,(w-widest-24)/w);
  const fit=2.9/(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect*usable);
  camera.position.z=Math.max(9,Math.sqrt(2.9*2.9+fit*fit));
  camera.updateProjectionMatrix();volume.uniforms.eye.value.copy(camera.position);draw();
 }
 button.hidden=false;button.addEventListener('click',()=>{paused=!paused;sync();paused?stop():start();});
 reduced.addEventListener('change',e=>{paused=e.matches;sync();paused?stop():start();});
 document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;visible?start():stop();}).observe(host);
 new ResizeObserver(resize).observe(host);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('WebGL context lost');});
 canvas.addEventListener('webglcontextrestored',()=>{lost=false;labelsHost.hidden=false;fallback.hidden=true;button.hidden=false;resize();start();});
 resize();sync();start();
} catch(error){fail(error);}
