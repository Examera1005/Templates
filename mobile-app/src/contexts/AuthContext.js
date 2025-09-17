/**
 * Authentication Context
 * Global state management for user authentication
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthService } from '../services/AuthService';
import { StorageService } from '../services/StorageService';

// Action types
const AUTH_ACTIONS = {
    INITIALIZE: 'INITIALIZE',
    LOGIN_START: 'LOGIN_START',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
    LOGOUT: 'LOGOUT',
    UPDATE_USER: 'UPDATE_USER',
    REFRESH_TOKEN: 'REFRESH_TOKEN',
    SET_LOADING: 'SET_LOADING'
};

// Initial state
const initialState = {
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
    isInitialized: false,
    error: null
};

// Reducer
const authReducer = (state, action) => {
    switch (action.type) {
        case AUTH_ACTIONS.INITIALIZE:
            return {
                ...state,
                user: action.payload.user,
                tokens: action.payload.tokens,
                isAuthenticated: !!action.payload.user,
                isLoading: false,
                isInitialized: true,
                error: null
            };

        case AUTH_ACTIONS.LOGIN_START:
            return {
                ...state,
                isLoading: true,
                error: null
            };

        case AUTH_ACTIONS.LOGIN_SUCCESS:
            return {
                ...state,
                user: action.payload.user,
                tokens: action.payload.tokens,
                isAuthenticated: true,
                isLoading: false,
                error: null
            };

        case AUTH_ACTIONS.LOGIN_FAILURE:
            return {
                ...state,
                user: null,
                tokens: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload.error
            };

        case AUTH_ACTIONS.LOGOUT:
            return {
                ...state,
                user: null,
                tokens: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            };

        case AUTH_ACTIONS.UPDATE_USER:
            return {
                ...state,
                user: { ...state.user, ...action.payload }
            };

        case AUTH_ACTIONS.REFRESH_TOKEN:
            return {
                ...state,
                tokens: action.payload.tokens
            };

        case AUTH_ACTIONS.SET_LOADING:
            return {
                ...state,
                isLoading: action.payload
            };

        default:
            return state;
    }
};

// Create context
const AuthContext = createContext({});

// Auth Provider Component
export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Initialize authentication state
    useEffect(() => {
        initializeAuth();
    }, []);

    // Set up token refresh interval
    useEffect(() => {
        if (state.isAuthenticated && state.tokens) {
            const refreshInterval = setInterval(() => {
                refreshTokens();
            }, 30 * 60 * 1000); // Refresh every 30 minutes

            return () => clearInterval(refreshInterval);
        }
    }, [state.isAuthenticated, state.tokens]);

    const initializeAuth = async () => {
        try {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

            // Try to get stored authentication data
            const [storedUser, storedTokens] = await Promise.all([
                StorageService.getSecureData('user'),
                StorageService.getSecureData('tokens')
            ]);

            if (storedUser && storedTokens) {
                // Validate tokens
                const isValid = await AuthService.validateTokens(storedTokens);
                
                if (isValid) {
                    // Initialize AuthService with stored tokens
                    AuthService.initialize(storedTokens);
                    
                    dispatch({
                        type: AUTH_ACTIONS.INITIALIZE,
                        payload: {
                            user: storedUser,
                            tokens: storedTokens
                        }
                    });
                } else {
                    // Tokens are invalid, try to refresh
                    const refreshResult = await AuthService.refreshTokens(storedTokens.refreshToken);
                    
                    if (refreshResult.success) {
                        const newTokens = refreshResult.tokens;
                        
                        // Store new tokens
                        await StorageService.setSecureData('tokens', newTokens);
                        
                        // Initialize AuthService with new tokens
                        AuthService.initialize(newTokens);
                        
                        dispatch({
                            type: AUTH_ACTIONS.INITIALIZE,
                            payload: {
                                user: storedUser,
                                tokens: newTokens
                            }
                        });
                    } else {
                        // Refresh failed, clear stored data
                        await clearStoredAuth();
                        dispatch({
                            type: AUTH_ACTIONS.INITIALIZE,
                            payload: { user: null, tokens: null }
                        });
                    }
                }
            } else {
                // No stored authentication data
                dispatch({
                    type: AUTH_ACTIONS.INITIALIZE,
                    payload: { user: null, tokens: null }
                });
            }
        } catch (error) {
            console.error('Error initializing authentication:', error);
            dispatch({
                type: AUTH_ACTIONS.INITIALIZE,
                payload: { user: null, tokens: null }
            });
        }
    };

    const login = async (user, tokens) => {
        try {
            dispatch({ type: AUTH_ACTIONS.LOGIN_START });

            // Store authentication data
            await Promise.all([
                StorageService.setSecureData('user', user),
                StorageService.setSecureData('tokens', tokens)
            ]);

            // Initialize AuthService
            AuthService.initialize(tokens);

            dispatch({
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: { user, tokens }
            });

            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            dispatch({
                type: AUTH_ACTIONS.LOGIN_FAILURE,
                payload: { error: error.message }
            });
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

            // Call logout on AuthService
            await AuthService.logout();

            // Clear stored authentication data
            await clearStoredAuth();

            dispatch({ type: AUTH_ACTIONS.LOGOUT });
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear local state even if server logout fails
            await clearStoredAuth();
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
    };

    const updateUser = async (updatedUser) => {
        try {
            // Update user in storage
            await StorageService.setSecureData('user', updatedUser);
            
            dispatch({
                type: AUTH_ACTIONS.UPDATE_USER,
                payload: updatedUser
            });

            return { success: true };
        } catch (error) {
            console.error('Update user error:', error);
            return { success: false, error: error.message };
        }
    };

    const refreshTokens = async () => {
        try {
            if (!state.tokens?.refreshToken) {
                return { success: false, error: 'No refresh token available' };
            }

            const result = await AuthService.refreshTokens(state.tokens.refreshToken);
            
            if (result.success) {
                const newTokens = result.tokens;
                
                // Store new tokens
                await StorageService.setSecureData('tokens', newTokens);
                
                // Update context state
                dispatch({
                    type: AUTH_ACTIONS.REFRESH_TOKEN,
                    payload: { tokens: newTokens }
                });

                return { success: true, tokens: newTokens };
            } else {
                // Refresh failed, logout user
                await logout();
                return { success: false, error: 'Token refresh failed' };
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            await logout();
            return { success: false, error: error.message };
        }
    };

    const clearStoredAuth = async () => {
        try {
            await Promise.all([
                StorageService.removeSecureData('user'),
                StorageService.removeSecureData('tokens')
            ]);
        } catch (error) {
            console.error('Error clearing stored auth:', error);
        }
    };

    const resetPassword = async (email) => {
        try {
            const result = await AuthService.resetPassword(email);
            return result;
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, error: error.message };
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        try {
            const result = await AuthService.changePassword(currentPassword, newPassword);
            return result;
        } catch (error) {
            console.error('Change password error:', error);
            return { success: false, error: error.message };
        }
    };

    const deleteAccount = async () => {
        try {
            const result = await AuthService.deleteAccount();
            
            if (result.success) {
                // Clear all data and logout
                await StorageService.clearAllData();
                dispatch({ type: AUTH_ACTIONS.LOGOUT });
            }
            
            return result;
        } catch (error) {
            console.error('Delete account error:', error);
            return { success: false, error: error.message };
        }
    };

    // Context value
    const contextValue = {
        // State
        ...state,
        
        // Actions
        login,
        logout,
        updateUser,
        refreshTokens,
        resetPassword,
        changePassword,
        deleteAccount,
        
        // Utility
        isLoggedIn: state.isAuthenticated,
        userId: state.user?.id,
        userEmail: state.user?.email,
        userName: state.user?.name
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    
    return context;
};

// HOC for components that require authentication
export const withAuth = (Component) => {
    return function AuthenticatedComponent(props) {
        const { isAuthenticated, isInitialized } = useAuth();
        
        if (!isInitialized) {
            return null; // Or loading spinner
        }
        
        if (!isAuthenticated) {
            return null; // Or redirect to login
        }
        
        return <Component {...props} />;
    };
};

// Hook for protected routes
export const useAuthGuard = (redirectToLogin = true) => {
    const { isAuthenticated, isInitialized, isLoading } = useAuth();
    
    return {
        isAuthenticated,
        isInitialized,
        isLoading,
        shouldRedirect: !isAuthenticated && isInitialized && redirectToLogin
    };
};

export default AuthContext;