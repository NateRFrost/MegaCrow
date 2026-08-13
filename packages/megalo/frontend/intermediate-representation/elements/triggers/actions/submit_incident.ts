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
import { type ElementLowerContext } from "../../../parameters/context";
import { parseTeamOrPlayerTarget } from "../helpers";

export const resolveIncidentIndex = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
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
    node.location ?? location,
  );
};

export const lowerSubmitIncident = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): Action => {
  if (parameters.length < 3) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(3, parameters.length),
      location,
    );
  }

  const statIndex = resolveIncidentIndex(parameters[0]!, ctx, location);
  const { target: cause, nextIndex: effectStart } = parseTeamOrPlayerTarget(
    parameters,
    1,
    ctx,
    location,
  );
  const { target: effect, nextIndex } = parseTeamOrPlayerTarget(
    parameters,
    effectStart,
    ctx,
    location,
  );
  if (nextIndex !== parameters.length) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(nextIndex, parameters.length),
      location,
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
