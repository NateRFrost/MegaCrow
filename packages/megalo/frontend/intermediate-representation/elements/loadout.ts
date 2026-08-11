import { SyntaxKind } from "../../abstract-syntax-tree";
import type { LoadoutElementNode } from "../../abstract-syntax-tree/elements/loadout";
import type { ASTParameterNode } from "../../abstract-syntax-tree/parameters";
import { diagnosticMessages } from "../../diagnostics/messages";
import { ObjectListType } from "../../object-lists";
import { SymbolKind } from "../../symbol-table";
import { type Located, located } from "..";
import { dxAssertionScope } from "../diagnostics";
import { assertNotErrorNode } from "../diagnostics/assertNotErrorNode";
import { assertSyntaxKind } from "../diagnostics/assertSyntaxKind";
import { LowerError } from "../error";
import type { LoadoutTraits } from "../game/game_engine_default";
import type { ElementLowerContext } from "../parameters";
import { lowerGrenadeCount } from "../parameters/grenadeCount";
import { setField } from "../setField";

const lowerObjectListKeyword = (
  node: ASTParameterNode,
  objectType: ObjectListType,
  ctx: ElementLowerContext
): Located<number> => {
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
  return located(symbol.index, node.location);
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
        case "name": {
          const value = lowerObjectListKeyword(
            parameter,
            ObjectListType.Loadouts,
            ctx
          );
          setField(
            ctx.ir.locations,
            ctx.diagnostics,
            traits,
            "name",
            value.value,
            value.location
          );
          break;
        }
        case "primary_weapon": {
          const value = lowerObjectListKeyword(
            parameter,
            ObjectListType.Weapons,
            ctx
          );
          setField(
            ctx.ir.locations,
            ctx.diagnostics,
            traits,
            "initialPrimaryWeaponAbsoluteIndex",
            value.value,
            value.location
          );
          break;
        }
        case "backpack_weapon": {
          const value = lowerObjectListKeyword(
            parameter,
            ObjectListType.Weapons,
            ctx
          );
          setField(
            ctx.ir.locations,
            ctx.diagnostics,
            traits,
            "initialSecondaryWeaponAbsoluteIndex",
            value.value,
            value.location
          );
          break;
        }
        case "equipment": {
          const value = lowerObjectListKeyword(
            parameter,
            ObjectListType.Equipment,
            ctx
          );
          setField(
            ctx.ir.locations,
            ctx.diagnostics,
            traits,
            "initialEquipmentAbsoluteIndex",
            value.value,
            value.location
          );
          break;
        }
        case "grenades": {
          assertSyntaxKind(parameter, SyntaxKind.GRENADE_COUNT);
          const value = lowerGrenadeCount(parameter);
          setField(
            ctx.ir.locations,
            ctx.diagnostics,
            traits,
            "initialGrenadeCountSetting",
            value.value,
            value.location
          );
          break;
        }
      }
    });
  }

  dxAssertionScope(ctx.diagnostics, () => {
    assertNotErrorNode(name);
    ctx.loadoutsByName.set(name.value, traits);
  });
};
