import { ASTElementNode, ElementKind } from "../../abstract-syntax-tree/elements";
import { IR } from "..";
import { Diagnostics } from "../../diagnostics";
import type { SymbolTable } from "../../symbol-table";
import { engineDataLowerer } from "./engine_data";
import { gameOptionsLowerer } from "./game_options";

export type ElementLowerer<T extends ASTElementNode> = (
  element: T,
  symbolTable: SymbolTable,
  ir: IR,
  diagnostics: Diagnostics
) => void;

export const NULL_LOWERER: ElementLowerer<any> = () => {};

export const ELEMENT_LOWERERS = new Map<ElementKind, ElementLowerer<any>>();

// string table is build out by all lowerers
ELEMENT_LOWERERS.set(ElementKind.STRING_TABLE, NULL_LOWERER);
// constants are removed at lower.
ELEMENT_LOWERERS.set(ElementKind.CONSTANTS, NULL_LOWERER);

ELEMENT_LOWERERS.set(ElementKind.ENGINE_DATA, engineDataLowerer);
ELEMENT_LOWERERS.set(ElementKind.GAME_OPTIONS, gameOptionsLowerer);
