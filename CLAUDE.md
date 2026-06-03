# Projektnotizen für Claude

## Arbeitsweise: Web-Apps schnell lauffähig & teilbar machen (Nutzervorgabe)

Wenn eine Web-App gebaut wird, **immer sofort einen funktionierenden Link liefern** –
keine Zeit mit reinen „du musst noch X einstellen"-Schritten verlieren. Bevorzugter Ablauf:

1. **Eigenständige, statisch baubare PWA** erstellen (Vite + React + TS + Tailwind),
   relativer `base`-Pfad (`base: './'`) und **HashRouter**, damit sie unter jeder
   Unteradresse ohne Server-Konfiguration läuft.
2. **Build committen:** `npm run build`, dann `git add -f <app>/dist` mit committen.
3. **Sofort-Link** über CDN aus dem Repo (kein Hosting-Account nötig):
   `https://raw.githack.com/<owner>/<repo>/<COMMIT-SHA>/<app>/dist/index.html`
   (Commit-SHA statt Branch verwenden – Branch-Namen mit `/` brechen den CDN-Link.)
4. Zusätzlich für die **saubere, installierbare Version** einen GitHub-Pages-Workflow
   vorbereiten (`actions/configure-pages@v5` mit `enablement: true`). Hinweis: Bei
   **Forks ist GitHub Actions standardmäßig deaktiviert** und kann von Claude **nicht**
   selbst aktiviert werden → das ist der einzige Schritt, den der Nutzer per Klick im
   „Actions"-Tab macht.

### Rahmenbedingungen
- Keine externen Hosting-Zugänge (Netlify/Vercel/Cloudflare) verfügbar.
- Sandbox-Netzwerk hat eine Host-Allowlist → Links lassen sich von hier oft nicht
  selbst laden; stattdessen Datei-Existenz über die GitHub-API verifizieren.
- Bevorzugte Sprache der Apps/Oberfläche: **Deutsch**.
- Daten möglichst **lokal** (IndexedDB), offline-fähig, ohne Login.

### Referenz
Erste so umgesetzte App: `diet-app/` (Diät- & Gesundheits-Tracker).
