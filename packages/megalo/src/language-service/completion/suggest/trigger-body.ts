import { suggestKeywords } from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  TriggerBodyCompletionContext,
} from "src/language-service/completion/types";

export const TRIGGER_BODY_KEYWORDS = [
  "action",
  "condition",
  "temporary",
  "begin",
  "end",
] as const;

export const suggestTriggerBody = (
  ctx: TriggerBodyCompletionContext
): CompletionItem[] => suggestKeywords(ctx, TRIGGER_BODY_KEYWORDS);
