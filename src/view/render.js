const LIGHT_DEFAULT = { wall:"#000", floor:"#fff", player:"#1976d2" };
const DARK_DEFAULT  = { wall:"#000", floor:"#526383ff", player:"#9dc9f5ff" };

export function createRenderer(canvas, level, config) {
  const opts = normalizeOptions(config);
  const palette = opts.palette;
  const useDarkMode = opts.mode === "dark";
  const shadeFactor = useDarkMode ? opts.backgroundShade : 1;
  const bgCache = new Map();

  let s = 12; // pixels per tile; main.js adjusts via auto-fit
  const ctx = canvas.getContext("2d", { alpha:false });

  function resize() {
    const w = Math.max(1, Math.floor(level.w * s));
    const h = Math.max(1, Math.floor(level.h * s));
    canvas.width = w;
    canvas.height = h;
  }
  resize();

  function render(state){
    ctx.fillStyle = palette.floor;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const bgGrid = level.background;
    const bgPalette = level.palette ?? {};
    if (bgGrid){
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

    const p = state.player;
    ctx.fillStyle = palette.player;
    ctx.fillRect(p.x*s, p.y*s, p.w*s, p.h*s);
  }

  render.setScale = (next)=>{ s = Math.max(2, Math.floor(next)); resize(); };
  render.getScale = ()=> s;

  return render;
}

function normalizeOptions(config){
  if (config && ("wall" in config || "floor" in config || "player" in config)){
    return {
      mode: "light",
      palette: { ...LIGHT_DEFAULT, ...config },
      backgroundShade: 1
    };
  }
  const mode = config?.mode ?? "dark";
  const paletteOverride = config?.palette ?? {};
  const backgroundShade = typeof config?.backgroundShade === "number" ? config.backgroundShade : 0.78;
  const defaults = mode === "dark" ? DARK_DEFAULT : LIGHT_DEFAULT;
  return {
    mode,
    palette: { ...defaults, ...paletteOverride },
    backgroundShade
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
