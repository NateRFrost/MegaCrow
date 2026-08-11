import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
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
import { parseIndexSuffix } from "../../../parameters";
import { parseTeamOrPlayerTarget, requireKeyword } from "../helpers";

const resolveIncidentIndex = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation,
): number => {
  const name = requireKeyword(node, location);
  const paramCtx = asParameterLoweringContext(ctx);

  const fromStatMap = paramCtx.statIndexByName.get(name);
  if (fromStatMap !== undefined) {
    return fromStatMap;
  }

  const incidentSymbol = ctx.symbolTable
    .toArray()
    .find(
      (entry) =>
        entry.kind === SymbolKind.ObjectListItem &&
        entry.objectType === ObjectListType.Incidents &&
        entry.name === name,
    );
  if (incidentSymbol?.kind === SymbolKind.ObjectListItem) {
    return incidentSymbol.index + 1;
  }

  const fromSuffix = parseIndexSuffix(name, "incident");
  if (fromSuffix !== undefined) {
    return fromSuffix;
  }

  if (/^\d+$/.test(name)) {
    return Number(name);
  }

  throw new LowerError(
    diagnosticMessages.expectedParameterType("incident", name),
    node.location,
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
