import { type SourceCodeLocation, SourceLocationType } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { ParserContext } from "src/frontend/abstract-syntax-tree/context";
import {
  type ASTIntegerNode,
  type ASTNode,
  SyntaxKind,
} from "src/frontend/abstract-syntax-tree/kinds";
import type {
  ASTKeywordParameterNode,
  ParameterParser,
} from "src/frontend/abstract-syntax-tree/parameters";
import { TokenKind } from "src/frontend/tokens";

export type ASTGrenadeCountNode = ASTNode<SyntaxKind.GRENADE_COUNT> &
  (
    | {
        /** `"none"` | `"default"` */
        form: "preset";
        value: ASTKeywordParameterNode;
      }
    | {
        /** `"3 each"` | `"2 frag"` | `"1 plasma"` */
        form: "typed";
        count: ASTIntegerNode;
        grenadeType: ASTKeywordParameterNode;
      }
  );

const GRENADE_TYPES = new Set(["frag", "plasma", "each"]);
const GRENADE_PRESETS = new Set(["none", "default"]);

const locationSpan = (
  start: SourceCodeLocation,
  end: SourceCodeLocation
): SourceCodeLocation => ({
  type: SourceLocationType.SOURCE_CODE,
  start: start.start,
  end: end.end,
});

export const grenadeCountParser: ParameterParser = (
  ctx: ParserContext,
  anchor: SourceCodeLocation
) => {
  const firstToken = ctx.getToken();

  if (firstToken.kind === TokenKind.Integer) {
    const count: ASTIntegerNode = {
      kind: SyntaxKind.INTEGER,
      value: Number(firstToken.value),
      location: firstToken.location,
    };

    const typeToken = ctx.peekToken();
    if (
      typeToken === undefined ||
      typeToken.kind !== TokenKind.Identifier ||
      !GRENADE_TYPES.has(typeToken.value)
    ) {
      ctx.diagnostics.addError(
        diagnosticMessages.expectedParameterType(
          "grenade type (frag|plasma|each)",
          typeToken?.value ?? ""
        ),
        typeToken?.location ?? firstToken.location
      );
      return [
        {
          kind: SyntaxKind.INVALID,
          location: firstToken.location,
        },
      ];
    }

    ctx.getToken();
    const grenadeType: ASTKeywordParameterNode = {
      kind: SyntaxKind.KEYWORD,
      value: typeToken.value,
      location: typeToken.location,
    };

    const node: ASTGrenadeCountNode = {
      kind: SyntaxKind.GRENADE_COUNT,
      form: "typed",
      count,
      grenadeType,
      location: locationSpan(count.location, grenadeType.location),
    };
    return [node];
  }

  if (firstToken.kind === TokenKind.Identifier) {
    if (!GRENADE_PRESETS.has(firstToken.value)) {
      ctx.diagnostics.addError(
        diagnosticMessages.expectedParameterType(
          "grenade_count (none|default|<n> frag|plasma|each)",
          firstToken.value
        ),
        firstToken.location
      );
      return [
        {
          kind: SyntaxKind.INVALID,
          location: firstToken.location,
        },
      ];
    }

    const value: ASTKeywordParameterNode = {
      kind: SyntaxKind.KEYWORD,
      value: firstToken.value,
      location: firstToken.location,
    };
    const node: ASTGrenadeCountNode = {
      kind: SyntaxKind.GRENADE_COUNT,
      form: "preset",
      value,
      location: value.location,
    };
    return [node];
  }

  ctx.diagnostics.addError(
    diagnosticMessages.expectedConstantValue(firstToken.value),
    firstToken.location ?? anchor
  );
  return [
    {
      kind: SyntaxKind.INVALID,
      location: firstToken.location ?? anchor,
    },
  ];
};
