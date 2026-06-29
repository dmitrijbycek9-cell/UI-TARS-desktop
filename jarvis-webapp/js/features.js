/* ================================================================
   JARVIS — Aufgaben, Notizen, Gedächtnis (CRUD + Rendering)
   ================================================================ */

import { dbAll, dbGet, dbPut, dbDel, getSetting, setSetting } from "./db.js";
import { $, esc, fmt, now, toast } from "./ui.js";

// =================================================================
// AUFGABEN
// =================================================================

export async function renderTasks() {
  const items = (await dbAll("tasks")).sort((a, b) => b.created - a.created);
  const list = $("#taskList");
  if (!list) return;
  if (!items.length) {
    list.innerHTML = '<p class="empty">Keine Aufgaben vorhanden.</p>';
    return;
  }
  list.innerHTML = items
    .map(
      (t) => `
    <div class="item task${t.done ? " done" : ""}" data-id="${t.id}">
      <div class="row">
        <input type="checkbox" class="task-check" ${t.done ? "checked" : ""}>
        <span class="task-text">${esc(t.text)}</span>
        <button class="btn-del" data-action="task-del" title="Löschen">&times;</button>
      </div>
      <div class="meta">${fmt(t.created)}</div>
    </div>`
    )
    .join("");
}

export async function addTask(text) {
  const t = text.trim();
  if (!t) return;
  await dbPut("tasks", { id: "t" + now(), text: t, done: false, created: now() });
  await renderTasks();
}

async function toggleTask(id, done) {
  const t = await dbGet("tasks", id);
  if (t) {
    t.done = done;
    await dbPut("tasks", t);
    await renderTasks();
  }
}

export function initTasks() {
  const input = $("#taskInput");
  const addBtn = $("#taskAddBtn");
  const submit = async () => {
    if (!input.value.trim()) return;
    await addTask(input.value);
    input.value = "";
    toast("Aufgabe hinzugefügt");
  };
  addBtn?.addEventListener("click", submit);
  input?.addEventListener("keydown", (e) => e.key === "Enter" && submit());

  $("#taskList")?.addEventListener("click", async (e) => {
    const row = e.target.closest(".task");
    if (!row) return;
    if (e.target.matches('[data-action="task-del"]')) {
      await dbDel("tasks", row.dataset.id);
      await renderTasks();
    }
  });
  $("#taskList")?.addEventListener("change", (e) => {
    if (e.target.matches(".task-check")) {
      const row = e.target.closest(".task");
      toggleTask(row.dataset.id, e.target.checked);
    }
  });
}

// =================================================================
// NOTIZEN (Titel + Inhalt)
// =================================================================

export async function renderNotes() {
  const items = (await dbAll("notes")).sort((a, b) => b.created - a.created);
  const list = $("#noteList");
  if (!list) return;
  if (!items.length) {
    list.innerHTML = '<p class="empty">Keine Notizen vorhanden.</p>';
    return;
  }
  list.innerHTML = items
    .map(
      (n) => `
    <div class="item note" data-id="${n.id}">
      <div class="row">
        <div class="note-main">
          ${n.title ? `<div class="note-title">${esc(n.title)}</div>` : ""}
          ${n.body ? `<div class="note-body">${esc(n.body)}</div>` : ""}
        </div>
        <button class="btn-del" data-action="note-del" title="Löschen">&times;</button>
      </div>
      <div class="meta">${fmt(n.created)}</div>
    </div>`
    )
    .join("");
}

export async function addNote(title, body) {
  title = (title || "").trim();
  body = (body || "").trim();
  if (!title && !body) return;
  await dbPut("notes", { id: "n" + now(), title, body, created: now() });
  await renderNotes();
}

export function initNotes() {
  const titleEl = $("#noteTitle");
  const bodyEl = $("#noteBody");
  const submit = async () => {
    if (!titleEl.value.trim() && !bodyEl.value.trim()) return;
    await addNote(titleEl.value, bodyEl.value);
    titleEl.value = "";
    bodyEl.value = "";
    toast("Notiz gespeichert");
  };
  $("#noteAddBtn")?.addEventListener("click", submit);
  titleEl?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") bodyEl.focus();
  });

  $("#noteList")?.addEventListener("click", async (e) => {
    if (e.target.matches('[data-action="note-del"]')) {
      const row = e.target.closest(".note");
      await dbDel("notes", row.dataset.id);
      await renderNotes();
    }
  });
}

// =================================================================
// GEDÄCHTNIS (Wissensbank)
// =================================================================

