import { startLoop } from "./engine/loop.js";
import { createInput } from "./engine/input.js";
import { createPlayer, updatePlayer } from "./actors/player.js";
import { createRenderer } from "./view/render.js";
import { loadAtlasFromTomls } from "./world/atlas.js";
import { rectIsClear } from "./world/level.js";
import { maybePlaySequence, isSequenceActive } from "./game/sequences.js";

let atlas = null, level = null, player = null, input = null, render = null, currentId = null;

const canvas = document.getElementById("game");
const bootStatus = document.getElementById("bootStatus");
const fitBtn = document.getElementById("fit");
const zoomInBtn = document.getElementById("zoomIn");
const zoomOutBtn = document.getElementById("zoomOut");
const zoomLabel = document.getElementById("zoomLabel");
const fullBtn = document.getElementById("full");

boot();

async function boot(){
  const manifest = await loadManifestList();
  if (!manifest || !manifest.files.length){
    reportBootIssue("No map manifest available; unable to start game loop.");
    return;
  }

  atlas = await loadAtlasFromTomls(manifest.files);
  const ids = Object.keys(atlas);
  if (!ids.length){
    reportBootIssue("Manifest loaded, but no maps could be parsed.");
    return;
  }

  const fromId = manifest.defaultId && atlas[manifest.defaultId] ? manifest.defaultId : null;
  let fromFile = null;
  if (manifest.defaultFile){
    const normalized = cleanManifestPath(manifest.defaultFile);
    fromFile = ids.find(id => {
      const file = cleanManifestPath(atlas[id].file);
      return file === normalized;
    }) || null;
  }

  currentId = fromId || fromFile || ids[0];
  level = atlas[currentId].level;

  reportBootIssue("");

  if (!rectIsClear(level, level.spawn.x, level.spawn.y, level.spawn.w, level.spawn.h)){
    console.warn(`[Level ${level.name}] Spawn overlaps solids — fix in editor.`);
  }

  player = createPlayer(level.spawn);
  input  = createInput();
  render = createRenderer(canvas, level);
  fitToWindowHeight();
  startLoop(update, draw);

  maybePlaySequence(level.story?.onLoadSequence)?.catch(err => console.warn("Sequence error", err));

  fitBtn.onclick = ()=> fitToWindowHeight();
  zoomInBtn.onclick = ()=> setScale(render.getScale() + stepScale());
  zoomOutBtn.onclick = ()=> setScale(render.getScale() - stepScale());
  fullBtn.onclick = toggleFullscreen;

  window.addEventListener("resize", fitToWindowHeight);
  document.addEventListener("fullscreenchange", fitToWindowHeight);
  window.addEventListener("keydown", e=>{
    if (e.key === "+") setScale(render.getScale() + stepScale());
    if (e.key === "-") setScale(render.getScale() - stepScale());
    if (e.key === "0") fitToWindowHeight();
    if (e.key.toLowerCase() === "f") toggleFullscreen();
  });
}

function normalizeManifest(raw){
  if (!raw) return null;
  if (Array.isArray(raw)){
    return {
      files: raw.filter(v => typeof v === "string").map(cleanManifestPath),
      defaultFile: cleanManifestPath(raw.find(v => typeof v === "string") || null),
      defaultId: null
    };
  }
  if (typeof raw === "object"){
    const files = Array.isArray(raw.files) ? raw.files.filter(v => typeof v === "string").map(cleanManifestPath)
      : Array.isArray(raw.maps) ? raw.maps.filter(v => typeof v === "string").map(cleanManifestPath) : [];
    let defaultFile = null;
    if (typeof raw.defaultFile === "string") defaultFile = cleanManifestPath(raw.defaultFile);
    else if (raw.default && typeof raw.default === "string") defaultFile = cleanManifestPath(raw.default);
    else if (raw.default && typeof raw.default.file === "string") defaultFile = cleanManifestPath(raw.default.file);
    let defaultId = null;
    if (typeof raw.defaultId === "string") defaultId = raw.defaultId;
    else if (raw.default && typeof raw.default.id === "string") defaultId = raw.default.id;
    return { files, defaultFile, defaultId };
  }
  return null;
}

