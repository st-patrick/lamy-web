export function startLoop(update, render, step = 1/60){
  let last = performance.now(), acc = 0;
  const MAX = 0.25;
  function frame(t){
    const dt = Math.min((t - last)/1000, MAX);
    last = t; acc += dt;
    while (acc >= step){ update(step); acc -= step; }
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
