# JARVIS — Multi-Model KI-Assistent (Webapp / PWA)

Eine abhängigkeitsfreie Progressive Web App (Vanilla JS, kein Build-Schritt) für
einen persönlichen KI-Assistenten mit mehreren Providern.

## Funktionen
- **6 KI-Provider**: Claude, ChatGPT, Gemini, DeepSeek, Qwen, Kimi — mit
  Streaming-Antworten, automatischem Fallback auf kostenlose Provider und
  per-Provider "Key testen".
- **Chat** mit Markdown-Darstellung, Kopieren pro Nachricht, Stopp-Button,
  Verlauf löschen und automatischer `MERKE:`-Erfassung ins Gedächtnis.
- **Aufgaben**, **Notizen** (Titel + Inhalt), **Gedächtnis** (mit Suche).
- **Anpassbare JARVIS-Persönlichkeit** (editierbarer System-Prompt + Vorlagen).
- **Eigene Schnellaktionen** (selbst angelegte Prompt-Karten in „Aktionen").
- **Chat-Export als Markdown**.
- **Termux-Bridge** (Android-Terminal): ein winziger HTTP-Server läuft in
  Termux (`termux-bridge-server.py`), die Webapp verbindet sich per
  `http://localhost` und führt Befehle aus **mit gespiegelter Ausgabe** im
  Terminal-Fenster. Automatische Verbindung beim Öffnen des Tabs, Verlauf,
  gespeicherte Skripte, SSH-Quick-Connect. Intent-„App öffnen" als Fallback.
- **Sprachein-/-ausgabe** (Web Speech API), **Backup/Import**, **Setup-Assistent**.
- Offline-fähig (Service Worker) und installierbar (Manifest).

## Architektur
Die gesamte Oberfläche (Provider-Tabs, Modell-Dropdowns, Key-Felder, Setup) wird
aus **einer einzigen Konfiguration** in `js/config.js` generiert — dadurch können
HTML- und JS-IDs nicht mehr auseinanderlaufen.

```
index.html        – Markup + dynamische Container
styles.css        – dunkles Theme
sw.js             – Service Worker (Network-First für Navigation, Cache-First für Assets)
manifest.json     – PWA-Manifest
js/
  config.js       – PROVIDERS (Endpoint, Header, Body, Parser, Stream-Delta, Modelle)
  db.js           – IndexedDB + Settings
  ui.js           – Navigation, Toast, Modal, Status, Markdown-Renderer
  features.js     – Aufgaben / Notizen / Gedächtnis
  chat.js         – callAI (Streaming + Fallback), MERKE, lokale Befehle
  voice.js        – TTS + Spracherkennung
  termux.js       – Termux-Bridge
  settings.js     – Provider-Panels, Key-Verwaltung, Backup/Import, Wipe
  setup.js        – Erststart-Assistent
  main.js         – Bootstrap
```

## Lokal starten
Es wird ein statischer Server benötigt (ES-Module + Service Worker laufen nicht
über `file://`):

```bash
cd jarvis-webapp
python3 -m http.server 8000
# Browser: http://localhost:8000/index.html
```

## Sicherheit
- API-Keys werden **nur lokal** (IndexedDB) gespeichert; Anfragen gehen direkt
  vom Browser an den jeweiligen Provider.
- Das exportierte Backup enthält die Keys — entsprechend sicher aufbewahren.
