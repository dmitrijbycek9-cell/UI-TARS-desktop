# 🚀 App veröffentlichen & an Bekannte weitergeben

Die App ist eine **PWA**: deine Bekannte braucht **keinen App Store**. Sie öffnet
einen Link im Handy-Browser und fügt die App zum Startbildschirm hinzu – fertig.

Voraussetzung: Die App muss einmal online über **HTTPS** erreichbar sein. Das ist
kostenlos möglich. Wähle eine der drei Varianten.

---

## Variante A – Netlify Drop (am schnellsten, ohne Konto-Stress)

Ideal, wenn du es einfach nur schnell teilen willst.

1. App bauen:
   ```bash
   cd diet-app
   npm install
   npm run build
   ```
   Dadurch entsteht der Ordner `diet-app/dist`.
2. Gehe auf **https://app.netlify.com/drop**
3. Ziehe den **`dist`-Ordner** per Drag & Drop auf die Seite.
4. Du bekommst sofort eine HTTPS-Adresse wie
   `https://zufallsname.netlify.app` – **diesen Link** schickst du deiner Bekannten.

> Tipp: Mit kostenlosem Login bleibt der Link dauerhaft bestehen und du kannst
> ihn umbenennen.

---

## Variante B – Vercel oder Cloudflare Pages (dauerhaft, aktualisiert sich automatisch)

Ideal, wenn die App online bleiben und sich bei jeder Code-Änderung selbst neu
veröffentlichen soll. Beide sind kostenlos.

1. Konto erstellen bei **vercel.com** oder **pages.cloudflare.com** und mit GitHub verbinden.
2. Das Repository auswählen und folgende Einstellungen setzen:
   - **Root-/Projektverzeichnis:** `diet-app`
   - **Build-Befehl:** `npm run build`
   - **Ausgabeverzeichnis (Output):** `dist`
3. „Deploy" klicken → du erhältst eine feste HTTPS-Adresse, die du teilen kannst.

Die Dateien `vercel.json` bzw. `public/_redirects` sind bereits enthalten, damit
die Navigation (Unterseiten) korrekt funktioniert.

---

## So installiert deine Bekannte die App (Link genügt!)

**Android (Chrome):**
1. Link öffnen.
2. Es erscheint meist automatisch „App installieren". Sonst: Menü (⋮) →
   **„App installieren"** bzw. **„Zum Startbildschirm hinzufügen"**.

**iPhone (Safari):**
1. Link in **Safari** öffnen (wichtig: nicht in Chrome).
2. Auf das **Teilen-Symbol** (Quadrat mit Pfeil) tippen.
3. **„Zum Home-Bildschirm"** wählen → „Hinzufügen".

Danach liegt das App-Icon auf dem Startbildschirm und startet im Vollbild –
wie eine echte App. Daten bleiben lokal auf ihrem Gerät, vieles funktioniert
auch offline.

> **Kamera/Scanner & Schrittzähler:** funktionieren nur über HTTPS (also über die
> veröffentlichte Adresse, nicht beim Öffnen einer lokalen Datei) und am besten
> auf dem Smartphone. Beim ersten Scannen muss sie den **Kamerazugriff erlauben**.
