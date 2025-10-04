import { startLoop } from "./engine/loop.js";
import { createInput } from "./engine/input.js";
import { createPlayer, updatePlayer } from "./actors/player.js";
import { createRenderer } from "./view/render.js";
import { loadAtlasFromTomls } from "./world/atlas.js";
import { rectIsClear } from "./world/level.js";

const MAP_FILES = ["./maps/plains.toml","./maps/cave.toml"];

let atlas = null, level = null, player = null, input = null, render = null, currentId = null;

boot();

async function boot(){
  atlas = await loadAtlasFromTomls(MAP_FILES);
  currentId = Object.keys(atlas)[0];
  level = atlas[currentId].level;

  if (!rectIsClear(level, level.spawn.x, level.spawn.y, level.spawn.w, level.spawn.h)){
    console.warn(`[Level ${level.name}] Spawn overlaps solids — fix in editor.`);
  }

  player = createPlayer(level.spawn);
  input  = createInput();
  render = createRenderer(document.getElementById("game"), level);
  startLoop(update, draw);
}

function update(dt){
  const before = { x: player.x, y: player.y };
  updatePlayer(player, input.state, dt, level);

  // Edge exit logic: only if player is at edge AND pressing toward that edge AND link exists
  const atLeft   = player.x <= 0.001;
  const atRight  = player.x + player.w >= level.w - 0.001;
  const atTop    = player.y <= 0.001;
  const atBottom = player.y + player.h >= level.h - 0.001;

  if (atLeft && input.state.left && level.exits.left)       return switchMap(level.exits.left,   "left",   before);
  if (atRight && input.state.right && level.exits.right)    return switchMap(level.exits.right,  "right",  before);
  if (atTop && input.state.up && level.exits.top)           return switchMap(level.exits.top,    "top",    before);
  if (atBottom && input.state.down && level.exits.bottom)   return switchMap(level.exits.bottom, "bottom", before);

  // Else: edges act like walls naturally (OOB is treated as wall in level.at())
}

function switchMap(targetId, viaSide, prevPos){
  const node = atlas[targetId];
  if (!node){ console.warn("Missing target map: " + targetId); return; }
  level = node.level;
  render = createRenderer(document.getElementById("game"), level);

  // Place just inside the opposite edge; preserve orthogonal ratio
  const ratioX = (prevPos.x + player.w/2) / Math.max(1, atlas[currentId].level.w);
  const ratioY = (prevPos.y + player.h/2) / Math.max(1, atlas[currentId].level.h);

  if (viaSide === "left"){        // leaving left → enter from RIGHT of target
    player.x = level.w - player.w - 0.05;
    player.y = clamp(ratioY * level.h - player.h/2, 0, level.h - player.h);
  } else if (viaSide === "right"){
    player.x = 0.05;
    player.y = clamp(ratioY * level.h - player.h/2, 0, level.h - player.h);
  } else if (viaSide === "top"){
    player.y = level.h - player.h - 0.05;
    player.x = clamp(ratioX * level.w - player.w/2, 0, level.w - player.w);
  } else if (viaSide === "bottom"){
    player.y = 0.05;
    player.x = clamp(ratioX * level.w - player.w/2, 0, level.w - player.w);
  }

  currentId = level.id;
}

function draw(){ render({ player, level }); }

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
