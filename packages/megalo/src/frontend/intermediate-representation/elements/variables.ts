import { SourceLocationType } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { VariablesElementNode } from "src/frontend/abstract-syntax-tree/elements/variables";
import { dxAssertionScope } from "src/frontend/intermediate-representation/diagnostics";
import { assertNotErrorNode } from "src/frontend/intermediate-representation/diagnostics/assertNotErrorNode";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type MultiplayerTeamDesignator,
  multiplayerTeamDesignator,
} from "src/frontend/intermediate-representation/game/game_engine_default";
import {
  type CustomVariableReference,
  CustomVariableType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import {
  type MegaloVariableNetworkState,
  megaloVariableNetworkState,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_variable_metadata";
import type {
  ElementLowerContext,
  VariableDeclarationInfo,
} from "src/frontend/intermediate-representation/parameters/context";
import { GAME_OPTION_CUSTOM_VARIABLE_TYPE } from "src/frontend/intermediate-representation/parameters/gameOptionTypes";
import {
  variableScopeFromName,
  variableTypeFromName,
} from "src/frontend/language-configuration/omni/variables";
import {
  isBuiltInVariable,
  type SymbolId,
  SymbolKind,
  VariableType,
} from "src/frontend/symbol-table";

const parseNetworkState = (
  value: string
): MegaloVariableNetworkState | undefined =>
  megaloVariableNetworkState.parse(value);

const lowerTeamInitial = (
  entry: VariablesElementNode["entries"][number],
  ctx: ElementLowerContext
): MultiplayerTeamDesignator => {
  const { initial } = entry;
  if (initial.kind === SyntaxKind.REFERENCE) {
    const symbol = ctx.symbolTable.getSymbol(initial.symbolId);
    if (symbol?.kind === SymbolKind.Variable && isBuiltInVariable(symbol)) {
      const designator = multiplayerTeamDesignator.parse(symbol.name);
      if (designator !== undefined) {
        return designator;
      }
    }
    throw new LowerError(
      diagnosticMessages.invalidExplicitTeam(initial.identifier),
      initial.location
    );
  }
  throw new LowerError(
    diagnosticMessages.invalidExplicitTeam(
      initial.kind === SyntaxKind.INTEGER ? String(initial.value) : "unknown"
    ),
    initial.location
  );
};

const lowerInitialValue = (
  entry: VariablesElementNode["entries"][number],
  ctx: ElementLowerContext
): CustomVariableReference => {
  const { initial } = entry;
  if (initial.kind === SyntaxKind.INTEGER) {
    return {
      type: CustomVariableType.Constant,
      immediateValue: initial.value,
    };
  }
  if (initial.kind === SyntaxKind.REFERENCE) {
    const symbol = ctx.symbolTable.getSymbol(initial.symbolId);
    if (symbol?.kind === SymbolKind.Constant) {
      return {
        type: CustomVariableType.Constant,
        immediateValue: symbol.value,
      };
    }
    if (symbol?.kind === SymbolKind.GameOption) {
      const mapped = GAME_OPTION_CUSTOM_VARIABLE_TYPE[symbol.name];
      if (mapped !== undefined) {
        return { type: mapped };
      }
      const userOption = ctx.symbolTable.lookupUserDefinedOptionIndex(
        symbol.name
      );
      if (userOption !== undefined) {
        return { type: CustomVariableType.Option, optionIndex: userOption };
      }
    }
    if (
      symbol?.kind === SymbolKind.Variable &&
      symbol.type === VariableType.Number &&
      !isBuiltInVariable(symbol)
    ) {
      const resolved = ctx.variableSlots.get(symbol.id);
      if (resolved !== undefined) {
        return {
          type: CustomVariableType.GlobalNumber,
          variableIndex: resolved.index,
        };
      }
    }
  }
  return {
    type: CustomVariableType.Constant,
    immediateValue: 0,
  };
};

export const variablesLowerer = (
  element: VariablesElementNode,
  ctx: ElementLowerContext
) => {
  let parsedScope: ReturnType<typeof variableScopeFromName> | undefined;
  dxAssertionScope(ctx.diagnostics, () => {
    const { scope } = element;
    assertNotErrorNode(scope);
    parsedScope = variableScopeFromName(scope.value);
  });
  if (parsedScope === undefined) {
    return;
  }
  const variableScope = parsedScope;

  for (const entry of element.entries) {
    dxAssertionScope(ctx.diagnostics, () => {
      const { name, type } = entry;
      assertNotErrorNode(name);
      assertNotErrorNode(type);
      assertNotErrorNode(entry.network);
      const networkState = parseNetworkState(entry.network.value);
      if (networkState === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedVariableNetworkOrEnd(entry.network.value),
          entry.network.location
        );
      }

      const variableType = variableTypeFromName(type.value);
      const candidates = ctx.symbolTable.variablesOf(
        variableScope,
        variableType
      );
      const resolved =
        candidates.find(
          (s) =>
            s.name === name.value &&
            s.declaration.type === SourceLocationType.SOURCE_CODE &&
            s.declaration.start.localOffset === name.location.start.localOffset
        ) ?? candidates.find((s) => s.name === name.value);

      if (resolved === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedVariableReference(name.value),
          name.location
        );
      }

      const info: VariableDeclarationInfo =
        variableType === VariableType.Team
          ? {
              networkState,
              initialTeam: lowerTeamInitial(entry, ctx),
            }
          : {
              networkState,
              initial: lowerInitialValue(entry, ctx),
            };
      ctx.variableDeclarations.set(resolved.id as SymbolId, info);
    });
  }
};
