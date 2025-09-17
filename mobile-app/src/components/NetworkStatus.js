/**
 * Network Status Component
 * Monitors and displays network connectivity status
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NetworkStatus = ({
    showWhenOnline = false,
    onNetworkChange = null,
    style = {},
    autoHide = true,
    autoHideDelay = 3000
}) => {
    const [isConnected, setIsConnected] = useState(true);
    const [connectionType, setConnectionType] = useState('unknown');
    const [isInternetReachable, setIsInternetReachable] = useState(true);
    const [isVisible, setIsVisible] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const hideTimeoutRef = useRef(null);

    useEffect(() => {
        // Subscribe to network state updates
        const unsubscribe = NetInfo.addEventListener(state => {
            const connected = state.isConnected && state.isInternetReachable;
            const wasConnected = isConnected && isInternetReachable;
            
            setIsConnected(state.isConnected || false);
            setConnectionType(state.type);
            setIsInternetReachable(state.isInternetReachable || false);
            
            // Show status if connection changed or if configured to show when online
            const shouldShow = (!connected) || (showWhenOnline) || (connected && !wasConnected);
            
            if (shouldShow) {
                showStatus();
            }
            
            // Call callback if provided
            if (onNetworkChange) {
                onNetworkChange({
                    isConnected: state.isConnected || false,
                    connectionType: state.type,
                    isInternetReachable: state.isInternetReachable || false
                });
            }
        });

        // Get initial state
        NetInfo.fetch().then(state => {
            setIsConnected(state.isConnected || false);
            setConnectionType(state.type);
            setIsInternetReachable(state.isInternetReachable || false);
            
            if (!state.isConnected || !state.isInternetReachable) {
                showStatus();
            }
        });

        return () => unsubscribe();
    }, []);

    const showStatus = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }

        setIsVisible(true);
        
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Auto hide if enabled and connected
        if (autoHide && isConnected && isInternetReachable) {
            hideTimeoutRef.current = setTimeout(() => {
                hideStatus();
            }, autoHideDelay);
        }
    };

    const hideStatus = () => {
        Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setIsVisible(false);
        });
    };

    const handleRetry = async () => {
        setIsRetrying(true);
        
        try {
            const state = await NetInfo.fetch();
            setIsConnected(state.isConnected || false);
            setConnectionType(state.type);
            setIsInternetReachable(state.isInternetReachable || false);
            
            if (state.isConnected && state.isInternetReachable) {
                showStatus(); // Show success briefly
            }
        } catch (error) {
            console.error('Error checking network status:', error);
        } finally {
            setIsRetrying(false);
        }
    };

    const getStatusInfo = () => {
        if (!isConnected) {
            return {
                message: 'No Internet Connection',
                detail: 'Please check your network settings',
                color: '#dc3545',
                backgroundColor: '#f8d7da',
                showRetry: true
            };
        }
        
        if (!isInternetReachable) {
            return {
                message: 'Limited Connection',
                detail: 'Connected to network but no internet access',
                color: '#fd7e14',
                backgroundColor: '#fff3cd',
                showRetry: true
            };
        }
        
        return {
            message: 'Back Online',
            detail: `Connected via ${connectionType}`,
            color: '#28a745',
            backgroundColor: '#d4edda',
            showRetry: false
        };
    };

    const statusInfo = getStatusInfo();
    const connected = isConnected && isInternetReachable;

    if (!isVisible) {
        return null;
    }

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: statusInfo.backgroundColor,
                    transform: [{ translateY: slideAnim }],
                },
                style
            ]}
        >
            <View style={styles.content}>
                <View style={styles.indicator}>
                    <View
                        style={[
                            styles.dot,
                            { backgroundColor: statusInfo.color }
                        ]}
                    />
                </View>
                
                <View style={styles.textContainer}>
                    <Text style={[styles.message, { color: statusInfo.color }]}>
                        {statusInfo.message}
                    </Text>
                    <Text style={styles.detail}>
                        {statusInfo.detail}
                    </Text>
                </View>
                
                {statusInfo.showRetry && (
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={handleRetry}
                        disabled={isRetrying}
                    >
                        {isRetrying ? (
                            <ActivityIndicator size="small" color={statusInfo.color} />
                        ) : (
                            <Text style={[styles.retryText, { color: statusInfo.color }]}>
                                Retry
                            </Text>
                        )}
                    </TouchableOpacity>
                )}
                
                {connected && autoHide && (
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={hideStatus}
                    >
                        <Text style={[styles.closeText, { color: statusInfo.color }]}>
                            ×
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </Animated.View>
    );
};

// Hook for network status
export const useNetworkStatus = () => {
    const [networkState, setNetworkState] = useState({
        isConnected: true,
        connectionType: 'unknown',
        isInternetReachable: true
    });

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setNetworkState({
                isConnected: state.isConnected || false,
                connectionType: state.type,
                isInternetReachable: state.isInternetReachable || false
            });
        });

        // Get initial state
        NetInfo.fetch().then(state => {
            setNetworkState({
                isConnected: state.isConnected || false,
                connectionType: state.type,
                isInternetReachable: state.isInternetReachable || false
            });
        });

        return () => unsubscribe();
    }, []);

    const refresh = async () => {
        try {
            const state = await NetInfo.fetch();
            setNetworkState({
                isConnected: state.isConnected || false,
                connectionType: state.type,
                isInternetReachable: state.isInternetReachable || false
            });
            return state;
        } catch (error) {
            console.error('Error refreshing network status:', error);
            throw error;
        }
    };

    return {
        ...networkState,
        isOnline: networkState.isConnected && networkState.isInternetReachable,
        refresh
    };
};

// Network-aware component wrapper
export const withNetworkStatus = (WrappedComponent) => {
    return function NetworkAwareComponent(props) {
        const networkStatus = useNetworkStatus();
        
        return (
            <WrappedComponent
                {...props}
                networkStatus={networkStatus}
            />
        );
    };
};

// Offline queue manager
export class OfflineQueueManager {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.listeners = [];
        
        // Start monitoring network status
        this.unsubscribe = NetInfo.addEventListener(this.handleNetworkChange.bind(this));
    }

    addToQueue = (request) => {
        const queueItem = {
            id: Date.now().toString(),
            request,
            timestamp: Date.now(),
            retryCount: 0
        };
        
        this.queue.push(queueItem);
        this.notifyListeners('item_added', queueItem);
        
        return queueItem.id;
    };

    removeFromQueue = (id) => {
        const index = this.queue.findIndex(item => item.id === id);
        if (index !== -1) {
            const removed = this.queue.splice(index, 1)[0];
            this.notifyListeners('item_removed', removed);
            return removed;
        }
        return null;
    };

    processQueue = async () => {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;
        this.notifyListeners('processing_started');

        const failedItems = [];

        for (const item of this.queue) {
            try {
                await item.request();
                this.notifyListeners('item_processed', item);
            } catch (error) {
                item.retryCount++;
                if (item.retryCount < 3) {
                    failedItems.push(item);
                }
                this.notifyListeners('item_failed', item, error);
            }
        }

        this.queue = failedItems;
        this.isProcessing = false;
        this.notifyListeners('processing_finished');
    };

    handleNetworkChange = (state) => {
        if (state.isConnected && state.isInternetReachable) {
            this.processQueue();
        }
    };

    addListener = (listener) => {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index !== -1) {
                this.listeners.splice(index, 1);
            }
        };
    };

    notifyListeners = (event, ...args) => {
        this.listeners.forEach(listener => {
            try {
                listener(event, ...args);
            } catch (error) {
                console.error('Error in offline queue listener:', error);
            }
        });
    };

    destroy = () => {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        this.queue = [];
        this.listeners = [];
    };
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingTop: 44, // Account for status bar
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    indicator: {
        marginRight: 12,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    textContainer: {
        flex: 1,
    },
    message: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    detail: {
        fontSize: 12,
        color: '#666',
    },
    retryButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'currentColor',
        marginLeft: 8,
        minWidth: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    retryText: {
        fontSize: 12,
        fontWeight: '600',
    },
    closeButton: {
        paddingLeft: 12,
        paddingVertical: 6,
    },
    closeText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default NetworkStatus;