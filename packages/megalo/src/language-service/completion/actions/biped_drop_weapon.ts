import { weaponSlot } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  ParameterType,
  suggestEnum,
  suggestKeywords,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `biped_drop_weapon <biped> <slot> [delete_on_drop]` */
export const completeBipedDropWeapon = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestTyped(ctx, ParameterType.Object);
    case 1:
      return suggestEnum(ctx, weaponSlot);
    case 2:
      return suggestKeywords(ctx, ["delete_on_drop"], "enumMember");
    default:
      return [];
  }
};
