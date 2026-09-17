import * as THREE from './vendor/three.module.min.js';
// A single density integration composites the atmosphere and every ring in depth.
// Shallow ring volumes stay flat but have real thickness and structured density.
export function createPlanetVolume(camera,lanes){
 const steps=innerWidth<700?400:640;
 const bound=Math.max(...lanes.map(l=>l.radius+l.width*.7))+.12;
 const inverse=lanes.map(lane=>new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromEuler(lane.rotation).invert()));
 return new THREE.ShaderMaterial({transparent:true,depthWrite:false,
  uniforms:{bound:{value:bound},time:{value:0},eye:{value:camera.position.clone()},ringInverse:{value:inverse},ringRadius:{value:lanes.map(l=>l.radius)},ringWidth:{value:lanes.map(l=>l.width)},ringStrength:{value:lanes.map(()=>1)},ringFeather:{value:lanes.map(l=>new THREE.Vector2(...l.feather))},ringCurve:{value:lanes.map(l=>new THREE.Vector2(...l.falloffCurve))}},
  vertexShader:`varying vec3 localPosition;void main(){localPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`precision highp float;
   varying vec3 localPosition;uniform vec3 eye;uniform float time;uniform float bound;
   uniform mat3 ringInverse[12];uniform float ringRadius[12];uniform float ringWidth[12];uniform float ringStrength[12];uniform vec2 ringFeather[12];uniform vec2 ringCurve[12];
   float hash4(vec4 p){p=fract(p*vec4(.1031,.1030,.0973,.1099));p+=dot(p,p.wzxy+33.33);return fract((p.x+p.y)*(p.z+p.w));}
   float slice4(vec4 i,vec3 f){
    return mix(mix(mix(hash4(i),hash4(i+vec4(1,0,0,0)),f.x),mix(hash4(i+vec4(0,1,0,0)),hash4(i+vec4(1,1,0,0)),f.x),f.y),
     mix(mix(hash4(i+vec4(0,0,1,0)),hash4(i+vec4(1,0,1,0)),f.x),mix(hash4(i+vec4(0,1,1,0)),hash4(i+vec4(1,1,1,0)),f.x),f.y),f.z);
   }
   // Interpolate 16 independent lattice corners in x, y, z and time.
   // Quintic interpolation keeps motion smooth across temporal cell boundaries.
   float noise4(vec4 p){vec4 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);return mix(slice4(i,f.xyz),slice4(i+vec4(0,0,0,1),f.xyz),f.w);}
   float mist(vec4 q){return noise4(q)*.57+noise4(q*2.03)*.28+noise4(q*4.07)*.15;}

   // Cubic Bezier x handles vary the feather while zero-slope y handles
   // keep both ends soft. Invert x so the profile is evaluated by distance.
   float bezierFalloff(float x,vec2 handles){
    float t=clamp(x,0.,1.);
    for(int k=0;k<5;k++){
     float u=1.-t;
     float bx=3.*u*u*t*handles.x+3.*u*t*t*handles.y+t*t*t;
     float dx=3.*u*u*handles.x+6.*u*t*(handles.y-handles.x)+3.*t*t*(1.-handles.y);
     t=clamp(t-(bx-x)/max(dx,.02),0.,1.);
    }
    return 1.-t*t*(3.-2.*t);
   }
   void main(){
    vec3 ray=normalize(localPosition-eye);float b=dot(eye,ray),h=b*b-dot(eye,eye)+bound*bound;if(h<0.)discard;
    float root=sqrt(h),start=max(0.,-b-root),end=-b+root,distance=start;
    float t=time*.026+sin(time*.62831853)*.012;
    float angle=time*.018+.35;float c=cos(angle),s=sin(angle);mat3 turn=mat3(c,0.,s,0.,1.,0.,-s,0.,c);
    vec3 light=vec3(0.);float alpha=0.;vec3 sun=normalize(vec3(.78,.55,.35));
    for(int i=0;i<${steps};i++){
     if(distance>=end)break;
     vec3 probe=eye+ray*distance;float nearRadius=length(probe);
     float stepSize=nearRadius<2.3?${innerWidth<700?'.052':'.032'}:.075;
     if(nearRadius>1.78&&nearRadius<2.25)stepSize=min(stepSize,${innerWidth<700?'.038':'.024'});
     // Resolve shallow bands before sampling them; large empty-space steps
     // would otherwise turn tilted rings into visible diagonal striping.
     for(int k=0;k<12;k++){
      vec3 nearRing=ringInverse[k]*probe;
      if(abs(nearRing.z)<.18&&abs(length(nearRing.xy)-ringRadius[k])<ringWidth[k]*.65+.08)stepSize=min(stepSize,${innerWidth<700?'.028':'.018'});
     }
     vec3 p=eye+ray*(distance+stepSize*.5);float r=length(p);distance+=stepSize;
     float density=0.;vec3 source=vec3(0.);
     if(r<2.42){
      vec3 q=turn*p;vec3 normal=normalize(p);
      float warp=mist(vec4(q*1.7,t));
      float latitude=q.y*.91+q.x*.34;
      // Strong directional stretching makes long trailing weather systems.
      vec3 weather=vec3(q.x*1.3,latitude*4.6+warp*.9,q.z*1.3);
      float flow=mist(vec4(weather+vec3(warp*.5,0.,time*.011),t));
      float ribbon=.5+.5*sin(latitude*10.+warp*6.+flow*2.);
      float filaments=.5+.5*sin(latitude*48.+warp*17.+flow*8.);
      float detail=noise4(vec4(q*16.+vec3(flow*2.,warp,0.),t*.6));
      float lace=.5+.5*sin(latitude*128.+warp*37.+detail*8.);
      float body=(1.-smoothstep(1.57,1.76,r))*17.;
      float cloudShape=smoothstep(.31,.73,flow)*(.55+ribbon*.6);
      float clouds=smoothstep(1.57,1.72,r)*(1.-smoothstep(1.83+cloudShape*.13,2.08,r))*cloudShape*3.8;
      float hanging=pow(filaments,9.)*smoothstep(.4,.65,warp)*exp(-pow((r-1.94)*10.,2.))*1.1;
      // A separate, differentially rotating cirrus field wraps the globe.
      // Latitude shear curls the strips; 4D detail evolves rather than sliding
      // an unchanging texture around the surface.
      float cirrus=0.,cirrusShade=1.;
      if(r>1.78&&r<2.25){
       float cloudTime=time*.24;
       float cloudAngle=.35+cloudTime*.018;
       float cc=cos(cloudAngle),cs=sin(cloudAngle);
       vec3 cloudPoint=vec3(cc*p.x-cs*p.z,p.y,cs*p.x+cc*p.z);
       vec3 belt=vec3(cloudPoint.x*.94-cloudPoint.y*.342,cloudPoint.y*.94+cloudPoint.x*.342,cloudPoint.z);
       float wind=cloudTime*.040+belt.y*.55+sin(belt.y*2.2+cloudTime*.018)*.13;
       float wc=cos(wind),ws=sin(wind);
       vec3 drift=vec3(wc*belt.x-ws*belt.z,belt.y,ws*belt.x+wc*belt.z);
       float curl=noise4(vec4(drift*2.3,cloudTime*.018));
       vec3 stretched=drift*vec3(2.6,8.5,2.6)+vec3(0.,curl*.9,0.);
       float billow=mist(vec4(stretched,cloudTime*.028));
       float fine=noise4(vec4(drift*vec3(12.,46.,12.)+billow*2.5,cloudTime*.025));
       float strip=.5+.5*sin(belt.y*18.+curl*8.+billow*2.8);
       float strands=pow(strip,3.7)*smoothstep(.30,.62,billow)*(.46+fine*.72);
       float height=1.94+curl*.025+(billow-.5)*.075;
       float shell=exp(-pow((r-height)*12.5,2.))*smoothstep(1.78,1.85,r)*(1.-smoothstep(2.12,2.25,r));
       cirrus=strands*shell*4.4;
       cirrusShade=.72+fine*.36+billow*.12;
      }
      float corona=exp(-pow((r-2.01)*10.5,2.))*.26;
      float atmosphere=exp(-max(r-1.74,0.)*7.)*.65*smoothstep(1.64,1.77,r)*(1.-smoothstep(2.10,2.42,r));
      float day=pow(max(dot(normal,sun),0.),.8);float shade=.035+day*1.1;
      float latitudeMix=smoothstep(-.38,.65,latitude+warp*.18);
      vec3 amber=mix(vec3(.28,.065,.02),vec3(.86,.42,.12),flow);
      vec3 plum=mix(vec3(.065,.025,.12),vec3(.52,.06,.20),flow*.85+ribbon*.15);
      vec3 base=mix(amber,plum,latitudeMix);
      base=mix(base,vec3(.59,.66,.67),pow(ribbon,12.)*.20);
      base=mix(base,vec3(.95,.73,.44),pow(filaments,18.)*.19);
      base*=.72+detail*.48;
      base+=vec3(.72,.35,.14)*pow(lace,20.)*smoothstep(.45,.8,flow)*.45;
      vec3 cloudColor=mix(base,vec3(.77,.63,.56),.10+flow*.12)*(.08+day*1.05);
      float rim=pow(1.-abs(dot(normal,ray)),3.);
      vec3 air=mix(vec3(.10,.24,.55),vec3(.50,.72,1.),day)*(.4+rim*4.2);
      vec3 cirrusColor=mix(vec3(.55,.62,.72),vec3(1.,.99,.98),.40+day*.60)*(.42+day*.90)*cirrusShade;
      density=body+clouds+hanging+atmosphere+corona+cirrus;
      source=base*shade*body+cloudColor*(clouds+hanging)+cirrusColor*cirrus+air*atmosphere+vec3(.32,.57,1.)*corona*(.08+rim*6.)*(.5+day);
     }
     // All twelve annular slabs participate in the same ray integration.
     // Front arcs cover the planet; back arcs are absorbed by its dense core.
     for(int j=0;j<12;j++){
      vec3 q=ringInverse[j]*p;float z=abs(q.z);
      if(z>.095)continue;
      float radial=length(q.xy),offset=(radial-ringRadius[j])/ringWidth[j];
      if(abs(offset)>.62)continue;
      float shoulder=offset<0.?ringFeather[j].x:ringFeather[j].y;
      float feather=clamp((abs(offset)-shoulder)/(.62-shoulder),0.,1.);
      float edge=bezierFalloff(feather,ringCurve[j]);
      float angle=atan(q.y,q.x)-time*(.018+float(j)*.001);
      vec3 grit=vec3(cos(angle)*radial*35.,sin(angle)*radial*35.,float(j)*7.);
      float grain=noise4(vec4(grit,t*.15));
      float strata=.45+.35*sin(radial*65.+float(j)*2.)+.2*sin(radial*143.);
      float clumps=.55+.45*noise4(vec4(cos(angle)*9.,sin(angle)*9.,radial*17.,float(j)));
      float dz=(ringInverse[j]*ray).z*stepSize*.3333;
      float slab=(exp(-q.z*q.z/.00065)+exp(-pow(q.z-dz,2.)/.00065)+exp(-pow(q.z+dz,2.)/.00065))/3.;
      float rd=slab*edge*(6.+strata*16.+grain*13.)*clumps*ringStrength[j];
      vec3 tint=mix(vec3(.43,.25,.14),vec3(.88,.62,.33),grain*.7+strata*.3);
      if(j==1)tint=mix(tint,vec3(.70,.76,.74),.36);
      if(j==4)tint=mix(tint,vec3(.58,.50,.57),.14);
      if(j==2||j==6||j==9)tint=mix(tint,vec3(.50,.59,.62),.22);
      if(j==3||j==7||j==10)tint=mix(tint,vec3(.65,.39,.27),.16);
      if(j==5||j==8||j==11)tint=mix(tint,vec3(.78,.75,.66),.18);
      float shadow=1.;float projection=dot(p,sun);float sh=projection*projection-dot(p,p)+3.1;
      if(sh>0.&&projection<0.)shadow=.24;
      source+=tint*rd*shadow;density+=rd;
     }
     if(density>.0001){float a=1.-exp(-density*stepSize);light+=(1.-alpha)*a*source/density;alpha+=(1.-alpha)*a;}
     if(alpha>.998)break;
    }
    if(alpha<.003)discard;
    vec3 radiance=light/max(alpha,.001);
    gl_FragColor=vec4(pow(vec3(1.)-exp(-radiance*1.9),vec3(.87)),alpha);
   }`
 });
}
