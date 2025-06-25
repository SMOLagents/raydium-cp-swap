// Real-time dashboard for 24/7 monitoring
class GorbaganaDashboard {
    constructor() {
        this.wsConnection = null;
        this.apiBase = '/api';
        this.updateInterval = 30000; // 30 seconds
        this.isConnected = false;
        this.init();
    }

    async init() {
        await this.connectWebSocket();
        await this.loadInitialData();
        this.startPeriodicUpdates();
        this.bindEvents();
    }

    async connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/ws`;
        
        try {
            this.wsConnection = new WebSocket(wsUrl);
            
            this.wsConnection.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.updateConnectionStatus(true);
            };
            
            this.wsConnection.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealTimeUpdate(data);
            };
            
            this.wsConnection.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                this.updateConnectionStatus(false);
                // Reconnect after 5 seconds
                setTimeout(() => this.connectWebSocket(), 5000);
            };
            
            this.wsConnection.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
        }
    }

    async loadInitialData() {
        try {
            const [status, vulnerabilities, stats] = await Promise.all([
                this.fetchAPI('/status'),
                this.fetchAPI('/vulnerabilities'),
                this.fetchAPI('/stats')
            ]);

            this.updateScannerStatus(status);
            this.updateVulnerabilities(vulnerabilities);
            this.updateStatistics(stats);
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }

    async fetchAPI(endpoint) {
        const response = await fetch(`${this.apiBase}${endpoint}`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        return response.json();
    }

    handleRealTimeUpdate(data) {
        switch (data.type) {
            case 'vulnerability_detected':
                this.addNewVulnerability(data.vulnerability);
                this.showNotification('🚨 New vulnerability detected!', 'error');
                break;
            case 'scan_completed':
                this.updateScanCounter(data.scan_data);
                break;
            case 'scanner_status':
                this.updateScannerStatus(data.status);
                break;
            case 'heartbeat':
                this.updateHeartbeat();
                break;
        }
    }

    updateScannerStatus(status) {
        const statusElement = document.getElementById('scanner-status');
        const uptimeElement = document.getElementById('uptime');
        const activeElement = document.getElementById('active-status');

        if (activeElement) {
            activeElement.textContent = status.is_active ? '🟢 ACTIVE' : '🔴 INACTIVE';
            activeElement.className = status.is_active ? 'status-active' : 'status-inactive';
        }

        if (uptimeElement && status.uptime_seconds) {
            const uptime = this.formatUptime(status.uptime_seconds);
            uptimeElement.textContent = uptime;
        }
    }

    updateVulnerabilities(vulnerabilities) {
        const container = document.getElementById('vulnerabilities-list');
        if (!container) return;

        container.innerHTML = '';
        vulnerabilities.forEach(vuln => {
            const card = this.createVulnerabilityCard(vuln);
            container.appendChild(card);
        });
    }

    addNewVulnerability(vulnerability) {
        const container = document.getElementById('vulnerabilities-list');
        if (!container) return;

        const card = this.createVulnerabilityCard(vulnerability);
        card.classList.add('new-vulnerability');
        container.insertBefore(card, container.firstChild);

        // Animate the new card
        setTimeout(() => {
            card.classList.remove('new-vulnerability');
        }, 3000);
    }

    createVulnerabilityCard(vuln) {
        const card = document.createElement('div');
        card.className = `vulnerability-card severity-${vuln.severity.toLowerCase()}`;
        
        card.innerHTML = `
            <div class="vulnerability-header">
                <span class="severity-badge severity-${vuln.severity.toLowerCase()}">${vuln.severity}</span>
                <span class="bounty-amount">$${vuln.bounty_max.toLocaleString()}</span>
            </div>
            <h3 class="vulnerability-title">${vuln.title}</h3>
            <p class="vulnerability-description">${vuln.description}</p>
            <div class="vulnerability-details">
                <p><strong>Contract:</strong> <span class="contract-address">${vuln.contract_address}</span></p>
                <p><strong>Discovered:</strong> ${new Date(vuln.discovered_at).toLocaleString()}</p>
            </div>
            <div class="vulnerability-actions">
                <button onclick="dashboard.viewDetails('${vuln.id}')">View Details</button>
                <button onclick="dashboard.submitToImmunefi('${vuln.id}')">Submit to Immunefi</button>
            </div>
        `;

        return card;
    }

    updateStatistics(stats) {
        this.updateStatElement('total-vulnerabilities', stats.total_vulnerabilities);
        this.updateStatElement('critical-count', stats.critical_count);
        this.updateStatElement('high-count', stats.high_count);
        this.updateStatElement('medium-count', stats.medium_count);
        this.updateStatElement('total-bounty', `$${stats.total_bounty_potential.toLocaleString()}`);
    }

    updateStatElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = connected ? '🟢 Connected' : '🔴 Disconnected';
            statusElement.className = connected ? 'connected' : 'disconnected';
        }
    }

    updateHeartbeat() {
        const heartbeatElement = document.getElementById('last-heartbeat');
        if (heartbeatElement) {
            heartbeatElement.textContent = new Date().toLocaleTimeString();
        }
    }

    updateScanCounter(scanData) {
        const element = document.getElementById('total-scans');
        if (element) {
            element.textContent = scanData.total_scans;
        }
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }

    startPeriodicUpdates() {
        setInterval(async () => {
            if (!this.isConnected) {
                await this.loadInitialData();
            }
        }, this.updateInterval);
    }

    bindEvents() {
        // Manual refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadInitialData());
        }

        // Export data button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
    }

    async viewDetails(vulnerabilityId) {
        try {
            const vulnerability = await this.fetchAPI(`/vulnerabilities/${vulnerabilityId}`);
            this.showVulnerabilityModal(vulnerability);
        } catch (error) {
            console.error('Failed to load vulnerability details:', error);
        }
    }

    async submitToImmunefi(vulnerabilityId) {
        try {
            const response = await fetch(`${this.apiBase}/vulnerabilities/${vulnerabilityId}/submit`, {
                method: 'POST'
            });
            
            if (response.ok) {
                this.showNotification('✅ Successfully submitted to Immunefi!', 'success');
            } else {
                this.showNotification('❌ Failed to submit to Immunefi', 'error');
            }
        } catch (error) {
            console.error('Failed to submit to Immunefi:', error);
            this.showNotification('❌ Failed to submit to Immunefi', 'error');
        }
    }

    async exportData() {
        try {
            const response = await fetch(`${this.apiBase}/export/vulnerabilities`);
            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vulnerabilities_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export data:', error);
        }
    }
}

// Initialize dashboard when page loads
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new GorbaganaDashboard();
});