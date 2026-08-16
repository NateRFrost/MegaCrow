import { type SourceCodeLocation, SourceLocationType } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import {
  type ASTErrorNode,
  type ASTReferenceNode,
  isAstErrorNode,
  SyntaxKind,
} from "src/frontend/abstract-syntax-tree";
import type { ParserContext } from "src/frontend/abstract-syntax-tree/context";
import {
  type ASTElementBase,
  ElementKind,
} from "src/frontend/abstract-syntax-tree/elements";
import {
  type IntegerInitialValue,
  parseIntegerInitialValue,
} from "src/frontend/abstract-syntax-tree/elements/constants";
import { locationSpan } from "src/frontend/abstract-syntax-tree/elements/game_options/shared";
import {
  isNumericVariableType,
  isVariableScopeName,
  isVariableTypeName,
  type VariableScopeName,
  type VariableTypeName,
  variableScopeFromName,
  variableTypeFromName,
} from "src/frontend/language-configuration/omni/variables";
import { type Token, TokenKind } from "src/frontend/tokens";

interface VariableEntryNodeNetwork {
  location: SourceCodeLocation;
  value: string;
}
interface VariableEntryNodeType {
  location: SourceCodeLocation;
  value: VariableTypeName;
}
interface VariableEntryNodeName {
  location: SourceCodeLocation;
  value: string;
}
type IdentifierInitialValue = ASTReferenceNode | ASTErrorNode;
type VariableEntryNodeInitial = IntegerInitialValue | IdentifierInitialValue;

const isMissingInitial = (token: Token | undefined): boolean =>
  !token || (token.kind === TokenKind.Identifier && token.value === "end");

const parseIdentifierInitialValue = (
  ctx: ParserContext,
  anchor: Token
): IdentifierInitialValue => {
  const valuePeek = ctx.peekToken();
  if (isMissingInitial(valuePeek)) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedVariableReference(valuePeek?.value || "end"),
      anchor.location
    );
    return {
      kind: SyntaxKind.INVALID,
      location: anchor.location,
    };
  }

  const valueToken = ctx.getToken();
  if (valueToken.kind !== TokenKind.Identifier) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTokenKind(
        TokenKind.Identifier,
        valueToken.kind,
        valueToken.value
      ),
      valueToken.location
    );
    return {
      kind: SyntaxKind.INVALID,
      location: valueToken.location,
    };
  }

  const symbolId = ctx.symbolParser.lookupSymbol(valueToken.value);
  if (symbolId !== undefined) {
    ctx.symbolParser.recordReference(symbolId, valueToken.location);
    return {
      kind: SyntaxKind.REFERENCE,
      location: valueToken.location,
      identifier: valueToken.value,
      symbolId,
    };
  }

  ctx.diagnostics.addError(
    diagnosticMessages.expectedVariableReference(valueToken.value),
    valueToken.location
  );
  return {
    kind: SyntaxKind.INVALID,
    location: valueToken.location,
  };
};

export interface VariableEntryNode {
  initial: VariableEntryNodeInitial;
  location: SourceCodeLocation;
  name: VariableEntryNodeName | ASTErrorNode;
  network: VariableEntryNodeNetwork | ASTErrorNode;
  type: VariableEntryNodeType | ASTErrorNode;
}

export type VariablesElementNode = ASTElementBase<ElementKind.VARIABLES> & {
  scope:
    | { value: VariableScopeName; location: SourceCodeLocation }
    | ASTErrorNode;
  entries: VariableEntryNode[];
};

const parseScope = (
  ctx: ParserContext,
  elementToken: Token
): VariablesElementNode["scope"] => {
  const next = ctx.peekToken();
  if (
    !next ||
    next.kind !== TokenKind.Identifier ||
    next.location.start.line !== elementToken.location.start.line
  ) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTokenKind(
        TokenKind.Identifier,
        next?.kind ?? TokenKind.None,
        next?.value ?? ""
      ),
      elementToken.location
    );
    return {
      kind: SyntaxKind.INVALID,
      location: elementToken.location,
    };
  }

  const scopeToken = ctx.getToken();
  if (scopeToken.kind !== TokenKind.Identifier) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTokenKind(
        TokenKind.Identifier,
        scopeToken.kind,
        scopeToken.value
      ),
      scopeToken.location
    );
    return {
      kind: SyntaxKind.INVALID,
      location: scopeToken.location,
    };
  }

  if (!isVariableScopeName(scopeToken.value)) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTokenKind(
        TokenKind.Identifier,
        scopeToken.kind,
        scopeToken.value
      ),
      scopeToken.location
    );
  }

  return {
    value: scopeToken.value as VariableScopeName,
    location: scopeToken.location,
  };
};

const missingEntryField = (
  ctx: ParserContext,
  expected: TokenKind,
  anchor: Token
): ASTErrorNode => {
  const peek = ctx.peekToken();
  ctx.diagnostics.addError(
    diagnosticMessages.expectedTokenKind(
      expected,
      peek?.kind ?? TokenKind.None,
      peek?.value ?? ""
    ),
    peek && !isMissingInitial(peek) ? peek.location : anchor.location
  );
  return {
    kind: SyntaxKind.INVALID,
    location: anchor.location,
  };
};

