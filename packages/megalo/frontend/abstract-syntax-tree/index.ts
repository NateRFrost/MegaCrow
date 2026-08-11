import type { MegaloVersion } from "../../version";
import type { Diagnostics } from "../diagnostics";
import { IncludeDiagnostics } from "../diagnostics/include";
import { diagnosticMessages } from "../diagnostics/messages";
import type { ObjectLists } from "../object-lists";
import { SymbolBinder, type SymbolTable } from "../symbol-table";
import { Lexer, TokenKind, type Tokens } from "../tokens";
import { type ASTCommentNode, collectComments } from "./comment";
import { ParserContext } from "./context";
import {
  type ASTElementNode,
  ElementKind,
  ElementParserRepository,
  type IncludeElementNode,
  type LocalizedIncludeElementNode,
} from "./elements";
import { SyntaxKind } from "./kinds";
import type { ParserSymbolContext } from "./symbol-context";

export {
  type ASTErrorNode,
  type ASTFloatingPointNode,
  type ASTIntegerNode,
  type ASTNode,
  type ASTReferenceNode,
  isAstErrorNode,
  SyntaxKind,
} from "./kinds";

export type AST = {
  failed: boolean;
  comments: ASTCommentNode[];
  elements: ASTElementNode[];
  symbolTable: SymbolTable;
};

export type ResolveIncludeFn = (
  path: string,
  ctx: {
    kind: "include" | "localized_include";
    fromUri?: string;
  }
) => Promise<{ text: string; uri: string } | null>;

export type ParseOptions = {
  objectLists?: ObjectLists;
  resolveInclude?: ResolveIncludeFn;
  /** URI of the document being parsed (for relative include resolution). */
  fromUri?: string;
  /** Stack of include URIs currently being expanded (cycle detection). */
  includeStack?: string[];
  /**
   * Paths already expanded in this parse (MegaloEdit: include each path once).
   * Keys are lowercased include directive paths and resolved URIs.
   */
  includedPaths?: Set<string>;
};

// Parser is Frontend lifecycle - it is instanced per workspace.
export class Parser {
  private megaloVersion: MegaloVersion;
  private elementParserRepository: ElementParserRepository;

  public constructor(megaloVersion: MegaloVersion) {
    this.megaloVersion = megaloVersion;
    this.elementParserRepository = new ElementParserRepository(megaloVersion);
  }

  /** Sync parse without include expansion (includes remain as AST elements). */
  public parse = (
    tokens: Tokens,
    diagnostics: Diagnostics,
    objectLists: ObjectLists = {}
  ): AST => {
    const comments = collectComments(tokens);
    const elements: ASTElementNode[] = [];
    const tokensWithoutComments = tokens.filter(
      (token) => token.kind !== TokenKind.Comment
    );
    const symbolBinder = new SymbolBinder(this.megaloVersion, diagnostics);
    const ctx = new ParserContext(
      tokensWithoutComments,
      this.megaloVersion,
      diagnostics,
      symbolBinder,
      objectLists
    );

    while (ctx.hasMore()) {
      const token = ctx.getToken();

      switch (token.kind) {
        case TokenKind.Identifier: {
          const parser = this.elementParserRepository.getParser(token.value);
          if (parser) {
            elements.push(parser(ctx, token));
          } else {
            ctx.diagnostics.addError(
              diagnosticMessages.expectedElement(token.value),
              token.location
            );
          }
          break;
        }

        case TokenKind.Comment:
        case TokenKind.MemberVariableSeparator:
        case TokenKind.QuotedString:
        case TokenKind.Integer:
        case TokenKind.FloatingPoint:
          ctx.diagnostics.addError(
            diagnosticMessages.expectedElement(token.value),
            token.location
          );
          break;
      }
    }

    return {
      failed: diagnostics.hasErrors(),
      comments,
      elements,
      symbolTable: symbolBinder.getSymbolTable(),
    };
  };

  /**
   * Async parse with `include` / `localized_include` expansion into the same
   * symbol table. Diagnostics from included files are remapped to the include line.
   */
  public parseAsync = async (
    tokens: Tokens,
    diagnostics: Diagnostics,
    options: ParseOptions = {}
  ): Promise<AST> => {
    const objectLists = options.objectLists ?? {};
    const comments = collectComments(tokens);
    const tokensWithoutComments = tokens.filter(
      (token) => token.kind !== TokenKind.Comment
    );
    const symbolBinder = new SymbolBinder(this.megaloVersion, diagnostics);
    const elements = await this.parseElementsAsync(
      tokensWithoutComments,
      diagnostics,
      symbolBinder,
      objectLists,
      {
        ...options,
        includedPaths: options.includedPaths ?? new Set<string>(),
      }
    );

    return {
      failed: diagnostics.hasErrors(),
      comments,
      elements,
      symbolTable: symbolBinder.getSymbolTable(),
    };
  };

