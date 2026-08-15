import { diagnosticMessages } from "src/diagnostics/messages";
import type { BaseElementNode } from "src/frontend/abstract-syntax-tree/elements";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import type { ElementLowerer } from "src/frontend/intermediate-representation/elements";
import { setField } from "src/frontend/intermediate-representation/setField";

export const baseLowerer: ElementLowerer<BaseElementNode> = (element, ctx) => {
  if (element.file.kind !== SyntaxKind.QUOTED_STRING) {
    return;
  }

  if (ctx.ir.baseFilePath !== undefined) {
    ctx.diagnostics.addError(
      diagnosticMessages.onlyOneBaseDirectiveAllowed(),
      element.location
    );
    return;
  }

  setField(
    ctx.ir.locations,
    ctx.diagnostics,
    ctx.ir,
    "baseFilePath",
    element.file.value,
    element.location,
    "base"
  );
};
