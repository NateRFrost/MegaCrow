import { SyntaxKind } from "../../abstract-syntax-tree";
import type { MapPermissionsElementNode } from "../../abstract-syntax-tree/elements/map_permissions";
import { diagnosticMessages } from "../../diagnostics/messages";
import type { ElementLowerer } from ".";
import { dxAssertionScope } from "../diagnostics";
import { assertSyntaxKind } from "../diagnostics/assertSyntaxKind";
import { LowerError } from "../error";
import { lowerConstantNumber } from "../parameters/constantNumber";
import { setField } from "../setField";
import { markCurrentValueUnused } from "../diagnostics/markCurrentValueUnused";

const MAP_PERMISSION_KEYS = ["default", "exception"] as const;

export const mapPermissionsLowerer: ElementLowerer<
  MapPermissionsElementNode
> = (element, ctx) => {
  // Each map_permissions block replaces the previous one.
  markCurrentValueUnused(ctx.ir.locations.get(ctx.ir.gameVariant, "mapPermissions"), ctx.diagnostics);
  const permissions = {
    exceptMapIds: [] as number[],
    allowByDefault: true,
  };
  ctx.ir.gameVariant.mapPermissions = permissions;

  for (const entry of element.entries) {
    dxAssertionScope(ctx.diagnostics, () => {
      if (entry.value.kind === SyntaxKind.INVALID) {
        return;
      }

      switch (entry.key) {
        case "default": {
          if (entry.value.kind === SyntaxKind.KEYWORD) {
            if (
              entry.value.value !== "true" &&
              entry.value.value !== "false"
            ) {
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
              entry.value.location
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
            value.location
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
