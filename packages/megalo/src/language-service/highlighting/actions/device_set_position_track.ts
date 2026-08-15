import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import {
  highlightParameterOrStructural,
  highlightStructural,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

/** `device_set_position_track <object> <animation> <interp>` */
export const highlightDeviceSetPositionTrack = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  highlightStructural(out, p[0]);
  highlightParameterOrStructural(out, p[1]);
  highlightStructural(out, p[2]);
};
