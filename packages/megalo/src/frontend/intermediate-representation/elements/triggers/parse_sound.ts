import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  type MegaloSound,
  megaloSound,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_sounds";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";

export const parseSoundIndex = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): MegaloSound => {
  let name: string;
  if (node.kind === SyntaxKind.KEYWORD) {
    name = node.value;
  } else if (node.kind === SyntaxKind.REFERENCE) {
    const symbol = ctx.symbolTable.getSymbol(node.symbolId);
    if (symbol === undefined) {
      throw new LowerError(
        diagnosticMessages.expectedParameterType("sound", ""),
        node.location
      );
    }
    name = symbol.name;
  } else if (node.kind === SyntaxKind.QUOTED_STRING) {
    name = node.value;
  } else {
    throw new LowerError(
      diagnosticMessages.expectedParameterType("sound", ""),
      node.location ?? location
    );
  }

  const sound = megaloSound.parse(name.toLowerCase());
  if (sound !== undefined) {
    return sound;
  }

  throw new LowerError(
    diagnosticMessages.expectedParameterType("sound", name),
    node.location ?? location
  );
};
