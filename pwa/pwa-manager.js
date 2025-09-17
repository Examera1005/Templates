/**
 * PWA Manager
 * Handles PWA installation, updates, and offline functionality
 */

class PWAManager {
    constructor(options = {}) {
        this.options = {
            updateCheckInterval: 30000, // 30 seconds
            enableNotifications: true,
            enableBackgroundSync: true,
            showInstallPrompt: true,
            ...options
        };

        this.isOnline = navigator.onLine;
        this.isInstalled = false;
        this.deferredPrompt = null;
        this.registration = null;
        this.syncQueue = [];

        this.init();
    }

    async init() {
        // Check if service workers are supported
        if (!('serviceWorker' in navigator)) {
            console.warn('[PWA] Service Workers not supported');
            return;
        }

        try {
            // Register service worker
            await this.registerServiceWorker();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Check for updates
            this.checkForUpdates();
            
            // Setup background sync
            if (this.options.enableBackgroundSync) {
                this.setupBackgroundSync();
            }
            
            // Check installation status
            this.checkInstallationStatus();
            
            console.log('[PWA] PWA Manager initialized');
        } catch (error) {
            console.error('[PWA] Initialization failed:', error);
        }
    }

    async registerServiceWorker() {
        try {
            this.registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('[PWA] Service Worker registered:', this.registration);
            
            // Handle updates
            this.registration.addEventListener('updatefound', () => {
                this.handleServiceWorkerUpdate();
            });
            
            return this.registration;
        } catch (error) {
            console.error('[PWA] Service Worker registration failed:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Online/offline status
        window.addEventListener('online', () => {
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.handleOffline();
        });

        // Install prompt
        window.addEventListener('beforeinstallprompt', (event) => {
            this.handleInstallPrompt(event);
        });

        // App installed
        window.addEventListener('appinstalled', () => {
            this.handleAppInstalled();
        });

        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkForUpdates();
            }
        });
    }

    handleOnline() {
        this.isOnline = true;
        console.log('[PWA] Back online');
        
        // Process sync queue
        this.processSyncQueue();
        
        // Notify app
        this.dispatchEvent('online');
        
        // Update UI
        this.updateNetworkStatus(true);
    }

    handleOffline() {
        this.isOnline = false;
        console.log('[PWA] Gone offline');
        
        // Notify app
        this.dispatchEvent('offline');
        
        // Update UI
        this.updateNetworkStatus(false);
    }

    handleInstallPrompt(event) {
        // Prevent default install prompt
        event.preventDefault();
        
        // Store the event for later use
        this.deferredPrompt = event;
        
        // Show custom install prompt
        if (this.options.showInstallPrompt) {
            this.showInstallPrompt();
        }
        
        console.log('[PWA] Install prompt available');
    }

    handleAppInstalled() {
        this.isInstalled = true;
        this.deferredPrompt = null;
        
        console.log('[PWA] App installed');
        this.dispatchEvent('installed');
        
        // Hide install prompt
        this.hideInstallPrompt();
    }

    handleServiceWorkerUpdate() {
        const newWorker = this.registration.installing;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                    // New service worker available
                    console.log('[PWA] New service worker available');
                    this.showUpdatePrompt();
                } else {
                    // Service worker installed for first time
                    console.log('[PWA] Service worker installed');
                }
            }
        });
    }

    async showInstallPrompt() {
        if (!this.deferredPrompt) return;

        const installPrompt = this.createInstallPrompt();
        document.body.appendChild(installPrompt);
    }

    createInstallPrompt() {
        const prompt = document.createElement('div');
        prompt.id = 'pwa-install-prompt';
        prompt.innerHTML = `
            <div class="pwa-prompt-overlay">
                <div class="pwa-prompt-content">
                    <h3>Install App</h3>
                    <p>Install this app for a better experience with offline access and faster loading.</p>
                    <div class="pwa-prompt-actions">
                        <button id="pwa-install-dismiss">Not Now</button>
                        <button id="pwa-install-accept">Install</button>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .pwa-prompt-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            .pwa-prompt-content {
                background: white;
                padding: 20px;
                border-radius: 8px;
                max-width: 400px;
                margin: 20px;
                text-align: center;
            }
            .pwa-prompt-actions {
                margin-top: 20px;
                display: flex;
                gap: 10px;
                justify-content: center;
            }
            .pwa-prompt-actions button {
                padding: 10px 20px;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
            }
            #pwa-install-accept {
                background: #007bff;
                color: white;
                border-color: #007bff;
            }
        `;
        prompt.appendChild(style);

        // Add event listeners
        prompt.querySelector('#pwa-install-dismiss').addEventListener('click', () => {
            this.hideInstallPrompt();
        });

        prompt.querySelector('#pwa-install-accept').addEventListener('click', () => {
            this.installApp();
        });

        return prompt;
    }

    async installApp() {
        if (!this.deferredPrompt) return;

        try {
            // Show install prompt
            const result = await this.deferredPrompt.prompt();
            console.log('[PWA] Install prompt result:', result);
            
            // Wait for user choice
            const choiceResult = await this.deferredPrompt.userChoice;
            console.log('[PWA] User choice:', choiceResult.outcome);
            
            this.deferredPrompt = null;
            this.hideInstallPrompt();
        } catch (error) {
            console.error('[PWA] Install failed:', error);
        }
    }

    hideInstallPrompt() {
        const prompt = document.getElementById('pwa-install-prompt');
        if (prompt) {
            prompt.remove();
        }
    }

    showUpdatePrompt() {
        const updatePrompt = this.createUpdatePrompt();
        document.body.appendChild(updatePrompt);
    }

    createUpdatePrompt() {
        const prompt = document.createElement('div');
        prompt.id = 'pwa-update-prompt';
        prompt.innerHTML = `
            <div class="pwa-update-banner">
                <span>A new version is available!</span>
                <button id="pwa-update-refresh">Refresh</button>
                <button id="pwa-update-dismiss">×</button>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .pwa-update-banner {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #28a745;
                color: white;
                padding: 10px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                z-index: 10000;
                font-family: Arial, sans-serif;
            }
            .pwa-update-banner button {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 5px 15px;
                border-radius: 4px;
                cursor: pointer;
                margin-left: 10px;
            }
            .pwa-update-banner button:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            #pwa-update-dismiss {
                width: 30px;
                padding: 5px;
            }
        `;
        prompt.appendChild(style);

        // Add event listeners
        prompt.querySelector('#pwa-update-refresh').addEventListener('click', () => {
            this.updateApp();
        });

        prompt.querySelector('#pwa-update-dismiss').addEventListener('click', () => {
            prompt.remove();
        });

        return prompt;
    }

    async updateApp() {
        if (!this.registration || !this.registration.waiting) return;

        try {
            // Tell waiting service worker to skip waiting
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            
            // Reload page to activate new service worker
            window.location.reload();
        } catch (error) {
            console.error('[PWA] Update failed:', error);
        }
    }

    async checkForUpdates() {
        if (!this.registration) return;

        try {
            await this.registration.update();
        } catch (error) {
            console.error('[PWA] Update check failed:', error);
        }
    }

    setupBackgroundSync() {
        if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
            console.warn('[PWA] Background Sync not supported');
            return;
        }

        console.log('[PWA] Background Sync enabled');
    }

    async addToSyncQueue(data) {
        if (!this.isOnline) {
            // Store for background sync
            this.syncQueue.push({
                id: Date.now() + Math.random(),
                ...data,
                timestamp: Date.now()
            });

            // Register background sync
            if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.sync.register('background-sync');
                    console.log('[PWA] Queued for background sync');
                } catch (error) {
                    console.error('[PWA] Background sync registration failed:', error);
                }
            }
        } else {
            // Process immediately
            return this.processSyncItem(data);
        }
    }

    async processSyncQueue() {
        if (!this.isOnline || this.syncQueue.length === 0) return;

        console.log('[PWA] Processing sync queue:', this.syncQueue.length, 'items');

        const itemsToProcess = [...this.syncQueue];
        this.syncQueue = [];

        for (const item of itemsToProcess) {
            try {
                await this.processSyncItem(item);
            } catch (error) {
                console.error('[PWA] Sync item failed:', error);
                // Re-queue failed items
                this.syncQueue.push(item);
            }
        }
    }

    async processSyncItem(item) {
        // Override this method in your app
        console.log('[PWA] Processing sync item:', item);
        
        return fetch(item.url, {
            method: item.method || 'POST',
            headers: item.headers || { 'Content-Type': 'application/json' },
            body: item.body
        });
    }

    checkInstallationStatus() {
        // Check if running as installed app
        this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone ||
                          document.referrer.includes('android-app://');

        console.log('[PWA] Installation status:', this.isInstalled);
    }

    updateNetworkStatus(isOnline) {
        // Update UI to show network status
        const statusElement = document.querySelector('.network-status');
        if (statusElement) {
            statusElement.textContent = isOnline ? 'Online' : 'Offline';
            statusElement.className = `network-status ${isOnline ? 'online' : 'offline'}`;
        }

        // Add/remove offline class to body
        document.body.classList.toggle('app-offline', !isOnline);
    }

    async requestNotificationPermission() {
        if (!this.options.enableNotifications || !('Notification' in window)) {
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            console.log('[PWA] Notification permission:', permission);
            return permission === 'granted';
        } catch (error) {
            console.error('[PWA] Notification permission failed:', error);
            return false;
        }
    }

    async showNotification(title, options = {}) {
        if (!this.registration || Notification.permission !== 'granted') {
            return;
        }

        const defaultOptions = {
            body: '',
            icon: '/images/icons/icon-192x192.png',
            badge: '/images/icons/badge-72x72.png',
            tag: 'default',
            requireInteraction: false
        };

        try {
            return this.registration.showNotification(title, {
                ...defaultOptions,
                ...options
            });
        } catch (error) {
            console.error('[PWA] Show notification failed:', error);
        }
    }

    async getCacheStatus() {
        if (!this.registration || !this.registration.active) {
            return null;
        }

        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data);
            };

            this.registration.active.postMessage(
                { type: 'GET_CACHE_STATUS' },
                [messageChannel.port2]
            );
        });
    }

    async clearCache() {
        if (!this.registration || !this.registration.active) {
            return false;
        }

        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data.success);
            };

            this.registration.active.postMessage(
                { type: 'CLEAR_CACHE' },
                [messageChannel.port2]
            );
        });
    }

    dispatchEvent(eventName, data = {}) {
        const event = new CustomEvent(`pwa:${eventName}`, {
            detail: data
        });
        window.dispatchEvent(event);
    }

    // Utility methods
    isStandalone() {
        return this.isInstalled;
    }

    getInstallStatus() {
        return {
            isInstalled: this.isInstalled,
            canInstall: !!this.deferredPrompt,
            isOnline: this.isOnline
        };
    }

    getSyncQueueStatus() {
        return {
            pending: this.syncQueue.length,
            items: this.syncQueue
        };
    }
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
    window.PWAManager = PWAManager;
    
    // Auto-start PWA manager
    window.addEventListener('DOMContentLoaded', () => {
        window.pwaManager = new PWAManager();
    });
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAManager;
}