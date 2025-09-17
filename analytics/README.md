# Analytics Integration

A comprehensive analytics library providing event tracking, user behavior analysis, performance monitoring, and dashboard visualization for web applications.

## Overview

This analytics library provides complete solutions for understanding user behavior and application performance:
- **Event Tracking**: Comprehensive user interaction tracking with multiple provider support
- **User Analytics**: Deep user behavior analysis, journey tracking, and engagement metrics
- **Performance Metrics**: Real User Monitoring (RUM) with Core Web Vitals collection
- **Dashboard**: Customizable analytics dashboard with real-time visualizations

## Modules

### 1. Event Tracking (`tracking.js`)

#### AnalyticsTracker Class
Comprehensive event tracking with auto-tracking capabilities:

```javascript
const tracker = new AnalyticsTracker({
    debug: true,
    endpoint: '/api/analytics',
    trackPageViews: true,
    trackClicks: true,
    trackFormSubmissions: true,
    trackScrollDepth: true
});

// Track custom events
tracker.track('button_click', {
    buttonText: 'Sign Up',
    location: 'header'
});

// Track conversions
tracker.trackConversion('purchase', 99.99, 'USD', {
    productId: 'prod-123',
    category: 'electronics'
});

// Identify users
tracker.identify('user-456', {
    email: 'user@example.com',
    plan: 'premium'
});
```

#### Provider Integration
Support for multiple analytics providers:

```javascript
// Google Analytics
const gaProvider = new GoogleAnalyticsProvider('GA_TRACKING_ID');
tracker.addProvider('google', gaProvider);

// Facebook Pixel
const fbProvider = new FacebookPixelProvider('PIXEL_ID');
tracker.addProvider('facebook', fbProvider);

// Custom provider
const customProvider = new CustomAnalyticsProvider('/api/custom-analytics');
tracker.addProvider('custom', customProvider);
```

### 2. User Analytics (`user-analytics.js`)

#### UserAnalytics Class
Advanced user behavior tracking and analysis:

```javascript
const userAnalytics = new UserAnalytics({
    trackUserJourney: true,
    trackEngagement: true,
    trackFeatureUsage: true,
    sessionTimeout: 1800000 // 30 minutes
});

// Track user journey steps
userAnalytics.trackJourneyStep('product_page_view', {
    productId: 'prod-123',
    category: 'electronics'
});

// Track feature usage
userAnalytics.trackFeatureUsage('advanced_search', {
    filters: ['price', 'brand'],
    results: 42
});

// Get user insights
const insights = userAnalytics.getUserInsights('user-456');
console.log('Average engagement score:', insights.avgEngagementScore);
```

#### Journey Analysis
Track and analyze user journeys:

```javascript
// Create conversion funnel
const funnel = userAnalytics.createFunnel([
    'landing_page',
    'product_page',
    'add_to_cart',
    'checkout',
    'purchase'
]);

console.log('Conversion rates:', funnel.conversionRates);

// Generate cohort analysis
const cohorts = userAnalytics.generateCohortData('weekly');
cohorts.forEach(cohort => {
    console.log(`Cohort ${cohort.startDate}: ${cohort.users.size} users`);
});
```

### 3. Performance Metrics (`performance-metrics.js`)

#### PerformanceMetrics Class
Real User Monitoring with Core Web Vitals:

```javascript
const performanceMetrics = new PerformanceMetrics({
    collectCoreWebVitals: true,
    collectResourceTiming: true,
    collectLongTasks: true,
    sampleRate: 0.1, // Collect 10% of sessions
    endpoint: '/api/performance'
});

// Custom performance tracking
performanceMetrics.markStart('data_processing');
// ... perform heavy operation
performanceMetrics.markEnd('data_processing');

// Monitor specific resources
const monitor = performanceMetrics.monitorResource('/api/users', 'api');
fetch('/api/users')
    .then(response => {
        monitor.end(response.ok, response.headers.get('content-length'));
    })
    .catch(() => {
        monitor.end(false);
    });
```

#### RUM Integration
Start Real User Monitoring:

```javascript
// Initialize RUM
performanceMetrics.startRUM();

// Metrics are automatically collected for:
// - Core Web Vitals (LCP, FID, CLS)
// - Navigation timing
// - Resource timing
// - Long tasks
// - Memory usage
// - Error rates
```

### 4. Analytics Dashboard (`dashboard.js`)

#### AnalyticsDashboard Class
Customizable real-time analytics dashboard:

```javascript
const dashboard = new AnalyticsDashboard('dashboard-container', {
    refreshInterval: 30000,
    theme: 'light',
    showRealTime: true
});

// Add custom widgets
dashboard.addWidget('custom-metric', {
    title: 'Custom KPI',
    type: 'metric',
    position: { row: 1, col: 1 }
});

// Refresh data manually
dashboard.refreshData();
```

#### Widget Types
Multiple widget types for different visualizations:

- **Metric**: Single number with change indicator
- **Chart**: Line/bar charts for time-series data
- **Table**: Tabular data display
- **Gauge**: Circular progress/score indicators
- **Metrics Grid**: Core Web Vitals display
- **Funnel**: Conversion funnel visualization

## Usage Examples

### Complete Analytics Setup