function cleanManifestPath(path){
  if (!path) return path;
  return path.replace(/^\.\/?/, "").replace(/\\/g, "/");
}

async function loadManifestList(){
  try {
    const res = await fetch("maps/manifest.json");
    if (!res.ok) throw new Error(res.statusText);
    const manifest = normalizeManifest(await res.json());
    if (manifest && manifest.files.length) return manifest;
  } catch (err) {
    console.warn("Failed to load map manifest", err);
  }
  return { files: [], defaultFile: null, defaultId: null };
}

function reportBootIssue(message){
  if (!bootStatus) return;
  if (message){
    bootStatus.textContent = message;
    bootStatus.style.display = "block";
  } else {
    bootStatus.textContent = "";
    bootStatus.style.display = "none";
  }
}

function update(dt){
  if (isSequenceActive()) return;
  const before = { x: player.x, y: player.y };
  updatePlayer(player, input.state, dt, level);

  const atLeft   = player.x <= 0.001;
  const atRight  = player.x + player.w >= level.w - 0.001;
  const atTop    = player.y <= 0.001;
  const atBottom = player.y + player.h >= level.h - 0.001;

  if (atLeft && input.state.left && level.exits.left)       return switchMap(level.exits.left,   "left",   before);
  if (atRight && input.state.right && level.exits.right)    return switchMap(level.exits.right,  "right",  before);
  if (atTop && input.state.up && level.exits.top)           return switchMap(level.exits.top,    "top",    before);
  if (atBottom && input.state.down && level.exits.bottom)   return switchMap(level.exits.bottom, "bottom", before);
}

function switchMap(targetId, viaSide, prevPos){
  const node = atlas[targetId];
  if (!node){ console.warn("Missing target map: " + targetId); return; }

  level = node.level;
  render = createRenderer(canvas, level);
  fitToWindowHeight();

  const ratioX = (prevPos.x + player.w/2) / Math.max(1, atlas[currentId].level.w);
  const ratioY = (prevPos.y + player.h/2) / Math.max(1, atlas[currentId].level.h);

  if (viaSide === "left"){        player.x = level.w - player.w - 0.05; player.y = clamp(ratioY * level.h - player.h/2, 0, level.h - player.h); }
  else if (viaSide === "right"){  player.x = 0.05;                        player.y = clamp(ratioY * level.h - player.h/2, 0, level.h - player.h); }
  else if (viaSide === "top"){    player.y = level.h - player.h - 0.05;   player.x = clamp(ratioX * level.w - player.w/2, 0, level.w - player.w); }
  else if (viaSide === "bottom"){ player.y = 0.05;                        player.x = clamp(ratioX * level.w - player.w/2, 0, level.w - player.w); }

  currentId = level.id;
  maybePlaySequence(level.story?.onLoadSequence)?.catch(err => console.warn("Sequence error", err));
}

function draw(){ render({ player, level }); }

function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

// Zoom helpers
function fitToWindowHeight() {
  const headerH = 64;
  const avail = Math.max(200, window.innerHeight - headerH - 24);
  const s = Math.max(4, Math.floor(avail / level.h));
  setScale(s);
}
function stepScale(){ return Math.max(1, Math.floor(render.getScale() * 0.1)); }
function setScale(s){
  render.setScale(s);
  zoomLabel.textContent = `Scale: ${s}px/tile — ${level.w}×${level.h} tiles`;
}
async function toggleFullscreen(){
  const root = document.documentElement;
  if (!document.fullscreenElement) await root.requestFullscreen().catch(()=>{});
  else await document.exitFullscreen().catch(()=>{});
}
