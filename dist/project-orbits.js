// One stable plane and radius per project. Categories only affect highlighting.
export function projectOrbit(index){
 const tilts=[24,45,62,36,54,18,48,32,66,40,57,27];
 const turns=[-30,-15,6,20,38,55,-42,-4,72,28,-22,48];
 return {
  radius:2.3+index*.075,
  tilt:tilts[index%tilts.length]*Math.PI/180,
  turn:turns[index%turns.length]*Math.PI/180,
  phase:index*2.399963229728653,
  speed:(index%3===1?-1:1)*(.032+index*.0014),
  width:.042+(index%3)*.012,
 };
}
