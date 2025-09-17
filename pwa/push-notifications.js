/**
 * Push Notification Manager
 * Handles push notifications, subscriptions, and user engagement
 */

class PushNotificationManager {
    constructor(options = {}) {
        this.options = {
            publicVapidKey: options.publicVapidKey || '',
            apiEndpoint: options.apiEndpoint || '/api/notifications',
            enableAutoSubscribe: options.enableAutoSubscribe || false,
            enableNotificationScheduling: options.enableNotificationScheduling || true,
            ...options
        };

        this.subscription = null;
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
        this.permission = Notification.permission;

        this.init();
    }

    async init() {
        if (!this.isSupported) {
            console.warn('[Push] Push notifications not supported');
            return;
        }

        try {
            // Get existing subscription
            await this.getExistingSubscription();
            
            // Auto-subscribe if enabled and permission granted
            if (this.options.enableAutoSubscribe && this.permission === 'granted') {
                await this.subscribe();
            }

            console.log('[Push] Push Notification Manager initialized');
        } catch (error) {
            console.error('[Push] Initialization failed:', error);
        }
    }

    async getExistingSubscription() {
        try {
            const registration = await navigator.serviceWorker.ready;
            this.subscription = await registration.pushManager.getSubscription();
            console.log('[Push] Existing subscription:', !!this.subscription);
            return this.subscription;
        } catch (error) {
            console.error('[Push] Failed to get existing subscription:', error);
            return null;
        }
    }

    async requestPermission() {
        if (!this.isSupported) {
            throw new Error('Push notifications not supported');
        }

        try {
            this.permission = await Notification.requestPermission();
            console.log('[Push] Permission:', this.permission);
            
            if (this.permission === 'granted') {
                this.dispatchEvent('permission-granted');
            } else if (this.permission === 'denied') {
                this.dispatchEvent('permission-denied');
            }
            
            return this.permission;
        } catch (error) {
            console.error('[Push] Permission request failed:', error);
            throw error;
        }
    }