  private async parseElementsAsync(
    tokens: Tokens,
    diagnostics: Diagnostics,
    symbolBinder: SymbolBinder,
    objectLists: ObjectLists,
    options: ParseOptions,
    sharedSymbolParser?: ParserSymbolContext
  ): Promise<ASTElementNode[]> {
    const elements: ASTElementNode[] = [];
    const ctx = new ParserContext(
      tokens,
      this.megaloVersion,
      diagnostics,
      symbolBinder,
      objectLists,
      sharedSymbolParser
    );

    while (ctx.hasMore()) {
      const token = ctx.getToken();

      switch (token.kind) {
        case TokenKind.Identifier: {
          const parser = this.elementParserRepository.getParser(token.value);
          if (!parser) {
            ctx.diagnostics.addError(
              diagnosticMessages.expectedElement(token.value),
              token.location
            );
            break;
          }

          const element = parser(ctx, token);
          if (
            element.elementKind === ElementKind.INCLUDE ||
            element.elementKind === ElementKind.LOCALIZED_INCLUDE
          ) {
            const expanded = await this.expandInclude(
              element,
              diagnostics,
              symbolBinder,
              objectLists,
              options,
              ctx.symbolParser
            );
            elements.push(...expanded);
          } else {
            elements.push(element);
          }
          break;
        }

        case TokenKind.Comment:
        case TokenKind.MemberVariableSeparator:
        case TokenKind.QuotedString:
        case TokenKind.Integer:
        case TokenKind.FloatingPoint:
          ctx.diagnostics.addError(
            diagnosticMessages.expectedElement(token.value),
            token.location
          );
          break;
      }
    }

    return elements;
  }

  private async expandInclude(
    element: IncludeElementNode | LocalizedIncludeElementNode,
    diagnostics: Diagnostics,
    symbolBinder: SymbolBinder,
    objectLists: ObjectLists,
    options: ParseOptions,
    sharedSymbolParser: ParserSymbolContext
  ): Promise<ASTElementNode[]> {
    const blameLocation = element.location;
    if (element.file.kind !== SyntaxKind.QUOTED_STRING) {
      return [];
    }

    const path = element.file.value;
    const kind: "include" | "localized_include" =
      element.elementKind === ElementKind.INCLUDE
        ? "include"
        : "localized_include";

    const pathKey = path.toLowerCase();
    const includedPaths = options.includedPaths ?? new Set<string>();
    // MegaloEdit: skip silently if this include path was already expanded.
    if (includedPaths.has(pathKey)) {
      return [];
    }

    const stack = options.includeStack ?? [];
    if (stack.includes(path)) {
      diagnostics.addError(
        `Include cycle detected: ${[...stack, path].join(" -> ")}`,
        blameLocation
      );
      return [];
    }

    if (!options.resolveInclude) {
      diagnostics.addError(
        `Could not resolve include "${path}"`,
        blameLocation
      );
      return [];
    }

    let resolved: { text: string; uri: string } | null;
    try {
      resolved = await options.resolveInclude(path, {
        kind,
        fromUri: options.fromUri,
      });
    } catch (error) {
      diagnostics.addError(
        error instanceof Error
          ? error.message
          : `Could not resolve include "${path}"`,
        blameLocation
      );
      return [];
    }

    if (resolved === null) {
      diagnostics.addError(
        `Could not resolve include "${path}"`,
        blameLocation
      );
      return [];
    }

    const resolvedKey = resolved.uri.toLowerCase();
    if (includedPaths.has(resolvedKey) || stack.includes(resolved.uri)) {
      // Already expanded via another relative path, or active cycle.
      if (stack.includes(resolved.uri)) {
        diagnostics.addError(
          `Include cycle detected: ${[...stack, resolved.uri].join(" -> ")}`,
          blameLocation
        );
      }
      return [];
    }

    includedPaths.add(pathKey);
    includedPaths.add(resolvedKey);

    const included = new IncludeDiagnostics(
      diagnostics,
      resolved.uri,
      element.location
    );
    const previousSymbolDiagnostics = sharedSymbolParser.diagnostics;
    sharedSymbolParser.diagnostics = included;

    try {
      const lexer = new Lexer(this.megaloVersion);
      const nestedTokens = lexer.lex(resolved.text, included);
      const nestedWithoutComments = nestedTokens.filter(
        (token) => token.kind !== TokenKind.Comment
      );

      return await this.parseElementsAsync(
        nestedWithoutComments,
        included,
        symbolBinder,
        objectLists,
        {
          ...options,
          fromUri: resolved.uri,
          includeStack: [...stack, resolved.uri],
          includedPaths,
        },
        sharedSymbolParser
      );
    } finally {
      sharedSymbolParser.diagnostics = previousSymbolDiagnostics;
    }
  }
}
