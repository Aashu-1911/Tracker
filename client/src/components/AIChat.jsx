import { useEffect, useMemo, useRef, useState } from "react";
import { FiMessageSquare, FiSend, FiTrash2 } from "react-icons/fi";
import useAppContext from "../hooks/useAppContext";
import MarkdownContent from "./MarkdownContent";
import ErrorState from "./ErrorState";

const promptExamples = [
  "How productive was I this week?",
  "What should I focus on tomorrow?",
  "Why did I not complete my tasks?",
  "Motivate me!",
];

const AIChat = ({ contextTasks = [] }) => {
  const { aiChat, sendAIMessage, clearChat } = useAppContext();
  const [draft, setDraft] = useState("");
  const containerRef = useRef(null);
  const messages = useMemo(() => aiChat.messages || [], [aiChat.messages]);
  const chatLoading = aiChat.loading;
  const chatError = aiChat.error;

  useEffect(() => {
    const node = containerRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, chatLoading]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) {
      return;
    }

    setDraft("");
    await sendAIMessage({ message: text, context: contextTasks });
  };

  return (
    <section className="card ai-chat-card">
      <div className="viz-card__header">
        <div>
          <h3>AI coach</h3>
          <p className="meta">Ask for analysis, planning help, or a boost.</p>
        </div>
        <button className="button secondary" type="button" onClick={clearChat}>
          <FiTrash2 />
          Clear
        </button>
      </div>

      <div className="prompt-row">
        {promptExamples.map((prompt) => (
          <button
            key={prompt}
            className="prompt-chip"
            type="button"
            onClick={() => setDraft(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      {chatError ? <ErrorState message={chatError} /> : null}

      <div ref={containerRef} className="chat-history">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <FiMessageSquare />
            <span>Start a conversation and the AI coach will respond here.</span>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`chat-message chat-message--${message.role}`}
            >
              <span className="chat-message__role">
                {message.role === "user" ? "You" : "AI"}
              </span>
              <MarkdownContent content={message.content} className="markdown-content" />
            </div>
          ))
        )}
        {chatLoading ? <div className="notice">AI is thinking...</div> : null}
      </div>

      <form className="ai-chat-form" onSubmit={handleSubmit}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about your productivity, focus, or momentum..."
        />
        <button className="button" type="submit" disabled={chatLoading}>
          <FiSend />
          Send
        </button>
      </form>
    </section>
  );
};

export default AIChat;
