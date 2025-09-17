// Event Tracking and Analytics Manager
class AnalyticsTracker {
    constructor(options = {}) {
        this.options = {
            debug: false,
            bufferSize: 100,
            flushInterval: 5000, // 5 seconds
            endpoint: '/api/analytics',
            enableAutoTracking: true,
            trackPageViews: true,
            trackClicks: true,
            trackFormSubmissions: true,
            trackScrollDepth: true,
            ...options
        };
        
        this.eventBuffer = [];
        this.providers = new Map();
        this.sessionId = this.generateSessionId();
        this.userId = null;
        this.pageStartTime = Date.now();
        
        this.init();
    }

    init() {
        this.setupAutoTracking();
        this.startFlushInterval();
        
        if (this.options.trackPageViews) {
            this.trackPageView();
        }
    }

    // Core tracking methods
    track(eventName, properties = {}, options = {}) {
        const event = {
            eventName,
            properties: {
                ...properties,
                timestamp: Date.now(),
                sessionId: this.sessionId,
                userId: this.userId,
                userAgent: navigator.userAgent,
                url: window.location.href,
                referrer: document.referrer,
                ...this.getDeviceInfo()
            },
            options
        };

        this.addToBuffer(event);
        
        if (this.options.debug) {
            console.log('Analytics Event:', event);
        }

        // Send to all registered providers
        this.providers.forEach((provider, name) => {
            if (provider.track) {
                provider.track(eventName, event.properties);
            }
        });

        return event;
    }

    // Page view tracking
    trackPageView(properties = {}) {
        const pageProperties = {
            title: document.title,
            path: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
            ...properties
        };

        return this.track('page_view', pageProperties);
    }

    // User identification
    identify(userId, traits = {}) {
        this.userId = userId;
        
        const identifyEvent = {
            userId,
            traits: {
                ...traits,
                identifiedAt: Date.now()
            }
        };

        this.providers.forEach((provider, name) => {
            if (provider.identify) {
                provider.identify(userId, traits);
            }
        });

        return this.track('user_identified', identifyEvent);
    }

    // Conversion tracking
    trackConversion(conversionType, value = 0, currency = 'USD', properties = {}) {
        return this.track('conversion', {
            conversionType,
            value,
            currency,
            ...properties
        });
    }

    // Error tracking
    trackError(error, context = {}) {
        const errorProperties = {
            message: error.message,
            stack: error.stack,
            name: error.name,
            context: context
        };

        return this.track('error', errorProperties);
    }

    // Performance tracking
    trackPerformance(metricName, value, unit = 'ms', properties = {}) {
        return this.track('performance', {
            metricName,
            value,
            unit,
            ...properties
        });
    }

    // Custom events
    trackCustom(eventName, properties = {}) {
        return this.track(eventName, {
            customEvent: true,
            ...properties
        });
    }

    // Auto tracking setup
    setupAutoTracking() {
        if (!this.options.enableAutoTracking) return;

        // Click tracking
        if (this.options.trackClicks) {
            document.addEventListener('click', this.handleClick.bind(this));
        }

        // Form submission tracking
        if (this.options.trackFormSubmissions) {
            document.addEventListener('submit', this.handleFormSubmit.bind(this));
        }

        // Scroll depth tracking
        if (this.options.trackScrollDepth) {
            this.setupScrollTracking();
        }

        // Page unload tracking
        window.addEventListener('beforeunload', () => {
            this.trackPageUnload();
        });

        // Error tracking
        window.addEventListener('error', (event) => {
            this.trackError(event.error, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Promise rejection tracking
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError(new Error(event.reason), {
                type: 'unhandled_promise_rejection'
            });
        });
    }

    handleClick(event) {
        const element = event.target;
        const properties = {
            elementType: element.tagName.toLowerCase(),
            elementId: element.id,
            elementClass: element.className,
            elementText: element.textContent?.substring(0, 100),
            x: event.clientX,
            y: event.clientY
        };

        // Special handling for links and buttons
        if (element.tagName === 'A') {
            properties.linkUrl = element.href;
            properties.linkTarget = element.target;
        }

        if (element.tagName === 'BUTTON' || element.type === 'submit') {
            properties.buttonType = element.type;
        }

        this.track('click', properties);
    }

    handleFormSubmit(event) {
        const form = event.target;
        const formData = new FormData(form);
        const fields = {};

        for (const [key, value] of formData.entries()) {
            // Don't track sensitive data
            if (!this.isSensitiveField(key)) {
                fields[key] = typeof value === 'string' ? value.substring(0, 100) : 'file';
            }
        }

        this.track('form_submit', {
            formId: form.id,
            formAction: form.action,
            formMethod: form.method,
            fieldCount: formData.keys().length,
            fields: fields
        });
    }

    setupScrollTracking() {
        let maxScroll = 0;
        const milestones = [25, 50, 75, 100];
        const tracked = new Set();

        const trackScroll = () => {
            const scrollTop = window.pageYOffset;
            const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = Math.round((scrollTop / documentHeight) * 100);

            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;

                milestones.forEach(milestone => {
                    if (scrollPercent >= milestone && !tracked.has(milestone)) {
                        tracked.add(milestone);
                        this.track('scroll_depth', {
                            percentage: milestone,
                            pixels: scrollTop
                        });
                    }
                });
            }
        };

        window.addEventListener('scroll', this.debounce(trackScroll, 250));
    }

