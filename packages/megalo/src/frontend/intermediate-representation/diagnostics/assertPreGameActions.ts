import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { LowerError } from "src/frontend/intermediate-representation/error";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";

export const assertPreGameActions = (
  actionName: string,
  location: SourceCodeLocation,
  ctx: ElementLowerContext
): void => {
  if (!ctx.inPregameTrigger) {
    return;
  }
  const allowed = ctx.frontend.versionConfiguration.pregameActions;
  if ((allowed as readonly string[]).includes(actionName)) {
    return;
  }
  throw new LowerError(
    diagnosticMessages.actionNotAllowedInPregame(),
    location
  );
};
