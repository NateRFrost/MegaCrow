import {
  type CompiledMegaloMetadata,
  pickLocalizedStringTableText,
  stringTableLanguageForLocale,
  stringTableLanguageIndex,
} from "@megacrow/megalo";
import { getIdeLocale } from "../localization";
import {
  getObjectListIconUrl,
  getReachGametypeIconUrl,
  megaloIconSymbolToIndex,
} from "./gametypeIcons";
import type { MegaloIncludeFileCache } from "./includeDiagnostics";
import { megaloCompileOptionsFromCache } from "./includeDiagnostics";
import {
  extractGvarFromBlf,
  type MegaloEngineData,
  type MegaloProgram,
  resolveStringSymbolFromProgram,
  tryExpandMegaloIncludes,
  tryParse,
} from "./megaloShim";
import {
  isObjectListsPath,
  isRecognizedObjectListName,
} from "./objectListsPath";

export type MegaloVersionProfileId = "107-mcc" | "107";

export interface VariantIdentity {
  description: string | null;
  iconIndex: number;
  iconUrl: string;
  /** Document kind — object lists always show their sidebar icon. */
  kind?: "gametype" | "object-list";
  name: string;
}

export interface MetadataField {
  chip?: string;
  editable?: boolean;
  label: string;
  secondary?: string;
  value: string;
}

export interface MetadataSection {
  fields: MetadataField[];
  title: string;
}

export interface GametypeMetadata {
  elements: MetadataSection[];
  loaded: boolean;
  variantIdentity: VariantIdentity | null;
}

