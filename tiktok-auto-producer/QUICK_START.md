# Quick Start Guide 🚀

## 5 Minuten bis zum ersten Video!

### Step 1: Setup (2 Min)

```bash
cd tiktok-auto-producer

# Python dependencies
pip install -r requirements.txt

# FFmpeg (if not installed)
# Linux: sudo apt-get install ffmpeg
# Mac: brew install ffmpeg
# Windows: choco install ffmpeg
```

### Step 2: Config (1 Min)

```bash
# Copy example config
cp config.example.yaml config.yaml

# Open config.yaml and add your API keys
nano config.yaml
```

**Needed API Keys (alle kostenlos):**
- Pika AI: https://pika.art (250 Credits/Monat kostenlos)
- Leonardo.ai: https://leonardo.ai (150 Credits/Monat kostenlos)
- Pollinations: KOSTENLOS, keine Registrierung! 🎉

### Step 3: Test (2 Min)

```bash
# Run with example scene plan
python auto_producer.py --scene-plan scenes/gaming-fail.json --debug

# Output: output/gaming-fail-final.mp4
```

**That's it!** 🎉

---

## What Just Happened?

1. ✅ Bilder generiert (Pollinations.ai - KOSTENLOS!)
2. ✅ Videos generiert (Pika AI oder Leonardo)
3. ✅ Voiceover erstellt (Edge TTS - kostenlos!)
4. ✅ Videos geschnitten (FFmpeg)
5. ✅ Finale MP4 erzeugt (TikTok-ready!)

---

## Nächste Schritte

### Dein eigenes Video erstellen

1. **Erstelle Szenenplan** (JSON oder YAML):
   ```json
   {
     "title": "my-video",
     "voiceover": {
       "text": "Dein Voiceover-Text hier..."
     },
     "scenes": [
       {
         "id": 1,
         "duration": 5,
         "video_prompt": "Dein KI-Prompt hier..."
       }
     ]
   }
   ```

2. **Speichern** als `scenes/my-video.json`

3. **Generieren**:
   ```bash
   python auto_producer.py --scene-plan scenes/my-video.json
   ```

---

## Troubleshooting

**Q: "FFmpeg not found"**
A: `sudo apt-get install ffmpeg` (Linux) oder `brew install ffmpeg` (Mac)

**Q: "API Key not valid"**
A: Checke config.yaml - keine Extra-Spaces!

**Q: "Insufficient credits"**
A: Nutze Pollinations für Bilder (unbegrenzt!) oder warte auf neuen Monat.

**Q: "Timeout"**
A: Generierung dauert - normal! Bis 10 Min für 1 Video.

---

## Tipps für schnellere Tests

```bash
# Nur 2 Szenen generieren (für Testing)
python auto_producer.py --scene-plan scenes/gaming-fail.json --max-scenes 2

# Mit Mock (keine echte Generierung, nur Test-Workflow)
# Edit config.yaml: debug.mock_generation = true

# Nur Bilder
python auto_producer.py --scene-plan scenes/gaming-fail.json --images-only

# Nur Videos
python auto_producer.py --scene-plan scenes/gaming-fail.json --videos-only
```

---

## Nächste Level 🎬

- Batch-Verarbeitung (mehrere Videos gleichzeitig)
- Caption-Automation (CapCut-Integration)
- Music-Library (Auto-Download)
- Thumbnail-Generator

**Mehr Details:** siehe `SETUP.md` und `README.md`

---

## Need Help?

```bash
# Debug mode
python auto_producer.py --scene-plan scenes/gaming-fail.json --debug

# Check logs
tail -f logs/producer.log
```

**Discord/Community:** [Your Community Link Here]

---

**Ready?** 🚀

```bash
python auto_producer.py --scene-plan scenes/gaming-fail.json
```
