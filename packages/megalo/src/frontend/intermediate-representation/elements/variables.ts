import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { VariablesElementNode } from "src/frontend/abstract-syntax-tree/elements/variables";
import { SourceLocationType } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import {
  variableScopeFromName,
  variableTypeFromName,
} from "src/frontend/language-configuration/omni/variables";
import {
  SymbolKind,
  type SymbolId,
  VariableType,
  isBuiltInVariable,
} from "src/frontend/symbol-table";
import { dxAssertionScope } from "src/frontend/intermediate-representation/diagnostics";
import { assertNotErrorNode } from "src/frontend/intermediate-representation/diagnostics/assertNotErrorNode";
import { LowerError } from "src/frontend/intermediate-representation/error";
import { MultiplayerTeamDesignator } from "src/frontend/intermediate-representation/game/game_engine_default";
import {
  CustomVariableType,
  type CustomVariableReference,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import { MegaloVariableNetworkState } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_variable_metadata";
import type {
  ElementLowerContext,
  VariableDeclarationInfo,
} from "src/frontend/intermediate-representation/parameters/context";
import { GAME_OPTION_CUSTOM_VARIABLE_TYPE } from "src/frontend/intermediate-representation/parameters/gameOptionTypes";

const NETWORK_STATE_BY_NAME: Record<string, MegaloVariableNetworkState> = {
  local: MegaloVariableNetworkState.Local,
  networked: MegaloVariableNetworkState.Networked,
  networked_high: MegaloVariableNetworkState.NetworkedHigh,
};

const TEAM_INITIAL_DESIGNATOR: Record<string, MultiplayerTeamDesignator> = {
  none: MultiplayerTeamDesignator.None,
  neutral: MultiplayerTeamDesignator.Neutral,
  defenders: MultiplayerTeamDesignator.Defenders,
  attackers: MultiplayerTeamDesignator.Attackers,
  third_party: MultiplayerTeamDesignator.ThirdParty,
  fourth_party: MultiplayerTeamDesignator.FourthParty,
  fifth_party: MultiplayerTeamDesignator.FifthParty,
  sixth_party: MultiplayerTeamDesignator.SixthParty,
  seventh_party: MultiplayerTeamDesignator.SeventhParty,
  eighth_party: MultiplayerTeamDesignator.EighthParty,
};

const parseNetworkState = (
  value: string
): MegaloVariableNetworkState | undefined => NETWORK_STATE_BY_NAME[value];

const teamDesignatorInitial = (
  name: string
): CustomVariableReference | undefined => {
  const designator = TEAM_INITIAL_DESIGNATOR[name];
  if (designator === undefined) {
    return undefined;
  }
  return {
    type: CustomVariableType.Constant,
    immediateValue: designator,
  };
};

const lowerInitialValue = (
  entry: VariablesElementNode["entries"][number],
  ctx: ElementLowerContext,
  variableType: VariableType
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
      isBuiltInVariable(symbol) &&
      variableType === VariableType.Team
    ) {
      const teamInit = teamDesignatorInitial(symbol.name);
      if (teamInit) {
        return teamInit;
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

      const info: VariableDeclarationInfo = {
        networkState,
        initial: lowerInitialValue(entry, ctx, variableType),
      };
      ctx.variableDeclarations.set(resolved.id as SymbolId, info);
    });
  }
};
