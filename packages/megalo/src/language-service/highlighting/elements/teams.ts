import type { TeamsElementNode } from "src/frontend/abstract-syntax-tree/elements/teams";
import {
  designatorSwitchType,
  multiplayerTeamDesignator,
  playerModelChoice,
  teamOptionsModelOverrideType,
} from "src/frontend/intermediate-representation/game/game_engine_default";
import {
  emitElementKeyword,
  emitLocation,
} from "src/language-service/highlighting/emit";
import {
  type EnumKeywordAllowed,
  highlightClosedValueParameters,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

const allowedForBlockProperty = (key: string): EnumKeywordAllowed => {
  switch (key) {
    case "model":
      return teamOptionsModelOverrideType;
    case "designator_switch_type":
      return designatorSwitchType;
    default:
      return [];
  }
};

const allowedForTeamProperty = (key: string): EnumKeywordAllowed => {
  switch (key) {
    case "model":
      return playerModelChoice;
    case "designator":
      return multiplayerTeamDesignator;
    default:
      return [];
  }
};

export const highlightTeams = (
  out: SemanticToken[],
  element: TeamsElementNode
): void => {
  emitElementKeyword(out, element.keywordLocation);
  for (const property of element.properties) {
    emitLocation(out, property.location, "parameter");
    highlightClosedValueParameters(
      out,
      property.parameters,
      allowedForBlockProperty(property.identifier)
    );
  }
  for (const team of element.teams) {
    emitLocation(out, team.keywordLocation, "keyword");
    for (const property of team.properties) {
      emitLocation(out, property.location, "parameter");
      highlightClosedValueParameters(
        out,
        property.parameters,
        allowedForTeamProperty(property.identifier)
      );
    }
  }
};