```javascript
// Initialize all analytics components
const tracker = new AnalyticsTracker({
    endpoint: '/api/analytics',
    enableAutoTracking: true
});

const userAnalytics = new UserAnalytics();
const performanceMetrics = new PerformanceMetrics({
    sampleRate: 0.1
});

// Setup providers
tracker.addProvider('google', new GoogleAnalyticsProvider('GA_ID'));
tracker.addProvider('custom', new CustomAnalyticsProvider('/api/events'));

// Start performance monitoring
performanceMetrics.startRUM();

// Initialize dashboard
const dashboard = new AnalyticsDashboard('analytics-dashboard');
```

### E-commerce Tracking

```javascript
// Product page view
tracker.track('product_view', {
    productId: 'prod-123',
    productName: 'Wireless Headphones',
    category: 'Electronics',
    price: 99.99,
    currency: 'USD'
});

// Add to cart
tracker.track('add_to_cart', {
    productId: 'prod-123',
    quantity: 1,
    value: 99.99
});

// Purchase conversion
tracker.trackConversion('purchase', 99.99, 'USD', {
    orderId: 'order-789',
    productIds: ['prod-123'],
    paymentMethod: 'credit_card'
});

// Track user journey
userAnalytics.trackJourneyStep('checkout_started', {
    cartValue: 99.99,
    itemCount: 1
});
```

### SaaS Application Analytics

```javascript
// Feature usage tracking
userAnalytics.trackFeatureUsage('report_generator', {
    reportType: 'sales',
    dateRange: '30days',
    filters: ['region', 'product']
});

// User engagement tracking
tracker.track('session_start', {
    userTier: 'premium',
    lastLogin: '2024-01-15'
});

// Performance critical path monitoring
performanceMetrics.markStart('dashboard_load');
loadDashboardData().then(() => {
    performanceMetrics.markEnd('dashboard_load');
});
```

### Custom Dashboard Implementation

```html
<!DOCTYPE html>
<html>
<head>
    <title>Analytics Dashboard</title>
    <style>
        .analytics-dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            padding: 20px;
        }
        
        .analytics-widget {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 20px;
        }
        
        .widget-header h3 {
            margin: 0 0 15px 0;
            color: #333;
        }
        
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #2196F3;
        }
        
        .metric-change.positive {
            color: #4CAF50;
        }
        
        .metric-change.negative {
            color: #f44336;
        }
    </style>
</head>
<body>
    <div id="analytics-dashboard"></div>
    
    <script src="analytics/dashboard.js"></script>
    <script>
        const dashboard = new AnalyticsDashboard('analytics-dashboard', {
            refreshInterval: 10000,
            theme: 'light'
        });
    </script>
</body>
</html>
```

### Server-Side Analytics Endpoint

```javascript
// Express.js analytics endpoint
app.post('/api/analytics', (req, res) => {
    const { events } = req.body;
    
    events.forEach(event => {
        // Process and store analytics events
        console.log('Analytics Event:', {
            name: event.eventName,
            properties: event.properties,
            timestamp: new Date(event.properties.timestamp)
        });
        
        // Store in database
        // sendToAnalyticsService(event);
    });
    
    res.json({ success: true, processed: events.length });
});

// Performance metrics endpoint
app.post('/api/performance', (req, res) => {
    const { metrics, metadata } = req.body;
    
    metrics.forEach(metric => {
        // Process performance metrics
        console.log('Performance Metric:', {
            name: metric.name,
            value: metric.value,
            metadata: metric.metadata
        });
        
        // Store for performance monitoring
        // storePerformanceMetric(metric);
    });
    
    res.json({ success: true, processed: metrics.length });
});
```

## Data Privacy Considerations

### GDPR Compliance
- Implement consent management for tracking
- Provide data export and deletion capabilities
- Anonymize or pseudonymize personal data

### Data Minimization
- Collect only necessary analytics data
- Implement data retention policies
- Use sampling for performance metrics

### User Control
```javascript
// Consent management example
const tracker = new AnalyticsTracker({
    enableAutoTracking: false // Start disabled
});

// Enable tracking after consent
function enableAnalytics() {
    tracker.options.enableAutoTracking = true;
    tracker.setupAutoTracking();
}

// Disable tracking
function disableAnalytics() {
    tracker.options.enableAutoTracking = false;
    // Clear stored data
    localStorage.removeItem('analytics_session');
}
```

## Performance Considerations

### Sampling
Use sampling to reduce performance impact:

```javascript
const performanceMetrics = new PerformanceMetrics({
    sampleRate: 0.1, // 10% sampling
    bufferSize: 50,
    flushInterval: 30000
});
```

### Batching
Events are automatically batched and sent periodically:

```javascript
const tracker = new AnalyticsTracker({
    bufferSize: 100, // Send after 100 events
    flushInterval: 5000 // Or every 5 seconds
});
```

### Resource Loading
Load analytics scripts asynchronously:

```javascript
// Lazy load analytics
import('./analytics/tracking.js').then(({ AnalyticsTracker }) => {
    const tracker = new AnalyticsTracker();
});
```

## Browser Support

- **Modern browsers**: Full feature support
- **IE11**: Basic functionality with polyfills
- **Mobile browsers**: Optimized for mobile performance
- **Offline support**: Events queued when offline

## Integration

```javascript
// ES6 modules
import { AnalyticsTracker, UserAnalytics } from './analytics/index.js';

// CommonJS
const { AnalyticsTracker } = require('./analytics');

// Browser globals
const tracker = new window.AnalyticsTracker();
```