/**
 * React Native App Template
 * Complete mobile app foundation with navigation, state management, and native features
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Platform,
    Alert,
    BackHandler,
    Dimensions,
    AppState
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LoginScreen from './src/screens/LoginScreen';

// Import components
import LoadingScreen from './src/components/LoadingScreen';
import ErrorBoundary from './src/components/ErrorBoundary';
import NetworkStatus from './src/components/NetworkStatus';

// Import services
import { AuthService } from './src/services/AuthService';
import { StorageService } from './src/services/StorageService';
import { NotificationService } from './src/services/NotificationService';

// Import contexts
import { AuthContext } from './src/contexts/AuthContext';
import { ThemeContext } from './src/contexts/ThemeContext';

// Import themes
import { lightTheme, darkTheme } from './src/themes';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

class AppManager {
    constructor() {
        this.authService = new AuthService();
        this.storageService = new StorageService();
        this.notificationService = new NotificationService();
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Initialize services
            await this.authService.initialize();
            await this.storageService.initialize();
            await this.notificationService.initialize();

            // Setup network monitoring
            this.setupNetworkMonitoring();

            // Setup app state handling
            this.setupAppStateHandling();

            // Setup background tasks
            this.setupBackgroundTasks();

            this.isInitialized = true;
            console.log('[App] Initialized successfully');
        } catch (error) {
            console.error('[App] Initialization failed:', error);
            throw error;
        }
    }

    setupNetworkMonitoring() {
        NetInfo.addEventListener(state => {
            console.log('[Network] Connection type:', state.type);
            console.log('[Network] Is connected:', state.isConnected);
            
            if (!state.isConnected) {
                this.handleOfflineMode();
            } else {
                this.handleOnlineMode();
            }
        });
    }

    setupAppStateHandling() {
        AppState.addEventListener('change', (nextAppState) => {
            console.log('[App] State changed to:', nextAppState);
            
            switch (nextAppState) {
                case 'active':
                    this.handleAppActive();
                    break;
                case 'background':
                    this.handleAppBackground();
                    break;
                case 'inactive':
                    this.handleAppInactive();
                    break;
            }
        });
    }

    setupBackgroundTasks() {
        // Background sync, notifications, etc.
        if (Platform.OS === 'ios') {
            this.setupIOSBackgroundTasks();
        } else {
            this.setupAndroidBackgroundTasks();
        }
    }

    handleOfflineMode() {
        // Switch to offline mode
        this.storageService.setOfflineMode(true);
    }

    handleOnlineMode() {
        // Switch to online mode and sync
        this.storageService.setOfflineMode(false);
        this.syncOfflineData();
    }

    handleAppActive() {
        // App became active
        this.notificationService.clearBadge();
        this.checkForUpdates();
    }

    handleAppBackground() {
        // App went to background
        this.saveAppState();
    }

    handleAppInactive() {
        // App became inactive
        this.pauseOperations();
    }

    async syncOfflineData() {
        try {
            const offlineData = await this.storageService.getOfflineData();
            
            for (const item of offlineData) {
                await this.authService.syncData(item);
            }
            
            await this.storageService.clearOfflineData();
            console.log('[App] Offline data synced');
        } catch (error) {
            console.error('[App] Sync failed:', error);
        }
    }

    async saveAppState() {
        // Save current app state
        const appState = {
            timestamp: Date.now(),
            route: this.currentRoute,
            user: await this.authService.getCurrentUser()
        };
        
        await this.storageService.saveAppState(appState);
    }

    async restoreAppState() {
        try {
            const appState = await this.storageService.getAppState();
            if (appState) {
                console.log('[App] Restored state from:', new Date(appState.timestamp));
                return appState;
            }
        } catch (error) {
            console.error('[App] Failed to restore state:', error);
        }
        return null;
    }

    setupIOSBackgroundTasks() {
        // iOS specific background task setup
        console.log('[App] Setting up iOS background tasks');
    }

    setupAndroidBackgroundTasks() {
        // Android specific background task setup
        console.log('[App] Setting up Android background tasks');
    }

    async checkForUpdates() {
        // Check for app updates
        try {
            const updateInfo = await this.authService.checkForUpdates();
            if (updateInfo.hasUpdate) {
                this.showUpdatePrompt(updateInfo);
            }
        } catch (error) {
            console.error('[App] Update check failed:', error);
        }
    }

    showUpdatePrompt(updateInfo) {
        Alert.alert(
            'Update Available',
            `Version ${updateInfo.version} is available. Would you like to update?`,
            [
                { text: 'Later', style: 'cancel' },
                { text: 'Update', onPress: () => this.handleUpdate(updateInfo) }
            ]
        );
    }

    handleUpdate(updateInfo) {
        // Handle app update
        console.log('[App] Starting update:', updateInfo);
    }

    pauseOperations() {
        // Pause non-critical operations
        console.log('[App] Pausing operations');
    }
}

// Main Tab Navigator
function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#007bff',
                tabBarInactiveTintColor: '#6c757d',
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopColor: '#e9ecef',
                    paddingBottom: Platform.OS === 'ios' ? 20 : 5,
                    height: Platform.OS === 'ios' ? 80 : 60
                }
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Text style={{ color, fontSize: size }}>🏠</Text>
                    )
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Text style={{ color, fontSize: size }}>👤</Text>
                    )
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Text style={{ color, fontSize: size }}>⚙️</Text>
                    )
                }}
            />
        </Tab.Navigator>
    );
}

// Main App Component
export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState(lightTheme);
    const [error, setError] = useState(null);
    const [appManager] = useState(() => new AppManager());

    useEffect(() => {
        initializeApp();
        setupBackHandler();
        
        return () => {
            cleanupApp();
        };
    }, []);

    const initializeApp = async () => {
        try {
            setIsLoading(true);
            
            // Initialize app manager
            await appManager.initialize();
            
            // Check authentication status
            const authResult = await appManager.authService.checkAuthStatus();
            setIsAuthenticated(authResult.isAuthenticated);
            setUser(authResult.user);
            
            // Load user preferences
            await loadUserPreferences();
            
            // Restore app state if needed
            await appManager.restoreAppState();
            
            setIsLoading(false);
        } catch (error) {
            console.error('[App] Initialization error:', error);
            setError(error.message);
            setIsLoading(false);
        }
    };

    const loadUserPreferences = async () => {
        try {
            const preferences = await appManager.storageService.getUserPreferences();
            
            if (preferences.theme) {
                setTheme(preferences.theme === 'dark' ? darkTheme : lightTheme);
            }
        } catch (error) {
            console.error('[App] Failed to load preferences:', error);
        }
    };

    const setupBackHandler = () => {
        if (Platform.OS === 'android') {
            const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
                // Handle Android back button
                return handleBackPress();
            });
            
            return () => backHandler.remove();
        }
    };

    const handleBackPress = () => {
        // Custom back button handling
        Alert.alert(
            'Exit App',
            'Are you sure you want to exit?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Exit', onPress: () => BackHandler.exitApp() }
            ]
        );
        return true;
    };

    const cleanupApp = () => {
        console.log('[App] Cleaning up...');
        // Cleanup resources
    };

    const handleLogin = async (credentials) => {
        try {
            const result = await appManager.authService.login(credentials);
            setIsAuthenticated(true);
            setUser(result.user);
        } catch (error) {
            throw error;
        }
    };

    const handleLogout = async () => {
        try {
            await appManager.authService.logout();
            setIsAuthenticated(false);
            setUser(null);
        } catch (error) {
            console.error('[App] Logout error:', error);
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === lightTheme ? darkTheme : lightTheme;
        setTheme(newTheme);
        
        // Save preference
        appManager.storageService.saveUserPreference('theme', newTheme.name);
    };

    if (error) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <StatusBar
                    backgroundColor={theme.colors.primary}
                    barStyle={theme.statusBarStyle}
                />
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                        {error}
                    </Text>
                    <Text
                        style={[styles.retryText, { color: theme.colors.primary }]}
                        onPress={() => {
                            setError(null);
                            initializeApp();
                        }}
                    >
                        Tap to retry
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (isLoading) {
        return (
            <LoadingScreen 
                theme={theme}
                message="Initializing app..."
            />
        );
    }

    return (
        <ErrorBoundary>
            <ThemeContext.Provider value={{ theme, toggleTheme }}>
                <AuthContext.Provider value={{ 
                    isAuthenticated, 
                    user, 
                    login: handleLogin, 
                    logout: handleLogout 
                }}>
                    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                        <StatusBar
                            backgroundColor={theme.colors.primary}
                            barStyle={theme.statusBarStyle}
                        />
                        <NetworkStatus />
                        
                        <NavigationContainer>
                            {isAuthenticated ? (
                                <TabNavigator />
                            ) : (
                                <Stack.Navigator screenOptions={{ headerShown: false }}>
                                    <Stack.Screen name="Login" component={LoginScreen} />
                                </Stack.Navigator>
                            )}
                        </NavigationContainer>
                    </SafeAreaView>
                </AuthContext.Provider>
            </ThemeContext.Provider>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    errorText: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20
    },
    retryText: {
        fontSize: 16,
        textDecorationLine: 'underline'
    }
});

// Export app manager for external use
export { AppManager };