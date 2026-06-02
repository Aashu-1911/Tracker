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

const detectProvider = (apiKey) => {
  const key = String(apiKey || "").trim();
  if (!key) {
    return null;
  }
  if (key.startsWith("sk-ant-")) {
    return "anthropic";
  }
  if (key.startsWith("sk-")) {
    return "openai";
  }
  if (key.startsWith("AQ.") || key.startsWith("AIza")) {
    return "gemini";
  }
  return null;
};

const getConfiguredProviders = () => {
  const entries = [];

  const addKey = (key, providerOverride) => {
    const trimmed = String(key || "").trim();
    if (!trimmed) {
      return;
    }
    const provider = providerOverride || detectProvider(trimmed);
    if (!provider) {
      console.warn(
        "[AI] Unrecognized API key format — expected OpenAI (sk-…), Gemini (AIza… or AQ.…), or Anthropic (sk-ant-…)."
      );
      return;
    }
    if (!entries.some((entry) => entry.key === trimmed)) {
      entries.push({ provider, key: trimmed });
    }
  };

  addKey(process.env.GEMINI_API_KEY, "gemini");
  addKey(process.env.OPENAI_API_KEY, detectProvider(process.env.OPENAI_API_KEY));
  addKey(process.env.OPENAI_API_KEY1);
  addKey(process.env.OPENAI_API_KEY2);
  addKey(process.env.ANTHROPIC_API_KEY, "anthropic");

  return entries;
};

const callOpenAI = async ({ systemPrompt, messages, apiKey }) => {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

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

const callGemini = async ({ systemPrompt, messages, apiKey }) => {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const contents = messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: String(message.content || "") }],
  }));

  const body = { contents };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const response = await requestWithRetry(() =>
    axios.post(url, body, {
      headers: { "Content-Type": "application/json" },
    })
  );

  const parts = response.data?.candidates?.[0]?.content?.parts || [];
  const text = parts
    .map((part) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!text) {
    const blockReason = response.data?.candidates?.[0]?.finishReason;
    throw new Error(blockReason ? `Gemini blocked response: ${blockReason}` : "Empty Gemini response");
  }

  return text;
};

const shouldFailover = (error) => {
  const status = error && error.response ? error.response.status : null;
  return status === 401 || status === 403 || status === 429;
};

const callProvider = async (provider, options) => {
  if (provider === "openai") {
    return callOpenAI(options);
  }
  if (provider === "gemini") {
    return callGemini(options);
  }
  throw new Error(`Unsupported AI provider: ${provider}`);
};

const generateAiResponse = async ({ systemPrompt, messages }) => {
  const prompt = systemPrompt || DEFAULT_SYSTEM_PROMPT;
  const providers = getConfiguredProviders();

  if (providers.length === 0) {
    throw new Error(
      "No AI API key configured. Set GEMINI_API_KEY or OPENAI_API_KEY in .env."
    );
  }

  let lastError;
  for (const { provider, key } of providers) {
    try {
      return await callProvider(provider, { systemPrompt: prompt, messages, apiKey: key });
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      const providerLabel = provider === "gemini" ? "Gemini" : "OpenAI";
      console.error(
        `[AI] ${providerLabel} request failed:`,
        error.response?.data?.error?.message || error.message
      );
      if (!shouldFailover(error) && status !== 404) {
        throw error;
      }
    }
  }

  throw lastError;
};

const getAiStatus = () => {
  const providers = getConfiguredProviders();
  return {
    configured: providers.length > 0,
    providers: providers.map(({ provider }) => provider),
  };
};

module.exports = {
  DEFAULT_SYSTEM_PROMPT,
  generateAiResponse,
  getAiStatus,
  detectProvider,
};
