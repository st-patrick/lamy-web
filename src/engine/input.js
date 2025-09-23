export function createInput(target = window){
  const s = {left:false,right:false,up:false,down:false};
  const on = (e, v) => {
    const k = e.key.toLowerCase();
    if (["arrowleft","a"].includes(k))  s.left = v;
    if (["arrowright","d"].includes(k)) s.right = v;
    if (["arrowup","w"].includes(k))    s.up = v;
    if (["arrowdown","s"].includes(k))  s.down = v;
  };
  const kd = e => { on(e, true); if (e.key.startsWith("Arrow")) e.preventDefault(); };
  const ku = e => on(e, false);
  target.addEventListener("keydown", kd);
  target.addEventListener("keyup", ku);
  return { state:s, dispose(){ target.removeEventListener("keydown", kd); target.removeEventListener("keyup", ku); } };
}
