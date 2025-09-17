// Caching Strategies and Utilities
class CacheManager {
    constructor(options = {}) {
        this.options = {
            defaultTTL: 3600000, // 1 hour
            maxSize: 100,
            storage: 'memory', // 'memory', 'localStorage', 'sessionStorage'
            ...options
        };
        
        this.initStorage();
    }

    initStorage() {
        switch (this.options.storage) {
            case 'localStorage':
                this.storage = new LocalStorageCache(this.options);
                break;
            case 'sessionStorage':
                this.storage = new SessionStorageCache(this.options);
                break;
            default:
                this.storage = new MemoryCache(this.options);
        }
    }

    get(key) {
        return this.storage.get(key);
    }

    set(key, value, ttl) {
        return this.storage.set(key, value, ttl);
    }

    delete(key) {
        return this.storage.delete(key);
    }

    clear() {
        return this.storage.clear();
    }

    size() {
        return this.storage.size();
    }

    keys() {
        return this.storage.keys();
    }
}

// Memory Cache Implementation
class MemoryCache {
    constructor(options = {}) {
        this.options = options;
        this.cache = new Map();
        this.timers = new Map();
        this.accessTimes = new Map();
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.delete(key);
            return null;
        }
        
        this.accessTimes.set(key, Date.now());
        return item.value;
    }

    set(key, value, ttl = this.options.defaultTTL) {
        // Evict if at max size
        if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
            this.evictLRU();
        }

        const expiry = Date.now() + ttl;
        this.cache.set(key, { value, expiry });
        this.accessTimes.set(key, Date.now());

        // Set timer for expiry
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        const timer = setTimeout(() => {
            this.delete(key);
        }, ttl);

        this.timers.set(key, timer);
        return true;
    }

    delete(key) {
        this.cache.delete(key);
        this.accessTimes.delete(key);
        
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
        
        return true;
    }

    clear() {
        this.cache.clear();
        this.accessTimes.clear();
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
    }

    size() {
        return this.cache.size;
    }

    keys() {
        return Array.from(this.cache.keys());
    }

    evictLRU() {
        let oldestKey = null;
        let oldestTime = Infinity;

        for (const [key, time] of this.accessTimes) {
            if (time < oldestTime) {
                oldestTime = time;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.delete(oldestKey);
        }
    }
}

// Local Storage Cache Implementation
class LocalStorageCache {
    constructor(options = {}) {
        this.options = options;
        this.prefix = 'cache_';
    }

    get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            if (!item) return null;

            const parsed = JSON.parse(item);
            if (Date.now() > parsed.expiry) {
                this.delete(key);
                return null;
            }

            return parsed.value;
        } catch (error) {
            return null;
        }
    }

    set(key, value, ttl = this.options.defaultTTL) {
        try {
            const expiry = Date.now() + ttl;
            const item = JSON.stringify({ value, expiry });
            localStorage.setItem(this.prefix + key, item);
            return true;
        } catch (error) {
            // Handle quota exceeded
            this.cleanup();
            try {
                const expiry = Date.now() + ttl;
                const item = JSON.stringify({ value, expiry });
                localStorage.setItem(this.prefix + key, item);
                return true;
            } catch (error) {
                return false;
            }
        }
    }

    delete(key) {
        localStorage.removeItem(this.prefix + key);
        return true;
    }

    clear() {
        const keys = this.keys();
        keys.forEach(key => this.delete(key));
    }

    size() {
        return this.keys().length;
    }

    keys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keys.push(key.substring(this.prefix.length));
            }
        }
        return keys;
    }

    cleanup() {
        const keys = this.keys();
        keys.forEach(key => {
            this.get(key); // This will delete expired items
        });
    }
}

// Session Storage Cache Implementation
class SessionStorageCache extends LocalStorageCache {
    constructor(options = {}) {
        super(options);
    }

    get(key) {
        try {
            const item = sessionStorage.getItem(this.prefix + key);
            if (!item) return null;

            const parsed = JSON.parse(item);
            if (Date.now() > parsed.expiry) {
                this.delete(key);
                return null;
            }

            return parsed.value;
        } catch (error) {
            return null;
        }
    }

    set(key, value, ttl = this.options.defaultTTL) {
        try {
            const expiry = Date.now() + ttl;
            const item = JSON.stringify({ value, expiry });
            sessionStorage.setItem(this.prefix + key, item);
            return true;
        } catch (error) {
            return false;
        }
    }

    delete(key) {
        sessionStorage.removeItem(this.prefix + key);
        return true;
    }

    keys() {
        const keys = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keys.push(key.substring(this.prefix.length));
            }
        }
        return keys;
    }
}

