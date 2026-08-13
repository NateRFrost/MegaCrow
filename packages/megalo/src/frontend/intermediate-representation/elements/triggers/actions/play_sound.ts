import type { SourceCodeLocation } from "src/diagnostics";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import {
  hasOptionalKeyword,
  parseTeamOrPlayerTarget,
} from "src/frontend/intermediate-representation/elements/triggers/helpers";
import { parseSoundIndex } from "src/frontend/intermediate-representation/elements/triggers/parse_sound";
import {
  type Action,
  ActionType,
  type TeamOrPlayerTarget,
  TeamOrPlayerTargetKind,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { MegaloSound } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_sounds";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";

export const lowerPlaySound = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  if (parameters.length === 0) {
    return {
      type: ActionType.PlaySound,
      parameters: {
        soundIndex: MegaloSound.Slayer,
        immediate: false,
        target: { type: TeamOrPlayerTargetKind.Everyone },
      },
    };
  }

  const soundNode = parameters.at(-1)!;
  const beforeSound = parameters.slice(0, -1);
  const immediate = hasOptionalKeyword(beforeSound, "immediate");
  const targetNodes = beforeSound.filter(
    (node) => !(node.kind === SyntaxKind.KEYWORD && node.value === "immediate")
  );

  const target: TeamOrPlayerTarget =
    targetNodes.length === 0
      ? { type: TeamOrPlayerTargetKind.Everyone }
      : parseTeamOrPlayerTarget(targetNodes, 0, ctx, location).target;

  return {
    type: ActionType.PlaySound,
    parameters: {
      soundIndex: parseSoundIndex(soundNode, ctx, location),
      immediate,
      target,
    },
  };
};
