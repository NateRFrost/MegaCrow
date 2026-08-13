import { SyntaxKind } from "../../abstract-syntax-tree";
import type { MapObjectElementNode } from "../../abstract-syntax-tree/elements/map_object";
import { diagnosticMessages } from "../../../diagnostics/messages";
import type { ElementLowerer } from ".";
import { dxAssertionScope } from "../diagnostics";
import { assertNotErrorNode } from "../diagnostics/assertNotErrorNode";
import { assertSyntaxKind } from "../diagnostics/assertSyntaxKind";
import { LowerError } from "../error";
import {
  type ObjectFilter,
  ObjectTeamFilter,
} from "../game/megalogamengine/megalogamengine_map_objects";
import { asParameterLoweringContext } from "../parameters/context";
import { resolveObjectTypeReference } from "../parameters/references";
import { resolveScriptStringTableReference } from "../parameters/resolveScriptStringTableReference";
import { setField } from "../setField";

const OBJECT_TEAM_FILTERS: Record<string, ObjectTeamFilter> = {
  none: ObjectTeamFilter.None,
  defenders: ObjectTeamFilter.Team1,
  attackers: ObjectTeamFilter.Team2,
  third_party: ObjectTeamFilter.Team3,
  fourth_party: ObjectTeamFilter.Team4,
  fifth_party: ObjectTeamFilter.Team5,
  sixth_party: ObjectTeamFilter.Team6,
  seventh_party: ObjectTeamFilter.Team7,
  eighth_party: ObjectTeamFilter.Team8,
  neutral: ObjectTeamFilter.Neutral,
  each: ObjectTeamFilter.Each,
};

const OBJECT_TEAM_FILTER_NAMES = Object.keys(OBJECT_TEAM_FILTERS);

export const mapObjectLowerer: ElementLowerer<MapObjectElementNode> = (
  element,
  ctx
) => {
  dxAssertionScope(ctx.diagnostics, () => {
    assertNotErrorNode(element.filterName);

    const filter: ObjectFilter = {};
    const { objectFilters } = ctx.ir.gameVariant.gameEngine;
    const paramCtx = asParameterLoweringContext(ctx);

    for (const property of element.properties) {
      if (property.value.kind === SyntaxKind.INVALID) {
        continue;
      }

      switch (property.key) {
        case "label": {
          const label = resolveScriptStringTableReference(
            property.value,
            ctx.ir,
            ctx.symbolTable
          );
          setField(
            ctx.ir.locations,
            ctx.diagnostics,
            filter,
            "label",
            label,
            property.value.location
          );
          break;
        }
        case "type": {
          const objectType = resolveObjectTypeReference(
            property.value,
            paramCtx
          );
          setField(
            ctx.ir.locations,
            ctx.diagnostics,
            filter,
            "objectType",
            objectType,
            property.value.location
          );
          break;
        }
        case "team": {
          assertSyntaxKind(property.value, SyntaxKind.KEYWORD);
          const team = OBJECT_TEAM_FILTERS[property.value.value];
          if (team === undefined) {
            throw new LowerError(
              diagnosticMessages.expectedOneOf(
                OBJECT_TEAM_FILTER_NAMES.map((name) => `'${name}'`),
                property.value.value
              ),
              property.value.location
            );
          }
          setField(
            ctx.ir.locations,
            ctx.diagnostics,
            filter,
            "team",
            team,
            property.value.location
          );
          break;
        }
        case "user_data": {
          assertSyntaxKind(property.value, SyntaxKind.INTEGER);
          setField(
            ctx.ir.locations,
            ctx.diagnostics,
            filter,
            "userData",
            property.value.value,
            property.value.location
          );
          break;
        }
        case "min": {
          assertSyntaxKind(property.value, SyntaxKind.INTEGER);
          setField(
            ctx.ir.locations,
            ctx.diagnostics,
            filter,
            "min",
            property.value.value,
            property.value.location
          );
          break;
        }
        default:
          break;
      }
    }

    objectFilters.push(filter);
  });
};
