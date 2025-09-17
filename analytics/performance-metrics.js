// Performance Metrics Collector
class PerformanceMetrics {
    constructor(options = {}) {
        this.options = {
            collectCoreWebVitals: true,
            collectResourceTiming: true,
            collectUserTiming: true,
            collectLongTasks: true,
            sampleRate: 1.0, // Collect 100% by default
            endpoint: '/api/performance',
            bufferSize: 50,
            ...options
        };
        
        this.metrics = new Map();
        this.buffer = [];
        this.observers = new Map();
        
        this.init();
    }

    init() {
        if (Math.random() > this.options.sampleRate) {
            return; // Skip collection based on sample rate
        }

        this.setupPerformanceObservers();
        this.collectInitialMetrics();
        this.startPeriodicCollection();
    }

    // Core Web Vitals Collection
    setupPerformanceObservers() {
        if (!('PerformanceObserver' in window)) return;

        // Largest Contentful Paint (LCP)
        if (this.options.collectCoreWebVitals) {
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.recordMetric('lcp', lastEntry.startTime, {
                        element: lastEntry.element?.tagName,
                        url: lastEntry.url
                    });
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                this.observers.set('lcp', lcpObserver);
            } catch (e) {
                console.warn('LCP observer not supported');
            }

            // First Input Delay (FID)
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        this.recordMetric('fid', entry.processingStart - entry.startTime, {
                            eventType: entry.name,
                            target: entry.target?.tagName
                        });
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
                this.observers.set('fid', fidObserver);
            } catch (e) {
                console.warn('FID observer not supported');
            }

