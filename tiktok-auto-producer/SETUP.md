# Setup Guide - TikTok Auto Producer

## Schritt 1: Kostenlose API-Keys registrieren

### 1.1 Pika AI (Video-Generierung)
1. Gehe zu https://pika.art
2. Registriere mit Google/Email
3. Kostenlos: 250 Credits/Monat
4. Gehe zu Settings → API Keys
5. Kopiere deinen API-Key

### 1.2 Leonardo.ai (Backup Video + Bilder)
1. Gehe zu https://leonardo.ai
2. Registriere mit Google/Email
3. Kostenlos: 150 Credits/Monat
4. Gehe zu Account → API Keys
5. Kopiere deinen API-Key

### 1.3 Pollinations.ai (Bilder - KOSTENLOS!)
**KEINE REGISTRIERUNG NÖTIG!** ✨
- Unbegrenzte Bilder
- Kostenlos forever
- API ist offen (keine Auth)

---

## Schritt 2: Python Setup

```bash
# 1. Ins Projekt-Verzeichnis gehen
cd tiktok-auto-producer

# 2. Python 3.9+ checken
python --version

# 3. Virtual Environment erstellen (optional aber empfohlen)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# oder
venv\Scripts\activate  # Windows

# 4. Dependencies installieren
pip install -r requirements.txt

# 5. FFmpeg installieren (if not already installed)
# Linux: sudo apt-get install ffmpeg
# Mac: brew install ffmpeg
# Windows: choco install ffmpeg (oder manuell von ffmpeg.org)

# Verifizieren:
ffmpeg -version
```

---

## Schritt 3: Config vorbereiten

```bash
# Kopiere das Example-Config
cp config.example.yaml config.yaml

# Öffne config.yaml
nano config.yaml
# oder dein Lieblingseditor
```

Fülle die API-Keys ein:
```yaml
apis:
  pika:
    api_key: "dein_pika_key_hier"
  leonardo:
    api_key: "dein_leonardo_key_hier"
```

---

## Schritt 4: Test-Run

```bash
# Teste mit dem Gaming-Fail Beispiel
python auto_producer.py --scene-plan scenes/gaming-fail.json

# Output sollte sein:
# ✓ Bilder generiert
# ✓ Videos generiert
# ✓ Voiceover erstellt
# ✓ Video geschnitten
# → output/gaming-fail-final.mp4
```

---

## Schritt 5: Dein erstes Video

### Option A: Mit dem vorgefertigten Szenenplan
```bash
python auto_producer.py --scene-plan scenes/gaming-fail.json
```

### Option B: Mit deinem eigenen Szenenplan
Erstelle eine JSON-Datei (z.B. `my-video.json`):

```json
{
  "title": "My Awesome Video",
  "duration_target": 62,
  "hook": "Der Hook in 0-2 Sekunden",
  "voiceover": {
    "text": "Komplettes Voiceover-Skript hier...",
    "language": "de"
  },
  "scenes": [
    {
      "id": 1,
      "duration": 5,
      "image_prompt": "Gaming-Zimmer, Monitor, LED-Lichter...",
      "video_prompt": "Kamera-Bewegung: langsamer Zoom-In...",
      "text_overlay": "HOOK TEXT",
      "timing": "0:00-0:05"
    },
    ...
  ],
  "music": {
    "genre": "electronic-dramatic",
    "mood": "tense"
  },
  "captions": [
    {
      "text": "KAPTION 1",
      "timing": "0:00-0:02",
      "size": "80px"
    },
    ...
  ]
}
```

Dann:
```bash
python auto_producer.py --scene-plan my-video.json
```

---

## Troubleshooting

### Problem: "API Key nicht gültig"
**Lösung:**
1. Checke deine API-Keys in config.yaml
2. Stelle sicher, dass du sie richtig kopiert hast (keine Spaces!)
3. Regeneriere API-Key auf der Website

### Problem: "FFmpeg nicht gefunden"
**Lösung:**
1. Installiere FFmpeg (siehe Schritt 2)
2. Oder gib den Path an: `ffmpeg_path: "/usr/bin/ffmpeg"` in config.yaml

### Problem: "Credits aufgebraucht"
**Lösung:**
1. Verwende Pollinations für Bilder (unbegrenzt kostenlos!)
2. Warte bis zum nächsten Monat für Pika/Leonardo
3. Oder: Generiere nur Videos (weniger Credits)

### Problem: "Generierung dauert zu lange"
**Lösung:**
1. Setze `quality: "medium"` in config.yaml
2. Oder aktiviere `mock_generation: true` zum Testen

---

## Befehle

```bash
# Normaler Run
python auto_producer.py --scene-plan my-video.json

# Mit Debug-Output
python auto_producer.py --scene-plan my-video.json --debug

# Batch: mehrere Videos
python auto_producer.py --batch scenes/

# Nur Bilder generieren
python auto_producer.py --scene-plan my-video.json --images-only

# Nur Videos generieren
python auto_producer.py --scene-plan my-video.json --videos-only

# Nur Schnitt (wenn Bilder/Videos schon da sind)
python auto_producer.py --scene-plan my-video.json --edit-only
```

---

## Tipps & Tricks

**Tipp 1: Schnellerer Test**
```bash
# Generiere nur 2 Szenen zum Testen
python auto_producer.py --scene-plan my-video.json --max-scenes 2
```

**Tipp 2: Lokal testen (keine API-Calls)**
```yaml
debug:
  mock_generation: true  # Testet Workflow ohne echte Generierung
```

**Tipp 3: Credits sparen**
```yaml
generation:
  image_generator: "pollinations"  # Kostenlos unbegrenzt!
  quality: "medium"  # Statt "high"
```

**Tipp 4: Schnellere Voiceovers**
```yaml
voiceover:
  rate: 1.2  # 20% schneller
```

---

## Nächste Schritte

1. ✅ APIs registrieren
2. ✅ Python + FFmpeg installieren
3. ✅ Config ausfüllen
4. ✅ Test-Run
5. → Dein erstes Video generieren!

**Ready?** 🚀

```bash
python auto_producer.py --scene-plan scenes/gaming-fail.json
```
