// Common Programming Patterns and Utilities
class CommonUtils {
    // Async utilities
    static async retry(fn, maxAttempts = 3, delay = 1000) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (attempt === maxAttempts) {
                    throw error;
                }
                await this.sleep(delay * attempt);
            }
        }
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static timeout(promise, ms) {
        return Promise.race([
            promise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), ms)
            )
        ]);
    }

    static async parallel(tasks, concurrency = 5) {
        const results = [];
        const executing = [];

        for (const task of tasks) {
            const promise = Promise.resolve(task()).then(result => {
                executing.splice(executing.indexOf(promise), 1);
                return result;
            });

            results.push(promise);
            executing.push(promise);

            if (executing.length >= concurrency) {
                await Promise.race(executing);
            }
        }

        return Promise.all(results);
    }

    // Functional programming utilities
    static pipe(...functions) {
        return (value) => functions.reduce((acc, fn) => fn(acc), value);
    }

    static compose(...functions) {
        return (value) => functions.reduceRight((acc, fn) => fn(acc), value);
    }

    static curry(fn) {
        return function curried(...args) {
            if (args.length >= fn.length) {
                return fn.apply(this, args);
            }
            return function(...args2) {
                return curried.apply(this, args.concat(args2));
            };
        };
    }

    static memoize(fn) {
        const cache = new Map();
        return function(...args) {
            const key = JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = fn.apply(this, args);
            cache.set(key, result);
            return result;
        };
    }

    // Cache implementation
    static createCache(maxSize = 100, ttl = 60000) {
        const cache = new Map();
        const timers = new Map();

        return {
            get(key) {
                if (cache.has(key)) {
                    return cache.get(key);
                }
                return null;
            },

            set(key, value) {
                if (cache.size >= maxSize) {
                    const firstKey = cache.keys().next().value;
                    this.delete(firstKey);
                }

                cache.set(key, value);

                if (timers.has(key)) {
                    clearTimeout(timers.get(key));
                }

                const timer = setTimeout(() => {
                    this.delete(key);
                }, ttl);

                timers.set(key, timer);
            },

            delete(key) {
                cache.delete(key);
                if (timers.has(key)) {
                    clearTimeout(timers.get(key));
                    timers.delete(key);
                }
            },

            clear() {
                cache.clear();
                timers.forEach(timer => clearTimeout(timer));
                timers.clear();
            },

            size() {
                return cache.size;
            }
        };
    }

    // Event emitter
    static createEventEmitter() {
        const events = {};

        return {
            on(event, listener) {
                if (!events[event]) {
                    events[event] = [];
                }
                events[event].push(listener);
            },

            off(event, listener) {
                if (events[event]) {
                    events[event] = events[event].filter(l => l !== listener);
                }
            },

            once(event, listener) {
                const onceListener = (...args) => {
                    listener(...args);
                    this.off(event, onceListener);
                };
                this.on(event, onceListener);
            },

            emit(event, ...args) {
                if (events[event]) {
                    events[event].forEach(listener => listener(...args));
                }
            },

            removeAllListeners(event) {
                if (event) {
                    delete events[event];
                } else {
                    Object.keys(events).forEach(key => delete events[key]);
                }
            }
        };
    }

    // State management
    static createStore(initialState = {}) {
        let state = { ...initialState };
        const listeners = [];

        return {
            getState() {
                return { ...state };
            },

            setState(newState) {
                state = { ...state, ...newState };
                listeners.forEach(listener => listener(state));
            },

            subscribe(listener) {
                listeners.push(listener);
                return () => {
                    const index = listeners.indexOf(listener);
                    if (index > -1) {
                        listeners.splice(index, 1);
                    }
                };
            },

            reset() {
                state = { ...initialState };
                listeners.forEach(listener => listener(state));
            }
        };
    }

    // Rate limiting
    static createRateLimiter(maxRequests, windowMs) {
        const requests = [];

        return {
            isAllowed() {
                const now = Date.now();
                const cutoff = now - windowMs;
                
                // Remove old requests
                while (requests.length > 0 && requests[0] < cutoff) {
                    requests.shift();
                }

                if (requests.length < maxRequests) {
                    requests.push(now);
                    return true;
                }

                return false;
            },

            getRemainingRequests() {
                const now = Date.now();
                const cutoff = now - windowMs;
                
                // Remove old requests
                while (requests.length > 0 && requests[0] < cutoff) {
                    requests.shift();
                }

                return Math.max(0, maxRequests - requests.length);
            },

            getResetTime() {
                if (requests.length === 0) {
                    return 0;
                }
                return requests[0] + windowMs;
            }
        };
    }

    // UUID generation
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    static generateShortId(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Feature flags
    static createFeatureFlags(flags = {}) {
        let currentFlags = { ...flags };

        return {
            isEnabled(flag) {
                return currentFlags[flag] === true;
            },

            enable(flag) {
                currentFlags[flag] = true;
            },

            disable(flag) {
                currentFlags[flag] = false;
            },

            toggle(flag) {
                currentFlags[flag] = !currentFlags[flag];
            },

            setFlags(newFlags) {
                currentFlags = { ...currentFlags, ...newFlags };
            },

            getFlags() {
                return { ...currentFlags };
            }
        };
    }

    // Simple logger
    static createLogger(level = 'info') {
        const levels = { error: 0, warn: 1, info: 2, debug: 3 };
        const currentLevel = levels[level] || 2;

        return {
            error(...args) {
                if (currentLevel >= 0) {
                    console.error('[ERROR]', new Date().toISOString(), ...args);
                }
            },

            warn(...args) {
                if (currentLevel >= 1) {
                    console.warn('[WARN]', new Date().toISOString(), ...args);
                }
            },

            info(...args) {
                if (currentLevel >= 2) {
                    console.info('[INFO]', new Date().toISOString(), ...args);
                }
            },

            debug(...args) {
                if (currentLevel >= 3) {
                    console.log('[DEBUG]', new Date().toISOString(), ...args);
                }
            },

            setLevel(newLevel) {
                if (levels.hasOwnProperty(newLevel)) {
                    level = newLevel;
                    currentLevel = levels[newLevel];
                }
            }
        };
    }

    // Configuration manager
    static createConfig(defaults = {}) {
        let config = { ...defaults };

        return {
            get(key, defaultValue = null) {
                return key.split('.').reduce((obj, k) => obj?.[k], config) ?? defaultValue;
            },

            set(key, value) {
                const keys = key.split('.');
                const lastKey = keys.pop();
                const target = keys.reduce((obj, k) => {
                    if (!obj[k] || typeof obj[k] !== 'object') {
                        obj[k] = {};
                    }
                    return obj[k];
                }, config);
                target[lastKey] = value;
            },

            has(key) {
                return this.get(key) !== null;
            },

            merge(newConfig) {
                config = this.deepMerge(config, newConfig);
            },

            reset() {
                config = { ...defaults };
            },

            getAll() {
                return JSON.parse(JSON.stringify(config));
            }
        };
    }

    // Deep merge utility
    static deepMerge(target, source) {
        const result = { ...target };

        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }

        return result;
    }

    // Batch processor
    static createBatchProcessor(processFn, batchSize = 10, delay = 100) {
        let queue = [];
        let timeoutId = null;

        const processQueue = async () => {
            if (queue.length === 0) return;

            const batch = queue.splice(0, batchSize);
            try {
                await processFn(batch);
            } catch (error) {
                console.error('Batch processing error:', error);
            }

            if (queue.length > 0) {
                timeoutId = setTimeout(processQueue, delay);
            }
        };

        return {
            add(item) {
                queue.push(item);
                
                if (!timeoutId) {
                    timeoutId = setTimeout(processQueue, delay);
                }
            },

            flush() {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                return processQueue();
            },

            size() {
                return queue.length;
            }
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommonUtils;
}