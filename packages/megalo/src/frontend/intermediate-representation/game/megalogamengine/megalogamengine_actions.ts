import type { LoadoutPaletteType } from "src/frontend/intermediate-representation/game/megalogamengine/loadoutPaletteType";
import type { HUDMeterInputType } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_hud_widgets";
import type {
  CustomTimerReference,
  CustomVariableReference,
  ObjectReference,
  ObjectTypeReference,
  PlayerReference,
  TeamReference,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import type { MegaloSound } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_sounds";
import type { DynamicString } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_text";
import type { VariantVariable } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_variant_variable";
import type { StringTableReference } from "src/frontend/intermediate-representation/game/string_table";

export enum ActionType {
  SetScore = 0,
  CreateObject = 1,
  DeleteObject = 2,
  NavpointSetVisible = 3,
  NavpointSetIcon = 4,
  NavpointSetPriority = 5,
  NavpointSetTimer = 6,
  NavpointSetVisibleRange = 7,
  Set = 8,
  SetBoundary = 9,
  ApplyPlayerTraits = 10,
  SetPickupFilter = 11,
  SetRespawnFilter = 12,
  SetFireteamRespawnFilter = 13,
  SetProgressBar = 14,
  HudPostMessage = 15,
  TimerSetRate = 16,
  PrintVariable = 17,
  GetPlayerHoldingObject = 18,
  ForEach = 19,
  EndRound = 20,
  BoundarySetVisible = 21,
  ObjectDestroy = 22,
  ObjectSetInvincibility = 23,
  Random = 24,
  BreakIntoDebugger = 25,
  ObjectGetOrientation = 26,
  ObjectGetVelocity = 27,
  PlayerDeathGetKillingPlayer = 28,
  PlayerDeathGetDamageType = 29,
  PlayerDeathGetSpecialType = 30,
  DebuggingEnableTracing = 31,
  ObjectAttach = 32,
  ObjectDetach = 33,
  PlayerGetPlace = 34,
  TeamGetPlace = 35,
  PlayerGetKillingSpreeCount = 36,
  PlayerAdjustMoney = 37,
  PlayerEnablePurchases = 38,
  PlayerGetVehicle = 39,
  PlayerSetVehicle = 40,
  PlayerSetUnit = 41,
  TimerReset = 42,
  WeaponSetPickupPriority = 43,
  ObjectBounce = 44,
  HudWidgetSetText = 45,
  HudWidgetSetValue = 46,
  HudWidgetSetMeter = 47,
  HudWidgetSetIcon = 48,
  HudWidgetSetVisibility = 49,
  PlaySound = 50,
  ObjectSetScale = 51,
  NavpointSetText = 52,
  ObjectGetShield = 53,
  ObjectGetHealth = 54,
  PlayerSetObjective = 55,
  PlayerSetObjectiveAllegiance = 56,
  PlayerSetObjectiveAllegianceIcon = 57,
  TeamSetCoopSpawning = 58,
  TeamSetPrimaryRespawnObject = 59,
  PlayerSetPrimaryRespawnObject = 60,
  PlayerGetFireteamIndex = 61,
  PlayerSetFireteamIndex = 62,
  ObjectAdjustShield = 63,
  ObjectAdjustHealth = 64,
  ObjectGetDistance = 65,
  ObjectAdjustMaximumShield = 66,
  ObjectAdjustMaximumHealth = 67,
  PlayerSetRequisitionPalette = 68,
  DeviceSetPower = 69,
  DeviceGetPower = 70,
  DeviceSetPosition = 71,
  DeviceGetPosition = 72,
  AdjustGrenades = 73,
  SubmitIncident = 74,
  SubmitIncidentWithCustomValue = 75,
  SetLoadoutPalette = 76,
  DeviceSetPositionTrack = 77,
  DeviceAnimatePosition = 78,
  DeviceSetPositionImmediate = 79,
  SavedFilmInsertMarker = 80,
  RespawnZoneEnable = 81,
  PlayerGetWeapon = 82,
  PlayerGetEquipment = 83,
  ObjectSetNeverGarbage = 84,
  PlayerGetTargetObject = 85,
  CreateTunnel = 86,
  DebugForcePlayerViewCount = 87,
  PlayerPickUpWeapon = 88,
  PlayerSetCoopSpawning = 89,
  ObjectSetOrientation = 90,
  ObjectFaceObject = 91,
  BipedGiveWeapon = 92,
  BipedDropWeapon = 93,
  SetScenarioInterpolatorState = 94,
  GetRandomObject = 95,
  GameGriefRecordCustomPenalty = 96,
  BoundarySetPlayerColor = 97,
  Begin = 98,
  HsFunctionCall = 99,
  GetButtonTime = 100,
  TeamSetVehicleSpawning = 101,
  PlayerSetVehicleSpawning = 102,
  SetPlayerRespawnVehicle = 103,
  SetTeamRespawnVehicle = 104,
  HideObject = 105,
}

interface ActionParameters<T extends ActionType, P> {
  parameters: P;
  type: T;
}

export enum TeamOrPlayerTargetKind {
  Team = 0,
  Player = 1,
  Everyone = 2,
}

export type TeamOrPlayerTarget =
  | { type: TeamOrPlayerTargetKind.Everyone }
  | { type: TeamOrPlayerTargetKind.Player; player: PlayerReference }
  | { type: TeamOrPlayerTargetKind.Team; team: TeamReference };

export enum MathOperation {
  Add = 0,
  Subtract = 1,
  Multiply = 2,
  Divide = 3,
  SetTo = 4,
  Modulo = 5,
  And = 6,
  Or = 7,
  Xor = 8,
  Not = 9,
  LShift = 10,
  RShift = 11,
  Abs = 12,
}

export interface SetScoreParameters {
  operation: MathOperation;
  target: TeamOrPlayerTarget;
  variable: CustomVariableReference;
}

export interface ObjectOffset {
  x: number;
  y: number;
  z: number;
}

export interface CreateObjectParameters {
  absoluteOrientation?: boolean;
  labelIndex?: StringTableReference; // not 100% sure about this
  neverGarbageCollect?: boolean;
  object_reference_out?: ObjectReference;
  objectType: ObjectTypeReference;
  offset?: ObjectOffset;
  place_at_object: ObjectReference;
  suppressEffect?: boolean;
  variantNameIndex?: number; // object_lists/stringids.txt ?
}

export interface DeleteObjectParameters {
  object: ObjectReference;
}

export interface NavpointSetVisibleParameters {
  navpoint: ObjectReference;
  playerFilterModifier: PlayerFilterModifier;
}

export interface NavpointSetIconParameters {
  icon: number;
  navpoint: ObjectReference;
  /** Present when icon is `num` (11). */
  number?: CustomVariableReference;
}

export enum NavpointPriority {
  Low = 0,
  Normal = 1,
  High = 2,
  Blink = 3,
}

export interface NavpointSetPriorityParameters {
  navpoint: ObjectReference;
  priority: NavpointPriority;
}

export interface NavpointSetTimerParameters {
  navpoint: ObjectReference;
  timerIndex: number;
}

export interface NavpointSetVisibleRangeParameters {
  maxFeet: CustomVariableReference;
  minFeet: CustomVariableReference;
  navpoint: ObjectReference;
}

export interface SetParameters {
  left: VariantVariable;
  operation: MathOperation;
  right: VariantVariable;
}

export enum BoundaryShape {
  None = 0,
  Sphere = 1,
  Cylinder = 2,
  Box = 3,
}

interface NoneBoundaryParameters {
  shape: BoundaryShape.None;
}

interface SphereBoundaryParameters {
  radius: CustomVariableReference;
  shape: BoundaryShape.Sphere;
}

interface BoxBoundaryParameters {
  depth: CustomVariableReference;
  /** MegaloEdit script order: … neg_height pos_height */
  negHeight: CustomVariableReference;
  posHeight: CustomVariableReference;
  shape: BoundaryShape.Box;
  width: CustomVariableReference;
}

interface CylinderBoundaryParameters {
  negHeight: CustomVariableReference;
  posHeight: CustomVariableReference;
  radius: CustomVariableReference;
  shape: BoundaryShape.Cylinder;
}

export type SetBoundaryParameters = {
  object: ObjectReference;
} & (
  | NoneBoundaryParameters
  | SphereBoundaryParameters
  | BoxBoundaryParameters
  | CylinderBoundaryParameters
);

export interface ApplyPlayerTraitsParameters {
  player: PlayerReference;
  traitIndex: number;
}

export interface FireteamFilter {
  fireteam1: boolean;
  fireteam2: boolean;
  fireteam3: boolean;
  fireteam4: boolean;
  fireteam5: boolean;
  fireteam6: boolean;
  fireteam7: boolean;
  fireteam8: boolean;
}

export interface SetFireteamRespawnFilterParameters {
  fireteamFilter: FireteamFilter;
  object: ObjectReference;
}

export enum PlayerFilterType {
  NoOne = 0,
  Everyone = 1,
  Allies = 2,
  Enemies = 3,
  SpecificPlayer = 4,
  Normal = 5,
}

export type PlayerFilterModifier =
  | {
      type: Exclude<PlayerFilterType, PlayerFilterType.SpecificPlayer>;
    }
  | {
      type: PlayerFilterType.SpecificPlayer;
      player: PlayerReference;
      visible: CustomVariableReference;
    };

export interface SetProgressBarParameters {
  object: ObjectReference;
  playerFilterModifier: PlayerFilterModifier;
  timerIndex: number;
}

export interface HudPostMessageParameters {
  soundIndex: MegaloSound;
  string: DynamicString;
  target: TeamOrPlayerTarget;
}

export enum GameEngineTimerRate {
  Zero = 0,
  Negative_10x = 1,
  Negative_25x = 2,
  Negative_50x = 3,
  Negative_75x = 4,
  Negative_100x = 5,
  Negative_125x = 6,
  Negative_150x = 7,
  Negative_175x = 8,
  Negative_200x = 9,
  Negative_300x = 10,
  Negative_400x = 11,
  Negative_500x = 12,
  Negative_1000x = 13,
  Positive_10x = 14,
  Positive_25x = 15,
  Positive_50x = 16,
  Positive_75x = 17,
  Positive_100x = 18,
  Positive_125x = 19,
  Positive_150x = 20,
  Positive_175x = 21,
  Positive_200x = 22,
  Positive_300x = 23,
  Positive_400x = 24,
  Positive_500x = 25,
  Positive_1000x = 26,
}

export interface TimerSetRateParameters {
  rate: GameEngineTimerRate;
  timer: CustomTimerReference;
}

export interface ForEachParameters {
  triggerIndex: number;
}

export interface ObjectDestroyParameters {
  noStatistics?: boolean;
  object: ObjectReference;
}

export interface ObjectAttachParameters {
  absoluteOrientation?: boolean;
  child: ObjectReference;
  offset: ObjectOffset;
  parent: ObjectReference;
}

export interface PlayerAdjustMoneyParameters {
  amount: CustomVariableReference;
  operation: MathOperation;
  player: PlayerReference;
}

export interface PlayerPurchaseMode {
  aliveEquipment: boolean;
  aliveVehicles: boolean;
  aliveWeapons: boolean;
  deadEquipment: boolean;
  deadWeapons: boolean;
}

export interface PlayerEnablePurchasesParameters {
  enabled: CustomVariableReference;
  player: PlayerReference;
  selectedModes: PlayerPurchaseMode;
}

export enum WeaponPickupPriority {
  Normal = 0,
  Special = 1,
  Automatic = 2,
}

export interface WeaponSetPickupPriorityParameters {
  priority: WeaponPickupPriority;
  weapon: ObjectReference;
}

export interface HUDWidgetSetTextParameters {
  string: DynamicString;
  widgetIndex: number;
}

interface HUDMeterInputNumber {
  max: CustomVariableReference;
  meterType: HUDMeterInputType.Number;
  value: CustomVariableReference;
}

interface HUDMeterInputTimer {
  meterType: HUDMeterInputType.Timer;
  timer: CustomTimerReference;
}

interface HUDMeterInputNone {
  meterType: HUDMeterInputType.None;
}

export type HUDMeterInput =
  | HUDMeterInputNumber
  | HUDMeterInputTimer
  | HUDMeterInputNone;

export interface HUDWidgetSetMeterParameters {
  meterInput: HUDMeterInput;
  widgetIndex: number;
}

export interface HUDWidgetSetIconParameters {
  iconIndex: number; // object_lists/hud_widget_icons.txt
  widgetIndex: number;
}

export interface HUDWidgetSetVisibilityParameters {
  player: PlayerReference;
  visible: boolean;
  widgetIndex: number;
}

export interface PlaySoundParameters {
  immediate: boolean;
  soundIndex: MegaloSound;
  target: TeamOrPlayerTarget;
}

export interface VitalityAdjustmentParameters {
  amount: CustomVariableReference;
  object: ObjectReference;
  operation: MathOperation;
}

export interface PlayerSetRequisitionPaletteParameters {
  player: PlayerReference;
  requisitionPaletteIndex: number;
}

export enum GrenadeType {
  Frag = 0,
  Plasma = 1,
}

export interface AdjustGrenadesParameters {
  amount: CustomVariableReference;
  grenadeType: GrenadeType;
  operation: MathOperation;
  player: PlayerReference;
}

export interface SubmitIncidentParameters {
  cause: TeamOrPlayerTarget;
  effect: TeamOrPlayerTarget;
  statIndex: number;
}

export interface SubmitIncidentWithCustomValueParameters {
  cause: TeamOrPlayerTarget;
  customValue: CustomVariableReference;
  effect: TeamOrPlayerTarget;
  statIndex: number;
}

export interface SetLoadoutPaletteParameters {
  loadoutPaletteIndex: LoadoutPaletteType;
  target: TeamOrPlayerTarget;
}

export interface PlayerGetWeaponParameters {
  player: PlayerReference;
  primary: boolean;
  weapon: ObjectReference;
}

export interface CreateTunnelParameters {
  from: ObjectReference;
  objectReferenceOut: ObjectReference;
  objectType: ObjectTypeReference;
  radious: CustomVariableReference;
  to: ObjectReference;
}

export interface PlayerSetCoopSpawningParameters {
  enabled: boolean;
  player: PlayerReference;
}

export interface ObjectSetOrientationParameters {
  absoluteOrientation?: boolean;
  object: ObjectReference;
  source: ObjectReference;
}

export interface ObjectFaceObjectParameters {
  object: ObjectReference;
  offset?: ObjectOffset;
  target: ObjectReference;
}

export enum BipedGiveWeaponMode {
  Primary = 0,
  Secondary = 1,
  Force = 2,
}

export interface BipedGiveWeaponParameters {
  biped: ObjectReference;
  mode: BipedGiveWeaponMode;
  weapon: ObjectTypeReference;
}

export interface BipedDropWeaponParameters {
  biped: ObjectReference;
  deleteOnDrop: boolean;
  primary: boolean;
}

export interface GetRandomObjectParameters {
  filterIndex: number;
  ignoreObject: ObjectReference;
  objectOut: ObjectReference;
}

export interface BoundarySetPlayerColorParameters {
  object: ObjectReference;
  playerIndex: number;
}

export interface BeginParameters {
  actionCount: number;
  conditionCount: number;
  firstActionIndex: number;
  firstConditionIndex: number;
}

export interface HsFunctionCallParameters {
  functionNameIndex: number; // object_lists/stringids.txt
}

export enum ScriptableGameButtons {
  Jump = 0,
  Grenade = 1,
  SwitchWeapon = 2,
  ContextPrimary = 3,
  MeleeAttack = 4,
  Equipment = 5,
  ThrowGrenade = 6,
  FirePrimary = 7,
  Crouch = 8,
  ScopeZoom = 9,
  NightVision = 10,
  FireSecondary = 11,
  FireTertiary = 12,
  VehicleTrick = 13,
}

export interface GetButtonTimeParameters {
  button: ScriptableGameButtons;
  player: PlayerReference;
  timeOut: CustomVariableReference;
}

export interface TeamSetVehicleSpawningParameters {
  enabled: boolean;
  team: TeamReference;
}

export interface PlayerSetVehicleSpawningParameters {
  enabled: boolean;
  player: PlayerReference;
}

export interface SetPlayerRespawnVehicleParameters {
  objectType: ObjectTypeReference;
  player: PlayerReference;
}

export interface SetTeamRespawnVehicleParameters {
  objectType: ObjectTypeReference;
  team: TeamReference;
}

export interface HideObjectParameters {
  object: ObjectReference;
  shouldHide: boolean;
}

export interface PrintVariableParameters {
  string: DynamicString;
}

export interface GetPlayerHoldingObjectParameters {
  object: ObjectReference;
  playerOut: PlayerReference;
}

export type EndRoundParameters = never;

export interface BoundarySetVisibleParameters {
  object: ObjectReference;
  playerFilterModifier: PlayerFilterModifier;
}

export interface ObjectSetInvincibilityParameters {
  invincible: CustomVariableReference;
  object: ObjectReference;
}

export interface RandomParameters {
  range: CustomVariableReference;
  valueOut: CustomVariableReference;
}

export interface ObjectGetOrientationParameters {
  object: ObjectReference;
  orientationOut: CustomVariableReference;
}

export interface ObjectGetVelocityParameters {
  object: ObjectReference;
  velocityOut: CustomVariableReference;
}

export interface PlayerDeathGetKillingPlayerParameters {
  deadPlayer: PlayerReference;
  killingPlayerOut: PlayerReference;
}

export interface PlayerDeathGetDamageTypeParameters {
  damageTypeOut: CustomVariableReference;
  deadPlayer: PlayerReference;
}

export interface PlayerDeathGetSpecialTypeParameters {
  deadPlayer: PlayerReference;
  specialTypeOut: CustomVariableReference;
}

export interface DebuggingEnableTracingParameters {
  tracingEnabled: boolean;
}

export interface ObjectDetachParameters {
  object: ObjectReference;
}

export interface PlayerGetPlaceParameters {
  placeOut: CustomVariableReference;
  player: PlayerReference;
}

export interface TeamGetPlaceParameters {
  placeOut: CustomVariableReference;
  team: TeamReference;
}

export interface PlayerGetKillingSpreeCountParameters {
  player: PlayerReference;
  spreeCountOut: CustomVariableReference;
}

export interface PlayerGetVehicleParameters {
  player: PlayerReference;
  vehicleOut: ObjectReference;
}

export interface PlayerSetVehicleParameters {
  player: PlayerReference;
  vehicle: ObjectReference;
}

export interface PlayerSetUnitParameters {
  player: PlayerReference;
  unit: ObjectReference;
}

export interface TimerResetParameters {
  timer: CustomTimerReference;
}

export interface ObjectBounceParameters {
  object: ObjectReference;
}

export interface HUDWidgetSetValueParameters {
  value: DynamicString;
  widgetIndex: number;
}

export interface ObjectSetScaleParameters {
  object: ObjectReference;
  scale: CustomVariableReference;
}

export interface NavpointSetTextParameters {
  object: ObjectReference;
  string: DynamicString;
}

export interface ObjectGetShieldParameters {
  object: ObjectReference;
  variable: CustomVariableReference;
}

export interface ObjectGetHealthParameters {
  object: ObjectReference;
  variable: CustomVariableReference;
}

export interface PlayerSetObjectiveParameters {
  objective: DynamicString;
  player: PlayerReference;
}

export interface PlayerSetObjectiveAllegianceParameters {
  allegiance: DynamicString;
  player: PlayerReference;
}

export interface PlayerSetObjectiveAllegianceIconParameters {
  iconIndex: number; // object_lists/hud_widget_icons.txt
  player: PlayerReference;
}

export interface TeamSetCoopSpawningParameters {
  coopSpawningEnabled: boolean;
  team: TeamReference;
}

export interface TeamSetPrimaryRespawnObjectParameters {
  respawnObject: ObjectReference;
  team: TeamReference;
}

export interface PlayerSetPrimaryRespawnObjectParameters {
  player: PlayerReference;
  respawnObject: ObjectReference;
}

export interface PlayerGetFireteamIndexParameters {
  fireteamIndexOut: CustomVariableReference;
  player: PlayerReference;
}

export interface PlayerSetFireteamIndexParameters {
  fireteamIndex: CustomVariableReference;
  player: PlayerReference;
}

export interface ObjectAdjustShieldParameters {
  amount: CustomVariableReference;
  object: ObjectReference;
  operation: MathOperation;
}

export interface ObjectAdjustHealthParameters {
  amount: CustomVariableReference;
  object: ObjectReference;
  operation: MathOperation;
}

export interface ObjectAdjustMaximumShieldParameters {
  amount: CustomVariableReference;
  object: ObjectReference;
  operation: MathOperation;
}

export interface ObjectAdjustMaximumHealthParameters {
  amount: CustomVariableReference;
  object: ObjectReference;
  operation: MathOperation;
}

export interface ObjectGetDistanceParameters {
  distanceOut: CustomVariableReference;
  from: ObjectReference;
  to: ObjectReference;
}

export interface DeviceSetPowerParameters {
  object: ObjectReference;
  power: CustomVariableReference;
}

export interface DeviceGetPowerParameters {
  object: ObjectReference;
  powerOut: CustomVariableReference;
}

export interface DeviceSetPositionParameters {
  object: ObjectReference;
  position: CustomVariableReference;
}

export interface DeviceGetPositionParameters {
  object: ObjectReference;
  positionOut: CustomVariableReference;
}

export interface DeviceSetPositionTrackParameters {
  animationNameIndex: number; // object_lists/stringids.txt ?
  interpolationTime: CustomVariableReference;
  object: ObjectReference;
}

export interface DeviceAnimatePositionParameters {
  accelerationSeconds: CustomVariableReference;
  animationDurationSeconds: CustomVariableReference;
  animationTargetFraction: CustomVariableReference;
  decelerationSeconds: CustomVariableReference;
  object: ObjectReference;
}

export interface DeviceSetPositionImmediateParameters {
  object: ObjectReference;
  position: CustomVariableReference;
}

export interface SavedFilmInsertMarkerParameters {
  label: DynamicString;
  offsetSeconds: CustomVariableReference;
}

export interface RespawnZoneEnableParameters {
  enabled: CustomVariableReference;
  respawnZone: ObjectReference;
}

export interface PlayerGetEquipmentParameters {
  equipmentOut: ObjectReference;
  player: PlayerReference;
}

export interface ObjectSetNeverGarbageParameters {
  neverGarbage: CustomVariableReference;
  object: ObjectReference;
}

export interface PlayerGetTargetObjectParameters {
  objectOut: ObjectReference;
  player: PlayerReference;
}

export interface DebugForcePlayerViewCountParameters {
  viewCount: CustomVariableReference;
}

export interface PlayerPickUpWeaponParameters {
  player: PlayerReference;
  weapon: ObjectReference;
}

export interface SetScenarioInterpolatorStateParameters {
  active: CustomVariableReference;
  interpolatorIndex: CustomVariableReference;
}

export interface GameGriefRecordCustomPenaltyParameters {
  player: PlayerReference;
  variable: CustomVariableReference;
}

export interface SetPickupFilterParameters {
  object: ObjectReference;
  playerFilterModifier: PlayerFilterModifier;
}

export interface SetRespawnFilterParameters {
  object: ObjectReference;
  playerFilterModifier: PlayerFilterModifier;
}

export type BreakIntoDebuggerParameters = never;

export type Action =
  | ActionParameters<ActionType.SetScore, SetScoreParameters>
  | ActionParameters<ActionType.CreateObject, CreateObjectParameters>
  | ActionParameters<ActionType.DeleteObject, DeleteObjectParameters>
  | ActionParameters<
      ActionType.NavpointSetVisible,
      NavpointSetVisibleParameters
    >
  | ActionParameters<ActionType.NavpointSetIcon, NavpointSetIconParameters>
  | ActionParameters<
      ActionType.NavpointSetPriority,
      NavpointSetPriorityParameters
    >
  | ActionParameters<ActionType.NavpointSetTimer, NavpointSetTimerParameters>
  | ActionParameters<
      ActionType.NavpointSetVisibleRange,
      NavpointSetVisibleRangeParameters
    >
  | ActionParameters<ActionType.Set, SetParameters>
  | ActionParameters<ActionType.SetBoundary, SetBoundaryParameters>
  | ActionParameters<ActionType.ApplyPlayerTraits, ApplyPlayerTraitsParameters>
  | ActionParameters<ActionType.SetPickupFilter, SetPickupFilterParameters>
  | ActionParameters<ActionType.SetRespawnFilter, SetRespawnFilterParameters>
  | ActionParameters<
      ActionType.SetFireteamRespawnFilter,
      SetFireteamRespawnFilterParameters
    >
  | ActionParameters<ActionType.SetProgressBar, SetProgressBarParameters>
  | ActionParameters<ActionType.HudPostMessage, HudPostMessageParameters>
  | ActionParameters<ActionType.TimerSetRate, TimerSetRateParameters>
  | ActionParameters<ActionType.PrintVariable, PrintVariableParameters>
  | ActionParameters<
      ActionType.GetPlayerHoldingObject,
      GetPlayerHoldingObjectParameters
    >
  | ActionParameters<ActionType.ForEach, ForEachParameters>
  | ActionParameters<ActionType.EndRound, EndRoundParameters>
  | ActionParameters<
      ActionType.BoundarySetVisible,
      BoundarySetVisibleParameters
    >
  | ActionParameters<ActionType.ObjectDestroy, ObjectDestroyParameters>
  | ActionParameters<
      ActionType.ObjectSetInvincibility,
      ObjectSetInvincibilityParameters
    >
  | ActionParameters<ActionType.Random, RandomParameters>
  | ActionParameters<ActionType.BreakIntoDebugger, BreakIntoDebuggerParameters>
  | ActionParameters<
      ActionType.ObjectGetOrientation,
      ObjectGetOrientationParameters
    >
  | ActionParameters<ActionType.ObjectGetVelocity, ObjectGetVelocityParameters>
  | ActionParameters<
      ActionType.PlayerDeathGetKillingPlayer,
      PlayerDeathGetKillingPlayerParameters
    >
  | ActionParameters<
      ActionType.PlayerDeathGetDamageType,
      PlayerDeathGetDamageTypeParameters
    >
  | ActionParameters<
      ActionType.PlayerDeathGetSpecialType,
      PlayerDeathGetSpecialTypeParameters
    >
  | ActionParameters<
      ActionType.DebuggingEnableTracing,
      DebuggingEnableTracingParameters
    >
  | ActionParameters<ActionType.ObjectAttach, ObjectAttachParameters>
  | ActionParameters<ActionType.ObjectDetach, ObjectDetachParameters>
  | ActionParameters<ActionType.PlayerGetPlace, PlayerGetPlaceParameters>
  | ActionParameters<ActionType.TeamGetPlace, TeamGetPlaceParameters>
  | ActionParameters<
      ActionType.PlayerGetKillingSpreeCount,
      PlayerGetKillingSpreeCountParameters
    >
  | ActionParameters<ActionType.PlayerAdjustMoney, PlayerAdjustMoneyParameters>
  | ActionParameters<
      ActionType.PlayerEnablePurchases,
      PlayerEnablePurchasesParameters
    >
  | ActionParameters<ActionType.PlayerGetVehicle, PlayerGetVehicleParameters>
  | ActionParameters<ActionType.PlayerSetVehicle, PlayerSetVehicleParameters>
  | ActionParameters<ActionType.PlayerSetUnit, PlayerSetUnitParameters>
  | ActionParameters<ActionType.TimerReset, TimerResetParameters>
  | ActionParameters<
      ActionType.WeaponSetPickupPriority,
      WeaponSetPickupPriorityParameters
    >
  | ActionParameters<ActionType.ObjectBounce, ObjectBounceParameters>
  | ActionParameters<ActionType.HudWidgetSetText, HUDWidgetSetTextParameters>
  | ActionParameters<ActionType.HudWidgetSetValue, HUDWidgetSetValueParameters>
  | ActionParameters<ActionType.HudWidgetSetMeter, HUDWidgetSetMeterParameters>
  | ActionParameters<ActionType.HudWidgetSetIcon, HUDWidgetSetIconParameters>
  | ActionParameters<
      ActionType.HudWidgetSetVisibility,
      HUDWidgetSetVisibilityParameters
    >
  | ActionParameters<ActionType.PlaySound, PlaySoundParameters>
  | ActionParameters<ActionType.ObjectSetScale, ObjectSetScaleParameters>
  | ActionParameters<ActionType.NavpointSetText, NavpointSetTextParameters>
  | ActionParameters<ActionType.ObjectGetShield, ObjectGetShieldParameters>
  | ActionParameters<ActionType.ObjectGetHealth, ObjectGetHealthParameters>
  | ActionParameters<
      ActionType.PlayerSetObjective,
      PlayerSetObjectiveParameters
    >
  | ActionParameters<
      ActionType.PlayerSetObjectiveAllegiance,
      PlayerSetObjectiveAllegianceParameters
    >
  | ActionParameters<
      ActionType.PlayerSetObjectiveAllegianceIcon,
      PlayerSetObjectiveAllegianceIconParameters
    >
  | ActionParameters<
      ActionType.TeamSetCoopSpawning,
      TeamSetCoopSpawningParameters
    >
  | ActionParameters<
      ActionType.TeamSetPrimaryRespawnObject,
      TeamSetPrimaryRespawnObjectParameters
    >
  | ActionParameters<
      ActionType.PlayerSetPrimaryRespawnObject,
      PlayerSetPrimaryRespawnObjectParameters
    >
  | ActionParameters<
      ActionType.PlayerGetFireteamIndex,
      PlayerGetFireteamIndexParameters
    >
  | ActionParameters<
      ActionType.PlayerSetFireteamIndex,
      PlayerSetFireteamIndexParameters
    >
  | ActionParameters<
      ActionType.ObjectAdjustShield,
      ObjectAdjustShieldParameters
    >
  | ActionParameters<
      ActionType.ObjectAdjustHealth,
      ObjectAdjustHealthParameters
    >
  | ActionParameters<ActionType.ObjectGetDistance, ObjectGetDistanceParameters>
  | ActionParameters<
      ActionType.ObjectAdjustMaximumShield,
      ObjectAdjustMaximumShieldParameters
    >
  | ActionParameters<
      ActionType.ObjectAdjustMaximumHealth,
      ObjectAdjustMaximumHealthParameters
    >
  | ActionParameters<
      ActionType.PlayerSetRequisitionPalette,
      PlayerSetRequisitionPaletteParameters
    >
  | ActionParameters<ActionType.DeviceSetPower, DeviceSetPowerParameters>
  | ActionParameters<ActionType.DeviceGetPower, DeviceGetPowerParameters>
  | ActionParameters<ActionType.DeviceSetPosition, DeviceSetPositionParameters>
  | ActionParameters<ActionType.DeviceGetPosition, DeviceGetPositionParameters>
  | ActionParameters<ActionType.AdjustGrenades, AdjustGrenadesParameters>
  | ActionParameters<ActionType.SubmitIncident, SubmitIncidentParameters>
  | ActionParameters<
      ActionType.SubmitIncidentWithCustomValue,
      SubmitIncidentWithCustomValueParameters
    >
  | ActionParameters<ActionType.SetLoadoutPalette, SetLoadoutPaletteParameters>
  | ActionParameters<
      ActionType.DeviceSetPositionTrack,
      DeviceSetPositionTrackParameters
    >
  | ActionParameters<
      ActionType.DeviceAnimatePosition,
      DeviceAnimatePositionParameters
    >
  | ActionParameters<
      ActionType.DeviceSetPositionImmediate,
      DeviceSetPositionImmediateParameters
    >
  | ActionParameters<
      ActionType.SavedFilmInsertMarker,
      SavedFilmInsertMarkerParameters
    >
  | ActionParameters<ActionType.RespawnZoneEnable, RespawnZoneEnableParameters>
  | ActionParameters<ActionType.PlayerGetWeapon, PlayerGetWeaponParameters>
  | ActionParameters<
      ActionType.PlayerGetEquipment,
      PlayerGetEquipmentParameters
    >
  | ActionParameters<
      ActionType.ObjectSetNeverGarbage,
      ObjectSetNeverGarbageParameters
    >
  | ActionParameters<
      ActionType.PlayerGetTargetObject,
      PlayerGetTargetObjectParameters
    >
  | ActionParameters<ActionType.CreateTunnel, CreateTunnelParameters>
  | ActionParameters<
      ActionType.DebugForcePlayerViewCount,
      DebugForcePlayerViewCountParameters
    >
  | ActionParameters<
      ActionType.PlayerPickUpWeapon,
      PlayerPickUpWeaponParameters
    >
  | ActionParameters<
      ActionType.PlayerSetCoopSpawning,
      PlayerSetCoopSpawningParameters
    >
  | ActionParameters<
      ActionType.ObjectSetOrientation,
      ObjectSetOrientationParameters
    >
  | ActionParameters<ActionType.ObjectFaceObject, ObjectFaceObjectParameters>
  | ActionParameters<ActionType.BipedGiveWeapon, BipedGiveWeaponParameters>
  | ActionParameters<ActionType.BipedDropWeapon, BipedDropWeaponParameters>
  | ActionParameters<
      ActionType.SetScenarioInterpolatorState,
      SetScenarioInterpolatorStateParameters
    >
  | ActionParameters<ActionType.GetRandomObject, GetRandomObjectParameters>
  | ActionParameters<
      ActionType.GameGriefRecordCustomPenalty,
      GameGriefRecordCustomPenaltyParameters
    >
  | ActionParameters<
      ActionType.BoundarySetPlayerColor,
      BoundarySetPlayerColorParameters
    >
  | ActionParameters<ActionType.Begin, BeginParameters>
  | ActionParameters<ActionType.HsFunctionCall, HsFunctionCallParameters>
  | ActionParameters<ActionType.GetButtonTime, GetButtonTimeParameters>
  | ActionParameters<
      ActionType.TeamSetVehicleSpawning,
      TeamSetVehicleSpawningParameters
    >
  | ActionParameters<
      ActionType.PlayerSetVehicleSpawning,
      PlayerSetVehicleSpawningParameters
    >
  | ActionParameters<
      ActionType.SetPlayerRespawnVehicle,
      SetPlayerRespawnVehicleParameters
    >
  | ActionParameters<
      ActionType.SetTeamRespawnVehicle,
      SetTeamRespawnVehicleParameters
    >
  | ActionParameters<ActionType.HideObject, HideObjectParameters>;
