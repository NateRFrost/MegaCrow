import {
  GameOptionEntryKind,
  type GameOptionsElementNode,
  type OverrideNameNode,
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
  emitElementKeyword,
  emitLocation,
} from "src/language-service/highlighting/emit";
import {
  type EnumKeywordAllowed,
  highlightClosedValueParameters,
  highlightEnumKeyword,
  highlightStructural,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

const BOOLEAN_KEYWORDS = ["true", "false"] as const;

const OBJECT_LIST_SENTINELS = ["none", "default", "random"] as const;
const EQUIPMENT_USAGE_KEYWORDS = ["on", "enabled", "off", "disabled"] as const;

/** Per trait-option closed keyword vocabs (integers / refs / grenade_count use structural). */
const PLAYER_TRAIT_VALUE_BY_OPTION: Record<string, EnumKeywordAllowed> = {
  damage_resistance: ["invulnerable"],
  damage_modifier: ["fatality"],
  melee_damage_modifier: ["fatality"],
  initial_primary_weapon: OBJECT_LIST_SENTINELS,
  initial_secondary_weapon: OBJECT_LIST_SENTINELS,
  initial_equipment: OBJECT_LIST_SENTINELS,
  vehicle_usage: vehicleUsage,
  sprinting: BOOLEAN_KEYWORDS,
  equipment_usage: EQUIPMENT_USAGE_KEYWORDS,
  active_camo: activeCamo,
  waypoint: waypointVisibility,
  gamertag_visibility: waypointVisibility,
  color: forcedChangeColor,
  tracker_mode: motionTrackerMode,
};

const highlightPlayerTraitOptions = (
  out: SemanticToken[],
  options: readonly PlayerTraitOptionNode[]
): void => {
  for (const option of options) {
    emitLocation(out, option.location, "parameter");
    const allowed = PLAYER_TRAIT_VALUE_BY_OPTION[option.identifier];
    if (allowed !== undefined) {
      highlightClosedValueParameters(out, option.parameters, allowed);
      continue;
    }
    for (const node of option.parameters) {
      highlightStructural(out, node);
    }
  }
};

const highlightOverrideName = (
  out: SemanticToken[],
  name: OverrideNameNode
): void => {
  if (name.kind === SyntaxKind.INVALID) {
    return;
  }
  if (name.kind === "loadout_palette") {
    emitLocation(out, name.location, "type");
    return;
  }
  emitLocation(out, name.location, "variable");
};

export const highlightGameOptions = (
  out: SemanticToken[],
  element: GameOptionsElementNode
): void => {
  emitElementKeyword(out, element.keywordLocation);
  for (const entry of element.entries) {
    if (entry.modifiers.hideLocation !== undefined) {
      emitLocation(out, entry.modifiers.hideLocation, "modifier");
    }
    if (entry.modifiers.lockLocation !== undefined) {
      emitLocation(out, entry.modifiers.lockLocation, "modifier");
    }

    if (entry.kind === GameOptionEntryKind.OVERRIDE) {
      emitLocation(out, entry.keywordLocation, "keyword");
      highlightOverrideName(out, entry.name);
      if (entry.value.kind === SyntaxKind.INVALID) {
        continue;
      }
      if (entry.value.kind === OverrideValueKind.NESTED) {
        highlightPlayerTraitOptions(out, entry.value.body.options);
      } else if (entry.value.kind === OverrideValueKind.SIMPLE) {
        const simple = entry.value.value;
        if (
          typeof simple === "object" &&
          "kind" in simple &&
          simple.kind === SyntaxKind.KEYWORD
        ) {
          const optionName =
            entry.name.kind === SyntaxKind.REFERENCE
              ? entry.name.identifier
              : entry.name.kind === "player_traits_override"
                ? entry.name.option
                : undefined;
          const allowed =
            optionName === "weapon_set" || optionName === "vehicle_set"
              ? OBJECT_LIST_SENTINELS
              : BOOLEAN_KEYWORDS;
          highlightEnumKeyword(out, simple, allowed);
        }
        // REFERENCES (incl. object-list items) are painted via the symbol table.
      } else if (entry.value.kind === OverrideValueKind.LOADOUT_PALETTE) {
        if (!("kind" in entry.value.tier)) {
          emitLocation(
            out,
            entry.value.tier.location,
            loadoutPaletteType.has(entry.value.tier.value)
              ? "enumMember"
              : "variable"
          );
        }
        if (!("kind" in entry.value.palette)) {
          emitLocation(out, entry.value.palette.location, "variable");
        }
      }
      continue;
    }

    if (
      entry.kind === GameOptionEntryKind.OPTION ||
      entry.kind === GameOptionEntryKind.RANGED_OPTION ||
      entry.kind === GameOptionEntryKind.OPTION_OVERRIDE
    ) {
      emitLocation(out, entry.keywordLocation, "keyword");
      continue;
    }

    if (
      entry.kind === GameOptionEntryKind.PLAYER_TRAITS ||
      entry.kind === GameOptionEntryKind.PLAYER_TRAITS_OVERRIDE
    ) {
      emitLocation(out, entry.keywordLocation, "keyword");
      highlightPlayerTraitOptions(out, entry.options);
    }
  }
};
