// Analytics Dashboard Components
class AnalyticsDashboard {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            refreshInterval: 30000, // 30 seconds
            theme: 'light',
            showRealTime: true,
            ...options
        };
        
        this.widgets = new Map();
        this.data = new Map();
        this.refreshTimer = null;
        
        this.init();
    }

    init() {
        this.createDashboardStructure();
        this.setupRefreshTimer();
        this.loadInitialData();
    }

    createDashboardStructure() {
        this.container.innerHTML = `
            <div class="analytics-dashboard ${this.options.theme}">
                <div class="dashboard-header">
                    <h2>Analytics Dashboard</h2>
                    <div class="dashboard-controls">
                        <select id="timeRange">
                            <option value="1h">Last Hour</option>
                            <option value="24h" selected>Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                        </select>
                        <button id="refreshBtn">Refresh</button>
                    </div>
                </div>
                <div class="dashboard-grid" id="widgetGrid">
                    <!-- Widgets will be added here -->
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.addDefaultWidgets();
    }

    setupEventListeners() {
        const timeRange = this.container.querySelector('#timeRange');
        const refreshBtn = this.container.querySelector('#refreshBtn');

        timeRange.addEventListener('change', () => {
            this.refreshData();
        });

        refreshBtn.addEventListener('click', () => {
            this.refreshData();
        });
    }

    addDefaultWidgets() {
        // Real-time metrics
        this.addWidget('realtime', {
            title: 'Real-time Users',
            type: 'metric',
            position: { row: 1, col: 1 }
        });

        // Page views chart
        this.addWidget('pageviews', {
            title: 'Page Views',
            type: 'chart',
            chartType: 'line',
            position: { row: 1, col: 2, colspan: 2 }
        });

        // Top pages table
        this.addWidget('toppages', {
            title: 'Top Pages',
            type: 'table',
            position: { row: 2, col: 1 }
        });

        // User engagement
        this.addWidget('engagement', {
            title: 'User Engagement',
            type: 'gauge',
            position: { row: 2, col: 2 }
        });

        // Performance metrics
        this.addWidget('performance', {
            title: 'Core Web Vitals',
            type: 'metrics-grid',
            position: { row: 2, col: 3 }
        });

        // Conversion funnel
        this.addWidget('funnel', {
            title: 'Conversion Funnel',
            type: 'funnel',
            position: { row: 3, col: 1, colspan: 3 }
        });
    }

    addWidget(id, config) {
        const widget = new AnalyticsWidget(id, config);
        this.widgets.set(id, widget);
        
        const widgetGrid = this.container.querySelector('#widgetGrid');
        widgetGrid.appendChild(widget.element);
        
        return widget;
    }

    removeWidget(id) {
        const widget = this.widgets.get(id);
        if (widget) {
            widget.destroy();
            this.widgets.delete(id);
        }
    }

    async loadInitialData() {
        await this.refreshData();
    }

    async refreshData() {
        const timeRange = this.container.querySelector('#timeRange').value;
        
        try {
            // Fetch data for all widgets
            const promises = Array.from(this.widgets.entries()).map(([id, widget]) => 
                this.fetchWidgetData(id, widget.config, timeRange)
            );
            
            const results = await Promise.all(promises);
            
            // Update widgets with new data
            results.forEach((data, index) => {
                const [id, widget] = Array.from(this.widgets.entries())[index];
                widget.updateData(data);
            });
            
        } catch (error) {
            console.error('Failed to refresh dashboard data:', error);
        }
    }

    async fetchWidgetData(widgetId, config, timeRange) {
        // Simulate API calls - replace with actual endpoint calls
        switch (widgetId) {
            case 'realtime':
                return await this.fetchRealtimeUsers();
            case 'pageviews':
                return await this.fetchPageViews(timeRange);
            case 'toppages':
                return await this.fetchTopPages(timeRange);
            case 'engagement':
                return await this.fetchEngagementMetrics(timeRange);
            case 'performance':
                return await this.fetchPerformanceMetrics(timeRange);
            case 'funnel':
                return await this.fetchFunnelData(timeRange);
            default:
                return {};
        }
    }

    async fetchRealtimeUsers() {
        // Mock real-time user count
        return {
            current: Math.floor(Math.random() * 100) + 10,
            change: Math.floor(Math.random() * 20) - 10
        };
    }

    async fetchPageViews(timeRange) {
        // Mock page view data
        const dataPoints = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : 30;
        const data = [];
        
        for (let i = 0; i < dataPoints; i++) {
            data.push({
                timestamp: Date.now() - (dataPoints - i) * (timeRange === '1h' ? 300000 : 3600000),
                views: Math.floor(Math.random() * 1000) + 100
            });
        }
        
        return data;
    }

    async fetchTopPages(timeRange) {
        return [
            { page: '/home', views: 1234, percentage: 25.6 },
            { page: '/products', views: 987, percentage: 20.4 },
            { page: '/about', views: 654, percentage: 13.5 },
            { page: '/contact', views: 432, percentage: 8.9 },
            { page: '/blog', views: 321, percentage: 6.6 }
        ];
    }

    async fetchEngagementMetrics(timeRange) {
        return {
            score: 75,
            avgSessionDuration: 180,
            bounceRate: 35,
            pagesPerSession: 2.4
        };
    }

    async fetchPerformanceMetrics(timeRange) {
        return {
            lcp: 2.1,
            fid: 45,
            cls: 0.08,
            ttfb: 150
        };
    }

    async fetchFunnelData(timeRange) {
        return {
            steps: ['Landing', 'Product', 'Cart', 'Checkout', 'Purchase'],
            data: [10000, 7500, 4200, 2100, 1680],
            conversions: [100, 75, 56, 50, 80]
        };
    }

    setupRefreshTimer() {
        if (this.options.showRealTime && this.options.refreshInterval > 0) {
            this.refreshTimer = setInterval(() => {
                this.refreshData();
            }, this.options.refreshInterval);
        }
    }

    destroy() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        this.widgets.forEach(widget => widget.destroy());
        this.widgets.clear();
    }
}

// Individual Widget Class
class AnalyticsWidget {
    constructor(id, config) {
        this.id = id;
        this.config = config;
        this.element = this.createElement();
        this.chartInstance = null;
    }

    createElement() {
        const widget = document.createElement('div');
        widget.className = `analytics-widget widget-${this.config.type}`;
        widget.style.gridRow = this.config.position.row;
        widget.style.gridColumn = `${this.config.position.col} / span ${this.config.position.colspan || 1}`;
        
        widget.innerHTML = `
            <div class="widget-header">
                <h3>${this.config.title}</h3>
                <div class="widget-actions">
                    <button class="widget-menu-btn">⋮</button>
                </div>
            </div>
            <div class="widget-content" id="widget-${this.id}">
                <div class="widget-loading">Loading...</div>
            </div>
        `;
        
        return widget;
    }

    updateData(data) {
        const content = this.element.querySelector('.widget-content');
        
        switch (this.config.type) {
            case 'metric':
                this.renderMetric(content, data);
                break;
            case 'chart':
                this.renderChart(content, data);
                break;
            case 'table':
                this.renderTable(content, data);
                break;
            case 'gauge':
                this.renderGauge(content, data);
                break;
            case 'metrics-grid':
                this.renderMetricsGrid(content, data);
                break;
            case 'funnel':
                this.renderFunnel(content, data);
                break;
        }
    }

    renderMetric(container, data) {
        const changeClass = data.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = data.change >= 0 ? '+' : '';
        
        container.innerHTML = `
            <div class="metric-value">${data.current}</div>
            <div class="metric-change ${changeClass}">${changeSymbol}${data.change}</div>
        `;
    }

    renderChart(container, data) {
        container.innerHTML = '<canvas id="chart-' + this.id + '"></canvas>';
        
        const canvas = container.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        
        // Simple line chart implementation
        this.drawLineChart(ctx, data);
    }

    drawLineChart(ctx, data) {
        const canvas = ctx.canvas;
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight;
        
        ctx.clearRect(0, 0, width, height);
        
        if (!data || data.length === 0) return;
        
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        
        const maxValue = Math.max(...data.map(d => d.views));
        const minValue = Math.min(...data.map(d => d.views));
        const valueRange = maxValue - minValue;
        
        // Draw axes
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // Draw data line
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = height - padding - ((point.views - minValue) / valueRange) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw data points
        ctx.fillStyle = '#2196F3';
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = height - padding - ((point.views - minValue) / valueRange) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    renderTable(container, data) {
        const tableHTML = `
            <table class="analytics-table">
                <thead>
                    <tr>
                        <th>Page</th>
                        <th>Views</th>
                        <th>%</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(row => `
                        <tr>
                            <td>${row.page}</td>
                            <td>${row.views.toLocaleString()}</td>
                            <td>${row.percentage}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
    }

    renderGauge(container, data) {
        container.innerHTML = `
            <div class="gauge-container">
                <svg class="gauge-svg" viewBox="0 0 200 120">
                    <path class="gauge-background" d="M 20 100 A 80 80 0 0 1 180 100" 
                          fill="none" stroke="#e0e0e0" stroke-width="8"/>
                    <path class="gauge-foreground" d="M 20 100 A 80 80 0 0 1 ${20 + (data.score / 100) * 160} ${100 - Math.sin(Math.PI * data.score / 100) * 80}" 
                          fill="none" stroke="#4CAF50" stroke-width="8"/>
                    <text x="100" y="90" text-anchor="middle" class="gauge-value">${data.score}</text>
                    <text x="100" y="110" text-anchor="middle" class="gauge-label">Engagement Score</text>
                </svg>
                <div class="gauge-metrics">
                    <div>Avg. Session: ${data.avgSessionDuration}s</div>
                    <div>Bounce Rate: ${data.bounceRate}%</div>
                    <div>Pages/Session: ${data.pagesPerSession}</div>
                </div>
            </div>
        `;
    }

    renderMetricsGrid(container, data) {
        container.innerHTML = `
            <div class="metrics-grid">
                <div class="metric-item">
                    <div class="metric-label">LCP</div>
                    <div class="metric-value ${data.lcp < 2.5 ? 'good' : data.lcp < 4 ? 'needs-improvement' : 'poor'}">${data.lcp}s</div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">FID</div>
                    <div class="metric-value ${data.fid < 100 ? 'good' : data.fid < 300 ? 'needs-improvement' : 'poor'}">${data.fid}ms</div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">CLS</div>
                    <div class="metric-value ${data.cls < 0.1 ? 'good' : data.cls < 0.25 ? 'needs-improvement' : 'poor'}">${data.cls}</div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">TTFB</div>
                    <div class="metric-value ${data.ttfb < 200 ? 'good' : data.ttfb < 500 ? 'needs-improvement' : 'poor'}">${data.ttfb}ms</div>
                </div>
            </div>
        `;
    }

    renderFunnel(container, data) {
        const funnelHTML = `
            <div class="funnel-container">
                <div class="funnel-steps">
                    ${data.steps.map((step, index) => `
                        <div class="funnel-step">
                            <div class="funnel-step-bar" style="width: ${(data.data[index] / data.data[0]) * 100}%">
                                <span class="funnel-step-label">${step}</span>
                                <span class="funnel-step-value">${data.data[index].toLocaleString()}</span>
                                ${index > 0 ? `<span class="funnel-step-conversion">${data.conversions[index]}%</span>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = funnelHTML;
    }

    destroy() {
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
        this.element.remove();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnalyticsDashboard, AnalyticsWidget };
}