export const TILE = 32;
const SOLIDS = new Set(["#"]);

export function parseAscii(text){
  const rows = text.split("\n");
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const grid = Array.from({length:h}, (_,y)=>Array.from({length:w},(_,x)=>rows[y][x] ?? " "));
  let spawn = {x:1,y:1};
  for (let y=0;y<h;y++) for (let x=0;x<w;x++){
    if (grid[y][x] === "P"){ spawn = {x,y}; grid[y][x] = " "; }
  }
  return { w, h, grid, spawn };
}

export function tileAt(level, x, y){
  return level.grid[y]?.[x] ?? "#"; // OOB is solid
}
export function isSolid(ch){ return SOLIDS.has(ch); }
