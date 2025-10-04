import { parseTOML } from "./toml-lite.js";

export const TILE = 12;

export function parseTomlLevel(tomlText){
  const t = parseTOML(tomlText);
  const id   = must(t.id, "id");
  const name = t.name || id.slice(0,8);

  const chars = {
    wall:  (t.tiles?.wall  ?? "#"),
    floor: (t.tiles?.floor ?? " ")
  };

  const rows = must(t.grid, "grid").split("\n");
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const grid = Array.from({length:h}, (_,y)=>Array.from({length:w},(_,x)=>rows[y][x] ?? chars.floor));

  const spawn = {
    x: must(t.spawn?.x, "spawn.x"),
    y: must(t.spawn?.y, "spawn.y"),
    w: must(t.spawn?.w, "spawn.w"),
    h: must(t.spawn?.h, "spawn.h"),
  };

  const exits = {
    left:   t.exits?.left   ?? null,
    right:  t.exits?.right  ?? null,
    top:    t.exits?.top    ?? null,
    bottom: t.exits?.bottom ?? null,
  };

  const SOLID = new Set([chars.wall]);
  const isSolid = c => SOLID.has(c);
  const at = (x,y) => grid[y]?.[x] ?? chars.wall; // OOB acts as wall

  return { id, name, w, h, grid, chars, spawn, exits, isSolid, at };
}

export function rectIsClear(level, x, y, w, h){
  for (let ty=y; ty<y+h; ty++)
    for (let tx=x; tx<x+w; tx++)
      if (level.isSolid(level.at(tx,ty))) return false;
  return true;
}

const must = (v, label) => (v===undefined || v===null) ? (()=>{ throw new Error("Missing TOML key: "+label); })() : v;
