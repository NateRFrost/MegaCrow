import { DEFAULT_SOURCE } from "./example";
import "./styles.css";
import {
  type Diagnostic,
  DiagnosticSeverity,
  type SourceLocation,
  SourceLocationType,
} from "../../frontend/diagnostics";
import {
  getLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  setLocale,
} from "../../frontend/localization";
import type { ObjectLists } from "../../frontend/object-lists";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  SaveGametypeRequest,
  SaveGametypeResponse,
  WorkerResponse,
} from "./analyze.types";
import AnalyzeWorker from "./analyze.worker.ts?worker";
import { renderJsonTree } from "./json-tree";
import { loadObjectLists } from "./object-lists";
import { createSourceEditor } from "./source-editor";

const LOCALE_STORAGE_KEY = "megalo-debugger-locale";
const DEBUG_PANES_STORAGE_KEY = "megalo-debugger-debug-panes";

const PARSE_DEBOUNCE_MS = 150;
const DOM_DEBOUNCE_MS = 400;
const SOURCE_SETTLE_MS = 250;
const MAX_DISPLAYED_DIAGNOSTICS = 200;

const debugLog = (event: string, details: Record<string, unknown> = {}): void => {
  console.log(`[megalo-debugger] ${event}`, {
    at: performance.now().toFixed(1),
    ...details,
  });
};

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("Missing #app root element.");
}

app.innerHTML = `
  <div class="app">
    <header class="toolbar">
      <h1>Megalo Debugger</h1>
      <a class="toolbar-link" href="/inspector">Inspector</a>
      <button type="button" class="toolbar-button" data-role="save-gametype">Save Gametype</button>
      <button
        type="button"
        class="toolbar-button"
        data-role="debug-panes-toggle"
        aria-pressed="true"
      >Debug Panes</button>
      <div
        class="locale-toggle"
        data-role="locale-toggle"
        role="group"
        aria-label="Language"
      >
        <button type="button" class="locale-toggle-button" data-locale="en">EN</button>
        <button type="button" class="locale-toggle-button" data-locale="ja">JA</button>
      </div>
      <span class="toolbar-status" data-role="token-count"></span>
      <span class="toolbar-status" data-role="total-time"></span>
    </header>
    <div class="workspace">
      <div class="panes">
        <section class="pane">
          <div class="pane-header">Source</div>
          <div class="source-editor" data-role="source-editor"></div>
        </section>
        <section class="pane" data-debug-pane>
          <div class="pane-header">
            Tokens
            <span class="pane-header-meta" data-role="token-time"></span>
          </div>
          <div class="output-view json-tree" data-role="tokens"></div>
        </section>
        <section class="pane" data-debug-pane>
          <div class="pane-header">AST
            <span class="pane-header-meta" data-role="ast-time"></span>
          </div>
          <div class="output-view json-tree" data-role="ast"></div>
        </section>
        <section class="pane" data-debug-pane>
          <div class="pane-header">IR
            <span class="pane-header-meta" data-role="ir-time"></span>
          </div>
          <div class="output-view json-tree" data-role="ir"></div>
        </section>
      </div>
      <section class="pane pane-symbols" data-debug-pane>
        <div class="pane-header">
          Symbol Table
          <span class="pane-header-meta" data-role="symbol-count"></span>
        </div>
        <div class="output-view json-tree" data-role="symbols"></div>
      </section>
    </div>
    <section class="diagnostics-panel">
      <div class="pane-header">
        Diagnostics
        <span class="pane-header-meta" data-role="diagnostics-count"></span>
      </div>
      <div class="diagnostics-list" data-role="diagnostics"></div>
    </section>
  </div>
`;

