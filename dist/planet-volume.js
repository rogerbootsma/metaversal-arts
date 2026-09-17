import * as THREE from './vendor/three.module.min.js';
// Dense raymarched body with animated mineral strata and granular relief.
// Artistic volume shading, without a separate atmosphere or cloud shell.
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

   float relief(vec3 p,float t){return noise4(vec4(p*12.,t))*.65+noise4(vec4(p*38.,t))*.35;}
   void main(){
    vec3 ray=normalize(localPosition-eye);float b=dot(eye,ray),h=b*b-dot(eye,eye)+3.61;if(h<0.)discard;
    float root=sqrt(h),start=-b-root,stepSize=root*2./float(${steps});
    float t=time*.025+sin(time*.62831853)*.008;float angle=time*.018+.22;float c=cos(angle),s=sin(angle);
    mat3 turn=mat3(c,0.,s,0.,1.,0.,-s,0.,c);
    vec3 light=vec3(0.);float alpha=0.;vec3 sun=normalize(vec3(-.65,.65,1.));
    for(int i=0;i<${steps};i++){
     vec3 p=eye+ray*(start+(float(i)+.5)*stepSize);float r=length(p);vec3 q=turn*p;
     float warp=noise4(vec4(q*2.1,t));
     float texture=relief(q,t);
     float surface=1.79+(texture-.5)*.085+(warp-.5)*.045;
     float density=(1.-smoothstep(surface-.055,surface+.012,r))*42.;
     if(density<.015)continue;
     vec3 radial=normalize(p);
     float latitude=q.y*.93+q.x*.24+warp*.28;
     float strata=sin(latitude*13.+warp*4.5);
     float thread=sin(latitude*61.+warp*18.);
     float cool=smoothstep(-.23,.36,latitude+strata*.11);
     vec3 copper=mix(vec3(.19,.047,.018),vec3(.94,.43,.11),.4+.6*texture);
     vec3 teal=mix(vec3(.018,.12,.16),vec3(.19,.64,.66),.3+.7*texture);
     vec3 color=mix(copper,teal,cool);
     float cream=pow(.5+.5*strata,12.)*.36+pow(.5+.5*thread,22.)*.14;
     color=mix(color,vec3(.86,.79,.61),cream);
     vec3 grad=vec3(relief(q+vec3(.009,0,0),t)-texture,relief(q+vec3(0,.009,0),t)-texture,relief(q+vec3(0,0,.009),t)-texture)/.009;
     vec3 localNormal=normalize(q);grad-=localNormal*dot(grad,localNormal);
     vec3 normal=normalize(radial-mat3(c,0.,-s,0.,1.,0.,s,0.,c)*grad*.045);
     float day=max(dot(normal,sun),0.);
     float grain=noise4(vec4(q*135.,t*.7));
     float sparkle=pow(grain,16.)*pow(max(dot(reflect(-sun,normal),-ray),0.),10.);
     color*= (.12+day*1.13)*(.72+grain*.5);
     color+=vec3(.7,.88,.84)*sparkle*.8;
     float a=1.-exp(-density*stepSize);light+=(1.-alpha)*a*color;alpha+=(1.-alpha)*a;
     if(alpha>.995)break;
    }
    if(alpha<.01)discard;
    vec3 radiance=light/max(alpha,.001);
    gl_FragColor=vec4(pow(vec3(1.)-exp(-radiance*1.8),vec3(.84)),alpha);
   }`
 });
}
