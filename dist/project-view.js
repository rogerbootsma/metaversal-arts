import * as THREE from './vendor/three.module.min.js';

// Move the camera, leaving every moon, ring and density field in world space.
export function createOrbitView(camera,onChange=()=>{}){
 let yaw=0,pitch=Math.PI/2,distance=9,baseZoom=1,zoom=1;
 function apply(){
  camera.position.setFromSphericalCoords(distance,pitch,yaw);
  camera.lookAt(0,0,0);camera.zoom=baseZoom*zoom;
  camera.updateProjectionMatrix();camera.updateMatrixWorld();
 }
 return {
  get zoom(){return zoom;},
  setFraming(radius,magnification){distance=radius;baseZoom=magnification;apply();},
  rotate(horizontal,vertical){
   yaw=(yaw-horizontal)%(Math.PI*2);
   pitch=THREE.MathUtils.clamp(pitch-vertical,.08,Math.PI-.08);
   apply();onChange();
  },
  zoomBy(factor){zoom=THREE.MathUtils.clamp(zoom*factor,.5,2);apply();onChange();},
  reset(){yaw=0;pitch=Math.PI/2;zoom=1;apply();onChange();},
 };
}

export function bindOrbitInput(canvas,view,{onDragChange=()=>{},onInteraction=()=>{}}={}){
 let pointer=null,x=0,y=0;
 function finish(){
  if(pointer===null)return;
  const id=pointer;pointer=null;
  if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
  onDragChange(false);
 }
 canvas.addEventListener('pointerdown',event=>{
  // Touch retains native page scrolling; project links live above the canvas.
  if(event.pointerType!=='mouse'||event.button!==0||pointer!==null)return;
  event.preventDefault();onInteraction();canvas.focus({preventScroll:true});
  pointer=event.pointerId;x=event.clientX;y=event.clientY;
  canvas.setPointerCapture(pointer);onDragChange(true);
 });
 canvas.addEventListener('pointermove',event=>{
  if(event.pointerId!==pointer)return;
  if(!(event.buttons&1)){finish();return;}
  const sensitivity=2*Math.PI/Math.max(canvas.clientWidth,canvas.clientHeight,1);
  view.rotate((event.clientX-x)*sensitivity,(event.clientY-y)*sensitivity);
  x=event.clientX;y=event.clientY;
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,event=>{if(event.pointerId===pointer)finish();});
 canvas.addEventListener('blur',finish);
 canvas.ownerDocument.defaultView.addEventListener('blur',finish);
 canvas.addEventListener('wheel',event=>{
  // Preserve browser/trackpad page zoom gestures.
  if(event.ctrlKey||event.metaKey)return;
  event.preventDefault();onInteraction();
  const unit=event.deltaMode===1?16:event.deltaMode===2?canvas.clientHeight:1;
  view.zoomBy(Math.exp(-THREE.MathUtils.clamp(event.deltaY*unit,-160,160)*.0018));
 },{passive:false});
 canvas.addEventListener('keydown',event=>{
  if(event.altKey||event.ctrlKey||event.metaKey)return;
  const actions={ArrowLeft:()=>view.rotate(-.12,0),ArrowRight:()=>view.rotate(.12,0),ArrowUp:()=>view.rotate(0,-.12),ArrowDown:()=>view.rotate(0,.12),'+':()=>view.zoomBy(1.2),'=':()=>view.zoomBy(1.2),'-':()=>view.zoomBy(1/1.2),r:()=>view.reset(),Home:()=>view.reset()};
  if(actions[event.key]){event.preventDefault();onInteraction();actions[event.key]();}
 });
 return {cancel:finish};
}
