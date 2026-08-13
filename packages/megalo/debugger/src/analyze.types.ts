import type { Diagnostic } from "../../src/diagnostics";
import type { ObjectLists } from "../../src/frontend/object-lists";
import type { SupportedLocale } from "../../src/localization";

export interface AnalyzeRequest {
  id: number;
  locale: SupportedLocale;
  objectLists: ObjectLists;
  source: string;
  type: "analyze";
}

export interface AnalyzeResponse {
  ast: unknown;
  diagnostics: Diagnostic[];
  id: number;
  ir: unknown;
  lexDuration: number;
  lowerDuration: number;
  parseDuration: number;
  symbolCount: number;
  symbolTable: unknown;
  tokenCount: number;
  tokens: unknown;
  type: "analyze";
}

export interface SaveGametypeRequest {
  id: number;
  locale: SupportedLocale;
  objectLists: ObjectLists;
  source: string;
  type: "saveGametype";
}

export interface SaveGametypeResponse {
  data?: ArrayBuffer;
  diagnostics: Diagnostic[];
  error?: string;
  id: number;
  type: "saveGametype";
}

export type WorkerRequest = AnalyzeRequest | SaveGametypeRequest;
export type WorkerResponse = AnalyzeResponse | SaveGametypeResponse;
