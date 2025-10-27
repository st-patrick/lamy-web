const LIGHT_DEFAULT = { wall:"#20242b", floor:"#f5f6f9", player:"#1976d2" };
const DARK_DEFAULT  = { wall:"#000000", floor:"#111111", player:"#145ca3" };
const IMAGE_CACHE = new Map();

export function createRenderer(canvas, level, config) {
  let options = normalizeOptions(config);
  let palette = options.palette;
  let shadeFactor = options.backgroundShade;
  let bgCache = new Map();
  const backgroundSource = level.backgroundImage || null;
  const labelSprites = Array.isArray(level.labels)
    ? level.labels.map(entry => ({
        x: entry.x,
        y: entry.y,
        text: entry.text ?? entry.symbol ?? ""
      }))
    : [];

  let s = 12; // pixels per tile; main.js adjusts via auto-fit
  const ctx = canvas.getContext("2d", { alpha:false });

  function resize() {
    const w = Math.max(1, Math.floor(level.w * s));
    const h = Math.max(1, Math.floor(level.h * s));
    canvas.width = w;
    canvas.height = h;
  }
  resize();

  function render(state = {}){
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let bgHandle = null;
    const hasBgImage = Boolean(backgroundSource);
    const bgGrid = level.background;
    const bgPalette = level.palette ?? {};
    const showFloor = options.showFloor !== false;

    if (hasBgImage){
      bgHandle = getImageHandle(backgroundSource);
    }

    const imageReady = hasBgImage && bgHandle?.status === "loaded";
    if (imageReady){
      drawImageCover(ctx, bgHandle.image, canvas.width, canvas.height);
    } else if (showFloor){
      ctx.fillStyle = palette.floor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (showFloor && bgGrid){
      for (let y=0; y<level.h; y++){
        for (let x=0; x<level.w; x++){
          const code = bgGrid[y]?.[x];
          const color = resolveBackgroundColor(code, bgPalette, shadeFactor, bgCache);
          if (color){
            ctx.fillStyle = color;
            ctx.fillRect(x*s, y*s, s, s);
          }
        }
      }
    }

    for (let y=0; y<level.h; y++){
      for (let x=0; x<level.w; x++){
        if (level.grid[y][x] === level.chars.wall){
          ctx.fillStyle = palette.wall;
          ctx.fillRect(x*s, y*s, s, s);
        }
      }
    }

    if (labelSprites.length){
      ctx.save();
      const fontSize = Math.max(8, Math.round(s * 0.6));
      ctx.font = `${fontSize}px "Segoe UI", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      const strokeWidth = Math.max(1, Math.round(fontSize * 0.2));
      for (const label of labelSprites){
        if (!label || !label.text) continue;
        const cx = (label.x + 0.5) * s;
        const cy = (label.y + 0.5) * s;
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = "rgba(17, 24, 39, 0.7)";
        ctx.fillStyle = "#f8fafc";
        ctx.strokeText(label.text, cx, cy);
        ctx.fillText(label.text, cx, cy);
      }
      ctx.restore();
    }

    const p = state.player;
    if (p){
      ctx.fillStyle = palette.player;
      ctx.fillRect(p.x*s, p.y*s, p.w*s, p.h*s);
    }

    if (state.weather && typeof state.weather.render === "function"){
      state.weather.render(ctx, canvas, s, level);
    }
  }

  render.setScale = (next)=>{ s = Math.max(2, Math.floor(next)); resize(); };
  render.getScale = ()=> s;
  render.setOptions = (nextConfig)=>{
    options = normalizeOptions(nextConfig);
    palette = options.palette;
    shadeFactor = options.backgroundShade;
    bgCache = new Map();
  };
  render.getOptions = ()=> ({ ...options, palette: { ...palette } });

  return render;
}

function getImageHandle(src){
  if (!src) return null;
  if (IMAGE_CACHE.has(src)) return IMAGE_CACHE.get(src);

  const image = new Image();
  const handle = { image, status: "loading" };
  image.onload = ()=>{ handle.status = "loaded"; };
  image.onerror = ()=>{ handle.status = "error"; };
  image.src = src;
  IMAGE_CACHE.set(src, handle);
  return handle;
}

function normalizeOptions(config){
  if (config && ("wall" in config || "floor" in config || "player" in config)){
    const { showFloor = true, ...colors } = config;
    return {
      mode: "light",
      palette: { ...LIGHT_DEFAULT, ...colors },
      backgroundShade: 1,
      showFloor
    };
  }
  const mode = config?.mode ?? "dark";
  const paletteOverride = config?.palette ?? {};
  const backgroundShade = typeof config?.backgroundShade === "number"
    ? config.backgroundShade
    : (mode === "dark" ? 0.78 : 1);
  const defaults = mode === "dark" ? DARK_DEFAULT : LIGHT_DEFAULT;
  const showFloor = config?.showFloor === false ? false : true;
  return {
    mode,
    palette: { ...defaults, ...paletteOverride },
    backgroundShade,
    showFloor
  };
}

function resolveBackgroundColor(code, sourcePalette, shadeFactor, cache){
  if (!code || !sourcePalette || !sourcePalette[code]) return null;
  const key = `${code}:${shadeFactor}`;
  if (cache.has(key)) return cache.get(key);
  const base = sourcePalette[code];
  const color = shadeFactor >= 0.999 ? base : darkenColor(base, shadeFactor);
  cache.set(key, color);
  return color;
}

function darkenColor(color, factor){
  const rgb = parseHex(color);
  if (!rgb) return color;
  const [r,g,b] = rgb.map(c => clampByte(c * factor));
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function parseHex(value){
  if (typeof value !== "string") return null;
  let hex = value.trim();
  if (!hex.startsWith("#")) return null;
  hex = hex.slice(1);
  if (hex.length === 3){
    hex = hex.split("").map(ch => ch + ch).join("");
  }
  if (hex.length !== 6) return null;
  const int = parseInt(hex, 16);
  if (Number.isNaN(int)) return null;
  return [
    (int >> 16) & 0xff,
    (int >> 8) & 0xff,
    int & 0xff
  ];
}

function clampByte(v){
  return Math.max(0, Math.min(255, Math.round(v)));
}

function toHex(v){
  return v.toString(16).padStart(2, "0");
}

function drawImageCover(ctx, image, width, height){
  if (!image || width <= 0 || height <= 0) return;
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const dx = (width - drawWidth) / 2;
  const dy = (height - drawHeight) / 2;
  ctx.drawImage(image, dx, dy, drawWidth, drawHeight);
}
