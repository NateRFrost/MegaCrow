import { defineActionHover } from "src/language-service/hover/registry";

export const gameGriefRecordCustomPenaltyHover = defineActionHover(
  "game_grief_record_custom_penalty",
  {
    grammar:
      "action game_grief_record_custom_penalty <player> <penalty amount>",
    params: ["player", "penalty_amount"],
  }
);
