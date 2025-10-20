const STORAGE_KEY = "lamy.game.v1";

function createDefaultState(){
  return {
    sequencesSeen: {}
  };
}

let state = loadState();
let saveTimer = null;

function loadState(){
  if (typeof localStorage === "undefined") return createDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw);
    const next = createDefaultState();
    if (parsed && typeof parsed === "object"){
      if (parsed.sequencesSeen && typeof parsed.sequencesSeen === "object"){
        next.sequencesSeen = { ...parsed.sequencesSeen };
      }
    }
    return next;
  } catch (err) {
    console.warn("[State] Failed to load game state", err);
    return createDefaultState();
  }
}

function persist(){
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("[State] Failed to persist game state", err);
  }
  syncDebugHandle();
}

function scheduleSave(){
  if (saveTimer){
    clearTimeout(saveTimer);
  }
  saveTimer = setTimeout(persist, 100);
}

export function hasSeenSequence(id){
  if (!id) return false;
  return Boolean(state.sequencesSeen[id]);
}

export function markSequenceSeen(id){
  if (!id) return;
  if (!state.sequencesSeen[id]){
    state.sequencesSeen[id] = Date.now();
    scheduleSave();
  }
}

export function clearState(){
  state = createDefaultState();
  persist();
}

export function dumpState(){
  return JSON.parse(JSON.stringify(state));
}

function syncDebugHandle(){
  if (typeof window === "undefined") return;
  if (!window.lamyGameState){
    window.lamyGameState = {
      dump: dumpState,
      clear: clearState,
      markSeen: markSequenceSeen
    };
  }
}

syncDebugHandle();
persist();
