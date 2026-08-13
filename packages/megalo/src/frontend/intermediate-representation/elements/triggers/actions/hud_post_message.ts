import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../../diagnostics";
import { diagnosticMessages } from "../../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  ActionType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import type { ElementLowerContext } from "../../../parameters/context";
import { lowerDynamicString } from "../dynamicString";
import { parseTeamOrPlayerTarget } from "../helpers";
import { parseSoundIndex } from "../parse_sound";

export const lowerHudPostMessage = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  if (parameters.length < 3) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(3, parameters.length),
      location
    );
  }

  const { target, nextIndex } = parseTeamOrPlayerTarget(
    parameters,
    0,
    ctx,
    location
  );
  const soundNode = parameters[nextIndex];
  const stringNode = parameters[nextIndex + 1];
  if (soundNode === undefined || stringNode === undefined) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(
        nextIndex + 2,
        parameters.length
      ),
      location
    );
  }
  if (nextIndex + 2 !== parameters.length) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(
        nextIndex + 2,
        parameters.length
      ),
      location
    );
  }

  return {
    type: ActionType.HudPostMessage,
    parameters: {
      target,
      soundIndex: parseSoundIndex(soundNode, ctx, location),
      string: lowerDynamicString(stringNode, ctx),
    },
  };
};
