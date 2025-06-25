#!/bin/bash

# 🚀 Gorbagana Immunefi Scanner - 24/7 Production Deployment Script
# This script sets up the complete 24/7 monitoring infrastructure

set -e

echo "🤖 Starting Gorbagana Immunefi Scanner 24/7 Deployment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[ℹ]${NC} $1"
}

# Check prerequisites
check_requirements() {
    print_info "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if running as root (for production deployment)
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root. This is recommended for production deployment."
    fi
    
    print_status "All requirements met"
}

# Setup environment variables
setup_environment() {
    print_info "Setting up environment variables..."
    
    # Check if .env exists
    if [[ ! -f .env ]]; then
        print_info "Creating .env file..."
        cat > .env << EOF
# Database Configuration
DB_PASSWORD=$(openssl rand -hex 32)
POSTGRES_PASSWORD=\${DB_PASSWORD}

# Security
GRAFANA_PASSWORD=$(openssl rand -hex 16)
SECRET_KEY=$(openssl rand -hex 32)

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
ENVIRONMENT=production

# Monitoring
PROMETHEUS_RETENTION=30d
GRAFANA_DOMAIN=localhost

# Scanner Configuration
SCAN_INTERVAL=300
MAX_CONCURRENT_SCANS=5
LOG_LEVEL=INFO

# Immunefi Configuration
IMMUNEFI_API_KEY=your_immunefi_api_key_here
IMMUNEFI_WEBHOOK_URL=your_webhook_url_here

# Alert Configuration
DISCORD_WEBHOOK=your_discord_webhook_here
SLACK_WEBHOOK=your_slack_webhook_here
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_email_password
EOF
        print_status "Environment file created at .env"
        print_warning "Please edit .env file with your actual configuration values"
    else
        print_status "Environment file already exists"
    fi
}

# Setup SSL certificates (Let's Encrypt)
setup_ssl() {
    print_info "Setting up SSL certificates..."
    
    if [[ ! -d "./ssl" ]]; then
        mkdir -p ./ssl
        
        # Generate self-signed certificates for testing
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ./ssl/key.pem \
            -out ./ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        
        print_status "Self-signed SSL certificates generated"
        print_warning "For production, replace with valid SSL certificates"
    else
        print_status "SSL certificates already exist"
    fi
}

# Setup monitoring configuration
setup_monitoring() {
    print_info "Setting up monitoring configuration..."
    
    # Prometheus configuration
    cat > prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'scanner-api'
    static_configs:
      - targets: ['scanner-api:8000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
EOF

    # Grafana dashboard provisioning
    mkdir -p grafana/dashboards
    cat > grafana/dashboards/scanner-dashboard.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Gorbagana Immunefi Scanner",
    "tags": ["immunefi", "security", "vulnerabilities"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Vulnerabilities Found",
        "type": "stat",
        "targets": [
          {
            "expr": "scanner_vulnerabilities_total",
            "legendFormat": "Total Vulnerabilities"
          }
        ]
      },
      {
        "title": "Scan Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(scanner_scans_total[5m])",
            "legendFormat": "Scans per second"
          }
        ]
      },
      {
        "title": "Bounty Potential",
        "type": "stat",
        "targets": [
          {
            "expr": "scanner_bounty_potential_total",
            "legendFormat": "Total Bounty ($)"
          }
        ]
      }
    ],
    "refresh": "30s",
    "time": {
      "from": "now-1h",
      "to": "now"
    }
  }
}
EOF

    print_status "Monitoring configuration created"
}

# Build and start services
deploy_services() {
    print_info "Building and deploying services..."
    
    # Build images
    print_info "Building Gorbagana Scanner image..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Start services
    print_info "Starting all services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    print_info "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    check_services_health
}

# Check service health
check_services_health() {
    print_info "Checking service health..."
    
    services=("scanner-api" "web-dashboard" "postgres" "redis" "prometheus" "grafana")
    
    for service in "${services[@]}"; do
        if docker-compose -f docker-compose.prod.yml ps | grep -q "${service}.*Up"; then
            print_status "${service} is running"
        else
            print_error "${service} is not running properly"
            docker-compose -f docker-compose.prod.yml logs "${service}"
        fi
    done
}

