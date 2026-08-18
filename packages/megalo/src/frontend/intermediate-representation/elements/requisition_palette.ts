import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { RequisitionPaletteElementNode } from "src/frontend/abstract-syntax-tree/elements/requisition_palette";
import { dxAssertionScope } from "src/frontend/intermediate-representation/diagnostics";
import { assertNotErrorNode } from "src/frontend/intermediate-representation/diagnostics/assertNotErrorNode";
import { LowerError } from "src/frontend/intermediate-representation/error";
import type {
  RequisitionItemState,
  RequisitionPalette,
  RequisitionPaletteBaseline,
  RequisitionPaletteItem,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_requisitions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";
import { resolveObjectTypeReference } from "src/frontend/intermediate-representation/parameters/references";

const BASELINES = new Set<RequisitionPaletteBaseline>([
  "empty",
  "spartan",
  "elite",
  "full",
]);

const ITEM_STATES = new Set<RequisitionItemState>([
  "enabled",
  "disabled",
  "full",
]);

export const requisitionPaletteLowerer = (
  element: RequisitionPaletteElementNode,
  ctx: ElementLowerContext
): void => {
  dxAssertionScope(ctx.diagnostics, () => {
    const limit = ctx.frontend.versionConfiguration.limits.requisitionPalettes;
    if (limit <= 0) {
      throw new LowerError(
        "requisition_palette is not supported by this Megalo version",
        element.location
      );
    }
    assertNotErrorNode(element.name);
    if (element.baseline === undefined) {
      throw new LowerError(
        diagnosticMessages.expectedParameterType("baseline", ""),
        element.location
      );
    }
    assertNotErrorNode(element.baseline);
    const baselineName = element.baseline.value.toLowerCase();
    if (!BASELINES.has(baselineName as RequisitionPaletteBaseline)) {
      throw new LowerError(
        diagnosticMessages.expectedParameterType("baseline", baselineName),
        element.baseline.location
      );
    }

    const paramCtx = asParameterLoweringContext(ctx);
    const items: RequisitionPaletteItem[] = [];
    for (const item of element.items) {
      assertNotErrorNode(item.name);
      assertNotErrorNode(item.state);
      const objectTypeIndex = resolveObjectTypeReference(item.name, paramCtx);
      if (item.state.kind === SyntaxKind.INTEGER) {
        items.push({ objectTypeIndex, cost: item.state.value });
        continue;
      }
      const stateName = item.state.value.toLowerCase();
      if (!ITEM_STATES.has(stateName as RequisitionItemState)) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType(
            "requisition item state",
            stateName
          ),
          item.state.location
        );
      }
      items.push({
        objectTypeIndex,
        state: stateName as RequisitionItemState,
      });
    }

    const palette: RequisitionPalette = {
      name: element.name.value,
      baseline: baselineName as RequisitionPaletteBaseline,
      items,
    };
    ctx.ir.gameVariant.gameEngine.requisitionPalettes.push(palette);
  });
};
