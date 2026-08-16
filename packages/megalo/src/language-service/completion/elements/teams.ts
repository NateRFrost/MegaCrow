import type { TeamsElementNode } from "src/frontend/abstract-syntax-tree/elements/teams";
import {
  designatorSwitchType,
  multiplayerTeamDesignator,
  playerModelChoice,
  teamOptionsModelOverrideType,
} from "src/frontend/intermediate-representation/game/game_engine_default";
import {
  focusNamedPropertyAllowingEmptyValue,
  isSameLineAs,
  type NamedPropertyLike,
} from "src/language-service/completion/elements/property";
import {
  ParameterType,
  suggestEnum,
  suggestKeywords,
  suggestTyped,
  withBlockEndSnippet,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  ElementCompletionContext,
} from "src/language-service/completion/types";

const BLOCK_KEYS = ["model", "designator_switch_type", "team", "end"] as const;
const TEAM_KEYS = [
  "name",
  "designator",
  "model",
  "color",
  "fireteam_count",
] as const;

const sameLineAfter = (
  ctx: ElementCompletionContext,
  property: NamedPropertyLike
): boolean => isSameLineAs(ctx.snapshot, ctx.offset, property.location);

const completeBlockValue = (
  ctx: ElementCompletionContext,
  key: string
): CompletionItem[] => {
  switch (key) {
    case "model":
      return suggestEnum(ctx, teamOptionsModelOverrideType);
    case "designator_switch_type":
      return suggestEnum(ctx, designatorSwitchType);
    default:
      return [];
  }
};

const completeTeamValue = (
  ctx: ElementCompletionContext,
  key: string
): CompletionItem[] => {
  switch (key) {
    case "name":
      return suggestTyped(ctx, ParameterType.String);
    case "designator":
      return suggestEnum(ctx, multiplayerTeamDesignator);
    case "model":
      return suggestEnum(ctx, playerModelChoice);
    case "color":
    case "fireteam_count":
      return suggestTyped(ctx, ParameterType.Integer);
    default:
      return [];
  }
};

export const completeTeams = (
  ctx: ElementCompletionContext
): CompletionItem[] => {
  const element = ctx.element as TeamsElementNode;

  for (const team of element.teams) {
    if (
      ctx.offset < team.location.start.localOffset ||
      ctx.offset > team.location.end.localOffset
    ) {
      continue;
    }

    const focus = focusNamedPropertyAllowingEmptyValue(
      team.properties,
      ctx.offset,
      (property) => sameLineAfter(ctx, property)
    );
    if (focus?.kind === "value") {
      return completeTeamValue(ctx, focus.key);
    }
    return suggestKeywords(ctx, TEAM_KEYS, "property");
  }

  const focus = focusNamedPropertyAllowingEmptyValue(
    element.properties,
    ctx.offset,
    (property) => sameLineAfter(ctx, property)
  );
  if (focus?.kind === "value") {
    return completeBlockValue(ctx, focus.key);
  }
  return suggestKeywords(ctx, BLOCK_KEYS, "property").map((entry) =>
    entry.label === "team" ? withBlockEndSnippet(entry) : entry
  );
};
