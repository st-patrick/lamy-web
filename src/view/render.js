export function createRenderer(canvas, level, palette = {wall:"#000", floor:"#fff", player:"#1976d2"}) {
  let s = 12; // pixels per tile; main.js adjusts via auto-fit
  const ctx = canvas.getContext("2d", { alpha:false });

  function resize() {
    const w = Math.max(1, Math.floor(level.w * s));
    const h = Math.max(1, Math.floor(level.h * s));
    canvas.width = w;
    canvas.height = h;
  }
  resize();

  function render(state){
    ctx.fillStyle = palette.floor;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    for (let y=0; y<level.h; y++){
      for (let x=0; x<level.w; x++){
        if (level.grid[y][x] === level.chars.wall){
          ctx.fillStyle = palette.wall;
          ctx.fillRect(x*s, y*s, s, s);
        }
      }
    }

    const p = state.player;
    ctx.fillStyle = palette.player;
    ctx.fillRect(p.x*s, p.y*s, p.w*s, p.h*s);
  }

  render.setScale = (next)=>{ s = Math.max(2, Math.floor(next)); resize(); };
  render.getScale = ()=> s;

  return render;
}
