import { SyntaxKind } from "../../abstract-syntax-tree";
import type {
  TeamNode,
  TeamsElementNode,
  TeamsPropertyNode,
} from "../../abstract-syntax-tree/elements/teams";
import type { SourceCodeLocation } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { isTeamDesignator } from "../../language-configuration/omni/teams";
import { SymbolKind } from "../../symbol-table";
import { dxAssertionScope } from "../diagnostics";
import { assertSyntaxKind } from "../diagnostics/assertSyntaxKind";
import { LowerError } from "../error";
import {
  DesignatorSwitchType,
  type GameEngineTeamOptionsTeam,
  MultiplayerTeamDesignator,
  PlayerModelChoice,
  TeamOptionsModelOverrideType,
} from "../game/game_engine_default";
import type { StringTableEntry } from "../game/string_table";
import type { ElementLowerContext } from "../parameters";
import { lowerConstantNumber } from "../parameters/constantNumber";
import { TEAM_DESIGNATOR_INDICES } from "../parameters/explicit";
import { setField } from "../setField";
import type { ElementLowerer } from ".";

const BLOCK_MODEL_OVERRIDE: Record<string, TeamOptionsModelOverrideType> = {
  spartan: TeamOptionsModelOverrideType.Spartan,
  elite: TeamOptionsModelOverrideType.Elite,
  by_designator: TeamOptionsModelOverrideType.ByDesignator,
};

const BLOCK_MODEL_OVERRIDE_NAMES = Object.keys(BLOCK_MODEL_OVERRIDE);

const TEAM_MODEL_CHOICE: Record<string, PlayerModelChoice> = {
  spartan: PlayerModelChoice.Spartan,
  elite: PlayerModelChoice.Elite,
};

const TEAM_MODEL_CHOICE_NAMES = Object.keys(TEAM_MODEL_CHOICE);

const DESIGNATOR_SWITCH_TYPE: Record<string, DesignatorSwitchType> = {
  none: DesignatorSwitchType.None,
  random: DesignatorSwitchType.Random,
  rotate: DesignatorSwitchType.Rotate,
};

const DESIGNATOR_SWITCH_TYPE_NAMES = Object.keys(DESIGNATOR_SWITCH_TYPE);

const MAX_FIRETEAM_COUNT = 16;

const requireKeyword = (
  property: TeamsPropertyNode,
  fallbackLocation: SourceCodeLocation
): string => {
  const parameter = property.parameters[0];
  if (parameter === undefined || property.parameters.length !== 1) {
    throw new LowerError(
      diagnosticMessages.invalidParameterCount(1, property.parameters.length),
      parameter?.location ?? fallbackLocation
    );
  }
  assertSyntaxKind(parameter, SyntaxKind.KEYWORD);
  return parameter.value;
};

const lowerStringName = (
  property: TeamsPropertyNode,
  ctx: ElementLowerContext,
  fallbackLocation: SourceCodeLocation
): StringTableEntry => {
  const keyword = requireKeyword(property, fallbackLocation);
  const parameter = property.parameters[0]!;
  const symbol = ctx.symbolTable
    .toArray()
    .find(
      (entry) => entry.kind === SymbolKind.String && entry.name === keyword
    );
  if (symbol?.kind !== SymbolKind.String) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("string", keyword),
      parameter.location
    );
  }
  return { ...symbol.languageContents };
};

