import {
  ObjectListType,
  ParameterType,
  suggestObjectList,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  ConditionCompletionContext,
} from "src/language-service/completion/types";

/** `object_is_type <object> <object_type>` */
export const completeObjectIsType = (
  ctx: ConditionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestTyped(ctx, ParameterType.Object);
    case 1:
      return suggestObjectList(ctx, ObjectListType.Objects, { quoted: true });
    default:
      return [];
  }
};
