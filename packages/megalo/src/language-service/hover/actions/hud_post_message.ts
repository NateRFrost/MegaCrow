import { defineActionHover } from "src/language-service/hover/registry";

export const hudPostMessageHover = defineActionHover("hud_post_message", {
  grammar:
    "action hud_post_message <team_or_player_target> <sound> <dynamic_string>",
  params: ["team_or_player_target", "sound", "dynamic_string"],
});
