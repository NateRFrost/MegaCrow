import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { LowerError } from "../../../error";
import {
  ActionType,
  type Action,
  type FireteamFilter,
} from "../../../game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import { resolveObjectReference } from "../../../parameters";
import { requireKeyword } from "../helpers";

const FIRETEAM_KEYWORDS: Record<string, keyof FireteamFilter> = {
  fireteam1: "fireteam1",
  fireteam2: "fireteam2",
  fireteam3: "fireteam3",
  fireteam4: "fireteam4",
  fireteam5: "fireteam5",
  fireteam6: "fireteam6",
  fireteam7: "fireteam7",
  fireteam8: "fireteam8",
};

export const lowerSetFireteamRespawnFilter = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  if (parameters.length < 2) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(2, parameters.length),
      location,
    );
  }
  const fireteamFilter: FireteamFilter = {
    fireteam1: false,
    fireteam2: false,
    fireteam3: false,
    fireteam4: false,
    fireteam5: false,
    fireteam6: false,
    fireteam7: false,
    fireteam8: false,
  };
  for (let i = 1; i < parameters.length; i++) {
    const name = requireKeyword(parameters[i], location).toLowerCase();
    const key = FIRETEAM_KEYWORDS[name];
    if (key === undefined) {
      throw new LowerError(
        diagnosticMessages.expectedParameterType("fireteam filter", name),
        parameters[i]!.location,
      );
    }
    fireteamFilter[key] = true;
  }
  return {
    type: ActionType.SetFireteamRespawnFilter,
    parameters: {
      object: resolveObjectReference(
        parameters[0]!,
        asParameterLoweringContext(ctx),
      ),
      fireteamFilter,
    },
  };
};
