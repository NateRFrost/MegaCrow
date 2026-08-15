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

/**
 * Lex + parse once for editor features. Prefer this over re-parsing per query.
 * Uses `parseAsync` when `resolveInclude` is provided so symbols from includes bind.
 * Runs with all MegaCrow extensions enabled.
 */
export const analyzeDocument = async (
  source: string,
  options: AnalyzeDocumentOptions
): Promise<AnalysisSnapshot> => {
  const { version } = options;
  const frontend = new MegaloCompilerContext(version, ALL_MEGACROW_EXTENSIONS);
  const diagnostics = new Diagnostics();
  const objectLists = options.objectLists ?? loadObjectListsForVersion(version);

  const tokens = new Lexer(frontend).lex(source, diagnostics);
  const parser = new Parser(frontend);
  const ast =
    options.resolveInclude === undefined
      ? parser.parse(tokens, diagnostics, objectLists)
      : await parser.parseAsync(tokens, diagnostics, {
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
