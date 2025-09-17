/**
 * Error Boundary Component
 * Catches JavaScript errors in component tree and displays fallback UI
 */

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert
} from 'react-native';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Log to crash reporting service
        this.logError(error, errorInfo);
    }

    logError = (error, errorInfo) => {
        // In production, send to crash reporting service (e.g., Crashlytics, Sentry)
        console.error('Error caught by ErrorBoundary:', error);
        console.error('Error info:', errorInfo);

        // Optional: Send to analytics or error reporting service
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    }

    handleReportBug = () => {
        const { error, errorInfo } = this.state;
        const errorReport = {
            error: error?.toString() || 'Unknown error',
            stack: error?.stack || 'No stack trace',
            componentStack: errorInfo?.componentStack || 'No component stack',
            timestamp: new Date().toISOString()
        };

        Alert.alert(
            'Report Bug',
            'Would you like to report this error?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Report',
                    onPress: () => {
                        // In production, implement bug reporting
                        console.log('Bug report:', errorReport);
                        if (this.props.onReportBug) {
                            this.props.onReportBug(errorReport);
                        }
                    }
                }
            ]
        );
    }

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            const { fallback: FallbackComponent } = this.props;
            
            if (FallbackComponent) {
                return (
                    <FallbackComponent
                        error={this.state.error}
                        errorInfo={this.state.errorInfo}
                        onRetry={this.handleRetry}
                        onReportBug={this.handleReportBug}
                    />
                );
            }

            // Default fallback UI
            return (
                <SafeAreaView style={styles.container}>
                    <View style={styles.content}>
                        <Text style={styles.title}>Oops! Something went wrong</Text>
                        <Text style={styles.subtitle}>
                            We're sorry for the inconvenience. The app encountered an unexpected error.
                        </Text>
                        
                        {__DEV__ && (
                            <View style={styles.errorDetails}>
                                <Text style={styles.errorTitle}>Error Details (Dev Mode):</Text>
                                <Text style={styles.errorText}>
                                    {this.state.error?.toString()}
                                </Text>
                                {this.state.errorInfo?.componentStack && (
                                    <Text style={styles.errorStack}>
                                        {this.state.errorInfo.componentStack}
                                    </Text>
                                )}
                            </View>
                        )}

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.primaryButton]}
                                onPress={this.handleRetry}
                            >
                                <Text style={[styles.buttonText, styles.primaryButtonText]}>
                                    Try Again
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.secondaryButton]}
                                onPress={this.handleReportBug}
                            >
                                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                                    Report Bug
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            );
        }

        return this.props.children;
    }
}

// Higher-order component for functional components
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
    return function WithErrorBoundaryComponent(props) {
        return (
            <ErrorBoundary {...errorBoundaryProps}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
};

// Hook for error handling in functional components
export const useErrorHandler = () => {
    const [error, setError] = React.useState(null);

    const handleError = React.useCallback((error) => {
        setError(error);
        console.error('Error handled by useErrorHandler:', error);
    }, []);

    const clearError = React.useCallback(() => {
        setError(null);
    }, []);

    React.useEffect(() => {
        if (error) {
            // Log error or send to error reporting service
            console.error('Error in useErrorHandler:', error);
        }
    }, [error]);

    return {
        error,
        handleError,
        clearError,
        hasError: error !== null
    };
};

// Custom error classes
export class AppError extends Error {
    constructor(message, code = null, originalError = null) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
    }
}

export class NetworkError extends AppError {
    constructor(message, statusCode = null, originalError = null) {
        super(message, 'NETWORK_ERROR', originalError);
        this.name = 'NetworkError';
        this.statusCode = statusCode;
    }
}

export class ValidationError extends AppError {
    constructor(message, field = null, originalError = null) {
        super(message, 'VALIDATION_ERROR', originalError);
        this.name = 'ValidationError';
        this.field = field;
    }
}

// Error reporting utilities
export const ErrorReporter = {
    report: (error, context = {}) => {
        const errorReport = {
            error: error?.toString() || 'Unknown error',
            stack: error?.stack || 'No stack trace',
            context,
            timestamp: new Date().toISOString(),
            platform: Platform.OS,
            appVersion: '1.0.0' // Should come from app config
        };

        console.error('Error reported:', errorReport);

        // In production, send to error reporting service
        // Examples: Sentry, Crashlytics, Bugsnag
        /*
        if (process.env.NODE_ENV === 'production') {
            // Sentry.captureException(error, { extra: context });
            // crashlytics().recordError(error);
        }
        */

        return errorReport;
    },

    reportAsync: async (error, context = {}) => {
        try {
            const errorReport = ErrorReporter.report(error, context);
            
            // Send to remote service
            // await fetch('/api/errors', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(errorReport)
            // });

            return errorReport;
        } catch (reportingError) {
            console.error('Failed to report error:', reportingError);
        }
    }
};

// Safe component wrapper
export const SafeComponent = ({ children, fallback = null, onError = null }) => {
    return (
        <ErrorBoundary
            fallback={fallback}
            onError={onError}
        >
            {children}
        </ErrorBoundary>
    );
};

// Async error handler for promises
export const handleAsyncError = (asyncFunction) => {
    return async (...args) => {
        try {
            return await asyncFunction(...args);
        } catch (error) {
            ErrorReporter.report(error, {
                function: asyncFunction.name,
                args: args.length
            });
            throw error;
        }
    };
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#dc3545',
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#6c757d',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    errorDetails: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
        width: '100%',
        maxHeight: 200,
    },
    errorTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#dc3545',
        marginBottom: 8,
    },
    errorText: {
        fontSize: 12,
        color: '#666',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginBottom: 8,
    },
    errorStack: {
        fontSize: 10,
        color: '#999',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        backgroundColor: '#007bff',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#6c757d',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    primaryButtonText: {
        color: '#fff',
    },
    secondaryButtonText: {
        color: '#6c757d',
    },
});

export default ErrorBoundary;