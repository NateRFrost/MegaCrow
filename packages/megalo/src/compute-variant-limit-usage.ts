import { MegaloCompilerContext } from "src/context";
import { Diagnostics } from "src/diagnostics";
import { Lowerer } from "src/frontend/intermediate-representation";
import type { ObjectLists } from "src/frontend/object-lists";
import { analyzeDocumentSync } from "src/language-service/analyze";
import { ALL_MEGACROW_EXTENSIONS } from "src/megacrow-extensions";
import {
  buildVariantLimitUsage,
  type VariantLimitUsage,
} from "src/variant-limit-usage";
import type { SupportedMegaloVersion } from "src/version";

export type {
  VariantLimitItem,
  VariantLimitSection,
  VariantLimitUsage,
} from "src/variant-limit-usage";
export { buildVariantLimitUsage } from "src/variant-limit-usage";

export interface ComputeVariantLimitUsageOptions {
  objectLists?: ObjectLists;
  usedBytes?: number | null;
  version: SupportedMegaloVersion;
}

/**
 * Lex + parse + lower a script and report compile-time resource usage vs version limits.
 */
export const computeVariantLimitUsage = (
  source: string,
  options: ComputeVariantLimitUsageOptions
): VariantLimitUsage => {
  const snapshot = analyzeDocumentSync(source, {
    version: options.version,
    objectLists: options.objectLists,
  });
  const frontend = new MegaloCompilerContext(
    options.version,
    ALL_MEGACROW_EXTENSIONS
  );
  const diagnostics = new Diagnostics();
  const ir = new Lowerer(frontend).lower(snapshot.ast, diagnostics, {
    objectLists: options.objectLists,
  });
  return buildVariantLimitUsage(ir, frontend.versionConfiguration.limits, {
    ast: snapshot.ast,
    usedBytes: options.usedBytes,
  });
};
