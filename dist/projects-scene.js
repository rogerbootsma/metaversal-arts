import * as THREE from './vendor/three.module.min.js';

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
     vec3 q=vec3(c*p.x-s*p.z,p.y,s*p.x+c*p.z)*2.5;
     vec3 sway=vec3(sin(time*.18),cos(time*.15),sin(time*.12))*.12;
     float evolution=time*.075;
     float warp=noise4(vec4(q*.7+sway,evolution*.7));
     float n=mist(vec4(q+vec3(warp)*.9+sway,evolution));
     float radius=length(p*vec3(1.,1.05,1.));
     float envelope=1.-smoothstep(.95,1.87,radius);
     float density=smoothstep(.32,.68,n)*envelope*(1.+breath*.07);
     float a=1.-exp(-density*stepSize*1.8);
     float core=exp(-radius*radius*1.1);
     float filament=smoothstep(.46,.66,n);
     float illumination=clamp(.4+p.y*.2+p.z*.17+filament*.6,0.,1.);
     vec3 color=mix(vec3(.13,.09,.045),vec3(1.,.89,.71),illumination);
     color+=vec3(1.,.92,.78)*core*(.5+filament*.8);
     light+=(1.-alpha)*a*color;alpha+=(1.-alpha)*a;
    }
    vec3 radiance=light/max(alpha,.001);
    gl_FragColor=vec4(vec3(1.)-exp(-radiance*1.35),alpha*.94);
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
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
   uniforms:{eye:{value:camera.position.clone()},strength:{value:.32}},
   vertexShader:`varying vec3 worldPoint;void main(){worldPoint=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(worldPoint,1.);}`,
   fragmentShader:`uniform vec3 eye;uniform float strength;varying vec3 worldPoint;
    void main(){vec3 delta=worldPoint-eye;float distanceToPoint=length(delta);vec3 ray=delta/distanceToPoint;float b=dot(eye,ray);float h=b*b-dot(eye,eye)+2.56;float transmission=1.;
     if(h>0.){float root=sqrt(h);float path=max(0.,min(distanceToPoint,-b+root)-max(0.,-b-root));transmission=exp(-path*1.4);}
     float front=smoothstep(-2.9,2.9,worldPoint.z);gl_FragColor=vec4(vec3(.89,.69,.4),strength*(.6+.4*front)*transmission);}`});
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),material);line.renderOrder=2;scene.add(line);lane.material=material;
 }
 const projects=[...document.querySelectorAll('[data-project-name]')].map(el=>({name:el.textContent,type:Number(el.dataset.projectType)}));
 const assigned=[0,0,0];
 const labels=projects.map(({name,type})=>{
  const count=projects.filter(project=>project.type===type).length;
  const el=document.createElement('span');el.className='orbit-name';el.dataset.type=type;el.textContent=name;labelsHost.append(el);
  const leader=document.createElementNS('http://www.w3.org/2000/svg','line');
  const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('r','1.7');connectors.append(leader,dot);
  return {el,leader,dot,type,lane:lanes[type],phase:assigned[type]++/count*Math.PI*2+type*.6,displayY:null};
 });
 let paused=reduced.matches,visible=true,elapsed=0,last=0,w=1,h=1,selected=null,hovered=null;
 const ray=new THREE.Vector3();
 function transmission(worldPoint){
  ray.copy(worldPoint).sub(camera.position);const distance=ray.length();ray.divideScalar(distance);
  const b=camera.position.dot(ray),hit=b*b-camera.position.lengthSq()+2.56;
  if(hit<=0)return 1;
  const root=Math.sqrt(hit),path=Math.max(0,Math.min(distance,-b+root)-Math.max(0,-b-root));
  return Math.exp(-path*1.4);
 }
 function draw(){
  volume.uniforms.time.value=elapsed;
  const active=hovered??selected;
  lanes.forEach((lane,i)=>{lane.material.uniforms.strength.value=active===null?.32:active===i?.85:.1;});
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
   const y=(-point.y*.5+.5)*h;
   const opacity=(.76+proximity*.24)*throughMist*(active===null||active===type?1:.22);
   positions.push({label,x,y,targetY:y,scale,opacity,proximity,width:el.offsetWidth*scale,height:el.offsetHeight*scale});
  }
  // Keep the orbit anchor exact. Ease annotations apart with fine leader lines.
  const ordered=positions.filter(p=>p.opacity>.16).sort((a,b)=>a.y-b.y);
  for(let pass=0;pass<3;pass++)for(let i=0;i<ordered.length;i++)for(let j=i+1;j<ordered.length;j++){
   const a=ordered[i],b=ordered[j];
   if(Math.abs(a.x-b.x)<(a.width+b.width)/2+12){
    const gap=(a.height+b.height)/2+9-(b.targetY-a.targetY);
    if(gap>0){a.targetY-=gap*.5;b.targetY+=gap*.5;}
   }
  }
  for(const {label,x,y,targetY,scale,opacity,proximity,height} of positions){
   const {el,leader,dot}=label;
   const destination=THREE.MathUtils.clamp(targetY,height/2+8,h-height/2-8);
   label.displayY=label.displayY===null||paused?destination:THREE.MathUtils.lerp(label.displayY,destination,.12);
   el.style.transform=`translate(${x}px,${label.displayY}px) translate(-50%,-50%) scale(${scale})`;
   el.style.opacity=String(opacity);el.style.zIndex=String(Math.round(proximity*100));
   leader.setAttribute('x1',x);leader.setAttribute('y1',y);leader.setAttribute('x2',x);leader.setAttribute('y2',label.displayY);
   leader.style.opacity=String(Math.abs(label.displayY-y)>5?opacity*.45:0);
   dot.setAttribute('cx',x);dot.setAttribute('cy',y);dot.style.opacity=String(opacity*.8);
  }
 }
 function tick(now){frame=0;if(paused||!visible||document.hidden||lost)return;elapsed+=Math.min((now-last)/1000,.1);last=now;draw();frame=requestAnimationFrame(tick);}
 function start(){if(!frame&&!paused&&visible&&!document.hidden&&!lost){last=performance.now();frame=requestAnimationFrame(tick);}}
 function stop(){cancelAnimationFrame(frame);frame=0;}
 function sync(){button.textContent=paused?'Resume motion':'Pause motion';button.setAttribute('aria-pressed',String(paused));}
 function resize(){
  w=host.clientWidth;h=host.clientHeight;if(!w||!h||lost)return;
  renderer.setSize(w,h,false);camera.aspect=w/h;
  const widest=Math.max(...labels.map(({el})=>el.offsetWidth))*1.06;
  const usable=Math.max(.25,(w-widest-24)/w);
  const fit=2.9/(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect*usable);
  camera.position.z=Math.max(9,Math.sqrt(2.9*2.9+fit*fit));
  camera.updateProjectionMatrix();volume.uniforms.eye.value.copy(camera.position);lanes.forEach(lane=>lane.material.uniforms.eye.value.copy(camera.position));labels.forEach(label=>label.displayY=null);draw();
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
