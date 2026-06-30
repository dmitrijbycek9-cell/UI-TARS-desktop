#!/bin/bash
# TikTok Auto Producer - Installation Script

echo "🚀 TikTok Auto Producer - Installation"
echo "========================================"

# Check Python version
echo "Checking Python..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python $python_version"

# Create virtual environment
echo ""
echo "Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo ""
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Check FFmpeg
echo ""
echo "Checking FFmpeg..."
if command -v ffmpeg &> /dev/null; then
    echo "✓ FFmpeg found"
else
    echo "⚠️  FFmpeg not found. Install with:"
    echo "   Linux: sudo apt-get install ffmpeg"
    echo "   Mac: brew install ffmpeg"
fi

# Setup config
echo ""
echo "Setting up config..."
if [ ! -f config.yaml ]; then
    cp config.example.yaml config.yaml
    echo "✓ Created config.yaml - EDIT THIS with your API keys!"
else
    echo "✓ config.yaml already exists"
fi

# Create directories
echo ""
echo "Creating directories..."
mkdir -p output logs assets/music
echo "✓ Directories created"

# Test imports
echo ""
echo "Testing Python imports..."
python3 -c "import requests, yaml, pydub" && echo "✓ All imports OK" || echo "✗ Some imports failed"

echo ""
echo "========================================"
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Edit config.yaml with your API keys"
echo "2. Run: python auto_producer.py --scene-plan scenes/gaming-fail.json"
echo ""
echo "For detailed setup: see SETUP.md"
