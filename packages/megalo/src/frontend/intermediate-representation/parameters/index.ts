export type {
  ElementLowerContext,
  ParameterLoweringContext,
} from "src/frontend/intermediate-representation/parameters/context";
export { asParameterLoweringContext } from "src/frontend/intermediate-representation/parameters/context";
export {
  lowerFloatParam,
  lowerBooleanParam,
  lowerConstantInteger,
  tryLowerConstantInteger,
} from "src/frontend/intermediate-representation/parameters/common";
export { lowerConstantNumber } from "src/frontend/intermediate-representation/parameters/constantNumber";
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
} from "src/frontend/intermediate-representation/parameters/explicit";
export { GAME_OPTION_CUSTOM_VARIABLE_TYPE } from "src/frontend/intermediate-representation/parameters/gameOptionTypes";
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
} from "src/frontend/intermediate-representation/parameters/references";
export {
  resolveScriptStringTableReference,
  resolveStringTableEntry,
} from "src/frontend/intermediate-representation/parameters/resolveScriptStringTableReference";
