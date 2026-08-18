import {
  TRIGGER_EXECUTION_KINDS,
  type TriggerExecutionKind,
} from "src/frontend/language-configuration/omni/triggers";
import type { SupportedMegaloVersion } from "src/version";

/** Trigger kinds offered in completion for the active Megalo encoding. */
export const suggestableTriggerExecutionKinds = (
  version: SupportedMegaloVersion
): readonly TriggerExecutionKind[] => {
  let kinds: readonly TriggerExecutionKind[] = TRIGGER_EXECUTION_KINDS;
  // `double_migration` index exists from Release (106)+.
  if (version.version < 106) {
    kinds = kinds.filter((kind) => kind !== "double_migration");
  }
  return kinds;
};
