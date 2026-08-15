import {
  SEMANTIC_TOKEN_MODIFIERS,
  SEMANTIC_TOKEN_TYPES,
} from "@megacrow/megalo";
import type { Monaco } from "@monaco-editor/react";
import { lspCompletions, lspHover, lspSemanticTokens } from "../lib/lspClient";
import {
  MEGALO_BUILTIN_GLOBALS,
  MEGALO_BUILTIN_OVERRIDE_OPTIONS,
  MEGALO_COMPARISON_OPS,
  MEGALO_HIGHLIGHT_RESERVED_KEYWORDS,
  MEGALO_KEYWORDS,
  MEGALO_MAP_OBJECT_FILTER_PROPERTIES,
  MEGALO_MATH_OPS,
  MEGALO_TRIGGER_KINDS,
} from "../lib/megaloShim";
import { findPathReferences } from "../lib/pathReferences";
import {
  isRegionEndLine,
  isRegionStartLine,
  REGION_END,
  REGION_START,
} from "../lib/regionComments";
import { getStringTableFoldLineNumbers } from "../lib/stringTableGroups";
import { applyEditorTheme } from "./theme";

const MEGALO_LANGUAGE_ID = "megalo";
let languageBasicsRegistered = false;
let semanticTokensDisposable: { dispose(): void } | undefined;
let hoverDisposable: { dispose(): void } | undefined;
let completionDisposable: { dispose(): void } | undefined;
let linkDisposable: { dispose(): void } | undefined;
let linkOpenerDisposable: { dispose(): void } | undefined;

/** Custom scheme for Ctrl+Click include / base path links. */
export const MEGACROW_PATH_SCHEME = "megacrow-path";

export type MegaloPathOpenHandler = (payload: {
  kind: "include" | "localized_include" | "base";
  path: string;
}) => void | Promise<void>;

let pathOpenHandler: MegaloPathOpenHandler | null = null;

export function setMegaloPathOpenHandler(
  handler: MegaloPathOpenHandler | null
): void {
  pathOpenHandler = handler;
}

function encodePathLinkUrl(
  monaco: Monaco,
  kind: "include" | "localized_include" | "base",
  path: string
): Monaco["Uri"] {
  return monaco.Uri.from({
    scheme: MEGACROW_PATH_SCHEME,
    path: `/${kind}`,
    query: `path=${encodeURIComponent(path)}`,
  });
}

