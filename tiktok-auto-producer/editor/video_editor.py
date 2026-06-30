"""
Video Editor Module
Uses FFmpeg for professional video editing
"""

import logging
import subprocess
from pathlib import Path
import json

logger = logging.getLogger(__name__)

class VideoEditor:
    def __init__(self, config):
        self.config = config
        self.output_dir = Path(config["output"]["directory"])
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Check FFmpeg availability
        self._check_ffmpeg()

    def _check_ffmpeg(self):
        """Verify FFmpeg is installed"""
        try:
            subprocess.run(
                ["ffmpeg", "-version"],
                capture_output=True,
                timeout=5
            )
            logger.info("✓ FFmpeg found and ready")
        except (FileNotFoundError, subprocess.TimeoutExpired):
            logger.error("✗ FFmpeg not found. Install: apt-get install ffmpeg")
            raise

    def create_video(self, title, scenes, video_paths, voiceover_path):
        """
        Create final TikTok video from components

        Args:
            title: Video title
            scenes: Scene plan dict
            video_paths: Dict of scene_id -> video_path
            voiceover_path: Path to voiceover MP3

        Returns:
            Path to final MP4 video
        """

        logger.info("=" * 50)
        logger.info("🎬 Creating final video...")
        logger.info("=" * 50)

        try:
            # 1. Create concat file
            concat_file = self._create_concat_file(scenes, video_paths)
            logger.debug(f"Concat file: {concat_file}")

            # 2. Concatenate videos
            concatenated = self._concatenate_videos(concat_file)
            logger.debug(f"Concatenated: {concatenated}")

            # 3. Add voiceover if available
            if voiceover_path:
                with_voiceover = self._add_voiceover(concatenated, voiceover_path)
                logger.debug(f"With voiceover: {with_voiceover}")
            else:
                with_voiceover = concatenated
                logger.warning("No voiceover provided")

            # 4. Add captions
            with_captions = self._add_captions(with_voiceover, scenes)
            logger.debug(f"With captions: {with_captions}")

            # 5. Optimize for TikTok
            final_video = self._optimize_for_tiktok(with_captions, title)
            logger.info(f"✓ Final video: {final_video}")

            return final_video

        except Exception as e:
            logger.error(f"✗ Video creation failed: {e}")
            raise

    def _create_concat_file(self, scenes, video_paths):
        """Create FFmpeg concat demuxer file"""

        concat_file = self.output_dir / "concat.txt"

        with open(concat_file, "w") as f:
            for scene in scenes["scenes"]:
                scene_id = scene["id"]

                if scene_id in video_paths:
                    video_path = video_paths[scene_id]
                    f.write(f"file '{video_path}'\n")
                    f.write(f"duration {scene.get('duration', 5)}\n")

        logger.debug(f"Created concat file: {concat_file}")
        return str(concat_file)

    def _concatenate_videos(self, concat_file):
        """Concatenate videos using FFmpeg"""

        output = self.output_dir / "concatenated.mp4"

        cmd = [
            "ffmpeg",
            "-f", "concat",
            "-safe", "0",
            "-i", concat_file,
            "-c", "copy",
            "-y",
            str(output)
        ]

        logger.info("Concatenating videos...")
        self._run_ffmpeg(cmd)

        return str(output)

    def _add_voiceover(self, video_path, voiceover_path):
        """Add voiceover and mix with background music"""

        output = self.output_dir / "with_voiceover.mp4"

        # Simple audio mixing
        cmd = [
            "ffmpeg",
            "-i", video_path,
            "-i", voiceover_path,
            "-filter_complex",
            "[1:a]volume=1.0[voiceover];[voiceover][0:a]amerge=inputs=2[a]",
            "-map", "0:v",
            "-map", "[a]",
            "-ac", "2",
            "-y",
            str(output)
        ]

        logger.info("Adding voiceover...")
        self._run_ffmpeg(cmd)

        return str(output)

    def _add_captions(self, video_path, scenes):
        """Add text captions to video"""

        output = self.output_dir / "with_captions.mp4"

        # For now, simple implementation
        # In full version: use drawtext filter with precise timing

        cmd = [
            "ffmpeg",
            "-i", video_path,
            "-c:v", "copy",
            "-c:a", "copy",
            "-y",
            str(output)
        ]

        logger.info("Adding captions (placeholder)...")
        # Note: Full caption implementation would use drawtext filter
        # For now, captions would be added in post-production in CapCut

        return str(output)

    def _optimize_for_tiktok(self, video_path, title):
        """Optimize video for TikTok (9:16, high quality)"""

        output = self.output_dir / f"{title}-final.mp4"

        # TikTok specs:
        # - 1080x1920 (9:16)
        # - H.264 codec
        # - AAC audio
        # - 5000-8000 kbps bitrate

        cmd = [
            "ffmpeg",
            "-i", video_path,
            "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
            "-c:v", "libx264",
            "-preset", "medium",
            "-b:v", "6000k",
            "-c:a", "aac",
            "-b:a", "128k",
            "-y",
            str(output)
        ]

        logger.info("Optimizing for TikTok...")
        self._run_ffmpeg(cmd)

        logger.info(f"✓ Final TikTok video: {output}")
        return str(output)

    def _run_ffmpeg(self, cmd):
        """Run FFmpeg command"""

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=600
            )

            if result.returncode != 0:
                logger.error(f"FFmpeg error: {result.stderr}")
                raise RuntimeError(f"FFmpeg failed: {result.stderr}")

            logger.debug("FFmpeg command completed successfully")

        except subprocess.TimeoutExpired:
            logger.error("FFmpeg timeout (10 minutes)")
            raise
        except Exception as e:
            logger.error(f"FFmpeg execution failed: {e}")
            raise
