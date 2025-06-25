# 🤖 Gorbagana Immunefi Scanner - 24/7 Production Deployment

This directory contains the complete production infrastructure for running the Gorbagana Immunefi Scanner 24/7 with web monitoring, database persistence, and automated scaling.

## 🚀 Quick Deployment

### Option 1: Automated Deployment (Recommended)
```bash
cd production/
chmod +x deploy.sh
sudo ./deploy.sh
```

### Option 2: Manual Deployment
```bash
# 1. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 2. Generate SSL certificates
mkdir ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/key.pem -out ssl/cert.pem

# 3. Deploy services
docker-compose -f docker-compose.prod.yml up -d

# 4. Monitor deployment
docker-compose -f docker-compose.prod.yml logs -f
```

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    🌐 Web Dashboard                         │
│              (nginx + SSL termination)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                🤖 Scanner API                               │
│         (FastAPI + WebSocket support)                      │
└─────────────────┬───────────────┬───────────────────────────┘
                  │               │
        ┌─────────┴─────────┐   ┌─┴─────────────────────────┐
        │   📊 Database     │   │    📈 Monitoring          │
        │   (PostgreSQL)    │   │  (Prometheus + Grafana)   │
        └───────────────────┘   └───────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │   ⚡ Cache        │
        │   (Redis)         │
        └───────────────────┘
```

## 📋 Services Included

| Service | Port | Description |
|---------|------|-------------|
| **Web Dashboard** | 80/443 | HTTPS web interface with real-time monitoring |
| **Scanner API** | 8000 | FastAPI backend with WebSocket support |
| **PostgreSQL** | 5432 | Primary database for vulnerability storage |
| **Redis** | 6379 | Caching and session management |
| **Prometheus** | 9090 | Metrics collection and alerting |
| **Grafana** | 3000 | Advanced monitoring dashboards |

## 🌐 Web Dashboard Features

### Real-time Monitoring
- **Live vulnerability feed** with instant notifications
- **WebSocket connections** for real-time updates
- **Interactive statistics** with animated charts
- **24/7 uptime tracking** with heartbeat monitoring

### Security Features
- **SSL/TLS encryption** for all communications
- **Rate limiting** to prevent abuse
- **Security headers** (HSTS, XSS protection)
- **Authentication** for sensitive operations

### Responsive Design
- **Mobile-friendly** interface
- **Matrix-style animations** for visual appeal
- **Dark theme** optimized for security operations
- **Accessibility** features for all users

## 🗄️ Database Schema

### Core Tables
```sql
-- Vulnerabilities with full tracking
vulnerabilities (
    id, external_id, title, description,
    severity, bounty_min, bounty_max,
    contract_address, discovered_at, status
)

-- Scanner execution history
scanner_runs (
    id, start_time, end_time, status,
    contracts_scanned, vulnerabilities_found
)

-- Real-time metrics
monitoring_metrics (
    metric_name, metric_value, timestamp, labels
)

-- System status tracking
scanner_status (
    is_active, last_heartbeat, uptime_seconds,
    total_scans, configuration
)
```

## 📊 Monitoring & Alerting

### Grafana Dashboards
- **Vulnerability Overview** - Real-time stats and trends
- **Scanner Performance** - Scan rates and success metrics
- **System Health** - Resource usage and uptime
- **Alert History** - Historical alert patterns

### Prometheus Metrics
```yaml
# Scanner-specific metrics
scanner_vulnerabilities_total{severity="high"}
scanner_scans_total
scanner_bounty_potential_total
scanner_uptime_seconds

# System metrics
process_cpu_usage
process_memory_usage
database_connections_active
```

### Alert Configuration
Alerts are automatically configured for:
- 🚨 **High/Critical vulnerabilities** detected
- ⚠️ **Scanner offline** for > 5 minutes
- 💾 **High disk usage** (>80%)
- 🔄 **Database connection** failures

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Database
DB_PASSWORD=secure_random_password
POSTGRES_PASSWORD=${DB_PASSWORD}

# Security
SECRET_KEY=your_secret_key_here
GRAFANA_PASSWORD=admin_password

# Scanner Settings
SCAN_INTERVAL=300  # 5 minutes
MAX_CONCURRENT_SCANS=5
LOG_LEVEL=INFO

# Immunefi Integration
IMMUNEFI_API_KEY=your_api_key
IMMUNEFI_WEBHOOK_URL=your_webhook_url

# Notifications
DISCORD_WEBHOOK=your_discord_webhook
SLACK_WEBHOOK=your_slack_webhook
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_USERNAME=alerts@yourdomain.com
```

