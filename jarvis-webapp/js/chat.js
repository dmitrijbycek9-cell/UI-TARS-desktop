/* ================================================================
   JARVIS — Chat + KI-Anbindung (Streaming, Fallback, MERKE)
   ================================================================ */

import {
  PROVIDERS,
  getDefaultModel,
  FALLBACK_ORDER,
  SYSTEM_PROMPT,
} from "./config.js";
import { getSetting, dbAll, dbPut, dbClear } from "./db.js";
import { $, now, toast, setStatus, showView, renderMarkdown } from "./ui.js";
import { addMemory, addTask, renderTasks, addNote, renderNotes } from "./features.js";
import { termuxBridge } from "./termux.js";
import { speak } from "./voice.js";

const MAX_TOKENS = 1024;
const REQUEST_TIMEOUT = 60000;
let chatHistory = [];
let currentAbort = null;

// =================================================================
// EINHEITLICHER API-AUFRUF (mit optionalem Streaming)
// =================================================================

export async function callAI(provider, model, system, messages, opts = {}) {
  const cfg = PROVIDERS[provider];
  if (!cfg) throw new Error("Unbekannter Provider: " + provider);

  const key = await getSetting("apiKey_" + provider);
  if (!key) throw new Error("Kein API-Key für " + cfg.name);

  const stream = !!opts.onDelta;
  const url = cfg.endpoint(model, key, stream);
  const headers = cfg.headers(key);
  const body = cfg.body(model, system, messages, { stream, maxTokens: MAX_TOKENS });

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: opts.signal,
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.text()).slice(0, 160);
    } catch {}
    throw new Error("API " + res.status + (detail ? " — " + detail : ""));
  }

  if (!stream) {
    return cfg.parse(await res.json());
  }
  return readStream(res, cfg, opts.onDelta);
}

// Liest einen SSE-Stream und ruft onDelta pro Text-Fragment auf
async function readStream(res, cfg, onDelta) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop(); // letzte (evtl. unvollständige) Zeile behalten

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const obj = JSON.parse(data);
        const delta = cfg.streamDelta(obj);
        if (delta) {
          full += delta;
          onDelta(full);
        }
      } catch {
        /* unvollständiges JSON ignorieren */
      }
    }
  }
  return full.trim();
}

// =================================================================
// CHAT-RENDERING
// =================================================================

function addMessage(role, text, opts = {}) {
  const box = $("#chatHistory");
  if (!box) return null;
  const wrap = document.createElement("div");
  wrap.className = "message " + (role === "user" ? "user" : "jarvis");
  if (opts.thinking) wrap.classList.add("thinking");

  const content = document.createElement("div");
  content.className = "msg-content";
  if (role === "user") content.textContent = text;
  else content.innerHTML = renderMarkdown(text);
  wrap.appendChild(content);

  if (role !== "user" && !opts.thinking) {
    const copy = document.createElement("button");
    copy.className = "msg-copy";
    copy.title = "Kopieren";
    copy.textContent = "⧉";
    copy.addEventListener("click", () => {
      navigator.clipboard?.writeText(text).then(() => toast("Kopiert"));
    });
    wrap.appendChild(copy);
  }

  box.appendChild(wrap);
  box.scrollTop = box.scrollHeight;
  return { wrap, content };
}

export async function loadChat() {
  const msgs = (await dbAll("chat")).sort((a, b) => a.created - b.created);
  const box = $("#chatHistory");
  if (box) box.innerHTML = "";
  chatHistory = [];
  for (const m of msgs) {
    addMessage(m.role, m.text);
    chatHistory.push({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    });
  }
  if (!msgs.length) {
    addMessage(
      "jarvis",
      "Hallo Dima! Ich bin **JARVIS** — jetzt mit 6 KI-Providern. Frag mich etwas oder sag mir, was ich mir merken soll."
    );
  }
}

export async function clearChat() {
  await dbClear("chat");
  chatHistory = [];
  await loadChat();
  toast("Chat geleert");
}

// MERKE-Zeilen aus der Antwort ziehen und in die Wissensbank schreiben
async function extractMerke(reply) {
  const keep = [];
  for (const line of reply.split("\n")) {
    const m = line.match(/^\s*MERKE:\s*(.+)$/i);
    if (m) await addMemory(m[1].trim());
    else keep.push(line);
  }
  return keep.join("\n").trim() || "Ok.";
}

