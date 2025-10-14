// Minimal TOML reader for our level subset.
// Fix: root keys (id, name, grid) are always written to the root table.
export function parseTOML(src){
  const out = {};
  let ctx = out;                 // current [table]
  let path = [];                 // dotted path for current table
  let inML = false, mlKey = "", mlBuf = [], mlTarget = out;

  const isRootKey = (k) => (k === "id" || k === "name" || k === "grid");

  const set = (obj, key, val) => { obj[key] = val; };

  const shouldForceRoot = (key, path) => {
    if (!isRootKey(key)) return false;
    if (key === "grid"){
      if (path.length === 0) return true;
      if (path.length === 1 && path[0] !== "layers") return true;
      return false;
    }
    return path.length === 0;
  };

  const ensureTable = (segments) => {
    let target = out;
    for (const seg of segments){
      target[seg] ||= {};
      if (typeof target[seg] !== "object" || Array.isArray(target[seg])){
        throw new Error(`TOML: attempted to reuse key '${segments.join('.')}' as non-table.`);
      }
      target = target[seg];
    }
    return target;
  };

  const ensureArrayTable = (segments) => {
    const head = segments.slice(0, -1);
    const leaf = segments[segments.length - 1];
    let target = out;
    for (const seg of head){
      target[seg] ||= {};
      if (typeof target[seg] !== "object" || Array.isArray(target[seg])){
        throw new Error(`TOML: attempted to reuse key '${segments.join('.')}' as non-table.`);
      }
      target = target[seg];
    }
    target[leaf] ||= [];
    if (!Array.isArray(target[leaf])){
      throw new Error(`TOML: key '${segments.join('.')}' already used as non-array.`);
    }
    const obj = {};
    target[leaf].push(obj);
    return obj;
  };

  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  for (let raw of lines){
    const line = raw.trim();

    if (!inML){
      if (!line || line.startsWith("#")) continue;

      let m;
      if ((m = line.match(/^\[\[([A-Za-z0-9_.]+)\]\]$/))){
        const segments = m[1].split('.');
        ctx = ensureArrayTable(segments);
        path = [segments[0]]; // we only care about the root segment for routing root keys
        continue;
      }

      if ((m = line.match(/^\[([A-Za-z0-9_.]+)\]$/))){
        const segments = m[1].split('.');
        ctx = ensureTable(segments);
        path = segments;
        continue;
      }

      if ((m = line.match(/^([A-Za-z0-9_]+)\s*=\s*"""$/))){
        const key = m[1];
        inML = true;
        mlKey = key;
        mlBuf = [];
        const forceRoot = shouldForceRoot(key, path);
        mlTarget = forceRoot ? out : ctx;
        if (forceRoot){ ctx = out; path = []; }
        continue;
      }

      if ((m = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.+)$/))){
        const key = m[1];
        let rhs = m[2].trim();
        let val;
        if ((/^".*"$/.test(rhs)) || (/^'.*'$/.test(rhs))){
          val = rhs.slice(1, -1)
            .replace(/\\\\/g, "\\")
            .replace(/\\"/g, '"')
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "\r")
            .replace(/\\t/g, "\t");
        } else if (/^(true|false)$/i.test(rhs)){
          val = /^true$/i.test(rhs);
        } else if (/^-?\d+$/.test(rhs)){
          val = parseInt(rhs, 10);
        } else if (/^-?\d*\.\d+$/.test(rhs)){
          val = parseFloat(rhs);
        } else {
          throw new Error("Unsupported TOML value: " + rhs);
        }
        const forceRoot = shouldForceRoot(key, path);
        const target = forceRoot ? out : ctx;
        set(target, key, val);
        if (forceRoot){ ctx = out; path = []; }
        continue;
      }

      // Unknown line -> ignore (lenient)
    } else {
      if (line === `"""`){
        set(mlTarget, mlKey, mlBuf.join("\n"));
        inML = false; mlKey = ""; mlBuf = []; mlTarget = out;
      } else {
        mlBuf.push(raw);
      }
    }
  }
  if (inML) throw new Error("Unterminated multiline string");
  return out;
}
