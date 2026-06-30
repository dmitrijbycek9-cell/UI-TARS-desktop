# TikTok Auto Producer 🎬
## Vollautomatisches, kostenloses Video-Produktions-System

**Status**: In Development 🔨

Verwandelt dein Szenenplan-Skript automatisch in fertige TikTok-Videos (9:16, 61-75 Sek).

### Features
- ✅ **100% Kostenlos** (Open Source + kostenlose APIs)
- ✅ **Voll Automatisiert** (1 Command = Fertige Video)
- ✅ **Multi-KI** (Pika AI, Leonardo.ai, Pollinations.ai, Edge TTS)
- ✅ **Professionell** (FFmpeg-Schnitt, Text-Overlays, Sound-Design)
- ✅ **Batch-Ready** (mehrere Videos hintereinander)

### Workflow
```
Input: Szenenplan (JSON/YAML)
  ↓
Bild-Generierung (Pollinations.ai)
  ↓
Video-Generierung (Pika AI / Leonardo.ai)
  ↓
Voiceover (Edge TTS)
  ↓
Musik + Sound-Design
  ↓
FFmpeg Schnitt
  ↓
Output: Fertige MP4 (9:16, TikTok-ready)
```

### Quick Start
```bash
# 1. Setup
python setup.py install-deps

# 2. Config (API Keys)
cp config.example.yaml config.yaml
# Edit config.yaml mit deinen Keys

# 3. Run
python auto_producer.py --scene-plan gaming-fail.json

# 4. Output
# → output/gaming-fail-final.mp4 (fertig zum Posten!)
```

### Komponenten
- `config.yaml` - API Keys & Settings
- `auto_producer.py` - Haupt-Automation Script
- `generators/` - KI-Generierungs-Module
- `editor/` - FFmpeg Video-Schnitt
- `scenes/` - Beispiel-Szenenplanungen
- `output/` - Fertige Videos

### Dependencies
- Python 3.9+
- FFmpeg
- requests (API calls)
- pyyaml (config)
- pydub (audio)

### Kostenlose APIs
1. **Pollinations.ai** - Unbegrenzte Bilder (kostenlos, keine Auth)
2. **Pika AI** - 250 Credits/Monat kostenlos (Video)
3. **Leonardo.ai** - 150 Credits/Monat kostenlos (Video + Bilder)
4. **Edge TTS** - Unbegrenzte deutsche Voiceovers (kostenlos, lokal)
5. **FFmpeg** - Open Source (kostenlos)

Mehr Details: siehe `SETUP.md`
