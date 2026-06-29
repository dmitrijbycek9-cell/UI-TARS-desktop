/* ================================================================
   JARVIS — Sprachein- und -ausgabe (Web Speech API)
   ================================================================ */

import { $, toast } from "./ui.js";
import { getSetting } from "./db.js";

let voices = [];
let preferredVoice = null;
let recognition = null;

// ---- Sprachausgabe (TTS) ----
export function loadVoices() {
  voices = speechSynthesis.getVoices();
  const sel = $("#voiceSelect");
  if (!sel) return;

  const saved = localStorage.getItem("jarvis_voice");
  sel.innerHTML = '<option value="">System-Standard</option>';

  const de = voices.filter((v) => v.lang.startsWith("de"));
  const other = voices.filter((v) => !v.lang.startsWith("de"));

  const addGroup = (label, list) => {
    if (!list.length) return;
    const g = document.createElement("optgroup");
    g.label = label;
    list.forEach((v) => {
      const o = document.createElement("option");
      o.value = v.name;
      o.textContent = `${v.name} (${v.lang})`;
      g.appendChild(o);
      if (v.name === saved) preferredVoice = v;
    });
    sel.appendChild(g);
  };
  addGroup("Deutsch", de);
  addGroup("Andere Sprachen", other);
  if (saved) sel.value = saved;
}

export function setVoice(name) {
  localStorage.setItem("jarvis_voice", name);
  preferredVoice = voices.find((v) => v.name === name) || null;
}

export async function speak(text) {
  if (!("speechSynthesis" in window)) return;
  if (!(await getSetting("tts"))) return;

  const shortText = text.split("\n")[0].substring(0, 240);
  const utter = new SpeechSynthesisUtterance(shortText);
  utter.lang = "de-DE";
  utter.voice = preferredVoice || voices.find((v) => v.lang.startsWith("de")) || null;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

// ---- Spracheingabe ----
export function initSpeech(onTranscript) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = $("#micBtn");
  if (!SR) {
    if (micBtn) micBtn.style.display = "none";
    return;
  }
  recognition = new SR();
  recognition.lang = "de-DE";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (e) => onTranscript(e.results[0][0].transcript);
  recognition.onerror = () => {
    toast("Spracherkennung fehlgeschlagen");
    micBtn?.classList.remove("listening");
  };
  recognition.onend = () => micBtn?.classList.remove("listening");

  micBtn?.addEventListener("click", () => {
    if (micBtn.classList.contains("listening")) {
      recognition.stop();
      micBtn.classList.remove("listening");
    } else {
      micBtn.classList.add("listening");
      recognition.start();
    }
  });
}

if (typeof speechSynthesis !== "undefined" && speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = loadVoices;
}
