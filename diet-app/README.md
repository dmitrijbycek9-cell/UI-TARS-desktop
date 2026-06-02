# 🥗 Ernährungs-Tagebuch (Diät- & Gesundheits-Tracker)

Eine eigenständige, installierbare **Progressive Web App** zur Ernährungs- und
Fitnesskontrolle. Alle Daten bleiben **lokal auf deinem Gerät** (IndexedDB),
kein Konto, kein Server, **offline-fähig**. Oberfläche auf **Deutsch**.

Die App ist bewusst unabhängig vom restlichen Monorepo (eigenes `package.json`,
eigener Vite-Build) und nicht in pnpm-workspaces/turbo eingebunden.

## Funktionen

- **📖 Essens-Tagebuch** – Einträge pro Mahlzeit (Frühstück, Mittag, Abend, Snack)
  mit vollen Nährwerten; Tagessummen gegen deine persönlichen Ziele, Datumswechsel.
- **📷 Barcode-/QR-Scanner** – Produkt scannen (z. B. Salami-Packung), Nährwerte
  werden von **Open Food Facts** geladen, Portionsgröße wählen → automatisch in
  Kalorien/Makros umgerechnet und ins Tagebuch übernommen. Manuelle Eingabe als
  Fallback; gescannte Produkte werden gecacht und sind offline wiederverwendbar.
- **🍳 Rezepte & Kochbuch** – eingebautes Kochbuch (A–Z), eigener Rezept-Builder,
  der Gesamt- und Pro-Portion-Nährwerte automatisch berechnet. **Tagesvorschläge**
  passend zu deinem verbleibenden Kalorienbudget.
- **👤 Körperindex** – BMI, Grundumsatz (BMR, Mifflin-St Jeor), Gesamtumsatz (TDEE)
  und empfohlene Tageskalorien + Makros aus deinen Angaben.
- **🏃 Fitness** – Trainingseinheiten mit (automatisch über MET geschätztem)
  Kalorienverbrauch und ein **Schrittzähler** über den Bewegungssensor des Handys.

## Schnellstart

```bash
cd diet-app
npm install
npm run dev          # http://localhost:5173
```

Für die installierbare PWA inkl. Service Worker:

```bash
npm run build
npm run preview      # Service Worker / „Zum Startbildschirm hinzufügen"
```

Tests & Linting:

```bash
npm test             # Vitest (Formeln: BMI/BMR/TDEE, Nährwert-Berechnung)
npm run lint
```

## Technik

Vite 6 · React 19 · TypeScript · Tailwind CSS · React Router 7 · Zustand ·
Dexie (IndexedDB) · @zxing/browser (Scanner) · vite-plugin-pwa · date-fns.

## Bekannte Einschränkungen

- **Kamera/Scanner**: benötigt HTTPS oder `localhost`. Am besten auf dem
  Smartphone (Rückkamera). Auf dem Desktop wird die Standard-Webcam genutzt.
- **Schrittzähler**: nur auf echten Smartphones sinnvoll (Bewegungssensor). iOS
  verlangt eine ausdrückliche Sensor-Berechtigung. Auf dem Desktop gibt es einen
  Hinweis und die Möglichkeit zur manuellen Schritteingabe. Die Zählung ist
  approximativ und läuft nur, solange die App im Vordergrund ist.
- **Open Food Facts**: die Datenbankabdeckung variiert; unbekannte Produkte führen
  zur manuellen Eingabe. Reine kJ-Angaben werden in kcal umgerechnet.
- Die Nährwertangaben dienen der Orientierung und ersetzen keine medizinische
  oder ernährungswissenschaftliche Beratung.
