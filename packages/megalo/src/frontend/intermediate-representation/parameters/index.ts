export {
  lowerBooleanParam,
  lowerConstantInteger,
  lowerFloatParam,
  tryLowerConstantInteger,
} from "src/frontend/intermediate-representation/parameters/common";
export { lowerConstantNumber } from "src/frontend/intermediate-representation/parameters/constantNumber";
export type {
  ElementLowerContext,
  ParameterLoweringContext,
} from "src/frontend/intermediate-representation/parameters/context";
export { asParameterLoweringContext } from "src/frontend/intermediate-representation/parameters/context";
export {
  isTemporaryCompiledName,
  parseExplicitObject,
  parseExplicitPlayer,
  parseExplicitTeam,
  parseIndexSuffix,
  parseQualifiedTemporaryName,
  TEAM_DESIGNATOR_INDICES,
  tryParseExplicitObject,
  tryParseExplicitPlayer,
  tryParseExplicitTeam,
} from "src/frontend/intermediate-representation/parameters/explicit";
export { GAME_OPTION_CUSTOM_VARIABLE_TYPE } from "src/frontend/intermediate-representation/parameters/gameOptionTypes";
export {
  CustomVariableKind,
  encodeNoObjectReference,
  resolveCustomTimerReference,
  resolveCustomVariableReference,
  resolveObjectReference,
  resolveObjectTypeReference,
  resolvePlayerReference,
  resolveTeamReference,
  resolveVariantVariable,
} from "src/frontend/intermediate-representation/parameters/references";
export {
  resolveScriptStringTableReference,
  resolveStringTableEntry,
} from "src/frontend/intermediate-representation/parameters/resolveScriptStringTableReference";
