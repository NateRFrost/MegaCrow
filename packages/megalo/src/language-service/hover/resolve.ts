import type { SourceCodeLocation } from "src/diagnostics";
import {
  type ASTElementNode,
  ElementKind,
} from "src/frontend/abstract-syntax-tree/elements";
import type {
  BeginStatementNode,
  ForEachStatementNode,
  TriggerElementNode,
  TriggerStatementNode,
} from "src/frontend/abstract-syntax-tree/elements/trigger";
import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import type { ConditionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/condition";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import type { SymbolTableEntry } from "src/frontend/symbol-table";
import { TokenKind } from "src/frontend/tokens";
import { lookupHoverContribution } from "src/language-service/hover/registry";
import type { HoverTarget } from "src/language-service/hover/types";
import {
  isRootDocumentLocation,
  locationContainsOffset,
  positionToOffset,
} from "src/language-service/position";
import type { AnalysisSnapshot } from "src/language-service/snapshot";

const spanLength = (location: SourceCodeLocation): number =>
  Math.max(0, location.end.localOffset - location.start.localOffset);

const KEYWORD_IDS = new Set([
  "action",
  "condition",
  "temporary",
  "begin",
  "end",
  "trigger",
  "not",
]);

interface Candidate {
  span: number;
  target: HoverTarget;
}

const pushLocation = (candidates: Candidate[], target: HoverTarget): void => {
  if (!isRootDocumentLocation(target.range)) {
    return;
  }
  candidates.push({ target, span: spanLength(target.range) });
};

const walkStatements = (
  statements: readonly TriggerStatementNode[],
  offset: number,
  candidates: Candidate[]
): void => {
  for (const statement of statements) {
    switch (statement.kind) {
      case SyntaxKind.ACTION: {
        const action = statement as ActionStatementNode;
        if (locationContainsOffset(action.name.location, offset)) {
          pushLocation(candidates, {
            kind: "action",
            id: action.name.value,
            range: action.name.location,
          });
        }
        break;
      }
      case SyntaxKind.CONDITION: {
        const condition = statement as ConditionStatementNode;
        if (locationContainsOffset(condition.name.location, offset)) {
          pushLocation(candidates, {
            kind: "condition",
            id: condition.name.value,
            range: condition.name.location,
          });
        }
        break;
      }
      case SyntaxKind.BEGIN: {
        const begin = statement as BeginStatementNode;
        if (locationContainsOffset(begin.keywordLocation, offset)) {
          pushLocation(candidates, {
            kind: "keyword",
            id: "begin",
            range: begin.keywordLocation,
          });
        }
        walkStatements(begin.statements, offset, candidates);
        break;
      }
      case SyntaxKind.FOR_EACH: {
        const forEach = statement as ForEachStatementNode;
        if (locationContainsOffset(forEach.name.location, offset)) {
          pushLocation(candidates, {
            kind: "action",
            id: forEach.name.value,
            range: forEach.name.location,
          });
        }
        walkStatements(forEach.statements, offset, candidates);
        break;
      }
      default:
        break;
    }
  }
};

export const elementKeywordId = (
  element: ASTElementNode
): string | undefined => {
  switch (element.elementKind) {
    case ElementKind.BASE:
      return "base";
    case ElementKind.INCLUDE:
      return "include";
    case ElementKind.LOCALIZED_INCLUDE:
      return "localized_include";
    case ElementKind.STRING_TABLE:
      return "string_table";
    case ElementKind.CONSTANTS:
      return "constants";
    case ElementKind.VARIABLES:
      return "variables";
    case ElementKind.GAME_OPTIONS:
      return "game_options";
    case ElementKind.HUD_WIDGETS:
      return "hud_widgets";
    case ElementKind.LOADOUT:
      return "loadout";
    case ElementKind.LOADOUT_PALETTE:
      return "loadout_palette";
    case ElementKind.TEAMS:
      return "teams";
    case ElementKind.ENGINE_DATA:
      return "engine_data";
    case ElementKind.PLAYER_RATING:
      return "player_rating";
    case ElementKind.MAP_PERMISSIONS:
      return "map_permissions";
    case ElementKind.GAME_STATS:
      return "game_stats";
    case ElementKind.MAP_OBJECT:
      return "map_object";
    case ElementKind.REQUISITION_PALETTE:
      return "requisition_palette";
    case ElementKind.TRIGGER:
      return "trigger";
    default: {
      const _exhaustive: never = element;
      void _exhaustive;
      return;
    }
  }
};

const targetRank = (target: HoverTarget): number => {
  switch (target.kind) {
    case "action":
    case "condition":
    case "param":
      return 0;
    case "element":
      return 1;
    case "keyword":
      return 2;
    case "symbol":
      return 3;
    default:
      return 9;
  }
};

const pushElementParamCandidates = (
  snapshot: AnalysisSnapshot,
  element: ASTElementNode,
  elementId: string,
  offset: number,
  candidates: Candidate[]
): void => {
  if (!locationContainsOffset(element.location, offset)) {
    return;
  }
  if (locationContainsOffset(element.keywordLocation, offset)) {
    return;
  }

  for (const token of snapshot.tokens) {
    if (token.kind !== TokenKind.Identifier) {
      continue;
    }
    if (!isRootDocumentLocation(token.location)) {
      continue;
    }
    if (!locationContainsOffset(token.location, offset)) {
      continue;
    }
    if (
      !locationContainsOffset(
        element.location,
        token.location.start.localOffset
      )
    ) {
      continue;
    }
    const paramId = `${elementId}.${token.value}`;
    if (lookupHoverContribution("param", paramId) === undefined) {
      continue;
    }
    pushLocation(candidates, {
      kind: "param",
      id: paramId,
      range: token.location,
    });
  }
};

/**
 * Resolve what the cursor is over for hover (tightest matching span wins).
 * Prefers language constructs over symbol references when spans tie.
 */
export const resolveHoverTarget = (
  snapshot: AnalysisSnapshot,
  position: { line: number; character: number }
): HoverTarget | null => {
  const offset = positionToOffset(
    snapshot.lineStarts,
    snapshot.source.length,
    position.line,
    position.character
  );

  const candidates: Candidate[] = [];

  for (const element of snapshot.ast.elements) {
    if (element.elementKind === ElementKind.TRIGGER) {
      const trigger = element as TriggerElementNode;
      if (locationContainsOffset(trigger.keywordLocation, offset)) {
        pushLocation(candidates, {
          kind: "element",
          id: "trigger",
          range: trigger.keywordLocation,
        });
      }
      walkStatements(trigger.statements, offset, candidates);
      continue;
    }

    const id = elementKeywordId(element);
    if (id === undefined) {
      continue;
    }
    if (locationContainsOffset(element.keywordLocation, offset)) {
      pushLocation(candidates, {
        kind: "element",
        id,
        range: element.keywordLocation,
      });
    }
    pushElementParamCandidates(snapshot, element, id, offset, candidates);
  }

  for (const token of snapshot.tokens) {
    if (token.kind !== TokenKind.Identifier) {
      continue;
    }
    if (!KEYWORD_IDS.has(token.value)) {
      continue;
    }
    if (!isRootDocumentLocation(token.location)) {
      continue;
    }
    if (!locationContainsOffset(token.location, offset)) {
      continue;
    }
    pushLocation(candidates, {
      kind: "keyword",
      id: token.value,
      range: token.location,
    });
  }

  for (const entry of snapshot.ast.symbolTable.toArray() as SymbolTableEntry[]) {
    for (const reference of entry.references) {
      if (
        isRootDocumentLocation(reference) &&
        locationContainsOffset(reference, offset)
      ) {
        pushLocation(candidates, {
          kind: "symbol",
          entry,
          range: reference,
        });
      }
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort(
    (a, b) => a.span - b.span || targetRank(a.target) - targetRank(b.target)
  );
  return candidates[0]!.target;
};
