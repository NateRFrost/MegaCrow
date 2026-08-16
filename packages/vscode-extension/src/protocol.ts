/**
 * Custom Megacrow LSP methods the server sends to the client for FS access.
 */
export const MEGACROW_RESOLVE_INCLUDE_METHOD = "megacrow/resolveInclude";
export const MEGACROW_RESOLVE_BASE_FILE_METHOD = "megacrow/resolveBaseFile";
export const MEGACROW_LIST_DIRECTORY_METHOD = "megacrow/listDirectory";
export const MEGACROW_SET_LOCALE_METHOD = "megacrow/setLocale";
export const MEGACROW_SET_MEGACROW_EXTENSIONS_METHOD =
  "megacrow/setMegacrowExtensions";
export const MEGACROW_SET_COMPILER_SETTINGS_METHOD =
  "megacrow/setCompilerSettings";
export const MEGACROW_SET_MEGALO_VERSION_METHOD = "megacrow/setMegaloVersion";

export interface ResolveIncludeParams {
  fromUri?: string;
  kind: "include" | "localized_include";
  path: string;
}

export type ResolveIncludeResult =
  | { text: string; uri: string }
  | { error: string };

export interface ResolveBaseFileParams {
  fromUri?: string;
  path: string;
}

export type ResolveBaseFileResult = { dataBase64: string } | { error: string };

export interface ListDirectoryParams {
  directory: string;
  fromUri?: string;
}

export type ListDirectoryResult =
  | { entries: Array<{ name: string; directory: boolean }> }
  | { error: string };
