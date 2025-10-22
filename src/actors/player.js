import { tryMove } from "../physics/collision.js";
export function createPlayer(spawn){
  return { x: spawn.x + 0.05, y: spawn.y + 0.05, w: 2.0, h: 2.0, speed: 32.0 }; // tiles/sec
}
export function updatePlayer(p, input, dt, level){
  let dx=0, dy=0;
  if (input.left) dx--; if (input.right) dx++; if (input.up) dy--; if (input.down) dy++;
  if (dx && dy){ const s = Math.SQRT1_2; dx*=s; dy*=s; }
  tryMove(p, dx * p.speed * dt, 0, level);
  tryMove(p, 0, dy * p.speed * dt, level);
}