const sourceEditorHost = app.querySelector<HTMLElement>(
  '[data-role="source-editor"]'
);
const tokensView = app.querySelector<HTMLElement>('[data-role="tokens"]');
const astView = app.querySelector<HTMLElement>('[data-role="ast"]');
const astTime = app.querySelector<HTMLElement>('[data-role="ast-time"]');
const irView = app.querySelector<HTMLElement>('[data-role="ir"]');
const irTime = app.querySelector<HTMLElement>('[data-role="ir-time"]');
const symbolsView = app.querySelector<HTMLElement>('[data-role="symbols"]');
const symbolCount = app.querySelector<HTMLElement>(
  '[data-role="symbol-count"]'
);
const tokenCount = app.querySelector<HTMLElement>('[data-role="token-count"]');
const tokenTime = app.querySelector<HTMLElement>('[data-role="token-time"]');
const totalTime = app.querySelector<HTMLElement>('[data-role="total-time"]');
const diagnosticsView = app.querySelector<HTMLElement>(
  '[data-role="diagnostics"]'
);
const diagnosticsCount = app.querySelector<HTMLElement>(
  '[data-role="diagnostics-count"]'
);
const localeToggle = app.querySelector<HTMLElement>(
  '[data-role="locale-toggle"]'
);
const saveGametypeButton = app.querySelector<HTMLButtonElement>(
  '[data-role="save-gametype"]'
);
const debugPanesToggle = app.querySelector<HTMLButtonElement>(
  '[data-role="debug-panes-toggle"]'
);

if (
  !(
    sourceEditorHost &&
    tokensView &&
    astView &&
    irView &&
    irTime &&
    symbolsView &&
    symbolCount &&
    tokenCount &&
    tokenTime &&
    astTime &&
    totalTime &&
    diagnosticsView &&
    diagnosticsCount &&
    localeToggle &&
    saveGametypeButton &&
    debugPanesToggle
  )
) {
  throw new Error("Debugger layout failed to initialize.");
}

const localeButtons =
  localeToggle.querySelectorAll<HTMLButtonElement>("[data-locale]");
const sourceEditor = createSourceEditor(sourceEditorHost, DEFAULT_SOURCE);

const appContainer = app.querySelector<HTMLElement>(".app");
if (!appContainer) {
  throw new Error("Debugger layout failed to initialize.");
}

let debugPanesVisible = true;

const setDebugPanesVisible = (visible: boolean): void => {
  const changed = visible !== debugPanesVisible;
  debugPanesVisible = visible;
  appContainer.classList.toggle("is-debug-panes-hidden", !visible);
  debugPanesToggle.setAttribute("aria-pressed", String(visible));
  localStorage.setItem(DEBUG_PANES_STORAGE_KEY, visible ? "1" : "0");
  sourceEditor.layout();

  // Panes are not kept up to date while hidden; rebuild them on reveal.
  if (changed && visible) {
    scheduleDomFlush(true);
  }
};

debugPanesToggle.addEventListener("click", () => {
  setDebugPanesVisible(
    debugPanesToggle.getAttribute("aria-pressed") !== "true"
  );
});

const severityLabel = (severity: DiagnosticSeverity): string =>
  DiagnosticSeverity[severity] ?? String(severity);

const sourceSpan = (
  location: SourceLocation
):
  | { offset: number; line: number; column: number; endOffset: number }
  | undefined => {
  if (location.type === SourceLocationType.SOURCE_CODE) {
    return {
      offset: location.start.offset,
      line: location.start.line,
      column: location.start.column,
      endOffset: location.end.offset,
    };
  }
  if (location.type === SourceLocationType.OBJECT_LIST) {
    return {
      offset: location.source.offset,
      line: location.source.line,
      column: location.source.column,
      endOffset: location.source.offset,
    };
  }
  return;
};

const formatDiagnosticLocation = (diagnostic: Diagnostic): string => {
  const span = sourceSpan(diagnostic.location);
  if (span === undefined) {
    return diagnostic.location.type === SourceLocationType.BUILT_IN
      ? "built-in"
      : "—";
  }
  return `${span.line}:${span.column}`;
};

const sortDiagnostics = (diagnostics: Diagnostic[]): Diagnostic[] =>
  [...diagnostics].sort((left, right) => {
    const leftSpan = sourceSpan(left.location);
    const rightSpan = sourceSpan(right.location);
    if (leftSpan === undefined && rightSpan === undefined) {
      return 0;
    }
    if (leftSpan === undefined) {
      return 1;
    }
    if (rightSpan === undefined) {
      return -1;
    }
    return (
      leftSpan.offset - rightSpan.offset ||
      leftSpan.line - rightSpan.line ||
      leftSpan.column - rightSpan.column
    );
  });

