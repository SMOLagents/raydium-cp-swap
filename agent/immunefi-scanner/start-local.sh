#!/bin/bash

echo "🤖 Starting Gorbagana Immunefi Scanner (Local Mode)..."
echo "🛡️  AI-powered 24/7 vulnerability detection"
echo "💰 Immunefi V2.3 Classification System"

# Create necessary directories
mkdir -p data logs

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please configure .env file with your settings"
fi

# Check if Python is available
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "❌ Python not found! Please install Python 3.8+"
    exit 1
fi

PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

echo "🐍 Using Python: $PYTHON_CMD"

# Check if pip is available
if ! command -v pip3 &> /dev/null && ! command -v pip &> /dev/null; then
    echo "❌ pip not found! Please install pip"
    exit 1
fi

PIP_CMD="pip3"
if ! command -v pip3 &> /dev/null; then
    PIP_CMD="pip"
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "🔧 Creating Python virtual environment..."
    $PYTHON_CMD -m venv venv
fi

echo "🔄 Activating virtual environment..."
source venv/bin/activate

echo "📦 Installing dependencies..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "🚀 Starting Immunefi Scanner API..."
echo ""
echo "🔗 Access points:"
echo "   🔍 Scanner API: http://localhost:8000"
echo "   📋 API Documentation: http://localhost:8000/docs"
echo ""
echo "⏹️  To stop: Press Ctrl+C"
echo ""

# Start the API server
python src/api.py