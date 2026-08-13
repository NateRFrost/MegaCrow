import {
  MultiplayerTeamDesignator,
} from "src/frontend/intermediate-representation/game/game_engine_default";
import {
  CustomVariableType,
  type CustomVariableReference,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import {
  MegaloVariableNetworkState,
  type VariableMetadata,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_variable_metadata";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";
import type { ResolvedVariableSlot } from "src/frontend/intermediate-representation/preprocessing/symbols";
import {
  VariableScope,
  VariableType,
  type SymbolId,
} from "src/frontend/symbol-table";
import type { IR } from "src/frontend/intermediate-representation";

const emptyMetadata = (): VariableMetadata => ({
  numericVariables: [],
  timerVariables: [],
  teamVariables: [],
  playerVariables: [],
  objectVariables: [],
});

const defaultInitial = (): CustomVariableReference => ({
  type: CustomVariableType.Constant,
  immediateValue: 0,
});

const metadataForScope = (
  ir: IR,
  scope: VariableScope
): VariableMetadata | undefined => {
  const meta = ir.gameVariant.gameEngine.variableMetadata;
  switch (scope) {
    case VariableScope.Global:
      return meta.global;
    case VariableScope.Player:
      return meta.player;
    case VariableScope.Object:
      return meta.object;
    case VariableScope.Team:
      return meta.team;
    case VariableScope.Temporary:
      return meta.temporary;
  }
};

type SlotEntry = {
  symbolId: SymbolId;
  slot: ResolvedVariableSlot;
};

/**
 * Populate gameEngine.variableMetadata from the resolved slot map and
 * declaration extras gathered by the variables element lowerer.
 * Overflowed temporaries appear under Global with default local/0 init.
 */
export const applyVariableMetadata = (ir: IR, ctx: ElementLowerContext) => {
  ir.gameVariant.gameEngine.variableMetadata = {
    global: emptyMetadata(),
    player: emptyMetadata(),
    object: emptyMetadata(),
    team: emptyMetadata(),
    temporary: emptyMetadata(),
  };

  const byScopeType = new Map<string, SlotEntry[]>();
  for (const [symbolId, slot] of ctx.variableSlots) {
    const key = `${slot.scope}:${slot.type}`;
    const list = byScopeType.get(key) ?? [];
    list.push({ symbolId, slot });
    byScopeType.set(key, list);
  }

  for (const entries of byScopeType.values()) {
    entries.sort((a, b) => a.slot.index - b.slot.index);
    // One metadata entry per slot index (shared occupants share one entry).
    const seenIndexes = new Set<number>();
    for (const { symbolId, slot } of entries) {
      if (seenIndexes.has(slot.index)) {
        continue;
      }
      seenIndexes.add(slot.index);

      const metadata = metadataForScope(ir, slot.scope);
      if (metadata === undefined) {
        continue;
      }

      const declaration = ctx.variableDeclarations.get(symbolId);
      const networkState =
        declaration?.networkState ?? MegaloVariableNetworkState.Local;
      const initial = declaration?.initial ?? defaultInitial();

      switch (slot.type) {
        case VariableType.Number:
          metadata.numericVariables.push({
            variable: initial,
            networkState,
          });
          break;
        case VariableType.Timer:
          metadata.timerVariables.push(initial);
          break;
        case VariableType.Team:
          metadata.teamVariables.push({
            value:
              initial.type === CustomVariableType.Constant
                ? (initial.immediateValue as MultiplayerTeamDesignator)
                : MultiplayerTeamDesignator.Neutral,
            networkState,
          });
          break;
        case VariableType.Player:
          metadata.playerVariables.push(networkState);
          break;
        case VariableType.Object:
          metadata.objectVariables.push(networkState);
          break;
      }
    }
  }
};
