import { EngineCategories } from "../engine-categories";
import type { GameEngineBaseVariant } from "./game_engine_default";
import type { PlayerTraitOption } from "./game_engine_traits";
import type { Action } from "./megalogamengine/megalogamengine_actions";
import type { Condition } from "./megalogamengine/megalogamengine_conditions";
import type { HudWidgetPosition } from "./megalogamengine/megalogamengine_hud_widgets";
import type { ObjectFilter } from "./megalogamengine/megalogamengine_map_objects";
import type { MegaloGameEngineMapPermissions } from "./megalogamengine/megalogamengine_map_permissions";
import type { MegaloGameStatistic } from "./megalogamengine/megalogamengine_statistics";
import type { Trigger } from "./megalogamengine/megalogamengine_trigger";
import type { UserDefinedOption } from "./megalogamengine/megalogamengine_user_defined_options";
import type { VariableMetadata } from "./megalogamengine/megalogamengine_variable_metadata";
import type { BuiltInGameOptionFlags } from "./parameters";
import type { StringTable, StringTableReference } from "./string_table";

// Based on c_game_engine_custom_variant
// A lot of this is partial, as its applied as an override on the default game engine definition.
export type GameEngineCustomVariant = {
  baseVariant: GameEngineBaseVariant;
  playerTraits: PlayerTraitOption[];
  userDefinedOptions: UserDefinedOption[];
  scriptStrings: StringTable;
  baseNameStringIndex: StringTableReference;
  localizedName?: StringTable;
  localizedDescription?: StringTable;
  localizedCategory?: StringTable;
  engineIcon: number;
  engineCategory: EngineCategories;
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
  scoreToWinRound?: number;
  fireTeamsEnabled?: number;
  symmetricGametype?: boolean;
  baseVariantParametersLocked: BuiltInGameOptionFlags;
  baseVariantParametersHidden: BuiltInGameOptionFlags;
  // lock and hide flags are stored within userDefinedOptions on IR.
  // userDefinedOptionsLocked: GameVariantParameterFlags;
  // userDefinedOptionsHidden: GameVariantParameterFlags;
  gameEngine: CustomGameEngineDefinition;
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
};

export type CustomGameEngineDefinition = {
  conditions: Condition[];
  actions: Action[];
  triggers: Trigger[];
  statistics: MegaloGameStatistic[];
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
  hudWidgets: HudWidgetPosition[];
  initializationTriggerIndex: number;
  localInitializationTriggerIndex: number;
  hostMigrationTriggerIndex: number;
  doubleMigrationTriggerIndex: number;
  objectDeathEventTriggerIndex: number;
  localTriggerIndex: number;
  pregameTriggerIndex: number;
  objectsUsed: boolean[];
  objectFilters: ObjectFilter[];
};
