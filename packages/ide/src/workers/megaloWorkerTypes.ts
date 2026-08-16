import type { CompletionItem } from "@megacrow/megalo";
import type { SourceAnalysis } from "../lib/analyzeSource";
import type { MegaloDiagnostic } from "../lib/diagnostics";
import type { GametypeSaveFormat } from "../lib/gametypeSaveFormat";
import type { MegaloIncludeFileCache } from "../lib/includeDiagnostics";
import type { MegaCrowCompilerSettings } from "../lib/megaloCompilerSettings";
import type { MegaloProgram } from "../lib/megaloProgram";
import type { WorkspaceContext } from "../lib/workspace";

interface BaseResolveFields {
  baseJitDiagnostics?: MegaloDiagnostic[];
  includeCache?: MegaloIncludeFileCache;
  resolvedBaseCustomVariant?: import("@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352").c_game_engine_custom_variant;
  resolvedBaseCustomVariantMgloBytes?: Uint8Array;
  resolvedBaseProgram?: MegaloProgram | null;
}

export type MegaloWorkerRequest =
  | {
      kind: "init";
      originalBytes: Uint8Array | null;
      baseProgram: MegaloProgram | null;
      baselineSource: string | null;
    }
  | {
      kind: "setWorkspace";
      workspace: WorkspaceContext | null;
    }
  | {
      kind: "setCompilerSettings";
      compilerSettings: MegaCrowCompilerSettings;
    }
  | {
      kind: "setObjectLists";
      objectLists: import("@megacrow/megalo").ObjectLists | null;
    }
  | ({
      kind: "compile";
      id: number;
      source: string;
    } & BaseResolveFields)
  | ({
      kind: "parse";
      id: number;
      source: string;
    } & BaseResolveFields)
  | {
      kind: "completions";
      id: number;
      source: string;
      line: number;
      column: number;
    }
  | ({
      kind: "compileDownload";
      id: number;
      source: string;
      format: GametypeSaveFormat;
    } & BaseResolveFields);

export type MegaloWorkerResponse =
  | { kind: "compile"; id: number; source: string; analysis: SourceAnalysis }
  | {
      kind: "completions";
      id: number;
      items: CompletionItem[];
    }
  | {
      kind: "parse";
      id: number;
      program: MegaloProgram | null;
      analysis: SourceAnalysis;
    }
  | {
      kind: "compileDownload";
      id: number;
      output: Uint8Array | null;
      analysis: SourceAnalysis;
    };
