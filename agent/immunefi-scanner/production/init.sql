-- Initialize database schema for production 24/7 monitoring

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vulnerabilities table
CREATE TABLE vulnerabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(50) NOT NULL,
    bounty_min INTEGER,
    bounty_max INTEGER,
    proof_of_concept TEXT,
    fix_suggestion TEXT,
    contract_address VARCHAR(255),
    transaction_hash VARCHAR(255),
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'discovered',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scanner runs table
CREATE TABLE scanner_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'running',
    contracts_scanned INTEGER DEFAULT 0,
    vulnerabilities_found INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monitoring metrics table
CREATE TABLE monitoring_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(255) NOT NULL,
    metric_value NUMERIC,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    labels JSONB
);

-- Scanner status table
CREATE TABLE scanner_status (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    is_active BOOLEAN DEFAULT TRUE,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_scan_id UUID,
    uptime_seconds INTEGER DEFAULT 0,
    total_scans INTEGER DEFAULT 0,
    total_vulnerabilities INTEGER DEFAULT 0,
    configuration JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial scanner status
INSERT INTO scanner_status (id, is_active) VALUES (1, TRUE);

-- Indexes for better performance
CREATE INDEX idx_vulnerabilities_severity ON vulnerabilities(severity);
CREATE INDEX idx_vulnerabilities_discovered_at ON vulnerabilities(discovered_at);
CREATE INDEX idx_vulnerabilities_contract_address ON vulnerabilities(contract_address);
CREATE INDEX idx_scanner_runs_start_time ON scanner_runs(start_time);
CREATE INDEX idx_monitoring_metrics_timestamp ON monitoring_metrics(timestamp);
CREATE INDEX idx_monitoring_metrics_name ON monitoring_metrics(metric_name);

-- Function to update scanner heartbeat
CREATE OR REPLACE FUNCTION update_scanner_heartbeat()
RETURNS VOID AS $$
BEGIN
    UPDATE scanner_status 
    SET last_heartbeat = NOW(), 
        updated_at = NOW()
    WHERE id = 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get vulnerability stats
CREATE OR REPLACE FUNCTION get_vulnerability_stats()
RETURNS TABLE(
    total_vulnerabilities BIGINT,
    critical_count BIGINT,
    high_count BIGINT,
    medium_count BIGINT,
    low_count BIGINT,
    info_count BIGINT,
    total_bounty_potential BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_vulnerabilities,
        COUNT(*) FILTER (WHERE severity = 'Critical') as critical_count,
        COUNT(*) FILTER (WHERE severity = 'High') as high_count,
        COUNT(*) FILTER (WHERE severity = 'Medium') as medium_count,
        COUNT(*) FILTER (WHERE severity = 'Low') as low_count,
        COUNT(*) FILTER (WHERE severity = 'Info') as info_count,
        COALESCE(SUM(bounty_max), 0) as total_bounty_potential
    FROM vulnerabilities;
END;
$$ LANGUAGE plpgsql;