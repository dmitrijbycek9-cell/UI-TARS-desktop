/* ================================================================
   JARVIS — Provider-Konfiguration (einzige Quelle der Wahrheit)
   Jede Definition beschreibt einen KI-Provider: Anzeige, Endpoint,
   Header, Request-Body, Antwort-Parser und Stream-Delta-Parser.
   Settings-UI und Modell-Dropdowns werden hieraus generiert — so
   können HTML- und JS-IDs nicht mehr auseinanderlaufen.
   ================================================================ */

// Gemeinsamer Body/Parser für OpenAI-kompatible Provider
// (OpenAI, DeepSeek, Qwen, Kimi nutzen alle das chat/completions-Format)
const openAiStyle = {
  headers: (key) => ({
    "Content-Type": "application/json",
    Authorization: "Bearer " + key,
  }),
  body: (model, system, messages, { stream, maxTokens }) => ({
    model,
    messages: [{ role: "system", content: system }, ...messages],
    max_tokens: maxTokens,
    stream: !!stream,
  }),
  parse: (data) => data.choices?.[0]?.message?.content?.trim() || "",
  // Ein geparstes SSE-JSON -> Text-Delta
  streamDelta: (obj) => obj.choices?.[0]?.delta?.content || "",
};

export const PROVIDERS = {
  anthropic: {
    name: "Claude",
    icon: "🅰️",
    free: false,
    keyPlaceholder: "sk-ant-…",
    keyUrl: "https://console.anthropic.com/",
    keyLabel: "console.anthropic.com",
    models: [
      { id: "claude-opus-4-8", label: "Opus 4.8 — stärkstes" },
      { id: "claude-sonnet-4-6", label: "Sonnet 4.6 — ausgewogen" },
      { id: "claude-haiku-4-5", label: "Haiku 4.5 — schnell & günstig" },
    ],
    endpoint: () => "https://api.anthropic.com/v1/messages",
    headers: (key) => ({
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    }),
    body: (model, system, messages, { stream, maxTokens }) => ({
      model,
      max_tokens: maxTokens,
      system,
      messages,
      stream: !!stream,
    }),
    parse: (data) =>
      (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim(),
    streamDelta: (obj) =>
      obj.type === "content_block_delta" && obj.delta?.type === "text_delta"
        ? obj.delta.text || ""
        : "",
  },

  openai: {
    name: "ChatGPT",
    icon: "🅾️",
    free: false,
    keyPlaceholder: "sk-…",
    keyUrl: "https://platform.openai.com/",
    keyLabel: "platform.openai.com",
    models: [
      { id: "gpt-4o", label: "GPT-4o — leistungsstark" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini — günstig" },
      { id: "o3-mini", label: "o3 Mini — Reasoning" },
    ],
    endpoint: () => "https://api.openai.com/v1/chat/completions",
    ...openAiStyle,
  },

  google: {
    name: "Gemini",
    icon: "🅶",
    free: true,
    keyPlaceholder: "AIzaSy…",
    keyUrl: "https://aistudio.google.com/app/apikey",
    keyLabel: "aistudio.google.com",
    models: [
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro — bestes" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash — schnell" },
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash — günstig" },
    ],
    // Streaming: alt=sse Variante
    endpoint: (model, key, stream) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:${
        stream ? "streamGenerateContent?alt=sse&" : "generateContent?"
      }key=${encodeURIComponent(key)}`,
    headers: () => ({ "Content-Type": "application/json" }),
    body: (model, system, messages, { maxTokens }) => ({
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      systemInstruction: { parts: [{ text: system }] },
      generationConfig: { maxOutputTokens: maxTokens },
    }),
    parse: (data) =>
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "",
    streamDelta: (obj) =>
      obj.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ||
      "",
  },

  deepseek: {
    name: "DeepSeek",
    icon: "🐋",
    free: true,
    keyPlaceholder: "sk-…",
    keyUrl: "https://platform.deepseek.com/",
    keyLabel: "platform.deepseek.com",
    models: [
      { id: "deepseek-chat", label: "DeepSeek-V3 — Chat" },
      { id: "deepseek-reasoner", label: "DeepSeek-R1 — Reasoning" },
    ],
    endpoint: () => "https://api.deepseek.com/v1/chat/completions",
    ...openAiStyle,
  },

  qwen: {
    name: "Qwen",
    icon: "🌟",
    free: true,
    keyPlaceholder: "sk-…",
    keyUrl: "https://dashscope.console.aliyun.com/",
    keyLabel: "dashscope.console.aliyun.com",
    models: [
      { id: "qwen-turbo", label: "Qwen-Turbo — schnell" },
      { id: "qwen-plus", label: "Qwen-Plus — ausgewogen" },
      { id: "qwen-max", label: "Qwen-Max — stärkstes" },
    ],
    endpoint: () =>
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    ...openAiStyle,
  },

  kimi: {
    name: "Kimi",
    icon: "🌙",
    free: true,
    keyPlaceholder: "sk-…",
    keyUrl: "https://platform.moonshot.cn/",
    keyLabel: "platform.moonshot.cn",
    models: [
      { id: "moonshot-v1-8k", label: "Moonshot v1 — 8K" },
      { id: "moonshot-v1-32k", label: "Moonshot v1 — 32K" },
      { id: "moonshot-v1-128k", label: "Moonshot v1 — 128K" },
    ],
    endpoint: () => "https://api.moonshot.cn/v1/chat/completions",
    ...openAiStyle,
  },
};

export const PROVIDER_KEYS = Object.keys(PROVIDERS);

// Standardmodell = erstes Modell in der Liste (existiert garantiert im Dropdown)
export function getDefaultModel(provider) {
  return PROVIDERS[provider]?.models[0]?.id || "";
}

// Reihenfolge der Fallback-Provider (kostenlose zuerst)
export const FALLBACK_ORDER = ["deepseek", "qwen", "kimi", "google"];

export const SYSTEM_PROMPT =
  "Du bist JARVIS, der persönliche KI-Assistent von Dima. " +
  "Du sprichst kurz und präzise auf Deutsch. " +
  'Wenn Dima dir etwas Wichtiges mitteilt, füge am Ende deiner Antwort ' +
  'eine Zeile im Format "MERKE: [Information]" hinzu — NUR wenn es wirklich ' +
  "wichtig ist, nicht bei jeder Antwort. Diese MERKE-Zeilen werden automatisch " +
  "in Dimas Wissensbank gespeichert. Du kannst Aufgaben erstellen, Notizen " +
  "machen und allgemeine Fragen beantworten. Sei hilfsbereit und freundlich, " +
  "aber nicht aufdringlich.";