// =================================================================
// NACHRICHT SENDEN
// =================================================================

export async function sendMessage(text) {
  text = text.trim();
  if (!text) return;
  if (await handleLocalCommand(text)) return;

  const provider = await getSetting("primaryProvider", "anthropic");
  const cfg = PROVIDERS[provider];
  const model = await getSetting("model_" + provider, getDefaultModel(provider));

  const key = await getSetting("apiKey_" + provider);
  if (!key) {
    toast("API-Key fehlt für " + cfg.name + " — Einstellungen öffnen");
    showView("view-settings");
    $(`.provider-tab[data-provider="${provider}"]`)?.click();
    return;
  }

  addMessage("user", text);
  await dbPut("chat", { id: "c" + now(), role: "user", text, created: now() });
  chatHistory.push({ role: "user", content: text });

  // Gedächtnis als Kontext
  const mem = await dbAll("memory");
  const memText = mem.length
    ? "Was du über Dima weißt:\n" + mem.map((m) => "- " + m.text).join("\n")
    : "";
  const persona = await getSetting("system_prompt", SYSTEM_PROMPT);
  const sys = (persona || SYSTEM_PROMPT) + (memText ? "\n\n" + memText : "");

  const thinking = addMessage("jarvis", cfg.name + " denkt nach…", {
    thinking: true,
  });
  setStatus(cfg.name + " denkt…");
  setSending(true);

  currentAbort = new AbortController();
  const timeout = setTimeout(() => currentAbort.abort(), REQUEST_TIMEOUT);
  let streamed = false;

  const onDelta = (full) => {
    streamed = true;
    thinking.wrap.classList.remove("thinking");
    thinking.content.innerHTML = renderMarkdown(full);
    $("#chatHistory").scrollTop = $("#chatHistory").scrollHeight;
  };

  try {
    const reply = await callAI(provider, model, sys, chatHistory.slice(-20), {
      onDelta,
      signal: currentAbort.signal,
    });
    clearTimeout(timeout);
    const clean = await extractMerke(reply);

    thinking.wrap.remove();
    addMessage("jarvis", clean);
    await dbPut("chat", { id: "c" + now(), role: "assistant", text: clean, created: now() });
    chatHistory.push({ role: "assistant", content: clean });
    setStatus("bereit");
    speak(clean);
  } catch (e) {
    clearTimeout(timeout);
    thinking.wrap.remove();

    if (e.name === "AbortError") {
      addMessage("jarvis", "_Abgebrochen._");
      setStatus("abgebrochen", false);
      return;
    }
    console.error(e);
    // Fallback auf kostenlose Provider
    toast("Provider fehlgeschlagen — versuche Fallback…");
    const ok = await tryFallback(sys);
    if (!ok) {
      addMessage(
        "jarvis",
        "**Fehler:** " +
          e.message +
          "\n\nPrüf deinen Key oder wähle in den Einstellungen einen anderen Provider."
      );
      setStatus("Fehler", false);
    }
  } finally {
    setSending(false);
    currentAbort = null;
  }
}

