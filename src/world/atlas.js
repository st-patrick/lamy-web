import { parseTomlLevel } from "./level.js";

export async function loadAtlasFromTomls(fileUrls){
  const entries = await Promise.all(fileUrls.map(async (url)=>{
    const txt = await (await fetch(url)).text();
    const level = parseTomlLevel(txt);
    return [level.id, { level, file: url.replace(/^\.\/?/, "") }];
  }));
  return Object.fromEntries(entries);
}
