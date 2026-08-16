import { defineActionHover } from "src/language-service/hover/registry";

export const applyPlayerTraitsHover = defineActionHover("apply_player_traits", {
  grammar: "action apply_player_traits <player> <player_traits_name>",
  params: ["player", "player_traits_name"],
});