            // Cumulative Layout Shift (CLS)
            try {
                let clsValue = 0;
                const clsObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                            this.recordMetric('cls', clsValue, {
                                sources: entry.sources?.map(source => ({
                                    element: source.node?.tagName,
                                    previousRect: source.previousRect,
                                    currentRect: source.currentRect
                                }))
                            });
                        }
                    });
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
                this.observers.set('cls', clsObserver);
            } catch (e) {
                console.warn('CLS observer not supported');
            }
        }

        // Resource Timing
        if (this.options.collectResourceTiming) {
            try {
                const resourceObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        this.recordResourceMetric(entry);
                    });
                });
                resourceObserver.observe({ entryTypes: ['resource'] });
                this.observers.set('resource', resourceObserver);
            } catch (e) {
                console.warn('Resource timing observer not supported');
            }
        }

        // User Timing
        if (this.options.collectUserTiming) {
            try {
                const userTimingObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        this.recordMetric(`user_${entry.entryType}`, entry.duration || entry.startTime, {
                            name: entry.name,
                            detail: entry.detail
                        });
                    });
                });
                userTimingObserver.observe({ entryTypes: ['mark', 'measure'] });
                this.observers.set('userTiming', userTimingObserver);
            } catch (e) {
                console.warn('User timing observer not supported');
            }
        }

        // Long Tasks
        if (this.options.collectLongTasks) {
            try {
                const longTaskObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        this.recordMetric('long_task', entry.duration, {
                            startTime: entry.startTime,
                            attribution: entry.attribution?.map(attr => ({
                                name: attr.name,
                                entryType: attr.entryType,
                                startTime: attr.startTime,
                                duration: attr.duration
                            }))
                        });
                    });
                });
                longTaskObserver.observe({ entryTypes: ['longtask'] });
                this.observers.set('longTask', longTaskObserver);
            } catch (e) {
                console.warn('Long task observer not supported');
            }
        }
    }

    // Initial metrics collection
    collectInitialMetrics() {
        // Navigation timing
        if ('performance' in window && performance.getEntriesByType) {
            const navTiming = performance.getEntriesByType('navigation')[0];
            if (navTiming) {
                this.recordNavigationMetrics(navTiming);
            }
        }

        // Memory usage (if available)
        if (performance.memory) {
            this.recordMetric('memory_used', performance.memory.usedJSHeapSize / 1048576, {
                unit: 'MB',
                total: performance.memory.totalJSHeapSize / 1048576,
                limit: performance.memory.jsHeapSizeLimit / 1048576
            });
        }

        // Connection information
        if (navigator.connection) {
            this.recordMetric('connection_type', 0, {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            });
        }
    }

    recordNavigationMetrics(navTiming) {
        const metrics = {
            dns_lookup: navTiming.domainLookupEnd - navTiming.domainLookupStart,
            tcp_connect: navTiming.connectEnd - navTiming.connectStart,
            ssl_negotiation: navTiming.connectEnd - navTiming.secureConnectionStart,
            ttfb: navTiming.responseStart - navTiming.requestStart,
            response_time: navTiming.responseEnd - navTiming.responseStart,
            dom_processing: navTiming.domComplete - navTiming.domLoading,
            load_complete: navTiming.loadEventEnd - navTiming.navigationStart
        };

        Object.entries(metrics).forEach(([name, value]) => {
            if (value >= 0) {
                this.recordMetric(`nav_${name}`, value);
            }
        });
    }

    recordResourceMetric(entry) {
        const resourceMetric = {
            name: 'resource_timing',
            value: entry.duration,
            metadata: {
                url: entry.name,
                type: entry.initiatorType,
                size: entry.transferSize,
                encodedBodySize: entry.encodedBodySize,
                decodedBodySize: entry.decodedBodySize,
                dns: entry.domainLookupEnd - entry.domainLookupStart,
                connect: entry.connectEnd - entry.connectStart,
                ttfb: entry.responseStart - entry.requestStart,
                download: entry.responseEnd - entry.responseStart
            }
        };

        this.addToBuffer(resourceMetric);
    }

    // Custom metrics
    recordMetric(name, value, metadata = {}) {
        const metric = {
            name: name,
            value: value,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            metadata: metadata
        };

        this.addToBuffer(metric);
    }

    // Real User Monitoring (RUM)
    startRUM() {
        // Track page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.collectPageLoadMetrics();
            }, 0);
        });

        // Track runtime performance
        this.trackRuntimePerformance();

        // Track error rates
        this.trackErrorMetrics();
    }

    collectPageLoadMetrics() {
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach(entry => {
            this.recordMetric(`paint_${entry.name.replace('-', '_')}`, entry.startTime);
        });

        // Time to Interactive (TTI) approximation
        const tti = this.estimateTimeToInteractive();
        if (tti) {
            this.recordMetric('tti', tti);
        }
    }

    estimateTimeToInteractive() {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (!navigation) return null;

        // Simplified TTI calculation
        const domContentLoaded = navigation.domContentLoadedEventEnd;
        const longTasks = performance.getEntriesByType('longtask');
        
        // Find the last long task before network quiet
        let lastLongTask = 0;
        longTasks.forEach(task => {
            if (task.startTime > domContentLoaded) {
                lastLongTask = Math.max(lastLongTask, task.startTime + task.duration);
            }
        });

        return Math.max(domContentLoaded, lastLongTask);
    }

    trackRuntimePerformance() {
        // Frame rate monitoring
        let frameCount = 0;
        let lastTime = performance.now();

        const countFrames = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                this.recordMetric('fps', frameCount, {
                    measurement_window: currentTime - lastTime
                });
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(countFrames);
        };
        
        requestAnimationFrame(countFrames);

        // Memory pressure monitoring
        if (performance.memory) {
            setInterval(() => {
                const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
                if (memoryUsage > 0.8) {
                    this.recordMetric('memory_pressure', memoryUsage, {
                        threshold: 'high'
                    });
                }
            }, 30000);
        }
    }

    trackErrorMetrics() {
        let errorCount = 0;
        let lastErrorTime = 0;

        window.addEventListener('error', (event) => {
            errorCount++;
            const now = Date.now();
            
            this.recordMetric('js_error', 1, {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error_rate: errorCount / ((now - lastErrorTime) / 1000)
            });
            
            lastErrorTime = now;
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.recordMetric('promise_rejection', 1, {
                reason: event.reason?.toString(),
                stack: event.reason?.stack
            });
        });
    }

    // Periodic collection
    startPeriodicCollection() {
        setInterval(() => {
            this.collectPeriodicMetrics();
            this.flush();
        }, 30000); // Every 30 seconds

        // Flush on page unload
        window.addEventListener('beforeunload', () => {
            this.flush();
        });
    }

    collectPeriodicMetrics() {
        // Collect current performance state
        if (performance.memory) {
            this.recordMetric('memory_periodic', performance.memory.usedJSHeapSize / 1048576, {
                unit: 'MB',
                type: 'periodic'
            });
        }

        // Collect long task summary
        const longTasks = performance.getEntriesByType('longtask');
        if (longTasks.length > 0) {
            const totalLongTaskTime = longTasks.reduce((sum, task) => sum + task.duration, 0);
            this.recordMetric('long_task_summary', totalLongTaskTime, {
                count: longTasks.length,
                type: 'periodic'
            });
        }
    }

    // Buffer management
    addToBuffer(metric) {
        this.buffer.push(metric);
        
        if (this.buffer.length >= this.options.bufferSize) {
            this.flush();
        }
    }

    flush() {
        if (this.buffer.length === 0) return;

        const metrics = [...this.buffer];
        this.buffer = [];

        this.sendMetrics(metrics);
    }

    async sendMetrics(metrics) {
        try {
            const response = await fetch(this.options.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    metrics: metrics,
                    metadata: {
                        timestamp: Date.now(),
                        sessionId: this.getSessionId(),
                        userId: this.getUserId()
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Performance metrics request failed: ${response.status}`);
            }
        } catch (error) {
            // Re-add metrics to buffer on failure
            this.buffer.unshift(...metrics);
            console.error('Failed to send performance metrics:', error);
        }
    }

    // Utilities
    getSessionId() {
        return sessionStorage.getItem('sessionId') || 'unknown';
    }

    getUserId() {
        return localStorage.getItem('userId') || null;
    }

    // Custom timing API
    markStart(name) {
        performance.mark(`${name}-start`);
    }

    markEnd(name) {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        
        const measure = performance.getEntriesByName(name, 'measure')[0];
        if (measure) {
            this.recordMetric(`custom_${name}`, measure.duration, {
                type: 'custom_timing'
            });
        }
    }

    // Resource monitoring
    monitorResource(url, type = 'fetch') {
        const startTime = performance.now();
        
        return {
            end: (success = true, size = 0) => {
                const duration = performance.now() - startTime;
                this.recordMetric(`resource_${type}`, duration, {
                    url: url,
                    success: success,
                    size: size
                });
            }
        };
    }

    // Cleanup
    destroy() {
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers.clear();
        
        // Final flush
        this.flush();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceMetrics };
}