const formatDiagnosticsSummary = (diagnostics: Diagnostic[]): string => {
  const errorCount = diagnostics.filter(
    (diagnostic) => diagnostic.severity === DiagnosticSeverity.Error
  ).length;
  const warningCount = diagnostics.filter(
    (diagnostic) => diagnostic.severity === DiagnosticSeverity.Warning
  ).length;

  if (errorCount === 0 && warningCount === 0) {
    return "none";
  }

  const parts: string[] = [];
  if (errorCount > 0) {
    parts.push(`${errorCount} error${errorCount === 1 ? "" : "s"}`);
  }
  if (warningCount > 0) {
    parts.push(`${warningCount} warning${warningCount === 1 ? "" : "s"}`);
  }
  return parts.join(", ");
};

const renderDiagnostics = (diagnostics: Diagnostic[]): void => {
  const items = sortDiagnostics(diagnostics);
  diagnosticsView.replaceChildren();

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "diagnostics-empty";
    empty.textContent = "No diagnostics.";
    diagnosticsView.append(empty);
    return;
  }

  const visible = items.slice(0, MAX_DISPLAYED_DIAGNOSTICS);
  for (const diagnostic of visible) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `diagnostics-item severity-${severityLabel(diagnostic.severity).toLowerCase()}`;
    button.textContent = `${severityLabel(diagnostic.severity).padEnd(7)} ${formatDiagnosticLocation(diagnostic).padEnd(8)} ${diagnostic.message}`;
    button.addEventListener("click", () => {
      sourceEditor.revealDiagnostic(diagnostic);
    });
    diagnosticsView.append(button);
  }

  if (items.length > MAX_DISPLAYED_DIAGNOSTICS) {
    const more = document.createElement("div");
    more.className = "diagnostics-more";
    more.textContent = `... ${items.length - MAX_DISPLAYED_DIAGNOSTICS} more diagnostic${items.length - MAX_DISPLAYED_DIAGNOSTICS === 1 ? "" : "s"}`;
    diagnosticsView.append(more);
  }
};

const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 1) {
    return `${(milliseconds * 1000).toFixed(0)} µs`;
  }
  if (milliseconds < 10) {
    return `${milliseconds.toFixed(2)} ms`;
  }
  return `${milliseconds.toFixed(1)} ms`;
};

const setTreeIfChanged = (
  element: HTMLElement,
  value: unknown,
  cache: { signature: string | null }
): void => {
  const signature = JSON.stringify(value);
  if (cache.signature === signature) {
    return;
  }

  renderJsonTree(element, value);
  cache.signature = signature;
};

const scheduleIdle = (callback: () => void, timeout: number): void => {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(callback, { timeout });
    return;
  }

  requestAnimationFrame(callback);
};

const scheduleIdleChain = (steps: Array<() => void>, timeout: number): void => {
  const runStep = (index: number): void => {
    if (index >= steps.length) {
      return;
    }

    scheduleIdle(() => {
      steps[index]!();
      runStep(index + 1);
    }, timeout);
  };

  runStep(0);
};

const analyzeWorker = new AnalyzeWorker();

analyzeWorker.onerror = (event) => {
  const detail = [
    event.message,
    event.filename && `${event.filename}:${event.lineno}:${event.colno}`,
    event.error instanceof Error ? event.error.stack : undefined,
  ]
    .filter(Boolean)
    .join("\n");
  console.error("[megalo-debugger] worker error", event, detail);
  saveGametypeButton.disabled = false;
  window.alert(`Analyze worker failed:\n${detail || "unknown error"}`);
};

analyzeWorker.onmessageerror = (event) => {
  console.error("[megalo-debugger] worker message error", event);
  saveGametypeButton.disabled = false;
};

let objectLists: ObjectLists = {};

