// Minimal TOML reader for our level subset.
// Fix: root keys (id, name, grid) are always written to the root table.
export function parseTOML(src){
  const out = {};
  let ctx = out;                 // current [table]
  let inML = false, mlKey = "", mlBuf = [], mlTarget = out;

  const isRootKey = (k) => (k === "id" || k === "name" || k === "grid");

  const set = (obj, key, val) => { obj[key] = val; };

  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  for (let raw of lines){
    const line = raw.trim();

    if (!inML){
      if (!line || line.startsWith("#")) continue;

      // Table arrays (not used currently, but harmless)
      let m;
      if ((m = line.match(/^\[\[([A-Za-z0-9_]+)\]\]$/))){
        const key = m[1];
        out[key] ||= [];
        const obj = {};
        out[key].push(obj);
        ctx = obj;
        continue;
      }
      // Tables: [tiles], [spawn], [exits]
      if ((m = line.match(/^\[([A-Za-z0-9_]+)\]$/))){
        const key = m[1];
        out[key] ||= {};
        ctx = out[key];
        continue;
      }
      // Multiline start: key = """
      if ((m = line.match(/^([A-Za-z0-9_]+)\s*=\s*"""$/))){
        const key = m[1];
        inML = true;
        mlKey = key;
        mlBuf = [];
        mlTarget = isRootKey(key) ? out : ctx;
        continue;
      }
      // key = value
      if ((m = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.+)$/))){
        const key = m[1];
        let rhs = m[2].trim();
        let val;
        if ((/^".*"$/.test(rhs)) || (/^'.*'$/.test(rhs))){
          val = rhs.slice(1, -1);
        } else if (/^(true|false)$/i.test(rhs)){
          val = /^true$/i.test(rhs);
        } else if (/^-?\d+$/.test(rhs)){
          val = parseInt(rhs,10);
        } else {
          throw new Error("Unsupported TOML value: " + rhs);
        }
        const target = isRootKey(key) ? out : ctx;
        set(target, key, val);
        continue;
      }

      // Unknown line -> ignore (lenient)
    } else {
      // inside multiline
      if (line === `"""`){
        set(mlTarget, mlKey, mlBuf.join("\n")); // preserve spacing exactly
        inML = false; mlKey = ""; mlBuf = []; mlTarget = out;
      } else {
        mlBuf.push(raw); // keep raw (no trim) to preserve leading spaces
      }
    }
  }
  if (inML) throw new Error("Unterminated multiline string");
  return out;
}
