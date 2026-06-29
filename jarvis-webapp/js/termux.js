/* ================================================================
   JARVIS — Termux Bridge (Android-Terminal über Intents)
   Hinweis: Funktioniert nur auf Android mit installierter Termux-App.
   ================================================================ */

import { $, esc, fmt, now, toast } from "./ui.js";
import { getSetting, setSetting } from "./db.js";

export const termuxBridge = {
  async runCommand(cmd) {
    const clean = cmd.trim();
    if (!clean) return;
    await this.addToHistory(clean);

    try {
      window.location.href = `intent:#Intent;action=com.termux.RUN_COMMAND;S.com.termux.RUN_COMMAND_PATH=/data/data/com.termux/files/usr/bin/bash;S.com.termux.RUN_COMMAND_ARGUMENTS=-c,${encodeURIComponent(
        clean
      )};end`;
      toast("Befehl an Termux gesendet: " + clean.substring(0, 30));
      this.updateStatus(true);
    } catch (e) {
      console.error("Termux Error:", e);
      toast("Termux konnte nicht erreicht werden");
      this.updateStatus(false);
      this.openTermux();
    }
  },

  openTermux() {
    try {
      window.location.href =
        "intent:#Intent;package=com.termux;class=com.termux.app.TermuxActivity;end";
      toast("Termux wird geöffnet…");
    } catch {
      window.open(
        "https://play.google.com/store/apps/details?id=com.termux",
        "_blank",
        "noopener"
      );
    }
  },

  async sshConnect(host, port = "22") {
    if (!host) {
      toast("Host eingeben");
      return;
    }
    await this.runCommand(`ssh -p ${port} ${host}`);
  },

  updateStatus(connected) {
    const dot = $("#termuxDot");
    const text = $("#termuxStatusText");
    if (dot) dot.classList.toggle("connected", connected);
    if (text)
      text.textContent = connected
        ? "Termux verbunden"
        : "Termux nicht verbunden";
  },

  // ---- Verlauf ----
  async getHistory() {
    return (await getSetting("termux_history")) || [];
  },
  async addToHistory(cmd) {
    const history = await this.getHistory();
    history.unshift({ cmd, time: now() });
    if (history.length > 50) history.pop();
    await setSetting("termux_history", history);
    await this.renderHistory();
  },
  async renderHistory() {
    const list = $("#termuxHistory");
    if (!list) return;
    const history = await this.getHistory();
    if (!history.length) {
      list.innerHTML = '<p class="empty">Noch keine Befehle ausgeführt.</p>';
      return;
    }
    list.innerHTML = history
      .map(
        (h) => `
      <div class="termux-history-item">
        <div>
          <div class="cmd-text">$ ${esc(h.cmd)}</div>
          <div class="cmd-time">${fmt(h.time)}</div>
        </div>
        <button class="cmd-rerun" data-cmd="${esc(h.cmd)}" title="Erneut ausführen">&#9654;</button>
      </div>`
      )
      .join("");
  },

  // ---- Skripte ----
  async getScripts() {
    return (await getSetting("termux_scripts")) || [];
  },
  async saveScript(name, cmd) {
    name = name.trim();
    cmd = cmd.trim();
    if (!name || !cmd) {
      toast("Name und Befehl eingeben");
      return;
    }
    const scripts = await this.getScripts();
    scripts.push({ id: "s" + now(), name, cmd, created: now() });
    await setSetting("termux_scripts", scripts);
    await this.renderScripts();
    toast("Skript gespeichert");
  },
  async deleteScript(id) {
    const scripts = (await this.getScripts()).filter((s) => s.id !== id);
    await setSetting("termux_scripts", scripts);
    await this.renderScripts();
  },
  async renderScripts() {
    const list = $("#termuxScripts");
    if (!list) return;
    const scripts = await this.getScripts();
    if (!scripts.length) {
      list.innerHTML = '<p class="empty">Noch keine Skripte gespeichert.</p>';
      return;
    }
    list.innerHTML = scripts
      .map(
        (s) => `
      <div class="termux-script-item" data-id="${s.id}">
        <div>
          <div class="script-name">${esc(s.name)}</div>
          <div class="script-cmd">$ ${esc(s.cmd)}</div>
        </div>
        <div class="script-actions">
          <button data-action="run-script" title="Ausführen">&#9654;</button>
          <button data-action="del-script" title="Löschen">&#128465;</button>
        </div>
      </div>`
      )
      .join("");
  },
};

export function initTermux() {
  $("#termuxRun")?.addEventListener("click", () => {
    const input = $("#termuxInput");
    if (input?.value) {
      termuxBridge.runCommand(input.value);
      input.value = "";
    }
  });
  $("#termuxInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      termuxBridge.runCommand(e.target.value);
      e.target.value = "";
    }
  });

  // Schnell-Befehle (Event-Delegation)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".termux-cmd");
    if (btn?.dataset.cmd) termuxBridge.runCommand(btn.dataset.cmd);
  });

  // Verlauf erneut ausführen
  $("#termuxHistory")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".cmd-rerun");
    if (btn?.dataset.cmd) termuxBridge.runCommand(btn.dataset.cmd);
  });

  // Skripte ausführen / löschen
  $("#termuxScripts")?.addEventListener("click", (e) => {
    const item = e.target.closest(".termux-script-item");
    if (!item) return;
    if (e.target.matches('[data-action="run-script"]')) {
      termuxBridge.getScripts().then((scripts) => {
        const s = scripts.find((x) => x.id === item.dataset.id);
        if (s) termuxBridge.runCommand(s.cmd);
      });
    } else if (e.target.matches('[data-action="del-script"]')) {
      termuxBridge.deleteScript(item.dataset.id);
    }
  });

  // SSH
  $("#sshConnect")?.addEventListener("click", () => {
    const host = $("#sshHost")?.value;
    const port = $("#sshPort")?.value || "22";
    termuxBridge.sshConnect(host, port);
  });

  // Skript speichern
  $("#scriptSave")?.addEventListener("click", () => {
    const name = $("#scriptName");
    const cmd = $("#scriptCmd");
    if (name && cmd) {
      termuxBridge.saveScript(name.value, cmd.value);
      name.value = "";
      cmd.value = "";
    }
  });

  $("#openTermuxBtn")?.addEventListener("click", () => termuxBridge.openTermux());
  $("#installTermuxBtn")?.addEventListener("click", () =>
    window.open(
      "https://play.google.com/store/apps/details?id=com.termux",
      "_blank",
      "noopener"
    )
  );
}
