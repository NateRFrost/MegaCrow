import { getCompilerForVersion } from "src/backend/compile";
import type { CompilerSettings } from "src/compiler-settings";
import { MegaloCompilerContext } from "src/context";
import {
  BUILT_IN_LOCATION,
  type Diagnostic,
  Diagnostics,
} from "src/diagnostics";
import { CompilerError } from "src/diagnostics/error";
import {
  Parser,
  type ResolveIncludeFn,
} from "src/frontend/abstract-syntax-tree";
import type { IR } from "src/frontend/intermediate-representation";
import { Lowerer } from "src/frontend/intermediate-representation";
import type { ObjectLists } from "src/frontend/object-lists";
import { Lexer } from "src/frontend/tokens";
import { loadObjectListsForVersion } from "src/load-object-lists";
import type { MegacrowExtensions } from "src/megacrow-extensions";
import type { SupportedMegaloVersion } from "src/version";

export type ResolveBaseFileFn = (
  path: string,
  ctx: { fromUri?: string }
) => Uint8Array | null | Promise<Uint8Array | null>;

export interface CompileSourceOptions {
  /** MegaloEdit-parity compiler knobs. */
  compilerSettings?: Partial<CompilerSettings>;
  /** URI of the source document (for relative path resolution). */
  fromUri?: string;
  /** MegaCrow-only language extensions (defaults keep MegaloEdit parity). */
  megacrowExtensions?: Partial<MegacrowExtensions>;
  /**
   * Object lists used for name resolution. When omitted, bundled defaults for
   * the compile version are loaded.
   */
  objectLists?: ObjectLists;
  /** Host-owned base `.mglo` resolver. */
  resolveBaseFile?: ResolveBaseFileFn;
  /** Host-owned include file resolver (Tauri / OPFS / tests). */
  resolveInclude?: ResolveIncludeFn;
  version: SupportedMegaloVersion;
}

export interface CompileSourceResult {
  /** Present when compilation succeeded with no errors. */
  bytes?: Uint8Array;
  diagnostics: Diagnostic[];
}

const resolveAndAttachBase = async (
  ir: IR,
  diagnostics: Diagnostics,
  resolveBaseFile: ResolveBaseFileFn | undefined,
  fromUri: string | undefined
): Promise<void> => {
  if (!ir.baseFilePath) {
    return;
  }

  const location = ir.locations.get(ir, "baseFilePath") ?? BUILT_IN_LOCATION;

  if (!resolveBaseFile) {
    diagnostics.addError(
      `Could not resolve base file "${ir.baseFilePath}"`,
      location
    );
    return;
  }

  let bytes: Uint8Array | null;
  try {
    bytes = await resolveBaseFile(ir.baseFilePath, { fromUri });
  } catch (error) {
    diagnostics.addError(
      error instanceof Error
        ? error.message
        : `Could not resolve base file "${ir.baseFilePath}"`,
      location
    );
    return;
  }

  if (bytes === null) {
    diagnostics.addError(
      `Could not resolve base file "${ir.baseFilePath}"`,
      location
    );
    return;
  }

  ir.baseFileBytes = bytes;
};

/**
 * Lex → parse (with include expansion) → lower → resolve base → encode a Megalo
 * script to `.mglo` bytes.
 * Always returns diagnostics; `bytes` is only set when there are no errors.
 */
export const compileSource = async (
  source: string,
  options: CompileSourceOptions
): Promise<CompileSourceResult> => {
  const frontend = new MegaloCompilerContext(
    options.version,
    options.megacrowExtensions,
    options.compilerSettings
  );
  const objectLists =
    options.objectLists ?? loadObjectListsForVersion(options.version);
  const diagnostics = new Diagnostics();

  const lexer = new Lexer(frontend);
  const parser = new Parser(frontend);
  const lowerer = new Lowerer(frontend);
  const compiler = getCompilerForVersion(frontend.megaloVersion);

  try {
    const tokens = lexer.lex(source, diagnostics);
    const ast = await parser.parseAsync(tokens, diagnostics, {
      objectLists,
      resolveInclude: options.resolveInclude,
      fromUri: options.fromUri,
    });
    const ir = lowerer.lower(ast, diagnostics, {
      objectLists,
    });
    await resolveAndAttachBase(
      ir,
      diagnostics,
      options.resolveBaseFile,
      options.fromUri
    );

    if (diagnostics.hasErrors()) {
      return {
        diagnostics: [...diagnostics.getErrors(), ...diagnostics.getWarnings()],
      };
    }

    const bytes = compiler.writeMegaloFile(ir, diagnostics);
    return {
      diagnostics: [...diagnostics.getErrors(), ...diagnostics.getWarnings()],
      bytes: diagnostics.hasErrors() ? undefined : bytes,
    };
  } catch (error) {
    if (error instanceof CompilerError) {
      diagnostics.addError(error.message, error.location ?? BUILT_IN_LOCATION);
    } else {
      diagnostics.addError(
        error instanceof Error ? error.message : String(error),
        BUILT_IN_LOCATION
      );
    }
    return {
      diagnostics: [...diagnostics.getErrors(), ...diagnostics.getWarnings()],
    };
  }
};