const lowerTeam = (
  teamNode: TeamNode,
  ctx: ElementLowerContext
): GameEngineTeamOptionsTeam => {
  const team: GameEngineTeamOptionsTeam = {};

  for (const property of teamNode.properties) {
    switch (property.identifier) {
      case "name": {
        const name = lowerStringName(property, ctx, teamNode.location);
        setField(
          ctx.ir.locations,
          ctx.diagnostics,
          team,
          "name",
          name,
          property.parameters[0]!.location
        );
        break;
      }
      case "designator": {
        const keyword = requireKeyword(property, teamNode.location);
        if (!isTeamDesignator(keyword)) {
          throw new LowerError(
            diagnosticMessages.expectedParameterType(
              "team_designator",
              keyword
            ),
            property.parameters[0]!.location
          );
        }
        setField(
          ctx.ir.locations,
          ctx.diagnostics,
          team,
          "designator",
          TEAM_DESIGNATOR_INDICES[keyword] as MultiplayerTeamDesignator,
          property.parameters[0]!.location
        );
        break;
      }
      case "model": {
        const keyword = requireKeyword(property, teamNode.location);
        const model = TEAM_MODEL_CHOICE[keyword];
        if (model === undefined) {
          throw new LowerError(
            diagnosticMessages.expectedOneOf(
              TEAM_MODEL_CHOICE_NAMES.map((name) => `'${name}'`),
              keyword
            ),
            property.parameters[0]!.location
          );
        }
        setField(
          ctx.ir.locations,
          ctx.diagnostics,
          team,
          "model",
          model,
          property.parameters[0]!.location
        );
        break;
      }
      case "color": {
        if (property.parameters.length !== 3) {
          throw new LowerError(
            diagnosticMessages.invalidParameterCount(
              3,
              property.parameters.length
            ),
            property.parameters[0]?.location ?? teamNode.location
          );
        }
        const [rNode, gNode, bNode] = property.parameters;
        const numericKinds = [
          SyntaxKind.INTEGER,
          SyntaxKind.FLOATING_POINT,
          SyntaxKind.REFERENCE,
        ] as const;
        assertSyntaxKind(rNode!, numericKinds);
        assertSyntaxKind(gNode!, numericKinds);
        assertSyntaxKind(bNode!, numericKinds);
        const r = lowerConstantNumber(rNode, ctx);
        const g = lowerConstantNumber(gNode, ctx);
        const b = lowerConstantNumber(bNode, ctx);
        setField(
          ctx.ir.locations,
          ctx.diagnostics,
          team,
          "teamColor",
          { r: r.value, g: g.value, b: b.value },
          r.location
        );
        break;
      }
      case "fireteam_count": {
        if (property.parameters.length !== 1) {
          throw new LowerError(
            diagnosticMessages.invalidParameterCount(
              1,
              property.parameters.length
            ),
            property.parameters[0]?.location ?? teamNode.location
          );
        }
        const parameter = property.parameters[0]!;
        assertSyntaxKind(parameter, [
          SyntaxKind.INTEGER,
          SyntaxKind.FLOATING_POINT,
          SyntaxKind.REFERENCE,
        ]);
        const count = lowerConstantNumber(parameter, ctx);
        if (count.value < 0 || count.value > MAX_FIRETEAM_COUNT) {
          throw new LowerError(
            diagnosticMessages.fireteamCountOutOfRange(
              count.value,
              MAX_FIRETEAM_COUNT
            ),
            count.location
          );
        }
        setField(
          ctx.ir.locations,
          ctx.diagnostics,
          team,
          "fireteamCount",
          count.value,
          count.location
        );
        break;
      }
      default:
        break;
    }
  }

  return team;
};

export const teamsLowerer: ElementLowerer<TeamsElementNode> = (element, ctx) => {
  const teamOptions = ctx.ir.gameVariant.baseVariant.teamOptions;

  for (const property of element.properties) {
    dxAssertionScope(ctx.diagnostics, () => {
      switch (property.identifier) {
        case "model": {
          const keyword = requireKeyword(property, element.location);
          const model = BLOCK_MODEL_OVERRIDE[keyword];
          if (model === undefined) {
            throw new LowerError(
              diagnosticMessages.expectedOneOf(
                BLOCK_MODEL_OVERRIDE_NAMES.map((name) => `'${name}'`),
                keyword
              ),
              property.parameters[0]!.location
            );
          }
          setField(
            ctx.ir.locations,
            ctx.diagnostics,
            teamOptions,
            "model",
            model,
            property.parameters[0]!.location
          );
          break;
        }
        case "designator_switch_type": {
          const keyword = requireKeyword(property, element.location);
          const switchType = DESIGNATOR_SWITCH_TYPE[keyword];
          if (switchType === undefined) {
            throw new LowerError(
              diagnosticMessages.expectedOneOf(
                DESIGNATOR_SWITCH_TYPE_NAMES.map((name) => `'${name}'`),
                keyword
              ),
              property.parameters[0]!.location
            );
          }
          setField(
            ctx.ir.locations,
            ctx.diagnostics,
            teamOptions,
            "designatorSwitchType",
            switchType,
            property.parameters[0]!.location
          );
          break;
        }
        default:
          break;
      }
    });
  }

  for (const teamNode of element.teams) {
    dxAssertionScope(ctx.diagnostics, () => {
      const team = lowerTeam(teamNode, ctx);
      if (teamOptions.teams === undefined) {
        teamOptions.teams = [];
      }
      teamOptions.teams.push(team);
    });
  }
};
