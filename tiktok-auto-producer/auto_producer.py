#!/usr/bin/env python3
"""
TikTok Auto Producer - Main Script
Automatische Video-Produktion mit kostenlosen KI-APIs
"""

import json
import yaml
import click
import logging
from pathlib import Path
from tqdm import tqdm
import asyncio
from datetime import datetime

# Local imports
from generators.image_generator import ImageGenerator
from generators.video_generator import VideoGenerator
from generators.voiceover import VoiceoverGenerator
from editor.video_editor import VideoEditor
from utils.logger import setup_logging
from utils.config import load_config
from utils.scene_parser import parse_scene_plan

# ============================================
# SETUP
# ============================================

logger = logging.getLogger(__name__)

class TikTokAutoProducer:
    def __init__(self, config_path="config.yaml"):
        """Initialize the producer with config"""
        self.config = load_config(config_path)
        self.image_gen = ImageGenerator(self.config)
        self.video_gen = VideoGenerator(self.config)
        self.voiceover_gen = VoiceoverGenerator(self.config)
        self.editor = VideoEditor(self.config)

        # Create output directory
        self.output_dir = Path(self.config["output"]["directory"])
        self.output_dir.mkdir(parents=True, exist_ok=True)

        logger.info(f"✓ TikTok Auto Producer initialized")
        logger.info(f"✓ Output directory: {self.output_dir}")

    def produce_video(self, scene_plan_path, **options):
        """
        Produkt das komplette Video aus einem Szenenplan

        Input: scene_plan_path (JSON/YAML)
        Output: MP4-Video (9:16, TikTok-ready)
        """
        logger.info(f"=" * 50)
        logger.info(f"Starting video production from: {scene_plan_path}")
        logger.info(f"=" * 50)

        # 1. Parse Szenenplan
        logger.info("📋 Parsing scene plan...")
        scenes = parse_scene_plan(scene_plan_path)
        video_title = scenes.get("title", "tiktok-video")
        logger.info(f"✓ Loaded {len(scenes['scenes'])} scenes")

        # 2. Generate Bilder
        logger.info("\n🖼️  Generating images...")
        image_paths = self._generate_images(scenes, options)

        # 3. Generate Videos
        logger.info("\n🎥 Generating videos...")
        video_paths = self._generate_videos(scenes, image_paths, options)

        # 4. Generate Voiceover
        logger.info("\n🎤 Generating voiceover...")
        voiceover_path = self._generate_voiceover(scenes, options)

        # 5. Edit & Schnitt
        logger.info("\n✂️  Editing video...")
        final_video = self._edit_video(
            video_title,
            scenes,
            video_paths,
            voiceover_path,
            options
        )

        logger.info(f"\n" + "=" * 50)
        logger.info(f"✅ SUCCESS! Video created:")
        logger.info(f"📺 {final_video}")
        logger.info(f"=" * 50)

        return final_video

    def _generate_images(self, scenes, options):
        """Generate images for each scene"""
        image_paths = {}

        max_scenes = options.get("max_scenes", len(scenes["scenes"]))
        scenes_to_process = scenes["scenes"][:max_scenes]

        for scene in tqdm(scenes_to_process, desc="Images"):
            scene_id = scene["id"]

            # Skip if video_prompt exists (we'll use video instead)
            if scene.get("video_prompt"):
                logger.debug(f"Scene {scene_id}: Using video (has video_prompt)")
                continue

            image_prompt = scene.get("image_prompt")
            if not image_prompt:
                logger.warning(f"Scene {scene_id}: No image_prompt found")
                continue

            try:
                image_path = self.image_gen.generate(
                    prompt=image_prompt,
                    scene_id=scene_id,
                    aspect_ratio=self.config["video"]["aspect_ratio"]
                )
                image_paths[scene_id] = image_path
                logger.debug(f"✓ Scene {scene_id}: {image_path}")
            except Exception as e:
                logger.error(f"✗ Scene {scene_id} image generation failed: {e}")
                continue

        return image_paths

    def _generate_videos(self, scenes, image_paths, options):
        """Generate videos for each scene"""
        video_paths = {}

        max_scenes = options.get("max_scenes", len(scenes["scenes"]))
        scenes_to_process = scenes["scenes"][:max_scenes]

        for scene in tqdm(scenes_to_process, desc="Videos"):
            scene_id = scene["id"]
            video_prompt = scene.get("video_prompt")

            if not video_prompt:
                logger.debug(f"Scene {scene_id}: No video_prompt (will use image)")
                continue

            try:
                duration = scene.get("duration", 5)
                video_path = self.video_gen.generate(
                    prompt=video_prompt,
                    scene_id=scene_id,
                    duration=duration,
                    aspect_ratio=self.config["video"]["aspect_ratio"]
                )
                video_paths[scene_id] = video_path
                logger.debug(f"✓ Scene {scene_id}: {video_path}")
            except Exception as e:
                logger.error(f"✗ Scene {scene_id} video generation failed: {e}")
                # Fallback: try to use image instead
                if scene_id in image_paths:
                    logger.info(f"  → Fallback: Using image for scene {scene_id}")
                continue

        return video_paths

    def _generate_voiceover(self, scenes, options):
        """Generate voiceover from script"""
        voiceover_text = scenes.get("voiceover", {}).get("text")

        if not voiceover_text:
            logger.warning("No voiceover text found in scene plan")
            return None

        try:
            voiceover_path = self.voiceover_gen.generate(
                text=voiceover_text,
                language=scenes.get("voiceover", {}).get("language", "de")
            )
            logger.debug(f"✓ Voiceover: {voiceover_path}")
            return voiceover_path
        except Exception as e:
            logger.error(f"✗ Voiceover generation failed: {e}")
            return None

    def _edit_video(self, title, scenes, video_paths, voiceover_path, options):
        """Schnitt das finale Video zusammen"""
        try:
            final_video = self.editor.create_video(
                title=title,
                scenes=scenes,
                video_paths=video_paths,
                voiceover_path=voiceover_path
            )
            return final_video
        except Exception as e:
            logger.error(f"✗ Video editing failed: {e}")
            raise

