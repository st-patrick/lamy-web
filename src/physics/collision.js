const MAX_MOVE_STEP = 0.45;

export function tryMove(entity, mx, my, level){
  const steps = Math.max(1,
    Math.ceil(Math.abs(mx) / MAX_MOVE_STEP),
    Math.ceil(Math.abs(my) / MAX_MOVE_STEP)
  );

  const stepX = mx / steps;
  const stepY = my / steps;

  for (let i = 0; i < steps; i++){
    singleAxisMove(entity, stepX, stepY, level);
  }
}

function singleAxisMove(entity, mx, my, level){
  const nx = entity.x + mx;
  const ny = entity.y + my;

  if (mx !== 0){
    const left = nx;
    const right = nx + entity.w;
    const top = entity.y;
    const bottom = entity.y + entity.h;
    const testX = mx > 0 ? right : left;
    if (hits(testX, top, level) || hits(testX, bottom - 0.001, level)){
      const tileX = (mx > 0 ? Math.floor(right) : Math.ceil(left)) + (mx > 0 ? -entity.w : 0);
      entity.x = tileX;
    } else {
      entity.x = nx;
    }
  }

  if (my !== 0){
    const left = entity.x;
    const right = entity.x + entity.w;
    const top = ny;
    const bottom = ny + entity.h;
    const testY = my > 0 ? bottom : top;
    if (hits(left, testY, level) || hits(right - 0.001, testY, level)){
      const tileY = (my > 0 ? Math.floor(bottom) : Math.ceil(top)) + (my > 0 ? -entity.h : 0);
      entity.y = tileY;
    } else {
      entity.y = ny;
    }
  }
}
function hits(px, py, level){
  const tx = Math.floor(px), ty = Math.floor(py);
  return level.isSolid(level.at(tx,ty));
}