### SSL Certificates
Place your SSL certificates in the `ssl/` directory:
- `ssl/cert.pem` - SSL certificate
- `ssl/key.pem` - Private key

For Let's Encrypt:
```bash
certbot certonly --standalone -d yourdomain.com
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
```

## 🔄 Operations

### Daily Operations
```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View live logs
docker-compose -f docker-compose.prod.yml logs -f scanner-api

# Check database health
docker-compose -f docker-compose.prod.yml exec postgres \
    psql -U scanner -d immunefi_scanner -c "SELECT get_vulnerability_stats();"

# Monitor system resources
./monitor.sh
```

### Maintenance Tasks
```bash
# Database backup
docker-compose -f docker-compose.prod.yml exec postgres \
    pg_dump -U scanner immunefi_scanner > backup_$(date +%Y%m%d).sql

# Update scanner code
git pull origin main
docker-compose -f docker-compose.prod.yml build --no-cache scanner-api
docker-compose -f docker-compose.prod.yml restart scanner-api

# Clean old logs
docker system prune -f
```

### Scaling Operations
```bash
# Scale API horizontally
docker-compose -f docker-compose.prod.yml up -d --scale scanner-api=3

# Add monitoring for high-load environments
docker-compose -f docker-compose.prod.yml -f docker-compose.scale.yml up -d
```

## 🚨 Troubleshooting

### Common Issues

**Scanner Not Starting**
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs scanner-api

# Verify database connection
docker-compose -f docker-compose.prod.yml exec scanner-api \
    python -c "import asyncpg; print('DB connection test')"
```

**High Memory Usage**
```bash
# Check resource consumption
docker stats

# Optimize database
docker-compose -f docker-compose.prod.yml exec postgres \
    psql -U scanner -d immunefi_scanner -c "VACUUM ANALYZE;"
```

**SSL Certificate Issues**
```bash
# Verify certificate validity
openssl x509 -in ssl/cert.pem -text -noout

# Test HTTPS connection
curl -I https://localhost
```

### Performance Tuning

**Database Optimization**
```sql
-- Add indexes for better query performance
CREATE INDEX CONCURRENTLY idx_vulnerabilities_created_at 
ON vulnerabilities(created_at);

-- Optimize for time-series queries
CREATE INDEX CONCURRENTLY idx_monitoring_metrics_time_metric
ON monitoring_metrics(timestamp, metric_name);
```

**Scanner Optimization**
```bash
# Adjust scan interval based on load
SCAN_INTERVAL=180  # 3 minutes for high-frequency scanning

# Increase concurrent scans for powerful hardware
MAX_CONCURRENT_SCANS=10
```

## 📞 Support & Monitoring

### Health Checks
- **API Health**: `https://yourdomain.com/api/health`
- **Database Health**: `https://yourdomain.com/api/db-health`
- **Scanner Status**: `https://yourdomain.com/api/status`

### Log Aggregation
Logs are automatically collected and can be viewed via:
```bash
# Real-time logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f scanner-api

# Export logs for analysis
docker-compose logs --no-color > scanner_logs_$(date +%Y%m%d).log
```

### Backup Strategy
- **Daily database backups** to mounted volume
- **Weekly full system snapshots**
- **Real-time data replication** (optional)

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database backups scheduled
- [ ] Monitoring alerts configured
- [ ] Log rotation enabled
- [ ] Firewall rules applied
- [ ] Domain name configured
- [ ] Email notifications tested
- [ ] Performance baseline established
- [ ] Disaster recovery plan documented

---

## 🏆 Success Metrics

Your 24/7 Gorbagana Immunefi Scanner deployment is successful when:

✅ **Scanner Status**: Active and scanning every 5 minutes  
✅ **Web Dashboard**: Accessible via HTTPS with real-time updates  
✅ **Database**: Storing vulnerability data with proper indexing  
✅ **Monitoring**: Grafana dashboards showing live metrics  
✅ **Alerts**: Notifications working for new vulnerabilities  
✅ **Uptime**: >99.9% availability with automatic restarts  

**🎉 Ready to hunt $40,000+ bounties 24/7! 🎉**