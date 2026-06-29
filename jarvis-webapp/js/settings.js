/* ================================================================
   JARVIS — Einstellungen: dynamische Provider-Panels, Key-Verwaltung,
   TTS/Stimme, Backup/Import, Daten löschen
   ================================================================ */

import { PROVIDERS, PROVIDER_KEYS, getDefaultModel } from "./config.js";
import {
  getSetting,
  setSetting,
  dbAll,
  dbPut,
  dbClear,
  STORE_NAMES,
} from "./db.js";
import { $, $$, toast, setStatus, confirmDialog } from "./ui.js";
import { callAI } from "./chat.js";
import { setVoice } from "./voice.js";

// =================================================================
// PROVIDER-UI AUS KONFIG GENERIEREN
// =================================================================

export function buildProviderUI() {
  const tabs = $("#providerTabs");
  const panels = $("#providerPanels");
  const primary = $("#primaryProvider");
  if (!tabs || !panels) return;

  tabs.innerHTML = PROVIDER_KEYS.map(
    (p, i) => `
    <button class="provider-tab${i === 0 ? " active" : ""}${
      PROVIDERS[p].free ? " free" : ""
    }" data-provider="${p}" title="${PROVIDERS[p].name}">
      <span class="provider-icon">${PROVIDERS[p].icon}</span>
      <span class="provider-label">${PROVIDERS[p].name}</span>
    </button>`
  ).join("");

  panels.innerHTML = PROVIDER_KEYS.map((p, i) => {
    const cfg = PROVIDERS[p];
    const opts = cfg.models
      .map((m) => `<option value="${m.id}">${m.label}</option>`)
      .join("");
    return `
    <div class="provider-panel${i === 0 ? " active" : ""}" data-panel="${p}">
      ${cfg.free ? '<div class="free-badge">🆓 KOSTENLOS</div>' : ""}
      <div class="setting">
        <label for="apiKey_${p}">${cfg.name} API-Key</label>
        <div class="key-row">
          <input type="password" id="apiKey_${p}" placeholder="${cfg.keyPlaceholder}" autocomplete="off">
          <button type="button" class="key-toggle" data-target="apiKey_${p}" title="Anzeigen/Verbergen">👁</button>
        </div>
        <div class="hint"><a href="${cfg.keyUrl}" target="_blank" rel="noopener">${cfg.keyLabel}</a> — Keys werden nur lokal gespeichert.</div>
        <button type="button" class="secondary-btn key-test" data-provider="${p}">Key testen</button>
      </div>
      <div class="setting">
        <label for="model_${p}">Modell</label>
        <select id="model_${p}">${opts}</select>
      </div>
    </div>`;
  }).join("");

  if (primary) {
    primary.innerHTML = PROVIDER_KEYS.map(
      (p) =>
        `<option value="${p}">${PROVIDERS[p].icon} ${PROVIDERS[p].name}${
          PROVIDERS[p].free ? " (kostenlos)" : ""
        }</option>`
    ).join("");
  }
}

// =================================================================
// WERTE LADEN
// =================================================================

export async function loadSettings() {
  for (const p of PROVIDER_KEYS) {
    const key = (await getSetting("apiKey_" + p)) || "";
    const keyEl = $("#apiKey_" + p);
    if (keyEl) keyEl.value = key;

    const model = await getSetting("model_" + p, getDefaultModel(p));
    const modelEl = $("#model_" + p);
    if (modelEl) modelEl.value = model;
  }
  const pp = await getSetting("primaryProvider", "anthropic");
  const ppEl = $("#primaryProvider");
  if (ppEl) ppEl.value = pp;

  const ttsEl = $("#ttsToggle");
  if (ttsEl) ttsEl.checked = (await getSetting("tts")) || false;
}

// =================================================================
// EVENT-BINDINGS
// =================================================================

