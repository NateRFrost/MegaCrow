export function EditorEmptyState() {
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
        <h2 className="editor-empty-title">Open a file</h2>
        <p className="editor-empty-hint">
          Select a Megalo script from the file tree to start editing.
        </p>
      </div>
    </div>
  );
}
