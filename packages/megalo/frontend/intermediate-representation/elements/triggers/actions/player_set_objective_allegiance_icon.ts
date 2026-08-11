import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import { SyntaxKind } from "../../../../abstract-syntax-tree";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { ObjectListType } from "../../../../object-lists";
import { SymbolKind } from "../../../../symbol-table";
import { LowerError } from "../../../error";
import {
  ActionType,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import { resolvePlayerReference } from "../../../parameters";

const resolveObjectListKeywordIndex = (
  node: ASTParameterNode,
  objectType: ObjectListType,
  ctx: ElementLowerContext,
  expected: string,
): number => {
  const name =
    node.kind === SyntaxKind.KEYWORD
      ? node.value
      : node.kind === SyntaxKind.REFERENCE
        ? node.identifier
        : undefined;
  if (name === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(expected, ""),
      node.location,
    );
  }
  const symbol = ctx.symbolTable
    .toArray()
    .find(
      (entry) =>
        entry.kind === SymbolKind.ObjectListItem &&
        entry.objectType === objectType &&
        entry.name === name,
    );
  if (symbol?.kind !== SymbolKind.ObjectListItem) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(expected, name),
      node.location,
    );
  }
  return symbol.index;
};

export const lowerPlayerSetObjectiveAllegianceIcon = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  if (parameters.length < 2 || parameters.length > 3) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(2, parameters.length),
      location,
    );
  }
  const iconNode = parameters[parameters.length - 1]!;
  let iconIndex: number;
  if (
    iconNode.kind === SyntaxKind.INTEGER ||
    iconNode.kind === SyntaxKind.FLOATING_POINT
  ) {
    iconIndex = Math.trunc(iconNode.value);
  } else {
    iconIndex = resolveObjectListKeywordIndex(
      iconNode,
      ObjectListType.HudWidgetIcons,
      ctx,
      "hud widget icon",
    );
  }
  return {
    type: ActionType.PlayerSetObjectiveAllegianceIcon,
    parameters: {
      player: resolvePlayerReference(
        parameters[0]!,
        asParameterLoweringContext(ctx),
      ),
      iconIndex,
    },
  };
};
