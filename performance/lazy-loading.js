// Lazy Loading Utilities
class LazyLoader {
    constructor(options = {}) {
        this.options = {
            rootMargin: '50px',
            threshold: 0.1,
            ...options
        };
        
        this.observer = null;
        this.loadedElements = new Set();
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                this.handleIntersection.bind(this),
                this.options
            );
        }
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadElement(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }

    loadElement(element) {
        if (this.loadedElements.has(element)) return;

        const loadType = element.dataset.lazyType || 'image';
        
        switch (loadType) {
            case 'image':
                this.loadImage(element);
                break;
            case 'iframe':
                this.loadIframe(element);
                break;
            case 'component':
                this.loadComponent(element);
                break;
            case 'script':
                this.loadScript(element);
                break;
        }

        this.loadedElements.add(element);
        element.classList.add('lazy-loaded');
        element.dispatchEvent(new CustomEvent('lazyloaded'));
    }

    loadImage(img) {
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;
        
        if (src) {
            img.src = src;
        }
        if (srcset) {
            img.srcset = srcset;
        }
        
        img.onload = () => {
            img.classList.add('loaded');
        };
    }

    loadIframe(iframe) {
        const src = iframe.dataset.src;
        if (src) {
            iframe.src = src;
        }
    }

    loadComponent(element) {
        const componentUrl = element.dataset.component;
        if (componentUrl) {
            fetch(componentUrl)
                .then(response => response.text())
                .then(html => {
                    element.innerHTML = html;
                });
        }
    }

    loadScript(element) {
        const scriptUrl = element.dataset.script;
        if (scriptUrl) {
            const script = document.createElement('script');
            script.src = scriptUrl;
            script.onload = () => {
                element.classList.add('script-loaded');
            };
            document.head.appendChild(script);
        }
    }

    observe(element) {
        if (this.observer) {
            this.observer.observe(element);
        } else {
            // Fallback for browsers without IntersectionObserver
            this.loadElement(element);
        }
    }

    observeAll(selector = '[data-lazy]') {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => this.observe(element));
    }

    // Progressive image loading
    static createProgressiveImage(src, placeholder = '') {
        const container = document.createElement('div');
        container.className = 'progressive-image';
        
        const img = document.createElement('img');
        img.className = 'progressive-image-main';
        img.dataset.src = src;
        img.dataset.lazyType = 'image';
        
        if (placeholder) {
            const placeholderImg = document.createElement('img');
            placeholderImg.src = placeholder;
            placeholderImg.className = 'progressive-image-placeholder';
            container.appendChild(placeholderImg);
        }
        
        container.appendChild(img);
        return container;
    }

    // Lazy load with retry mechanism
    loadWithRetry(element, maxRetries = 3) {
        let retries = 0;
        
        const tryLoad = () => {
            this.loadElement(element);
            
            const img = element.tagName === 'IMG' ? element : element.querySelector('img');
            if (img) {
                img.onerror = () => {
                    if (retries < maxRetries) {
                        retries++;
                        setTimeout(tryLoad, 1000 * retries);
                    }
                };
            }
        };
        
        tryLoad();
    }
}

// Image Optimization Utilities
class ImageOptimizer {
    static getOptimalFormat() {
        // Check browser support for modern formats
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        
        const formats = {
            webp: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0,
            avif: canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0
        };
        
        if (formats.avif) return 'avif';
        if (formats.webp) return 'webp';
        return 'jpg';
    }

    static createResponsiveImageSources(baseName, sizes) {
        const format = this.getOptimalFormat();
        const sources = [];
        
        sizes.forEach(size => {
            sources.push({
                srcset: `${baseName}-${size}w.${format}`,
                media: `(max-width: ${size}px)`
            });
        });
        
        return sources;
    }

    static createPictureElement(baseName, sizes, alt = '') {
        const picture = document.createElement('picture');
        const sources = this.createResponsiveImageSources(baseName, sizes);
        
        sources.forEach(source => {
            const sourceEl = document.createElement('source');
            sourceEl.srcset = source.srcset;
            sourceEl.media = source.media;
            picture.appendChild(sourceEl);
        });
        
        const img = document.createElement('img');
        img.src = `${baseName}-${sizes[sizes.length - 1]}w.jpg`;
        img.alt = alt;
        img.loading = 'lazy';
        picture.appendChild(img);
        
        return picture;
    }

    static preloadCriticalImages(images) {
        images.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
    }
}

