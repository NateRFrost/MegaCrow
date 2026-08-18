import type { EngineCategories } from "src/frontend/intermediate-representation/engine-categories";
import type {
  GameEngineBaseVariant,
  LoadoutPaletteTraits,
  LoadoutTraits,
} from "src/frontend/intermediate-representation/game/game_engine_default";
import type { PlayerTraitOption } from "src/frontend/intermediate-representation/game/game_engine_traits";
import type { Action } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import type { Condition } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_conditions";
import type { HudWidgetPosition } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_hud_widgets";
import type { ObjectFilter } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_map_objects";
import type { MegaloGameEngineMapPermissions } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_map_permissions";
import type { RequisitionPalette } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_requisitions";
import type { MegaloGameStatistic } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_statistics";
import type { Trigger } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_trigger";
import type { UserDefinedOption } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_user_defined_options";
import type { VariableMetadata } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_variable_metadata";
import type { BuiltInGameOptionFlags } from "src/frontend/intermediate-representation/game/parameters";
import type {
  StringTable,
  StringTableReference,
} from "src/frontend/intermediate-representation/game/string_table";

// Based on c_game_engine_custom_variant
// A lot of this is partial, as its applied as an override on the default game engine definition.
export interface GameEngineCustomVariant {
  baseNameStringIndex: StringTableReference;
  baseVariant: GameEngineBaseVariant;
  baseVariantParametersHidden: BuiltInGameOptionFlags;
  baseVariantParametersLocked: BuiltInGameOptionFlags;
  engineCategory?: EngineCategories;
  engineIcon?: number;
  fireTeamsEnabled?: number;
  // lock and hide flags are stored within userDefinedOptions on IR.
  // userDefinedOptionsLocked: GameVariantParameterFlags;
  // userDefinedOptionsHidden: GameVariantParameterFlags;
  gameEngine: CustomGameEngineDefinition;
  localizedCategory?: StringTable;
  localizedDescription?: StringTable;
  localizedName?: StringTable;
  mapPermissions?: MegaloGameEngineMapPermissions;
  playerRatings?: Partial<{
    ratingScale: number;
    killWeight: number;
    assistWeight: number;
    betrayalWeight: number;
    deathWeight: number;
    normalizeByMaxKills: number;
    base: number;
    range: number;
    lossScalar: number;
    customStat0: number;
    customStat1: number;
    customStat2: number;
    customStat3: number;
    expansion0: number;
    expansion1: number;
    showInScoreboard: boolean;
  }>;
  playerTraits: PlayerTraitOption[];
  scoreToWinRound?: number;
  scriptStrings: StringTable;
  symmetricGametype?: boolean;
  tu1Settings: Partial<{
    alwaysSpilloverDamage: boolean;
    armorLockStickiesRemain: boolean;
    attachedDamageBypassShields: boolean;
    activeCamoOverrideEnergyCurve: boolean;
    swordGunClangKills: boolean;
    magnumIsAutomatic: boolean;
    precisionBloom: number;
    armorLockDamageDrain: number;
    armorLockDamageDrainLimit: number;
    activeCamoEnergyCurveMin: number;
    activeCamoEnergyCurveMax: number;
    magnumDamage: number;
    magnumFireDelay: number;
  }>;
  userDefinedOptions: UserDefinedOption[];
}

export interface CustomGameEngineDefinition {
  actions: Action[];
  conditions: Condition[];
  doubleMigrationTriggerIndex: number;
  hostMigrationTriggerIndex: number;
  hudWidgets: HudWidgetPosition[];
  initializationTriggerIndex: number;
  loadoutPalettes: LoadoutPaletteTraits[];
  loadouts: LoadoutTraits[];
  localInitializationTriggerIndex: number;
  localTriggerIndex: number;
  objectDeathEventTriggerIndex: number;
  objectFilters: ObjectFilter[];
  objectsUsed: boolean[];
  pregameTriggerIndex: number;
  requisitionPalettes: RequisitionPalette[];
  statistics: MegaloGameStatistic[];
  triggers: Trigger[];
  // This is a deviation from blam
  // Ordinarily, temporary variables are not included in the variable metadata.
  // We add temporary variable metadata here because if a compiler hits its temporary limit,
  // which in some cases is zero, it maps the temporary variables to the global variables.
  // so temporary metadata exists at IR but does not exist in a compiled gametype unless
  // mapped to the global variables.
  variableMetadata: {
    global: VariableMetadata;
    player: VariableMetadata;
    object: VariableMetadata;
    team: VariableMetadata;
    temporary: VariableMetadata;
  };
}
