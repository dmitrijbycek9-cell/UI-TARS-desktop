/* ================================================================
   JARVIS — IndexedDB-Schicht
   Stores: tasks, notes, memory, chat, settings
   ================================================================ */

const DB_NAME = "jarvis-db";
const DB_VER = 1;
const STORES = ["tasks", "notes", "memory", "chat", "settings"];
let db = null;

export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      STORES.forEach((s) => {
        if (!d.objectStoreNames.contains(s)) {
          // settings nutzt "key", alle anderen "id"
          d.createObjectStore(s, { keyPath: s === "settings" ? "key" : "id" });
        }
      });
    };
    req.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

function store(name, mode = "readonly") {
  return db.transaction(name, mode).objectStore(name);
}

export function dbAll(name) {
  return new Promise((resolve, reject) => {
    const out = [];
    const req = store(name).openCursor();
    req.onsuccess = (e) => {
      const c = e.target.result;
      if (c) {
        out.push(c.value);
        c.continue();
      } else resolve(out);
    };
    req.onerror = () => reject(req.error);
  });
}

export function dbPut(name, item) {
  return new Promise((resolve, reject) => {
    const r = store(name, "readwrite").put(item);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export function dbGet(name, id) {
  return new Promise((resolve, reject) => {
    const r = store(name).get(id);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export function dbDel(name, id) {
  return new Promise((resolve, reject) => {
    const r = store(name, "readwrite").delete(id);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}

export function dbClear(name) {
  return new Promise((resolve, reject) => {
    const r = store(name, "readwrite").clear();
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}

export const STORE_NAMES = STORES;

// ---- Settings-Helfer ----
export function getSetting(key, fallback = "") {
  return new Promise((resolve) => {
    const r = store("settings").get(key);
    r.onsuccess = () => resolve(r.result ? r.result.value : fallback);
    r.onerror = () => resolve(fallback);
  });
}

export function setSetting(key, value) {
  return dbPut("settings", { key, value });
}
