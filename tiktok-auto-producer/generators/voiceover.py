"""
Voiceover Generation Module
Uses Edge TTS (kostenlos, lokal, unbegrenzt)
"""

import logging
from pathlib import Path
import asyncio

try:
    import edge_tts
except ImportError:
    edge_tts = None

logger = logging.getLogger(__name__)

class VoiceoverGenerator:
    def __init__(self, config):
        self.config = config
        self.output_dir = Path(config["output"]["directory"]) / "voiceover"
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.voice = config.get("voiceover", {}).get("voice", "de-DE-KatrineNeural")
        self.rate = config.get("voiceover", {}).get("rate", 1.0)
        self.pitch = config.get("voiceover", {}).get("pitch", 1.0)

        if not edge_tts:
            logger.warning("edge-tts not installed. Install with: pip install edge-tts")

    def generate(self, text, language="de"):
        """
        Generate voiceover using Edge TTS (kostenlos!)
        Completely free, no API key needed, local processing
        """

        logger.info(f"Generating voiceover ({language}, {len(text)} chars)...")

        if not edge_tts:
            raise RuntimeError("edge-tts not installed. Run: pip install edge-tts")

        try:
            # Run async function
            audio_path = asyncio.run(self._generate_async(text))
            logger.info(f"✓ Voiceover saved: {audio_path}")
            return audio_path

        except Exception as e:
            logger.error(f"✗ Voiceover generation failed: {e}")
            raise

    async def _generate_async(self, text):
        """Async voiceover generation"""

        # German voices available in Edge TTS
        voice_options = {
            "de-DE": "de-DE-KatrineNeural",  # Female
            "de-DE-male": "de-DE-Hans",       # Male
        }

        voice = voice_options.get("de-DE", self.voice)

        # Generate audio
        communicate = edge_tts.Communicate(
            text=text,
            voice=voice,
            rate=f"+{int(self.rate * 100)}%" if self.rate > 1.0 else f"{int(self.rate * 100)}%"
        )

        # Save to file
        audio_path = self.output_dir / "voiceover.mp3"

        await communicate.save(str(audio_path))

        return str(audio_path)
