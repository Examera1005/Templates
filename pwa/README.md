# PWA Templates

Complete Progressive Web App templates with service workers, offline functionality, push notifications, and app installation capabilities.

## Features

- **Service Worker**: Advanced caching, offline functionality, background sync
- **App Installation**: Native app-like installation with beforeinstallprompt handling
- **Push Notifications**: Full push notification system with VAPID support
- **Offline Support**: Comprehensive offline functionality with cached content
- **Background Sync**: Queue and sync data when connection is restored
- **App Manifest**: Complete manifest with icons, shortcuts, and app metadata
- **Network Detection**: Online/offline status management
- **Cache Management**: Dynamic cache updates and size monitoring

## Quick Start

### 1. Basic PWA Setup

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My PWA</title>
    
    <!-- PWA Meta Tags -->
    <meta name="theme-color" content="#007bff">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    
    <!-- Manifest -->
    <link rel="manifest" href="/manifest.json">
    
    <!-- Icons -->
    <link rel="apple-touch-icon" href="/images/icons/icon-192x192.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/images/icons/icon-32x32.png">
</head>
<body>
    <h1>My Progressive Web App</h1>
    
    <script src="pwa-manager.js"></script>
    <script>
        // Initialize PWA
        const pwa = new PWAManager({
            updateCheckInterval: 30000,
            enableNotifications: true,
            showInstallPrompt: true
        });
    </script>
</body>
</html>
```

### 2. Service Worker Registration

```javascript
// Auto-registered by PWAManager, or manually:
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
            console.log('SW registered:', registration);
        })
        .catch(error => {
            console.log('SW registration failed:', error);
        });
}
```

### 3. Push Notifications Setup

```javascript
const pushManager = new PushNotificationManager({
    publicVapidKey: 'YOUR_VAPID_PUBLIC_KEY',
    apiEndpoint: '/api/notifications'
});

// Request permission and subscribe
await pushManager.requestPermission();
await pushManager.subscribe();

// Send notification
await pushManager.sendNotification({
    title: 'Hello!',
    body: 'This is a push notification',
    icon: '/images/icons/icon-192x192.png'
});
```

## PWA Manager Usage

### Initialization

```javascript
const pwaManager = new PWAManager({
    updateCheckInterval: 30000,      // Check for updates every 30 seconds
    enableNotifications: true,       // Enable push notifications
    enableBackgroundSync: true,      // Enable background sync
    showInstallPrompt: true          // Show install prompt automatically
});
```

### Installation Management

```javascript
// Check installation status
const status = pwaManager.getInstallStatus();
console.log('Can install:', status.canInstall);
console.log('Is installed:', status.isInstalled);

// Manually trigger install
await pwaManager.installApp();

// Listen for installation events
window.addEventListener('pwa:installed', () => {
    console.log('App was installed!');
});
```

### Network Status

```javascript
// Listen for network changes
window.addEventListener('pwa:online', () => {
    console.log('App is back online');
});

window.addEventListener('pwa:offline', () => {
    console.log('App went offline');
});

// Check current status
console.log('Online:', pwaManager.isOnline);
```

### Background Sync

```javascript
// Add data to sync queue (when offline)
await pwaManager.addToSyncQueue({
    url: '/api/data',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: 'to sync' })
});

// Check sync queue status
const syncStatus = pwaManager.getSyncQueueStatus();
console.log('Pending items:', syncStatus.pending);
```

### Cache Management

```javascript
// Get cache information
const cacheStatus = await pwaManager.getCacheStatus();
console.log('Cached files:', cacheStatus.files);
console.log('Cache size:', cacheStatus.sizeFormatted);

// Clear cache
await pwaManager.clearCache();

// Check for updates
await pwaManager.checkForUpdates();
```

## Service Worker Features

### Caching Strategies

```javascript
// The service worker implements multiple caching strategies:

// 1. Cache First (for static assets)
// - Serves from cache if available
// - Falls back to network if not cached

