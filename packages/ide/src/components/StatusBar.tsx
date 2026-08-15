import { useRef } from "react";
import type { CompileState } from "../lib/analyzeSource";
import type { VariantLimitUsage } from "../lib/megaloShim";
import { StatusIcon } from "./StatusIcon";
import { VariantCapacityMeter } from "./VariantCapacityMeter";

interface Props {
  byteDiffCount: number | null;
  byteIdentical: boolean | null;
  column: number;
  compileState: CompileState;
  diagnosticsOpen: boolean;
  errorCount: number;
  line: number;
  megaCrowVersion: string;
  megaloVersionId: string;
  message: string;
  onToggleDiagnostics: () => void;
  variantBytes: number | null;
  variantCapacity: number;
  variantLimitUsage: VariantLimitUsage | null;
  warningCount: number;
}

function isTransientCompileState(state: CompileState): boolean {
  return state === "parsing";
}

function useBarColorState(compileState: CompileState): CompileState {
  const lastSettledState = useRef<CompileState>("idle");
  if (!isTransientCompileState(compileState)) {
    lastSettledState.current = compileState;
  }
  return isTransientCompileState(compileState)
    ? lastSettledState.current
    : compileState;
}

function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function statusToggleLabel(
  state: CompileState,
  errorCount: number,
  warningCount: number
): string {
  switch (state) {
    case "idle":
      return "Ready";
    case "parsing":
      return "Compiling…";
    case "ok":
      return "Ok";
    case "warn":
      return formatCount(warningCount, "Warning", "Warnings");
    case "error": {
      const errors = formatCount(errorCount, "Error", "Errors");
      if (warningCount > 0) {
        return `${errors} ${formatCount(warningCount, "Warning", "Warnings")}`;
      }
      return errors;
    }
  }
}

export function StatusBar({
  compileState,
  message,
  errorCount,
  warningCount,
  byteIdentical,
  byteDiffCount,
  megaCrowVersion,
  megaloVersionId,
  line,
  column,
  variantBytes,
  variantCapacity,
  variantLimitUsage,
  diagnosticsOpen,
  onToggleDiagnostics,
}: Props) {
  const barColorState = useBarColorState(compileState);
  const label = statusToggleLabel(compileState, errorCount, warningCount);

  return (
    <footer className={`status-bar status-bar--${barColorState}`}>
      <div className="status-bar-left">
        <button
          aria-pressed={diagnosticsOpen}
          className="status-problems"
          onClick={onToggleDiagnostics}
          title={diagnosticsOpen ? "Hide problems" : "Show problems"}
          type="button"
        >
          <StatusIcon state={compileState} />
          <span className={`status-label status-label--${compileState}`}>
            {label}
          </span>
        </button>
        {byteIdentical === true && (
          <span className="status-chip status-chip--ok">byte-identical</span>
        )}
        {byteIdentical === false &&
          byteDiffCount !== null &&
          byteDiffCount > 0 && (
            <span className="status-chip status-chip--warn">
              {byteDiffCount} byte diff
            </span>
          )}
      </div>
      <div className="status-bar-center" title={message}>
        {message}
      </div>
      <div className="status-bar-right">
        <VariantCapacityMeter
          capacityBytes={variantCapacity}
          limitUsage={variantLimitUsage}
          usedBytes={variantBytes}
        />
        <span>
          Ln {line}, Col {column}
        </span>
        <span title={`MegaCrow ${megaCrowVersion}`}>
          MegaCrow {megaCrowVersion}
        </span>
        <span title={`Megalo ${megaloVersionId}`}>
          Megalo {megaloVersionId}
        </span>
      </div>
    </footer>
  );
}
