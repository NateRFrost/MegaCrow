import nagEn from "../data/motd/en.json";

export interface ReachNagMessage {
  button_key: string;
  button_key_wait: string;
  button_key_wait_time_ms: number;
  header: string;
  message: string;
  offer_id: number;
  title: string;
  title_index_identifier: number;
  view_count: number;
}

export interface MotdMessage {
  body: string;
  dismissLabel: string;
  header: string;
  id: string;
  imageAlt: string;
  imageUrl: string;
  title: string;
  /** How many times this message may appear at startup before it is hidden. */
  viewCount: number;
}

/** Reach-style newline markers in nag message strings. */
export function formatNagMessage(message: string): string {
  return message.replace(/\|n/g, "\n").trim();
}

/** Strip Reach controller-glyph prefix from button labels. */
export function formatNagButtonLabel(buttonKey: string): string {
  return buttonKey.replace(/^[\uE000-\uF8FF]+/u, "").trim();
}

export function nagToMotdMessage(
  nag: ReachNagMessage,
  imageUrl: string,
  imageAlt?: string
): MotdMessage {
  return {
    id: `nag-${nag.title_index_identifier}`,
    title: nag.title,
    header: nag.header.trim(),
    body: formatNagMessage(nag.message),
    imageUrl,
    imageAlt: imageAlt ?? nag.title,
    dismissLabel: formatNagButtonLabel(nag.button_key),
    viewCount: nag.view_count,
  };
}

/** Active MOTD — only one message is shown at a time. */
export const CURRENT_MOTD: MotdMessage = nagToMotdMessage(
  nagEn as ReachNagMessage,
  "/motd/en.jpg"
);

const STORAGE_KEY = "megacrow_motd_views";

type MotdViewState = Record<string, number>;

function readViewState(): MotdViewState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as MotdViewState;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeViewState(state: MotdViewState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures.
  }
}

export function getMotdViewCount(messageId: string): number {
  return readViewState()[messageId] ?? 0;
}

export function shouldShowMotdOnStartup(
  message: MotdMessage = CURRENT_MOTD
): boolean {
  return getMotdViewCount(message.id) < message.viewCount;
}

export function recordMotdView(messageId: string): number {
  const state = readViewState();
  const next = (state[messageId] ?? 0) + 1;
  state[messageId] = next;
  writeViewState(state);
  return next;
}
