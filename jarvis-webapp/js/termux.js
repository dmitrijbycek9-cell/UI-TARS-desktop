/* ================================================================
   JARVIS — Termux Bridge
   Zwei Modi:
   1) HTTP-Bridge (empfohlen): ein kleiner Server läuft in Termux,
      die Webapp verbindet sich per fetch zu http://localhost:<port>.
      → echte Ausführung + Ausgabe wird in der Webapp gespiegelt.
   2) Intent-Fallback: öffnet nur die Termux-App (keine Rückgabe).
   ================================================================ */

import { $, esc, fmt, now, toast } from "./ui.js";
import { getSetting, setSetting } from "./db.js";

const DEFAULT_BRIDGE = "http://localhost:8080";

export const termuxBridge = {
  connected: false,

  async getBridgeUrl() {
    return (await getSetting("termux_bridge_url")) || DEFAULT_BRIDGE;
  },
  async getToken() {
    return (await getSetting("termux_bridge_token")) || "";
  },

  // ---- Verbindung zur Bridge prüfen (automatisch) ----
  async checkConnection(silent = true) {
    const url = (await this.getBridgeUrl()).replace(/\/+$/, "");
    const token = await this.getToken();
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    try {
      const res = await fetch(url + "/health", {
        headers: token ? { "X-Token": token } : {},
        signal: ctrl.signal,
      });
      clearTimeout(t);
      this.connected = res.ok;
      this.updateStatus(res.ok);
      if (!silent) toast(res.ok ? "Termux-Bridge verbunden" : "Bridge antwortet nicht");
      return res.ok;
    } catch {
      clearTimeout(t);
      this.connected = false;
      this.updateStatus(false);
      if (!silent) toast("Keine Verbindung zur Termux-Bridge");
      return false;
    }
  },

  // ---- Befehl ausführen ----
  async runCommand(cmd) {
    const clean = cmd.trim();
    if (!clean) return;
    await this.addToHistory(clean);
    this.appendOutput("$ " + clean, "cmd");

    // Bridge-Modus: über HTTP ausführen und Ausgabe spiegeln
    const url = (await this.getBridgeUrl()).replace(/\/+$/, "");
    const token = await this.getToken();
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 60000);
    try {
      const res = await fetch(url + "/exec", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "X-Token": token } : {}),
        },
        body: JSON.stringify({ cmd: clean }),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      if (data.stdout) this.appendOutput(data.stdout, "out");
      if (data.stderr) this.appendOutput(data.stderr, "err");
      this.appendOutput("[exit " + (data.code ?? 0) + "]", "meta");
      this.connected = true;
      this.updateStatus(true);
      return;
    } catch (e) {
      clearTimeout(t);
      // Fallback auf Intent (öffnet Termux, ohne Rückgabe)
      this.appendOutput(
        "⚠ Keine Bridge erreichbar — versuche Intent (keine Ausgabe-Spiegelung möglich).",
        "err"
      );
      this.connected = false;
      this.updateStatus(false);
      this.runViaIntent(clean);
    }
  },

  runViaIntent(cmd) {
    try {
      window.location.href = `intent:#Intent;action=com.termux.RUN_COMMAND;package=com.termux;component=com.termux/com.termux.app.RunCommandService;S.com.termux.RUN_COMMAND_PATH=/data/data/com.termux/files/usr/bin/bash;S.com.termux.RUN_COMMAND_ARGUMENTS=-c,${encodeURIComponent(
        cmd
      )};B.com.termux.RUN_COMMAND_BACKGROUND=true;end`;
      toast("Intent an Termux gesendet (ohne Rückgabe)");
    } catch {
      toast("Termux konnte nicht erreicht werden");
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
        ? "Termux-Bridge verbunden"
        : "Termux nicht verbunden";
  },

  // ---- Ausgabe-Spiegelung ----
  appendOutput(text, kind = "out") {
    const out = $("#termuxOutput");
    if (!out) return;
    const line = document.createElement("div");
    line.className = "termux-out-line " + kind;
    line.textContent = text;
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
  },
  clearOutput() {
    const out = $("#termuxOutput");
    if (out) out.innerHTML = "";
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
  // Bridge-URL / Token laden + speichern
  (async () => {
    const urlEl = $("#bridgeUrl");
    const tokEl = $("#bridgeToken");
    if (urlEl) urlEl.value = await termuxBridge.getBridgeUrl();
    if (tokEl) tokEl.value = await termuxBridge.getToken();
  })();

  $("#bridgeUrl")?.addEventListener("change", (e) =>
    setSetting("termux_bridge_url", e.target.value.trim())
  );
  $("#bridgeToken")?.addEventListener("change", (e) =>
    setSetting("termux_bridge_token", e.target.value.trim())
  );
  $("#bridgeConnect")?.addEventListener("click", async () => {
    await setSetting("termux_bridge_url", $("#bridgeUrl")?.value.trim() || DEFAULT_BRIDGE);
    await setSetting("termux_bridge_token", $("#bridgeToken")?.value.trim() || "");
    termuxBridge.checkConnection(false);
  });
  $("#termuxOutClear")?.addEventListener("click", () => termuxBridge.clearOutput());

  // Setup-Befehl kopieren
  $("#bridgeCopy")?.addEventListener("click", () => {
    const code = $("#bridgeSetupCmd")?.textContent || "";
    navigator.clipboard?.writeText(code).then(() => toast("Befehl kopiert"));
  });

  // Eigener Befehl
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

  // Schnell-Befehle
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".termux-cmd");
    if (btn?.dataset.cmd) termuxBridge.runCommand(btn.dataset.cmd);
  });

  // Verlauf erneut ausführen
  $("#termuxHistory")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".cmd-rerun");
    if (btn?.dataset.cmd) termuxBridge.runCommand(btn.dataset.cmd);
  });

  // Skripte
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

  // Automatische Verbindung, wenn der Termux-Tab geöffnet wird
  $('.tabbar button[data-target="view-terminal"]')?.addEventListener("click", () =>
    termuxBridge.checkConnection(true)
  );
}
