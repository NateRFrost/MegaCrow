import { getCompilerForVersion } from "./backend/compile";
import { MegaloCompilerContext } from "./context";
import {
  BUILT_IN_LOCATION,
  type Diagnostic,
  Diagnostics,
} from "./diagnostics";
import { CompilerError } from "./diagnostics/error";
import { Lowerer } from "./frontend/intermediate-representation";
import type { IR } from "./frontend/intermediate-representation";
import type { ObjectLists } from "./frontend/object-lists";
import { Lexer } from "./frontend/tokens";
import {
  Parser,
  type ResolveIncludeFn,
} from "./frontend/abstract-syntax-tree";
import { loadObjectListsForVersion } from "./load-object-lists";
import type { CompilerSettings } from "./compiler-settings";
import type { MegacrowExtensions } from "./megacrow-extensions";
import type { SupportedMegaloVersion } from "./version";

export type ResolveBaseFileFn = (
  path: string,
  ctx: { fromUri?: string }
) => Promise<Uint8Array | null>;

export type CompileSourceOptions = {
  version: SupportedMegaloVersion;
  /**
   * Object lists used for name resolution. When omitted, bundled defaults for
   * the compile version are loaded.
   */
  objectLists?: ObjectLists;
  /** Host-owned include file resolver (Tauri / OPFS / tests). */
  resolveInclude?: ResolveIncludeFn;
  /** Host-owned base `.mglo` resolver. */
  resolveBaseFile?: ResolveBaseFileFn;
  /** URI of the source document (for relative path resolution). */
  fromUri?: string;
  /** MegaCrow-only language extensions (defaults keep MegaloEdit parity). */
  megacrowExtensions?: Partial<MegacrowExtensions>;
  /** MegaloEdit-parity compiler knobs. */
  compilerSettings?: Partial<CompilerSettings>;
};

export type CompileSourceResult = {
  diagnostics: Diagnostic[];
  /** Present when compilation succeeded with no errors. */
  bytes?: Uint8Array;
};

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
