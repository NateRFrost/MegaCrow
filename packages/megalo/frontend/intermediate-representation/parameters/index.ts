export type {
  ElementLowerContext,
  ParameterLoweringContext,
} from "./context";
export { asParameterLoweringContext } from "./context";
export {
  lowerNumberParam,
  lowerBooleanParam,
} from "./common";
export { lowerConstantNumber } from "./constantNumber";
export {
  parseExplicitObject,
  parseExplicitPlayer,
  parseExplicitTeam,
  tryParseExplicitObject,
  tryParseExplicitPlayer,
  tryParseExplicitTeam,
  TEAM_DESIGNATOR_INDICES,
  isTemporaryCompiledName,
  parseQualifiedTemporaryName,
  parseIndexSuffix,
} from "./explicit";
export { GAME_OPTION_CUSTOM_VARIABLE_TYPE } from "./gameOptionTypes";
export {
  buildParameterLowerer,
  CustomVariableKind,
  numberParam,
  floatParam,
  stringParam,
  customVariableParam,
  customTimerParam,
  objectParam,
  objectTypeParam,
  playerParam,
  teamParam,
  variantVariableParam,
  keywordParam,
  OptionalParam,
  LoweringSpecKind,
  type LoweringSpec,
  type LoweringSlot,
  type LoweringSignature,
  type LoweredParameter,
  type LoweredResult,
  type ParameterLowerer,
  type OptionalLoweringSlot,
} from "./lowering";
export {
  resolvePlayerReference,
  resolveTeamReference,
  resolveObjectReference,
  resolveObjectTypeReference,
  resolveCustomTimerReference,
  resolveCustomVariableReference,
  resolveVariantVariable,
  encodeNoObjectReference,
} from "./references";
export {
  resolveScriptStringTableReference,
  resolveStringTableEntry,
} from "./resolveScriptStringTableReference";