# Setup systemd service for auto-restart
setup_systemd() {
    if [[ $EUID -eq 0 ]]; then
        print_info "Setting up systemd service..."
        
        sudo cat > /etc/systemd/system/gorbagana-scanner.service << EOF
[Unit]
Description=Gorbagana Immunefi Scanner
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$(pwd)
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
        
        systemctl daemon-reload
        systemctl enable gorbagana-scanner.service
        print_status "Systemd service configured"
    else
        print_warning "Systemd service setup requires root privileges"
    fi
}

# Setup log rotation
setup_log_rotation() {
    if [[ $EUID -eq 0 ]]; then
        print_info "Setting up log rotation..."
        
        sudo cat > /etc/logrotate.d/gorbagana-scanner << EOF
/var/lib/docker/containers/*/*-json.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
EOF
        
        print_status "Log rotation configured"
    else
        print_warning "Log rotation setup requires root privileges"
    fi
}

# Create monitoring script
create_monitoring_script() {
    print_info "Creating monitoring script..."
    
    cat > monitor.sh << 'EOF'
#!/bin/bash

# Monitoring script for Gorbagana Scanner
while true; do
    echo "=== $(date) ==="
    
    # Check if services are running
    if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        echo "❌ Some services are down, attempting restart..."
        docker-compose -f docker-compose.prod.yml up -d
    else
        echo "✅ All services are running"
    fi
    
    # Check disk space
    df_output=$(df -h / | tail -1)
    used_percent=$(echo "$df_output" | awk '{print $5}' | sed 's/%//')
    if [ "$used_percent" -gt 80 ]; then
        echo "⚠️  Disk usage is high: ${used_percent}%"
    fi
    
    # Check memory usage
    memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    echo "💾 Memory usage: ${memory_usage}%"
    
    sleep 300  # Check every 5 minutes
done
EOF
    
    chmod +x monitor.sh
    print_status "Monitoring script created"
}

# Print deployment summary
print_summary() {
    echo ""
    echo -e "${PURPLE}🎉 GORBAGANA IMMUNEFI SCANNER DEPLOYED SUCCESSFULLY! 🎉${NC}"
    echo ""
    echo -e "${CYAN}📊 Access Points:${NC}"
    echo -e "   🌐 Web Dashboard: ${GREEN}https://localhost${NC}"
    echo -e "   📋 API Docs: ${GREEN}https://localhost/api/docs${NC}"
    echo -e "   📈 Grafana: ${GREEN}http://localhost:3000${NC}"
    echo -e "   🔍 Prometheus: ${GREEN}http://localhost:9090${NC}"
    echo ""
    echo -e "${CYAN}🔧 Management Commands:${NC}"
    echo -e "   📊 View logs: ${YELLOW}docker-compose -f docker-compose.prod.yml logs -f${NC}"
    echo -e "   🔄 Restart services: ${YELLOW}docker-compose -f docker-compose.prod.yml restart${NC}"
    echo -e "   🛑 Stop services: ${YELLOW}docker-compose -f docker-compose.prod.yml down${NC}"
    echo -e "   📈 Monitor system: ${YELLOW}./monitor.sh${NC}"
    echo ""
    echo -e "${CYAN}📋 Configuration:${NC}"
    echo -e "   ⚙️  Edit .env file for custom settings"
    echo -e "   🔒 Update SSL certificates in ./ssl/ directory"
    echo -e "   📧 Configure alerts in .env file"
    echo ""
    echo -e "${GREEN}🤖 Your 24/7 Immunefi Scanner is now actively hunting for vulnerabilities!${NC}"
    echo ""
}

# Main execution
main() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║  🤖 GORBAGANA IMMUNEFI SCANNER - 24/7 DEPLOYMENT SCRIPT   ║"
    echo "║  🛡️ AI-Powered Vulnerability Detection Infrastructure       ║"
    echo "║  💰 Continuous Bug Bounty Hunting System                   ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_requirements
    setup_environment
    setup_ssl
    setup_monitoring
    deploy_services
    setup_systemd
    setup_log_rotation
    create_monitoring_script
    print_summary
}

# Run main function
main "$@"
EOF

chmod +x /Users/8bit/Gorbagana-Dev/raydium-cp-swap/agent/immunefi-scanner/production/deploy.sh