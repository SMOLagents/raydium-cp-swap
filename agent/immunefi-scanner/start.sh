#!/bin/bash

echo "🤖 Starting Gorbagana Immunefi Scanner..."
echo "🛡️  AI-powered 24/7 vulnerability detection"
echo "💰 Immunefi V2.3 Classification System"

# Create necessary directories
mkdir -p data logs monitoring/grafana/dashboards monitoring/grafana/datasources

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please configure .env file with your settings"
fi

# Check for Docker Compose command
COMPOSE_CMD=""
if command -v "docker compose" &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v "docker-compose" &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo "❌ Docker Compose not found!"
    echo "📥 Please install Docker Desktop or Docker Compose:"
    echo "   - macOS: https://docs.docker.com/desktop/install/mac-install/"
    echo "   - Linux: https://docs.docker.com/compose/install/"
    echo ""
    echo "🔄 Alternatively, run without Docker:"
    echo "   pip install -r requirements.txt"
    echo "   python src/api.py"
    exit 1
fi

# Build and start services
echo "🚀 Building and starting services with: $COMPOSE_CMD"
$COMPOSE_CMD up --build -d

if [ $? -eq 0 ]; then
    echo "✅ Services started successfully!"
    echo ""
    echo "🔗 Access points:"
    echo "   📊 Grafana Dashboard: http://localhost:3000 (admin/gorbagana123)"
    echo "   📈 Prometheus: http://localhost:9090"
    echo "   🔍 Scanner API: http://localhost:8000"
    echo "   📋 API Documentation: http://localhost:8000/docs"
    echo ""
    echo "🔍 Check service status:"
    echo "   $COMPOSE_CMD ps"
    echo ""
    echo "📜 View logs:"
    echo "   $COMPOSE_CMD logs -f immunefi-scanner"
    
    # Wait a moment for services to start
    sleep 5
    
    # Check if services are running
    echo "🔧 Checking service health..."
    curl -s http://localhost:8000/health || echo "⚠️  Scanner API not ready yet (starting up...)"
else
    echo "❌ Failed to start services with Docker"
    echo ""
    echo "🔄 Try running without Docker:"
    echo "   pip install -r requirements.txt"
    echo "   python src/api.py"
fi