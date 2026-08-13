import type { BaseElementNode } from "../../abstract-syntax-tree/elements";
import { SyntaxKind } from "../../abstract-syntax-tree/kinds";
import { diagnosticMessages } from "../../../diagnostics/messages";
import type { ElementLowerer } from ".";
import { setField } from "../setField";

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
    element.location
  );
};
