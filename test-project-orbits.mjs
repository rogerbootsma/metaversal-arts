import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from './dist/vendor/three.module.min.js';
import {projectOrbit} from './dist/project-orbits.js';

const lanes=Array.from({length:12},(_,i)=>{
 const orbit=projectOrbit(i);
 const matrix=new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(orbit.tilt,0,orbit.turn,orbit.rotationOrder));
 return {...orbit,matrix,normal:new THREE.Vector3(0,0,1).transformDirection(matrix)};
});
test('project planes differ in world space, not just their Euler values',()=>{
 for(let i=0;i<lanes.length;i++)for(let j=i+1;j<lanes.length;j++){
  assert(Math.abs(lanes[i].normal.dot(lanes[j].normal))<.9999,`planes ${i} and ${j} coincide`);
 }
});
test('most paths cross the planet silhouette on both front and back arcs',()=>{
 let crossing=0;
 for(const lane of lanes){
  let front=false,back=false;
  for(let k=0;k<360;k++){
   const a=k*Math.PI/180,p=new THREE.Vector3(Math.cos(a)*lane.radius,Math.sin(a)*lane.radius,0).applyMatrix4(lane.matrix);
   assert(Math.abs(p.length()-lane.radius)<1e-9);
   const q=p.clone().applyMatrix4(lane.matrix.clone().invert());
   assert(Math.abs(q.z)<1e-9,'moon leaves its volume ring plane');
   if(Math.hypot(p.x,p.y)<1.68){front||=p.z>0;back||=p.z<0;}
  }
  if(front&&back)crossing++;
 }
 assert(crossing>=8,`only ${crossing} paths cross the planetary silhouette`);
});