// 2. Network First (for API requests)
// - Tries network first
// - Falls back to cache if offline
// - Caches successful responses

// 3. Stale While Revalidate (for pages)
// - Serves from cache immediately
// - Updates cache in background
```

### Custom Cache Management

```javascript
// In your service worker, extend the ServiceWorkerManager:
class CustomServiceWorker extends ServiceWorkerManager {
    async handleApiRequest(request) {
        // Custom API request handling
        try {
            const response = await fetch(request);
            
            // Custom caching logic
            if (response.status === 200) {
                const cache = await caches.open('api-cache');
                cache.put(request.url, response.clone());
            }
            
            return response;
        } catch (error) {
            // Custom offline handling
            return caches.match(request) || 
                   new Response('{"error": "offline"}', {
                       headers: { 'Content-Type': 'application/json' }
                   });
        }
    }
}
```

## Push Notifications

### Server Setup (Node.js/Express)

```javascript
const webpush = require('web-push');

// Set VAPID keys
webpush.setVapidDetails(
    'mailto:your-email@example.com',
    'YOUR_PUBLIC_VAPID_KEY',
    'YOUR_PRIVATE_VAPID_KEY'
);

// Subscribe endpoint
app.post('/api/notifications/subscribe', (req, res) => {
    const subscription = req.body.subscription;
    
    // Save subscription to database
    saveSubscription(subscription);
    
    res.json({ success: true });
});

