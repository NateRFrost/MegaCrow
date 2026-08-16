import { bipedGiveWeaponMode } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  ObjectListType,
  ParameterType,
  suggestEnum,
  suggestObjectList,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `biped_give_weapon <biped> <weapon> <slot>` */
export const completeBipedGiveWeapon = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestTyped(ctx, ParameterType.Object);
    case 1:
      return suggestObjectList(ctx, ObjectListType.Weapons, { quoted: true });
    case 2:
      return suggestEnum(ctx, bipedGiveWeaponMode);
    default:
      return [];
  }
};
