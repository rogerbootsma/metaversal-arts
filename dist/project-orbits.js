// One stable plane and radius per project. Categories only affect highlighting.
export function projectOrbit(index){
 const radii=[2.28,3.08,2.72,2.99,3.28,3.62,3.99,4.40,4.84,5.31,5.81,5.45];
 const phases=[0,2.4,4.8,.92,3.32,5.72,1.84,4.24,1.4,.9,2.5,4.2];
 const tilts=[73,68,65,88,61,102,82,48,105,76,94,38];
 const turns=[-28,8,36,64,-48,15,-72,42,-4,80,-38,12];
 return {
  radius:radii[index],
  // Preserve the approved planet framing while drawing the outer rim inward.
  framingRadius:index===11?6.35:radii[index],
  tilt:tilts[index%tilts.length]*Math.PI/180,
  turn:turns[index%turns.length]*Math.PI/180,
  rotationOrder:'ZXY',
  // Independent inner/outer shoulders and cubic Bezier timing handles.
  feather:index===0?[.10,.05]:index===1?[.02,.09]:index%3===0?[.08,.14]:[.18,.12],
  falloffCurve:index%3===0?[.18,.72]:index%3===1?[.12,.82]:[.28,.88],
  opacity:[1,.85,.60,.50,.40,.34,.28,.23,.19,.16,.135,.11][index],
  phase:phases[index],
  speed:(index%3===1?-1:1)*.072*Math.pow(radii[0]/radii[index],1.5),
  width:index<2?.32:index<5?.14:.085,
 };
}
