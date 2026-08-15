import { useMemo } from "react";
import type { SourceAnalysis } from "../lib/analyzeSource";
import { buildVariantIdentity } from "../lib/gametypeMetadata";
import type { MegaloIncludeFileCache } from "../lib/includeDiagnostics";
import type { MegaloProgram } from "../lib/megaloShim";

interface Props {
  baselineSource?: string | null;
  baseProgram: MegaloProgram | null;
  compiledMetadata?: SourceAnalysis["compiledMetadata"];
  fileBytes: Uint8Array | null;
  fileName: string | null;
  includeCache?: MegaloIncludeFileCache;
  source: string;
}

export function SidebarVariantHeader({
  source,
  baseProgram,
  baselineSource,
  fileName,
  fileBytes,
  includeCache,
  compiledMetadata,
}: Props) {
  const variantIdentity = useMemo(
    () =>
      buildVariantIdentity({
        source,
        baseProgram,
        baselineSource,
        fileName,
        fileBytes,
        includeCache,
        compiledMetadata,
      }),
    [
      source,
      baseProgram,
      baselineSource,
      fileName,
      fileBytes,
      includeCache,
      compiledMetadata,
    ]
  );

  if (!variantIdentity) {
    return (
      <div className="sidebar-variant sidebar-variant--empty">
        <div className="sidebar-variant-text">
          <p className="sidebar-variant-hint">
            Open a file to see variant details
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-variant">
      {compiledMetadata ? (
        <img
          alt=""
          className="sidebar-variant-icon"
          src={variantIdentity.iconUrl}
        />
      ) : null}
      <div className="sidebar-variant-text">
        <h2 className="sidebar-variant-name">{variantIdentity.name}</h2>
        {variantIdentity.description ? (
          <p className="sidebar-variant-description">
            {variantIdentity.description}
          </p>
        ) : (
          <p className="sidebar-variant-description sidebar-variant-description--empty">
            &nbsp;
          </p>
        )}
      </div>
    </div>
  );
}
