/* ================================================================
   JARVIS — Bootstrap / Initialisierung
   ================================================================ */

import { openDB } from "./db.js";
import { initNav, setStatus, toast, $ } from "./ui.js";
import { initChat, loadChat, sendMessage } from "./chat.js";
import {
  initTasks,
  renderTasks,
  initNotes,
  renderNotes,
  initMemory,
  renderMemory,
} from "./features.js";
import { termuxBridge, initTermux } from "./termux.js";
import { buildProviderUI, loadSettings, initSettings } from "./settings.js";
import { initSpeech, loadVoices } from "./voice.js";
import { maybeRunSetup } from "./setup.js";

async function startApp() {
  await loadSettings();
  loadVoices();
  initSpeech((transcript) => {
    const input = $("#chatInput");
    if (input) input.value = transcript;
    sendMessage(transcript);
  });
  await loadChat();
  await renderTasks();
  await renderNotes();
  await renderMemory();
  await termuxBridge.renderHistory();
  await termuxBridge.renderScripts();
  setStatus("bereit");
}

(async function init() {
  await openDB();

  // UI aus Konfiguration aufbauen + alle Event-Bindings setzen
  buildProviderUI();
  initNav();
  initChat();
  initTasks();
  initNotes();
  initMemory();
  initTermux();
  initSettings();

  // Erststart-Assistent? Sonst normal starten.
  const setupShown = await maybeRunSetup(startApp);
  if (!setupShown) {
    await startApp();
    toast("JARVIS bereit");
  }

  console.log("JARVIS Webapp geladen — 6 KI-Provider + Termux + Setup");
})();

// Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch((err) => console.error("SW Fehler:", err));
  });
}