export const MEGALO_VERSION_LABELS: Record<MegaloVersionProfileId, string> = {
  "107-mcc": "Halo: Reach - MCC",
  "107": "Xbox 360 TU1",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Basename without directory; strips common gametype/script extensions. */
export function displayFileStem(fileName: string | null | undefined): string {
  if (!fileName) {
    return "";
  }
  const base = fileName.replace(/\\/g, "/").split("/").pop() ?? fileName;
  return base.replace(/\.(bin|blf|meg|txt|mglo)$/i, "");
}

function formatTimestamp(date: Date | null | undefined): string {
  if (!date || Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString();
}

function formatXuid(xuid: bigint | null | undefined): string {
  if (xuid === null || xuid === undefined || xuid === 0n) {
    return "—";
  }
  return `0x${xuid.toString(16).toUpperCase()}`;
}

/** Reach stores Bungie-authored content under the broken-bar placeholder name. */
function formatAuthorName(name: string): string {
  const trimmed = name.trim();
  if (trimmed === "¦") {
    return "Bungie";
  }
  return trimmed;
}

/** Parse Megalo source, expanding workspace includes when a cache is available. */
export function parseProgramWithIncludes(
  source: string,
  includeCache?: MegaloIncludeFileCache
): MegaloProgram | null {
  if (includeCache?.sourceDir) {
    const expanded = tryExpandMegaloIncludes(
      source,
      megaloCompileOptionsFromCache(includeCache)
    );
    if (expanded.ok) {
      const parsed = tryParse(expanded.source);
      return parsed.ok ? parsed.program : null;
    }
  }
  const parsed = tryParse(source);
  return parsed.ok ? parsed.program : null;
}

export function resolveProgram(
  source: string,
  baseProgram: MegaloProgram | null,
  baselineSource?: string | null,
  includeCache?: MegaloIncludeFileCache
): MegaloProgram | null {
  const useBaseline =
    baseProgram &&
    baselineSource !== undefined &&
    baselineSource !== null &&
    source === baselineSource &&
    !includeCache?.sourceDir;

  if (useBaseline) {
    return baseProgram;
  }

  const parsed = parseProgramWithIncludes(source, includeCache);
  if (!parsed) {
    return baseProgram;
  }
  if (!baseProgram) {
    return parsed;
  }
  return {
    ...parsed,
    encodingVersion: baseProgram.encodingVersion,
    buildNumber: baseProgram.buildNumber,
    stringSymbolOrder:
      parsed.stringSymbolOrder ?? baseProgram.stringSymbolOrder,
  };
}

function findEngineData(
  program: MegaloProgram | null
): MegaloEngineData | null {
  if (!program) {
    return null;
  }
  for (const element of program.elements) {
    if (element.type === "engine_data") {
      return element.data;
    }
  }
  return null;
}

function resolveStringSymbol(
  program: MegaloProgram,
  symbol: string,
  fallbackProgram?: MegaloProgram | null
): string {
  const trimmed = symbol.trim();
  const resolved =
    resolveStringSymbolFromProgram(program, trimmed) ??
    (fallbackProgram
      ? resolveStringSymbolFromProgram(fallbackProgram, trimmed)
      : null);
  if (resolved != null) {
    return resolved;
  }
  return trimmed.replace(/^["']|["']$/g, "");
}

function readBinaryVariantIdentity(fileBytes: Uint8Array | null): {
  name: string;
  description: string;
  iconIndex: number;
} | null {
  if (!fileBytes) {
    return null;
  }
  try {
    const variant = extractGvarFromBlf(fileBytes);
    const custom = variant.m_custom_variant;
    const iconIndex = custom?.m_engine_icon ?? 0;
    const languageRow = preferredStringTableRowIndex();
    const localizedName =
      custom?.m_localized_name.strings[languageRow]?.[0]?.trim() ||
      custom?.m_localized_name.strings[0]?.[0]?.trim() ||
      "";
    const metadataName = variant.get_metadata().name?.trim() ?? "";
    const name = localizedName || metadataName;
    const localizedDescription =
      custom?.m_localized_description.strings[languageRow]?.[0]?.trim() ||
      custom?.m_localized_description.strings[0]?.[0]?.trim() ||
      "";
    const metadataDescription =
      variant.get_metadata().description?.trim() ?? "";
    const description = localizedDescription || metadataDescription;
    if (!name) {
      return { name: "", description, iconIndex };
    }
    return { name, description, iconIndex };
  } catch {
    return null;
  }
}

function resolveVariantIdentity(options: {
  program: MegaloProgram | null;
  baseProgram?: MegaloProgram | null;
  fileName: string | null;
  fileBytes: Uint8Array | null;
}): VariantIdentity | null {
  const { program, baseProgram, fileName, fileBytes } = options;
  const engineData = findEngineData(program);
  const binary = readBinaryVariantIdentity(fileBytes);

  let iconIndex = binary?.iconIndex ?? 0;
  if (engineData?.icon) {
    iconIndex = megaloIconSymbolToIndex(engineData.icon);
  }

  let name = "";
  if (engineData?.name && program) {
    name = resolveStringSymbol(program, engineData.name, baseProgram);
  }
  if (!name && binary?.name) {
    name = binary.name;
  }
  if (!name && fileName) {
    name = displayFileStem(fileName);
  }

  if (!name) {
    return null;
  }

  let description: string | null = null;
  if (engineData?.description && program) {
    const resolved = resolveStringSymbol(
      program,
      engineData.description,
      baseProgram
    ).trim();
    if (resolved) {
      description = resolved;
    }
  }
  if (!description && binary?.description) {
    description = binary.description;
  }

  return {
    name,
    description,
    iconIndex,
    iconUrl: getReachGametypeIconUrl(iconIndex),
  };
}

function readBinaryHistory(fileBytes: Uint8Array | null): {
  createdName: string;
  createdXuid: bigint;
  createdAt: Date;
  modifiedXuid: bigint;
} | null {
  if (!fileBytes) {
    return null;
  }
  try {
    const variant = extractGvarFromBlf(fileBytes);
    const meta = variant.get_metadata();
    return {
      createdName: meta.creation_history.name?.trim() ?? "",
      createdXuid: meta.creation_history.xuid,
      createdAt: meta.creation_history.timestamp,
      modifiedXuid: meta.modification_history.xuid,
    };
  } catch {
    return null;
  }
}

function sourceByteLength(source: string): number {
  return new TextEncoder().encode(source).length;
}

function displayLocalizedString(
  value: CompiledMegaloMetadata["name"] | undefined
): string {
  return pickLocalizedStringTableText(value);
}

function preferredStringTableRowIndex(): number {
  const language = stringTableLanguageForLocale(getIdeLocale());
  const index = stringTableLanguageIndex(language);
  return index >= 0 ? index : 0;
}

export function buildVariantIdentity(options: {
  source: string;
  baseProgram: MegaloProgram | null;
  baselineSource?: string | null;
  fileName: string | null;
  /** Absolute path when available (preferred for object-list detection). */
  absoluteFilePath?: string | null;
  /** Version-recognized object list filenames (e.g. `objects.txt`). */
  objectListNames?: readonly string[];
  fileBytes: Uint8Array | null;
  includeCache?: MegaloIncludeFileCache;
  /** Prefer compiler-emitted metadata when a compile succeeded. */
  compiledMetadata?: CompiledMegaloMetadata | null;
}): VariantIdentity | null {
  const pathForKind = options.absoluteFilePath ?? options.fileName;
  const basename =
    (options.fileName ?? pathForKind)?.replace(/\\/g, "/").split("/").pop() ??
    "";
  if (
    isObjectListsPath(pathForKind) &&
    basename.length > 0 &&
    isRecognizedObjectListName(basename, options.objectListNames ?? [])
  ) {
    const name = displayFileStem(options.fileName ?? pathForKind);
    if (!name) {
      return null;
    }
    return {
      kind: "object-list",
      name,
      description: "object list",
      iconIndex: -1,
      iconUrl: getObjectListIconUrl(),
    };
  }

  if (options.compiledMetadata) {
    const iconIndex = options.compiledMetadata.engineIcon ?? 0;
    const name =
      displayLocalizedString(options.compiledMetadata.name) ||
      displayFileStem(options.fileName) ||
      "";
    if (!name) {
      return null;
    }
    const description =
      displayLocalizedString(options.compiledMetadata.description) || null;
    return {
      name,
      description,
      iconIndex,
      iconUrl: getReachGametypeIconUrl(iconIndex),
    };
  }

  const program = resolveProgram(
    options.source,
    options.baseProgram,
    options.baselineSource,
    options.includeCache
  );
  return resolveVariantIdentity({
    program,
    baseProgram: options.baseProgram,
    fileName: options.fileName,
    fileBytes: options.fileBytes,
  });
}

export function buildGametypeMetadata(options: {
  source: string;
  baseProgram: MegaloProgram | null;
  fileName: string | null;
  fileBytes: Uint8Array | null;
  megaloVersionId: MegaloVersionProfileId;
  authorName: string;
  lastRecompiledAt: Date | null;
  compiledSize: number | null;
  includeCache?: MegaloIncludeFileCache;
}): GametypeMetadata {
  const {
    source,
    baseProgram,
    fileName,
    fileBytes,
    megaloVersionId,
    authorName,
    lastRecompiledAt,
    compiledSize,
    includeCache,
  } = options;

  if (!(baseProgram || fileName)) {
    return { elements: [], loaded: false, variantIdentity: null };
  }

  const program = resolveProgram(source, baseProgram, undefined, includeCache);
  const history = readBinaryHistory(fileBytes);
  const profileLabel = MEGALO_VERSION_LABELS[megaloVersionId];
  const variantIdentity = resolveVariantIdentity({
    program,
    baseProgram,
    fileName,
    fileBytes,
  });

  const elements: MetadataSection[] = [
    {
      title: "File",
      fields: [
        { label: "Name", value: fileName ?? "—" },
        { label: "Size .txt", value: formatBytes(sourceByteLength(source)) },
        {
          label: "Size Compiled",
          value: compiledSize === null ? "—" : formatBytes(compiledSize),
        },
      ],
    },
    {
      title: "Modified By",
      fields: [
        {
          label: "Name",
          value: authorName,
          editable: true,
        },
        {
          label: "Xuid",
          value: formatXuid(history?.modifiedXuid),
        },
        {
          label: "At",
          value: formatTimestamp(lastRecompiledAt),
        },
      ],
    },
    {
      title: "Created By",
      fields: [
        {
          label: "Name",
          value: formatAuthorName(history?.createdName ?? "") || "—",
        },
        {
          label: "Xuid",
          value: formatXuid(history?.createdXuid),
        },
        {
          label: "At",
          value: formatTimestamp(history?.createdAt),
        },
      ],
    },
    {
      title: `Variant (${profileLabel})`,
      fields: [
        {
          label: "Encoding Version",
          value: program === null ? "—" : String(program.encodingVersion),
        },
        {
          label: "Build Number",
          value: program === null ? "—" : String(program.buildNumber),
          ...(program?.buildNumber === -1 ? { chip: "untracked" } : {}),
        },
      ],
    },
  ];

  return { elements, loaded: true, variantIdentity };
}
