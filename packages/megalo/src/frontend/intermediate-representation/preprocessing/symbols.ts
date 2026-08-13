import type { MegaloCompilerContext } from "src/context";
import type { Diagnostics } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { VariableLimits } from "src/backend/version-configuration";
import {
  isBuiltInVariable,
  type SymbolId,
  SymbolKind,
  type SymbolTable,
  type SymbolTableVariableEntry,
  VariableScope,
  VariableType,
} from "src/frontend/symbol-table";

type SlotOccupants = SymbolId[];
type TypeSlots = SlotOccupants[];
type ScopeSlots = Record<VariableType, TypeSlots>;
type VariableSlotTable = Record<VariableScope, ScopeSlots>;

export type ResolvedVariableSlot = {
  scope: VariableScope;
  type: VariableType;
  index: number;
};

export type VariableSlotMap = ReadonlyMap<SymbolId, ResolvedVariableSlot>;

const VARIABLE_TYPES: readonly VariableType[] = [
  VariableType.Timer,
  VariableType.Number,
  VariableType.Team,
  VariableType.Player,
  VariableType.Object,
];

const VARIABLE_SCOPES: readonly VariableScope[] = [
  VariableScope.Global,
  VariableScope.Team,
  VariableScope.Player,
  VariableScope.Object,
  VariableScope.Temporary,
];

const emptyScopeSlots = (): ScopeSlots => ({
  [VariableType.Timer]: [],
  [VariableType.Number]: [],
  [VariableType.Team]: [],
  [VariableType.Player]: [],
  [VariableType.Object]: [],
});

const emptySlotTable = (): VariableSlotTable => ({
  [VariableScope.Global]: emptyScopeSlots(),
  [VariableScope.Team]: emptyScopeSlots(),
  [VariableScope.Player]: emptyScopeSlots(),
  [VariableScope.Object]: emptyScopeSlots(),
  [VariableScope.Temporary]: emptyScopeSlots(),
});

const assignTemporariesByLifetime = (
  temporariesByType: Map<VariableType, SymbolTableVariableEntry[]>,
  table: VariableSlotTable
): void => {
  // For each type of variable (Timer, Number, Team, Player, Object)
  for (const type of VARIABLE_TYPES) {
    // Get all the temporaries of this type, and sort them by declaration order.
    const sortedTemporaryVariableEntries = [...(temporariesByType.get(type) ?? [])].sort(
      (left, right) =>
        left.range.start.absoluteOffset - right.range.start.absoluteOffset ||
        left.id - right.id
    );
    // We keep track of the slots that are currently in use, and the slots that are free.
    // When a temporary variable goes out of scope, we add the slot index to the free list.
    // When a temporary variable is declared, we add the slot index to the live list.
    // When we need to assign a new slot to a temporary variable, we take the first free slot.
    // If there are no free slots, we assign a new slot to the temporary variable.
    const liveSlotIndices: { endOffset: number; index: number }[] = [];
    const freeSlotIndices: number[] = [];
    let nextFreeSlotIndex = 0;

    for (const temporaryVariableEntry of sortedTemporaryVariableEntries) {
      const start = temporaryVariableEntry.range.start.absoluteOffset;
      // Release slots whose lifetime ended at or before this declaration.
      for (let i = liveSlotIndices.length - 1; i >= 0; i--) {
        const entry = liveSlotIndices[i]!;
        if (entry.endOffset <= start) {
          freeSlotIndices.push(entry.index);
          liveSlotIndices.splice(i, 1);
        }
      }
      freeSlotIndices.sort((a, b) => a - b);

      const currentSlotIndex = freeSlotIndices.length > 0 ? freeSlotIndices.shift()! : nextFreeSlotIndex++;
      const slotsForVariableType = table[VariableScope.Temporary][type];
      while (slotsForVariableType.length <= currentSlotIndex) {
        slotsForVariableType.push([]);
      }
      slotsForVariableType[currentSlotIndex]!.push(temporaryVariableEntry.id);
      liveSlotIndices.push({
        endOffset: temporaryVariableEntry.range.end.absoluteOffset,
        index: currentSlotIndex,
      });
    }
  }
};

const overflowTemporaries = (
  table: VariableSlotTable,
  type: VariableType,
  temporaryLimit: number,
  globalLimit: number
): void => {
  const temporarySlots = table[VariableScope.Temporary][type];
  if (temporarySlots.length <= temporaryLimit) {
    return;
  }

  const excess = temporarySlots.splice(temporaryLimit);
  const globalSlots = table[VariableScope.Global][type];
  const freeCapacity = Math.max(0, globalLimit - globalSlots.length);

  for (let i = 0; i < excess.length; i++) {
    const occupants = excess[i]!;
    if (i < freeCapacity) {
      globalSlots.push(occupants);
    } else {
      // Put back — limit DX will fire for these.
      temporarySlots.push(occupants);
    }
  }
};

