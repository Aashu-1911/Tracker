import { useEffect, useMemo, useState } from "react";
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

  // Focus Trapping and Restoration
  useEffect(() => {
    if (!isOpen) return;

    const previouslyActive = document.activeElement;
    
    // Tiny delay to ensure DOM elements are fully rendered
    const timeoutId = setTimeout(() => {
      const modalElement = document.querySelector(".insight-modal");
      if (modalElement) {
        const focusableElements = modalElement.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex="0"]'
        );
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    }, 50);

    const handleTabKey = (e) => {
      if (e.key !== "Tab") return;

      const modalElement = document.querySelector(".insight-modal");
      if (!modalElement) return;

      const focusableElements = modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex="0"]'
      );
      const focusable = Array.from(focusableElements);
      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleTabKey);
    window.addEventListener("keydown", handleEscape);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("keydown", handleTabKey);
      window.removeEventListener("keydown", handleEscape);
      if (previouslyActive && typeof previouslyActive.focus === "function") {
        previouslyActive.focus();
      }
    };
  }, [isOpen, onClose]);

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
    <div 
      className="insight-modal-backdrop" 
      onClick={onClose}
      role="presentation"
    >
      <div 
        className={classes} 
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-desc"
      >
        <div className="insight-modal__header">
          <div>
            <h3 id="modal-title">{title || "AI insight"}</h3>
            <p id="modal-desc" className="meta">Generated reflections, patterns, and next moves.</p>
          </div>
          <div className="insight-modal__actions">
            <button 
              className="ghost-button" 
              type="button" 
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label="Toggle modal theme"
            >
              {darkMode ? <FiSun /> : <FiMoon />}
              {darkMode ? "Light" : "Dark"}
            </button>
            <button 
              className="ghost-button" 
              type="button" 
              onClick={handleCopy}
              aria-label="Copy insight content"
            >
              <FiCopy />
              {copied ? "Copied" : "Copy"}
            </button>
            {canRegenerate ? (
              <button 
                className="ghost-button" 
                type="button" 
                onClick={onRegenerate} 
                disabled={loading}
                aria-label="Regenerate insight"
              >
                <FiRefreshCcw />
                {loading ? "Generating..." : "Regenerate"}
              </button>
            ) : null}
            <button 
              className="ghost-button modal-close-btn" 
              type="button" 
              onClick={onClose}
              aria-label="Close insight modal"
            >
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
                aria-label={`React with ${reaction}`}
                aria-pressed={selectedReaction === reaction}
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
