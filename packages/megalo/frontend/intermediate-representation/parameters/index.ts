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
  CustomVariableKind,
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
