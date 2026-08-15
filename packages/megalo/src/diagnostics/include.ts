import { CompilerError } from "src/diagnostics/error";
import {
  type Diagnostic,
  Diagnostics,
  isIncludeLocation,
  isSourceCodeLocation,
  type SourceCodeLocation,
  type SourceLocation,
  SourceLocationType,
  stripIncludeProvenance,
} from "src/diagnostics/index";

/**
 * Tags diagnostics from an included file as {@link IncludeLocation}, pointing
 * hosts at the include directive via `declaration` while preserving the span
 * inside the include via `source`. Nested includes retarget `declaration` to
 * the outermost include in the current document.
 */
export class IncludeDiagnostics extends Diagnostics {
  public constructor(
    private readonly inner: Diagnostics,
    private readonly file: string,
    private readonly declaration: SourceCodeLocation
  ) {
    super();
  }

  public addWarning(message: string, location: SourceLocation): void {
    this.inner.addWarning(message, this.toIncludeLocation(location));
  }

  public addError(message: string, location: SourceLocation): void {
    this.inner.addError(message, this.toIncludeLocation(location));
  }

  public getWarnings(): Diagnostic[] {
    return this.inner.getWarnings();
  }

  public getErrors(): Diagnostic[] {
    return this.inner.getErrors();
  }

  public hasErrors(): boolean {
    return this.inner.hasErrors();
  }

  private toIncludeLocation(location: SourceLocation): SourceLocation {
    if (isIncludeLocation(location)) {
      return {
        ...location,
        declaration: this.declaration,
        source: stripIncludeProvenance(location.source),
      };
    }
    if (!isSourceCodeLocation(location)) {
      throw new CompilerError(
        `Include diagnostics require a source-code location (got ${SourceLocationType[location.type] ?? location.type})`,
        location
      );
    }
    return {
      type: SourceLocationType.INCLUDE,
      file: this.file,
      declaration: this.declaration,
      source: stripIncludeProvenance(location),
    };
  }
}
