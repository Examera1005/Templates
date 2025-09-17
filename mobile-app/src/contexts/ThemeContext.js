/**
 * Theme Context
 * Global theme management with dark/light mode support
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Appearance, StatusBar } from 'react-native';
import { StorageService } from '../services/StorageService';

// Theme configurations
const lightTheme = {
    // Colors
    primary: '#007bff',
    primaryDark: '#0056b3',
    secondary: '#6c757d',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#17a2b8',
    
    // Background colors
    background: '#ffffff',
    surface: '#f8f9fa',
    card: '#ffffff',
    
    // Text colors
    text: '#212529',
    textSecondary: '#6c757d',
    textDisabled: '#adb5bd',
    textInverse: '#ffffff',
    
    // Border and divider colors
    border: '#dee2e6',
    divider: '#e9ecef',
    
    // Status bar
    statusBarStyle: 'dark-content',
    statusBarBackground: '#ffffff',
    
    // Input colors
    inputBackground: '#ffffff',
    inputBorder: '#ced4da',
    inputBorderFocused: '#007bff',
    inputPlaceholder: '#6c757d',
    
    // Button colors
    buttonPrimary: '#007bff',
    buttonPrimaryText: '#ffffff',
    buttonSecondary: '#6c757d',
    buttonSecondaryText: '#ffffff',
    buttonOutline: 'transparent',
    buttonOutlineText: '#007bff',
    buttonOutlineBorder: '#007bff',
    
    // Shadow
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
};

const darkTheme = {
    // Colors
    primary: '#0d6efd',
    primaryDark: '#0a58ca',
    secondary: '#6c757d',
    success: '#198754',
    warning: '#fd7e14',
    error: '#dc3545',
    info: '#0dcaf0',
    
    // Background colors
    background: '#121212',
    surface: '#1e1e1e',
    card: '#2d2d2d',
    
    // Text colors
    text: '#ffffff',
    textSecondary: '#adb5bd',
    textDisabled: '#6c757d',
    textInverse: '#000000',
    
    // Border and divider colors
    border: '#495057',
    divider: '#343a40',
    
    // Status bar
    statusBarStyle: 'light-content',
    statusBarBackground: '#121212',
    
    // Input colors
    inputBackground: '#2d2d2d',
    inputBorder: '#495057',
    inputBorderFocused: '#0d6efd',
    inputPlaceholder: '#adb5bd',
    
    // Button colors
    buttonPrimary: '#0d6efd',
    buttonPrimaryText: '#ffffff',
    buttonSecondary: '#6c757d',
    buttonSecondaryText: '#ffffff',
    buttonOutline: 'transparent',
    buttonOutlineText: '#0d6efd',
    buttonOutlineBorder: '#0d6efd',
    
    // Shadow
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5
};

// Action types
const THEME_ACTIONS = {
    SET_THEME: 'SET_THEME',
    TOGGLE_THEME: 'TOGGLE_THEME',
    SET_SYSTEM_THEME: 'SET_SYSTEM_THEME',
    INITIALIZE: 'INITIALIZE'
};

// Initial state
const initialState = {
    isDarkMode: false,
    theme: lightTheme,
    systemTheme: 'light',
    themePreference: 'system', // 'light', 'dark', 'system'
    isInitialized: false
};

// Reducer
const themeReducer = (state, action) => {
    switch (action.type) {
        case THEME_ACTIONS.SET_THEME:
            return {
                ...state,
                isDarkMode: action.payload.isDarkMode,
                theme: action.payload.isDarkMode ? darkTheme : lightTheme,
                themePreference: action.payload.preference || state.themePreference
            };

        case THEME_ACTIONS.TOGGLE_THEME:
            const newIsDarkMode = !state.isDarkMode;
            return {
                ...state,
                isDarkMode: newIsDarkMode,
                theme: newIsDarkMode ? darkTheme : lightTheme,
                themePreference: newIsDarkMode ? 'dark' : 'light'
            };

        case THEME_ACTIONS.SET_SYSTEM_THEME:
            const systemIsDark = action.payload === 'dark';
            const shouldUseDark = state.themePreference === 'system' ? systemIsDark : state.isDarkMode;
            
            return {
                ...state,
                systemTheme: action.payload,
                isDarkMode: shouldUseDark,
                theme: shouldUseDark ? darkTheme : lightTheme
            };

        case THEME_ACTIONS.INITIALIZE:
            return {
                ...state,
                ...action.payload,
                isInitialized: true
            };

        default:
            return state;
    }
};

// Create context
const ThemeContext = createContext({});

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
    const [state, dispatch] = useReducer(themeReducer, initialState);

    // Initialize theme
    useEffect(() => {
        initializeTheme();
    }, []);

    // Listen to system theme changes
    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            dispatch({
                type: THEME_ACTIONS.SET_SYSTEM_THEME,
                payload: colorScheme || 'light'
            });
        });

        return () => subscription.remove();
    }, []);

    // Update status bar when theme changes
    useEffect(() => {
        StatusBar.setBarStyle(state.theme.statusBarStyle, true);
        
        if (Platform.OS === 'android') {
            StatusBar.setBackgroundColor(state.theme.statusBarBackground, true);
        }
    }, [state.theme]);

    const initializeTheme = async () => {
        try {
            // Get system theme
            const systemColorScheme = Appearance.getColorScheme() || 'light';
            
            // Get stored theme preference
            const storedPreference = await StorageService.getData('theme_preference');
            const themePreference = storedPreference || 'system';
            
            // Determine which theme to use
            let isDarkMode = false;
            
            switch (themePreference) {
                case 'dark':
                    isDarkMode = true;
                    break;
                case 'light':
                    isDarkMode = false;
                    break;
                case 'system':
                default:
                    isDarkMode = systemColorScheme === 'dark';
                    break;
            }
            
            dispatch({
                type: THEME_ACTIONS.INITIALIZE,
                payload: {
                    isDarkMode,
                    theme: isDarkMode ? darkTheme : lightTheme,
                    systemTheme: systemColorScheme,
                    themePreference
                }
            });
        } catch (error) {
            console.error('Error initializing theme:', error);
            // Fallback to light theme
            dispatch({
                type: THEME_ACTIONS.INITIALIZE,
                payload: {
                    isDarkMode: false,
                    theme: lightTheme,
                    systemTheme: 'light',
                    themePreference: 'light'
                }
            });
        }
    };

    const setTheme = async (preference) => {
        try {
            let isDarkMode = false;
            
            switch (preference) {
                case 'dark':
                    isDarkMode = true;
                    break;
                case 'light':
                    isDarkMode = false;
                    break;
                case 'system':
                    isDarkMode = state.systemTheme === 'dark';
                    break;
                default:
                    return;
            }
            
            // Store preference
            await StorageService.setData('theme_preference', preference);
            
            dispatch({
                type: THEME_ACTIONS.SET_THEME,
                payload: { isDarkMode, preference }
            });
        } catch (error) {
            console.error('Error setting theme:', error);
        }
    };

    const toggleTheme = async () => {
        try {
            const newPreference = state.isDarkMode ? 'light' : 'dark';
            await setTheme(newPreference);
        } catch (error) {
            console.error('Error toggling theme:', error);
        }
    };

    const getThemeColors = (customColors = {}) => {
        return {
            ...state.theme,
            ...customColors
        };
    };

    const createThemedStyles = (styleFunction) => {
        return styleFunction(state.theme);
    };

    // Context value
    const contextValue = {
        // State
        ...state,
        
        // Actions
        setTheme,
        toggleTheme,
        
        // Utilities
        getThemeColors,
        createThemedStyles,
        lightTheme,
        darkTheme,
        
        // Theme helpers
        isLight: !state.isDarkMode,
        colors: state.theme
    };

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};

// Hook to use theme context
export const useTheme = () => {
    const context = useContext(ThemeContext);
    
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    
    return context;
};

// HOC for themed components
export const withTheme = (Component) => {
    return function ThemedComponent(props) {
        const theme = useTheme();
        return <Component {...props} theme={theme} />;
    };
};

// Hook for creating themed styles
export const useThemedStyles = (styleFunction) => {
    const { theme, createThemedStyles } = useTheme();
    
    return React.useMemo(() => {
        return createThemedStyles(styleFunction);
    }, [theme, styleFunction]);
};

// Custom theme hooks
export const useThemeColors = () => {
    const { theme } = useTheme();
    return theme;
};

export const useStatusBarConfig = () => {
    const { theme } = useTheme();
    
    return {
        barStyle: theme.statusBarStyle,
        backgroundColor: theme.statusBarBackground
    };
};

// Theme constants
export const THEME_MODES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system'
};

export { lightTheme, darkTheme };
export default ThemeContext;