// Send notification endpoint
app.post('/api/notifications/send', async (req, res) => {
    const { subscription, notification } = req.body;
    
    try {
        await webpush.sendNotification(subscription, JSON.stringify(notification));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### Advanced Notifications

```javascript
// Notification with actions
await pushManager.sendNotification({
    title: 'New Message',
    body: 'You have received a new message',
    icon: '/images/icons/icon-192x192.png',
    badge: '/images/icons/badge-72x72.png',
    tag: 'message',
    requireInteraction: true,
    actions: [
        {
            action: 'reply',
            title: 'Reply',
            icon: '/images/icons/reply.png'
        },
        {
            action: 'view',
            title: 'View',
            icon: '/images/icons/view.png'
        }
    ],
    data: {
        messageId: 123,
        url: '/messages/123'
    }
});

// Scheduled notifications
await pushManager.scheduleNotification({
    title: 'Reminder',
    body: 'Don\'t forget your appointment'
}, new Date(Date.now() + 3600000)); // 1 hour from now
```

### Notification Handling

```javascript
// In service worker - handle notification clicks
self.addEventListener('notificationclick', (event) => {
    const { notification } = event;
    const action = event.action;
    
    notification.close();
    
    switch (action) {
        case 'reply':
            // Handle reply action
            clients.openWindow('/reply?id=' + notification.data.messageId);
            break;
        case 'view':
            // Handle view action
            clients.openWindow(notification.data.url);
            break;
        default:
            // Default click action
            clients.openWindow('/');
    }
});
```

## Manifest Configuration

### Basic Manifest

```json
{
    "name": "My Progressive Web App",
    "short_name": "MyPWA",
    "description": "A great PWA experience",
    "start_url": "/",
    "display": "standalone",
    "orientation": "portrait-primary",
    "theme_color": "#007bff",
    "background_color": "#ffffff",
    "scope": "/",
    "icons": [
        {
            "src": "/images/icons/icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any"
        },
        {
            "src": "/images/icons/icon-512x512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any"
        }
    ]
}
```

### Advanced Manifest Features

```json
{
    "shortcuts": [
        {
            "name": "Dashboard",
            "url": "/dashboard",
            "icons": [{ "src": "/images/shortcuts/dashboard.png", "sizes": "96x96" }]
        }
    ],
    "share_target": {
        "action": "/share",
        "method": "POST",
        "enctype": "multipart/form-data",
        "params": {
            "title": "title",
            "text": "text",
            "url": "url",
            "files": [{ "name": "files", "accept": ["image/*"] }]
        }
    },
    "file_handlers": [
        {
            "action": "/open-file",
            "accept": {
                "text/plain": [".txt"],
                "image/*": [".png", ".jpg"]
            }
        }
    ]
}
```

## Offline Functionality

### Offline Page

```html
<!DOCTYPE html>
<html>
<head>
    <title>You're Offline</title>
</head>
<body>
    <h1>You're Offline</h1>
    <p>This app is designed to work offline with cached content.</p>
    <button onclick="location.reload()">Try Again</button>
    
    <script>
        // Automatically retry when back online
        window.addEventListener('online', () => {
            location.reload();
        });
    </script>
</body>
</html>
```

### Offline Data Management

```javascript
// Store data offline using IndexedDB
class OfflineStorage {
    constructor() {
        this.dbName = 'PWAOfflineDB';
        this.version = 1;
    }
    
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create stores
                if (!db.objectStoreNames.contains('data')) {
                    db.createObjectStore('data', { keyPath: 'id' });
                }
            };
        });
    }
    
    async saveData(data) {
        const db = await this.init();
        const transaction = db.transaction(['data'], 'readwrite');
        const store = transaction.objectStore('data');
        return store.put(data);
    }
    
    async getData(id) {
        const db = await this.init();
        const transaction = db.transaction(['data'], 'readonly');
        const store = transaction.objectStore('data');
        return store.get(id);
    }
}
```

## Best Practices

### Performance

1. **Minimize Cache Size**: Only cache essential resources
2. **Update Strategy**: Use appropriate cache update strategies
3. **Network Awareness**: Adapt behavior based on connection quality
4. **Background Processing**: Use background sync for non-critical operations

### User Experience

1. **Install Prompts**: Show install prompts at appropriate times
2. **Offline Indicators**: Clearly indicate offline status
3. **Progressive Enhancement**: Ensure core functionality works without JavaScript
4. **Loading States**: Show loading indicators for network operations

### Security

1. **HTTPS Only**: PWAs require HTTPS in production
2. **Content Security Policy**: Implement strict CSP headers
3. **Input Validation**: Validate all user inputs
4. **Secure Storage**: Use secure storage for sensitive data

### Testing

```javascript
// Test PWA features
describe('PWA Features', () => {
    test('Service Worker registers', async () => {
        const registration = await navigator.serviceWorker.register('/sw.js');
        expect(registration).toBeDefined();
    });
    
    test('App can be installed', () => {
        const pwa = new PWAManager();
        const status = pwa.getInstallStatus();
        expect(status.canInstall).toBe(true);
    });
    
    test('Notifications work', async () => {
        const pushManager = new PushNotificationManager();
        const permission = await pushManager.requestPermission();
        expect(permission).toBe('granted');
    });
});
```

## Browser Support

- **Service Workers**: Chrome 40+, Firefox 44+, Safari 11.1+
- **App Manifest**: Chrome 39+, Firefox 58+, Safari 15+
- **Push Notifications**: Chrome 42+, Firefox 44+, Safari 16+
- **Background Sync**: Chrome 49+, Limited Firefox support

## Deployment

### HTTPS Requirement

```bash
# Use Let's Encrypt for free SSL
certbot --nginx -d yourdomain.com
```

### Manifest Validation

```bash
# Use Chrome DevTools
# Application > Manifest
# Check for validation errors
```

### Service Worker Testing

```bash
# Chrome DevTools
# Application > Service Workers
# Test offline scenarios
```

## Troubleshooting

### Common Issues

1. **Service Worker Not Updating**: Clear cache or use skipWaiting()
2. **Install Prompt Not Showing**: Check manifest validation and HTTPS
3. **Notifications Not Working**: Verify VAPID keys and permissions
4. **Offline Mode Issues**: Check cache strategies and network handling

### Debug Tools

```javascript
// Service worker debugging
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('SW message:', event.data);
    });
}

// PWA audit in Chrome DevTools
// Lighthouse > Progressive Web App audit
```

## License

This PWA template library is provided as-is for educational and development purposes.