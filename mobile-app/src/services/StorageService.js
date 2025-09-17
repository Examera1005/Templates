/**
 * Mobile Storage Service
 * Handles local storage, offline data management, and data synchronization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';

export class StorageService {
    constructor(options = {}) {
        this.appPrefix = options.appPrefix || 'app_';
        this.cachePrefix = options.cachePrefix || 'cache_';
        this.offlinePrefix = options.offlinePrefix || 'offline_';
        this.maxCacheSize = options.maxCacheSize || 50 * 1024 * 1024; // 50MB
        this.maxOfflineItems = options.maxOfflineItems || 1000;
        
        this.isOffline = false;
        this.offlineQueue = [];
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Check network status
            const netInfo = await NetInfo.fetch();
            this.isOffline = !netInfo.isConnected;

            // Load offline queue
            await this.loadOfflineQueue();

            // Setup network listener
            this.setupNetworkListener();

            // Cleanup old cache
            await this.cleanupOldCache();

            this.isInitialized = true;
            console.log('[Storage] Service initialized');
        } catch (error) {
            console.error('[Storage] Initialization failed:', error);
        }
    }

    setupNetworkListener() {
        NetInfo.addEventListener(state => {
            const wasOffline = this.isOffline;
            this.isOffline = !state.isConnected;

            if (wasOffline && !this.isOffline) {
                // Back online - process offline queue
                this.processOfflineQueue();
            }
        });
    }

    // Basic Storage Operations
    async setItem(key, value) {
        try {
            const serializedValue = JSON.stringify({
                data: value,
                timestamp: Date.now(),
                version: 1
            });

            await AsyncStorage.setItem(`${this.appPrefix}${key}`, serializedValue);
            console.log(`[Storage] Set item: ${key}`);
        } catch (error) {
            console.error(`[Storage] Failed to set item ${key}:`, error);
            throw error;
        }
    }

    async getItem(key) {
        try {
            const serializedValue = await AsyncStorage.getItem(`${this.appPrefix}${key}`);
            
            if (!serializedValue) {
                return null;
            }

            const parsed = JSON.parse(serializedValue);
            return parsed.data;
        } catch (error) {
            console.error(`[Storage] Failed to get item ${key}:`, error);
            return null;
        }
    }

    async removeItem(key) {
        try {
            await AsyncStorage.removeItem(`${this.appPrefix}${key}`);
            console.log(`[Storage] Removed item: ${key}`);
        } catch (error) {
            console.error(`[Storage] Failed to remove item ${key}:`, error);
        }
    }

    async getAllKeys() {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            return allKeys.filter(key => key.startsWith(this.appPrefix));
        } catch (error) {
            console.error('[Storage] Failed to get all keys:', error);
            return [];
        }
    }

    async clear() {
        try {
            const keys = await this.getAllKeys();
            await AsyncStorage.multiRemove(keys);
            console.log('[Storage] Cleared all app data');
        } catch (error) {
            console.error('[Storage] Failed to clear data:', error);
        }
    }

    // Cache Management
    async cacheData(key, data, ttl = 3600000) { // 1 hour default TTL
        try {
            const cacheKey = `${this.cachePrefix}${key}`;
            const cacheItem = {
                data,
                timestamp: Date.now(),
                ttl,
                size: JSON.stringify(data).length
            };

            await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheItem));
            console.log(`[Storage] Cached data: ${key}`);

            // Check cache size and cleanup if needed
            await this.manageCacheSize();
        } catch (error) {
            console.error(`[Storage] Failed to cache data ${key}:`, error);
        }
    }

    async getCachedData(key) {
        try {
            const cacheKey = `${this.cachePrefix}${key}`;
            const serializedValue = await AsyncStorage.getItem(cacheKey);
            
            if (!serializedValue) {
                return null;
            }

            const cacheItem = JSON.parse(serializedValue);
            const now = Date.now();

            // Check if cache is expired
            if (now - cacheItem.timestamp > cacheItem.ttl) {
                await AsyncStorage.removeItem(cacheKey);
                console.log(`[Storage] Cache expired: ${key}`);
                return null;
            }

            console.log(`[Storage] Cache hit: ${key}`);
            return cacheItem.data;
        } catch (error) {
            console.error(`[Storage] Failed to get cached data ${key}:`, error);
            return null;
        }
    }

    async invalidateCache(key) {
        try {
            const cacheKey = `${this.cachePrefix}${key}`;
            await AsyncStorage.removeItem(cacheKey);
            console.log(`[Storage] Cache invalidated: ${key}`);
        } catch (error) {
            console.error(`[Storage] Failed to invalidate cache ${key}:`, error);
        }
    }

    async manageCacheSize() {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const cacheKeys = allKeys.filter(key => key.startsWith(this.cachePrefix));
            
            let totalSize = 0;
            const cacheItems = [];

            for (const key of cacheKeys) {
                const serializedValue = await AsyncStorage.getItem(key);
                if (serializedValue) {
                    const cacheItem = JSON.parse(serializedValue);
                    totalSize += cacheItem.size;
                    cacheItems.push({
                        key,
                        timestamp: cacheItem.timestamp,
                        size: cacheItem.size
                    });
                }
            }

            if (totalSize > this.maxCacheSize) {
                // Remove oldest items until under limit
                cacheItems.sort((a, b) => a.timestamp - b.timestamp);
                
                for (const item of cacheItems) {
                    if (totalSize <= this.maxCacheSize * 0.8) break; // Leave 20% buffer
                    
                    await AsyncStorage.removeItem(item.key);
                    totalSize -= item.size;
                    console.log(`[Storage] Removed old cache item: ${item.key}`);
                }
            }
        } catch (error) {
            console.error('[Storage] Cache management failed:', error);
        }
    }

    async cleanupOldCache() {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const cacheKeys = allKeys.filter(key => key.startsWith(this.cachePrefix));
            const now = Date.now();

            for (const key of cacheKeys) {
                const serializedValue = await AsyncStorage.getItem(key);
                if (serializedValue) {
                    const cacheItem = JSON.parse(serializedValue);
                    
                    // Remove if expired
                    if (now - cacheItem.timestamp > cacheItem.ttl) {
                        await AsyncStorage.removeItem(key);
                    }
                }
            }

            console.log('[Storage] Old cache cleaned up');
        } catch (error) {
            console.error('[Storage] Cache cleanup failed:', error);
        }
    }

    // Offline Data Management
    async addToOfflineQueue(operation) {
        try {
            const offlineItem = {
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                operation,
                timestamp: Date.now(),
                retryCount: 0,
                maxRetries: 3
            };

            this.offlineQueue.push(offlineItem);
            await this.saveOfflineQueue();

            console.log(`[Storage] Added to offline queue: ${offlineItem.id}`);
            return offlineItem.id;
        } catch (error) {
            console.error('[Storage] Failed to add to offline queue:', error);
        }
    }

    async removeFromOfflineQueue(id) {
        try {
            this.offlineQueue = this.offlineQueue.filter(item => item.id !== id);
            await this.saveOfflineQueue();
            console.log(`[Storage] Removed from offline queue: ${id}`);
        } catch (error) {
            console.error('[Storage] Failed to remove from offline queue:', error);
        }
    }

    async loadOfflineQueue() {
        try {
            const queueData = await AsyncStorage.getItem(`${this.offlinePrefix}queue`);
            if (queueData) {
                this.offlineQueue = JSON.parse(queueData);
                console.log(`[Storage] Loaded offline queue: ${this.offlineQueue.length} items`);
            }
        } catch (error) {
            console.error('[Storage] Failed to load offline queue:', error);
            this.offlineQueue = [];
        }
    }

    async saveOfflineQueue() {
        try {
            // Limit queue size
            if (this.offlineQueue.length > this.maxOfflineItems) {
                this.offlineQueue = this.offlineQueue
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, this.maxOfflineItems);
            }

            await AsyncStorage.setItem(
                `${this.offlinePrefix}queue`,
                JSON.stringify(this.offlineQueue)
            );
        } catch (error) {
            console.error('[Storage] Failed to save offline queue:', error);
        }
    }

    async processOfflineQueue() {
        if (this.isOffline || this.offlineQueue.length === 0) {
            return;
        }

        console.log(`[Storage] Processing offline queue: ${this.offlineQueue.length} items`);

        const itemsToProcess = [...this.offlineQueue];
        
        for (const item of itemsToProcess) {
            try {
                await this.processOfflineItem(item);
                await this.removeFromOfflineQueue(item.id);
            } catch (error) {
                console.error(`[Storage] Failed to process offline item ${item.id}:`, error);
                
                // Increment retry count
                item.retryCount++;
                
                if (item.retryCount >= item.maxRetries) {
                    console.warn(`[Storage] Max retries reached for item ${item.id}, removing`);
                    await this.removeFromOfflineQueue(item.id);
                } else {
                    await this.saveOfflineQueue();
                }
            }
        }
    }

    async processOfflineItem(item) {
        // Override this method to handle specific offline operations
        console.log(`[Storage] Processing offline item:`, item);
        
        // Example: Make API call
        if (item.operation.type === 'api_call') {
            const response = await fetch(item.operation.url, item.operation.options);
            if (!response.ok) {
                throw new Error(`API call failed: ${response.status}`);
            }
        }
    }

    // User Preferences
    async saveUserPreference(key, value) {
        await this.setItem(`pref_${key}`, value);
    }

    async getUserPreference(key, defaultValue = null) {
        const value = await this.getItem(`pref_${key}`);
        return value !== null ? value : defaultValue;
    }

    async getUserPreferences() {
        try {
            const keys = await this.getAllKeys();
            const prefKeys = keys.filter(key => key.includes('pref_'));
            const preferences = {};

            for (const key of prefKeys) {
                const prefKey = key.replace(`${this.appPrefix}pref_`, '');
                preferences[prefKey] = await this.getItem(`pref_${prefKey}`);
            }

            return preferences;
        } catch (error) {
            console.error('[Storage] Failed to get user preferences:', error);
            return {};
        }
    }

    // App State Management
    async saveAppState(state) {
        await this.setItem('app_state', state);
    }

    async getAppState() {
        return await this.getItem('app_state');
    }

    async clearAppState() {
        await this.removeItem('app_state');
    }

    // Offline Data Helpers
    setOfflineMode(isOffline) {
        this.isOffline = isOffline;
        console.log(`[Storage] Offline mode: ${isOffline}`);
    }

    isOfflineMode() {
        return this.isOffline;
    }

    async getOfflineData() {
        return this.offlineQueue;
    }

    async clearOfflineData() {
        this.offlineQueue = [];
        await AsyncStorage.removeItem(`${this.offlinePrefix}queue`);
        console.log('[Storage] Offline data cleared');
    }

    // Storage Info
    async getStorageInfo() {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const appKeys = allKeys.filter(key => key.startsWith(this.appPrefix));
            const cacheKeys = allKeys.filter(key => key.startsWith(this.cachePrefix));
            const offlineKeys = allKeys.filter(key => key.startsWith(this.offlinePrefix));

            let totalSize = 0;
            let cacheSize = 0;

            // Calculate sizes (approximate)
            for (const key of allKeys) {
                const value = await AsyncStorage.getItem(key);
                if (value) {
                    const size = JSON.stringify(value).length;
                    totalSize += size;
                    
                    if (key.startsWith(this.cachePrefix)) {
                        cacheSize += size;
                    }
                }
            }

            return {
                totalKeys: allKeys.length,
                appKeys: appKeys.length,
                cacheKeys: cacheKeys.length,
                offlineKeys: offlineKeys.length,
                totalSize,
                cacheSize,
                offlineQueueSize: this.offlineQueue.length,
                maxCacheSize: this.maxCacheSize,
                cacheUsagePercent: (cacheSize / this.maxCacheSize) * 100
            };
        } catch (error) {
            console.error('[Storage] Failed to get storage info:', error);
            return null;
        }
    }

    // Migration helpers
    async migrateData(fromVersion, toVersion) {
        console.log(`[Storage] Migrating data from v${fromVersion} to v${toVersion}`);
        
        try {
            if (fromVersion < 2 && toVersion >= 2) {
                // Example migration
                await this.migrateToV2();
            }
            
            console.log('[Storage] Data migration completed');
        } catch (error) {
            console.error('[Storage] Data migration failed:', error);
        }
    }

    async migrateToV2() {
        // Example migration logic
        console.log('[Storage] Migrating to v2...');
    }
}