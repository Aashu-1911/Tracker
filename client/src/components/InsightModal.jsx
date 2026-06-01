import { useMemo, useState } from "react";
import { FiCopy, FiMoon, FiRefreshCcw, FiSun, FiX } from "react-icons/fi";
import MarkdownContent from "./MarkdownContent";

const reactions = ["💡", "🔥", "🙌", "🎯"];

const InsightModal = ({
  isOpen,
  title,
  insight,
  onClose,
  onRegenerate,
  loading,
  canRegenerate = false,
}) => {
  const [darkMode, setDarkMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState("");

  const classes = useMemo(
    () => `insight-modal ${darkMode ? "insight-modal--dark" : ""}`,
    [darkMode]
  );

  if (!isOpen) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(insight || ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="insight-modal-backdrop" onClick={onClose}>
      <div className={classes} onClick={(event) => event.stopPropagation()}>
        <div className="insight-modal__header">
          <div>
            <h3>{title || "AI insight"}</h3>
            <p className="meta">Generated reflections, patterns, and next moves.</p>
          </div>
          <div className="insight-modal__actions">
            <button className="ghost-button" type="button" onClick={() => setDarkMode((prev) => !prev)}>
              {darkMode ? <FiSun /> : <FiMoon />}
              {darkMode ? "Light" : "Dark"}
            </button>
            <button className="ghost-button" type="button" onClick={handleCopy}>
              <FiCopy />
              {copied ? "Copied" : "Copy"}
            </button>
            {canRegenerate ? (
              <button className="ghost-button" type="button" onClick={onRegenerate} disabled={loading}>
                <FiRefreshCcw />
                {loading ? "Generating..." : "Regenerate"}
              </button>
            ) : null}
            <button className="ghost-button" type="button" onClick={onClose}>
              <FiX />
              Close
            </button>
          </div>
        </div>

        <div className="insight-modal__body">
          <MarkdownContent content={insight} className="markdown-content" />
        </div>

        <div className="insight-modal__footer">
          <span className="meta">Reaction</span>
          <div className="reaction-row">
            {reactions.map((reaction) => (
              <button
                key={reaction}
                type="button"
                className={`reaction-chip ${selectedReaction === reaction ? "reaction-chip--active" : ""}`}
                onClick={() => setSelectedReaction(reaction)}
              >
                {reaction}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightModal;
