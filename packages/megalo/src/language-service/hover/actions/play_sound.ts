import { defineActionHover } from "src/language-service/hover/registry";

export const playSoundHover = defineActionHover("play_sound", {
  grammar: "action play_sound <team_or_player_target> [immediate] <sound>",
  params: ["team_or_player_target", "sound"],
});
