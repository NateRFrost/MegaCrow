import { SyntaxKind } from "../../abstract-syntax-tree";
import type { LoadoutElementNode } from "../../abstract-syntax-tree/elements/loadout";
import type { ASTParameterNode } from "../../abstract-syntax-tree/parameters";
import { diagnosticMessages } from "../../diagnostics/messages";
import { ObjectListType } from "../../object-lists";
import { SymbolKind } from "../../symbol-table";
import { valueWithLocation } from "..";
import { dxAssertionScope } from "../diagnostics";
import { assertNotErrorNode } from "../diagnostics/assertNotErrorNode";
import { assertSyntaxKind } from "../diagnostics/assertSyntaxKind";
import { markCurrentValueUnused } from "../diagnostics/markCurrentValueUnused";
import { LowerError } from "../error";
import type { LoadoutTraits } from "../game/game_engine_default";
import type { ElementLowerContext } from "../parameters";
import { lowerGrenadeCount } from "../parameters/grenadeCount";

const lowerObjectListKeyword = (
  node: ASTParameterNode,
  objectType: ObjectListType,
  ctx: ElementLowerContext
) => {
  assertSyntaxKind(node, SyntaxKind.KEYWORD);
  const symbol = ctx.symbolTable
    .toArray()
    .find(
      (entry) =>
        entry.kind === SymbolKind.ObjectListItem &&
        entry.objectType === objectType &&
        entry.name === node.value
    );
  if (symbol?.kind !== SymbolKind.ObjectListItem) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(objectType, node.value),
      node.location
    );
  }
  return valueWithLocation(symbol.index, node.location);
};

export const loadoutLowerer = (
  element: LoadoutElementNode,
  ctx: ElementLowerContext
) => {
  const { name } = element;
  const traits: LoadoutTraits = {};
  for (const item of element.items) {
    dxAssertionScope(ctx.diagnostics, () => {
      const parameter = item.parameters[0];
      if (parameter === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType(item.identifier, ""),
          element.location
        );
      }
      switch (item.identifier) {
        case "name":
          traits.name = lowerObjectListKeyword(
            parameter,
            ObjectListType.Loadouts,
            ctx
          ).value;
          break;
        case "primary_weapon": {
          const value = lowerObjectListKeyword(
            parameter,
            ObjectListType.Weapons,
            ctx
          );
          markCurrentValueUnused(
            traits.initialPrimaryWeaponAbsoluteIndex,
            ctx.diagnostics
          );
          traits.initialPrimaryWeaponAbsoluteIndex = value;
          break;
        }
        case "backpack_weapon": {
          const value = lowerObjectListKeyword(
            parameter,
            ObjectListType.Weapons,
            ctx
          );
          markCurrentValueUnused(
            traits.initialSecondaryWeaponAbsoluteIndex,
            ctx.diagnostics
          );
          traits.initialSecondaryWeaponAbsoluteIndex = value;
          break;
        }
        case "equipment": {
          const value = lowerObjectListKeyword(
            parameter,
            ObjectListType.Equipment,
            ctx
          );
          markCurrentValueUnused(
            traits.initialEquipmentAbsoluteIndex,
            ctx.diagnostics
          );
          traits.initialEquipmentAbsoluteIndex = value;
          break;
        }
        case "grenades":
          assertSyntaxKind(parameter, SyntaxKind.GRENADE_COUNT);
          markCurrentValueUnused(
            traits.initialGrenadeCountSetting,
            ctx.diagnostics
          );
          traits.initialGrenadeCountSetting = lowerGrenadeCount(parameter);
          break;
      }
    });
  }

  dxAssertionScope(ctx.diagnostics, () => {
    assertNotErrorNode(name);
    ctx.loadoutsByName.set(name.value, traits);
  });
};
