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

const callOpenAI = async ({ systemPrompt, messages, apiKey }) => {
  if (!apiKey) {
    throw new Error("OpenAI API key is not set");
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

const getOpenAIKeys = () =>
  [process.env.OPENAI_API_KEY1, process.env.OPENAI_API_KEY2, process.env.OPENAI_API_KEY]
    .filter(Boolean)
    .map((key) => key.trim())
    .filter((key, index, list) => list.indexOf(key) === index);

const shouldFailover = (error) => {
  const status = error && error.response ? error.response.status : null;
  return status === 401 || status === 403 || status === 429;
};

const generateAiResponse = async ({ systemPrompt, messages }) => {
  const prompt = systemPrompt || DEFAULT_SYSTEM_PROMPT;
  const keys = getOpenAIKeys();

  if (keys.length === 0) {
    throw new Error("No OpenAI API key configured");
  }

  let lastError;
  for (const apiKey of keys) {
    try {
      return await callOpenAI({ systemPrompt: prompt, messages, apiKey });
    } catch (error) {
      lastError = error;
      if (!shouldFailover(error)) {
        throw error;
      }
    }
  }

  throw lastError;
};

module.exports = {
  DEFAULT_SYSTEM_PROMPT,
  generateAiResponse,
};