// Code Splitting Utilities
class CodeSplitter {
    static async loadModule(modulePath) {
        try {
            const module = await import(modulePath);
            return module.default || module;
        } catch (error) {
            console.error(`Failed to load module: ${modulePath}`, error);
            throw error;
        }
    }

    static async loadComponent(componentPath, containerId) {
        try {
            const component = await this.loadModule(componentPath);
            const container = document.getElementById(containerId);
            
            if (container && component) {
                if (typeof component === 'function') {
                    component(container);
                } else if (component.render) {
                    component.render(container);
                }
            }
        } catch (error) {
            console.error('Component loading failed:', error);
        }
    }

    static createLazyRoute(routePath, componentPath) {
        return {
            path: routePath,
            component: () => this.loadModule(componentPath)
        };
    }

    static preloadRoute(componentPath) {
        // Preload route component on hover/focus
        const preload = () => {
            this.loadModule(componentPath);
        };
        
        return { preload };
    }
}

// Resource Hints
class ResourceHints {
    static preloadResource(href, as, type = null) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;
        if (type) link.type = type;
        document.head.appendChild(link);
    }

    static prefetchResource(href) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
    }

    static preconnect(origin) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = origin;
        document.head.appendChild(link);
    }

    static dnsPrefetch(origin) {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = origin;
        document.head.appendChild(link);
    }

    static modulePreload(href) {
        const link = document.createElement('link');
        link.rel = 'modulepreload';
        link.href = href;
        document.head.appendChild(link);
    }

    // Intelligent prefetching based on user behavior
    static setupIntelligentPrefetch() {
        let hoverTimer;
        
        document.addEventListener('mouseover', (e) => {
            const link = e.target.closest('a[href]');
            if (link && !link.dataset.prefetched) {
                hoverTimer = setTimeout(() => {
                    this.prefetchResource(link.href);
                    link.dataset.prefetched = 'true';
                }, 100);
            }
        });
        
        document.addEventListener('mouseout', () => {
            clearTimeout(hoverTimer);
        });
    }
}

// Performance Monitoring
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.observers = {};
    }

    // Core Web Vitals monitoring
    measureCoreWebVitals() {
        // Largest Contentful Paint
        if ('PerformanceObserver' in window) {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.lcp = lastEntry.startTime;
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.lcp = lcpObserver;
        }

        // First Input Delay
        if ('PerformanceObserver' in window) {
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.metrics.fid = entry.processingStart - entry.startTime;
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });
            this.observers.fid = fidObserver;
        }

        // Cumulative Layout Shift
        if ('PerformanceObserver' in window) {
            const clsObserver = new PerformanceObserver((list) => {
                let clsValue = 0;
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                this.metrics.cls = clsValue;
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
            this.observers.cls = clsObserver;
        }
    }

    // Resource timing
    measureResourceTiming() {
        if ('PerformanceObserver' in window) {
            const resourceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (!this.metrics.resources) {
                        this.metrics.resources = [];
                    }
                    
                    this.metrics.resources.push({
                        name: entry.name,
                        duration: entry.duration,
                        size: entry.transferSize,
                        type: entry.initiatorType
                    });
                });
            });
            resourceObserver.observe({ entryTypes: ['resource'] });
            this.observers.resource = resourceObserver;
        }
    }

    // Navigation timing
    measureNavigationTiming() {
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                this.metrics.navigation = {
                    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
                    connect: navigation.connectEnd - navigation.connectStart,
                    ttfb: navigation.responseStart - navigation.requestStart,
                    download: navigation.responseEnd - navigation.responseStart,
                    domLoad: navigation.domContentLoadedEventEnd - navigation.navigationStart,
                    windowLoad: navigation.loadEventEnd - navigation.navigationStart
                };
            }
        });
    }

    // Custom metrics
    mark(name) {
        performance.mark(name);
    }

    measure(name, startMark, endMark) {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        this.metrics.custom = this.metrics.custom || {};
        this.metrics.custom[name] = measure.duration;
    }

    // Get all metrics
    getMetrics() {
        return { ...this.metrics };
    }

    // Send metrics to analytics
    sendMetrics(endpoint) {
        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.getMetrics())
        }).catch(error => console.error('Failed to send metrics:', error));
    }

    // Cleanup observers
    disconnect() {
        Object.values(this.observers).forEach(observer => {
            observer.disconnect();
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LazyLoader,
        ImageOptimizer,
        CodeSplitter,
        ResourceHints,
        PerformanceMonitor
    };
}