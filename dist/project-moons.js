import * as THREE from './vendor/three.module.min.js';

// Analytic opaque-body occlusion also works with the raymarched planet.
const occultation=`
 float planetVisibility(vec3 p){vec3 delta=p-eye;float d=length(delta);vec3 ray=delta/d;
 float b=dot(eye,ray),h=b*b-dot(eye,eye)+3.1329;
 if(h>0.&&-b-sqrt(h)<d)return 0.;return 1.;}
`;
export function createProjectMoon(index,camera){
 const palette=[0xd9bc88,0x7fc0c1,0xb88a71,0xa3aabc,0xd2b59a,0xbbaa86];
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:true,
  uniforms:{eye:{value:camera.position.clone()},tint:{value:new THREE.Color(palette[index%palette.length])},seed:{value:index*13.71},strength:{value:1}},
  vertexShader:`varying vec3 worldPoint;varying vec3 localPoint;varying vec3 worldNormal;
   void main(){localPoint=position;worldPoint=(modelMatrix*vec4(position,1.)).xyz;worldNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*vec4(worldPoint,1.);}`,
  fragmentShader:`uniform vec3 eye;uniform vec3 tint;uniform float seed;uniform float strength;varying vec3 worldPoint;varying vec3 localPoint;varying vec3 worldNormal;
   ${occultation}
   float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
   float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
   void main(){if(planetVisibility(worldPoint)<.5)discard;
    vec3 q=normalize(localPoint);float n=noise(q*7.+seed),fine=noise(q*31.+seed);
    float bands=.5+.5*sin(q.y*(12.+mod(seed,9.))+n*8.);
    float pits=smoothstep(.25,.58,fine);vec3 base=tint*mix(.32,1.1,n*.35+pits*.45+bands*.2);
    float diffuse=max(dot(normalize(worldNormal),normalize(vec3(-.65,.65,1.))),0.);
    vec3 color=base*(.14+diffuse*1.2);color+=vec3(.14,.17,.17)*pow(1.-max(dot(normalize(worldNormal),normalize(eye-worldPoint)),0.),3.);
    gl_FragColor=vec4(color,strength);
   }`
 });
 const radius=.060+(index%4)*.012;
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(radius,28,20),material);
 mesh.renderOrder=1;
 return {mesh,material,radius};
}

// Soft three-dimensional particles, not a simulated gaseous volume.
export function createOrbitParticles(positions,camera,color,size,opacity){
 const count=positions.length/3;
 const geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(positions,3));
 geometry.setAttribute('weight',new THREE.BufferAttribute(Float32Array.from({length:count},(_,i)=>1-i/count),1));
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
  uniforms:{eye:{value:camera.position.clone()},tint:{value:new THREE.Color(color)},size:{value:size},strength:{value:opacity},pixelRatio:{value:Math.min(devicePixelRatio,1.6)}},
  vertexShader:`uniform float size;uniform float pixelRatio;attribute float weight;varying float fade;varying vec3 worldPoint;
   void main(){fade=weight;worldPoint=(modelMatrix*vec4(position,1.)).xyz;vec4 mv=viewMatrix*vec4(worldPoint,1.);gl_Position=projectionMatrix*mv;gl_PointSize=max(1.,size*pixelRatio*(.4+.6*weight)/(-mv.z));}`,
  fragmentShader:`uniform vec3 eye;uniform vec3 tint;uniform float strength;varying float fade;varying vec3 worldPoint;
   ${occultation}
   void main(){if(planetVisibility(worldPoint)<.5)discard;float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float a=exp(-r*r*5.)*fade*strength;gl_FragColor=vec4(tint,a);}`
 });
 const mesh=new THREE.Points(geometry,material);mesh.renderOrder=3;mesh.frustumCulled=false;
 return {mesh,material,positions:geometry.attributes.position};
}