const parseVariableEntry = (
  ctx: ParserContext,
  variableScope: ReturnType<typeof variableScopeFromName> | undefined
): VariableEntryNode => {
  const first = ctx.peekToken();
  if (!first) {
    const empty: SourceCodeLocation = {
      type: SourceLocationType.SOURCE_CODE,
      start: { localOffset: 0, absoluteOffset: 0, line: 1, column: 1 },
      end: { localOffset: 0, absoluteOffset: 0, line: 1, column: 1 },
    };
    return {
      network: { kind: SyntaxKind.INVALID, location: empty },
      type: { kind: SyntaxKind.INVALID, location: empty },
      name: { kind: SyntaxKind.INVALID, location: empty },
      initial: { kind: SyntaxKind.INVALID, location: empty },
      location: empty,
    };
  }

  // `object foo none` — network omitted; default to local (MegaloEdit requires it).
  const networkOmitted =
    first.kind === TokenKind.Identifier && isVariableTypeName(first.value);

  let networkToken = first;
  let network: VariableEntryNode["network"];
  if (networkOmitted) {
    network = {
      value: "local",
      location: first.location,
    };
  } else {
    networkToken = ctx.getToken();
    if (networkToken.kind === TokenKind.Identifier) {
      network = {
        value: networkToken.value,
        location: networkToken.location,
      };
    } else {
      ctx.diagnostics.addError(
        diagnosticMessages.expectedTokenKind(
          TokenKind.Identifier,
          networkToken.kind,
          networkToken.value
        ),
        networkToken.location
      );
      network = {
        kind: SyntaxKind.INVALID,
        location: networkToken.location,
      };
    }
  }

  const typePeek = ctx.peekToken();
  let typeToken = networkToken;
  let type: VariableEntryNode["type"];
  if (isMissingInitial(typePeek)) {
    type = missingEntryField(ctx, TokenKind.Identifier, networkToken);
  } else {
    typeToken = ctx.getToken();
    if (
      typeToken.kind === TokenKind.Identifier &&
      isVariableTypeName(typeToken.value)
    ) {
      type = {
        value: typeToken.value,
        location: typeToken.location,
      };
    } else {
      ctx.diagnostics.addError(
        diagnosticMessages.expectedVariableType(typeToken.value),
        typeToken.location
      );
      type = {
        kind: SyntaxKind.INVALID,
        location: typeToken.location,
      };
    }
  }

  const namePeek = ctx.peekToken();
  let nameToken = typeToken;
  let name: VariableEntryNode["name"];
  const afterName = ctx.peekToken(1);
  const nameLooksLikeVariableNamedEnd =
    !isAstErrorNode(type) &&
    namePeek?.kind === TokenKind.Identifier &&
    namePeek.value === "end" &&
    afterName !== undefined &&
    (isNumericVariableType(type.value)
      ? afterName.kind === TokenKind.Integer ||
        afterName.kind === TokenKind.Identifier
      : afterName.kind === TokenKind.Identifier && afterName.value !== "end");

  if (
    !namePeek ||
    (isMissingInitial(namePeek) && !nameLooksLikeVariableNamedEnd)
  ) {
    name = missingEntryField(ctx, TokenKind.Identifier, typeToken);
  } else {
    nameToken = ctx.getToken();
    if (nameToken.kind === TokenKind.Identifier) {
      name = {
        value: nameToken.value,
        location: nameToken.location,
      };

      if (!isAstErrorNode(type) && variableScope !== undefined) {
        ctx.symbolParser.addVariableToScope({
          name: nameToken.value,
          type: variableTypeFromName(type.value),
          declaration: nameToken.location,
          scope: variableScope,
        });
      }
    } else {
      ctx.diagnostics.addError(
        diagnosticMessages.expectedTokenKind(
          TokenKind.Identifier,
          nameToken.kind,
          nameToken.value
        ),
        nameToken.location
      );
      name = {
        kind: SyntaxKind.INVALID,
        location: nameToken.location,
      };
    }
  }

  const initialAnchor = isAstErrorNode(name) ? typeToken : nameToken;
  const initial =
    !isAstErrorNode(type) && isNumericVariableType(type.value)
      ? parseIntegerInitialValue(ctx, initialAnchor)
      : parseIdentifierInitialValue(ctx, initialAnchor);

  return {
    network,
    type,
    name,
    initial,
    location: {
      type: SourceLocationType.SOURCE_CODE,
      start: networkToken.location.start,
      end: initial.location.end,
    },
  };
};

export const variablesParser = (
  ctx: ParserContext,
  elementToken: Token
): VariablesElementNode => {
  const scope = parseScope(ctx, elementToken);
  const entries: VariableEntryNode[] = [];
  const hasValidScope =
    !isAstErrorNode(scope) && isVariableScopeName(scope.value);
  const variableScope = hasValidScope
    ? variableScopeFromName(scope.value)
    : undefined;
  let foundEnd = false;
  let endLocation: SourceCodeLocation = elementToken.location;

  while (ctx.hasMore()) {
    const token = ctx.peekToken()!;
    if (token.kind === TokenKind.Identifier && token.value === "end") {
      const endToken = ctx.getToken();
      foundEnd = true;
      endLocation = endToken.location;
      break;
    }

    const indexBefore = ctx.mark();
    const entry = parseVariableEntry(ctx, variableScope);
    if (hasValidScope) {
      entries.push(entry);
    }
    // Avoid infinite loops if an entry fails to consume tokens.
    if (ctx.mark() === indexBefore && ctx.hasMore()) {
      ctx.getToken();
    }
  }

  if (!foundEnd) {
    endLocation =
      entries.at(-1)?.location ??
      (isAstErrorNode(scope) ? elementToken.location : scope.location);
    ctx.diagnostics.addError(
      diagnosticMessages.expectedEndBeforeEof(),
      endLocation
    );
  }

  return {
    kind: SyntaxKind.ELEMENT,
    elementKind: ElementKind.VARIABLES,
    keywordLocation: elementToken.location,
    location: locationSpan(elementToken.location, endLocation),
    scope,
    entries,
  };
};
