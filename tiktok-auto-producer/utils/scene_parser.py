"""
Scene plan parser
Supports JSON and YAML formats
"""

import json
import yaml
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

def parse_scene_plan(plan_path):
    """
    Parse scene plan from JSON or YAML

    Args:
        plan_path: Path to scene plan file

    Returns:
        Dict with parsed scene plan
    """

    plan_file = Path(plan_path)

    if not plan_file.exists():
        raise FileNotFoundError(f"Scene plan not found: {plan_path}")

    logger.info(f"Parsing scene plan: {plan_path}")

    # Determine file type
    if plan_file.suffix == ".json":
        with open(plan_file, "r") as f:
            plan = json.load(f)
    elif plan_file.suffix in [".yaml", ".yml"]:
        with open(plan_file, "r") as f:
            plan = yaml.safe_load(f)
    else:
        raise ValueError(f"Unsupported file format: {plan_file.suffix}")

    # Validate
    if "scenes" not in plan:
        raise ValueError("Scene plan must contain 'scenes' key")

    if "voiceover" not in plan:
        logger.warning("Scene plan missing 'voiceover' section")

    logger.info(f"✓ Parsed {len(plan['scenes'])} scenes")

    return plan