let cachedSource: string | null = null;
const cachedTokens: { signature: string | null } = { signature: null };
const cachedAst: { signature: string | null } = { signature: null };
const cachedIr: { signature: string | null } = { signature: null };
const cachedSymbolTable: { signature: string | null } = { signature: null };
const cachedDiagnosticsSummary: { value: string | null } = { value: null };
let cachedDiagnosticsSignature: string | null = null;

let updateGeneration = 0;
let parseDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let domDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let sourceSettleTimer: ReturnType<typeof setTimeout> | null = null;
let latestResult: AnalyzeResponse | null = null;
let sourceEditorActive = false;
let domFlushPending = false;
const updateStartedAt = new Map<number, number>();

type UpdateOptions = {
  /** Re-translate diagnostics without re-rendering tokens/AST panes. */
  diagnosticsOnly?: boolean;
  /** Skip debounce for initial load and locale changes. */
  immediate?: boolean;
};

let pendingOptions: UpdateOptions = {};
let pendingSourceChanged = false;

const setSourceEditorActive = (active: boolean): void => {
  if (sourceEditorActive !== active) {
    debugLog("source-editor-active", { active });
  }
  sourceEditorActive = active;
  app.classList.toggle("is-editing-source", active);
};

const markSourceEditorActive = (): void => {
  setSourceEditorActive(true);
  cancelDomFlush();

  if (sourceSettleTimer !== null) {
    clearTimeout(sourceSettleTimer);
  }

  sourceSettleTimer = setTimeout(() => {
    sourceSettleTimer = null;
    setSourceEditorActive(false);

    if (domFlushPending) {
      debugLog("source-settled-flush-pending", {
        generation: updateGeneration,
      });
      domFlushPending = false;
      scheduleDomFlush();
    }
  }, SOURCE_SETTLE_MS);
};

const diagnosticsSignature = (diagnostics: Diagnostic[]): string =>
  diagnostics
    .map((diagnostic) => {
      const span = sourceSpan(diagnostic.location);
      const range =
        span === undefined
          ? String(diagnostic.location.type)
          : `${span.offset}:${span.endOffset}`;
      return `${diagnostic.severity}:${range}:${diagnostic.message}`;
    })
    .join("\n");

const flushDom = (): void => {
  const result = latestResult;
  if (!result || result.id !== updateGeneration) {
    debugLog("flush-skipped-no-current-result", {
      resultId: result?.id,
      generation: updateGeneration,
    });
    return;
  }

  if (sourceEditorActive) {
    debugLog("flush-deferred-editor-active", {
      generation: updateGeneration,
      diagnostics: result.diagnostics.length,
    });
    domFlushPending = true;
    return;
  }

  const options = pendingOptions;
  const sourceChanged = pendingSourceChanged;

  const isCurrent = (): boolean =>
    !!latestResult && latestResult.id === updateGeneration;

  const steps: Array<() => void> = [
    () => {
      debugLog("timings-applied", {
        generation: result.id,
        lexMs: result.lexDuration,
        parseMs: result.parseDuration,
        lowerMs: result.lowerDuration,
      });
      tokenCount.textContent = `${result.tokenCount} token${result.tokenCount === 1 ? "" : "s"}`;
      tokenTime.textContent = formatDuration(result.lexDuration);
      astTime.textContent = formatDuration(result.parseDuration);
      irTime.textContent = formatDuration(result.lowerDuration);
      totalTime.textContent = formatDuration(
        result.lexDuration + result.parseDuration + result.lowerDuration
      );
    },
    // Diagnostics drive the source editor highlighting, so apply them before
    // the (optional, expensive) debug pane trees are rebuilt.
    () => {
      if (!isCurrent()) {
        return;
      }

      const signature = diagnosticsSignature(result.diagnostics);
      if (cachedDiagnosticsSignature !== signature) {
        debugLog("diagnostics-applying", {
          generation: result.id,
          count: result.diagnostics.length,
          diagnostics: result.diagnostics.map((diagnostic) => ({
            severity: diagnostic.severity,
            message: diagnostic.message,
            location: diagnostic.location,
          })),
        });
        renderDiagnostics(result.diagnostics);
        sourceEditor.setDiagnostics(result.diagnostics);
        cachedDiagnosticsSignature = signature;
        debugLog("diagnostics-applied", {
          generation: result.id,
          count: result.diagnostics.length,
        });
      } else {
        debugLog("diagnostics-skipped-same-signature", {
          generation: result.id,
          count: result.diagnostics.length,
        });
      }

      const diagnosticsSummary = formatDiagnosticsSummary(result.diagnostics);
      if (cachedDiagnosticsSummary.value !== diagnosticsSummary) {
        diagnosticsCount.textContent = diagnosticsSummary;
        cachedDiagnosticsSummary.value = diagnosticsSummary;
      }
    },
  ];

  // Building the debug pane trees is only useful when the panes are visible.
  if (debugPanesVisible) {
    steps.push(
      () => {
        if (isCurrent() && (!options.diagnosticsOnly || sourceChanged)) {
          setTreeIfChanged(tokensView, result.tokens, cachedTokens);
        }
      },
      () => {
        if (isCurrent() && (!options.diagnosticsOnly || sourceChanged)) {
          setTreeIfChanged(astView, result.ast, cachedAst);
        }
      },
      () => {
        if (isCurrent() && (!options.diagnosticsOnly || sourceChanged)) {
          setTreeIfChanged(symbolsView, result.symbolTable, cachedSymbolTable);
          symbolCount.textContent = `${result.symbolCount} symbol${result.symbolCount === 1 ? "" : "s"}`;
        }
      },
      () => {
        if (isCurrent() && (!options.diagnosticsOnly || sourceChanged)) {
          setTreeIfChanged(irView, result.ir, cachedIr);
        }
      }
    );
  }

  debugLog("flush-scheduled-idle-chain", {
    generation: result.id,
    steps: steps.length,
    debugPanesVisible,
  });
  scheduleIdleChain(steps, 500);
};

