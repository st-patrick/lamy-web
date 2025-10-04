export function parseTOML(src){
  const out = {};
  let ctx = out, arrCtx = null, inML = false, mlKey = "", mlBuf = [];
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const set = (obj, key, val) => { obj[key] = val; };

  for (let raw of lines){
    const line = raw.trim();
    if (!inML){
      if (!line || line.startsWith("#")) continue;
      let m;
      if ((m = line.match(/^\[\[([A-Za-z0-9_]+)\]\]$/))){ // not used now, but supported
        const key = m[1]; out[key] ||= []; const obj = {}; out[key].push(obj); ctx = obj; arrCtx = key; continue;
      }
      if ((m = line.match(/^\[([A-Za-z0-9_]+)\]$/))){
        const key = m[1]; out[key] ||= {}; ctx = out[key]; arrCtx = null; continue;
      }
      if ((m = line.match(/^([A-Za-z0-9_]+)\s*=\s*"""$/))){
        inML = true; mlKey = m[1]; mlBuf = []; continue;
      }
      if ((m = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.+)$/))){
        const key = m[1]; let rhs = m[2].trim(); let val;
        if ((/^".*"$/.test(rhs)) || (/^'.*'$/.test(rhs))){ val = rhs.slice(1,-1); }
        else if (/^(true|false)$/i.test(rhs)){ val = /^true$/i.test(rhs); }
        else if (/^-?\d+$/.test(rhs)){ val = parseInt(rhs,10); }
        else throw new Error("Unsupported TOML value: " + rhs);
        set(ctx === out ? out : ctx, key, val);
        continue;
      }
    } else {
      if (line === `"""`){ set(ctx === out ? out : ctx, mlKey, mlBuf.join("\n")); inML=false; mlKey=""; mlBuf=[]; }
      else mlBuf.push(raw);
    }
  }
  if (inML) throw new Error("Unterminated multiline string");
  return out;
}
