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

const EPS = 1e-6;

function singleAxisMove(entity, mx, my, level){
  const nx = entity.x + mx;
  const ny = entity.y + my;

  if (mx !== 0){
    const spanTop = Math.floor(entity.y + EPS);
    const spanBottom = Math.floor(entity.y + entity.h - EPS);
    // Scan every tile touched along the vertical edge so we cannot slip into thin walls.
    if (mx > 0){
      const edge = nx + entity.w - EPS;
      const tileX = Math.floor(edge);
      let blocked = false;
      for (let ty = spanTop; ty <= spanBottom; ty++){
        if (level.isSolid(level.at(tileX, ty))){
          blocked = true;
          break;
        }
      }
      if (blocked){
        entity.x = tileX - entity.w;
      } else {
        entity.x = nx;
      }
    } else {
      const edge = nx + EPS;
      const tileX = Math.floor(edge);
      let blocked = false;
      for (let ty = spanTop; ty <= spanBottom; ty++){
        if (level.isSolid(level.at(tileX, ty))){
          blocked = true;
          break;
        }
      }
      if (blocked){
        entity.x = tileX + 1;
      } else {
        entity.x = nx;
      }
    }
  }

  if (my !== 0){
    const spanLeft = Math.floor(entity.x + EPS);
    const spanRight = Math.floor(entity.x + entity.w - EPS);
    // Same idea for horizontal surfaces when moving vertically.
    if (my > 0){
      const edge = ny + entity.h - EPS;
      const tileY = Math.floor(edge);
      let blocked = false;
      for (let tx = spanLeft; tx <= spanRight; tx++){
        if (level.isSolid(level.at(tx, tileY))){
          blocked = true;
          break;
        }
      }
      if (blocked){
        entity.y = tileY - entity.h;
      } else {
        entity.y = ny;
      }
    } else {
      const edge = ny + EPS;
      const tileY = Math.floor(edge);
      let blocked = false;
      for (let tx = spanLeft; tx <= spanRight; tx++){
        if (level.isSolid(level.at(tx, tileY))){
          blocked = true;
          break;
        }
      }
      if (blocked){
        entity.y = tileY + 1;
      } else {
        entity.y = ny;
      }
    }
  }
}