const emitLimitDiagnostics = (
  table: VariableSlotTable,
  limits: VariableLimits,
  byId: Map<SymbolId, SymbolTableVariableEntry>,
  diagnostics: Diagnostics
): void => {
  for (const scope of VARIABLE_SCOPES) {
    for (const type of VARIABLE_TYPES) {
      const limit = limits[scope][type];
      if (limit === undefined) {
        continue;
      }
      const slots = table[scope][type];
      if (slots.length <= limit) {
        continue;
      }
      for (let index = limit; index < slots.length; index++) {
        for (const id of slots[index]!) {
          const symbol = byId.get(id);
          if (symbol === undefined) {
            continue;
          }
          diagnostics.addError(
            diagnosticMessages.tooManyVariables(
              VariableScope[scope],
              VariableType[type],
              limit
            ),
            symbol.declaration
          );
        }
      }
    }
  }
};

const flattenSlotTable = (table: VariableSlotTable): VariableSlotMap => {
  const map = new Map<SymbolId, ResolvedVariableSlot>();
  for (const scope of VARIABLE_SCOPES) {
    for (const type of VARIABLE_TYPES) {
      const slots = table[scope][type];
      for (let index = 0; index < slots.length; index++) {
        for (const id of slots[index]!) {
          map.set(id, { scope, type, index });
        }
      }
    }
  }
  return map;
};

// Our symbol table is quite rich, it has information about variable scopes
// and has no limits to how many variables can be used.
// At lower we need to start to pack these symbols within Blam! constraints.
// Megalo has a limited space for variables, and uses fixed slots (eg global_1, global_2, temporary_1, temporary_2, etc.)
// When lowering anything that uses one of our variables, we need to know which slot our symbol gets assinged to.
// This function builds a map of symbol id to slot index.
export const buildVariableSlotMap = (
  frontend: MegaloCompilerContext,
  table: SymbolTable,
  diagnostics: Diagnostics
): VariableSlotMap => {
  const limits = frontend.versionConfiguration.limits.variables;
  const slotTable = emptySlotTable();
  const byId = new Map<SymbolId, SymbolTableVariableEntry>();
  const temporariesByType = new Map<VariableType, SymbolTableVariableEntry[]>();

  for (const symbol of table.toArray()) {
    if (symbol.kind !== SymbolKind.Variable || isBuiltInVariable(symbol)) {
      continue;
    }
    byId.set(symbol.id, symbol);
    if (symbol.scope === VariableScope.Temporary) {
      const list = temporariesByType.get(symbol.type) ?? [];
      list.push(symbol);
      temporariesByType.set(symbol.type, list);
      continue;
    }
    slotTable[symbol.scope][symbol.type].push([symbol.id]);
  }

  assignTemporariesByLifetime(temporariesByType, slotTable);

  // If there are too many temporaries, they spill over into any unused global slots.
  // For pre-107-mcc, there are no temporary slots, all of them spill into globals.
  if (
    frontend.compilerSettings
      .temporaryVariablesCanOverflowIntoUnusedGlobalVariables
  ) {
    for (const type of VARIABLE_TYPES) {
      // MegaloEdit: temps beyond the dedicated pool spill into free global
      // metadata slots. Wire refs for overflowed slots use Global* / GlobalNumber.
      const temporaryLimit = limits[VariableScope.Temporary][type];
      const globalLimit = limits[VariableScope.Global][type];
      if (temporaryLimit !== undefined && globalLimit !== undefined) {
        overflowTemporaries(slotTable, type, temporaryLimit, globalLimit);
      }
    }
  }

  emitLimitDiagnostics(slotTable, limits, byId, diagnostics);
  return flattenSlotTable(slotTable);
};

export const resolveVariableSlot = (
  slots: VariableSlotMap,
  symbolId: SymbolId
): ResolvedVariableSlot | undefined => slots.get(symbolId);

export const getVariableSlot = (
  slots: VariableSlotMap,
  symbolId: SymbolId
): number | undefined => slots.get(symbolId)?.index;

export const requireVariableSlot = (
  slots: VariableSlotMap,
  symbolId: SymbolId
): number => {
  const resolved = slots.get(symbolId);
  if (resolved === undefined) {
    throw new Error(`No variable slot allocated for symbol ${symbolId}`);
  }
  return resolved.index;
};

export const requireResolvedVariableSlot = (
  slots: VariableSlotMap,
  symbolId: SymbolId
): ResolvedVariableSlot => {
  const resolved = slots.get(symbolId);
  if (resolved === undefined) {
    throw new Error(`No variable slot allocated for symbol ${symbolId}`);
  }
  return resolved;
};

export const findVariableBySlot = (
  table: SymbolTable,
  slots: VariableSlotMap,
  scope: VariableScope,
  type: VariableType,
  index: number
): SymbolTableVariableEntry | undefined =>
  table.toArray().find(
    (symbol): symbol is SymbolTableVariableEntry =>
      symbol.kind === SymbolKind.Variable &&
      !isBuiltInVariable(symbol) &&
      (() => {
        const resolved = slots.get(symbol.id);
        return (
          resolved !== undefined &&
          resolved.scope === scope &&
          resolved.type === type &&
          resolved.index === index
        );
      })()
  );
