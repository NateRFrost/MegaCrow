import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import { SyntaxKind } from "../../../../abstract-syntax-tree";
import type { SourceCodeLocation } from "../../../../diagnostics";
import {
  ActionType,
  TeamOrPlayerTargetKind,
  type Action,
  type TeamOrPlayerTarget,
} from "../../../game/megalogamengine/megalogamengine_actions";
import { MegaloSound } from "../../../game/megalogamengine/megalogamengine_sounds";
import type { ElementLowerContext } from "../../../parameters/context";
import { hasOptionalKeyword, parseTeamOrPlayerTarget } from "../helpers";
import { parseSoundIndex } from "../parse_sound";

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

  const soundNode = parameters[parameters.length - 1]!;
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
