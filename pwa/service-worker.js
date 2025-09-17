/**
 * Progressive Web App Service Worker
 * Handles caching, offline functionality, and background sync
 */

const CACHE_NAME = 'pwa-cache-v1';
const DATA_CACHE_NAME = 'pwa-data-cache-v1';

// Files to cache for offline functionality
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/styles.css',
    '/js/app.js',
    '/js/pwa-manager.js',
    '/images/icons/icon-192x192.png',
    '/images/icons/icon-512x512.png',
    '/offline.html'
];

// API endpoints to cache
const API_ENDPOINTS = [
    '/api/data',
    '/api/user',
    '/api/settings'
];

class ServiceWorkerManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Install event - cache files
        self.addEventListener('install', (event) => {
            console.log('[ServiceWorker] Install');
            event.waitUntil(
                this.handleInstall()
            );
        });

        // Activate event - clean up old caches
        self.addEventListener('activate', (event) => {
            console.log('[ServiceWorker] Activate');
            event.waitUntil(
                this.handleActivate()
            );
        });

        // Fetch event - serve cached content when offline
        self.addEventListener('fetch', (event) => {
            event.respondWith(
                this.handleFetch(event)
            );
        });

        // Background sync
        self.addEventListener('sync', (event) => {
            console.log('[ServiceWorker] Background sync', event.tag);
            if (event.tag === 'background-sync') {
                event.waitUntil(this.handleBackgroundSync());
            }
        });

        // Push notifications
        self.addEventListener('push', (event) => {
            console.log('[ServiceWorker] Push received');
            event.waitUntil(this.handlePushNotification(event));
        });

        // Notification click
        self.addEventListener('notificationclick', (event) => {
            console.log('[ServiceWorker] Notification click');
            event.waitUntil(this.handleNotificationClick(event));
        });
    }

    async handleInstall() {
        try {
            const cache = await caches.open(CACHE_NAME);
            console.log('[ServiceWorker] Caching app shell');
            await cache.addAll(FILES_TO_CACHE);
            
            // Skip waiting to activate immediately
            self.skipWaiting();
        } catch (error) {
            console.error('[ServiceWorker] Install failed:', error);
        }
    }

    async handleActivate() {
        try {
            // Clean up old caches
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
                        console.log('[ServiceWorker] Removing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );

            // Take control of all clients
            self.clients.claim();
        } catch (error) {
            console.error('[ServiceWorker] Activate failed:', error);
        }
    }

    async handleFetch(event) {
        const { request } = event;
        const url = new URL(request.url);

        // Handle API requests
        if (this.isApiRequest(url)) {
            return this.handleApiRequest(request);
        }

        // Handle page requests
        if (this.isPageRequest(request)) {
            return this.handlePageRequest(request);
        }

        // Handle static asset requests
        return this.handleAssetRequest(request);
    }

    isApiRequest(url) {
        return API_ENDPOINTS.some(endpoint => 
            url.pathname.startsWith(endpoint)
        );
    }

    isPageRequest(request) {
        return request.method === 'GET' && 
               request.headers.get('accept') &&
               request.headers.get('accept').includes('text/html');
    }

    async handleApiRequest(request) {
        try {
            // Try network first for API requests
            const response = await fetch(request);
            
            // Cache successful responses
            if (response.status === 200) {
                const cache = await caches.open(DATA_CACHE_NAME);
                cache.put(request.url, response.clone());
            }
            
            return response;
        } catch (error) {
            // Return cached data if available
            console.log('[ServiceWorker] Network failed, serving cached data');
            const cachedResponse = await caches.match(request);
            
            if (cachedResponse) {
                return cachedResponse;
            }
            
            // Return offline indicator for API requests
            return new Response(
                JSON.stringify({ 
                    error: 'Offline',
                    message: 'Network unavailable',
                    cached: false 
                }),
                {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
    }

    async handlePageRequest(request) {
        try {
            // Try network first
            const response = await fetch(request);
            return response;
        } catch (error) {
            // Serve cached page or offline page
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }
            
            // Serve offline page
            return caches.match('/offline.html');
        }
    }

    async handleAssetRequest(request) {
        // Cache first strategy for static assets
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        try {
            const response = await fetch(request);
            
            // Cache the asset
            if (response.status === 200) {
                const cache = await caches.open(CACHE_NAME);
                cache.put(request, response.clone());
            }
            
            return response;
        } catch (error) {
            console.log('[ServiceWorker] Asset fetch failed:', request.url);
            
            // Return placeholder for images
            if (request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
                return this.generatePlaceholderImage();
            }
            
            throw error;
        }
    }

    generatePlaceholderImage() {
        // Generate a simple placeholder SVG
        const svg = `
            <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f0f0f0"/>
                <text x="50%" y="50%" text-anchor="middle" dy=".3em" 
                      font-family="Arial, sans-serif" font-size="16" fill="#666">
                    Image Unavailable
                </text>
            </svg>
        `;
        
        return new Response(svg, {
            headers: { 'Content-Type': 'image/svg+xml' }
        });
    }

    async handleBackgroundSync() {
        try {
            // Get pending sync data
            const pendingData = await this.getPendingData();
            
            for (const data of pendingData) {
                try {
                    await fetch(data.url, {
                        method: data.method,
                        headers: data.headers,
                        body: data.body
                    });
                    
                    // Remove from pending queue
                    await this.removePendingData(data.id);
                } catch (error) {
                    console.error('[ServiceWorker] Background sync failed for:', data.url);
                }
            }
        } catch (error) {
            console.error('[ServiceWorker] Background sync error:', error);
        }
    }

    async handlePushNotification(event) {
        const data = event.data ? event.data.json() : {};
        
        const options = {
            body: data.body || 'New notification',
            icon: data.icon || '/images/icons/icon-192x192.png',
            badge: data.badge || '/images/icons/badge-72x72.png',
            tag: data.tag || 'default',
            data: data.data || {},
            actions: data.actions || [],
            requireInteraction: data.requireInteraction || false,
            silent: data.silent || false
        };

        return self.registration.showNotification(
            data.title || 'PWA Notification',
            options
        );
    }

    async handleNotificationClick(event) {
        const { notification } = event;
        const action = event.action;
        const data = notification.data || {};

        notification.close();

        if (action === 'close') {
            return;
        }

        // Handle notification actions
        if (data.url) {
            return clients.openWindow(data.url);
        }

        // Focus existing window or open new one
        const clientList = await clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        });

        for (const client of clientList) {
            if (client.url === self.location.origin && 'focus' in client) {
                return client.focus();
            }
        }

        if (clients.openWindow) {
            return clients.openWindow('/');
        }
    }

    async getPendingData() {
        // Get pending sync data from IndexedDB
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('PWA-SyncDB', 1);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['pendingSync'], 'readonly');
                const store = transaction.objectStore('pendingSync');
                const getAllRequest = store.getAll();
                
                getAllRequest.onsuccess = () => {
                    resolve(getAllRequest.result);
                };
            };
            
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('pendingSync')) {
                    db.createObjectStore('pendingSync', { keyPath: 'id' });
                }
            };
        });
    }

    async removePendingData(id) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('PWA-SyncDB', 1);
            
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['pendingSync'], 'readwrite');
                const store = transaction.objectStore('pendingSync');
                const deleteRequest = store.delete(id);
                
                deleteRequest.onsuccess = () => resolve();
                deleteRequest.onerror = () => reject(deleteRequest.error);
            };
        });
    }

    // Update cache
    async updateCache(urls = []) {
        const cache = await caches.open(CACHE_NAME);
        
        for (const url of urls) {
            try {
                const response = await fetch(url);
                if (response.status === 200) {
                    await cache.put(url, response);
                    console.log('[ServiceWorker] Updated cache for:', url);
                }
            } catch (error) {
                console.error('[ServiceWorker] Failed to update cache for:', url);
            }
        }
    }

    // Clear specific cache
    async clearCache(cacheName = CACHE_NAME) {
        const deleted = await caches.delete(cacheName);
        console.log('[ServiceWorker] Cache cleared:', cacheName, deleted);
        return deleted;
    }

    // Get cache size
    async getCacheSize() {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        
        let totalSize = 0;
        for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
            }
        }
        
        return {
            files: keys.length,
            size: totalSize,
            sizeFormatted: this.formatBytes(totalSize)
        };
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the service worker
const serviceWorkerManager = new ServiceWorkerManager();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServiceWorkerManager;
}