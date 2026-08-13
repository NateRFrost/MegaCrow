import type { ObjectListType } from "src/frontend/object-lists";

export interface SourcePosition {
  /** Offset in the unfurled program (temp packing / total order). */
  absoluteOffset: number;
  column: number;
  // Megalo does not support multi-line tokens, so tokens start and end on the same line.
  // However, SourcePosition is not just used for single token locations.
  line: number;
  /** Offset within the owning file’s text (IDE / IncludeLocation.source). */
  localOffset: number;
}

export const BUILT_IN_POSITION: SourcePosition = {
  localOffset: -1,
  absoluteOffset: -1,
  line: -1,
  column: -1,
};

export enum SourceLocationType {
  SOURCE_CODE = 0,
  INCLUDE = 1,
  BUILT_IN = 2,
  OBJECT_LIST = 3,
}

export const BUILT_IN_LOCATION: BuiltInLocation = {
  type: SourceLocationType.BUILT_IN,
};

export interface SourceCodeLocation {
  end: SourcePosition;
  start: SourcePosition;
  type: SourceLocationType.SOURCE_CODE;
}

// Location of a diagnostic that originated inside an included file.
// Hosts should surface these on `declaration` in the parent document;
// `source` is the span within `file`.
export interface IncludeLocation {
  // the "include foo.txt" line
  declaration: SourceCodeLocation;
  file: string;
  // the location within the foo.txt included file
  source: SourceCodeLocation;
  type: SourceLocationType.INCLUDE;
}

export interface BuiltInLocation {
  type: SourceLocationType.BUILT_IN;
}

export interface ObjectListLocation {
  objectType: ObjectListType;
  source: SourcePosition;
  type: SourceLocationType.OBJECT_LIST;
}

export type SourceLocation =
  | SourceCodeLocation
  | IncludeLocation
  | BuiltInLocation
  | ObjectListLocation;

export const isBuiltInLocation = (
  location: SourceLocation
): location is BuiltInLocation => location.type === SourceLocationType.BUILT_IN;

export const isObjectListLocation = (
  location: SourceLocation
): location is ObjectListLocation =>
  location.type === SourceLocationType.OBJECT_LIST;

export const isIncludeLocation = (
  location: SourceLocation
): location is IncludeLocation => location.type === SourceLocationType.INCLUDE;

export const isSourceCodeLocation = (
  location: SourceLocation
): location is SourceCodeLocation =>
  location.type === SourceLocationType.SOURCE_CODE;

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Info = 2,
}

export interface Diagnostic {
  location: SourceLocation;
  message: string;
  severity: DiagnosticSeverity;
}

export class Diagnostics {
  private readonly warnings: Diagnostic[] = [];
  private readonly errors: Diagnostic[] = [];

  public addWarning(message: string, location: SourceLocation): void {
    this.warnings.push({
      message,
      severity: DiagnosticSeverity.Warning,
      location,
    });
  }

  public addError(message: string, location: SourceLocation): void {
    this.errors.push({ message, severity: DiagnosticSeverity.Error, location });
  }

  public getWarnings(): Diagnostic[] {
    return this.warnings;
  }

  public getErrors(): Diagnostic[] {
    return this.errors;
  }

  public hasErrors(): boolean {
    return this.errors.length > 0;
  }
}
