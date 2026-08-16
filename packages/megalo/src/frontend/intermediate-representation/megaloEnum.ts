import type { SupportedMegaloVersion } from "src/version";

export interface MegaloEnumMemberOptions {
  /** Accept this name when parsing, but resolve to the canonical `aliasOf` member. */
  aliasOf?: string;
  /** Parsed & highlighted, but warn and hide from autocomplete. */
  deprecated?: boolean;
  name: string;
}

interface NormalizedMember {
  aliasOf?: string;
  deprecated: boolean;
  name: string;
}

/** Canonical member names only (excludes `aliasOf` entries). */
type CanonicalMemberName<T> = T extends string
  ? T
  : T extends { aliasOf: string }
    ? never
    : T extends { name: infer N extends string }
      ? N
      : never;

export type MegaloEnumNames<T extends { readonly names: readonly string[] }> =
  T["names"][number];

export interface MegaloEnumDef<Name extends string> {
  /**
   * All names accepted by {@link MegaloEnumDef.parse} (canonical first, then
   * aliases in definition order). Useful for AST keyword parameter slots.
   */
  readonly acceptedNames: readonly string[];
  /** Identity map (`Foo.Bar === "Bar"`), like `z.enum(...).enum`. */
  readonly enum: { readonly [K in Name]: K };
  /** True for canonical names and aliases. */
  readonly has: (name: string) => boolean;
  readonly isDeprecated: (name: string) => boolean;
  /** Canonical member names (parse / highlight). Aliases excluded. */
  readonly names: readonly Name[];
  /** Accepts canonical names and aliases; returns the canonical name. */
  readonly parse: (name: string) => Name | undefined;
  /**
   * Canonical members available on `version`. Lazily computed once per
   * distinct version (full set when no availability callback was provided).
   */
  readonly supportedMembers: (
    version: SupportedMegaloVersion
  ) => ReadonlySet<Name>;
}

const normalizeMember = (
  member: string | MegaloEnumMemberOptions
): NormalizedMember => {
  if (typeof member === "string") {
    return { name: member, deprecated: false };
  }
  return {
    name: member.name,
    deprecated: member.deprecated === true,
    aliasOf: member.aliasOf,
  };
};

/**
 * Closed Megalo vocabulary, similar to `z.enum` without pulling in Zod.
 * Game-specific values are mapped at compile time via {@link mapMegaloEnum}.
 *
 * Optional `allowedForVersion` returns the allowed canonical names for a
 * version. When omitted, the full canonical set is used. Either way it is
 * invoked lazily once per distinct version on first
 * {@link MegaloEnumDef.supportedMembers} lookup and cached thereafter.
 */
export const megaloEnum = <
  const Members extends readonly (string | MegaloEnumMemberOptions)[],
>(
  members: Members,
  allowedForVersion?: (
    version: SupportedMegaloVersion
  ) => ReadonlySet<CanonicalMemberName<Members[number]>>
): MegaloEnumDef<CanonicalMemberName<Members[number]>> => {
  type Name = CanonicalMemberName<Members[number]>;

  const normalized = members.map(normalizeMember);
  const seen = new Set<string>();
  for (const member of normalized) {
    if (seen.has(member.name)) {
      throw new Error(`Duplicate megaloEnum member: ${member.name}`);
    }
    seen.add(member.name);
  }

  const names: Name[] = [];
  const acceptedNames: string[] = [];
  const enumObject = {} as { [K in Name]: K };
  const canonicalNames = new Set<string>();
  const deprecatedNames = new Set<string>();
  const resolve = new Map<string, Name>();
  const allowedByVersion = new Map<SupportedMegaloVersion, ReadonlySet<Name>>();
  /** Explicit gate, or full canonical set when omitted (still lazy per version). */
  const resolveAllowed =
    allowedForVersion ??
    ((_version: SupportedMegaloVersion): ReadonlySet<Name> => new Set(names));

  for (const member of normalized) {
    if (member.aliasOf !== undefined) {
      continue;
    }
    const name = member.name as Name;
    names.push(name);
    acceptedNames.push(name);
    enumObject[name] = name;
    canonicalNames.add(name);
    resolve.set(name, name);
    if (member.deprecated) {
      deprecatedNames.add(name);
    }
  }

  for (const member of normalized) {
    if (member.aliasOf === undefined) {
      continue;
    }
    if (!canonicalNames.has(member.aliasOf)) {
      throw new Error(
        `megaloEnum alias "${member.name}" targets unknown member "${member.aliasOf}"`
      );
    }
    acceptedNames.push(member.name);
    resolve.set(member.name, member.aliasOf as Name);
    if (member.deprecated) {
      deprecatedNames.add(member.name);
    }
  }

  return {
    names,
    acceptedNames,
    enum: enumObject,
    parse: (name) => resolve.get(name),
    has: (name) => resolve.has(name),
    isDeprecated: (name) => deprecatedNames.has(name),
    supportedMembers: (version) => {
      let allowed = allowedByVersion.get(version);
      if (allowed === undefined) {
        allowed = resolveAllowed(version);
        allowedByVersion.set(version, allowed);
      }
      return allowed;
    },
  };
};

export const mapMegaloEnum = <Name extends string, Out>(
  value: Name,
  mapping: { readonly [K in Name]: Out }
): Out => mapping[value];
