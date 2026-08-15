import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import {
  hasOptionalKeyword,
  parseTeamOrPlayerTarget,
} from "src/frontend/intermediate-representation/elements/triggers/helpers";
import { parseSoundIndex } from "src/frontend/intermediate-representation/elements/triggers/parse_sound";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
  type TeamOrPlayerTarget,
  TeamOrPlayerTargetKind,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";

/**
 * `play_sound [everyone|player …|team …] [immediate] <sound>`
 * — 1–4 parameters depending on optional target / immediate.
 */
export const lowerPlaySound = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  if (parameters.length < 1 || parameters.length > 4) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(
        parameters.length < 1 ? 1 : 4,
        parameters.length
      ),
      location
    );
  }

  const soundNode = parameters.at(-1)!;
  const beforeSound = parameters.slice(0, -1);
  const immediate = hasOptionalKeyword(beforeSound, "immediate");
  const targetNodes = beforeSound.filter(
    (node) => !(node.kind === SyntaxKind.KEYWORD && node.value === "immediate")
  );

  const target: TeamOrPlayerTarget =
    targetNodes.length === 0
      ? { type: TeamOrPlayerTargetKind.everyone }
      : parseTeamOrPlayerTarget(targetNodes, 0, ctx, location).target;

  return {
    type: ActionType.play_sound,
    parameters: {
      soundIndex: parseSoundIndex(soundNode, ctx, location),
      immediate,
      target,
    },
  };
};
