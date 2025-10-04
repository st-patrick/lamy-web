export function tryMove(entity, mx, my, level){
  const nx = entity.x + mx, ny = entity.y + my;

  // X
  if (mx !== 0){
    const left = nx, right = nx + entity.w, top = entity.y, bottom = entity.y + entity.h;
    const testX = mx > 0 ? right : left;
    if (hits(testX, top, level) || hits(testX, bottom - 0.001, level)){
      const tileX = (mx > 0 ? Math.floor(right) : Math.ceil(left)) + (mx > 0 ? -entity.w : 0);
      entity.x = tileX;
    } else entity.x = nx;
  }
  // Y
  if (my !== 0){
    const left = entity.x, right = entity.x + entity.w, top = ny, bottom = ny + entity.h;
    const testY = my > 0 ? bottom : top;
    if (hits(left, testY, level) || hits(right - 0.001, testY, level)){
      const tileY = (my > 0 ? Math.floor(bottom) : Math.ceil(top)) + (my > 0 ? -entity.h : 0);
      entity.y = tileY;
    } else entity.y = ny;
  }
}
function hits(px, py, level){
  const tx = Math.floor(px), ty = Math.floor(py);
  return level.isSolid(level.at(tx,ty));
}
