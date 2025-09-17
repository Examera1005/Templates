/**
 * Mobile Authentication Service
 * Handles user authentication, token management, and secure storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Keychain/Keystore for secure storage
let Keychain;
if (Platform.OS === 'ios') {
    try {
        Keychain = require('react-native-keychain');
    } catch (e) {
        console.warn('[Auth] Keychain not available, using AsyncStorage');
    }
}

export class AuthService {
    constructor(options = {}) {
        this.baseURL = options.baseURL || 'https://api.example.com';
        this.tokenKey = options.tokenKey || 'auth_token';
        this.refreshTokenKey = options.refreshTokenKey || 'refresh_token';
        this.userKey = options.userKey || 'user_data';
        this.biometricKey = options.biometricKey || 'biometric_enabled';
        
        this.currentUser = null;
        this.token = null;
        this.refreshToken = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Load stored tokens
            await this.loadStoredCredentials();
            
            // Validate current token
            if (this.token) {
                const isValid = await this.validateToken(this.token);
                if (!isValid && this.refreshToken) {
                    await this.refreshAccessToken();
                }
            }

            this.isInitialized = true;
            console.log('[Auth] Service initialized');
        } catch (error) {
            console.error('[Auth] Initialization failed:', error);
        }
    }

    async loadStoredCredentials() {
        try {
            // Try secure storage first
            if (Keychain && Platform.OS === 'ios') {
                const credentials = await Keychain.getCredentials('auth_service');
                if (credentials) {
                    this.token = credentials.password;
                    this.refreshToken = await AsyncStorage.getItem(this.refreshTokenKey);
                }
            } else {
                // Fallback to AsyncStorage
                this.token = await AsyncStorage.getItem(this.tokenKey);
                this.refreshToken = await AsyncStorage.getItem(this.refreshTokenKey);
            }

            // Load user data
            const userData = await AsyncStorage.getItem(this.userKey);
            if (userData) {
                this.currentUser = JSON.parse(userData);
            }

            console.log('[Auth] Credentials loaded');
        } catch (error) {
            console.error('[Auth] Failed to load credentials:', error);
        }
    }

    async login(credentials) {
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }

            const data = await response.json();
            
            // Store tokens and user data
            await this.storeCredentials(data.token, data.refreshToken, data.user);
            
            this.token = data.token;
            this.refreshToken = data.refreshToken;
            this.currentUser = data.user;

            console.log('[Auth] Login successful');
            return {
                success: true,
                user: data.user,
                token: data.token
            };
        } catch (error) {
            console.error('[Auth] Login failed:', error);
            throw error;
        }
    }

    async logout() {
        try {
            // Call logout endpoint if available
            if (this.token) {
                await fetch(`${this.baseURL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json',
                    },
                });
            }
        } catch (error) {
            console.warn('[Auth] Logout endpoint failed:', error);
        } finally {
            // Clear local data regardless
            await this.clearStoredCredentials();
            this.token = null;
            this.refreshToken = null;
            this.currentUser = null;
            
            console.log('[Auth] Logout completed');
        }
    }

    async register(userData) {
        try {
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Registration failed');
            }

            const data = await response.json();
            
            // Auto-login after registration
            if (data.token) {
                await this.storeCredentials(data.token, data.refreshToken, data.user);
                this.token = data.token;
                this.refreshToken = data.refreshToken;
                this.currentUser = data.user;
            }

            console.log('[Auth] Registration successful');
            return {
                success: true,
                user: data.user,
                requiresVerification: data.requiresVerification || false
            };
        } catch (error) {
            console.error('[Auth] Registration failed:', error);
            throw error;
        }
    }

    async refreshAccessToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refreshToken: this.refreshToken
                }),
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            
            // Update stored tokens
            await this.storeCredentials(data.token, data.refreshToken || this.refreshToken, this.currentUser);
            
            this.token = data.token;
            if (data.refreshToken) {
                this.refreshToken = data.refreshToken;
            }

            console.log('[Auth] Token refreshed');
            return data.token;
        } catch (error) {
            console.error('[Auth] Token refresh failed:', error);
            // Clear invalid credentials
            await this.clearStoredCredentials();
            throw error;
        }
    }

    async validateToken(token) {
        try {
            const response = await fetch(`${this.baseURL}/auth/validate`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            return response.ok;
        } catch (error) {
            console.error('[Auth] Token validation failed:', error);
            return false;
        }
    }

    async storeCredentials(token, refreshToken, user) {
        try {
            // Store token securely
            if (Keychain && Platform.OS === 'ios') {
                await Keychain.setCredentials('auth_service', 'token', token);
            } else {
                await AsyncStorage.setItem(this.tokenKey, token);
            }

            // Store refresh token and user data
            if (refreshToken) {
                await AsyncStorage.setItem(this.refreshTokenKey, refreshToken);
            }
            
            if (user) {
                await AsyncStorage.setItem(this.userKey, JSON.stringify(user));
            }

            console.log('[Auth] Credentials stored');
        } catch (error) {
            console.error('[Auth] Failed to store credentials:', error);
            throw error;
        }
    }

    async clearStoredCredentials() {
        try {
            // Clear secure storage
            if (Keychain && Platform.OS === 'ios') {
                await Keychain.resetCredentials('auth_service');
            } else {
                await AsyncStorage.removeItem(this.tokenKey);
            }

            // Clear AsyncStorage
            await AsyncStorage.multiRemove([
                this.refreshTokenKey,
                this.userKey,
                this.biometricKey
            ]);

            console.log('[Auth] Credentials cleared');
        } catch (error) {
            console.error('[Auth] Failed to clear credentials:', error);
        }
    }

    async checkAuthStatus() {
        try {
            if (!this.token) {
                return { isAuthenticated: false, user: null };
            }

            const isValid = await this.validateToken(this.token);
            
            if (!isValid && this.refreshToken) {
                await this.refreshAccessToken();
                return { isAuthenticated: true, user: this.currentUser };
            }

            return {
                isAuthenticated: isValid,
                user: isValid ? this.currentUser : null
            };
        } catch (error) {
            console.error('[Auth] Auth status check failed:', error);
            return { isAuthenticated: false, user: null };
        }
    }

    async updateProfile(profileData) {
        if (!this.token) {
            throw new Error('Not authenticated');
        }

        try {
            const response = await fetch(`${this.baseURL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Profile update failed');
            }

            const updatedUser = await response.json();
            
            // Update stored user data
            this.currentUser = updatedUser;
            await AsyncStorage.setItem(this.userKey, JSON.stringify(updatedUser));

            console.log('[Auth] Profile updated');
            return updatedUser;
        } catch (error) {
            console.error('[Auth] Profile update failed:', error);
            throw error;
        }
    }

    async changePassword(currentPassword, newPassword) {
        if (!this.token) {
            throw new Error('Not authenticated');
        }

        try {
            const response = await fetch(`${this.baseURL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Password change failed');
            }

            console.log('[Auth] Password changed');
            return { success: true };
        } catch (error) {
            console.error('[Auth] Password change failed:', error);
            throw error;
        }
    }

    async requestPasswordReset(email) {
        try {
            const response = await fetch(`${this.baseURL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Password reset request failed');
            }

            console.log('[Auth] Password reset requested');
            return { success: true };
        } catch (error) {
            console.error('[Auth] Password reset request failed:', error);
            throw error;
        }
    }

    // Biometric authentication
    async enableBiometricAuth() {
        if (!Keychain || Platform.OS !== 'ios') {
            throw new Error('Biometric authentication not supported');
        }

        try {
            const biometryType = await Keychain.getSupportedBiometryType();
            if (!biometryType) {
                throw new Error('Biometric authentication not available');
            }

            // Store biometric preference
            await AsyncStorage.setItem(this.biometricKey, 'true');
            
            console.log('[Auth] Biometric authentication enabled');
            return { success: true, biometryType };
        } catch (error) {
            console.error('[Auth] Biometric setup failed:', error);
            throw error;
        }
    }

    async authenticateWithBiometric() {
        if (!Keychain || Platform.OS !== 'ios') {
            throw new Error('Biometric authentication not supported');
        }

        try {
            const biometricEnabled = await AsyncStorage.getItem(this.biometricKey);
            if (biometricEnabled !== 'true') {
                throw new Error('Biometric authentication not enabled');
            }

            const credentials = await Keychain.getCredentials('auth_service', {
                authenticationPrompt: 'Authenticate to access your account'
            });

            if (credentials) {
                this.token = credentials.password;
                this.refreshToken = await AsyncStorage.getItem(this.refreshTokenKey);
                
                const userData = await AsyncStorage.getItem(this.userKey);
                if (userData) {
                    this.currentUser = JSON.parse(userData);
                }

                console.log('[Auth] Biometric authentication successful');
                return { success: true, user: this.currentUser };
            } else {
                throw new Error('Biometric authentication failed');
            }
        } catch (error) {
            console.error('[Auth] Biometric authentication failed:', error);
            throw error;
        }
    }

    async syncData(data) {
        if (!this.token) {
            throw new Error('Not authenticated');
        }

        try {
            const response = await fetch(`${this.baseURL}/sync`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Data sync failed');
            }

            return await response.json();
        } catch (error) {
            console.error('[Auth] Data sync failed:', error);
            throw error;
        }
    }

    async checkForUpdates() {
        try {
            const response = await fetch(`${this.baseURL}/app/version`, {
                method: 'GET',
                headers: this.token ? {
                    'Authorization': `Bearer ${this.token}`
                } : {}
            });

            if (response.ok) {
                return await response.json();
            }
            
            return { hasUpdate: false };
        } catch (error) {
            console.error('[Auth] Update check failed:', error);
            return { hasUpdate: false };
        }
    }

    // Getters
    getCurrentUser() {
        return this.currentUser;
    }

    getToken() {
        return this.token;
    }

    isAuthenticated() {
        return !!this.token && !!this.currentUser;
    }

    // Request interceptor for authenticated requests
    async makeAuthenticatedRequest(url, options = {}) {
        if (!this.token) {
            throw new Error('Not authenticated');
        }

        const headers = {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Handle token expiration
            if (response.status === 401 && this.refreshToken) {
                await this.refreshAccessToken();
                
                // Retry with new token
                headers.Authorization = `Bearer ${this.token}`;
                return fetch(url, {
                    ...options,
                    headers
                });
            }

            return response;
        } catch (error) {
            console.error('[Auth] Authenticated request failed:', error);
            throw error;
        }
    }
}