async function tryFallback(sys) {
  const primary = await getSetting("primaryProvider", "anthropic");
  for (const fp of FALLBACK_ORDER) {
    if (fp === primary) continue;
    if (!(await getSetting("apiKey_" + fp))) continue;
    try {
      const model = await getSetting("model_" + fp, getDefaultModel(fp));
      const reply = await callAI(fp, model, sys, chatHistory.slice(-20));
      const clean = await extractMerke(reply);
      addMessage("jarvis", "[" + PROVIDERS[fp].name + "] " + clean);
      await dbPut("chat", { id: "c" + now(), role: "assistant", text: clean, created: now() });
      chatHistory.push({ role: "assistant", content: clean });
      setStatus("bereit [" + PROVIDERS[fp].name + "]");
      speak(clean);
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

function setSending(active) {
  const send = $("#chatSend");
  const stop = $("#chatStop");
  if (send) send.style.display = active ? "none" : "";
  if (stop) stop.style.display = active ? "" : "none";
}

export function stopGeneration() {
  if (currentAbort) currentAbort.abort();
}

// =================================================================
// LOKALE BEFEHLE
// =================================================================

const COMMANDS = [
  {
    re: /^aufgabe[:\s]+(.+)$/i,
    run: async (m) => {
      await addTask(m[1]);
      return "Aufgabe hinzugefügt.";
    },
  },
  {
    re: /^notiz[:\s]+(.+)$/i,
    run: async (m) => {
      await addNote("", m[1]);
      return "Notiz gespeichert.";
    },
  },
  {
    re: /^merke[:\s]+(.+)$/i,
    run: async (m) => {
      await addMemory(m[1]);
      return "Habe ich mir gemerkt.";
    },
  },
  {
    re: /^(was weißt du|was weisst du|erinnere)/i,
    run: async () => {
      const mem = await dbAll("memory");
      return mem.length
        ? "Was ich weiß:\n" + mem.map((m) => "- " + m.text).join("\n")
        : "Ich weiß noch nichts — erzähl mir was!";
    },
  },
  {
    re: /^zeige\s+aufgaben/i,
    run: async () => {
      showView("view-tasks");
      return "Aufgaben werden angezeigt.";
    },
  },
  {
    re: /^zeige\s+notizen/i,
    run: async () => {
      showView("view-notes");
      return "Notizen werden angezeigt.";
    },
  },
  {
    re: /^zeige\s+wissen/i,
    run: async () => {
      showView("view-memory");
      return "Wissensbank wird angezeigt.";
    },
  },
  {
    re: /^hilfe/i,
    run: async () =>
      "Befehle:\n" +
      "- 'Aufgabe: [Text]' — Aufgabe erstellen\n" +
      "- 'Notiz: [Text]' — Notiz speichern\n" +
      "- 'Merke: [Text]' — In Wissensbank speichern\n" +
      "- 'Was weißt du?' — Wissen anzeigen\n" +
      "- 'Zeige Aufgaben/Notizen/Wissen' — Ansicht wechseln\n" +
      "- 'Termux: [Befehl]' — Befehl an Termux senden\n" +
      "- 'SSH [user@host]' — SSH-Verbindung starten\n" +
      "- 'Script: [Name]' — Gespeichertes Skript ausführen\n" +
      "- Alles andere geht an die KI.",
  },
];

async function handleLocalCommand(text) {
  const t = text.trim();

  let m = t.match(/^termux[:\s]+(.+)$/i);
  if (m) {
    addMessage("user", text);
    await termuxBridge.runCommand(m[1]);
    return true;
  }
  m = t.match(/^ssh\s+(.+)$/i);
  if (m) {
    addMessage("user", text);
    const [host, port = "22"] = m[1].split(/\s+/);
    await termuxBridge.sshConnect(host, port);
    addMessage("jarvis", "[SSH] Verbindung zu `" + host + "` wird hergestellt…");
    return true;
  }
  m = t.match(/^script[:\s]+(.+)$/i);
  if (m) {
    addMessage("user", text);
    const scripts = await termuxBridge.getScripts();
    const s = scripts.find((x) => x.name.toLowerCase() === m[1].toLowerCase());
    if (s) {
      await termuxBridge.runCommand(s.cmd);
      addMessage("jarvis", "[Skript] `" + s.name + "` ausgeführt: `" + s.cmd + "`");
    } else {
      addMessage(
        "jarvis",
        "Skript '" + m[1] + "' nicht gefunden. Verfügbar:\n" +
          scripts.map((s) => "- " + s.name).join("\n")
      );
    }
    return true;
  }

  for (const cmd of COMMANDS) {
    const match = text.match(cmd.re);
    if (match) {
      addMessage("user", text);
      try {
        addMessage("jarvis", await cmd.run(match));
      } catch (e) {
        console.error("Befehlsfehler:", e);
      }
      return true;
    }
  }
  return false;
}

// =================================================================
// EVENT-BINDINGS
// =================================================================

export function initChat() {
  const input = $("#chatInput");
  const send = () => {
    if (!input.value.trim()) return;
    const v = input.value;
    input.value = "";
    autoGrow(input);
    sendMessage(v);
  };

  $("#chatSend")?.addEventListener("click", send);
  $("#chatStop")?.addEventListener("click", stopGeneration);
  $("#chatClear")?.addEventListener("click", clearChat);

  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
  input?.addEventListener("input", () => autoGrow(input));

  // Schnellaktionen
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".action-card");
    if (!card?.dataset.prompt) return;
    input.value = card.dataset.prompt + " ";
    autoGrow(input);
    showView("view-chat");
    input.focus();
  });
}

function autoGrow(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 140) + "px";
}