const scheduleDomFlush = (immediate = false): void => {
  if (!immediate && sourceEditorActive) {
    debugLog("dom-flush-held-for-editor", {
      generation: updateGeneration,
    });
    domFlushPending = true;
    return;
  }

  if (domDebounceTimer !== null) {
    clearTimeout(domDebounceTimer);
    domDebounceTimer = null;
  }

  if (immediate) {
    debugLog("dom-flush-immediate", { generation: updateGeneration });
    flushDom();
    return;
  }

  debugLog("dom-flush-debounced", {
    generation: updateGeneration,
    delayMs: DOM_DEBOUNCE_MS,
  });
  domDebounceTimer = setTimeout(() => {
    domDebounceTimer = null;
    flushDom();
  }, DOM_DEBOUNCE_MS);
};

const cancelDomFlush = (): void => {
  if (domDebounceTimer !== null) {
    clearTimeout(domDebounceTimer);
    domDebounceTimer = null;
  }
};

analyzeWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
  const response = event.data;

  if (response.type === "saveGametype") {
    handleSaveGametypeResponse(response);
    return;
  }

  if (response.id !== updateGeneration) {
    debugLog("worker-response-stale", {
      responseId: response.id,
      generation: updateGeneration,
    });
    updateStartedAt.delete(response.id);
    return;
  }

  const startedAt = updateStartedAt.get(response.id);
  updateStartedAt.delete(response.id);
  debugLog("worker-response-current", {
    generation: response.id,
    elapsedMs:
      startedAt === undefined ? undefined : performance.now() - startedAt,
    diagnostics: response.diagnostics.length,
    errors: response.diagnostics.filter(
      (diagnostic) => diagnostic.severity === DiagnosticSeverity.Error
    ).length,
    warnings: response.diagnostics.filter(
      (diagnostic) => diagnostic.severity === DiagnosticSeverity.Warning
    ).length,
    sourceEditorActive,
  });
  latestResult = response;
  scheduleDomFlush(pendingOptions.immediate === true);
};

