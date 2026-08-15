import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { MapPermissionsElementNode } from "src/frontend/abstract-syntax-tree/elements/map_permissions";
import { dxAssertionScope } from "src/frontend/intermediate-representation/diagnostics";
import { assertSyntaxKind } from "src/frontend/intermediate-representation/diagnostics/assertSyntaxKind";
import { markCurrentValueUnused } from "src/frontend/intermediate-representation/diagnostics/markCurrentValueUnused";
import type { ElementLowerer } from "src/frontend/intermediate-representation/elements";
import { LowerError } from "src/frontend/intermediate-representation/error";
import { lowerConstantNumber } from "src/frontend/intermediate-representation/parameters/constantNumber";
import { setField } from "src/frontend/intermediate-representation/setField";

const MAP_PERMISSION_KEYS = ["default", "exception"] as const;

export const mapPermissionsLowerer: ElementLowerer<
  MapPermissionsElementNode
> = (element, ctx) => {
  // Each map_permissions block replaces the previous one.
  markCurrentValueUnused(
    ctx.ir.locations.get(ctx.ir.gameVariant, "mapPermissions"),
    ctx.diagnostics,
    element.location,
    "map_permissions"
  );
  const permissions = {
    exceptMapIds: [] as number[],
    allowByDefault: true,
  };
  ctx.ir.gameVariant.mapPermissions = permissions;
  ctx.ir.locations.record(
    ctx.ir.gameVariant,
    "mapPermissions",
    element.location
  );

  for (const entry of element.entries) {
    dxAssertionScope(ctx.diagnostics, () => {
      if (entry.value.kind === SyntaxKind.INVALID) {
        return;
      }

      switch (entry.key) {
        case "default": {
          if (entry.value.kind === SyntaxKind.KEYWORD) {
            if (entry.value.value !== "true" && entry.value.value !== "false") {
              throw new LowerError(
                diagnosticMessages.expectedOneOf(
                  ["'true'", "'false'"],
                  entry.value.value
                ),
                entry.value.location
              );
            }
            setField(
              ctx.ir.locations,
              ctx.diagnostics,
              permissions,
              "allowByDefault",
              entry.value.value === "true",
              entry.value.location,
              "default"
            );
            return;
          }

          assertSyntaxKind(entry.value, [
            SyntaxKind.INTEGER,
            SyntaxKind.REFERENCE,
          ]);
          const value = lowerConstantNumber(entry.value, ctx);
          setField(
            ctx.ir.locations,
            ctx.diagnostics,
            permissions,
            "allowByDefault",
            value.value !== 0,
            value.location,
            "default"
          );
          return;
        }
        case "exception": {
          assertSyntaxKind(entry.value, [
            SyntaxKind.INTEGER,
            SyntaxKind.REFERENCE,
          ]);
          const value = lowerConstantNumber(entry.value, ctx);
          permissions.exceptMapIds.push(value.value);
          return;
        }
        default:
          throw new LowerError(
            diagnosticMessages.expectedOneOf(
              MAP_PERMISSION_KEYS.map((name) => `'${name}'`),
              entry.key
            ),
            entry.value.location
          );
      }
    });
  }
};
