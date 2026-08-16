import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { VariantLimitItem, VariantLimitUsage } from "../lib/megaloShim";
import {
  formatVariantBytes,
  variantCapacityLevel,
} from "../lib/variantCapacity";

const PANEL_WIDTH = 360;
const PANEL_MAX_HEIGHT = 520;

const VARIABLE_SCOPE_ORDER = [
  "Global",
  "Player",
  "Team",
  "Object",
  "Temporary",
] as const;

type PopoverSection =
  | {
      id: string;
      items: VariantLimitItem[];
      kind: "meters";
      title: string;
    }
  | {
      id: string;
      items: VariantLimitItem[];
      kind: "variables";
      title: string;
    };

function formatLimitValue(item: VariantLimitItem): string {
  if (item.format === "bytes") {
    return `${formatVariantBytes(item.used)} / ${formatVariantBytes(item.max)}`;
  }
  return `${item.used.toLocaleString()} / ${item.max.toLocaleString()}`;
}

function splitVariableLabel(label: string): { scope: string; type: string } {
  const match = /^(\S+)\s+(.+)$/.exec(label);
  return {
    scope: match?.[1] ?? "Other",
    type: match?.[2] ?? label,
  };
}

function buildPopoverSections(items: VariantLimitItem[]): PopoverSection[] {
  const bySection = {
    storage: items.filter((item) => item.section === "storage"),
    script: items.filter((item) => item.section === "script"),
    strings: items.filter((item) => item.section === "strings"),
    variables: items.filter((item) => item.section === "variables"),
    declarations: items.filter((item) => item.section === "declarations"),
  };

  const sections: PopoverSection[] = [];

  if (bySection.storage.length > 0) {
    sections.push({
      id: "storage",
      kind: "meters",
      title: "Storage",
      items: bySection.storage,
    });
  }
  if (bySection.script.length > 0) {
    sections.push({
      id: "script",
      kind: "meters",
      title: "Script",
      items: bySection.script,
    });
  }
  if (bySection.strings.length > 0) {
    sections.push({
      id: "strings",
      kind: "meters",
      title: "Strings",
      items: bySection.strings,
    });
  }

  const varsByScope = new Map<string, VariantLimitItem[]>();
  for (const item of bySection.variables) {
    const { scope, type } = splitVariableLabel(item.label);
    const scoped: VariantLimitItem = { ...item, label: type };
    const list = varsByScope.get(scope);
    if (list) {
      list.push(scoped);
    } else {
      varsByScope.set(scope, [scoped]);
    }
  }
  for (const scope of VARIABLE_SCOPE_ORDER) {
    const scopeItems = varsByScope.get(scope);
    if (!scopeItems) {
      continue;
    }
    sections.push({
      id: `variables-${scope}`,
      kind: "variables",
      title: `${scope} Variables`,
      items: scopeItems,
    });
    varsByScope.delete(scope);
  }
  for (const [scope, scopeItems] of varsByScope) {
    sections.push({
      id: `variables-${scope}`,
      kind: "variables",
      title: `${scope} Variables`,
      items: scopeItems,
    });
  }

  if (bySection.declarations.length > 0) {
    sections.push({
      id: "declarations",
      kind: "meters",
      title: "Declarations",
      items: bySection.declarations,
    });
  }

  return sections;
}

function LimitRow({ item }: { item: VariantLimitItem }) {
  const level = variantCapacityLevel(item.used, item.max);
  const fillPercent =
    item.max > 0 ? Math.min(100, (item.used / item.max) * 100) : 0;

  return (
    <div className={`variant-limit-row variant-limit-row--${level}`}>
      <div className="variant-limit-row-head">
        <span className="variant-limit-row-label">{item.label}</span>
        <span className="variant-limit-row-value">
          {formatLimitValue(item)}
        </span>
      </div>
      <div aria-hidden className="variant-limit-row-track">
        <div
          className="variant-limit-row-fill"
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
}

interface Props {
  capacityBytes: number;
  limitUsage: VariantLimitUsage | null;
  usedBytes: number | null;
}

export function VariantCapacityMeter({
  usedBytes,
  capacityBytes,
  limitUsage,
}: Props) {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ bottom: number; left: number }>({
    bottom: 0,
    left: 0,
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const nextLeft = Math.min(
      Math.max(8, rect.right - PANEL_WIDTH),
      Math.max(8, window.innerWidth - PANEL_WIDTH - 8)
    );
    const nextBottom = Math.max(8, window.innerHeight - rect.top + 6);
    setPanelPos((prev) =>
      prev.bottom === nextBottom && prev.left === nextLeft
        ? prev
        : { bottom: nextBottom, left: nextLeft }
    );
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    updatePanelPosition();
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, updatePanelPosition]);

  if (usedBytes === null) {
    return null;
  }

  const level = variantCapacityLevel(usedBytes, capacityBytes);
  const percent = Math.round((usedBytes / capacityBytes) * 100);
  const fillPercent = Math.min(100, (usedBytes / capacityBytes) * 100);
  const over = usedBytes > capacityBytes;

  const items = (limitUsage?.items ?? []).filter(
    (item: VariantLimitItem) => item.max > 0
  );
  const fallbackItems: VariantLimitItem[] =
    items.length > 0
      ? items
      : [
          {
            id: "storage",
            label: "Encoded size",
            used: usedBytes,
            max: capacityBytes,
            section: "storage",
            format: "bytes",
          },
        ];

  const sections = buildPopoverSections(fallbackItems);

  return (
    <div className="variant-capacity-root" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Variant storage ${percent} percent full. Show limits breakdown.`}
        className={`variant-capacity variant-capacity--${level}`}
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        title="Show variant limits"
        type="button"
      >
        <div aria-hidden className="variant-capacity-track">
          <div
            className="variant-capacity-fill"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
        <span className="variant-capacity-label">
          {formatVariantBytes(usedBytes)} / {formatVariantBytes(capacityBytes)}
          {over ? " +" : ""}
        </span>
      </button>
      {open
        ? createPortal(
            <div
              aria-label="Variant limits"
              className="variant-limits-popover"
              ref={panelRef}
              role="dialog"
              style={{
                bottom: panelPos.bottom,
                left: panelPos.left,
                width: PANEL_WIDTH,
                maxHeight: PANEL_MAX_HEIGHT,
              }}
            >
              <div className="variant-limits-popover-title">Variant limits</div>
              <div className="variant-limits-body">
                {sections.map((section) => (
                  <section
                    className={`variant-limits-section${
                      section.kind === "variables"
                        ? " variant-limits-section--variables"
                        : ""
                    }`}
                    key={section.id}
                  >
                    <h3 className="variant-limits-section-title">
                      {section.title}
                    </h3>
                    <div
                      className={
                        section.kind === "variables"
                          ? "variant-limits-rows variant-limits-rows--compact"
                          : "variant-limits-rows"
                      }
                    >
                      {section.items.map((item) => (
                        <LimitRow item={item} key={item.id} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
