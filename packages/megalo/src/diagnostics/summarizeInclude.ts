import {
  type Diagnostic,
  DiagnosticSeverity,
  isIncludeLocation,
  type SourceCodeLocation,
  type SourceLocation,
  SourceLocationType,
} from "src/diagnostics/index";

export const includeDiagnosticSummaryMessage = (
  includePath: string,
  errorCount: number,
  warningCount: number
): string => {
  const parts: string[] = [];
  if (errorCount > 0) {
    parts.push(`${errorCount} ${errorCount === 1 ? "error" : "errors"}`);
  }
  if (warningCount > 0) {
    parts.push(
      `${warningCount} ${warningCount === 1 ? "warning" : "warnings"}`
    );
  }
  return `include ${includePath} contains ${parts.join(" and ")}`;
};

const displayNameFromPath = (path: string): string => {
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/");
  return parts.at(-1) || path;
};

const includePathFromDeclaration = (
  source: string | undefined,
  declaration: SourceCodeLocation,
  fallbackFile: string
): string => {
  if (source) {
    const start = Math.max(0, declaration.start.localOffset);
    const end = Math.max(start, declaration.end.localOffset);
    const span = source.slice(start, end);
    const quoted = /"([^"]+)"/.exec(span);
    if (quoted?.[1]) {
      return quoted[1];
    }
  }
  return displayNameFromPath(fallbackFile);
};

interface IncludeGroup {
  declaration: SourceCodeLocation;
  errorCount: number;
  fallbackFile: string;
  warningCount: number;
}

/**
 * Collapse per-span include diagnostics into one summary problem per include
 * directive (IDE / LSP hosts). Non-include diagnostics are passed through.
 */
export const summarizeIncludeDiagnostics = (
  diagnostics: readonly Diagnostic[],
  source?: string
): Diagnostic[] => {
  const passthrough: Diagnostic[] = [];
  const groups = new Map<number, IncludeGroup>();

  for (const diagnostic of diagnostics) {
    if (!isIncludeLocation(diagnostic.location)) {
      passthrough.push(diagnostic);
      continue;
    }

    const { declaration, file } = diagnostic.location;
    const key = declaration.start.localOffset;
    const existing = groups.get(key);
    if (existing === undefined) {
      groups.set(key, {
        declaration,
        fallbackFile: file,
        errorCount: diagnostic.severity === DiagnosticSeverity.Error ? 1 : 0,
        warningCount:
          diagnostic.severity === DiagnosticSeverity.Warning ? 1 : 0,
      });
      continue;
    }

    if (diagnostic.severity === DiagnosticSeverity.Error) {
      existing.errorCount += 1;
    } else if (diagnostic.severity === DiagnosticSeverity.Warning) {
      existing.warningCount += 1;
    }
  }

  const summaries: Diagnostic[] = [...groups.values()].map((group) => {
    const includePath = includePathFromDeclaration(
      source,
      group.declaration,
      group.fallbackFile
    );
    const severity =
      group.errorCount > 0
        ? DiagnosticSeverity.Error
        : DiagnosticSeverity.Warning;
    return {
      severity,
      message: includeDiagnosticSummaryMessage(
        includePath,
        group.errorCount,
        group.warningCount
      ),
      location: {
        type: SourceLocationType.INCLUDE,
        file: group.fallbackFile,
        declaration: group.declaration,
        source: group.declaration,
      } satisfies SourceLocation,
    };
  });

  return [...passthrough, ...summaries];
};
