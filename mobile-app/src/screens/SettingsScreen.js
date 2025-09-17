/**
 * Settings Screen
 * App settings and configuration options
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    TouchableOpacity,
    Linking,
    Share,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
    Card, 
    CustomSwitch,
    Button,
    Divider 
} from '../components/UIComponents';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { StorageService } from '../services/StorageService';
import { NotificationService } from '../services/NotificationService';

const SettingsScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const { theme, isDarkMode, toggleTheme } = useTheme();
    const [appSettings, setAppSettings] = useState({
        notifications: true,
        autoSave: true,
        offlineMode: false,
        analyticsTracking: true,
        crashReporting: true,
        betaFeatures: false
    });
    const [appInfo, setAppInfo] = useState({
        version: '1.0.0',
        buildNumber: '1',
        environment: __DEV__ ? 'Development' : 'Production'
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await StorageService.getUserPreferences();
            if (settings) {
                setAppSettings(prev => ({ ...prev, ...settings }));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const updateSetting = async (key, value) => {
        try {
            const newSettings = { ...appSettings, [key]: value };
            setAppSettings(newSettings);
            await StorageService.setUserPreferences(newSettings);

            // Handle specific settings
            switch (key) {
                case 'notifications':
                    if (value) {
                        await NotificationService.requestPermissions();
                    }
                    break;
                case 'crashReporting':
                    // In production, enable/disable crash reporting
                    console.log('Crash reporting:', value ? 'enabled' : 'disabled');
                    break;
                case 'analyticsTracking':
                    // In production, enable/disable analytics
                    console.log('Analytics tracking:', value ? 'enabled' : 'disabled');
                    break;
            }
        } catch (error) {
            console.error('Error updating setting:', error);
            Alert.alert('Error', 'Failed to update setting');
            // Revert the change
            setAppSettings(prev => prev);
        }
    };

    const handleClearCache = () => {
        Alert.alert(
            'Clear Cache',
            'This will remove all cached data. The app may take longer to load next time.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    onPress: async () => {
                        try {
                            await StorageService.clearCache();
                            Alert.alert('Success', 'Cache cleared successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to clear cache');
                        }
                    }
                }
            ]
        );
    };

    const handleClearAllData = () => {
        Alert.alert(
            'Clear All Data',
            'This will remove all app data including settings and user data. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await StorageService.clearAllData();
                            Alert.alert('Success', 'All data cleared successfully');
                            // Logout user since all data is cleared
                            await logout();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to clear data');
                        }
                    }
                }
            ]
        );
    };

    const handleShareApp = async () => {
        try {
            const shareOptions = {
                title: 'Check out this amazing app!',
                message: 'I found this great app that you might like. Download it now!',
                url: 'https://example.com/download', // Replace with actual app store URL
            };

            await Share.share(shareOptions);
        } catch (error) {
            console.error('Error sharing app:', error);
        }
    };

    const handleRateApp = () => {
        const storeUrl = Platform.select({
            ios: 'https://apps.apple.com/app/id123456789',
            android: 'https://play.google.com/store/apps/details?id=com.example.app'
        });

        if (storeUrl) {
            Linking.openURL(storeUrl).catch(err => {
                console.error('Error opening store:', err);
                Alert.alert('Error', 'Could not open app store');
            });
        }
    };

    const handleSupport = () => {
        Alert.alert(
            'Support',
            'How would you like to get support?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Email',
                    onPress: () => {
                        Linking.openURL('mailto:support@example.com?subject=App Support Request');
                    }
                },
                {
                    text: 'FAQ',
                    onPress: () => {
                        navigation.navigate('FAQ');
                    }
                }
            ]
        );
    };

    const handlePrivacyPolicy = () => {
        // Navigate to privacy policy screen or open web URL
        Linking.openURL('https://example.com/privacy-policy');
    };

    const handleTermsOfService = () => {
        // Navigate to terms screen or open web URL
        Linking.openURL('https://example.com/terms-of-service');
    };

    const handleAbout = () => {
        navigation.navigate('About');
    };

    const SettingItem = ({ 
        title, 
        description, 
        value, 
        onValueChange, 
        type = 'switch',
        onPress = null,
        showArrow = false,
        color = theme.text 
    }) => (
        <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
            onPress={onPress}
            disabled={!onPress && type === 'switch'}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color }]}>{title}</Text>
                {description && (
                    <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                        {description}
                    </Text>
                )}
            </View>
            <View style={styles.settingControl}>
                {type === 'switch' && (
                    <CustomSwitch
                        value={value}
                        onValueChange={onValueChange}
                    />
                )}
                {type === 'text' && (
                    <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                        {value}
                    </Text>
                )}
                {showArrow && (
                    <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>
                        →
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView style={styles.scrollView}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.surface }]}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Text style={[styles.backText, { color: theme.primary }]}>
                            ← Back
                        </Text>
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        Settings
                    </Text>
                    <View style={styles.placeholder} />
                </View>

                {/* User Section */}
                <Card style={[styles.userCard, { backgroundColor: theme.surface }]}>
                    <TouchableOpacity
                        style={styles.userSection}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <View style={styles.userInfo}>
                            <Text style={[styles.userName, { color: theme.text }]}>
                                {user?.name || 'User'}
                            </Text>
                            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
                                {user?.email || 'user@example.com'}
                            </Text>
                        </View>
                        <Text style={[styles.editProfile, { color: theme.primary }]}>
                            Edit Profile →
                        </Text>
                    </TouchableOpacity>
                </Card>

                {/* App Settings */}
                <Card style={[styles.settingsCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        App Settings
                    </Text>
                    
                    <SettingItem
                        title="Dark Mode"
                        description="Toggle between light and dark theme"
                        value={isDarkMode}
                        onValueChange={toggleTheme}
                    />
                    
                    <SettingItem
                        title="Notifications"
                        description="Receive push notifications"
                        value={appSettings.notifications}
                        onValueChange={(value) => updateSetting('notifications', value)}
                    />
                    
                    <SettingItem
                        title="Auto Save"
                        description="Automatically save your data"
                        value={appSettings.autoSave}
                        onValueChange={(value) => updateSetting('autoSave', value)}
                    />
                    
                    <SettingItem
                        title="Offline Mode"
                        description="Enable offline functionality"
                        value={appSettings.offlineMode}
                        onValueChange={(value) => updateSetting('offlineMode', value)}
                    />
                </Card>

                {/* Privacy & Security */}
                <Card style={[styles.settingsCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Privacy & Security
                    </Text>
                    
                    <SettingItem
                        title="Analytics Tracking"
                        description="Help improve the app with usage data"
                        value={appSettings.analyticsTracking}
                        onValueChange={(value) => updateSetting('analyticsTracking', value)}
                    />
                    
                    <SettingItem
                        title="Crash Reporting"
                        description="Send crash reports to help fix issues"
                        value={appSettings.crashReporting}
                        onValueChange={(value) => updateSetting('crashReporting', value)}
                    />
                    
                    <SettingItem
                        title="Privacy Policy"
                        description="Read our privacy policy"
                        type="text"
                        onPress={handlePrivacyPolicy}
                        showArrow
                    />
                    
                    <SettingItem
                        title="Terms of Service"
                        description="Read our terms of service"
                        type="text"
                        onPress={handleTermsOfService}
                        showArrow
                    />
                </Card>

                {/* Beta Features */}
                <Card style={[styles.settingsCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Beta Features
                    </Text>
                    
                    <SettingItem
                        title="Beta Features"
                        description="Enable experimental features (may be unstable)"
                        value={appSettings.betaFeatures}
                        onValueChange={(value) => updateSetting('betaFeatures', value)}
                    />
                </Card>

                {/* Data Management */}
                <Card style={[styles.settingsCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Data Management
                    </Text>
                    
                    <SettingItem
                        title="Clear Cache"
                        description="Free up storage space"
                        type="text"
                        onPress={handleClearCache}
                        showArrow
                    />
                    
                    <SettingItem
                        title="Clear All Data"
                        description="Remove all app data (cannot be undone)"
                        type="text"
                        onPress={handleClearAllData}
                        showArrow
                        color="#dc3545"
                    />
                </Card>

                {/* Support & Feedback */}
                <Card style={[styles.settingsCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Support & Feedback
                    </Text>
                    
                    <SettingItem
                        title="Rate App"
                        description="Rate us on the app store"
                        type="text"
                        onPress={handleRateApp}
                        showArrow
                    />
                    
                    <SettingItem
                        title="Share App"
                        description="Tell your friends about this app"
                        type="text"
                        onPress={handleShareApp}
                        showArrow
                    />
                    
                    <SettingItem
                        title="Get Support"
                        description="Contact our support team"
                        type="text"
                        onPress={handleSupport}
                        showArrow
                    />
                    
                    <SettingItem
                        title="About"
                        description="App information and credits"
                        type="text"
                        onPress={handleAbout}
                        showArrow
                    />
                </Card>

                {/* App Info */}
                <Card style={[styles.settingsCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        App Information
                    </Text>
                    
                    <SettingItem
                        title="Version"
                        type="text"
                        value={appInfo.version}
                    />
                    
                    <SettingItem
                        title="Build Number"
                        type="text"
                        value={appInfo.buildNumber}
                    />
                    
                    <SettingItem
                        title="Environment"
                        type="text"
                        value={appInfo.environment}
                    />
                </Card>

                {/* Logout Button */}
                <View style={styles.logoutContainer}>
                    <Button
                        title="Logout"
                        onPress={() => {
                            Alert.alert(
                                'Logout',
                                'Are you sure you want to logout?',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    { 
                                        text: 'Logout', 
                                        style: 'destructive',
                                        onPress: logout
                                    }
                                ]
                            );
                        }}
                        variant="outline"
                        style={[styles.logoutButton, { borderColor: '#dc3545' }]}
                        textStyle={{ color: '#dc3545' }}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        marginBottom: 16,
    },
    backButton: {
        padding: 8,
    },
    backText: {
        fontSize: 16,
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    placeholder: {
        width: 60, // Balance the header
    },
    userCard: {
        marginHorizontal: 16,
        marginBottom: 16,
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 14,
    },
    editProfile: {
        fontSize: 14,
        fontWeight: '500',
    },
    settingsCard: {
        marginHorizontal: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    settingControl: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingValue: {
        fontSize: 14,
        marginRight: 8,
    },
    settingArrow: {
        fontSize: 16,
        marginLeft: 8,
    },
    logoutContainer: {
        marginHorizontal: 16,
        marginBottom: 32,
    },
    logoutButton: {
        backgroundColor: 'transparent',
    },
});

export default SettingsScreen;