    async subscribe() {
        if (!this.isSupported || this.permission !== 'granted') {
            throw new Error('Cannot subscribe: permission not granted');
        }

        if (this.subscription) {
            console.log('[Push] Already subscribed');
            return this.subscription;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            
            this.subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.options.publicVapidKey)
            });

            console.log('[Push] Subscribed successfully');
            
            // Send subscription to server
            await this.sendSubscriptionToServer(this.subscription);
            
            this.dispatchEvent('subscribed', { subscription: this.subscription });
            
            return this.subscription;
        } catch (error) {
            console.error('[Push] Subscription failed:', error);
            throw error;
        }
    }

    async unsubscribe() {
        if (!this.subscription) {
            console.log('[Push] No active subscription');
            return true;
        }

        try {
            const success = await this.subscription.unsubscribe();
            
            if (success) {
                // Remove subscription from server
                await this.removeSubscriptionFromServer(this.subscription);
                
                this.subscription = null;
                console.log('[Push] Unsubscribed successfully');
                this.dispatchEvent('unsubscribed');
            }
            
            return success;
        } catch (error) {
            console.error('[Push] Unsubscribe failed:', error);
            throw error;
        }
    }

    async sendSubscriptionToServer(subscription) {
        try {
            const response = await fetch(`${this.options.apiEndpoint}/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    userAgent: navigator.userAgent,
                    timestamp: Date.now()
                })
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const result = await response.json();
            console.log('[Push] Subscription sent to server:', result);
            return result;
        } catch (error) {
            console.error('[Push] Failed to send subscription to server:', error);
            throw error;
        }
    }

    async removeSubscriptionFromServer(subscription) {
        try {
            const response = await fetch(`${this.options.apiEndpoint}/unsubscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    endpoint: subscription.endpoint
                })
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const result = await response.json();
            console.log('[Push] Subscription removed from server:', result);
            return result;
        } catch (error) {
            console.error('[Push] Failed to remove subscription from server:', error);
            throw error;
        }
    }

    async sendNotification(notification) {
        if (!this.subscription) {
            throw new Error('No active subscription');
        }

        try {
            const response = await fetch(`${this.options.apiEndpoint}/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subscription: this.subscription.toJSON(),
                    notification: {
                        title: notification.title,
                        body: notification.body,
                        icon: notification.icon || '/images/icons/icon-192x192.png',
                        badge: notification.badge || '/images/icons/badge-72x72.png',
                        tag: notification.tag || 'default',
                        data: notification.data || {},
                        actions: notification.actions || [],
                        requireInteraction: notification.requireInteraction || false,
                        silent: notification.silent || false,
                        timestamp: notification.timestamp || Date.now(),
                        ttl: notification.ttl || 86400 // 24 hours
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const result = await response.json();
            console.log('[Push] Notification sent:', result);
            return result;
        } catch (error) {
            console.error('[Push] Failed to send notification:', error);
            throw error;
        }
    }

    async scheduleNotification(notification, scheduledTime) {
        if (!this.options.enableNotificationScheduling) {
            throw new Error('Notification scheduling is disabled');
        }

        try {
            const response = await fetch(`${this.options.apiEndpoint}/schedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subscription: this.subscription.toJSON(),
                    notification,
                    scheduledTime: new Date(scheduledTime).toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const result = await response.json();
            console.log('[Push] Notification scheduled:', result);
            return result;
        } catch (error) {
            console.error('[Push] Failed to schedule notification:', error);
            throw error;
        }
    }

    async getNotificationHistory() {
        try {
            const response = await fetch(`${this.options.apiEndpoint}/history`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const history = await response.json();
            console.log('[Push] Notification history retrieved');
            return history;
        } catch (error) {
            console.error('[Push] Failed to get notification history:', error);
            throw error;
        }
    }

    // Local notification (when app is in foreground)
    async showLocalNotification(title, options = {}) {
        if (this.permission !== 'granted') {
            throw new Error('Notification permission not granted');
        }

        const defaultOptions = {
            body: '',
            icon: '/images/icons/icon-192x192.png',
            badge: '/images/icons/badge-72x72.png',
            tag: 'local',
            requireInteraction: false,
            silent: false
        };

        try {
            const notification = new Notification(title, {
                ...defaultOptions,
                ...options
            });

            // Auto-close after specified time
            if (options.autoClose !== false) {
                setTimeout(() => {
                    notification.close();
                }, options.autoClose || 5000);
            }

            // Handle click
            notification.onclick = (event) => {
                event.preventDefault();
                
                if (options.onClick) {
                    options.onClick(event);
                } else if (options.url) {
                    window.open(options.url, '_blank');
                }
                
                notification.close();
            };

            return notification;
        } catch (error) {
            console.error('[Push] Local notification failed:', error);
            throw error;
        }
    }

    // Utility method to create notification actions
    createNotificationActions() {
        return [
            {
                action: 'view',
                title: 'View',
                icon: '/images/icons/view-icon.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/images/icons/dismiss-icon.png'
            },
            {
                action: 'reply',
                title: 'Reply',
                icon: '/images/icons/reply-icon.png',
                type: 'text',
                placeholder: 'Type your reply...'
            }
        ];
    }

    // Convert VAPID public key
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Permission status helpers
    isPermissionGranted() {
        return this.permission === 'granted';
    }

    isPermissionDenied() {
        return this.permission === 'denied';
    }

    isPermissionDefault() {
        return this.permission === 'default';
    }

    // Subscription status helpers
    isSubscribed() {
        return !!this.subscription;
    }

    getSubscriptionInfo() {
        if (!this.subscription) return null;

        return {
            endpoint: this.subscription.endpoint,
            keys: this.subscription.getKey ? {
                p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')),
                auth: this.arrayBufferToBase64(this.subscription.getKey('auth'))
            } : null,
            expirationTime: this.subscription.expirationTime
        };
    }

    arrayBufferToBase64(buffer) {
        const binary = String.fromCharCode(...new Uint8Array(buffer));
        return window.btoa(binary);
    }

    // Event dispatcher
    dispatchEvent(eventName, data = {}) {
        const event = new CustomEvent(`push:${eventName}`, {
            detail: data
        });
        window.dispatchEvent(event);
    }

    // Feature detection
    static isSupported() {
        return 'serviceWorker' in navigator && 
               'PushManager' in window && 
               'Notification' in window;
    }

    // Get permission status without requesting
    static getPermissionStatus() {
        return Notification.permission;
    }
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
    window.PushNotificationManager = PushNotificationManager;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PushNotificationManager;
}