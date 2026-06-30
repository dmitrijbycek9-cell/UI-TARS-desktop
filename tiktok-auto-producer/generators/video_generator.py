"""
Video Generation Module
Supports: Pika AI (kostenlos: 250/Monat), Leonardo.ai (kostenlos: 150/Monat)
"""

import requests
import logging
from pathlib import Path
import time
import os

logger = logging.getLogger(__name__)

class VideoGenerator:
    def __init__(self, config):
        self.config = config
        self.output_dir = Path(config["output"]["directory"]) / "videos"
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.pika_key = config.get("apis", {}).get("pika", {}).get("api_key")
        self.leonardo_key = config.get("apis", {}).get("leonardo", {}).get("api_key")

    def generate(self, prompt, scene_id, duration=5, aspect_ratio="9:16"):
        """
        Generate video from prompt
        Uses Pika AI (kostenlos) by default
        """

        logger.info(f"Generating video with Pika (Scene {scene_id}, {duration}s)...")

        # Validate duration
        duration = max(3, min(duration, 15))  # Pika: 3-15 Sekunden

        try:
            return self._generate_pika(prompt, scene_id, duration, aspect_ratio)
        except Exception as e:
            logger.warning(f"Pika failed: {e}, trying Leonardo...")
            if self.leonardo_key:
                return self._generate_leonardo(prompt, scene_id, duration, aspect_ratio)
            raise

    def _generate_pika(self, prompt, scene_id, duration, aspect_ratio):
        """
        Generate video using Pika AI
        Kostenlos: 250 Credits/Monat
        """

        if not self.pika_key:
            raise ValueError("Pika API key not configured")

        logger.info(f"Pika: Generating {duration}s video for scene {scene_id}...")

        try:
            # Pika API v1
            url = "https://api.pika.art/v1/videos/generations"

            headers = {
                "Authorization": f"Bearer {self.pika_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "prompt": prompt,
                "duration": duration,
                "aspect_ratio": aspect_ratio,
                "negative_prompt": "no logos, no brands, no real people, no watermarks"
            }

            response = requests.post(url, json=payload, headers=headers, timeout=30)

            if response.status_code == 401:
                raise ValueError("Invalid Pika API key")
            elif response.status_code == 402:
                raise ValueError("Insufficient Pika credits")

            response.raise_for_status()
            data = response.json()

            generation_id = data["id"]
            logger.debug(f"Pika generation started, ID: {generation_id}")

            # Poll für Completion
            video_url = self._wait_for_pika_completion(generation_id, headers)

            # Download video
            logger.info(f"Downloading video from Pika...")
            video_response = requests.get(video_url, timeout=60)
            video_response.raise_for_status()

            # Save video
            video_path = self.output_dir / f"scene_{scene_id}.mp4"
            with open(video_path, "wb") as f:
                f.write(video_response.content)

            logger.info(f"✓ Video saved: {video_path}")
            return str(video_path)

        except Exception as e:
            logger.error(f"✗ Pika generation failed: {e}")
            raise

    def _wait_for_pika_completion(self, generation_id, headers, timeout=300):
        """Wait for Pika video to be ready"""
        start_time = time.time()

        while time.time() - start_time < timeout:
            url = f"https://api.pika.art/v1/videos/generations/{generation_id}"
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()

            data = response.json()
            status = data.get("status")

            if status == "COMPLETED":
                video_url = data["videos"][0]["url"]
                return video_url
            elif status == "FAILED":
                error = data.get("error", "Unknown error")
                raise Exception(f"Pika generation failed: {error}")

            logger.debug(f"Pika status: {status}, waiting...")
            time.sleep(5)

        raise TimeoutError("Pika generation timeout")

    def _generate_leonardo(self, prompt, scene_id, duration, aspect_ratio):
        """
        Fallback: Generate video using Leonardo.ai
        Kostenlos: 150 Credits/Monat
        """

        if not self.leonardo_key:
            raise ValueError("Leonardo API key not configured")

        logger.info(f"Leonardo: Generating {duration}s video for scene {scene_id}...")

        try:
            # Leonardo API for video generation (beta)
            url = "https://api.leonardo.ai/rest/v1/generations-video"

            headers = {
                "Authorization": f"Bearer {self.leonardo_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "prompt": prompt,
                "isPublic": False,
                "isVariation": False,
                "negative_prompt": "no logos, no brands, no real people, no watermarks",
                "videoMotionStrength": 0.7,
                "aspectRatio": aspect_ratio
            }

            response = requests.post(url, json=payload, headers=headers, timeout=30)

            if response.status_code == 401:
                raise ValueError("Invalid Leonardo API key")
            elif response.status_code == 402:
                raise ValueError("Insufficient Leonardo credits")

            response.raise_for_status()
            data = response.json()

            generation_id = data["generationId"]
            logger.debug(f"Leonardo generation started, ID: {generation_id}")

            # Poll für Completion
            video_url = self._wait_for_leonardo_video_completion(generation_id, headers)

            # Download video
            logger.info(f"Downloading video from Leonardo...")
            video_response = requests.get(video_url, timeout=60)
            video_response.raise_for_status()

            # Save video
            video_path = self.output_dir / f"scene_{scene_id}.mp4"
            with open(video_path, "wb") as f:
                f.write(video_response.content)

            logger.info(f"✓ Video saved: {video_path}")
            return str(video_path)

        except Exception as e:
            logger.error(f"✗ Leonardo video generation failed: {e}")
            raise

    def _wait_for_leonardo_video_completion(self, generation_id, headers, timeout=300):
        """Wait for Leonardo video to be ready"""
        start_time = time.time()

        while time.time() - start_time < timeout:
            url = f"https://api.leonardo.ai/rest/v1/generations-video/{generation_id}"
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()

            data = response.json()
            status = data.get("generationVideoJob", {}).get("status")

            if status == "COMPLETE":
                video_url = data["generationVideoJob"]["videoElements"][0]["url"]
                return video_url
            elif status == "FAILED":
                raise Exception("Leonardo video generation failed")

            logger.debug(f"Leonardo status: {status}, waiting...")
            time.sleep(5)

        raise TimeoutError("Leonardo video generation timeout")
