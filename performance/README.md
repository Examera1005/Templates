# Performance Templates

A comprehensive collection of performance optimization tools and utilities for web applications, focusing on loading speed, caching strategies, and runtime performance monitoring.

## Overview

This performance library provides battle-tested solutions for common web performance challenges:
- **Lazy Loading**: Efficient resource loading on demand
- **Caching**: Multiple caching strategies for different scenarios  
- **Performance Monitoring**: Real-time performance tracking and analysis
- **Optimization Tools**: Bundle analysis, resource prioritization, and more

## Modules

### 1. Lazy Loading (`lazy-loading.js`)

#### LazyLoader Class
Advanced intersection observer-based lazy loading:

```javascript
const loader = new LazyLoader({
    rootMargin: '50px',
    threshold: 0.1
});

// Auto-observe elements with data-lazy attribute
loader.observeAll();

// Manual observation
loader.observe(element);
```

**Supported lazy load types:**
- **Images**: `data-lazy-type="image"` with `data-src` and `data-srcset`
- **Iframes**: `data-lazy-type="iframe"` with `data-src`
- **Components**: `data-lazy-type="component"` with `data-component` URL
- **Scripts**: `data-lazy-type="script"` with `data-script` URL

#### ImageOptimizer Class
Modern image format detection and responsive images:

```javascript
// Get optimal image format (AVIF > WebP > JPEG)
const format = ImageOptimizer.getOptimalFormat();

// Create responsive picture element
const picture = ImageOptimizer.createPictureElement('hero', [480, 768, 1200], 'Hero image');

// Preload critical images
ImageOptimizer.preloadCriticalImages(['hero.webp', 'logo.svg']);
```

#### CodeSplitter Class
Dynamic module loading and route-based code splitting:

```javascript
// Load module dynamically
const module = await CodeSplitter.loadModule('./components/Chart.js');

// Load component into container
await CodeSplitter.loadComponent('./LazyModal.js', 'modal-container');

// Create lazy route
const route = CodeSplitter.createLazyRoute('/dashboard', './Dashboard.js');
```

#### ResourceHints Class
Intelligent resource preloading and prefetching:

```javascript
// Preload critical resources
ResourceHints.preloadResource('/api/data.json', 'fetch');
ResourceHints.preloadResource('/fonts/main.woff2', 'font');

// Setup intelligent prefetching on hover
ResourceHints.setupIntelligentPrefetch();

// Preconnect to external domains
ResourceHints.preconnect('https://api.example.com');
```

#### PerformanceMonitor Class
Core Web Vitals and comprehensive performance tracking:

```javascript
const monitor = new PerformanceMonitor();

// Measure Core Web Vitals
monitor.measureCoreWebVitals();

// Track resource timing
monitor.measureResourceTiming();

// Custom measurements
monitor.mark('component-start');
// ... component rendering
monitor.measure('component-render', 'component-start', 'component-end');

// Get all metrics
const metrics = monitor.getMetrics();
```

### 2. Caching (`caching.js`)

#### CacheManager Class
Unified caching interface with multiple storage backends:

```javascript
// Memory cache (default)
const cache = new CacheManager();

// LocalStorage cache
const persistentCache = new CacheManager({
    storage: 'localStorage',
    maxSize: 200,
    defaultTTL: 3600000 // 1 hour
});

// Basic operations
cache.set('user:123', userData, 1800000); // 30 minutes
const user = cache.get('user:123');
```

#### HTTPCache Class
HTTP request caching with automatic deduplication:

```javascript
const httpCache = new HTTPCache({
    defaultTTL: 300000, // 5 minutes
    maxSize: 100
});

// Cached fetch with automatic deduplication
const response = await httpCache.fetch('/api/users');

// Invalidate cache by pattern
httpCache.invalidate('/api/users');
```

#### ServiceWorkerCache Class
Service Worker integration for offline caching:

```javascript
const swCache = new ServiceWorkerCache('app-v1');

// Cache-first strategy
const response = await swCache.cacheFirst(request);

// Network-first with fallback
const response = await swCache.networkFirst(request);

// Stale-while-revalidate
const response = await swCache.staleWhileRevalidate(request);
```

#### BrowserCache Class
HTTP cache headers and optimization:

```javascript
// Set appropriate cache headers
BrowserCache.setCacheForever(response); // For immutable assets
BrowserCache.setNoCache(response); // For dynamic content
BrowserCache.setShortCache(response, 300); // 5 minutes

// Generate ETags
const etag = BrowserCache.generateETag(content);
BrowserCache.setETag(response, etag);
```

### 3. Optimization (`optimization.js`)

#### PerformanceOptimizer Class
Comprehensive performance analysis and monitoring:

