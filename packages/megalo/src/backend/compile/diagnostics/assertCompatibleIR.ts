import type { Compiler } from "src/backend/compile/compiler";
import { capabilityFieldDisplayName } from "src/backend/compile/diagnostics/capabilityFieldNames";
import {
  type Diagnostics,
  type SourceLocation,
  UNKNOWN_LOCATION,
} from "src/diagnostics";
import type {
  FieldLocations,
  IR,
} from "src/frontend/intermediate-representation";
import { translate } from "src/localization";
import { getLabel, type SupportedMegaloVersion } from "src/version";

type Primitive = string | number | boolean | bigint;

// used to make a type with all of the keys of IR, but only boolean values.
export type ToCapabilities<T> = [T] extends [readonly (infer E)[]]
  ? ToCapabilities<E>
  : [T] extends [Primitive]
    ? boolean
    : [T] extends [object]
      ?
          | {
              readonly [K in keyof Required<T>]: ToCapabilities<Required<T>[K]>;
            }
          | boolean
      : boolean;

type GameVariantCapabilities = ToCapabilities<
  Omit<IR["gameVariant"], "gameEngine">
>;

export interface IRCapabilities {
  // CustomGameEngineDefinition is not part of IR capabilities as its handled elsewhere.
  readonly gameVariant: GameVariantCapabilities;
}

export interface CompilerCapabilities {
  readonly ir: IRCapabilities;
}

const unsupportedMessage = (
  name: string,
  megaloVersion: SupportedMegaloVersion
): string =>
  translate("unsupported_field", {
    name,
    versionLabel: getLabel(megaloVersion),
  });

const locationOf = (
  locations: FieldLocations,
  owner: object,
  key: string
): SourceLocation => locations.get(owner, key) ?? UNKNOWN_LOCATION;

/**
 * Values that are present in IR as defaults / clears, not authored feature use.
 * Notably: `override` without `lock` writes `false` into lock/hide flag maps.
 */
const isUnusedIrDefault = (value: unknown): boolean => {
  if (value === undefined || value === null || value === false) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return true;
    }
    // All-false / empty nested maps are clears (e.g. unlock inherited locks).
    return entries.every(([, child]) => isUnusedIrDefault(child));
  }
  return false;
};

/** Prefer the first authored true flag location (e.g. a `lock` keyword). */
const locationForUnsupportedValue = (
  value: unknown,
  locations: FieldLocations,
  owner?: object,
  key?: string
): SourceLocation => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    for (const [childKey, child] of Object.entries(
      value as Record<string, unknown>
    )) {
      if (child === true) {
        const located = locations.get(value as object, childKey);
        if (located !== undefined) {
          return located;
        }
      }
    }
  }
  if (owner !== undefined && key !== undefined) {
    return locationOf(locations, owner, key);
  }
  return UNKNOWN_LOCATION;
};

/**
 * Walk an IR value against a {@link ToCapabilities} map, emitting errors for
 * unsupported fields that are present. Locations come from the IR sidecar.
 *
 * When the IR value is an array, `capability` is the element capability and is
 * applied to each element.
 */
export function checkIRCapabilities<T>(
  value: T | undefined,
  capability: ToCapabilities<T>,
  path: string,
  diagnostics: Diagnostics,
  megaloVersion: SupportedMegaloVersion,
  locations: FieldLocations,
  owner?: object,
  key?: string
): void {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof capability === "boolean") {
    if (!capability) {
      if (isUnusedIrDefault(value)) {
        return;
      }
      // Unsupported lock/hide (and similar) maps: report each authored flag
      // with its Megalo option name instead of the IR aggregate path.
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const trueFlags = Object.entries(
          value as Record<string, unknown>
        ).filter(([, child]) => child === true);
        if (trueFlags.length > 0) {
          for (const [flagKey] of trueFlags) {
            diagnostics.addError(
              unsupportedMessage(
                capabilityFieldDisplayName(path, flagKey),
                megaloVersion
              ),
              locations.get(value as object, flagKey) ??
                locationForUnsupportedValue(value, locations, owner, key)
            );
          }
          return;
        }
      }
      diagnostics.addError(
        unsupportedMessage(capabilityFieldDisplayName(path), megaloVersion),
        locationForUnsupportedValue(value, locations, owner, key)
      );
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((element, index) => {
      checkIRCapabilities(
        element,
        capability as ToCapabilities<unknown>,
        `${path}[${index}]`,
        diagnostics,
        megaloVersion,
        locations,
        value as object,
        String(index)
      );
    });
    return;
  }

  if (typeof value !== "object") {
    return;
  }

  const group = capability as Record<string, ToCapabilities<unknown>>;
  const record = value as Record<string, unknown>;

  for (const childKey of Object.keys(group)) {
    const child = record[childKey];
    if (child === undefined) {
      continue;
    }

    const childPath = path.length > 0 ? `${path}.${childKey}` : childKey;
    checkIRCapabilities(
      child,
      group[childKey] as ToCapabilities<unknown>,
      childPath,
      diagnostics,
      megaloVersion,
      locations,
      value as object,
      childKey
    );
  }
}

export function assertCompatibleIR(
  ir: IR,
  compiler: Compiler,
  diagnostics: Diagnostics
): void {
  checkIRCapabilities(
    ir.gameVariant as Omit<IR["gameVariant"], "gameEngine">,
    compiler.getCapabilities().ir.gameVariant,
    "gameVariant",
    diagnostics,
    compiler.getMegaloVersion(),
    ir.locations
  );
}
