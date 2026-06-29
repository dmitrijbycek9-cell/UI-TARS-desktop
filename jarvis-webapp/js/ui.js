/* ================================================================
   JARVIS — UI-Helfer: Navigation, Toast, Modal, Status, Markdown
   ================================================================ */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const now = () => Date.now();

export const fmt = (ts) =>
  new Date(ts).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

// HTML-sicheres Escapen
export function esc(text) {
  const d = document.createElement("div");
  d.textContent = text == null ? "" : String(text);
  return d.innerHTML;
}

// ---- Toast ----
let toastTimer;
export function toast(msg) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2500);
}

// ---- Statusanzeige im Header ----
export function setStatus(txt, ok = true) {
  const dot = $("#statusDot");
  const text = $("#statusText");
  if (text) text.textContent = txt;
  if (dot) {
    dot.style.background = ok ? "var(--green)" : "var(--red)";
    dot.style.boxShadow = ok ? "0 0 8px var(--green)" : "0 0 8px var(--red)";
  }
}

// ---- Navigation zwischen Views ----
// data-target entspricht exakt der Section-id (z.B. "view-chat")
export function showView(viewId) {
  $$("#app > section.view").forEach((s) => s.classList.remove("active"));
  const view = $("#" + viewId);
  if (view) view.classList.add("active");

  $$(".tabbar button[data-target]").forEach((b) =>
    b.classList.toggle("active", b.dataset.target === viewId)
  );
  // Beim Ansichtswechsel nach oben scrollen
  const main = $("#app");
  if (main) main.scrollTop = 0;
}

export function initNav() {
  $$(".tabbar button[data-target]").forEach((btn) =>
    btn.addEventListener("click", () => showView(btn.dataset.target))
  );
}

// ---- Bestätigungs-Modal (Promise-basiert) ----
export function confirmDialog(text) {
  return new Promise((resolve) => {
    const overlay = $("#modalOverlay");
    const textEl = $("#modalText");
    const okBtn = $("#modalConfirm");
    const cancelBtn = $("#modalCancel");
    if (!overlay) return resolve(false);

    if (textEl) textEl.textContent = text;
    overlay.classList.add("show");

    const cleanup = (result) => {
      overlay.classList.remove("show");
      okBtn.removeEventListener("click", onOk);
      cancelBtn.removeEventListener("click", onCancel);
      resolve(result);
    };
    const onOk = () => cleanup(true);
    const onCancel = () => cleanup(false);
    okBtn.addEventListener("click", onOk);
    cancelBtn.addEventListener("click", onCancel);
  });
}

// ---- Minimaler, sicherer Markdown-Renderer ----
// Erst escapen, dann eine kleine Teilmenge von Markdown rendern.
export function renderMarkdown(text) {
  let html = esc(text);

  // Code-Blöcke ```...```
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
    return `<pre><code>${code.replace(/^\n/, "")}</code></pre>`;
  });
  // Inline-Code `...`
  html = html.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  // Fett **...**
  html = html.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  // Kursiv *...* (nicht innerhalb von Wörtern)
  html = html.replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  // Links [text](url) — nur http(s)
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Listen & Absätze zeilenweise aufbauen
  const lines = html.split("\n");
  let out = "";
  let inList = false;
  for (const line of lines) {
    const li = line.match(/^\s*[-*]\s+(.*)$/);
    if (li) {
      if (!inList) {
        out += "<ul>";
        inList = true;
      }
      out += `<li>${li[1]}</li>`;
    } else {
      if (inList) {
        out += "</ul>";
        inList = false;
      }
      out += line + "\n";
    }
  }
  if (inList) out += "</ul>";

  // Übrige Zeilenumbrüche (außerhalb von <pre>) in <br> wandeln
  return out
    .split(/(<pre>[\s\S]*?<\/pre>)/g)
    .map((seg) =>
      seg.startsWith("<pre>") ? seg : seg.replace(/\n/g, "<br>")
    )
    .join("")
    .replace(/(<br>\s*){2,}/g, "<br>");
}
