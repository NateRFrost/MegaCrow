import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { isTauriRuntime } from "./tauriRuntime";

const DOCS_LABEL = "docs";
/** Frameless shell with window chrome; VitePress loads in an iframe. */
const DOCS_APP_URL = "docs-window.html";

export async function openDocs(): Promise<void> {
  if (!isTauriRuntime()) {
    // Browser chrome already provides Back / Forward.
    window.open(`${import.meta.env.BASE_URL}docs/`, "megacrow-docs");
    return;
  }

  const existing = await WebviewWindow.getByLabel(DOCS_LABEL);
  if (existing) {
    await existing.setFocus();
    return;
  }

  const webview = new WebviewWindow(DOCS_LABEL, {
    url: DOCS_APP_URL,
    title: "MegaCrow Docs",
    width: 1100,
    height: 800,
    minWidth: 640,
    minHeight: 480,
    center: true,
    focus: true,
    decorations: false,
    resizable: true,
    // Match CSS `--bg-app` so the window isn't white before the page paints.
    backgroundColor: "#1e1e1e",
  });

  await new Promise<void>((resolve, reject) => {
    void webview.once("tauri://created", () => resolve());
    void webview.once("tauri://error", (event) => {
      reject(
        new Error(
          typeof event.payload === "string"
            ? event.payload
            : "Failed to open docs window"
        )
      );
    });
  });
}
