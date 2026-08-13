import { type Compiler, getCompilerForVersion } from "src/backend/compile";
import type { CompilerSettings } from "src/compiler-settings";
import { MegaloCompilerContext } from "src/context";
import { Diagnostics } from "src/diagnostics";
import { Parser } from "src/frontend/abstract-syntax-tree";
import { Lowerer } from "src/frontend/intermediate-representation";
import type { ObjectLists } from "src/frontend/object-lists";
import { Lexer } from "src/frontend/tokens";
import type { MegacrowExtensions } from "src/megacrow-extensions";
import type { SupportedMegaloVersion } from "src/version";

export { MegaloCompilerContext } from "src/context";

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
