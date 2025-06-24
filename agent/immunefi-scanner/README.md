# Gorbagana Immunefi Vulnerability Scanner

🤖 **AI-powered 24/7 vulnerability detection system** with Immunefi V2.3 Classification

## Features

- **Immunefi V2.3 Compatibility**: 5-level severity classification (Critical, High, Medium, Low, Info)
- **24/7 Continuous Scanning**: Autonomous AI worker with configurable intervals
- **Smart Contract Analysis**: Advanced vulnerability pattern detection
- **Bounty Calculation**: Automatic reward estimation based on Immunefi standards
- **Real-time Monitoring**: Prometheus metrics and Grafana dashboards
- **REST API**: Complete management and monitoring interface

## Severity Classification & Bounties

| Severity | Bounty Range | Description |
|----------|--------------|-------------|
| **Critical** | $50,000 - $505,000 | Reentrancy, price manipulation, flash loan attacks |
| **High** | $40,000 | Access control, integer overflow vulnerabilities |
| **Medium** | $5,000 | Logic errors, minor security issues |
| **Low** | $1,000 - $2,000 | Informational security concerns |
| **Info** | $100 - $500 | Code quality and best practice violations |

## Quick Start

1. **Start the scanner**:
   ```bash
   ./start.sh
   ```

2. **Access interfaces**:
   - Scanner API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Grafana: http://localhost:3000 (admin/gorbagana123)
   - Prometheus: http://localhost:9090

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
CP_SWAP_PROGRAM_ID=CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C

# Scanner Configuration  
SCAN_INTERVAL=300  # 5 minutes
LOG_LEVEL=INFO
```

## API Endpoints

### Status & Health
- `GET /health` - Service health check
- `GET /status` - Scanner status and statistics
- `GET /statistics` - Vulnerability statistics and bounty totals

### Vulnerabilities
- `GET /vulnerabilities` - List all vulnerabilities
- `GET /vulnerabilities/critical` - Critical vulnerabilities only
- `GET /vulnerabilities?severity=High&limit=50` - Filter by severity

### Scanning
- `POST /scan/manual` - Trigger manual contract scan
- `GET /bounty-calculator?severity=Critical&funds_at_risk=1000000` - Calculate bounties

### Export
- `GET /export?format=json` - Export vulnerability data

## Example API Usage

```bash
# Check scanner status
curl http://localhost:8000/status

# Get critical vulnerabilities
curl http://localhost:8000/vulnerabilities/critical

# Trigger manual scan
curl -X POST http://localhost:8000/scan/manual \
  -H "Content-Type: application/json" \
  -d '{"contract_address": "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C"}'

# Calculate bounty for critical vulnerability
curl "http://localhost:8000/bounty-calculator?severity=Critical&funds_at_risk=1000000"
```

## Vulnerability Detection

The scanner detects common DeFi vulnerabilities:

- **Reentrancy attacks** in state-changing functions
- **Integer overflow/underflow** in arithmetic operations  
- **Access control** bypass vulnerabilities
- **Oracle price manipulation** attacks
- **Flash loan attack** vectors
- **Logic errors** in swap calculations

## Monitoring & Alerts

### Prometheus Metrics
- Vulnerability count by severity
- Scanner uptime and health
- Scan frequency and duration
- API request metrics

### Grafana Dashboards
- Real-time vulnerability trends
- Bounty potential tracking  
- Scanner performance metrics
- Alert notifications

## Development

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run scanner only
python src/scanner.py

# Run API server
python src/api.py

# Run worker process
python src/worker.py
```

### Docker Development
```bash
# Build image
docker build -t gorbagana-immunefi-scanner .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f immunefi-scanner
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FastAPI API   │    │  Scanner Core   │    │  Vulnerability  │
│     Server      │────│    Engine       │────│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Prometheus    │    │   AI Worker     │    │    Grafana      │
│    Metrics      │    │   (24/7 Scan)   │    │   Dashboard     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Security

- **Read-only scanning**: No state modifications
- **Secure API**: Authentication and rate limiting
- **Isolated containers**: Docker security boundaries
- **Audit logging**: Complete scan and finding trails

## Support

- Check logs: `docker-compose logs -f immunefi-scanner`
- API documentation: http://localhost:8000/docs
- Health endpoint: http://localhost:8000/health