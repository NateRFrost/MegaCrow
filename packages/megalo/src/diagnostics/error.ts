import type { SourceLocation } from "src/diagnostics/index";

export class CompilerError extends Error {
  public readonly location?: SourceLocation;

  public constructor(message: string, location: SourceLocation) {
    super(message);
    this.location = location;
  }
}
