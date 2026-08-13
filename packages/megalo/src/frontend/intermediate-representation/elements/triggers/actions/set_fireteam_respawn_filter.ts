import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  ActionType,
  type Action,
  type FireteamFilter,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import { resolveObjectReference } from "src/frontend/intermediate-representation/parameters";

const emptyFireteamFilter = (): FireteamFilter => ({
  fireteam1: false,
  fireteam2: false,
  fireteam3: false,
  fireteam4: false,
  fireteam5: false,
  fireteam6: false,
  fireteam7: false,
  fireteam8: false,
});

const FIRETEAM_KEYS = [
  "fireteam1",
  "fireteam2",
  "fireteam3",
  "fireteam4",
  "fireteam5",
  "fireteam6",
  "fireteam7",
  "fireteam8",
] as const satisfies readonly (keyof FireteamFilter)[];

const applyFireteamFilterToken = (
  node: ASTParameterNode,
  filter: FireteamFilter,
  location: SourceCodeLocation
): void => {
  if (node.kind === SyntaxKind.INTEGER) {
    if (node.value < 0 || node.value > 3) {
      throw new LowerError(
        diagnosticMessages.expectedParameterType(
          "fireteam filter",
          String(node.value)
        ),
        node.location ?? location
      );
    }
    for (const key of FIRETEAM_KEYS) {
      filter[key] = false;
    }
    filter[FIRETEAM_KEYS[node.value]!] = true;
    return;
  }

  const name =
    node.kind === SyntaxKind.KEYWORD
      ? node.value.toLowerCase()
      : node.kind === SyntaxKind.REFERENCE
        ? node.identifier.toLowerCase()
        : undefined;
  if (name === "none") {
    for (const key of FIRETEAM_KEYS) {
      filter[key] = false;
    }
    return;
  }
  if (name === "all") {
    for (const key of FIRETEAM_KEYS) {
      filter[key] = true;
    }
    return;
  }
  throw new LowerError(
    diagnosticMessages.expectedParameterType("fireteam filter", name ?? ""),
    node.location ?? location
  );
};

export const lowerSetFireteamRespawnFilter = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  if (parameters.length < 2) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(2, parameters.length),
      location
    );
  }
  const fireteamFilter = emptyFireteamFilter();
  applyFireteamFilterToken(parameters[1]!, fireteamFilter, location);
  return {
    type: ActionType.SetFireteamRespawnFilter,
    parameters: {
      object: resolveObjectReference(
        parameters[0]!,
        asParameterLoweringContext(ctx)
      ),
      fireteamFilter,
    },
  };
};