function decodePathLinkUrl(
  uri: Monaco["Uri"]
): { kind: "include" | "localized_include" | "base"; path: string } | null {
  if (uri.scheme !== MEGACROW_PATH_SCHEME) {
    return null;
  }
  const kind = uri.path.replace(/^\//, "") as
    | "include"
    | "localized_include"
    | "base";
  if (kind !== "include" && kind !== "localized_include" && kind !== "base") {
    return null;
  }
  const params = new URLSearchParams(uri.query);
  const path = params.get("path");
  if (!path) {
    return null;
  }
  return { kind, path };
}

/** Decode, clip to live model line lengths, and re-encode semantic tokens. */
function clipSemanticTokenDataToModel(
  model: Monaco["editor"]["ITextModel"],
  data: number[]
): number[] {
  const absolute: {
    line: number;
    character: number;
    length: number;
    type: number;
    modifiers: number;
  }[] = [];
  let line = 0;
  let character = 0;
  for (let i = 0; i + 4 < data.length; i += 5) {
    const lineDelta = data[i]!;
    const charDelta = data[i + 1]!;
    let length = data[i + 2]!;
    const tokenType = data[i + 3]!;
    const tokenModifiers = data[i + 4]!;
    if (lineDelta > 0) {
      line += lineDelta;
      character = charDelta;
    } else {
      character += charDelta;
    }
    if (line + 1 > model.getLineCount()) {
      continue;
    }
    const lineLength = model.getLineLength(line + 1);
    if (character >= lineLength) {
      continue;
    }
    length = Math.min(length, lineLength - character);
    if (length <= 0) {
      continue;
    }
    absolute.push({
      line,
      character,
      length,
      type: tokenType,
      modifiers: tokenModifiers,
    });
  }

  const relative: number[] = [];
  let prevLine = 0;
  let prevChar = 0;
  for (const token of absolute) {
    const lineDelta = token.line - prevLine;
    const charDelta =
      lineDelta === 0 ? token.character - prevChar : token.character;
    relative.push(
      lineDelta,
      charDelta,
      token.length,
      token.type,
      token.modifiers
    );
    prevLine = token.line;
    prevChar = token.character;
  }
  return relative;
}

export type { MegaloDiagnostic } from "../lib/diagnostics";

import type { MegaloDiagnostic } from "../lib/diagnostics";
import type { MegaloIncludeFileCache } from "../lib/includeDiagnostics";
import type { MegaloProgram } from "../lib/megaloShim";

export interface MegaloHoverContext {
  baselineSource: string | null;
  baseProgram: MegaloProgram | null;
  includeCache?: MegaloIncludeFileCache;
}

let _hoverContext: MegaloHoverContext = {
  baseProgram: null,
  baselineSource: null,
};

export function setMegaloHoverContext(context: MegaloHoverContext): void {
  _hoverContext = context;
}

function diagnosticToMarker(
  monaco: Monaco,
  model: Monaco["editor"]["ITextModel"],
  diagnostic: MegaloDiagnostic
): Monaco["editor"]["IMarkerData"] {
  const lineCount = model.getLineCount();
  const startLine = Math.min(Math.max(1, diagnostic.line), lineCount);
  const lineLength = model.getLineLength(startLine);
  const startColumn = Math.min(Math.max(1, diagnostic.column), lineLength + 1);

  const endLine = startLine;
  let endColumn = diagnostic.endColumn ?? startColumn + 1;
  endColumn = Math.min(Math.max(endColumn, startColumn + 1), lineLength + 1);

  if (
    diagnostic.offset !== undefined &&
    diagnostic.length !== undefined &&
    diagnostic.length > 0
  ) {
    const valueLength = model.getValueLength();
    const startOffset = Math.min(Math.max(0, diagnostic.offset), valueLength);
    const endOffset = Math.min(startOffset + diagnostic.length, valueLength);
    const start = model.getPositionAt(startOffset);
    const end = model.getPositionAt(endOffset);
    return {
      severity:
        diagnostic.severity === "warning"
          ? monaco.MarkerSeverity.Warning
          : monaco.MarkerSeverity.Error,
      startLineNumber: start.lineNumber,
      startColumn: start.column,
      endLineNumber: end.lineNumber,
      endColumn: Math.max(end.column, start.column + 1),
      message: diagnostic.message,
      source: "megalo",
    };
  }

  return {
    severity:
      diagnostic.severity === "warning"
        ? monaco.MarkerSeverity.Warning
        : monaco.MarkerSeverity.Error,
    startLineNumber: startLine,
    startColumn,
    endLineNumber: endLine,
    endColumn,
    message: diagnostic.message,
    source: "megalo",
  };
}

function buildAlternationRegex(
  words: readonly string[],
  exclude: ReadonlySet<string>
): RegExp | null {
  const parts = [...new Set(words)]
    .filter(
      (w) => /^[a-z_][a-z0-9_]*$/i.test(w) && !exclude.has(w.toLowerCase())
    )
    .sort((a, b) => b.length - a.length)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (parts.length === 0) {
    return null;
  }
  return new RegExp(`\\b(${parts.join("|")})\\b`, "i");
}

function _buildTokenizer(
  _actionNames: readonly string[],
  _conditionNames: readonly string[]
) {
  const overrideOptionRegex = buildAlternationRegex(
    MEGALO_BUILTIN_OVERRIDE_OPTIONS,
    new Set()
  );
  const builtinGlobalRegex = buildAlternationRegex(
    [
      ...new Set([
        ...MEGALO_BUILTIN_GLOBALS,
        ...MEGALO_BUILTIN_OVERRIDE_OPTIONS,
      ]),
    ],
    new Set()
  );
  const mapObjectPropertyRegex = buildAlternationRegex(
    MEGALO_MAP_OBJECT_FILTER_PROPERTIES,
    new Set()
  );

  const keywordList: string[] = [];
  function addKeyword(word: string): void {
    if (!keywordList.some((k) => k.toLowerCase() === word.toLowerCase())) {
      keywordList.push(word);
    }
  }
  for (const k of MEGALO_HIGHLIGHT_RESERVED_KEYWORDS) {
    addKeyword(k);
  }
  for (const k of MEGALO_KEYWORDS) {
    addKeyword(k);
  }
  for (const k of MEGALO_TRIGGER_KINDS) {
    addKeyword(k);
  }
  for (const k of MEGALO_MATH_OPS) {
    addKeyword(k);
  }
  for (const k of MEGALO_COMPARISON_OPS) {
    addKeyword(k);
  }
  for (const k of MEGALO_BUILTIN_GLOBALS) {
    addKeyword(k);
  }
  for (const k of MEGALO_BUILTIN_OVERRIDE_OPTIONS) {
    addKeyword(k);
  }
  addKeyword("action");
  addKeyword("condition");
  addKeyword("and");
  addKeyword("or");

  const sharedRules: Array<RegExp | [RegExp, string] | [RegExp, string[]]> = [
    [/;.*$/, "comment"],
    [/"([^"\\]|\\.)*$/, "string.invalid"],
    [/"/, "string", "@string"],
    [/\d+(\.\d+)?/, "number"],
    [/\boption_[a-z_][a-z0-9_]*\b/i, "game.option"],
    [/^\s*action\s+([a-z_][a-z0-9_]*)/i, ["keyword", "action.type"]],
    [/^\s*condition\s+([a-z_][a-z0-9_]*)/i, ["keyword", "condition.type"]],
    [/^\s*if\s+([a-z_][a-z0-9_]*)/i, ["condition.type", "condition.type"]],
    [/\b(action)\b/i, "keyword"],
    [/\b(condition)\b/i, "keyword"],
    [/\b(if)\b/i, "condition.type"],
    ...(builtinGlobalRegex
      ? ([[builtinGlobalRegex, "keyword"]] as [RegExp, string][])
      : []),
    [
      /[a-z_][a-z0-9_]*/i,
      {
        cases: {
          "@mathOps": "keyword",
          "@keywords": "keyword",
          "@default": "identifier",
        },
      },
    ],
    [/[(),]/, "delimiter"],
    [/\s+/, "white"],
  ];

  const sectionCloseRule: [RegExp, { token: string; next: string }] = [
    /^end\s*$/i,
    { token: "keyword", next: "@pop" },
  ];

  const sectionOpeners: [RegExp, { token: string; next: string }][] = [
    [/^\s*constants\s*$/i, { token: "keyword.section", next: "@constants" }],
    [/^\s*variables\s+\w+/i, { token: "keyword.section", next: "@variables" }],
    [
      /^\s*game_options\s*$/i,
      { token: "keyword.section", next: "@gameoptions" },
    ],
    [/^\s*map_object\s+\w+/i, { token: "keyword.section", next: "@mapobject" }],
    [/^\s*trigger\b/i, { token: "keyword.section", next: "@trigger" }],
    [
      /^\s*(string_table|engine_data|teams|hud_widgets|game_stats|statistics|map_permissions|include)\b/i,
      { token: "keyword.section", next: "@section" },
    ],
  ];

  const root: Array<
    | RegExp
    | [RegExp, string]
    | [RegExp, string[]]
    | [RegExp, { token: string; next: string }]
  > = [...sectionOpeners, ...sharedRules];

  const variableTypeRules: [RegExp, string][] = [
    [/\b(number|timer)\b/i, "variable.type"],
    [/\b(object|player|team|networked|local)\b/i, "identifier"],
  ];

  const constantsBody: Array<
    | RegExp
    | [RegExp, string]
    | [RegExp, string[]]
    | [RegExp, { token: string; next: string }]
  > = [
    sectionCloseRule,
    [/;.*$/, "comment"],
    [/\b(number|timer)\b/i, "variable.type"],
    [/[a-z_][a-z0-9_]*/i, "numeric.constant"],
    [/\d+(\.\d+)?/, "number"],
    [/\s+/, "white"],
  ];

  const variablesBody: Array<
    | RegExp
    | [RegExp, string]
    | [RegExp, string[]]
    | [RegExp, { token: string; next: string }]
  > = [
    sectionCloseRule,
    [/;.*$/, "comment"],
    ...variableTypeRules,
    [/[a-z_][a-z0-9_]*/i, "identifier"],
    [/\d+(\.\d+)?/, "number"],
    [/\s+/, "white"],
  ];

  const gameOptionsBody: Array<
    | RegExp
    | [RegExp, string]
    | [RegExp, string[]]
    | [RegExp, { token: string; next: string }]
  > = [
    sectionCloseRule,
    [/;.*$/, "comment"],
    [/\boverride\b/i, { token: "keyword", next: "@overridevalue" }],
    [/\b(player_traits)\b/i, { token: "keyword", next: "@playertraitsname" }],
    [/\bhide\b/i, { token: "keyword", next: "@hideoptionprefix" }],
    [/\b(ranged_option|option)\b/i, { token: "keyword", next: "@optionname" }],
    [/\block\b/i, "keyword"],
    [/\boption_[a-z_][a-z0-9_]*\b/i, "game.option"],
    [/[a-z_][a-z0-9_]*/i, "identifier"],
    [/\d+(\.\d+)?/, "number"],
    [/\s+/, "white"],
  ];

  const hideOptionPrefix: Array<
    RegExp | [RegExp, string] | [RegExp, { token: string; next: string }]
  > = [
    [/\branged_option\b/i, { token: "keyword", next: "@optionname" }],
    [/\s+/, "white"],
  ];

  const optionName: Array<
    RegExp | [RegExp, string] | [RegExp, { token: string; next: string }]
  > = [
    [
      /\boption_[a-z_][a-z0-9_]*\b/i,
      { token: "game.option", next: "@gameoptions" },
    ],
    [/[a-z_][a-z0-9_]*/i, { token: "game.option", next: "@gameoptions" }],
    [/\s+/, "white"],
  ];

  const overrideValue: Array<
    RegExp | [RegExp, string] | [RegExp, { token: string; next: string }]
  > = [
    [/;.*$/, { token: "comment", next: "@pop" }],
    ...(overrideOptionRegex
      ? ([[overrideOptionRegex, { token: "keyword", next: "@pop" }]] as [
          RegExp,
          { token: string; next: string },
        ][])
      : []),
    [/[a-z_][a-z0-9_]*/i, { token: "keyword", next: "@pop" }],
    [/\s+/, "white"],
  ];

  const playerTraitsName: Array<
    RegExp | [RegExp, string] | [RegExp, { token: string; next: string }]
  > = [
    [/;.*$/, "comment"],
    [
      /[a-z_][a-z0-9_]*/i,
      { token: "player_traits.recipient", next: "@playertraits" },
    ],
    [/\s+/, "white"],
  ];

  const playerTraitsBody: Array<
    | RegExp
    | [RegExp, string]
    | [RegExp, string[]]
    | [RegExp, { token: string; next: string }]
  > = [
    [/^\s+end\s*$/i, { token: "keyword", next: "@gameoptions" }],
    [/;.*$/, "comment"],
    [/"([^"\\]|\\.)*$/, "string.invalid"],
    [/"/, "string", "@string"],
    [/\d+(\.\d+)?/, "number"],
    [/[a-z_][a-z0-9_]*/i, "identifier"],
    [/\s+/, "white"],
  ];

  const mapObjectBody: Array<
    | RegExp
    | [RegExp, string]
    | [RegExp, string[]]
    | [RegExp, { token: string; next: string }]
  > = [
    sectionCloseRule,
    [/;.*$/, "comment"],
    [/"([^"\\]|\\.)*$/, "string.invalid"],
    [/"/, "string", "@string"],
    ...(mapObjectPropertyRegex
      ? ([[mapObjectPropertyRegex, "map_object.property"]] as [
          RegExp,
          string,
        ][])
      : []),
    [/\d+(\.\d+)?/, "number"],
    [/[a-z_][a-z0-9_]*/i, "identifier"],
    [/\s+/, "white"],
  ];

  const sectionBody: Array<
    | RegExp
    | [RegExp, string]
    | [RegExp, string[]]
    | [RegExp, { token: string; next: string }]
  > = [sectionCloseRule, ...sharedRules];

  const triggerBody: Array<
    | RegExp
    | [RegExp, string]
    | [RegExp, string[]]
    | [RegExp, { token: string; next: string }]
  > = [sectionCloseRule, ...sharedRules];

  return {
    defaultToken: "identifier",
    ignoreCase: true,
    tokenPostfix: ".megalo",
    comments: {
      lineComment: ";",
    },
    keywords: keywordList,
    mathOps: MEGALO_MATH_OPS,
    tokenizer: {
      root,
      constants: constantsBody,
      variables: variablesBody,
      gameoptions: gameOptionsBody,
      hideoptionprefix: hideOptionPrefix,
      optionname: optionName,
      overridevalue: overrideValue,
      playertraitsname: playerTraitsName,
      playertraits: playerTraitsBody,
      mapobject: mapObjectBody,
      trigger: triggerBody,
      section: sectionBody,
      string: [
        [/[^\\"]+/, "string"],
        [/\\./, "string.escape"],
        [/"/, "string", "@pop"],
      ],
    },
  };
}

function _completionKind(
  monaco: Monaco,
  item: import("../lib/megaloShim").CompletionItem
): Monaco["languages"]["CompletionItemKind"] {
  switch (item.kind) {
    case "method":
    case "action":
      return monaco.languages.CompletionItemKind.Method;
    case "condition":
      return monaco.languages.CompletionItemKind.Keyword;
    case "variable":
    case "constant":
      return monaco.languages.CompletionItemKind.Variable;
    case "keyword":
      return monaco.languages.CompletionItemKind.Keyword;
    case "option":
      return monaco.languages.CompletionItemKind.Field;
    default:
      return monaco.languages.CompletionItemKind.Snippet;
  }
}

function _lineContext(
  line: string,
  column: number
): "action" | "condition" | "general" {
  const before = line.slice(0, Math.max(0, column - 1));

  const actionMatch = /^\s*action\s+(.*)$/i.exec(before);
  if (actionMatch) {
    const rest = actionMatch[1] ?? "";
    if (rest === "" || /^[a-z_][a-z0-9_]*$/i.test(rest)) {
      return "action";
    }
  }

  const conditionMatch = /^\s*condition\s+(.*)$/i.exec(before);
  if (conditionMatch) {
    const rest = conditionMatch[1] ?? "";
    if (rest === "" || /^[a-z_][a-z0-9_]*$/i.test(rest)) {
      return "condition";
    }
  }

  const ifMatch = /^\s*if\s+(.*)$/i.exec(before);
  if (ifMatch) {
    const rest = ifMatch[1] ?? "";
    if (rest === "" || /^[a-z_][a-z0-9_]*$/i.test(rest)) {
      return "condition";
    }
  }

  return "general";
}

function _completionRange(
  line: number,
  column: number,
  word: string
): {
  startLineNumber: number;
  endLineNumber: number;
  startColumn: number;
  endColumn: number;
} {
  if (word.length > 0) {
    return {
      startLineNumber: line,
      endLineNumber: line,
      startColumn: column - word.length,
      endColumn: column,
    };
  }
  return {
    startLineNumber: line,
    endLineNumber: line,
    startColumn: column,
    endColumn: column,
  };
}

/** Map LSP CompletionItemKind → Monaco CompletionItemKind. */
const monacoCompletionKind = (
  monaco: Monaco,
  lspKind: number | undefined
): number => {
  const Kind = monaco.languages.CompletionItemKind;
  switch (lspKind) {
    case 14: // Keyword
      return Kind.Keyword;
    case 3: // Function
      return Kind.Function;
    case 6: // Variable
      return Kind.Variable;
    case 10: // Property
      return Kind.Property;
    case 7: // Class
      return Kind.Class;
    case 20: // EnumMember
      return Kind.EnumMember;
    case 21: // Constant
      return Kind.Constant;
    case 1: // Text
      return Kind.Text;
    default:
      return Kind.Text;
  }
};

/** Register language + theme before the editor mounts. */
export function registerMegaloLanguage(monaco: Monaco): void {
  if (!languageBasicsRegistered) {
    languageBasicsRegistered = true;
    monaco.languages.register({ id: MEGALO_LANGUAGE_ID });

    monaco.languages.setLanguageConfiguration(MEGALO_LANGUAGE_ID, {
      comments: {
        lineComment: ";",
      },
      folding: {
        markers: {
          start: REGION_START,
          end: REGION_END,
        },
      },
      wordPattern: /(-?\d*\.\d\w*)|([a-zA-Z_][\w]*)/g,
      brackets: [
        ["(", ")"],
        ["[", "]"],
      ],
      autoClosingPairs: [
        { open: "(", close: ")" },
        { open: "[", close: "]" },
        { open: '"', close: '"' },
      ],
    });

    monaco.languages.registerFoldingRangeProvider(MEGALO_LANGUAGE_ID, {
      provideFoldingRanges(model) {
        const lines = model.getLinesContent();
        const ranges: Monaco["languages"]["FoldingRange"][] = [];
        const stack: number[] = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i] ?? "";
          if (isRegionEndLine(line)) {
            const start = stack.pop();
            if (start !== undefined && i > start) {
              ranges.push({
                start: start + 1,
                end: i + 1,
                kind: monaco.languages.FoldingRangeKind.Region,
              });
            }
            continue;
          }
          if (isRegionStartLine(line)) {
            stack.push(i);
          }
        }
        return ranges;
      },
    });
  }

  // Re-bind feature providers on every call so HMR / late registration works.
  semanticTokensDisposable?.dispose();
  semanticTokensDisposable =
    monaco.languages.registerDocumentSemanticTokensProvider(
      MEGALO_LANGUAGE_ID,
      {
        getLegend() {
          return {
            tokenTypes: [...SEMANTIC_TOKEN_TYPES],
            tokenModifiers: [...SEMANTIC_TOKEN_MODIFIERS],
          };
        },
        async provideDocumentSemanticTokens(model) {
          const data = await lspSemanticTokens(model.getValue());
          return {
            data: new Uint32Array(clipSemanticTokenDataToModel(model, data)),
          };
        },
        releaseDocumentSemanticTokens() {
          // Full-document tokens only; nothing to release.
        },
      }
    );

  hoverDisposable?.dispose();
  hoverDisposable = monaco.languages.registerHoverProvider(MEGALO_LANGUAGE_ID, {
    async provideHover(model, position) {
      try {
        const hover = await lspHover(model.getValue(), {
          line: position.lineNumber - 1,
          character: position.column - 1,
        });
        if (!hover) {
          return null;
        }
        const value =
          typeof hover.contents === "string"
            ? hover.contents
            : hover.contents.value;
        return {
          contents: [{ value }],
          range: hover.range
            ? {
                startLineNumber: hover.range.start.line + 1,
                startColumn: hover.range.start.character + 1,
                endLineNumber: hover.range.end.line + 1,
                endColumn: hover.range.end.character + 1,
              }
            : undefined,
        };
      } catch (error) {
        console.error("[megalo] hover failed", error);
        return null;
      }
    },
  });

  completionDisposable?.dispose();
  completionDisposable = monaco.languages.registerCompletionItemProvider(
    MEGALO_LANGUAGE_ID,
    {
      triggerCharacters: [" ", ".", "_"],
      async provideCompletionItems(model, position) {
        try {
          const items = await lspCompletions(model.getValue(), {
            line: position.lineNumber - 1,
            character: position.column - 1,
          });
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          return {
            suggestions: items.map((item) => ({
              label: item.label,
              kind: monacoCompletionKind(monaco, item.kind),
              detail: item.detail,
              documentation:
                typeof item.documentation === "string"
                  ? item.documentation
                  : item.documentation?.value,
              insertText: item.insertText ?? item.label,
              // Keep short prefixes (1–2 chars) matching; Monaco scores on filterText.
              filterText: item.label,
              range,
            })),
            // Re-query as the user keeps typing so 1-char prefixes aren't stuck.
            incomplete: true,
          };
        } catch (error) {
          console.error("[megalo] completions failed", error);
          return { suggestions: [] };
        }
      },
    }
  );

  linkDisposable?.dispose();
  linkDisposable = monaco.languages.registerLinkProvider(MEGALO_LANGUAGE_ID, {
    provideLinks(model) {
      const references = findPathReferences(model.getValue());
      return {
        links: references.map((ref) => ({
          range: ref.range,
          url: encodePathLinkUrl(monaco, ref.kind, ref.path),
          tooltip:
            ref.kind === "base"
              ? `Open source for base "${ref.path}"`
              : `Open ${ref.path}`,
        })),
      };
    },
  });

  if (!linkOpenerDisposable) {
    linkOpenerDisposable = monaco.editor.registerLinkOpener({
      async open(resource) {
        const decoded = decodePathLinkUrl(resource);
        if (!(decoded && pathOpenHandler)) {
          return false;
        }
        await pathOpenHandler(decoded);
        return true;
      },
    });
  }

  applyEditorTheme(monaco);

  for (const model of monaco.editor.getModels()) {
    if (model.getLanguageId() === MEGALO_LANGUAGE_ID) {
      monaco.editor.setModelLanguage(model, "plaintext");
      monaco.editor.setModelLanguage(model, MEGALO_LANGUAGE_ID);
    }
  }
}