```javascript
const optimizer = new PerformanceOptimizer();

// Automatic setup of performance observers
// Monitors navigation, resources, long tasks, memory

// Generate performance report
const report = optimizer.generateReport();
console.log(report.recommendations);

// Manual measurements
optimizer.startMeasure('data-processing');
// ... heavy computation
optimizer.endMeasure('data-processing');
```

#### ResourcePrioritizer Class
Smart resource loading prioritization:

```javascript
// Critical resources (preloaded immediately)
ResourcePrioritizer.addCritical([
    '/css/critical.css',
    '/js/app.js',
    '/fonts/main.woff2'
]);

// Important resources (prefetched)
ResourcePrioritizer.addImportant([
    '/css/non-critical.css',
    '/js/analytics.js'
]);

// Lazy resources (loaded on demand)
ResourcePrioritizer.addLazy([
    '/js/chart-library.js',
    '/css/print.css'
]);
```

#### WorkerManager Class
Web Workers for heavy computations:

```javascript
const workerManager = new WorkerManager();

// Create worker from function
workerManager.createWorker('calculator', function() {
    self.onmessage = function(e) {
        const result = heavyCalculation(e.data);
        self.postMessage(result);
    };
});

// Run task in worker
const result = await workerManager.runTask('calculator', inputData);
```

#### FrameRateMonitor Class
Real-time FPS monitoring:

```javascript
const fpsMonitor = new FrameRateMonitor((fps) => {
    if (fps < 30) {
        console.warn('Low frame rate detected:', fps);
    }
});

fpsMonitor.start();
```

## Usage Examples

### Basic Performance Setup

```javascript
// Initialize core performance tools
const optimizer = new PerformanceOptimizer();
const cache = new CacheManager({ storage: 'localStorage' });
const loader = new LazyLoader();

// Setup lazy loading
loader.observeAll('[data-lazy]');

// Setup intelligent prefetching
ResourceHints.setupIntelligentPrefetch();

// Preload critical resources
ResourcePrioritizer.addCritical([
    '/css/critical.css',
    '/js/app.js'
]);
```

### Image Optimization

```html
<!-- Progressive image with lazy loading -->
<img data-lazy 
     data-src="/images/hero-1200.webp"
     data-srcset="/images/hero-480.webp 480w, /images/hero-768.webp 768w, /images/hero-1200.webp 1200w"
     src="/images/hero-placeholder.jpg"
     alt="Hero image">

<!-- Picture element with format detection -->
<script>
const picture = ImageOptimizer.createPictureElement(
    '/images/hero',
    [480, 768, 1200],
    'Hero image'
);
document.body.appendChild(picture);
</script>
```

### HTTP Caching

```javascript
// Setup HTTP cache for API calls
const apiCache = new HTTPCache({ defaultTTL: 300000 });

// Wrapper for cached API calls
async function cachedFetch(url) {
    return await apiCache.fetch(url);
}

// Use in application
const users = await cachedFetch('/api/users');
const posts = await cachedFetch('/api/posts');
```

### Performance Monitoring

```javascript
// Monitor Core Web Vitals
const monitor = new PerformanceMonitor();
monitor.measureCoreWebVitals();

// Generate and send performance report
setTimeout(() => {
    const report = monitor.generateReport();
    
    // Send to analytics
    fetch('/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
    });
}, 10000); // After 10 seconds
```

### Service Worker Integration

```javascript
// In your service worker
const swCache = new ServiceWorkerCache('app-v1');

self.addEventListener('fetch', event => {
    if (event.request.destination === 'image') {
        event.respondWith(swCache.cacheFirst(event.request));
    } else if (event.request.url.includes('/api/')) {
        event.respondWith(swCache.networkFirst(event.request));
    } else {
        event.respondWith(swCache.staleWhileRevalidate(event.request));
    }
});
```

## Performance Best Practices

### Critical Resource Loading
1. Preload critical resources immediately
2. Use resource hints for external domains
3. Implement intelligent prefetching
4. Optimize font loading with font-display

### Image Optimization
1. Use modern formats (AVIF, WebP) with fallbacks
2. Implement responsive images with proper sizing
3. Lazy load below-the-fold images
4. Use progressive image loading for better UX

### Caching Strategy
1. Cache static assets with long TTLs
2. Use appropriate cache headers
3. Implement service worker caching
4. Cache API responses with reasonable TTLs

### Performance Monitoring
1. Track Core Web Vitals continuously
2. Monitor long tasks and frame rate
3. Analyze bundle sizes and resource timing
4. Set up performance budgets and alerts

## Browser Support

- **Modern browsers**: Full feature support
- **IE11**: Basic functionality with polyfills
- **Service Workers**: Modern browsers only
- **Intersection Observer**: Polyfill available for older browsers

## Integration

```javascript
// ES6 modules
import { LazyLoader, CacheManager } from './performance/index.js';

// CommonJS
const { LazyLoader, CacheManager } = require('./performance');

// Browser globals
const loader = new LazyLoader();
const cache = new CacheManager();
```