"""
Configuration loader
"""

import yaml
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

def load_config(config_path="config.yaml"):
    """Load configuration from YAML file"""

    config_file = Path(config_path)

    if not config_file.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")

    logger.info(f"Loading config from {config_path}...")

    with open(config_file, "r") as f:
        config = yaml.safe_load(f)

    logger.debug(f"✓ Config loaded successfully")

    return config
