import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from './dist/vendor/three.module.min.js';
import {createOrbitView,bindOrbitInput} from './dist/project-view.js';

const near=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('camera can orbit behind the planet, with valid projection and reversed depth',()=>{
 const camera=new THREE.PerspectiveCamera(49,1,.1,80),view=createOrbitView(camera);
 view.setFraming(14,1.8);
 const moon=new THREE.Vector3(1,0,3);
 const front=moon.clone().applyMatrix4(camera.matrixWorldInverse).z;
 view.rotate(Math.PI,0);
 const back=moon.clone().applyMatrix4(camera.matrixWorldInverse).z;
 near(camera.position.length(),14);assert(front>back);
 near(new THREE.Vector3().project(camera).x,0);near(new THREE.Vector3().project(camera).y,0);
 for(const vertical of [100,-200]){
  view.rotate(.4,vertical);
  assert(camera.matrixWorldInverse.elements.every(Number.isFinite));
  near(new THREE.Vector3().project(camera).x,0);near(new THREE.Vector3().project(camera).y,0);
 }
});
test('zoom spans exactly half to double and survives resize; reset restores the view',()=>{
 const camera=new THREE.PerspectiveCamera(),view=createOrbitView(camera);
 view.setFraming(14,1.8);
 const sample=new THREE.Vector3(1,0,0),original=sample.clone().project(camera).x;
 view.zoomBy(100);near(sample.clone().project(camera).x,original*2);near(view.zoom,2);
 view.zoomBy(.0001);near(sample.clone().project(camera).x,original*.5);near(view.zoom,.5);
 view.rotate(.8,.3);const direction=camera.position.clone().normalize();
 view.setFraming(25,1.15);near(view.zoom,.5);near(camera.position.clone().normalize().distanceTo(direction),0);
 view.reset();near(camera.position.x,0);near(camera.position.z,25);near(camera.zoom,1.15);
});
class Canvas extends EventTarget{
 constructor(){super();this.clientWidth=1000;this.clientHeight=700;this.ownerDocument={defaultView:new EventTarget()};this.captured=null;}
 focus(){} setPointerCapture(id){this.captured=id;} hasPointerCapture(id){return this.captured===id;} releasePointerCapture(){this.captured=null;}
}
function send(target,type,props={}){const event=new Event(type,{cancelable:true});Object.assign(event,props);target.dispatchEvent(event);return event;}
test('only left mouse drag rotates; cancel and window blur release capture',()=>{
 const canvas=new Canvas(),camera=new THREE.PerspectiveCamera(),view=createOrbitView(camera),dragging=[];
 view.setFraming(14,1.8);bindOrbitInput(canvas,view,{onDragChange:v=>dragging.push(v)});
 for(const props of [{pointerType:'touch',button:0},{pointerType:'mouse',button:2}]){
  send(canvas,'pointerdown',{...props,pointerId:1,clientX:10,clientY:10});
  send(canvas,'pointermove',{pointerId:1,buttons:1,clientX:200,clientY:10});near(camera.position.x,0);
 }
 for(const end of ['pointercancel','blur']){
  send(canvas,'pointerdown',{pointerType:'mouse',button:0,pointerId:1,clientX:10,clientY:10});
  send(canvas,'pointermove',{pointerId:1,buttons:1,clientX:200,clientY:10});assert(Math.abs(camera.position.x)>1);
  send(end==='blur'?canvas.ownerDocument.defaultView:canvas,end,{pointerId:1});
  const position=camera.position.clone();
  send(canvas,'pointermove',{pointerId:1,buttons:1,clientX:300,clientY:100});near(position.distanceTo(camera.position),0);assert.equal(canvas.captured,null);
 }
 assert.deepEqual(dragging,[true,false,true,false]);
});
test('wheel and keyboard zoom are bounded without hijacking browser zoom',()=>{
 const canvas=new Canvas(),view=createOrbitView(new THREE.PerspectiveCamera());bindOrbitInput(canvas,view);
 assert(send(canvas,'wheel',{deltaY:-100,deltaMode:0}).defaultPrevented);assert(view.zoom>1);
 const zoom=view.zoom;assert(!send(canvas,'wheel',{deltaY:100,deltaMode:0,ctrlKey:true}).defaultPrevented);near(view.zoom,zoom);
 for(let i=0;i<20;i++)send(canvas,'keydown',{key:'+'});near(view.zoom,2);
 for(let i=0;i<20;i++)send(canvas,'keydown',{key:'-'});near(view.zoom,.5);
 send(canvas,'keydown',{key:'r'});near(view.zoom,1);
});