// HTTP Cache Utilities
class HTTPCache {
    constructor(options = {}) {
        this.options = {
            defaultTTL: 300000, // 5 minutes
            maxSize: 50,
            ...options
        };
        
        this.cache = new CacheManager(this.options);
        this.pendingRequests = new Map();
    }

    async fetch(url, options = {}) {
        const cacheKey = this.getCacheKey(url, options);
        
        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return this.cloneResponse(cached);
        }

        // Check if request is already pending
        if (this.pendingRequests.has(cacheKey)) {
            return await this.pendingRequests.get(cacheKey);
        }

        // Make request
        const requestPromise = this.makeRequest(url, options, cacheKey);
        this.pendingRequests.set(cacheKey, requestPromise);

        try {
            const response = await requestPromise;
            return response;
        } finally {
            this.pendingRequests.delete(cacheKey);
        }
    }

    async makeRequest(url, options, cacheKey) {
        try {
            const response = await fetch(url, options);
            
            if (response.ok && this.shouldCache(response)) {
                const cloned = response.clone();
                const ttl = this.getTTL(response);
                this.cache.set(cacheKey, cloned, ttl);
            }
            
            return response;
        } catch (error) {
            throw error;
        }
    }

    getCacheKey(url, options) {
        const method = options.method || 'GET';
        const headers = JSON.stringify(options.headers || {});
        const body = options.body || '';
        return `${method}:${url}:${headers}:${body}`;
    }

    shouldCache(response) {
        const method = response.url ? 'GET' : 'GET'; // Simplified
        return method === 'GET' && response.status < 400;
    }

    getTTL(response) {
        const cacheControl = response.headers.get('cache-control');
        if (cacheControl) {
            const maxAge = cacheControl.match(/max-age=(\d+)/);
            if (maxAge) {
                return parseInt(maxAge[1]) * 1000;
            }
        }
        return this.options.defaultTTL;
    }

    cloneResponse(response) {
        return response.clone();
    }

    invalidate(pattern) {
        const keys = this.cache.keys();
        keys.forEach(key => {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        });
    }
}

// Service Worker Cache Manager
class ServiceWorkerCache {
    constructor(cacheName = 'app-cache-v1') {
        this.cacheName = cacheName;
    }

    async addToCache(requests) {
        if ('caches' in window) {
            const cache = await caches.open(this.cacheName);
            return await cache.addAll(requests);
        }
    }

    async getFromCache(request) {
        if ('caches' in window) {
            return await caches.match(request);
        }
        return null;
    }

    async putInCache(request, response) {
        if ('caches' in window) {
            const cache = await caches.open(this.cacheName);
            return await cache.put(request, response);
        }
    }

    async deleteFromCache(request) {
        if ('caches' in window) {
            const cache = await caches.open(this.cacheName);
            return await cache.delete(request);
        }
    }

    async clearCache() {
        if ('caches' in window) {
            return await caches.delete(this.cacheName);
        }
    }

    // Cache strategies
    async cacheFirst(request) {
        const cached = await this.getFromCache(request);
        if (cached) {
            return cached;
        }

        try {
            const response = await fetch(request);
            await this.putInCache(request, response.clone());
            return response;
        } catch (error) {
            throw error;
        }
    }

    async networkFirst(request) {
        try {
            const response = await fetch(request);
            await this.putInCache(request, response.clone());
            return response;
        } catch (error) {
            const cached = await this.getFromCache(request);
            if (cached) {
                return cached;
            }
            throw error;
        }
    }

    async staleWhileRevalidate(request) {
        const cached = await this.getFromCache(request);
        
        const networkPromise = fetch(request).then(response => {
            this.putInCache(request, response.clone());
            return response;
        });

        return cached || networkPromise;
    }
}

// Browser Cache Utilities
class BrowserCache {
    static setHeaders(response, cacheControl) {
        response.headers['Cache-Control'] = cacheControl;
        return response;
    }

    static setCacheForever(response) {
        return this.setHeaders(response, 'max-age=31536000, immutable');
    }

    static setNoCache(response) {
        return this.setHeaders(response, 'no-cache, no-store, must-revalidate');
    }

    static setShortCache(response, seconds = 300) {
        return this.setHeaders(response, `max-age=${seconds}`);
    }

    static setETag(response, etag) {
        response.headers['ETag'] = etag;
        return response;
    }

    static setLastModified(response, date) {
        response.headers['Last-Modified'] = date.toUTCString();
        return response;
    }

    static generateETag(content) {
        // Simple hash function for ETag
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return `"${hash.toString(36)}"`;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CacheManager,
        MemoryCache,
        LocalStorageCache,
        SessionStorageCache,
        HTTPCache,
        ServiceWorkerCache,
        BrowserCache
    };
}