export function setMegaloDiagnostics(
  monaco: Monaco,
  model: Monaco["editor"]["ITextModel"],
  diagnostics: MegaloDiagnostic[]
): void {
  monaco.editor.setModelMarkers(
    model,
    "megalo",
    diagnostics
      .filter((d) => !d.trayOnly)
      .map((d) => diagnosticToMarker(monaco, model, d))
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

interface FoldingRegion {
  isCollapsed: boolean;
  startLineNumber: number;
}

interface FoldingModelLike {
  getRegionAtLine(line: number): FoldingRegion | null;
  toggleCollapseState(regions: FoldingRegion[]): void;
}

interface FoldingControllerLike {
  getFoldingModel(): Promise<FoldingModelLike | null> | null;
}

/** Collapse all `string_table` blocks once folding ranges are available. */
export async function foldStringTables(
  editor: Monaco["editor"]["IStandaloneCodeEditor"]
): Promise<boolean> {
  const model = editor.getModel();
  if (!model) {
    return false;
  }

  const headerLines = getStringTableFoldLineNumbers(model.getLinesContent());
  if (headerLines.length === 0) {
    return false;
  }

  const savedPosition = editor.getPosition();
  const savedSelections = editor.getSelections();

  const restoreCursor = () => {
    if (savedSelections) {
      editor.setSelections(savedSelections);
    } else if (savedPosition) {
      editor.setPosition(savedPosition);
    }
  };

  for (let attempt = 0; attempt < 40; attempt++) {
    const controller = editor.getContribution(
      "editor.contrib.folding"
    ) as FoldingControllerLike | null;
    const foldingModel = await controller?.getFoldingModel?.();
    if (!foldingModel) {
      await sleep(75);
      continue;
    }

    const regionsToFold: FoldingRegion[] = [];
    for (const line of headerLines) {
      const region = foldingModel.getRegionAtLine(line);
      if (region?.startLineNumber === line && !region.isCollapsed) {
        regionsToFold.push(region);
      }
    }

    if (regionsToFold.length > 0) {
      foldingModel.toggleCollapseState(regionsToFold);
      restoreCursor();
      return true;
    }

    const hasAnyRegion = headerLines.some(
      (line) => foldingModel.getRegionAtLine(line) !== null
    );
    if (hasAnyRegion) {
      restoreCursor();
      return true;
    }

    await sleep(75);
  }

  for (const header of headerLines) {
    editor.trigger("foldStringTables", "editor.fold", {
      selectionLines: [header - 1],
    });
  }

  restoreCursor();
  return true;
}

export { MEGALO_LANGUAGE_ID };
