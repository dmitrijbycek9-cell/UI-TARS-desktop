# Companion AI MVP — gebaut aus deinem Entwurf + Candy-ZIP-Ideen

## Start

```bash
cd companion-ai-fixed
chmod +x start.sh
./start.sh docker
```

Öffnen: http://localhost:8000

Demo-Login:

```txt
Username: demo
Password: demo123
```

## Echte lokale KI aktivieren

Ohne Ollama läuft die App trotzdem, aber die Antwort ist ein klar markierter Fallback. Für echte lokale Antworten:

```bash
./start.sh llm
./start.sh pull mistral
```

Dann neu chatten.

## Was drin ist

- FastAPI Backend
- integriertes Web-Frontend ohne Build-Schritt
- Login/Register mit JWT
- SQLite-Persistenz
- Character Creator
- WebSocket Chat
- Gespräche + Nachrichten werden gespeichert
- einfaches Memory pro Character/User
- optionaler Ollama-Call
- Docker-Start

## Was ich aus deiner Candy-ZIP entnommen habe

Brauchbar:

- dunkle Chat-UI
- Sidebar + Character-Auswahl
- Mood/Character-Grundidee
- WebSocket-Chat-Idee
- Memory-Konzept
- Startskript-Idee

Nicht direkt übernommen:

- Der Candy-Code startet nicht sauber: `backend/app/character_engine.py` hat kaputte mehrzeilige Strings und wirft sofort `SyntaxError`.
- Auth war dort In-Memory und damit nach Neustart weg.
- Viele README-Features waren eher Behauptung als sauber integrierter Code.
- `dangerouslySetInnerHTML` im Frontend ist unnötig riskant.

## Harte Wahrheit

Das hier ist ein MVP, kein produktionsreifer Candy.ai-Klon. Für öffentliches Deployment fehlen noch:

- PostgreSQL statt SQLite
- Rate Limits
- E-Mail-Verifikation
- Zahlungslogik
- Admin-Panel
- echtes Vektor-Memory mit ChromaDB
- Bildgenerierung mit Stable Diffusion
- TTS/STT
- HTTPS/Reverse Proxy
- Tests/CI

Aber: Dieses MVP ist absichtlich kleiner, weil kleiner + startfähig besser ist als groß + kaputt.
