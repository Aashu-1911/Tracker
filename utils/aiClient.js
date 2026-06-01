const axios = require("axios");

const DEFAULT_SYSTEM_PROMPT =
  "You are a productivity and goal-tracking assistant. Provide concise, actionable insights.";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetry = (error) => {
  if (!error) {
    return false;
  }

  const status = error.response ? error.response.status : null;
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
};

const requestWithRetry = async (fn, retries = 3) => {
  let attempt = 0;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries || !shouldRetry(error)) {
        throw error;
      }

      const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
      await sleep(delay);
      attempt += 1;
    }
  }

  return null;
};

const callAnthropic = async ({ systemPrompt, messages }) => {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error("CLAUDE_API_KEY is not set");
  }

  const model = process.env.CLAUDE_MODEL || "claude-3-sonnet";

  const response = await requestWithRetry(() =>
    axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model,
        max_tokens: 600,
        system: systemPrompt,
        messages,
      },
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
      }
    )
  );

  const content = response.data && response.data.content ? response.data.content : [];
  if (!Array.isArray(content) || content.length === 0) {
    return "";
  }

  return content.map((item) => item.text || "").join("\n").trim();
};

const callOpenAI = async ({ systemPrompt, messages }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const model = process.env.OPENAI_MODEL || "gpt-4";

  const response = await requestWithRetry(() =>
    axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.4,
        max_tokens: 600,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
      }
    )
  );

  const choice = response.data && response.data.choices ? response.data.choices[0] : null;
  return choice && choice.message ? String(choice.message.content || "").trim() : "";
};

const generateAiResponse = async ({ systemPrompt, messages }) => {
  const prompt = systemPrompt || DEFAULT_SYSTEM_PROMPT;
  const useClaude = Boolean(process.env.CLAUDE_API_KEY);
  const useOpenAI = Boolean(process.env.OPENAI_API_KEY);

  if (!useClaude && !useOpenAI) {
    throw new Error("No AI API key configured");
  }

  if (useClaude) {
    return callAnthropic({ systemPrompt: prompt, messages });
  }

  return callOpenAI({ systemPrompt: prompt, messages });
};

module.exports = {
  DEFAULT_SYSTEM_PROMPT,
  generateAiResponse,
};
