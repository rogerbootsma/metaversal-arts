import * as THREE from './vendor/three.module.min.js';

const canvas = document.querySelector('#scene');
const host = document.querySelector('#artwork');
const button = document.querySelector('#motion');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

try {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.25 : 1.6));
  renderer.setClearColor(0x090b0c, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
  camera.position.z = 7.8;
  const sculpture = new THREE.Group();
  scene.add(sculpture);

  // Raymarch a real, bounded participating volume, with a low sample count for phones.
  const volume = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, eye: { value: camera.position.clone() } },
    vertexShader: `varying vec3 positionLocal;
      void main(){positionLocal=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `precision highp float;
      varying vec3 positionLocal; uniform vec3 eye; uniform float time;
      float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
      float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      void main(){vec3 rd=normalize(positionLocal-eye);float b=dot(eye,rd);float h=b*b-dot(eye,eye)+2.56;
        if(h<0.)discard;float root=sqrt(h),nearT=-b-root,farT=-b+root;
        float stepT=(farT-nearT)/36.;vec3 light=vec3(0.);float alpha=0.;
        for(int i=0;i<36;i++){vec3 p=eye+rd*(nearT+(float(i)+.5)*stepT);float r=length(p);
          vec3 q=p*2.8+vec3(time*.065,-time*.035,time*.022);
          float n=noise(q)+.5*noise(q*2.03)+.25*noise(q*4.01);
          float swirl=sin(p.y*6.+n*5.+time*.12)*.5+.5;
          float density=smoothstep(.52,1.2,n)*(.25+.75*swirl)*(1.-smoothstep(1.15,1.6,r));
          float shell=exp(-pow((r-1.48)*25.,2.))*.23;
          float a=(density*.25+shell)*stepT;
          vec3 col=mix(vec3(.38,.18,.055),vec3(1.,.66,.31),clamp(p.y*.3+n*.55,0.,1.));
          light+=(1.-alpha)*a*col;alpha+=(1.-alpha)*a;
        }
        float rim=pow(1.-root/1.6,3.)*.35;
        gl_FragColor=vec4(light*1.6+vec3(.9,.52,.23)*rim,clamp(alpha+rim,0.,.7));}`
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.6, 64, 48), volume);
  scene.add(sphere);

  const strandMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec3 n;varying vec3 v;varying vec3 p;void main(){p=position;n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);v=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `varying vec3 n;varying vec3 v;varying vec3 p;uniform float time;
      void main(){float f=pow(1.-abs(dot(normalize(n),normalize(v))),2.);
        float l=max(dot(normalize(n),normalize(vec3(-.6,1.,1.))),0.);
        vec3 col=mix(vec3(.22,.10,.035),vec3(1.,.82,.54),l*.8+f*.7);
        float band=pow(.5+.5*sin(p.z*13.+p.y*7.+time*.2),12.)*.22;
        gl_FragColor=vec4(col+band,1.);}`
  });
  class Orbit extends THREE.Curve {
    constructor(offset){super();this.offset=offset;}
    getPoint(t,target=new THREE.Vector3()) {
      const a=t*Math.PI*2, r=.91+.27*Math.cos(3*a+this.offset);
      return target.set(r*Math.cos(2*a),r*Math.sin(2*a),.40*Math.sin(3*a+this.offset));
    }
  }
  const knot = new THREE.Mesh(new THREE.TubeGeometry(new Orbit(0), 360, .055, 12, true), strandMaterial);
  sculpture.add(knot);
  const filamentMaterial = new THREE.MeshBasicMaterial({color:0xffd59e,transparent:true,opacity:.12,blending:THREE.AdditiveBlending,depthWrite:false});
  for(let i=0;i<7;i++){
    const filament=new THREE.Mesh(new THREE.TubeGeometry(new Orbit(i*.04),256,.004,4,true),filamentMaterial);
    filament.scale.setScalar(1.04+i*.015);sculpture.add(filament);
  }
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.8,.003,4,220),new THREE.MeshBasicMaterial({color:0xa88961,transparent:true,opacity:.4}));
  orbit.rotation.set(1.14,.22,-.4);scene.add(orbit);
  const points = new Float32Array(1000*3);
  let seed=1729;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<1000;i++){
    const r=1.58+random()*.025, theta=random()*Math.PI*2, z=random()*2-1;
    points[i*3]=r*Math.sqrt(1-z*z)*Math.cos(theta);points[i*3+1]=r*z;points[i*3+2]=r*Math.sqrt(1-z*z)*Math.sin(theta);
  }
  const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.BufferAttribute(points,3));
  const dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:0xe4b980,size:.009,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(dust);

  let paused=reduced.matches, visible=true, frame=0, last=0, elapsed=0;
  let px=0,py=0;
  function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();render();}
  function render(){renderer.render(scene,camera);}
  function tick(now){frame=0;if(paused||!visible||document.hidden)return;
    elapsed+=Math.min((now-last)/1000,.05);last=now;
    sculpture.rotation.set(.55+Math.sin(elapsed*.13)*.23+py*.08,elapsed*.105+px*.1,-.25+Math.sin(elapsed*.09)*.28);
    dust.rotation.y=elapsed*.025;orbit.rotation.z=-.4+elapsed*.035;
    volume.uniforms.time.value=elapsed;strandMaterial.uniforms.time.value=elapsed;render();frame=requestAnimationFrame(tick);
  }
  function start(){if(!frame&&!paused&&visible&&!document.hidden){last=performance.now();frame=requestAnimationFrame(tick);}}
  function syncButton(){button.setAttribute('aria-pressed',String(paused));document.querySelector('#motion-label').textContent=paused?'Resume motion':'Pause motion';document.querySelector('#motion-icon').textContent=paused?'▷':'Ⅱ';}
  button.hidden=false;button.addEventListener('click',()=>{paused=!paused;syncButton();if(paused){cancelAnimationFrame(frame);frame=0;}else start();});
  reduced.addEventListener('change',e=>{paused=e.matches;syncButton();if(paused){cancelAnimationFrame(frame);frame=0;}else start();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else {cancelAnimationFrame(frame);frame=0;}},{threshold:0}).observe(host);
  document.querySelector('.hero').addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){px=e.clientX/innerWidth-.5;py=e.clientY/innerHeight-.5;}});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);frame=0;button.hidden=true;document.querySelector('#scene-fallback').hidden=false;});
  canvas.addEventListener('webglcontextrestored',()=>{button.hidden=false;document.querySelector('#scene-fallback').hidden=true;render();start();});
  sculpture.rotation.set(.55,.2,-.25);new ResizeObserver(resize).observe(host);resize();syncButton();start();
} catch(error) {
  document.querySelector('#scene-fallback').hidden=false;
  button.hidden=true;
  console.warn('The artwork could not initialize.',error);
}