    trackPageUnload() {
        const timeOnPage = Date.now() - this.pageStartTime;
        
        this.track('page_unload', {
            timeOnPage: timeOnPage,
            maxScrollDepth: this.getMaxScrollDepth()
        });

        // Force flush remaining events
        this.flush();
    }

    // Provider management
    addProvider(name, provider) {
        this.providers.set(name, provider);
        
        if (this.options.debug) {
            console.log(`Analytics provider added: ${name}`);
        }
    }

    removeProvider(name) {
        this.providers.delete(name);
    }

    // Buffer management
    addToBuffer(event) {
        this.eventBuffer.push(event);
        
        if (this.eventBuffer.length >= this.options.bufferSize) {
            this.flush();
        }
    }

    flush() {
        if (this.eventBuffer.length === 0) return;

        const events = [...this.eventBuffer];
        this.eventBuffer = [];

        this.sendEvents(events);
    }

    startFlushInterval() {
        setInterval(() => {
            this.flush();
        }, this.options.flushInterval);
    }

    // Send events to server
    async sendEvents(events) {
        try {
            const response = await fetch(this.options.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ events })
            });

            if (!response.ok) {
                throw new Error(`Analytics request failed: ${response.status}`);
            }

            if (this.options.debug) {
                console.log(`Sent ${events.length} analytics events`);
            }
        } catch (error) {
            // Re-add events to buffer on failure
            this.eventBuffer.unshift(...events);
            
            if (this.options.debug) {
                console.error('Failed to send analytics events:', error);
            }
        }
    }

    // Utility methods
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getDeviceInfo() {
        return {
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform
        };
    }

    getMaxScrollDepth() {
        const scrollTop = window.pageYOffset;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        return Math.round((scrollTop / documentHeight) * 100);
    }

    isSensitiveField(fieldName) {
        const sensitiveFields = [
            'password', 'confirm_password', 'ssn', 'social_security',
            'credit_card', 'card_number', 'cvv', 'pin', 'token'
        ];
        
        return sensitiveFields.some(field => 
            fieldName.toLowerCase().includes(field)
        );
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Analytics Providers
class GoogleAnalyticsProvider {
    constructor(trackingId) {
        this.trackingId = trackingId;
        this.init();
    }

    init() {
        // Load Google Analytics
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${this.trackingId}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function() {
            window.dataLayer.push(arguments);
        };
        
        gtag('js', new Date());
        gtag('config', this.trackingId);
    }

    track(eventName, properties) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                custom_map: properties
            });
        }
    }

    identify(userId, traits) {
        if (typeof gtag !== 'undefined') {
            gtag('config', this.trackingId, {
                user_id: userId
            });
        }
    }
}

class FacebookPixelProvider {
    constructor(pixelId) {
        this.pixelId = pixelId;
        this.init();
    }

    init() {
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window,document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');

        fbq('init', this.pixelId);
        fbq('track', 'PageView');
    }

    track(eventName, properties) {
        if (typeof fbq !== 'undefined') {
            fbq('track', eventName, properties);
        }
    }

    identify(userId, traits) {
        // Facebook Pixel doesn't have a separate identify method
        // User data is sent with events
    }
}

class CustomAnalyticsProvider {
    constructor(endpoint) {
        this.endpoint = endpoint;
    }

    async track(eventName, properties) {
        try {
            await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event: eventName,
                    properties: properties
                })
            });
        } catch (error) {
            console.error('Custom analytics error:', error);
        }
    }

    identify(userId, traits) {
        this.track('identify', { userId, traits });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AnalyticsTracker,
        GoogleAnalyticsProvider,
        FacebookPixelProvider,
        CustomAnalyticsProvider
    };
}