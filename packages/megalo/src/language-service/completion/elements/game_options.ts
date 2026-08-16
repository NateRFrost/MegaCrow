import {
  GameOptionEntryKind,
  type GameOptionsElementNode,
  OverrideValueKind,
} from "src/frontend/abstract-syntax-tree/elements/game_options";
import type { PlayerTraitOptionNode } from "src/frontend/abstract-syntax-tree/elements/game_options/player_traits";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import {
  activeCamo,
  forcedChangeColor,
  motionTrackerMode,
  vehicleUsage,
  waypointVisibility,
} from "src/frontend/intermediate-representation/game/game_engine_player_traits";
import { loadoutPaletteType } from "src/frontend/intermediate-representation/game/megalogamengine/loadoutPaletteType";
import {
  BUILT_IN_GAME_OPTION_NAMES,
  PLAYER_TRAITS_OVERRIDE_OPTIONS,
} from "src/frontend/language-configuration/omni/game_options";
import {
  focusNamedPropertyAllowingEmptyValue,
  isSameLineAs,
  type NamedPropertyLike,
} from "src/language-service/completion/elements/property";
import {
  ObjectListType,
  ParameterType,
  SymbolKind,
  suggestBoolean,
  suggestEnum,
  suggestKeywords,
  suggestObjectList,
  suggestSymbolKind,
  suggestTyped,
  withBlockEndSnippet,
  withContinueCompletion,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  ElementCompletionContext,
} from "src/language-service/completion/types";

const BODY_KEYWORDS = [
  "lock",
  "hide",
  "override",
  "option",
  "ranged_option",
  "player_traits",
  "end",
] as const;

/** Nested `end`-closed entries inside `game_options`. */
const GAME_OPTIONS_BLOCK_KEYWORDS = new Set([
  "option",
  "ranged_option",
  "player_traits",
]);

const PLAYER_TRAIT_OPTION_NAMES = [
  "damage_resistance",
  "body_recharge",
  "shield_recharge",
  "vampirism",
  "headshot_immunity",
  "body_multiplier",
  "shield_multiplier",
  "assassination_immunity",
  "damage_modifier",
  "melee_damage_modifier",
  "initial_primary_weapon",
  "initial_secondary_weapon",
  "initial_equipment",
  "initial_grenades",
  "recharging_grenades",
  "infinite_ammo",
  "bottomless_clip",
  "weapon_pickup",
  "drop_equipment",
  "infinite_equipment",
  "speed",
  "gravity",
  "vehicle_usage",
  "jump_modifier",
  "sprinting",
  "equipment_usage",
  "active_camo",
  "waypoint",
  "gamertag_visibility",
  "color",
  "tracker_mode",
  "tracker_range",
] as const;

const OBJECT_LIST_SENTINELS = ["none", "default", "random"] as const;
const EQUIPMENT_USAGE_KEYWORDS = ["on", "enabled", "off", "disabled"] as const;
const GRENADE_KEYWORDS = ["none", "default"] as const;

const PLAYER_TRAIT_VALUE_BY_OPTION: Record<string, readonly string[]> = {
  damage_resistance: ["invulnerable"],
  damage_modifier: ["fatality"],
  melee_damage_modifier: ["fatality"],
  initial_primary_weapon: OBJECT_LIST_SENTINELS,
  initial_secondary_weapon: OBJECT_LIST_SENTINELS,
  initial_equipment: OBJECT_LIST_SENTINELS,
  sprinting: ["true", "false"],
  equipment_usage: EQUIPMENT_USAGE_KEYWORDS,
};

const OVERRIDE_NAMES = [
  ...BUILT_IN_GAME_OPTION_NAMES,
  ...PLAYER_TRAITS_OVERRIDE_OPTIONS,
  "loadout_palette",
] as const;

const sameLineAfter = (
  ctx: ElementCompletionContext,
  property: NamedPropertyLike
): boolean => isSameLineAs(ctx.snapshot, ctx.offset, property.location);

const completeTraitValue = (
  ctx: ElementCompletionContext,
  key: string
): CompletionItem[] => {
  switch (key) {
    case "initial_primary_weapon":
    case "initial_secondary_weapon":
      return [
        ...suggestKeywords(ctx, OBJECT_LIST_SENTINELS, "enumMember"),
        ...suggestObjectList(ctx, ObjectListType.Weapons),
      ];
    case "initial_equipment":
      return [
        ...suggestKeywords(ctx, OBJECT_LIST_SENTINELS, "enumMember"),
        ...suggestObjectList(ctx, ObjectListType.Equipment),
      ];
    case "initial_grenades":
      return suggestKeywords(ctx, GRENADE_KEYWORDS, "enumMember");
    case "sprinting":
      return suggestBoolean(ctx);
    case "vehicle_usage":
      return suggestEnum(ctx, vehicleUsage);
    case "active_camo":
      return suggestEnum(ctx, activeCamo);
    case "waypoint":
    case "gamertag_visibility":
      return suggestEnum(ctx, waypointVisibility);
    case "color":
      return suggestEnum(ctx, forcedChangeColor);
    case "tracker_mode":
      return suggestEnum(ctx, motionTrackerMode);
    default: {
      const closed = PLAYER_TRAIT_VALUE_BY_OPTION[key];
      if (closed !== undefined) {
        return suggestKeywords(ctx, closed, "enumMember");
      }
      return suggestTyped(ctx, ParameterType.Integer);
    }
  }
};

