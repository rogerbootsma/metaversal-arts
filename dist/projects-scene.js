import * as THREE from './vendor/three.module.min.js';
import {createPlanetVolume} from './planet-volume.js?v=atmosphere-20260917-1';
import {createProjectHub,projectHubs} from './project-links.js?v=atmosphere-20260917-1';
import {createProjectMoon,createOrbitParticles} from './project-moons.js?v=atmosphere-20260917-1';
import {projectOrbit} from './project-orbits.js?v=atmosphere-20260917-1';

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
 const camera=new THREE.PerspectiveCamera(49,1,.1,80);
 camera.position.z=9;
 // Each circular orbit has its own plane through the centre of the planet.
 // The paths and labels use exactly the same transformed world coordinates.
 const projects=[...document.querySelectorAll('[data-project-name]')].map(el=>({name:el.textContent,type:Number(el.dataset.projectType)}));
 const lanes=projects.map((project,index)=>{const orbit=projectOrbit(index);return {...orbit,type:project.type,rotation:new THREE.Euler(orbit.tilt,0,orbit.turn,orbit.rotationOrder)};});
 const volume=createPlanetVolume(camera,lanes);
 scene.add(new THREE.Mesh(new THREE.SphereGeometry(volume.uniforms.bound.value,64,48),volume));
 const outerRadius=Math.max(...lanes.map(lane=>lane.radius+Math.max(lane.width,.23)));
 const point=new THREE.Vector3();
 function orbitPoint(angle,lane,target,radius=lane.radius){return target.set(Math.cos(angle)*radius,Math.sin(angle)*radius,0).applyEuler(lane.rotation);}
 for(const [index,lane] of lanes.entries()){
  // Sparse motes share this project's plane; they never steer the label.
  const dustPositions=new Float32Array(560*3);
  for(let i=0;i<560;i++){
   const angle=i*2.3999632297,offset=Math.sin(i*127.1+lane.radius)*lane.width*.48;
   const mote=new THREE.Vector3(Math.cos(angle)*(lane.radius+offset),Math.sin(angle)*(lane.radius+offset),Math.sin(i*73.7)*.045);
   mote.toArray(dustPositions,i*3);
  }
  const dust=createOrbitParticles(dustPositions,camera,[0xd5bd8e,0x98c2ca,0xc59c87][lane.type],22,.48);
  dust.mesh.rotation.copy(lane.rotation);scene.add(dust.mesh);lane.dust=dust;
  const rockSurface=createProjectMoon(index,camera);
  const rocks=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),rockSurface.material,index<2?28:10);
  const dummy=new THREE.Object3D();
  rockSurface.material.uniforms.tint.value.set(index===1?0xb6b6a2:0xcba776);
  for(let i=0;i<rocks.count;i++){
   const a=i*2.39996323+index*.51,rr=lane.radius+Math.sin(i*27.3)*lane.width*.42;
   dummy.position.set(Math.cos(a)*rr,Math.sin(a)*rr,Math.sin(i*74.1)*.035);
   const size=.006+(Math.sin(i*81.7+index)*.5+.5)*.014;
   dummy.scale.set(size*1.6,size,size*.75);dummy.rotation.set(i*.37,i*.81,i*.23);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);
  }
  rockSurface.mesh.geometry.dispose();rocks.rotation.copy(lane.rotation);rocks.renderOrder=2;scene.add(rocks);lane.rocks=rocks;
  const moon=createProjectMoon(index,camera);scene.add(moon.mesh);lane.moon=moon;
  if(index%3===0){
   const comet=createOrbitParticles(new Float32Array(42*3),camera,[0xf0d7ab,0x99cad6,0xe3b28a][(index/3)%3],65,.7);
   scene.add(comet.mesh);lane.comet=comet;
  }

 }
 let choosing=false;
 const hubs=new Map(),openHubs=new Set();
 const labels=projects.map(({name,type},index)=>{
  const el=document.createElement('span');el.className='orbit-name';el.dataset.type=type;el.textContent=name;el.setAttribute('aria-hidden','true');labelsHost.append(el);
  if(projectHubs[name]){
   const hub=createProjectHub(el,open=>{
    if(open){openHubs.add(el);for(const [node,other] of hubs)if(node!==el)other.dismiss();}else openHubs.delete(el);
    choosing=openHubs.size>0;host.classList.toggle('is-choosing',choosing);
    if(choosing){stop();if(open){el.style.opacity='1';el.style.zIndex='2000';}}else{draw();start();}
   },projectHubs[name]);
   hubs.set(el,hub);
  }
  const leader=document.createElementNS('http://www.w3.org/2000/svg','line');
  const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('r','1.7');connectors.append(leader,dot);
  return {el,leader,dot,type,lane:lanes[index],phase:lanes[index].phase};
 });
 let paused=reduced.matches,visible=true,elapsed=0,last=0,w=1,h=1,selected=null,hovered=null;
 const ray=new THREE.Vector3();
 function transmission(worldPoint){
  ray.copy(worldPoint).sub(camera.position);const distance=ray.length();ray.divideScalar(distance);
  const b=camera.position.dot(ray),hit=b*b-camera.position.lengthSq()+2.8224;
  if(hit<=0)return 1;
  const root=Math.sqrt(hit),path=Math.max(0,Math.min(distance,-b+root)-Math.max(0,-b-root));
  return Math.exp(-path*24.);
 }
 function draw(){
  volume.uniforms.time.value=elapsed;
  const active=hovered??selected;
  lanes.forEach((lane,index)=>{
   const emphasis=active===null?1:active===lane.type?1.35:.22;
   const drift=1.+Math.sin(elapsed*.18+index*.83)*.07;
   volume.uniforms.ringStrength.value[index]=emphasis*lane.opacity*drift;
   lane.dust.material.uniforms.strength.value=.48*emphasis*Math.sqrt(lane.opacity)*drift;
   lane.dust.mesh.rotation.copy(lane.rotation);lane.dust.mesh.rotateZ(elapsed*lane.speed*.4);
   lane.rocks.rotation.copy(lane.rotation);lane.rocks.rotateZ(elapsed*lane.speed*.4);
   lane.rocks.material.uniforms.strength.value=active===null||active===lane.type?1:.28;
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
   const scale=THREE.MathUtils.clamp(.95+(camera.position.z/(camera.position.z-depth)-1)*.32,.87,1.18);
   const x=(point.x*.5+.5)*w;
   const y=(-point.y*.5+.5)*h+20;
   const isHub=el.classList.contains('project-hub');
   const opacity=isHub&&openHubs.has(el)?1:(.76+proximity*.24)*(isHub?Math.max(.65,throughMist):throughMist)*(active===null||active===type?1:.22);
   positions.push({label,x,y,scale,opacity,depth,height:el.offsetHeight*scale});
  }
  // No screen-space avoidance, clamping or easing: names stay on their paths.
  // At a crossing, absolute camera depth determines which name is in front.
  for(const {label,x,y,scale,opacity,depth,height} of positions){
   const {el,leader,dot}=label;
   el.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%) scale(${scale})`;
   el.style.opacity=String(opacity);el.style.zIndex=String(openHubs.has(el)?2000:Math.round((depth+outerRadius)*100));
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
  // Fit the actual tilted paths instead of a bounding sphere. This preserves
  // a closer camera and stronger near/far perspective while keeping names inside.
  let cameraDistance=8;
  for(const lane of lanes)for(let sample=0;sample<120;sample++){
   orbitPoint(sample*Math.PI*2/120,lane,point,lane.framingRadius);
   cameraDistance=Math.max(cameraDistance,
    point.z+(Math.abs(point.x)+.18)/(tangent*camera.aspect*usableX),
    point.z+(Math.abs(point.y)+.18)/(tangent*usableY));
  }
  camera.position.z=cameraDistance;
  // Desktop is deliberately immersive: outer paths may pass beyond the frame.
  // Narrow screens ease toward the overview so the centre remains legible.
  camera.zoom=THREE.MathUtils.lerp(1.15,1.8,THREE.MathUtils.clamp((w-380)/320,0,1));

  camera.updateProjectionMatrix();volume.uniforms.eye.value.copy(camera.position);lanes.forEach(lane=>{
   lane.rocks.material.uniforms.eye.value.copy(camera.position);
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
