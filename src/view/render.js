const LIGHT_DEFAULT = { wall:"#20242b", floor:"#f5f6f9", player:"#1976d2" };
const DARK_DEFAULT  = { wall:"#000000", floor:"#111111", player:"#145ca3" };
const IMAGE_CACHE = new Map();

export function createRenderer(canvas, level, config) {
  let options = normalizeOptions(config);
  let palette = options.palette;
  const backgroundSource = level.backgroundImage || null;

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

    if (hasBgImage){
      bgHandle = getImageHandle(backgroundSource);
    }

    const imageReady = hasBgImage && bgHandle?.status === "loaded";
    if (imageReady){
      drawImageCover(ctx, bgHandle.image, canvas.width, canvas.height);
    } else if (!hasBgImage){
      ctx.fillStyle = palette.floor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (!hasBgImage){
      for (let y=0; y<level.h; y++){
        for (let x=0; x<level.w; x++){
          if (level.grid[y][x] === level.chars.wall){
            ctx.fillStyle = palette.wall;
            ctx.fillRect(x*s, y*s, s, s);
          }
        }
      }
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
    const colors = { ...config };
    return {
      mode: "light",
      palette: { ...LIGHT_DEFAULT, ...colors }
    };
  }
  const mode = config?.mode ?? "dark";
  const paletteOverride = config?.palette ?? {};
  const defaults = mode === "dark" ? DARK_DEFAULT : LIGHT_DEFAULT;
  return {
    mode,
    palette: { ...defaults, ...paletteOverride }
  };
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
