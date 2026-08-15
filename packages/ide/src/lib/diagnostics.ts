export interface MegaloDiagnostic {
  column: number;
  endColumn?: number;
  length?: number;
  line: number;
  message: string;
  offset?: number;
  severity?: "error" | "warning";
  /**
   * No attributable source span (`UnknownLocation`). Show in the problems
   * tray only — never as an editor marker.
   */
  trayOnly?: boolean;
}
