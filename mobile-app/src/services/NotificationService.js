/**
 * Mobile Notification Service
 * Handles push notifications, local notifications, and notification management
 */

import { Platform, Alert } from 'react-native';
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class NotificationService {
    constructor(options = {}) {
        this.options = {
            requestPermissions: true,
            showAlert: true,
            showBadge: true,
            showSound: true,
            soundName: 'default',
            largeIcon: 'ic_launcher',
            smallIcon: 'ic_notification',
            ...options
        };

        this.isInitialized = false;
        this.token = null;
        this.badges = 0;
        this.notificationHandlers = new Map();
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Request permissions
            if (this.options.requestPermissions) {
                await this.requestPermissions();
            }

            // Configure notifications
            await this.configure();

            // Get FCM token
            await this.getFCMToken();

            // Setup background handlers
            this.setupBackgroundHandlers();

            this.isInitialized = true;
            console.log('[Notifications] Service initialized');
        } catch (error) {
            console.error('[Notifications] Initialization failed:', error);
        }
    }

    async requestPermissions() {
        try {
            if (Platform.OS === 'ios') {
                const authStatus = await messaging().requestPermission();
                const enabled =
                    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

                if (!enabled) {
                    throw new Error('Permission not granted');
                }

                console.log('[Notifications] iOS permissions granted');
            } else {
                // Android permissions are handled by the manifest
                console.log('[Notifications] Android permissions assumed');
            }

            return true;
        } catch (error) {
            console.error('[Notifications] Permission request failed:', error);
            return false;
        }
    }

    async configure() {
        // Configure react-native-push-notification
        PushNotification.configure({
            onRegister: (token) => {
                console.log('[Notifications] Device registered:', token);
                this.token = token.token;
            },

            onNotification: (notification) => {
                console.log('[Notifications] Received:', notification);
                this.handleNotification(notification);

                // Required on iOS only
                if (Platform.OS === 'ios') {
                    notification.finish(PushNotificationIOS.FetchResult.NoData);
                }
            },

            onAction: (notification) => {
                console.log('[Notifications] Action:', notification.action);
                this.handleNotificationAction(notification);
            },

            onRegistrationError: (error) => {
                console.error('[Notifications] Registration error:', error);
            },

            permissions: {
                alert: this.options.showAlert,
                badge: this.options.showBadge,
                sound: this.options.showSound,
            },

            popInitialNotification: true,
            requestPermissions: Platform.OS === 'ios',
        });

        // Create default channel for Android
        if (Platform.OS === 'android') {
            PushNotification.createChannel(
                {
                    channelId: 'default-channel',
                    channelName: 'Default Channel',
                    channelDescription: 'Default notification channel',
                    playSound: true,
                    soundName: 'default',
                    importance: 4,
                    vibrate: true,
                },
                (created) => console.log(`[Notifications] Channel created: ${created}`)
            );
        }
    }

    async getFCMToken() {
        try {
            // Check if app has been opened from a notification
            const initialNotification = await messaging().getInitialNotification();
            if (initialNotification) {
                console.log('[Notifications] App opened from notification:', initialNotification);
                this.handleNotification(initialNotification);
            }

            // Get FCM token
            const fcmToken = await messaging().getToken();
            if (fcmToken) {
                console.log('[Notifications] FCM Token:', fcmToken);
                await this.storeFCMToken(fcmToken);
                this.token = fcmToken;
            }

            // Listen for token refresh
            messaging().onTokenRefresh(async (newToken) => {
                console.log('[Notifications] Token refreshed:', newToken);
                await this.storeFCMToken(newToken);
                this.token = newToken;
            });

        } catch (error) {
            console.error('[Notifications] FCM token error:', error);
        }
    }

    setupBackgroundHandlers() {
        // Background message handler
        messaging().setBackgroundMessageHandler(async (remoteMessage) => {
            console.log('[Notifications] Background message:', remoteMessage);
            await this.handleBackgroundMessage(remoteMessage);
        });

        // Foreground message handler
        messaging().onMessage(async (remoteMessage) => {
            console.log('[Notifications] Foreground message:', remoteMessage);
            await this.handleForegroundMessage(remoteMessage);
        });

        // Notification opened handler
        messaging().onNotificationOpenedApp((remoteMessage) => {
            console.log('[Notifications] Opened from background:', remoteMessage);
            this.handleNotificationOpened(remoteMessage);
        });
    }

    async storeFCMToken(token) {
        try {
            await AsyncStorage.setItem('fcm_token', token);
            
            // Send token to server
            // await this.sendTokenToServer(token);
        } catch (error) {
            console.error('[Notifications] Failed to store FCM token:', error);
        }
    }

    // Local Notifications
    scheduleLocalNotification(options = {}) {
        const {
            id = Date.now(),
            title = 'Notification',
            message = '',
            date = new Date(Date.now() + 5000), // 5 seconds from now
            repeatType = 'time',
            actions = [],
            userInfo = {},
            ...otherOptions
        } = options;

        PushNotification.localNotificationSchedule({
            id: id.toString(),
            title,
            message,
            date,
            repeatType,
            actions,
            userInfo,
            channelId: 'default-channel',
            largeIcon: this.options.largeIcon,
            smallIcon: this.options.smallIcon,
            soundName: this.options.soundName,
            ...otherOptions
        });

        console.log(`[Notifications] Scheduled local notification: ${id}`);
        return id;
    }

    showLocalNotification(options = {}) {
        const {
            id = Date.now(),
            title = 'Notification',
            message = '',
            actions = [],
            userInfo = {},
            autoCancel = true,
            ...otherOptions
        } = options;

        PushNotification.localNotification({
            id: id.toString(),
            title,
            message,
            actions,
            userInfo,
            autoCancel,
            channelId: 'default-channel',
            largeIcon: this.options.largeIcon,
            smallIcon: this.options.smallIcon,
            soundName: this.options.soundName,
            ...otherOptions
        });

        console.log(`[Notifications] Showed local notification: ${id}`);
        return id;
    }

    cancelLocalNotification(id) {
        PushNotification.cancelLocalNotifications({ id: id.toString() });
        console.log(`[Notifications] Cancelled local notification: ${id}`);
    }

    cancelAllLocalNotifications() {
        PushNotification.cancelAllLocalNotifications();
        console.log('[Notifications] Cancelled all local notifications');
    }

    // Push Notifications
    async subscribeTopic(topic) {
        try {
            await messaging().subscribeToTopic(topic);
            console.log(`[Notifications] Subscribed to topic: ${topic}`);
        } catch (error) {
            console.error(`[Notifications] Topic subscription failed:`, error);
        }
    }

    async unsubscribeFromTopic(topic) {
        try {
            await messaging().unsubscribeFromTopic(topic);
            console.log(`[Notifications] Unsubscribed from topic: ${topic}`);
        } catch (error) {
            console.error(`[Notifications] Topic unsubscription failed:`, error);
        }
    }

    // Badge Management
    setBadgeCount(count) {
        this.badges = count;
        
        if (Platform.OS === 'ios') {
            PushNotificationIOS.setApplicationIconBadgeNumber(count);
        } else {
            // Android badge management requires additional setup
            console.log(`[Notifications] Badge count set to: ${count}`);
        }
    }

    getBadgeCount() {
        return this.badges;
    }

    clearBadge() {
        this.setBadgeCount(0);
    }

    incrementBadge() {
        this.setBadgeCount(this.badges + 1);
    }

    // Notification Channels (Android)
    createChannel(channelConfig) {
        if (Platform.OS === 'android') {
            PushNotification.createChannel(channelConfig, (created) => {
                console.log(`[Notifications] Channel created: ${channelConfig.channelId} - ${created}`);
            });
        }
    }

    deleteChannel(channelId) {
        if (Platform.OS === 'android') {
            PushNotification.deleteChannel(channelId);
            console.log(`[Notifications] Channel deleted: ${channelId}`);
        }
    }

    // Notification Handlers
    addNotificationHandler(type, handler) {
        if (!this.notificationHandlers.has(type)) {
            this.notificationHandlers.set(type, []);
        }
        this.notificationHandlers.get(type).push(handler);
    }

    removeNotificationHandler(type, handler) {
        const handlers = this.notificationHandlers.get(type);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    async handleNotification(notification) {
        try {
            // Update badge
            this.incrementBadge();

            // Call registered handlers
            const handlers = this.notificationHandlers.get('received') || [];
            for (const handler of handlers) {
                await handler(notification);
            }

            // Store notification for history
            await this.storeNotification(notification);
        } catch (error) {
            console.error('[Notifications] Handle notification error:', error);
        }
    }

    async handleNotificationAction(notification) {
        try {
            const handlers = this.notificationHandlers.get('action') || [];
            for (const handler of handlers) {
                await handler(notification);
            }
        } catch (error) {
            console.error('[Notifications] Handle action error:', error);
        }
    }

    async handleBackgroundMessage(remoteMessage) {
        // Process background message
        console.log('[Notifications] Processing background message');
        
        // Store for later processing
        await this.storeNotification({
            ...remoteMessage,
            receivedInBackground: true,
            timestamp: Date.now()
        });
    }

    async handleForegroundMessage(remoteMessage) {
        // Show local notification for foreground messages
        this.showLocalNotification({
            title: remoteMessage.notification?.title || 'New Message',
            message: remoteMessage.notification?.body || '',
            userInfo: remoteMessage.data || {}
        });
    }

    handleNotificationOpened(remoteMessage) {
        // Handle notification tap
        const handlers = this.notificationHandlers.get('opened') || [];
        handlers.forEach(handler => handler(remoteMessage));
    }

    // Notification History
    async storeNotification(notification) {
        try {
            const history = await this.getNotificationHistory();
            const newNotification = {
                id: Date.now().toString(),
                ...notification,
                timestamp: notification.timestamp || Date.now(),
                read: false
            };

            history.unshift(newNotification);
            
            // Keep only last 100 notifications
            const trimmedHistory = history.slice(0, 100);
            
            await AsyncStorage.setItem('notification_history', JSON.stringify(trimmedHistory));
        } catch (error) {
            console.error('[Notifications] Failed to store notification:', error);
        }
    }

    async getNotificationHistory() {
        try {
            const history = await AsyncStorage.getItem('notification_history');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('[Notifications] Failed to get notification history:', error);
            return [];
        }
    }

    async markNotificationAsRead(id) {
        try {
            const history = await this.getNotificationHistory();
            const notification = history.find(n => n.id === id);
            
            if (notification) {
                notification.read = true;
                await AsyncStorage.setItem('notification_history', JSON.stringify(history));
            }
        } catch (error) {
            console.error('[Notifications] Failed to mark notification as read:', error);
        }
    }

    async clearNotificationHistory() {
        try {
            await AsyncStorage.removeItem('notification_history');
            console.log('[Notifications] History cleared');
        } catch (error) {
            console.error('[Notifications] Failed to clear history:', error);
        }
    }

    // Utility Methods
    async getPermissionStatus() {
        try {
            if (Platform.OS === 'ios') {
                const authStatus = await messaging().hasPermission();
                return {
                    granted: authStatus === messaging.AuthorizationStatus.AUTHORIZED,
                    provisional: authStatus === messaging.AuthorizationStatus.PROVISIONAL,
                    denied: authStatus === messaging.AuthorizationStatus.DENIED
                };
            } else {
                // Android permission check
                return { granted: true }; // Simplified for template
            }
        } catch (error) {
            console.error('[Notifications] Permission check failed:', error);
            return { granted: false };
        }
    }

    getToken() {
        return this.token;
    }

    async sendTokenToServer(token) {
        // Implement server communication
        try {
            // Example API call
            // await fetch('/api/device-token', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ token })
            // });
            
            console.log('[Notifications] Token sent to server');
        } catch (error) {
            console.error('[Notifications] Failed to send token to server:', error);
        }
    }

    // Notification Templates
    createReminderNotification(title, message, date) {
        return this.scheduleLocalNotification({
            title,
            message,
            date,
            actions: ['View', 'Dismiss'],
            repeatType: 'day'
        });
    }

    createNewsNotification(title, message, articleId) {
        return this.showLocalNotification({
            title,
            message,
            userInfo: { type: 'news', articleId },
            actions: ['Read', 'Save', 'Dismiss']
        });
    }

    createChatNotification(senderName, message, chatId) {
        return this.showLocalNotification({
            title: senderName,
            message,
            userInfo: { type: 'chat', chatId },
            actions: ['Reply', 'View']
        });
    }
}