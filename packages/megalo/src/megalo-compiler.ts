import type { SupportedMegaloVersion } from "./version";
import { Parser } from "./frontend/abstract-syntax-tree";
import { type Compiler, getCompilerForVersion } from "./backend/compile";
import type { CompilerSettings } from "./compiler-settings";
import { MegaloCompilerContext } from "./context";
import { Diagnostics } from "./diagnostics";
import { Lowerer } from "./frontend/intermediate-representation";
import type { ObjectLists } from "./frontend/object-lists";
import type { MegacrowExtensions } from "./megacrow-extensions";
import { Lexer } from "./frontend/tokens";

export { MegaloCompilerContext } from "./context";

// Workspace lifecycle — one instance per workspace.
export class MegaloCompiler {
  private readonly frontend: MegaloCompilerContext;
  private readonly lexer: Lexer;
  private readonly parser: Parser;
  private readonly lowerer: Lowerer;
  private readonly compiler: Compiler;

  public constructor(
    megaloVersion: SupportedMegaloVersion,
    megacrowExtensions?: Partial<MegacrowExtensions>,
    compilerSettings?: Partial<CompilerSettings>
  ) {
    this.frontend = new MegaloCompilerContext(
      megaloVersion,
      megacrowExtensions,
      compilerSettings
    );
    this.lexer = new Lexer(this.frontend);
    this.parser = new Parser(this.frontend);
    this.lowerer = new Lowerer(this.frontend);
    this.compiler = getCompilerForVersion(this.frontend.megaloVersion);
  }

  public setMegacrowExtensions(
    megacrowExtensions?: Partial<MegacrowExtensions>
  ): void {
    this.frontend.setMegacrowExtensions(megacrowExtensions);
  }

  public setCompilerSettings(
    compilerSettings?: Partial<CompilerSettings>
  ): void {
    this.frontend.setCompilerSettings(compilerSettings);
  }

  public analyzeSource(source: string, objectLists: ObjectLists = {}) {
    const diagnostics = new Diagnostics();

    const tokens = this.lexer.lex(source, diagnostics);
    const ast = this.parser.parse(tokens, diagnostics, objectLists);
    const ir = this.lowerer.lower(ast, diagnostics, { objectLists });
    if (!diagnostics.hasErrors()) {
      this.compiler.dryRun(ir, diagnostics);
    }

    return ir;
  }
}
