import { tryMove } from "../physics/collision.js";

export function createPlayer(spawn){
  return { x: spawn.x + 0.1, y: spawn.y + 0.1, w: 0.8, h: 0.8, speed: 6.0 };
}

export function updatePlayer(p, input, dt, level){
  let dx=0, dy=0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  if (dx && dy){ const s = Math.SQRT1_2; dx*=s; dy*=s; }

  const vx = dx * p.speed * dt, vy = dy * p.speed * dt;
  tryMove(p, vx, 0, level);
  tryMove(p, 0, vy, level);
}
