import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { MapObjectElementNode } from "src/frontend/abstract-syntax-tree/elements/map_object";
import { dxAssertionScope } from "src/frontend/intermediate-representation/diagnostics";
import { assertNotErrorNode } from "src/frontend/intermediate-representation/diagnostics/assertNotErrorNode";
import { assertSyntaxKind } from "src/frontend/intermediate-representation/diagnostics/assertSyntaxKind";
import type { ElementLowerer } from "src/frontend/intermediate-representation/elements";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type ObjectFilter,
  objectTeamFilter,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_map_objects";
import { asParameterLoweringContext } from "src/frontend/intermediate-representation/parameters/context";
import { resolveObjectTypeReference } from "src/frontend/intermediate-representation/parameters/references";
import { resolveScriptStringTableReference } from "src/frontend/intermediate-representation/parameters/resolveScriptStringTableReference";
import { setField } from "src/frontend/intermediate-representation/setField";

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
            property.value.location,
            "label"
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
            property.value.location,
            "type"
          );
          break;
        }
        case "team": {
          assertSyntaxKind(property.value, SyntaxKind.KEYWORD);
          const team = objectTeamFilter.parse(property.value.value);
          if (team === undefined) {
            throw new LowerError(
              diagnosticMessages.expectedOneOf(
                objectTeamFilter.names.map((name) => `'${name}'`),
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
            property.value.location,
            "team"
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
            property.value.location,
            "user_data"
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
            property.value.location,
            "min"
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
