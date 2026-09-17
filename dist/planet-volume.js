import * as THREE from './vendor/three.module.min.js';
// Original artistic shader: a dense planetary body, warped strata, ribbon fields,
// and a participating cloud shell. This is not a physical atmosphere simulation.
export function createPlanetVolume(camera){
 const steps=innerWidth<700?56:72;
 return new THREE.ShaderMaterial({transparent:true,depthWrite:false,
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

   void main(){
    vec3 ray=normalize(localPosition-eye);float b=dot(eye,ray),h=b*b-dot(eye,eye)+4.41;if(h<0.)discard;
    float root=sqrt(h),start=-b-root,stepSize=root*2./float(${steps});
    vec3 light=vec3(0.);float alpha=0.;vec3 sun=normalize(vec3(-.65,.5,.75));
    float breath=1.+sin(time*.62831853)*.018;
    for(int i=0;i<${steps};i++){
     vec3 p=eye+ray*(start+(float(i)+.5)*stepSize);float r=length(p);vec3 normal=p/max(r,.001);
     float angle=time*.024+.22;float c=cos(angle),s=sin(angle);
     vec3 q=vec3(c*p.x-s*p.z,p.y,s*p.x+c*p.z);
     float warp=noise4(vec4(q*1.45,time*.014));
     float terrain=mist(vec4(q*2.2+vec3(warp*.9),time*.009));
     float land=smoothstep(.43,.58,terrain);
     float coast=exp(-pow((terrain-.495)*38.,2.));
     float relief=noise4(vec4(q*10.5,time*.02));
     float body=(1.-smoothstep(1.55,1.66+land*.035,r))*7.;
     float day=max(dot(normal,sun),0.);float diffuse=.12+day*.95;
     vec3 ocean=mix(vec3(.015,.038,.075),vec3(.055,.30,.43),relief*.7+day*.3);
     vec3 mineral=mix(vec3(.17,.10,.04),vec3(.78,.52,.21),terrain*.65+relief*.35);
     vec3 bodyColor=mix(ocean,mineral,land)*diffuse+coast*vec3(.38,.24,.07)*(.3+day);
     float cloudNoise=mist(vec4(q*3.2+vec3(warp*1.4,time*.023,0.),time*.055));
     float cloudShell=smoothstep(1.63,1.73,r)*(1.-smoothstep(1.87*breath,2.06*breath,r));
     float cloud=smoothstep(.44,.7,cloudNoise)*cloudShell*1.9;
     float ribbonWave=sin(q.y*11.+warp*8.+q.x*1.7+time*.07)*.5+.5;
     float ribbon=pow(ribbonWave,20.)*exp(-pow((r-(1.77+warp*.1))*13.,2.))*.7;
     float haze=exp(-pow((r-1.9)*9.,2.))*.11;
     float density=body+cloud+ribbon+haze;
     vec3 cloudColor=mix(vec3(.14,.21,.27),vec3(.9,.88,.77),.22+day*.78);
     vec3 ribbonColor=mix(vec3(.13,.43,.62),vec3(1.,.65,.24),smoothstep(.3,.65,warp))*(.7+day);
     vec3 hazeColor=mix(vec3(.08,.25,.4),vec3(.47,.62,.67),day);
     vec3 color=(bodyColor*body+cloudColor*cloud+ribbonColor*ribbon+hazeColor*haze)/max(density,.001);
     float a=1.-exp(-density*stepSize);
     light+=(1.-alpha)*a*color;alpha+=(1.-alpha)*a;
     if(alpha>.995)break;
    }
    vec3 radiance=light/max(alpha,.001);
    // Mild display lift preserves blue depth and warm mineral highlights.
    gl_FragColor=vec4(pow(vec3(1.)-exp(-radiance*1.65),vec3(.82)),alpha);
   }`
 });
}