const downloadArrayBuffer = (data: ArrayBuffer, filename: string): void => {
  const blob = new Blob([data], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

let saveGeneration = 0;

const handleSaveGametypeResponse = (response: SaveGametypeResponse): void => {
  if (response.id !== saveGeneration) {
    return;
  }

  saveGametypeButton.disabled = false;

  const errorCount = response.diagnostics.filter(
    (diagnostic) => diagnostic.severity === DiagnosticSeverity.Error
  ).length;
  const succeeded = response.error === undefined && errorCount === 0;

  console.log(
    succeeded
      ? "Compile finished: success"
      : `Compile finished: failed (${errorCount} error${errorCount === 1 ? "" : "s"}${response.error === undefined ? "" : `, ${response.error}`})`
  );

  if (response.error !== undefined) {
    window.alert(`Failed to save gametype:\n${response.error}`);
    return;
  }

  if (response.data === undefined) {
    window.alert("Failed to save gametype: no data returned.");
    return;
  }

  downloadArrayBuffer(response.data, "gametype.mglo");
};

const saveGametype = (): void => {
  const id = ++saveGeneration;
  saveGametypeButton.disabled = true;
  console.log("Compile started");

  const request: SaveGametypeRequest = {
    type: "saveGametype",
    id,
    source: sourceEditor.getValue(),
    locale: getLocale(),
    objectLists,
  };

  analyzeWorker.postMessage(request);
};

saveGametypeButton.addEventListener("click", () => {
  saveGametype();
});

const runUpdate = (options: UpdateOptions = {}): void => {
  const generation = ++updateGeneration;
  const source = sourceEditor.getValue();
  pendingOptions = options;
  pendingSourceChanged = source !== cachedSource;
  cachedSource = source;

  const request: AnalyzeRequest = {
    type: "analyze",
    id: generation,
    source,
    locale: getLocale(),
    objectLists,
  };

  updateStartedAt.set(generation, performance.now());
  debugLog("worker-request", {
    generation,
    sourceLength: source.length,
    sourceChanged: pendingSourceChanged,
    options,
  });
  analyzeWorker.postMessage(request);
};

const scheduleUpdate = (options: UpdateOptions = {}): void => {
  if (options.immediate) {
    debugLog("update-scheduled-immediate", { options });
    if (parseDebounceTimer !== null) {
      clearTimeout(parseDebounceTimer);
      parseDebounceTimer = null;
    }
    runUpdate(options);
    return;
  }

  if (parseDebounceTimer !== null) {
    debugLog("update-debounce-replaced", {
      generation: updateGeneration,
    });
    clearTimeout(parseDebounceTimer);
  }

  debugLog("update-scheduled-debounced", {
    generation: updateGeneration + 1,
    delayMs: PARSE_DEBOUNCE_MS,
  });
  parseDebounceTimer = setTimeout(() => {
    parseDebounceTimer = null;
    runUpdate(options);
  }, PARSE_DEBOUNCE_MS);
};

const syncLocaleToggle = (locale: SupportedLocale): void => {
  for (const button of localeButtons) {
    button.classList.toggle("is-active", button.dataset.locale === locale);
  }
};

const applyLocale = (locale: SupportedLocale): void => {
  setLocale(locale);
  syncLocaleToggle(locale);
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  scheduleUpdate({ diagnosticsOnly: true, immediate: true });
};

for (const button of localeButtons) {
  button.addEventListener("click", () => {
    const locale = button.dataset.locale;
    if (!(locale && SUPPORTED_LOCALES.includes(locale as SupportedLocale))) {
      return;
    }

    if (locale !== getLocale()) {
      applyLocale(locale as SupportedLocale);
    }
  });
}

sourceEditor.onDidChangeContent(() => {
  debugLog("source-content-changed", {
    sourceLength: sourceEditor.getValue().length,
  });
  markSourceEditorActive();
  scheduleUpdate();
});

sourceEditor.onDidInteract(() => {
  markSourceEditorActive();
});

const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
const initialLocale: SupportedLocale =
  storedLocale === "en" || storedLocale === "ja" ? storedLocale : "en";

applyLocale(initialLocale);

const storedDebugPanes = localStorage.getItem(DEBUG_PANES_STORAGE_KEY);
setDebugPanesVisible(storedDebugPanes !== "0");

objectLists = loadObjectLists("107-mcc");
scheduleUpdate({ immediate: true });
