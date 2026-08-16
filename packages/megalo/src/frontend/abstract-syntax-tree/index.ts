import type { MegaloCompilerContext } from "src/context";
import type { Diagnostics, SourceLocation } from "src/diagnostics";
import { rootIncludeDeclaration } from "src/diagnostics";
import { IncludeDiagnostics } from "src/diagnostics/include";
import { diagnosticMessages } from "src/diagnostics/messages";
import {
  type ASTCommentNode,
  collectComments,
} from "src/frontend/abstract-syntax-tree/comment";
import { ParserContext } from "src/frontend/abstract-syntax-tree/context";
import {
  type ASTElementNode,
  ElementKind,
  ElementParserRepository,
  type IncludeElementNode,
  type LocalizedIncludeElementNode,
} from "src/frontend/abstract-syntax-tree/elements";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import type { ParserSymbolContext } from "src/frontend/abstract-syntax-tree/symbol-context";
import type { ObjectLists } from "src/frontend/object-lists";
import { SymbolBinder, type SymbolTable } from "src/frontend/symbol-table";
import { Lexer, TokenKind, type Tokens } from "src/frontend/tokens";

export {
  type ASTErrorNode,
  type ASTFloatingPointNode,
  type ASTIntegerNode,
  type ASTNode,
  type ASTReferenceNode,
  isAstErrorNode,
  SyntaxKind,
} from "src/frontend/abstract-syntax-tree/kinds";

export interface AST {
  comments: ASTCommentNode[];
  elements: ASTElementNode[];
  failed: boolean;
  includedPaths?: ReadonlySet<string>;
  symbolTable: SymbolTable;
}

export type ResolveIncludeFn = (
  path: string,
  ctx: {
    kind: "include" | "localized_include";
    fromUri?: string;
  }
) =>
  | { text: string; uri: string }
  | null
  | Promise<{ text: string; uri: string } | null>;

export interface ParseOptions {
  // Keeps track of current absolute offset,
  // passed as an object so we can update the number using the reference.
  // optional because ParseOptions is also used by parseAsync, which manages this.
  absoluteOffsetState?: { next: number };
  /** URI of the document being parsed (for relative include resolution). */
  fromUri?: string;
  // We need to keep track of included paths because Megalo
  // only resolves includes once per file.
  includedPaths?: Set<string>;
  // We need to keep track of the include stack to detect cyclical includes.
  includeStack?: string[];
  objectLists?: ObjectLists;
  resolveInclude?: ResolveIncludeFn;
}

// Parser is Frontend lifecycle - it is instanced per workspace.
export class Parser {
  private readonly frontend: MegaloCompilerContext;
  private readonly elementParserRepository: ElementParserRepository;

  public constructor(frontend: MegaloCompilerContext) {
    this.frontend = frontend;
    this.elementParserRepository = new ElementParserRepository(frontend);
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
    const symbolBinder = new SymbolBinder(this.frontend, diagnostics);
    const ctx = new ParserContext(
      tokensWithoutComments,
      this.frontend,
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
        case TokenKind.None:
        case TokenKind.Operator:
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
    const symbolBinder = new SymbolBinder(this.frontend, diagnostics);
    const includedPaths = options.includedPaths ?? new Set<string>();
    const lastRootToken = tokensWithoutComments.at(-1);
    const absoluteOffsetState = options.absoluteOffsetState ?? {
      next:
        lastRootToken === undefined
          ? 0
          : lastRootToken.location.end.localOffset + 1,
    };
    const elements = await this.parseElementsAsync(
      tokensWithoutComments,
      diagnostics,
      symbolBinder,
      objectLists,
      {
        ...options,
        includedPaths,
        absoluteOffsetState,
      }
    );

    return {
      failed: diagnostics.hasErrors(),
      comments,
      elements,
      symbolTable: symbolBinder.getSymbolTable(),
      includedPaths,
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
      this.frontend,
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
            // expanded include stays in AST for syntax highlighting
            elements.push(element);
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
        case TokenKind.None:
        case TokenKind.Operator:
          ctx.diagnostics.addError(
            diagnosticMessages.expectedElement(token.value),
            token.location
          );
          break;
      }
    }

    return elements;
  }

  private reportMissingInclude(
    kind: "include" | "localized_include",
    path: string,
    blameLocation: SourceLocation,
    diagnostics: Diagnostics,
    message?: string
  ): void {
    const resolvedMessage =
      message ??
      (kind === "localized_include"
        ? diagnosticMessages.couldNotResolveLocalizedInclude(path)
        : diagnosticMessages.couldNotResolveInclude(path));
    if (kind === "localized_include") {
      if (this.frontend.compilerSettings.strictStringLiterals) {
        diagnostics.addError(resolvedMessage, blameLocation);
      } else {
        diagnostics.addWarning(resolvedMessage, blameLocation);
      }
      return;
    }
    diagnostics.addError(resolvedMessage, blameLocation);
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
      this.reportMissingInclude(kind, path, blameLocation, diagnostics);
      return [];
    }

    let resolved: { text: string; uri: string } | null;
    try {
      resolved = await options.resolveInclude(path, {
        kind,
        fromUri: options.fromUri,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : kind === "localized_include"
            ? diagnosticMessages.couldNotResolveLocalizedInclude(path)
            : diagnosticMessages.couldNotResolveInclude(path);
      this.reportMissingInclude(
        kind,
        path,
        blameLocation,
        diagnostics,
        message
      );
      return [];
    }

    if (resolved === null) {
      this.reportMissingInclude(kind, path, blameLocation, diagnostics);
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
      const lexer = new Lexer(this.frontend);
      const nestedTokens = lexer.lex(resolved.text, included);
      // Rebase absolute offsets only; keep localOffset for IDE / IncludeLocation.source.
      // Stamp include provenance so IR-time diagnostics (unused overrides, etc.)
      // still map to the include directive instead of fake root-file lines.
      const offsetState = options.absoluteOffsetState ?? { next: 0 };
      const offsetBase = offsetState.next;
      const includeDeclaration = rootIncludeDeclaration(element.location);
      for (const token of nestedTokens) {
        token.location = {
          ...token.location,
          include: {
            file: resolved.uri,
            declaration: includeDeclaration,
          },
          start: {
            ...token.location.start,
            absoluteOffset: token.location.start.localOffset + offsetBase,
          },
          end: {
            ...token.location.end,
            absoluteOffset: token.location.end.localOffset + offsetBase,
          },
        };
      }
      offsetState.next = offsetBase + resolved.text.length + 1;
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
          absoluteOffsetState: offsetState,
        },
        sharedSymbolParser
      );
    } finally {
      sharedSymbolParser.diagnostics = previousSymbolDiagnostics;
    }
  }
}