export async function renderMemory(filter = "") {
  let items = await dbAll("memory");
  if (filter) {
    const q = filter.toLowerCase();
    items = items.filter((m) => m.text.toLowerCase().includes(q));
  }
  items.sort((a, b) => b.created - a.created);
  const list = $("#memoryList");
  if (!list) return;
  if (!items.length) {
    list.innerHTML = filter
      ? '<p class="empty">Keine Ergebnisse.</p>'
      : '<p class="empty">Noch keine Einträge — sag "Merke: …" im Chat.</p>';
    return;
  }
  list.innerHTML = items
    .map(
      (m) => `
    <div class="item mem" data-id="${m.id}">
      <div class="row">
        <span class="mem-text">${esc(m.text)}</span>
        <button class="btn-del" data-action="mem-del" title="Löschen">&times;</button>
      </div>
      <div class="meta">${fmt(m.created)}</div>
    </div>`
    )
    .join("");
}

export async function addMemory(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const existing = await dbAll("memory");
  if (existing.some((m) => m.text.toLowerCase() === trimmed.toLowerCase()))
    return;
  await dbPut("memory", { id: "m" + now(), text: trimmed, created: now() });
  await renderMemory(currentMemFilter());
}

function currentMemFilter() {
  const s = $("#memorySearch");
  return s ? s.value : "";
}

export function initMemory() {
  const input = $("#memoryInput");
  const submit = async () => {
    if (!input.value.trim()) return;
    await addMemory(input.value);
    input.value = "";
    toast("Wissen gespeichert");
  };
  $("#memoryAddBtn")?.addEventListener("click", submit);
  input?.addEventListener("keydown", (e) => e.key === "Enter" && submit());
  $("#memorySearch")?.addEventListener("input", (e) =>
    renderMemory(e.target.value)
  );

  $("#memoryList")?.addEventListener("click", async (e) => {
    if (e.target.matches('[data-action="mem-del"]')) {
      const row = e.target.closest(".mem");
      await dbDel("memory", row.dataset.id);
      await renderMemory(currentMemFilter());
    }
  });
}

// =================================================================
// EIGENE SCHNELLAKTIONEN (in den Einstellungen via IndexedDB-Settings)
// =================================================================

export async function getCustomActions() {
  return (await getSetting("custom_actions")) || [];
}

export async function renderCustomActions() {
  const list = $("#customActionList");
  if (!list) return;
  const items = await getCustomActions();
  if (!items.length) {
    list.innerHTML =
      '<p class="empty">Noch keine eigenen Aktionen. Lege oben eine an.</p>';
    return;
  }
  list.innerHTML = items
    .map(
      (a) => `
    <button class="action-card custom" data-prompt="${esc(a.prompt)}">
      <span class="btn-del" data-action="custom-del" data-id="${a.id}" title="Löschen">&times;</span>
      <div class="action-icon" style="color:var(--amber)">⭐</div>
      <div class="action-title">${esc(a.title)}</div>
      <div class="action-desc">${esc(a.prompt.slice(0, 48))}</div>
    </button>`
    )
    .join("");
}

export async function addCustomAction(title, prompt) {
  title = (title || "").trim();
  prompt = (prompt || "").trim();
  if (!title || !prompt) {
    toast("Titel und Prompt eingeben");
    return;
  }
  const items = await getCustomActions();
  items.push({ id: "a" + now(), title, prompt });
  await setSetting("custom_actions", items);
  await renderCustomActions();
  toast("Aktion gespeichert");
}

async function deleteCustomAction(id) {
  const items = (await getCustomActions()).filter((a) => a.id !== id);
  await setSetting("custom_actions", items);
  await renderCustomActions();
}

export function initCustomActions() {
  const titleEl = $("#customActionTitle");
  const promptEl = $("#customActionPrompt");
  const submit = async () => {
    await addCustomAction(titleEl.value, promptEl.value);
    titleEl.value = "";
    promptEl.value = "";
  };
  $("#customActionAdd")?.addEventListener("click", submit);
  promptEl?.addEventListener("keydown", (e) => e.key === "Enter" && submit());

  // Löschen abfangen, bevor der globale .action-card-Handler (chat.js) feuert
  $("#customActionList")?.addEventListener("click", (e) => {
    const del = e.target.closest('[data-action="custom-del"]');
    if (del) {
      e.stopPropagation();
      e.preventDefault();
      deleteCustomAction(del.dataset.id);
    }
  });
}