export function initSettings() {
  // Provider-Tab-Umschaltung
  $("#providerTabs")?.addEventListener("click", (e) => {
    const tab = e.target.closest(".provider-tab");
    if (!tab) return;
    const p = tab.dataset.provider;
    $$(".provider-tab").forEach((t) => t.classList.remove("active"));
    $$(".provider-panel").forEach((pl) => pl.classList.remove("active"));
    tab.classList.add("active");
    $(`.provider-panel[data-panel="${p}"]`)?.classList.add("active");
  });

  // Key-Felder + Modelle speichern (Event-Delegation auf Panels)
  $("#providerPanels")?.addEventListener("change", async (e) => {
    const t = e.target;
    if (t.matches('input[id^="apiKey_"]')) {
      const p = t.id.replace("apiKey_", "");
      await setSetting("apiKey_" + p, t.value.trim());
      toast(PROVIDERS[p].name + " Key gespeichert");
    } else if (t.matches('select[id^="model_"]')) {
      const p = t.id.replace("model_", "");
      await setSetting("model_" + p, t.value);
      toast("Modell: " + t.options[t.selectedIndex].text);
    }
  });

  // Key anzeigen/verbergen + testen
  $("#providerPanels")?.addEventListener("click", async (e) => {
    const toggle = e.target.closest(".key-toggle");
    if (toggle) {
      const input = $("#" + toggle.dataset.target);
      if (input)
        input.type = input.type === "password" ? "text" : "password";
      return;
    }
    const test = e.target.closest(".key-test");
    if (test) {
      await testKey(test.dataset.provider, test);
    }
  });

  // Aktiver Provider
  $("#primaryProvider")?.addEventListener("change", async (e) => {
    await setSetting("primaryProvider", e.target.value);
    toast("Chat-Provider: " + PROVIDERS[e.target.value].name);
    setStatus("bereit");
  });

  // TTS
  $("#ttsToggle")?.addEventListener("change", async (e) => {
    await setSetting("tts", e.target.checked);
    toast(e.target.checked ? "Sprachausgabe aktiviert" : "Sprachausgabe deaktiviert");
  });

  // Stimme
  $("#voiceSelect")?.addEventListener("change", (e) => {
    setVoice(e.target.value);
    toast("Stimme ausgewählt");
  });

  // Backup / Import / Wipe
  $("#exportBtn")?.addEventListener("click", exportBackup);
  $("#importBtn")?.addEventListener("click", () => $("#importFile")?.click());
  $("#importFile")?.addEventListener("change", (e) => {
    if (e.target.files[0]) importBackup(e.target.files[0]);
    e.target.value = "";
  });
  $("#wipeBtn")?.addEventListener("click", wipeAll);
}

async function testKey(provider, btn) {
  const key = await getSetting("apiKey_" + provider);
  if (!key) {
    toast("Erst einen Key eingeben");
    return;
  }
  const orig = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Teste…";
  try {
    const model = await getSetting("model_" + provider, getDefaultModel(provider));
    await callAI(provider, model, "Du bist ein Test.", [
      { role: "user", content: "Antworte nur mit OK." },
    ]);
    toast(PROVIDERS[provider].name + ": Key funktioniert ✓");
  } catch (e) {
    toast(PROVIDERS[provider].name + ": fehlgeschlagen — " + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = orig;
  }
}

// =================================================================
// BACKUP / IMPORT / WIPE
// =================================================================

async function exportBackup() {
  const data = { version: "jarvis-webapp-v1", exportedAt: new Date().toISOString() };
  for (const s of STORE_NAMES) data[s] = await dbAll(s);

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "jarvis-backup-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  URL.revokeObjectURL(url);
  toast("Backup exportiert — enthält API-Keys, sicher aufbewahren!");
}

async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!data.version || !String(data.version).includes("jarvis")) {
      toast("Ungültiges Backup-Format");
      return;
    }
    for (const s of STORE_NAMES) {
      if (!Array.isArray(data[s])) continue;
      await dbClear(s);
      for (const item of data[s]) await dbPut(s, item);
    }
    toast("Backup importiert — App wird neu geladen…");
    setTimeout(() => location.reload(), 800);
  } catch (e) {
    console.error("Import-Fehler:", e);
    toast("Fehler beim Import: " + e.message);
  }
}

async function wipeAll() {
  const ok = await confirmDialog(
    "Alle Daten (Chat, Aufgaben, Notizen, Wissen, Einstellungen, API-Keys) werden unwiderruflich gelöscht. Bist du sicher?"
  );
  if (!ok) return;
  for (const s of STORE_NAMES) await dbClear(s);
  toast("Alle Daten gelöscht — App wird neu geladen…");
  setTimeout(() => location.reload(), 800);
}
