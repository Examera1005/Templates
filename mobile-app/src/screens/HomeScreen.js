/**
 * Home Screen
 * Main dashboard screen with user overview and quick actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Alert,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
    Button, 
    Card, 
    Avatar, 
    Badge,
    LoadingSpinner,
    ProgressBar 
} from '../components/UIComponents';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { StorageService } from '../services/StorageService';
import { NotificationService } from '../services/NotificationService';

const HomeScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const { theme, isDarkMode, toggleTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [stats, setStats] = useState({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        todayTasks: 0
    });

    useEffect(() => {
        loadDashboardData();
        loadNotifications();
        setupNotificationListener();
    }, []);

    const loadDashboardData = async () => {
        try {
            setIsLoading(true);
            
            // Load user preferences and cached data
            const [preferences, cachedStats] = await Promise.all([
                StorageService.getUserPreferences(),
                StorageService.getCachedData('dashboard_stats')
            ]);

            if (cachedStats) {
                setStats(cachedStats);
            }

            // Simulate API call for fresh data
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const freshStats = {
                totalTasks: 24,
                completedTasks: 18,
                pendingTasks: 6,
                todayTasks: 3
            };
            
            setStats(freshStats);
            
            // Cache the fresh data
            await StorageService.setCachedData('dashboard_stats', freshStats, 5 * 60 * 1000); // 5 minutes TTL
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            Alert.alert('Error', 'Failed to load dashboard data');
        } finally {
            setIsLoading(false);
        }
    };

    const loadNotifications = async () => {
        try {
            const notificationHistory = await NotificationService.getNotificationHistory();
            setNotifications(notificationHistory.slice(0, 5)); // Show latest 5
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const setupNotificationListener = () => {
        // Listen for new notifications
        const unsubscribe = NotificationService.addNotificationListener((notification) => {
            setNotifications(prev => [notification, ...prev.slice(0, 4)]);
        });

        return unsubscribe;
    };

    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                loadDashboardData(),
                loadNotifications()
            ]);
        } catch (error) {
            console.error('Error refreshing:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Logout', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to logout');
                        }
                    }
                }
            ]
        );
    };

    const navigateToTasks = () => {
        navigation.navigate('Tasks');
    };

    const navigateToProfile = () => {
        navigation.navigate('Profile');
    };

    const navigateToSettings = () => {
        navigation.navigate('Settings');
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getCompletionPercentage = () => {
        if (stats.totalTasks === 0) return 0;
        return stats.completedTasks / stats.totalTasks;
    };

    if (isLoading && !dashboardData) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <LoadingSpinner text="Loading dashboard..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.primary}
                    />
                }
            >
                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.surface }]}>
                    <View style={styles.headerContent}>
                        <View style={styles.userInfo}>
                            <Avatar
                                source={user?.avatar ? { uri: user.avatar } : null}
                                name={user?.name || 'User'}
                                size={50}
                                onPress={navigateToProfile}
                            />
                            <View style={styles.userDetails}>
                                <Text style={[styles.greeting, { color: theme.textSecondary }]}>
                                    {getGreeting()}
                                </Text>
                                <Text style={[styles.userName, { color: theme.text }]}>
                                    {user?.name || 'Welcome'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={styles.themeToggle}
                                onPress={toggleTheme}
                            >
                                <Text style={[styles.themeIcon, { color: theme.primary }]}>
                                    {isDarkMode ? '☀️' : '🌙'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.settingsButton}
                                onPress={navigateToSettings}
                            >
                                <Text style={[styles.settingsIcon, { color: theme.primary }]}>
                                    ⚙️
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <Card style={[styles.statsCard, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.statsNumber, { color: theme.primary }]}>
                            {stats.totalTasks}
                        </Text>
                        <Text style={[styles.statsLabel, { color: theme.textSecondary }]}>
                            Total Tasks
                        </Text>
                    </Card>
                    
                    <Card style={[styles.statsCard, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.statsNumber, { color: '#28a745' }]}>
                            {stats.completedTasks}
                        </Text>
                        <Text style={[styles.statsLabel, { color: theme.textSecondary }]}>
                            Completed
                        </Text>
                    </Card>
                    
                    <Card style={[styles.statsCard, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.statsNumber, { color: '#fd7e14' }]}>
                            {stats.pendingTasks}
                        </Text>
                        <Text style={[styles.statsLabel, { color: theme.textSecondary }]}>
                            Pending
                        </Text>
                    </Card>
                </View>

                {/* Progress Card */}
                <Card style={[styles.progressCard, { backgroundColor: theme.surface }]}>
                    <View style={styles.progressHeader}>
                        <Text style={[styles.progressTitle, { color: theme.text }]}>
                            Today's Progress
                        </Text>
                        <Badge value={stats.todayTasks} />
                    </View>
                    <ProgressBar
                        progress={getCompletionPercentage()}
                        progressColor={theme.primary}
                        backgroundColor={theme.border}
                        style={styles.progressBar}
                    />
                    <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                        {`${Math.round(getCompletionPercentage() * 100)}% Complete`}
                    </Text>
                </Card>

                {/* Quick Actions */}
                <Card style={[styles.actionsCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Quick Actions
                    </Text>
                    <View style={styles.actionsGrid}>
                        <Button
                            title="View Tasks"
                            onPress={navigateToTasks}
                            variant="primary"
                            style={styles.actionButton}
                        />
                        <Button
                            title="Add Task"
                            onPress={() => navigation.navigate('AddTask')}
                            variant="outline"
                            style={styles.actionButton}
                        />
                        <Button
                            title="Reports"
                            onPress={() => navigation.navigate('Reports')}
                            variant="secondary"
                            style={styles.actionButton}
                        />
                        <Button
                            title="Calendar"
                            onPress={() => navigation.navigate('Calendar')}
                            variant="outline"
                            style={styles.actionButton}
                        />
                    </View>
                </Card>

                {/* Recent Notifications */}
                {notifications.length > 0 && (
                    <Card style={[styles.notificationsCard, { backgroundColor: theme.surface }]}>
                        <View style={styles.notificationsHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                Recent Notifications
                            </Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Notifications')}
                            >
                                <Text style={[styles.viewAllText, { color: theme.primary }]}>
                                    View All
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {notifications.map((notification, index) => (
                            <View
                                key={notification.id || index}
                                style={[styles.notificationItem, { borderBottomColor: theme.border }]}
                            >
                                <Text style={[styles.notificationTitle, { color: theme.text }]}>
                                    {notification.title}
                                </Text>
                                <Text style={[styles.notificationBody, { color: theme.textSecondary }]}>
                                    {notification.body}
                                </Text>
                                <Text style={[styles.notificationTime, { color: theme.textSecondary }]}>
                                    {new Date(notification.timestamp).toLocaleTimeString()}
                                </Text>
                            </View>
                        ))}
                    </Card>
                )}

                {/* Logout Button */}
                <View style={styles.logoutContainer}>
                    <Button
                        title="Logout"
                        onPress={handleLogout}
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
        padding: 20,
        marginBottom: 16,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    userDetails: {
        marginLeft: 12,
        flex: 1,
    },
    greeting: {
        fontSize: 14,
        marginBottom: 2,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    themeToggle: {
        padding: 8,
        marginRight: 8,
    },
    themeIcon: {
        fontSize: 20,
    },
    settingsButton: {
        padding: 8,
    },
    settingsIcon: {
        fontSize: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 16,
        gap: 12,
    },
    statsCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 20,
    },
    statsNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statsLabel: {
        fontSize: 12,
        textAlign: 'center',
    },
    progressCard: {
        marginHorizontal: 16,
        marginBottom: 16,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    progressBar: {
        marginBottom: 8,
    },
    progressText: {
        fontSize: 14,
        textAlign: 'center',
    },
    actionsCard: {
        marginHorizontal: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        minWidth: '45%',
    },
    notificationsCard: {
        marginHorizontal: 16,
        marginBottom: 16,
    },
    notificationsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '500',
    },
    notificationItem: {
        paddingBottom: 12,
        marginBottom: 12,
        borderBottomWidth: 1,
    },
    notificationTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    notificationBody: {
        fontSize: 13,
        marginBottom: 4,
        lineHeight: 18,
    },
    notificationTime: {
        fontSize: 11,
    },
    logoutContainer: {
        marginHorizontal: 16,
        marginBottom: 32,
    },
    logoutButton: {
        backgroundColor: 'transparent',
    },
});

export default HomeScreen;