import { getLabel, type SupportedMegaloVersion } from "../../../version";
import {
  BUILT_IN_LOCATION,
  type Diagnostics,
  type SourceLocation,
} from "../../../diagnostics";
import type { FieldLocations, IR } from "../../../frontend/intermediate-representation";
import { translate } from "../../../localization";
import { Compiler } from "../compiler";

type Primitive = string | number | boolean | bigint;

// used to make a type with all of the keys of IR, but only boolean values.
export type ToCapabilities<T> = [T] extends [readonly (infer E)[]]
  ? ToCapabilities<E>
  : [T] extends [Primitive]
    ? boolean
    : [T] extends [object]
      ?
          | { readonly [K in keyof Required<T>]: ToCapabilities<Required<T>[K]> }
          | boolean
      : boolean;

type GameVariantCapabilities = ToCapabilities<
  Omit<IR["gameVariant"], "gameEngine">
>;

export type IRCapabilities = {
  // CustomGameEngineDefinition is not part of IR capabilities as its handled elsewhere.
  readonly gameVariant: GameVariantCapabilities;
};

export type CompilerCapabilities = {
  readonly ir: IRCapabilities;
};

const unsupportedMessage = (
  fieldPath: string,
  megaloVersion: SupportedMegaloVersion
): string =>
  translate("unsupported_field", {
    fieldPath,
    versionLabel: getLabel(megaloVersion),
  });

const locationOf = (
  locations: FieldLocations,
  owner: object,
  key: string
): SourceLocation => locations.get(owner, key) ?? BUILT_IN_LOCATION;

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
      diagnostics.addError(
        unsupportedMessage(path, megaloVersion),
        owner !== undefined && key !== undefined
          ? locationOf(locations, owner, key)
          : BUILT_IN_LOCATION
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
