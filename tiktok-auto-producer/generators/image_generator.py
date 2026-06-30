"""
Image Generation Module
Supports: Pollinations.ai (kostenlos), Leonardo.ai, Pika
"""

import requests
import logging
from pathlib import Path
from urllib.parse import quote
import time

logger = logging.getLogger(__name__)

class ImageGenerator:
    def __init__(self, config):
        self.config = config
        self.output_dir = Path(config["output"]["directory"]) / "images"
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # API Keys
        self.leonardo_key = config.get("apis", {}).get("leonardo", {}).get("api_key")
        self.pika_key = config.get("apis", {}).get("pika", {}).get("api_key")

    def generate(self, prompt, scene_id, aspect_ratio="9:16"):
        """
        Generate image from prompt
        Uses Pollinations (kostenlos) by default
        """

        # Pollinations ist kostenlos und unbegrenzt - nutze das!
        return self._generate_pollinations(prompt, scene_id, aspect_ratio)

    def _generate_pollinations(self, prompt, scene_id, aspect_ratio):
        """
        Generate image using Pollinations.ai (kostenlos!)
        Keine API-Key nötig, unbegrenzte Credits
        """

        logger.info(f"Generating image with Pollinations (Scene {scene_id})...")

        try:
            # Pollinations API (kostenlos, keine Auth)
            # Format: https://image.pollinations.ai/prompt/{prompt}

            # Optimize prompt for 9:16 format
            enhanced_prompt = f"{prompt}, 9:16 portrait, vertical, high quality, cinematic"

            url = f"https://image.pollinations.ai/prompt/{quote(enhanced_prompt)}"

            logger.debug(f"Requesting: {url}")

            response = requests.get(url, timeout=30)
            response.raise_for_status()

            # Save image
            image_path = self.output_dir / f"scene_{scene_id}.png"
            with open(image_path, "wb") as f:
                f.write(response.content)

            logger.info(f"✓ Image saved: {image_path}")
            return str(image_path)

        except Exception as e:
            logger.error(f"✗ Pollinations generation failed: {e}")
            # Try fallback to Leonardo if available
            if self.leonardo_key:
                logger.info("Trying Leonardo as fallback...")
                return self._generate_leonardo(prompt, scene_id, aspect_ratio)
            raise

    def _generate_leonardo(self, prompt, scene_id, aspect_ratio):
        """
        Generate image using Leonardo.ai (kostenlos: 150 Credits/Monat)
        Fallback wenn Pollinations nicht funktioniert
        """

        if not self.leonardo_key:
            raise ValueError("Leonardo API key not configured")

        logger.info(f"Generating image with Leonardo (Scene {scene_id})...")

        try:
            # Leonardo API
            url = "https://api.leonardo.ai/rest/v1/generations"

            headers = {
                "Authorization": f"Bearer {self.leonardo_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "prompt": prompt,
                "negative_prompt": "no logos, no brands, no text",
                "num_images": 1,
                "height": 1920 if aspect_ratio == "9:16" else 1080,
                "width": 1080 if aspect_ratio == "9:16" else 1920,
                "modelId": "5c232a9e-9061-4777-980a-ddc8e65647c6",  # Leonardo Vision XL
                "photoReal": True,
                "photoRealStrength": 1
            }

            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()

            data = response.json()
            generation_id = data["sdGenerationJob"]["generationId"]

            logger.debug(f"Generation ID: {generation_id}, waiting for completion...")

            # Poll für Completion (Leonardo ist async)
            image_url = self._wait_for_leonardo_completion(generation_id, headers)

            # Download image
            image_response = requests.get(image_url, timeout=30)
            image_response.raise_for_status()

            # Save image
            image_path = self.output_dir / f"scene_{scene_id}.png"
            with open(image_path, "wb") as f:
                f.write(image_response.content)

            logger.info(f"✓ Image saved: {image_path}")
            return str(image_path)

        except Exception as e:
            logger.error(f"✗ Leonardo generation failed: {e}")
            raise

    def _wait_for_leonardo_completion(self, generation_id, headers, timeout=300):
        """Wait for Leonardo image to be ready"""
        start_time = time.time()

        while time.time() - start_time < timeout:
            url = f"https://api.leonardo.ai/rest/v1/generations/{generation_id}"
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()

            data = response.json()
            status = data["sdGenerationJob"]["status"]

            if status == "COMPLETE":
                image_url = data["sdGenerationJob"]["generationElements"][0]["url"]
                return image_url
            elif status == "FAILED":
                raise Exception("Leonardo generation failed")

            logger.debug(f"Status: {status}, waiting...")
            time.sleep(5)

        raise TimeoutError("Leonardo generation timeout")
