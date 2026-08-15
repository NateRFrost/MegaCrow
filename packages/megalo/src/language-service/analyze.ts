import { MegaloCompilerContext } from "src/context";
import { Diagnostics } from "src/diagnostics";
import {
  Parser,
  type ResolveIncludeFn,
} from "src/frontend/abstract-syntax-tree";
import type { ObjectLists } from "src/frontend/object-lists";
import { Lexer } from "src/frontend/tokens";
import { computeLineStarts } from "src/language-service/position";
import type { AnalysisSnapshot } from "src/language-service/snapshot";
import { loadObjectListsForVersion } from "src/load-object-lists";
import { ALL_MEGACROW_EXTENSIONS } from "src/megacrow-extensions";
import type { SupportedMegaloVersion } from "src/version";

export interface AnalyzeDocumentOptions {
  fromUri?: string;
  objectLists?: ObjectLists;
  resolveInclude?: ResolveIncludeFn;
  version: SupportedMegaloVersion;
}

export type AnalyzeDocumentSyncOptions = Omit<
  AnalyzeDocumentOptions,
  "resolveInclude" | "fromUri"
>;

const buildSnapshot = (
  source: string,
  version: SupportedMegaloVersion,
  objectLists: ObjectLists | undefined
): AnalysisSnapshot => {
  const frontend = new MegaloCompilerContext(version, ALL_MEGACROW_EXTENSIONS);
  const diagnostics = new Diagnostics();
  const lists = objectLists ?? loadObjectListsForVersion(version);
  const tokens = new Lexer(frontend).lex(source, diagnostics);
  const ast = new Parser(frontend).parse(tokens, diagnostics, lists);

  return {
    source,
    tokens,
    ast,
    parseDiagnostics: [
      ...diagnostics.getErrors(),
      ...diagnostics.getWarnings(),
    ],
    lineStarts: computeLineStarts(source),
    version,
  };
};

/**
 * Sync lex + parse for features that cannot await (e.g. docs markdown-it).
 * Does not resolve includes — use `analyzeDocument` with `resolveInclude` for that.
 */
export const analyzeDocumentSync = (
  source: string,
  options: AnalyzeDocumentSyncOptions
): AnalysisSnapshot =>
  buildSnapshot(source, options.version, options.objectLists);

/**
 * Lex + parse once for editor features. Prefer this over re-parsing per query.
 * Uses `parseAsync` when `resolveInclude` is provided so symbols from includes bind.
 * Runs with all MegaCrow extensions enabled.
 */
export const analyzeDocument = async (
  source: string,
  options: AnalyzeDocumentOptions
): Promise<AnalysisSnapshot> => {
  if (options.resolveInclude === undefined) {
    return buildSnapshot(source, options.version, options.objectLists);
  }

  const { version } = options;
  const frontend = new MegaloCompilerContext(version, ALL_MEGACROW_EXTENSIONS);
  const diagnostics = new Diagnostics();
  const objectLists = options.objectLists ?? loadObjectListsForVersion(version);
  const tokens = new Lexer(frontend).lex(source, diagnostics);
  const ast = await new Parser(frontend).parseAsync(tokens, diagnostics, {
    objectLists,
    fromUri: options.fromUri,
    resolveInclude: options.resolveInclude,
  });

  return {
    source,
    tokens,
    ast,
    parseDiagnostics: [
      ...diagnostics.getErrors(),
      ...diagnostics.getWarnings(),
    ],
    lineStarts: computeLineStarts(source),
    version,
  };
};