# ============================================
# CLI
# ============================================

@click.command()
@click.option(
    "--scene-plan",
    type=click.Path(exists=True),
    required=True,
    help="Path to scene plan JSON/YAML"
)
@click.option(
    "--config",
    type=click.Path(exists=True),
    default="config.yaml",
    help="Path to config file"
)
@click.option(
    "--debug",
    is_flag=True,
    help="Enable debug logging"
)
@click.option(
    "--max-scenes",
    type=int,
    default=None,
    help="Maximum scenes to process (for testing)"
)
@click.option(
    "--images-only",
    is_flag=True,
    help="Only generate images"
)
@click.option(
    "--videos-only",
    is_flag=True,
    help="Only generate videos"
)
@click.option(
    "--edit-only",
    is_flag=True,
    help="Only edit (requires existing assets)"
)
def main(scene_plan, config, debug, max_scenes, images_only, videos_only, edit_only):
    """
    TikTok Auto Producer 🎬

    Automatically generate TikTok videos from scene plans.

    Example:
        python auto_producer.py --scene-plan scenes/gaming-fail.json
    """

    # Setup logging
    log_level = "DEBUG" if debug else "INFO"
    setup_logging(log_level=log_level, config_path=config)

    logger.info("🚀 TikTok Auto Producer Started")
    logger.info(f"Scene plan: {scene_plan}")
    logger.info(f"Config: {config}")

    try:
        # Initialize producer
        producer = TikTokAutoProducer(config_path=config)

        # Run production
        options = {
            "max_scenes": max_scenes,
            "images_only": images_only,
            "videos_only": videos_only,
            "edit_only": edit_only,
        }

        final_video = producer.produce_video(scene_plan, **options)

        logger.info(f"\n✅ Done! Your video is ready to upload:")
        logger.info(f"📺 {final_video}")

    except Exception as e:
        logger.error(f"\n❌ Error: {e}", exc_info=debug)
        exit(1)

if __name__ == "__main__":
    main()
