/* ================================================================
   JARVIS — Erststart-Assistent (Setup-Wizard)
   ================================================================ */

import { PROVIDERS, PROVIDER_KEYS } from "./config.js";
import { getSetting, setSetting } from "./db.js";
import { $, $$, toast } from "./ui.js";

const wizard = {
  totalSteps: 4,

  async shouldShow() {
    if (!(await getSetting("setupComplete", false))) return true;
    // Setup war abgeschlossen, aber kein Key vorhanden -> nochmal zeigen
    for (const p of PROVIDER_KEYS) {
      const k = await getSetting("apiKey_" + p);
      if (k && k.trim()) return false;
    }
    return true;
  },

  buildFields() {
    const groupHtml = (p) => {
      const cfg = PROVIDERS[p];
      return `
      <div class="setup-provider-group">
        <div class="setup-p-row">
          <span class="setup-p-icon">${cfg.icon}</span>
          <div class="setup-p-info">
            <label>${cfg.name}</label>
            <span class="setup-p-url">${cfg.keyLabel}</span>
          </div>
        </div>
        <input type="password" class="setup-input" id="setupKey_${p}" placeholder="${cfg.keyPlaceholder}" autocomplete="off">
      </div>`;
    };
    const paid = PROVIDER_KEYS.filter((p) => !PROVIDERS[p].free);
    const free = PROVIDER_KEYS.filter((p) => PROVIDERS[p].free);
    const paidEl = $("#setupPaid");
    const freeEl = $("#setupFree");
    if (paidEl) paidEl.innerHTML = paid.map(groupHtml).join("");
    if (freeEl) freeEl.innerHTML = free.map(groupHtml).join("");
  },

  show() {
    const overlay = $("#setupOverlay");
    if (overlay) overlay.style.display = "flex";
    this.goToStep(0);
  },
  hide() {
    const overlay = $("#setupOverlay");
    if (overlay) overlay.style.display = "none";
  },

  goToStep(n) {
    $$(".setup-step").forEach((s) => s.classList.remove("active"));
    $(`.setup-step[data-step="${n}"]`)?.classList.add("active");
    $$(".setup-dot").forEach((d) => d.classList.remove("active"));
    $(`.setup-dot[data-sd="${n}"]`)?.classList.add("active");
  },

  async saveKeys() {
    for (const p of PROVIDER_KEYS) {
      const el = $("#setupKey_" + p);
      if (el && el.value.trim()) await setSetting("apiKey_" + p, el.value.trim());
    }
  },

  async buildSummary() {
    const container = $("#setupSummary");
    let activeCount = 0;
    let html = "";
    for (const p of PROVIDER_KEYS) {
      const cfg = PROVIDERS[p];
      const k = await getSetting("apiKey_" + p);
      const has = !!(k && k.trim());
      if (has) activeCount++;
      html += `<div class="sum-row">
        <span class="sum-icon">${cfg.free ? "🆓" : "💎"}</span>
        <span class="sum-name">${cfg.name}</span>
        <span class="sum-status ${has ? "ok" : "skip"}">${has ? "✓ Bereit" : "Optional"}</span>
      </div>`;
    }
    if (container) container.innerHTML = html;
    const ready = $("#setupReadyText");
    if (ready)
      ready.textContent =
        activeCount > 0
          ? `${activeCount} Provider konfiguriert. JARVIS ist einsatzbereit.`
          : "Keine APIs konfiguriert. Du kannst sie später in den Einstellungen hinzufügen.";
  },

  async finish(onDone) {
    await setSetting("setupComplete", true);
    // Bevorzugt einen kostenlosen Provider als Standard wählen
    for (const p of ["deepseek", "qwen", "kimi", "google"]) {
      const k = await getSetting("apiKey_" + p);
      if (k && k.trim()) {
        await setSetting("primaryProvider", p);
        break;
      }
    }
    this.hide();
    toast("JARVIS ist bereit!");
    if (onDone) await onDone();
  },
};

export async function maybeRunSetup(onDone) {
  if (!(await wizard.shouldShow())) return false;

  wizard.buildFields();
  wizard.show();

  // Vorhandene Keys in die Felder laden
  for (const p of PROVIDER_KEYS) {
    const k = await getSetting("apiKey_" + p);
    const el = $("#setupKey_" + p);
    if (el && k) el.value = k;
  }

  $("#setupStart")?.addEventListener("click", () => wizard.goToStep(1));
  $("#setupSkip")?.addEventListener("click", () => wizard.finish(onDone));
  $("#setupBack1")?.addEventListener("click", () => wizard.goToStep(0));
  $("#setupNext1")?.addEventListener("click", () => wizard.goToStep(2));
  $("#setupBack2")?.addEventListener("click", () => wizard.goToStep(1));
  $("#setupNext2")?.addEventListener("click", async () => {
    await wizard.saveKeys();
    await wizard.buildSummary();
    wizard.goToStep(3);
  });
  $("#setupFinish")?.addEventListener("click", () => wizard.finish(onDone));

  return true;
}
