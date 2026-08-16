import { useT } from "../localization";

export function EditorEmptyState() {
  const t = useT();

  return (
    <div className="editor-empty" role="status">
      <div className="editor-empty-content">
        <svg
          aria-hidden="true"
          className="editor-empty-icon"
          viewBox="0 0 24 24"
        >
          <path
            d="M5 3.5h9l5 5V20.5H5z"
            fill="none"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.4"
          />
          <path
            d="M14 3.5V8.5H19"
            fill="none"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.4"
          />
        </svg>
        <h2 className="editor-empty-title">{t("editor_empty_title")}</h2>
        <p className="editor-empty-hint">{t("editor_empty_hint")}</p>
      </div>
    </div>
  );
}
