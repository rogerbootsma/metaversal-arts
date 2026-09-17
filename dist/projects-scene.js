import * as THREE from './vendor/three.module.min.js';
import {createPlanetVolume} from './planet-volume.js?v=granular-2';
import {createProjectHub} from './project-links.js?v=asimulation-1';
import {createProjectMoon,createOrbitParticles} from './project-moons.js?v=moons-1';
import {projectOrbit} from './project-orbits.js?v=individual-1';

const host=document.querySelector('#cloud-stage');
const canvas=document.querySelector('#project-cloud');
const labelsHost=document.querySelector('#orbit-labels');
const button=document.querySelector('#project-motion');
const fallback=document.querySelector('#cloud-fallback');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const categories=document.querySelector('.orbit-categories');
const categoryButtons=[...categories.querySelectorAll('button')];
const connectors=document.querySelector('#orbit-connectors');
let renderer, frame=0, lost=false;
function fail(error){cancelAnimationFrame(frame);frame=0;lost=true;button.hidden=true;categories.hidden=true;labelsHost.hidden=true;connectors.style.display='none';fallback.hidden=false;console.warn('Project cloud unavailable.',error);}

try {
 renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.25:1.6));
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(39,1,.1,50);
 camera.position.z=9;
 const volume=createPlanetVolume(camera);
 scene.add(new THREE.Mesh(new THREE.SphereGeometry(2.1,64,48),volume));
 // Each circular orbit has its own plane through the centre of the planet.
 // The paths and labels use exactly the same transformed world coordinates.
 const projects=[...document.querySelectorAll('[data-project-name]')].map(el=>({name:el.textContent,type:Number(el.dataset.projectType)}));
 const lanes=projects.map((project,index)=>{const orbit=projectOrbit(index);return {...orbit,type:project.type,rotation:new THREE.Euler(orbit.tilt,0,orbit.turn)};});
 const outerRadius=Math.max(...lanes.map(lane=>lane.radius+lane.width));
 const point=new THREE.Vector3();
 function orbitPoint(angle,lane,target){return target.set(Math.cos(angle)*lane.radius,Math.sin(angle)*lane.radius,0).applyEuler(lane.rotation);}
 for(const [index,lane] of lanes.entries()){
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:true,side:THREE.DoubleSide,
   uniforms:{eye:{value:camera.position.clone()},strength:{value:.19},radius:{value:lane.radius},bandWidth:{value:lane.width},tint:{value:new THREE.Color([0xdcb67d,0x8ebbc9,0xc89176][lane.type])}},
   vertexShader:`varying vec3 worldPoint;varying vec2 bandPoint;void main(){bandPoint=position.xy;worldPoint=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(worldPoint,1.);}`,
   fragmentShader:`uniform vec3 eye;uniform float strength;uniform float radius;uniform float bandWidth;uniform vec3 tint;varying vec3 worldPoint;varying vec2 bandPoint;
    void main(){vec3 delta=worldPoint-eye;float distanceToPoint=length(delta);vec3 ray=delta/distanceToPoint;float b=dot(eye,ray);float h=b*b-dot(eye,eye)+3.1329;float transmission=1.;
     if(h>0.){float root=sqrt(h);float path=max(0.,min(distanceToPoint,-b+root)-max(0.,-b-root));transmission=exp(-path*24.);}
     float band=abs(length(bandPoint)-radius)/(bandWidth*.5);
     float edge=1.-smoothstep(.55,1.,band);
     float strata=(length(bandPoint)-radius)/bandWidth;
     float attenuation=1.-smoothstep(.1,.65,fwidth(strata)*2.);
     float grain=.6+.4*cos(strata*15.)*attenuation;
     float front=smoothstep(-3.2,3.2,worldPoint.z);float alpha=strength*(.65+.35*front)*transmission*edge*grain;
     float clumps=.72+.28*sin(atan(bandPoint.y,bandPoint.x)*19.+radius*27.);
     alpha*=clumps;vec3 pearl=mix(tint,vec3(1.,.91,.75),.35+.35*cos(strata*17.));
     if(alpha<.008)discard;gl_FragColor=vec4(pearl,alpha);}`});
  const ring=new THREE.Mesh(new THREE.RingGeometry(lane.radius-lane.width*.5,lane.radius+lane.width*.5,320),material);
  ring.rotation.copy(lane.rotation);ring.renderOrder=2;scene.add(ring);lane.material=material;
  // Sparse motes share this project's plane; they never steer the label.
  const dustPositions=new Float32Array(96*3);
  for(let i=0;i<96;i++){
   const angle=i*2.3999632297,offset=Math.sin(i*127.1+lane.radius)*lane.width*1.8;
   const mote=new THREE.Vector3(Math.cos(angle)*(lane.radius+offset),Math.sin(angle)*(lane.radius+offset),Math.sin(i*73.7)*.004).applyEuler(lane.rotation);
   mote.toArray(dustPositions,i*3);
  }
  const dust=createOrbitParticles(dustPositions,camera,[0xd5bd8e,0x98c2ca,0xc59c87][lane.type],18,.25);
  scene.add(dust.mesh);lane.dust=dust;
  const moon=createProjectMoon(index,camera);scene.add(moon.mesh);lane.moon=moon;
  if(index%3===0){
   const comet=createOrbitParticles(new Float32Array(42*3),camera,[0xf0d7ab,0x99cad6,0xe3b28a][(index/3)%3],65,.7);
   scene.add(comet.mesh);lane.comet=comet;
  }

 }
 let choosing=false,hub=null;
 const labels=projects.map(({name,type},index)=>{
  const el=document.createElement('span');el.className='orbit-name';el.dataset.type=type;el.textContent=name;el.setAttribute('aria-hidden','true');labelsHost.append(el);
  if(name==='asimulation.io')hub=createProjectHub(el,open=>{choosing=open;host.classList.toggle('is-choosing',open);if(open){stop();el.style.opacity='1';el.style.zIndex='2000';}else{draw();start();}});
  const leader=document.createElementNS('http://www.w3.org/2000/svg','line');
  const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('r','1.7');connectors.append(leader,dot);
  return {el,leader,dot,type,lane:lanes[index],phase:lanes[index].phase};
 });
 let paused=reduced.matches,visible=true,elapsed=0,last=0,w=1,h=1,selected=null,hovered=null;
 const ray=new THREE.Vector3();
 function transmission(worldPoint){
  ray.copy(worldPoint).sub(camera.position);const distance=ray.length();ray.divideScalar(distance);
  const b=camera.position.dot(ray),hit=b*b-camera.position.lengthSq()+3.1329;
  if(hit<=0)return 1;
  const root=Math.sqrt(hit),path=Math.max(0,Math.min(distance,-b+root)-Math.max(0,-b-root));
  return Math.exp(-path*24.);
 }
 function draw(){
  volume.uniforms.time.value=elapsed;
  const active=hovered??selected;
  lanes.forEach((lane,index)=>{
   const emphasis=active===null?1:active===lane.type?1.35:.22;
   lane.material.uniforms.strength.value=.48*emphasis;
   lane.dust.material.uniforms.strength.value=.25*emphasis;
   lane.moon.material.uniforms.strength.value=active===null||active===lane.type?1:.28;
   orbitPoint(lane.phase+elapsed*lane.speed,lane,lane.moon.mesh.position);
   lane.moon.mesh.rotation.set(.3+index*.2,elapsed*.06+index,0.);
   if(lane.comet){
    lane.comet.material.uniforms.strength.value=.6*emphasis;
    for(let i=0;i<42;i++){
     const angle=lane.phase+1.2+elapsed*lane.speed*1.8-Math.sign(lane.speed)*i*.004;
     orbitPoint(angle,lane,point);point.toArray(lane.comet.positions.array,i*3);
    }
    lane.comet.positions.needsUpdate=true;
   }
  });
  renderer.render(scene,camera);
  const positions=[];
  for(const label of labels){
   const {el,lane,phase,type}=label;
   orbitPoint(phase+elapsed*lane.speed,lane,point);
   const depth=point.z,throughMist=transmission(point);point.project(camera);
   // Project the same coordinates as the paths; fit the camera on resize.
   const proximity=THREE.MathUtils.clamp((depth+lane.radius)/(2*lane.radius),0,1);
   const scale=.94+proximity*.12;
   const x=(point.x*.5+.5)*w;
   const y=(-point.y*.5+.5)*h+20;
   const isHub=el.classList.contains('project-hub');
   const opacity=isHub&&choosing?1:(.76+proximity*.24)*(isHub?Math.max(.65,throughMist):throughMist)*(active===null||active===type?1:.22);
   positions.push({label,x,y,scale,opacity,depth,height:el.offsetHeight*scale});
  }
  // No screen-space avoidance, clamping or easing: names stay on their paths.
  // At a crossing, absolute camera depth determines which name is in front.
  for(const {label,x,y,scale,opacity,depth,height} of positions){
   const {el,leader,dot}=label;
   el.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%) scale(${scale})`;
   el.style.opacity=String(opacity);el.style.zIndex=String(el.classList.contains('project-hub')&&choosing?2000:Math.round((depth+outerRadius)*100));
   if(el.classList.contains('project-hub')){
    const halfMenu=142*scale;
    const shift=THREE.MathUtils.clamp(x,halfMenu+10,w-halfMenu-10)-x;
    el.style.setProperty('--menu-shift',`${shift/scale}px`);
    el.classList.toggle('menu-above',y+height/2+106*scale>h-8);
   }
   leader.style.opacity='0';
   dot.setAttribute('cx',x);dot.setAttribute('cy',y);dot.style.opacity='0';
  }
 }
 function tick(now){frame=0;if(paused||choosing||!visible||document.hidden||lost)return;elapsed+=Math.min((now-last)/1000,.1);last=now;draw();frame=requestAnimationFrame(tick);}
 function start(){if(!frame&&!paused&&!choosing&&visible&&!document.hidden&&!lost){last=performance.now();frame=requestAnimationFrame(tick);}}
 function stop(){cancelAnimationFrame(frame);frame=0;}
 function sync(){button.textContent=paused?'Resume motion':'Pause motion';button.setAttribute('aria-pressed',String(paused));host.classList.toggle('motion-paused',paused);}
 function resize(){
  w=host.clientWidth;h=host.clientHeight;if(!w||!h||lost)return;
  renderer.setSize(w,h,false);camera.aspect=w/h;
  const widest=Math.max(...labels.map(({el})=>el.offsetWidth))*1.06+20;
  const tallest=Math.max(...labels.map(({el})=>el.offsetHeight))*1.06+64;
  const usableX=Math.max(.2,(w-widest)/w),usableY=Math.max(.2,(h-tallest)/h);
  const tangent=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
  const fit=Math.max(outerRadius/(tangent*camera.aspect*usableX),outerRadius/(tangent*usableY));
  camera.position.z=Math.max(7.8,Math.sqrt(outerRadius*outerRadius+fit*fit));
  camera.updateProjectionMatrix();volume.uniforms.eye.value.copy(camera.position);lanes.forEach(lane=>{
   lane.material.uniforms.eye.value.copy(camera.position);
   lane.moon.material.uniforms.eye.value.copy(camera.position);
   lane.dust.material.uniforms.eye.value.copy(camera.position);
   lane.comet?.material.uniforms.eye.value.copy(camera.position);
  });draw();
 }
 function highlight(){
  const active=hovered??selected;
  categoryButtons.forEach((control,i)=>control.setAttribute('aria-pressed',String(selected===i)));
  document.querySelectorAll('[data-project-name]').forEach(el=>{el.closest('li').classList.toggle('orbit-muted',active!==null&&Number(el.dataset.projectType)!==active);el.closest('li').classList.toggle('orbit-selected',active===Number(el.dataset.projectType));});
  if(!lost)draw();
 }
 categoryButtons.forEach((control,i)=>{
  control.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hovered=i;highlight();}});
  control.addEventListener('pointerleave',()=>{hovered=null;highlight();});
  control.addEventListener('focus',()=>{hovered=i;highlight();});
  control.addEventListener('blur',()=>{hovered=null;highlight();});
  control.addEventListener('click',()=>{selected=selected===i?null:i;hovered=null;highlight();});
 });
 categories.hidden=false;
 button.hidden=false;button.addEventListener('click',()=>{paused=!paused;sync();paused?stop():start();});
 reduced.addEventListener('change',e=>{paused=e.matches;sync();paused?stop():start();});
 document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;visible?start():stop();}).observe(host);
 new ResizeObserver(resize).observe(host);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('WebGL context lost');});
 canvas.addEventListener('webglcontextrestored',()=>{lost=false;labelsHost.hidden=false;connectors.style.display='';categories.hidden=false;fallback.hidden=true;button.hidden=false;resize();start();});
 resize();sync();start();
} catch(error){fail(error);}
