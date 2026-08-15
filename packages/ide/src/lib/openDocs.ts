import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { isTauriRuntime } from "./tauriRuntime";

const DOCS_LABEL = "docs";
const DOCS_PATH = "/docs/";
const DOCS_APP_URL = "docs/index.html";

export async function openDocs(): Promise<void> {
  if (!isTauriRuntime()) {
    window.open(DOCS_PATH, "megacrow-docs");
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
    decorations: true,
    resizable: true,
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
