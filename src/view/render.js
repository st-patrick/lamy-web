import { TILE } from "../world/level.js";

export function createRenderer(canvas, level, palette = {wall:"#000", floor:"#fff", player:"#1976d2"}){
  canvas.width  = level.w * TILE;
  canvas.height = level.h * TILE;
  const ctx = canvas.getContext("2d");

  return function render(state){
    // clear
    ctx.fillStyle = palette.floor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // tiles
    for (let y=0;y<level.h;y++){
      for (let x=0;x<level.w;x++){
        if (level.grid[y][x] === "#"){
          ctx.fillStyle = palette.wall;
          ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
        }
      }
    }
    // player
    const p = state.player;
    ctx.fillStyle = palette.player;
    ctx.fillRect(p.x*TILE, p.y*TILE, p.w*TILE, p.h*TILE);
  };
}
