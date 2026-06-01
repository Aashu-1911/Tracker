/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from "react";
import { chatWithAI, clearAIChat } from "../services/api";

const AIContext = createContext(null);

const fallbackMessage =
  "The AI service is taking a break right now. Try again in a little while, and in the meantime keep momentum with one clear next task.";

export const AIProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const sendMessage = async ({ message, context }) => {
    const trimmed = String(message || "").trim();
    if (!trimmed) {
      return null;
    }

    const userEntry = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userEntry]);
    setChatLoading(true);
    setChatError("");

    try {
      const response = await chatWithAI({ message: trimmed, context });
      const assistantEntry = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response?.response || fallbackMessage,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantEntry]);
      return assistantEntry;
    } catch (err) {
      const messageText = err.message || fallbackMessage;
      setChatError(messageText);
      const fallbackEntry = {
        id: `assistant-fallback-${Date.now()}`,
        role: "assistant",
        content: fallbackMessage,
        createdAt: new Date().toISOString(),
        isFallback: true,
      };
      setMessages((prev) => [...prev, fallbackEntry]);
      return fallbackEntry;
    } finally {
      setChatLoading(false);
    }
  };

  const clearMessages = async () => {
    setMessages([]);
    setChatError("");

    try {
      await clearAIChat();
    } catch (err) {
      setChatError(err.message || "Unable to clear AI chat history.");
    }
  };

  const value = useMemo(
    () => ({
      messages,
      chatLoading,
      chatError,
      sendMessage,
      clearMessages,
      fallbackMessage,
    }),
    [messages, chatLoading, chatError]
  );

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};

export const useAIContext = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error("useAIContext must be used within AIProvider");
  }
  return context;
};
