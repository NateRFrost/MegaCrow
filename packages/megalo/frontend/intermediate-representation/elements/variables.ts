import { SyntaxKind } from "../../abstract-syntax-tree";
import type { VariablesElementNode } from "../../abstract-syntax-tree/elements/variables";
import { SourceLocationType } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import {
  variableScopeFromName,
  variableTypeFromName,
} from "../../language-configuration/omni/variables";
import {
  SymbolKind,
  type SymbolId,
  VariableType,
} from "../../symbol-table";
import { dxAssertionScope } from "../diagnostics";
import { assertNotErrorNode } from "../diagnostics/assertNotErrorNode";
import { LowerError } from "../error";
import {
  CustomVariableType,
  type CustomVariableReference,
} from "../game/megalogamengine/megalogamengine_references";
import { MegaloVariableNetworkState } from "../game/megalogamengine/megalogamengine_variable_metadata";
import type {
  ElementLowerContext,
  VariableDeclarationInfo,
} from "../parameters/context";

const NETWORK_STATE_BY_NAME: Record<string, MegaloVariableNetworkState> = {
  local: MegaloVariableNetworkState.Local,
  networked: MegaloVariableNetworkState.Networked,
  networked_high: MegaloVariableNetworkState.NetworkedHigh,
};

const parseNetworkState = (
  value: string
): MegaloVariableNetworkState | undefined => NETWORK_STATE_BY_NAME[value];

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
    if (
      symbol?.kind === SymbolKind.Variable &&
      symbol.type === VariableType.Number
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
            s.declaration.start.offset === name.location.start.offset
        ) ?? candidates.find((s) => s.name === name.value);

      if (resolved === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedVariableReference(name.value),
          name.location
        );
      }

      const info: VariableDeclarationInfo = {
        networkState,
        initial: lowerInitialValue(entry, ctx),
      };
      ctx.variableDeclarations.set(resolved.id as SymbolId, info);
    });
  }
};
