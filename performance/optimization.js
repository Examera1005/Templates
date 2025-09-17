// Performance Optimization Tools and Utilities
class PerformanceOptimizer {
    constructor() {
        this.metrics = new Map();
        this.observers = new Map();
        this.init();
    }

    init() {
        this.setupPerformanceObservers();
        this.monitorLongTasks();
        this.trackMemoryUsage();
    }

    // Performance observers setup
    setupPerformanceObservers() {
        if (!('PerformanceObserver' in window)) return;

        // Navigation timing
        const navObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                this.processNavigationEntry(entry);
            });
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navObserver);

        // Resource timing
        const resourceObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                this.processResourceEntry(entry);
            });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);

        // Measure timing
        const measureObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                this.processMeasureEntry(entry);
            });
        });
        measureObserver.observe({ entryTypes: ['measure'] });
        this.observers.set('measure', measureObserver);
    }

    processNavigationEntry(entry) {
        const navigation = {
            dns: entry.domainLookupEnd - entry.domainLookupStart,
            connect: entry.connectEnd - entry.connectStart,
            ssl: entry.connectEnd - entry.secureConnectionStart,
            ttfb: entry.responseStart - entry.requestStart,
            download: entry.responseEnd - entry.responseStart,
            domLoad: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            windowLoad: entry.loadEventEnd - entry.loadEventStart,
            total: entry.loadEventEnd - entry.fetchStart
        };

        this.metrics.set('navigation', navigation);
        this.analyzeNavigationPerformance(navigation);
    }

    processResourceEntry(entry) {
        const resource = {
            name: entry.name,
            type: entry.initiatorType,
            size: entry.transferSize,
            duration: entry.duration,
            dns: entry.domainLookupEnd - entry.domainLookupStart,
            connect: entry.connectEnd - entry.connectStart,
            ssl: entry.connectEnd - entry.secureConnectionStart,
            ttfb: entry.responseStart - entry.requestStart,
            download: entry.responseEnd - entry.responseStart
        };

        const resources = this.metrics.get('resources') || [];
        resources.push(resource);
        this.metrics.set('resources', resources);

        this.analyzeResourcePerformance(resource);
    }

    processMeasureEntry(entry) {
        const measures = this.metrics.get('measures') || [];
        measures.push({
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime
        });
        this.metrics.set('measures', measures);
    }

    // Long task monitoring
    monitorLongTasks() {
        if (!('PerformanceObserver' in window)) return;

        const longTaskObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                this.processLongTask(entry);
            });
        });

        try {
            longTaskObserver.observe({ entryTypes: ['longtask'] });
            this.observers.set('longtask', longTaskObserver);
        } catch (e) {
            // Long task API not supported
        }
    }

    processLongTask(entry) {
        const longTasks = this.metrics.get('longTasks') || [];
        longTasks.push({
            startTime: entry.startTime,
            duration: entry.duration,
            attribution: entry.attribution
        });
        this.metrics.set('longTasks', longTasks);

        // Alert for long tasks over 100ms
        if (entry.duration > 100) {
            console.warn(`Long task detected: ${entry.duration}ms`);
        }
    }

    // Memory usage tracking
    trackMemoryUsage() {
        if ('memory' in performance) {
            const memory = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
            this.metrics.set('memory', memory);
        }
    }

    // Performance analysis
    analyzeNavigationPerformance(navigation) {
        const issues = [];

        if (navigation.dns > 100) {
            issues.push('Slow DNS lookup detected');
        }

        if (navigation.connect > 300) {
            issues.push('Slow connection detected');
        }

        if (navigation.ttfb > 600) {
            issues.push('Slow server response detected');
        }

        if (navigation.domLoad > 2000) {
            issues.push('Slow DOM processing detected');
        }

        if (issues.length > 0) {
            this.metrics.set('navigationIssues', issues);
        }
    }

    analyzeResourcePerformance(resource) {
        const issues = this.metrics.get('resourceIssues') || [];

        if (resource.size > 500000) { // 500KB
            issues.push(`Large resource detected: ${resource.name} (${resource.size} bytes)`);
        }

        if (resource.duration > 1000) {
            issues.push(`Slow resource load: ${resource.name} (${resource.duration}ms)`);
        }

        if (resource.ttfb > 500) {
            issues.push(`Slow server response for: ${resource.name}`);
        }

        this.metrics.set('resourceIssues', issues);
    }

    // Performance measurement helpers
    startMeasure(name) {
        performance.mark(`${name}-start`);
    }

    endMeasure(name) {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
    }

    // Bundle analysis
    analyzeBundleSize() {
        const resources = this.metrics.get('resources') || [];
        const scripts = resources.filter(r => r.type === 'script');
        const styles = resources.filter(r => r.type === 'link' || r.name.includes('.css'));
        
        const analysis = {
            totalScriptSize: scripts.reduce((sum, s) => sum + s.size, 0),
            totalStyleSize: styles.reduce((sum, s) => sum + s.size, 0),
            scriptCount: scripts.length,
            styleCount: styles.length,
            largestScript: scripts.sort((a, b) => b.size - a.size)[0],
            largestStyle: styles.sort((a, b) => b.size - a.size)[0]
        };

        this.metrics.set('bundleAnalysis', analysis);
        return analysis;
    }

    // Generate performance report
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            navigation: this.metrics.get('navigation'),
            resources: this.metrics.get('resources'),
            longTasks: this.metrics.get('longTasks'),
            memory: this.metrics.get('memory'),
            issues: {
                navigation: this.metrics.get('navigationIssues') || [],
                resource: this.metrics.get('resourceIssues') || []
            },
            bundle: this.analyzeBundleSize(),
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        const navigation = this.metrics.get('navigation');
        const bundleAnalysis = this.metrics.get('bundleAnalysis');
        const longTasks = this.metrics.get('longTasks') || [];

        if (navigation) {
            if (navigation.dns > 100) {
                recommendations.push('Consider using DNS prefetch for external domains');
            }
            if (navigation.ttfb > 600) {
                recommendations.push('Optimize server response time');
            }
            if (navigation.domLoad > 2000) {
                recommendations.push('Optimize JavaScript execution and DOM manipulation');
            }
        }

        if (bundleAnalysis) {
            if (bundleAnalysis.totalScriptSize > 1000000) { // 1MB
                recommendations.push('Consider code splitting to reduce bundle size');
            }
            if (bundleAnalysis.scriptCount > 10) {
                recommendations.push('Consider bundling scripts to reduce HTTP requests');
            }
        }

        if (longTasks.length > 0) {
            recommendations.push('Break up long-running JavaScript tasks');
        }

        return recommendations;
    }

    // Cleanup
    destroy() {
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers.clear();
        this.metrics.clear();
    }
}

