import { hasSeenSequence, markSequenceSeen } from "./state.js";

const MANIFEST_URL = "seq/manifest.json";
let sequences = null;
let overlay = null;
let visualEl = null;
let textEl = null;
let hintEl = null;
let active = null;
let keyListenerBound = false;
let overlayBound = false;

function ensureOverlay(){
  if (!overlay){
    overlay = document.getElementById("sequenceOverlay");
    if (!overlay){
      overlay = document.createElement("div");
      overlay.id = "sequenceOverlay";
      overlay.setAttribute("aria-hidden", "true");
      overlay.innerHTML = `
        <div class="sequence-frame">
          <div class="sequence-visual">
            <div class="sequence-text"></div>
          </div>
          <div class="sequence-hint">Press any key or click to continue</div>
        </div>`;
      document.body.appendChild(overlay);
    }
  }
  visualEl = overlay.querySelector(".sequence-visual");
  textEl = overlay.querySelector(".sequence-text");
  hintEl = overlay.querySelector(".sequence-hint");
  if (!overlayBound){
    overlay.addEventListener("click", advanceFromPointer);
    overlay.addEventListener("pointerdown", e => e.preventDefault());
    overlayBound = true;
  }
  bindKeyListener();
}

function bindKeyListener(){
  if (keyListenerBound) return;
  window.addEventListener("keydown", onKeyDown, true);
  keyListenerBound = true;
}

function onKeyDown(event){
  if (!active) return;
  if (event.key === "Tab") return; // allow tab navigation if needed
  event.preventDefault();
  event.stopImmediatePropagation();
  advance();
}

function advanceFromPointer(event){
  if (!active) return;
  event.preventDefault();
  advance();
}

function renderFrame(frame){
  if (!textEl || !visualEl) return;
  if (!frame) return;
  if (frame.image){
    visualEl.style.backgroundImage = `url(${frame.image})`;
    visualEl.classList.remove("no-image");
  } else {
    visualEl.style.backgroundImage = "none";
    visualEl.classList.add("no-image");
  }
  textEl.innerHTML = "";
  const lines = Array.isArray(frame.text) ? frame.text : [];
  for (const chunk of lines){
    const p = document.createElement("p");
    p.textContent = chunk;
    textEl.appendChild(p);
  }
}

function hideOverlay(){
  if (!overlay) return;
  overlay.classList.remove("visible");
  overlay.setAttribute("aria-hidden", "true");
}

function showOverlay(){
  ensureOverlay();
  overlay.classList.add("visible");
  overlay.setAttribute("aria-hidden", "false");
}

function normalizeSequence(raw){
  const frames = Array.isArray(raw.frames) ? raw.frames : [];
  const mapped = frames.map((frame = {}) => {
    const image = frame.i || null;
    const text = Array.isArray(frame.t) ? frame.t.filter(Boolean) : [];
    return { image, text };
  }).filter(frame => frame.image || frame.text.length);
  return {
    id: raw.id,
    frames: mapped
  };
}

async function loadSequencesOnce(){
  if (sequences) return sequences;
  try {
    const res = await fetch(MANIFEST_URL);
    if (!res.ok) throw new Error(res.statusText);
    const list = await res.json();
    sequences = {};
    if (Array.isArray(list)){
      for (const entry of list){
        if (!entry || typeof entry !== "object" || !entry.id) continue;
        sequences[entry.id] = normalizeSequence(entry);
      }
    }
  } catch (err) {
    console.warn("[Sequences] Failed to load manifest", err);
    sequences = {};
  }
  return sequences;
}

export async function maybePlaySequence(id){
  if (!id) return;
  await loadSequencesOnce();
  if (!sequences[id]){
    console.warn(`[Sequences] Missing sequence: ${id}`);
    markSequenceSeen(id);
    return;
  }
  if (hasSeenSequence(id)) return;
  const seq = sequences[id];
  if (!seq.frames.length){
    markSequenceSeen(id);
    return;
  }
  await playSequence(seq);
  markSequenceSeen(id);
}

function playSequence(seq){
  ensureOverlay();
  if (!visualEl || !textEl) return Promise.resolve();
  return new Promise(resolve => {
    active = {
      resolve,
      seq,
      index: 0
    };
    showOverlay();
    renderFrame(seq.frames[0]);
    updateHint();
  });
}

function advance(){
  if (!active) return;
  const { seq } = active;
  active.index++;
  if (active.index >= seq.frames.length){
    const done = active.resolve;
    active = null;
    hideOverlay();
    if (typeof done === "function") done();
    return;
  }
  renderFrame(seq.frames[active.index]);
  updateHint();
}

function updateHint(){
  if (!hintEl) return;
  if (!active) return;
  const { index, seq } = active;
  const remaining = seq.frames.length - index - 1;
  hintEl.textContent = remaining > 0
    ? "Press any key or click to continue"
    : "Press any key or click to finish";
}

export function isSequenceActive(){
  return Boolean(active);
}