const completeTraitOptions = (
  ctx: ElementCompletionContext,
  options: readonly PlayerTraitOptionNode[]
): CompletionItem[] => {
  const focus = focusNamedPropertyAllowingEmptyValue(
    options,
    ctx.offset,
    (property) => sameLineAfter(ctx, property)
  );
  if (focus?.kind === "value") {
    return completeTraitValue(ctx, focus.key);
  }
  return suggestKeywords(ctx, PLAYER_TRAIT_OPTION_NAMES, "property");
};

const offsetIn = (
  location: { start: { localOffset: number }; end: { localOffset: number } },
  offset: number
): boolean =>
  offset >= location.start.localOffset && offset <= location.end.localOffset;

export const completeGameOptions = (
  ctx: ElementCompletionContext
): CompletionItem[] => {
  const element = ctx.element as GameOptionsElementNode;

  for (const entry of element.entries) {
    if (!offsetIn(entry.location, ctx.offset)) {
      continue;
    }

    if (
      entry.kind === GameOptionEntryKind.PLAYER_TRAITS ||
      entry.kind === GameOptionEntryKind.PLAYER_TRAITS_OVERRIDE
    ) {
      return completeTraitOptions(ctx, entry.options);
    }

    if (entry.kind === GameOptionEntryKind.OVERRIDE) {
      if (
        entry.name.kind !== SyntaxKind.INVALID &&
        offsetIn(entry.name.location, ctx.offset)
      ) {
        return suggestKeywords(ctx, OVERRIDE_NAMES, "enumMember");
      }

      if (
        entry.value.kind === OverrideValueKind.NESTED &&
        offsetIn(entry.value.body.location, ctx.offset)
      ) {
        return completeTraitOptions(ctx, entry.value.body.options);
      }

      if (entry.value.kind === OverrideValueKind.LOADOUT_PALETTE) {
        const { tier, palette } = entry.value;
        const paletteOptions = {
          // Forward refs are valid for declared loadout_palette names.
          ignoreVisibility: true,
          // Keep siblings visible while replacing an existing palette token.
          replacingToken: true,
        } as const;
        // Prefer the tier slot when both missing spans overlap after the name.
        if (!("kind" in tier) && offsetIn(tier.location, ctx.offset)) {
          return suggestEnum(ctx, loadoutPaletteType);
        }
        if (
          "kind" in tier &&
          tier.kind === SyntaxKind.INVALID &&
          ctx.offset > entry.name.location.end.localOffset &&
          isSameLineAs(ctx.snapshot, ctx.offset, entry.name.location)
        ) {
          return suggestEnum(ctx, loadoutPaletteType);
        }
        if (!("kind" in palette) && offsetIn(palette.location, ctx.offset)) {
          return suggestSymbolKind(
            ctx,
            SymbolKind.LoadoutPalette,
            paletteOptions
          );
        }
        if (
          ctx.offset > entry.name.location.end.localOffset &&
          isSameLineAs(ctx.snapshot, ctx.offset, entry.name.location)
        ) {
          // After a completed tier (or when the palette token is missing),
          // offer declared loadout palettes — not tier enum names again.
          if (!("kind" in tier) && ctx.offset > tier.location.end.localOffset) {
            return suggestSymbolKind(
              ctx,
              SymbolKind.LoadoutPalette,
              paletteOptions
            );
          }
          if ("kind" in palette && palette.kind === SyntaxKind.INVALID) {
            return suggestSymbolKind(
              ctx,
              SymbolKind.LoadoutPalette,
              paletteOptions
            );
          }
          return suggestEnum(ctx, loadoutPaletteType);
        }
      }

      if (
        entry.value.kind === OverrideValueKind.SIMPLE &&
        offsetIn(entry.value.value.location, ctx.offset)
      ) {
        const optionName =
          entry.name.kind === SyntaxKind.REFERENCE
            ? entry.name.identifier
            : undefined;
        if (optionName === "weapon_set") {
          return [
            ...suggestKeywords(ctx, OBJECT_LIST_SENTINELS, "enumMember"),
            ...suggestObjectList(ctx, ObjectListType.WeaponSets),
          ];
        }
        if (optionName === "vehicle_set") {
          return [
            ...suggestKeywords(ctx, OBJECT_LIST_SENTINELS, "enumMember"),
            ...suggestObjectList(ctx, ObjectListType.VehicleSets),
          ];
        }
        return [
          ...suggestBoolean(ctx),
          ...suggestTyped(ctx, ParameterType.Integer),
        ];
      }

      if (
        ctx.offset > entry.keywordLocation.end.localOffset &&
        (entry.name.kind === SyntaxKind.INVALID ||
          ctx.offset <= entry.name.location.end.localOffset ||
          isSameLineAs(ctx.snapshot, ctx.offset, entry.keywordLocation))
      ) {
        return suggestKeywords(ctx, OVERRIDE_NAMES, "enumMember");
      }
    }
  }

  return suggestKeywords(ctx, BODY_KEYWORDS, "keyword").map((entry) => {
    if (GAME_OPTIONS_BLOCK_KEYWORDS.has(entry.label)) {
      return withBlockEndSnippet(entry);
    }
    if (entry.label === "end") {
      return entry;
    }
    // lock / hide / override take a following name (or nested body).
    return withContinueCompletion(entry);
  });
};
