import type { Diagnostics } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import type { VariableLimits } from "../../version-configuration";
import {
  isBuiltInVariable,
  type SymbolId,
  SymbolKind,
  type SymbolTable,
  type SymbolTableVariableEntry,
  VariableScope,
  VariableType,
} from "../../symbol-table";

/** Occupants that share one physical slot (non-overlapping temporaries). */
type SlotOccupants = SymbolId[];
/** Slot index → occupants. */
type TypeSlots = SlotOccupants[];
type ScopeSlots = Record<VariableType, TypeSlots>;
type VariableSlotTable = Record<VariableScope, ScopeSlots>;

/**
 * Effective storage for a symbol after temporary packing and overflow.
 * Lookup by SymbolId during reference lowering.
 */
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

const rangeEndOffset = (symbol: SymbolTableVariableEntry): number =>
  symbol.range.end.offset;

const rangesOverlap = (
  a: SymbolTableVariableEntry,
  b: SymbolTableVariableEntry
): boolean => {
  const aStart = a.range.start.offset;
  const aEnd = rangeEndOffset(a);
  const bStart = b.range.start.offset;
  const bEnd = rangeEndOffset(b);
  // Open-ended (BUILT_IN_POSITION end = -1) always overlaps.
  if (aEnd < 0 || bEnd < 0) {
    return true;
  }
  return aStart < bEnd && bStart < aEnd;
};

const slotConflictsWith = (
  occupants: SlotOccupants,
  candidate: SymbolTableVariableEntry,
  byId: Map<SymbolId, SymbolTableVariableEntry>
): boolean =>
  occupants.some((id) => {
    const existing = byId.get(id);
    return existing !== undefined && rangesOverlap(existing, candidate);
  });

const assignSequentialSlots = (
  symbols: readonly SymbolTableVariableEntry[],
  slots: TypeSlots
): void => {
  for (const symbol of symbols) {
    slots.push([symbol.id]);
  }
};

const packTemporarySlots = (
  symbols: readonly SymbolTableVariableEntry[],
  byId: Map<SymbolId, SymbolTableVariableEntry>
): TypeSlots => {
  const ordered = [...symbols].sort(
    (a, b) => a.range.start.offset - b.range.start.offset
  );
  const slots: TypeSlots = [];
  for (const symbol of ordered) {
    let placed = false;
    for (const occupants of slots) {
      if (!slotConflictsWith(occupants, symbol, byId)) {
        occupants.push(symbol.id);
        placed = true;
        break;
      }
    }
    if (!placed) {
      slots.push([symbol.id]);
    }
  }
  return slots;
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

/**
 * Assign slot indices per (scope, type).
 * Temporaries are packed by lifetime; excess temporary slots overflow into free globals.
 */
export const buildVariableSlotMap = (
  table: SymbolTable,
  limits: VariableLimits,
  diagnostics: Diagnostics
): VariableSlotMap => {
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

  for (const type of VARIABLE_TYPES) {
    const temps = temporariesByType.get(type) ?? [];
    slotTable[VariableScope.Temporary][type] = packTemporarySlots(temps, byId);

    const temporaryLimit = limits[VariableScope.Temporary][type] ?? 0;
    const globalLimit = limits[VariableScope.Global][type] ?? 0;
    overflowTemporaries(slotTable, type, temporaryLimit, globalLimit);
  }

  // Non-temporary scopes are already sequential; reaffirm order is declaration order.
  void assignSequentialSlots;

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
