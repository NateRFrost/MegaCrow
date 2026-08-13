import type { ObjectListType } from "src/frontend/object-lists";

export type SourcePosition = {
  /** Offset within the owning file’s text (IDE / IncludeLocation.source). */
  localOffset: number;
  /** Offset in the unfurled program (temp packing / total order). */
  absoluteOffset: number;
  // Megalo does not support multi-line tokens, so tokens start and end on the same line.
  // However, SourcePosition is not just used for single token locations.
  line: number;
  column: number;
};

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

export type SourceCodeLocation = {
  type: SourceLocationType.SOURCE_CODE;
  start: SourcePosition;
  end: SourcePosition;
};

// Location of a diagnostic that originated inside an included file.
// Hosts should surface these on `declaration` in the parent document;
// `source` is the span within `file`.
export type IncludeLocation = {
  type: SourceLocationType.INCLUDE;
  file: string;
  // the "include foo.txt" line
  declaration: SourceCodeLocation;
  // the location within the foo.txt included file
  source: SourceCodeLocation;
};

export type BuiltInLocation = {
  type: SourceLocationType.BUILT_IN;
};


export type ObjectListLocation = {
  type: SourceLocationType.OBJECT_LIST;
  objectType: ObjectListType;
  source: SourcePosition;
};

export type SourceLocation =
  | SourceCodeLocation
  | IncludeLocation
  | BuiltInLocation
  | ObjectListLocation;

export const isBuiltInLocation = (location: SourceLocation): location is BuiltInLocation =>
  location.type === SourceLocationType.BUILT_IN;

export const isObjectListLocation = (location: SourceLocation): location is ObjectListLocation =>
  location.type === SourceLocationType.OBJECT_LIST;

export const isIncludeLocation = (location: SourceLocation): location is IncludeLocation =>
  location.type === SourceLocationType.INCLUDE;

export const isSourceCodeLocation = (location: SourceLocation): location is SourceCodeLocation =>
  location.type === SourceLocationType.SOURCE_CODE;

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Info = 2,
}

export type Diagnostic = {
  message: string;
  severity: DiagnosticSeverity;
  location: SourceLocation;
};

export class Diagnostics {
  private warnings: Diagnostic[] = [];
  private errors: Diagnostic[] = [];

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
