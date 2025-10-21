const DIRECTION_STEP = 45;
const DIRECTION_ARROWS = ["→", "↘", "↓", "↙", "←", "↖", "↑", "↗"];
const EXTRA_SPACE = 160;
const SHADOW_STEP = 0.5;
const MAX_SHADOW_DISTANCE = 20;

export function createWeatherSystem(){
  const state = {
    time: 0,
    rain: false,
    thunder: false,
    flash: 0,
    thunderCooldown: randomRange(3, 5.5),
    rainDrops: [],
    lighting: {
      enabled: false,
      angle: 45,
      maxDistance: 6,
      intensity: 0.8,
      cache: null,
      cacheAngle: null,
      cacheDistance: null,
      levelId: null,
      levelRef: null
    }
  };

  function invalidateLightingCache(){
    state.lighting.cache = null;
    state.lighting.cacheAngle = null;
    state.lighting.cacheDistance = null;
    state.lighting.levelId = null;
  }

  function update(dt){
    state.time += dt;
    if (state.thunder){
      state.thunderCooldown -= dt;
      if (state.thunderCooldown <= 0){
        triggerFlash();
      }
      state.flash = Math.max(0, state.flash - dt * 3.6);
    } else {
      state.flash = Math.max(0, state.flash - dt * 2.4);
      if (state.thunderCooldown <= 0){
        state.thunderCooldown = randomRange(3, 6);
      }
    }
  }

  function render(ctx, canvas, tileSize, level){
    if (state.lighting.enabled && state.flash > 0.01){
      renderLighting(ctx, level, tileSize);
    }
    if (state.rain){
      renderRain(ctx, canvas.width, canvas.height, tileSize);
    }
    if (state.flash > 0){
      renderFlash(ctx, canvas.width, canvas.height, state.flash);
    }
  }

  function renderRain(ctx, width, height, tileSize){
    if (width === 0 || height === 0) return;
    ensureRainDrops(width, height);
    const len = Math.max(14, tileSize * 1.2);
    const speed = 420;
    const drift = 220;

    ctx.save();
    ctx.strokeStyle = "rgba(160,200,255,0.32)";
    ctx.lineWidth = Math.max(1, tileSize * 0.07);
    ctx.lineCap = "round";
    ctx.beginPath();

    for (const drop of state.rainDrops){
      const travel = (state.time * speed + drop.offset) % (height + EXTRA_SPACE);
      const y = travel - EXTRA_SPACE / 2;
      const x = (drop.baseX + state.time * drift + drop.offset * 0.45) % (width + EXTRA_SPACE) - EXTRA_SPACE / 2;
      ctx.moveTo(x, y);
      ctx.lineTo(x - len * 0.35, y + len);
    }

    ctx.stroke();
    ctx.restore();
  }

  function renderFlash(ctx, width, height, strength){
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(235,245,255,${Math.min(1, 0.6 * strength)})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  function renderLighting(ctx, level, tileSize){
  if (!level || state.flash <= 0.01) return;
    const lighting = state.lighting;
    if (
      !lighting.cache ||
      lighting.levelId !== level.id ||
      lighting.cacheAngle !== lighting.angle ||
      lighting.cacheDistance !== lighting.maxDistance
    ){
      lighting.cache = computeLightingMask(level, lighting.angle, lighting.maxDistance);
      lighting.levelId = level.id;
      lighting.cacheAngle = lighting.angle;
      lighting.cacheDistance = lighting.maxDistance;
    }
    const mask = lighting.cache;
    if (!mask) return;

    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    for (let y = 0; y < mask.length; y++){
      const row = mask[y];
      for (let x = 0; x < row.length; x++){
        const intensity = row[x];
        if (intensity <= 0) continue;
  const flashFactor = Math.min(1, state.flash);
  const alpha = Math.min(1, intensity * lighting.intensity * flashFactor);
        if (alpha <= 0.001) continue;
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha.toFixed(3)})`;
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
    ctx.restore();
  }

  function ensureRainDrops(width, height){
    const target = Math.max(40, Math.floor((width * height) / 9000));
    while (state.rainDrops.length < target){
      state.rainDrops.push(createDrop(width, height));
    }
    if (state.rainDrops.length > target){
      state.rainDrops.length = target;
    }
  }

  function createDrop(width, height){
    return {
      baseX: Math.random() * (width + EXTRA_SPACE) - EXTRA_SPACE / 2,
      offset: Math.random() * (height + EXTRA_SPACE)
    };
  }

  function triggerFlash(force = false){
    state.flash = 1;
    state.thunderCooldown = randomRange(force ? 1.3 : 2.2, 5.5);
  }

  function setLevel(level){
    state.lighting.levelRef = level || null;
    if (!state.lighting.enabled || !level || state.lighting.maxDistance <= 0){
      invalidateLightingCache();
      return;
    }
    state.lighting.cache = computeLightingMask(level, state.lighting.angle, state.lighting.maxDistance);
    state.lighting.levelId = level.id;
    state.lighting.cacheAngle = state.lighting.angle;
    state.lighting.cacheDistance = state.lighting.maxDistance;
  }

  function toggleRain(){
    state.rain = !state.rain;
    return state.rain;
  }

  function isRainEnabled(){
    return state.rain;
  }

  function toggleThunder(){
    state.thunder = !state.thunder;
    if (state.thunder){
      triggerFlash(true);
    } else {
      state.flash = 0;
      state.thunderCooldown = randomRange(3, 6);
    }
    return state.thunder;
  }

  function isThunderEnabled(){
    return state.thunder;
  }

  function setLightingEnabled(value){
    if (state.lighting.enabled === value) return state.lighting.enabled;
    state.lighting.enabled = value;
    invalidateLightingCache();
    if (state.lighting.enabled && state.lighting.levelRef){
      setLevel(state.lighting.levelRef);
    }
    return state.lighting.enabled;
  }

  function toggleLighting(){
    setLightingEnabled(!state.lighting.enabled);
    return state.lighting.enabled;
  }

  function cycleLightingDirection(){
    if (!state.lighting.enabled){
      setLightingEnabled(true);
    }
    return setLightingAngle(state.lighting.angle + DIRECTION_STEP);
  }

  function setLightingAngle(angle){
    const normalized = normalizeAngle(angle);
    if (Math.abs(normalized - state.lighting.angle) < 0.001){
      return state.lighting.angle;
    }
    state.lighting.angle = normalized;
    invalidateLightingCache();
    if (state.lighting.enabled && state.lighting.levelRef){
      setLevel(state.lighting.levelRef);
    }
    return state.lighting.angle;
  }

  function getLightingAngle(){
    return state.lighting.angle;
  }

  function setShadowLength(length){
    const clamped = clamp(length, 0, MAX_SHADOW_DISTANCE);
    if (Math.abs(clamped - state.lighting.maxDistance) < 0.001){
      return state.lighting.maxDistance;
    }
    state.lighting.maxDistance = clamped;
    invalidateLightingCache();
    if (state.lighting.enabled && state.lighting.levelRef){
      setLevel(state.lighting.levelRef);
    }
    return state.lighting.maxDistance;
  }

  function getShadowLength(){
    return state.lighting.maxDistance;
  }

  function getLightingSymbol(){
    const normalized = normalizeAngle(state.lighting.angle);
    const index = Math.round(normalized / DIRECTION_STEP) % DIRECTION_ARROWS.length;
    return DIRECTION_ARROWS[index] || "→";
  }

  return {
    update,
    render,
    setLevel,
    toggleRain,
    isRainEnabled,
    toggleThunder,
    isThunderEnabled,
    toggleLighting,
    setLightingEnabled,
    cycleLightingDirection,
    setLightingAngle,
    getLightingAngle,
    setShadowLength,
    getShadowLength,
    isLightingEnabled: () => state.lighting.enabled,
    triggerFlash: () => triggerFlash(true),
    getLightingSymbol
  };
}

function randomRange(min, max){
  return min + Math.random() * (max - min);
}

function computeLightingMask(level, angleDeg, maxDistance){
  if (!level || maxDistance <= 0) return null;
  const w = level.w;
  const h = level.h;
  const wall = level.chars.wall;
  const grid = level.grid;
  const mask = Array.from({ length: h }, () => Array(w).fill(0));

  const angle = normalizeAngle(angleDeg) * Math.PI / 180;
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const stepDistance = Math.max(0.1, SHADOW_STEP);
  const maxSteps = Math.max(1, Math.round(maxDistance / stepDistance));
  const denominator = Math.max(1, maxSteps - 1);
  const decay = 1 / denominator;

  for (let y = 0; y < h; y++){
    for (let x = 0; x < w; x++){
      if (grid[y][x] === wall){
        mask[y][x] = 0;
        continue;
      }
      let sx = x + 0.5;
      let sy = y + 0.5;
      let occlusion = 0;
      for (let step = 1; step <= maxSteps; step++){
        sx -= dirX * stepDistance;
        sy -= dirY * stepDistance;
        if (sx < 0 || sy < 0 || sx >= w || sy >= h) break;
        const cx = Math.floor(sx);
        const cy = Math.floor(sy);
        if (grid[cy][cx] === wall){
          const falloff = Math.max(0, 1 - (step - 1) * decay);
          occlusion = Math.max(occlusion, Math.min(1, falloff));
          break;
        }
      }
      mask[y][x] = occlusion;
    }
  }

  return mask;
}

function normalizeAngle(deg){
  let value = deg % 360;
  if (value < 0) value += 360;
  return value;
}

function clamp(value, min, max){
  return Math.max(min, Math.min(max, value));
}
