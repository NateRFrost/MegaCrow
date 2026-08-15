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

export const SENTINEL_POSITION: SourcePosition = {
  localOffset: -1,
  absoluteOffset: -1,
  line: -1,
  column: -1,
};

export const BUILT_IN_POSITION: SourcePosition = SENTINEL_POSITION;
export const OPEN_ENDED_POSITION: SourcePosition = SENTINEL_POSITION;

export enum SourceLocationType {
  SOURCE_CODE = 0,
  INCLUDE = 1,
  BUILT_IN = 2,
  OBJECT_LIST = 3,
  UNKNOWN = 4,
}

export const BUILT_IN_LOCATION: BuiltInLocation = {
  type: SourceLocationType.BUILT_IN,
};

export const UNKNOWN_LOCATION: UnknownLocation = {
  type: SourceLocationType.UNKNOWN,
};

/** Provenance for a span that was lexed inside an included file. */
export interface IncludeProvenance {
  /** Include directive in the outermost open document (or next outer file). */
  declaration: SourceCodeLocation;
  file: string;
}

export interface SourceCodeLocation {
  end: SourcePosition;
  /**
   * Set on tokens/AST spans from included files so IR-time diagnostics
   * (which bypass {@link IncludeDiagnostics}) can still become
   * {@link IncludeLocation}.
   */
  include?: IncludeProvenance;
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

/** Drop include provenance (e.g. when storing as IncludeLocation.source). */
export const stripIncludeProvenance = (
  location: SourceCodeLocation
): SourceCodeLocation => ({
  type: SourceLocationType.SOURCE_CODE,
  start: location.start,
  end: location.end,
});

/** Walk include provenance to the outermost root-document declaration. */
export const rootIncludeDeclaration = (
  location: SourceCodeLocation
): SourceCodeLocation => {
  let current = location;
  while (current.include) {
    current = current.include.declaration;
  }
  return stripIncludeProvenance(current);
};

/** Span from `start` through `end`, preserving include provenance from `start`. */
export const spanSourceCodeLocations = (
  start: SourceCodeLocation,
  end: SourceCodeLocation
): SourceCodeLocation => ({
  type: SourceLocationType.SOURCE_CODE,
  start: start.start,
  end: end.end,
  ...(start.include ? { include: start.include } : {}),
});

export interface BuiltInLocation {
  type: SourceLocationType.BUILT_IN;
}

export interface ObjectListLocation {
  objectType: ObjectListType;
  source: SourcePosition;
  type: SourceLocationType.OBJECT_LIST;
}

export interface UnknownLocation {
  type: SourceLocationType.UNKNOWN;
}

export type SourceLocation =
  | SourceCodeLocation
  | IncludeLocation
  | BuiltInLocation
  | ObjectListLocation
  | UnknownLocation;

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

export const isUnknownLocation = (
  location: SourceLocation
): location is UnknownLocation => location.type === SourceLocationType.UNKNOWN;

/** Promote include-stamped source spans to IncludeLocation for hosts. */
export const normalizeDiagnosticLocation = (
  location: SourceLocation
): SourceLocation => {
  if (!isSourceCodeLocation(location) || location.include === undefined) {
    return location;
  }
  return {
    type: SourceLocationType.INCLUDE,
    file: location.include.file,
    declaration: rootIncludeDeclaration(location.include.declaration),
    source: stripIncludeProvenance(location),
  };
};

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
      location: normalizeDiagnosticLocation(location),
    });
  }

  public addError(message: string, location: SourceLocation): void {
    this.errors.push({
      message,
      severity: DiagnosticSeverity.Error,
      location: normalizeDiagnosticLocation(location),
    });
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
