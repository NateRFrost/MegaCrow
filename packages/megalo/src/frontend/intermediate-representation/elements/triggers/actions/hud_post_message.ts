import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { lowerDynamicString } from "src/frontend/intermediate-representation/elements/triggers/dynamicString";
import { parseTeamOrPlayerTarget } from "src/frontend/intermediate-representation/elements/triggers/helpers";
import { parseSoundIndex } from "src/frontend/intermediate-representation/elements/triggers/parse_sound";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";

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
