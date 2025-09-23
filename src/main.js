import { startLoop }      from "./engine/loop.js";
import { createInput }    from "./engine/input.js";
import { parseAscii }     from "./world/level.js";
import { createPlayer, updatePlayer } from "./actors/player.js";
import { createRenderer } from "./view/render.js";

const LEVEL_ASCII = `
########################################
#                                      #
# ###########              ##########  #
# #         #              #        #  #
# # P       #              #        #  #
# #         #              #        #  #
# #         #              #        #  #
# #         #              #        #  #
# #         #              ##  ######  #
# ######  ###                          #
#                                      #
#                                      #
#                                      #
#                                      #
#                                      #
#                                      #
#                                      #
#                                      #
#                                      #
#                                       
#                                       
#                                       
#                                       
#                                       
#                                      #
#                                      #
#                                      #
#                                      #
#                                      #
########################################
`.trim();

const level   = parseAscii(LEVEL_ASCII);
const player  = createPlayer(level.spawn);
const input   = createInput();
const render  = createRenderer(document.getElementById("game"), level);

startLoop(update, draw);

function update(dt){
  updatePlayer(player, input.state, dt, level);
}
function draw(){
  render({ player, level });
}
