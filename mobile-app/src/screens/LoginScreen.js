/**
 * Login Screen
 * User authentication interface with biometric support
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
    Button, 
    Input, 
    Card,
    LoadingSpinner 
} from '../components/UIComponents';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { AuthService } from '../services/AuthService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
    const { login } = useAuth();
    const { theme } = useTheme();
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        checkBiometricAvailability();
    }, []);

    const checkBiometricAvailability = async () => {
        try {
            const available = await AuthService.isBiometricSupported();
            setBiometricAvailable(available);
        } catch (error) {
            console.error('Error checking biometric availability:', error);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        // Registration specific validation
        if (!isLogin) {
            if (!formData.name.trim()) {
                newErrors.name = 'Name is required';
            }
            
            if (!formData.confirmPassword) {
                newErrors.confirmPassword = 'Please confirm your password';
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setIsLoading(true);

            if (isLogin) {
                // Login
                const result = await AuthService.login(formData.email, formData.password);
                if (result.success) {
                    await login(result.user, result.tokens);
                } else {
                    Alert.alert('Login Failed', result.error || 'Invalid credentials');
                }
            } else {
                // Register
                const result = await AuthService.register({
                    email: formData.email,
                    password: formData.password,
                    name: formData.name
                });
                
                if (result.success) {
                    Alert.alert(
                        'Registration Successful',
                        'Your account has been created. Please login.',
                        [{ text: 'OK', onPress: () => setIsLogin(true) }]
                    );
                } else {
                    Alert.alert('Registration Failed', result.error || 'Registration failed');
                }
            }
        } catch (error) {
            console.error('Authentication error:', error);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBiometricLogin = async () => {
        try {
            setIsLoading(true);
            const result = await AuthService.loginWithBiometrics();
            
            if (result.success) {
                await login(result.user, result.tokens);
            } else {
                Alert.alert('Biometric Login Failed', result.error || 'Authentication failed');
            }
        } catch (error) {
            console.error('Biometric login error:', error);
            Alert.alert('Error', 'Biometric authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = () => {
        Alert.alert(
            'Reset Password',
            'Enter your email address to receive password reset instructions.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send Reset Email',
                    onPress: async () => {
                        if (!formData.email) {
                            Alert.alert('Error', 'Please enter your email address first');
                            return;
                        }
                        
                        try {
                            const result = await AuthService.resetPassword(formData.email);
                            if (result.success) {
                                Alert.alert(
                                    'Reset Email Sent',
                                    'Check your email for password reset instructions.'
                                );
                            } else {
                                Alert.alert('Error', result.error || 'Failed to send reset email');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to send reset email');
                        }
                    }
                }
            ]
        );
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            name: ''
        });
        setErrors({});
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>
                            {isLogin ? 'Welcome Back!' : 'Create Account'}
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            {isLogin 
                                ? 'Sign in to your account to continue' 
                                : 'Join us to get started'
                            }
                        </Text>
                    </View>

                    {/* Form */}
                    <Card style={[styles.formCard, { backgroundColor: theme.surface }]}>
                        {!isLogin && (
                            <Input
                                label="Full Name"
                                value={formData.name}
                                onChangeText={(value) => handleInputChange('name', value)}
                                placeholder="Enter your full name"
                                error={errors.name}
                                autoCapitalize="words"
                                textContentType="name"
                            />
                        )}

                        <Input
                            label="Email"
                            value={formData.email}
                            onChangeText={(value) => handleInputChange('email', value)}
                            placeholder="Enter your email"
                            error={errors.email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            textContentType="emailAddress"
                        />

                        <Input
                            label="Password"
                            value={formData.password}
                            onChangeText={(value) => handleInputChange('password', value)}
                            placeholder="Enter your password"
                            error={errors.password}
                            secureTextEntry
                            textContentType="password"
                        />

                        {!isLogin && (
                            <Input
                                label="Confirm Password"
                                value={formData.confirmPassword}
                                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                                placeholder="Confirm your password"
                                error={errors.confirmPassword}
                                secureTextEntry
                                textContentType="password"
                            />
                        )}

                        {/* Forgot Password Link */}
                        {isLogin && (
                            <TouchableOpacity
                                style={styles.forgotPasswordContainer}
                                onPress={handleForgotPassword}
                            >
                                <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>
                                    Forgot Password?
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Submit Button */}
                        <Button
                            title={isLogin ? 'Sign In' : 'Create Account'}
                            onPress={handleSubmit}
                            loading={isLoading}
                            variant="primary"
                            style={styles.submitButton}
                        />

                        {/* Biometric Login */}
                        {isLogin && biometricAvailable && (
                            <Button
                                title="Sign In with Biometrics"
                                onPress={handleBiometricLogin}
                                variant="outline"
                                style={styles.biometricButton}
                                disabled={isLoading}
                            />
                        )}

                        {/* Toggle Mode */}
                        <TouchableOpacity
                            style={styles.toggleContainer}
                            onPress={toggleMode}
                        >
                            <Text style={[styles.toggleText, { color: theme.textSecondary }]}>
                                {isLogin 
                                    ? "Don't have an account? " 
                                    : "Already have an account? "
                                }
                                <Text style={[styles.toggleLink, { color: theme.primary }]}>
                                    {isLogin ? 'Sign Up' : 'Sign In'}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </Card>

                    {/* Demo Account Info */}
                    {__DEV__ && (
                        <Card style={[styles.demoCard, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.demoTitle, { color: theme.text }]}>
                                Demo Account (Development)
                            </Text>
                            <Text style={[styles.demoText, { color: theme.textSecondary }]}>
                                Email: demo@example.com{'\n'}
                                Password: demo123
                            </Text>
                            <Button
                                title="Use Demo Account"
                                onPress={() => {
                                    setFormData({
                                        ...formData,
                                        email: 'demo@example.com',
                                        password: 'demo123'
                                    });
                                }}
                                variant="outline"
                                size="small"
                                style={styles.demoButton}
                            />
                        </Card>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    formCard: {
        marginBottom: 20,
    },
    forgotPasswordContainer: {
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    forgotPasswordText: {
        fontSize: 14,
        fontWeight: '500',
    },
    submitButton: {
        marginBottom: 16,
    },
    biometricButton: {
        marginBottom: 20,
        backgroundColor: 'transparent',
    },
    toggleContainer: {
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    toggleText: {
        fontSize: 14,
        textAlign: 'center',
    },
    toggleLink: {
        fontWeight: '600',
    },
    demoCard: {
        marginTop: 20,
        alignItems: 'center',
    },
    demoTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    demoText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 20,
    },
    demoButton: {
        backgroundColor: 'transparent',
        minWidth: 150,
    },
});

export default LoginScreen;