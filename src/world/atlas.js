import { parseTomlLevel } from "./level.js";

export async function loadAtlasFromTomls(fileUrls){
  const entries = await Promise.all(fileUrls.map(async (url)=>{
    const txt = await (await fetch(url)).text();
    const level = parseTomlLevel(txt);
    if (level.backgroundImage && typeof window !== "undefined" && window.location){
      try {
        const base = new URL(url, window.location.href);
        level.backgroundImage = new URL(level.backgroundImage, base).toString();
      } catch (err){
        console.warn("Failed to resolve background image for", level.id, err);
      }
    }
    return [level.id, { level, file: url.replace(/^\.\/?/, "") }];
  }));
  return Object.fromEntries(entries);
}
