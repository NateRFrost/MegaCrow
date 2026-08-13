import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { parseTeamOrPlayerTarget } from "src/frontend/intermediate-representation/elements/triggers/helpers";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type Action,
  ActionType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";
import { ObjectListType } from "src/frontend/object-lists";
import { SymbolKind } from "src/frontend/symbol-table";

export const resolveIncidentIndex = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): number => {
  if (node.kind === SyntaxKind.REFERENCE) {
    const symbol = ctx.symbolTable.getSymbol(node.symbolId);
    if (
      symbol?.kind === SymbolKind.ObjectListItem &&
      symbol.objectType === ObjectListType.Incidents
    ) {
      return symbol.index;
    }
  }

  const name =
    node.kind === SyntaxKind.KEYWORD
      ? node.value
      : node.kind === SyntaxKind.REFERENCE
        ? (ctx.symbolTable.getSymbol(node.symbolId)?.name ?? node.identifier)
        : undefined;

  throw new LowerError(
    diagnosticMessages.expectedParameterType("incident", name ?? ""),
    node.location ?? location
  );
};

export const lowerSubmitIncident = (
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

  const statIndex = resolveIncidentIndex(parameters[0]!, ctx, location);
  const { target: cause, nextIndex: effectStart } = parseTeamOrPlayerTarget(
    parameters,
    1,
    ctx,
    location
  );
  const { target: effect, nextIndex } = parseTeamOrPlayerTarget(
    parameters,
    effectStart,
    ctx,
    location
  );
  if (nextIndex !== parameters.length) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(nextIndex, parameters.length),
      location
    );
  }

  return {
    type: ActionType.SubmitIncident,
    parameters: {
      statIndex,
      cause,
      effect,
    },
  };
};