// Resource prioritization utilities
class ResourcePrioritizer {
    static critical = [];
    static important = [];
    static lazy = [];

    static addCritical(resources) {
        this.critical.push(...resources);
        this.preloadCritical();
    }

    static addImportant(resources) {
        this.important.push(...resources);
    }

    static addLazy(resources) {
        this.lazy.push(...resources);
    }

    static preloadCritical() {
        this.critical.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            
            if (resource.endsWith('.css')) {
                link.as = 'style';
            } else if (resource.endsWith('.js')) {
                link.as = 'script';
            } else if (resource.match(/\.(jpg|jpeg|png|webp|avif)$/)) {
                link.as = 'image';
            } else if (resource.match(/\.(woff|woff2|ttf|otf)$/)) {
                link.as = 'font';
                link.crossOrigin = 'anonymous';
            }
            
            link.href = resource;
            document.head.appendChild(link);
        });
    }

    static loadImportant() {
        this.important.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = resource;
            document.head.appendChild(link);
        });
    }
}

// Web Workers for heavy computations
class WorkerManager {
    constructor() {
        this.workers = new Map();
        this.taskQueue = [];
        this.isProcessing = false;
    }

    createWorker(name, script) {
        if (typeof script === 'function') {
            // Create worker from function
            const blob = new Blob([`(${script.toString()})()`], {
                type: 'application/javascript'
            });
            const worker = new Worker(URL.createObjectURL(blob));
            this.workers.set(name, worker);
            return worker;
        } else {
            // Create worker from script URL
            const worker = new Worker(script);
            this.workers.set(name, worker);
            return worker;
        }
    }

    async runTask(workerName, data, timeout = 30000) {
        return new Promise((resolve, reject) => {
            const worker = this.workers.get(workerName);
            if (!worker) {
                reject(new Error(`Worker ${workerName} not found`));
                return;
            }

            const timeoutId = setTimeout(() => {
                reject(new Error('Worker task timeout'));
            }, timeout);

            const messageHandler = (event) => {
                clearTimeout(timeoutId);
                worker.removeEventListener('message', messageHandler);
                resolve(event.data);
            };

            const errorHandler = (error) => {
                clearTimeout(timeoutId);
                worker.removeEventListener('error', errorHandler);
                reject(error);
            };

            worker.addEventListener('message', messageHandler);
            worker.addEventListener('error', errorHandler);
            worker.postMessage(data);
        });
    }

    terminateWorker(name) {
        const worker = this.workers.get(name);
        if (worker) {
            worker.terminate();
            this.workers.delete(name);
        }
    }

    terminateAll() {
        this.workers.forEach((worker, name) => {
            worker.terminate();
        });
        this.workers.clear();
    }
}

// Frame rate monitor
class FrameRateMonitor {
    constructor(callback) {
        this.callback = callback;
        this.frames = [];
        this.lastTime = performance.now();
        this.isRunning = false;
    }

    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.frames = [];
        this.tick();
    }

    stop() {
        this.isRunning = false;
    }

    tick() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const delta = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.frames.push(delta);
        
        // Keep only last 60 frames (1 second at 60fps)
        if (this.frames.length > 60) {
            this.frames.shift();
        }

        const fps = 1000 / (this.frames.reduce((sum, frame) => sum + frame, 0) / this.frames.length);
        
        if (this.callback) {
            this.callback(fps);
        }

        requestAnimationFrame(() => this.tick());
    }

    getAverageFPS() {
        if (this.frames.length === 0) return 0;
        const avgFrameTime = this.frames.reduce((sum, frame) => sum + frame, 0) / this.frames.length;
        return 1000 / avgFrameTime;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PerformanceOptimizer,
        ResourcePrioritizer,
        WorkerManager,
        FrameRateMonitor
    };
}