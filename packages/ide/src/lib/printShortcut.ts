/** Stop Chromium/WebView print (Ctrl/Cmd+P) so it doesn't steal editor shortcuts. */
export function installPrintShortcutBlocker(): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (!(event.ctrlKey || event.metaKey)) {
      return;
    }
    if (event.key.toLowerCase() !== "p") {
      return;
    }
    event.preventDefault();
  };
  window.addEventListener("keydown", onKeyDown, true);
  return () => window.removeEventListener("keydown", onKeyDown, true);
}
