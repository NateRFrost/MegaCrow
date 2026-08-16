import {
  ObjectListType,
  ParameterType,
  suggestObjectList,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `set_team_respawn_vehicle <vehicle> <team>` */
export const completeSetTeamRespawnVehicle = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestObjectList(ctx, ObjectListType.Vehicles, { quoted: true });
    case 1:
      return suggestTyped(ctx, ParameterType.Team);
    default:
      return [];
  }
};
