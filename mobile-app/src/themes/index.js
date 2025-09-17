/**
 * Mobile App Theme Configuration
 * Comprehensive theming system for React Native applications
 */

import { Platform, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Design system constants
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
};

export const BORDER_RADIUS = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999
};

export const FONT_SIZES = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32
};

export const FONT_WEIGHTS = {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800'
};

export const LINE_HEIGHTS = {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8
};

// Animation constants
export const ANIMATIONS = {
    timing: {
        fast: 200,
        normal: 300,
        slow: 500
    },
    easing: {
        easeInOut: 'ease-in-out',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        linear: 'linear'
    }
};

// Device breakpoints
export const BREAKPOINTS = {
    small: 320,
    medium: 375,
    large: 414,
    tablet: 768
};

// Z-index layers
export const Z_INDEX = {
    background: -1,
    base: 0,
    content: 1,
    header: 10,
    overlay: 20,
    modal: 30,
    popover: 40,
    tooltip: 50,
    notification: 60
};

// Light theme colors
export const LIGHT_COLORS = {
    // Brand colors
    primary: '#007bff',
    primaryDark: '#0056b3',
    primaryLight: '#4dabf7',
    secondary: '#6c757d',
    secondaryDark: '#545b62',
    secondaryLight: '#868e96',
    
    // Semantic colors
    success: '#28a745',
    successDark: '#1e7e34',
    successLight: '#71dd8a',
    warning: '#ffc107',
    warningDark: '#d39e00',
    warningLight: '#ffe066',
    error: '#dc3545',
    errorDark: '#bd2130',
    errorLight: '#f5c6cb',
    info: '#17a2b8',
    infoDark: '#117a8b',
    infoLight: '#9fdbef',
    
    // Neutral colors
    white: '#ffffff',
    black: '#000000',
    gray50: '#f8f9fa',
    gray100: '#e9ecef',
    gray200: '#dee2e6',
    gray300: '#ced4da',
    gray400: '#adb5bd',
    gray500: '#6c757d',
    gray600: '#495057',
    gray700: '#343a40',
    gray800: '#212529',
    gray900: '#1a1a1a',
    
    // Background colors
    background: '#ffffff',
    backgroundSecondary: '#f8f9fa',
    surface: '#ffffff',
    surfaceSecondary: '#f8f9fa',
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    // Text colors
    text: '#212529',
    textSecondary: '#6c757d',
    textTertiary: '#adb5bd',
    textDisabled: '#ced4da',
    textInverse: '#ffffff',
    textLink: '#007bff',
    
    // Border colors
    border: '#dee2e6',
    borderLight: '#e9ecef',
    borderDark: '#ced4da',
    divider: '#e9ecef',
    
    // Input colors
    inputBackground: '#ffffff',
    inputBorder: '#ced4da',
    inputBorderFocused: '#007bff',
    inputBorderError: '#dc3545',
    inputPlaceholder: '#6c757d',
    inputText: '#212529',
    inputDisabled: '#e9ecef',
    
    // Button colors
    buttonPrimary: '#007bff',
    buttonPrimaryText: '#ffffff',
    buttonSecondary: '#6c757d',
    buttonSecondaryText: '#ffffff',
    buttonSuccess: '#28a745',
    buttonSuccessText: '#ffffff',
    buttonWarning: '#ffc107',
    buttonWarningText: '#212529',
    buttonError: '#dc3545',
    buttonErrorText: '#ffffff',
    buttonOutline: 'transparent',
    buttonOutlineText: '#007bff',
    buttonOutlineBorder: '#007bff',
    buttonDisabled: '#e9ecef',
    buttonDisabledText: '#6c757d',
    
    // Card colors
    cardBackground: '#ffffff',
    cardBorder: '#dee2e6',
    cardShadow: 'rgba(0, 0, 0, 0.1)',
    
    // Status bar
    statusBarStyle: 'dark-content',
    statusBarBackground: '#ffffff'
};

// Dark theme colors
export const DARK_COLORS = {
    // Brand colors
    primary: '#0d6efd',
    primaryDark: '#0a58ca',
    primaryLight: '#6ea8fe',
    secondary: '#6c757d',
    secondaryDark: '#495057',
    secondaryLight: '#adb5bd',
    
    // Semantic colors
    success: '#198754',
    successDark: '#146c43',
    successLight: '#75b798',
    warning: '#fd7e14',
    warningDark: '#e55a08',
    warningLight: '#feb366',
    error: '#dc3545',
    errorDark: '#b02a37',
    errorLight: '#ea868f',
    info: '#0dcaf0',
    infoDark: '#087990',
    infoLight: '#6edff6',
    
    // Neutral colors
    white: '#ffffff',
    black: '#000000',
    gray50: '#343a40',
    gray100: '#495057',
    gray200: '#6c757d',
    gray300: '#adb5bd',
    gray400: '#ced4da',
    gray500: '#dee2e6',
    gray600: '#e9ecef',
    gray700: '#f8f9fa',
    gray800: '#ffffff',
    gray900: '#ffffff',
    
    // Background colors
    background: '#121212',
    backgroundSecondary: '#1e1e1e',
    surface: '#1e1e1e',
    surfaceSecondary: '#2d2d2d',
    overlay: 'rgba(0, 0, 0, 0.7)',
    
    // Text colors
    text: '#ffffff',
    textSecondary: '#adb5bd',
    textTertiary: '#6c757d',
    textDisabled: '#495057',
    textInverse: '#000000',
    textLink: '#6ea8fe',
    
    // Border colors
    border: '#495057',
    borderLight: '#343a40',
    borderDark: '#6c757d',
    divider: '#343a40',
    
    // Input colors
    inputBackground: '#2d2d2d',
    inputBorder: '#495057',
    inputBorderFocused: '#0d6efd',
    inputBorderError: '#dc3545',
    inputPlaceholder: '#adb5bd',
    inputText: '#ffffff',
    inputDisabled: '#343a40',
    
    // Button colors
    buttonPrimary: '#0d6efd',
    buttonPrimaryText: '#ffffff',
    buttonSecondary: '#6c757d',
    buttonSecondaryText: '#ffffff',
    buttonSuccess: '#198754',
    buttonSuccessText: '#ffffff',
    buttonWarning: '#fd7e14',
    buttonWarningText: '#000000',
    buttonError: '#dc3545',
    buttonErrorText: '#ffffff',
    buttonOutline: 'transparent',
    buttonOutlineText: '#0d6efd',
    buttonOutlineBorder: '#0d6efd',
    buttonDisabled: '#343a40',
    buttonDisabledText: '#6c757d',
    
    // Card colors
    cardBackground: '#1e1e1e',
    cardBorder: '#495057',
    cardShadow: 'rgba(0, 0, 0, 0.3)',
    
    // Status bar
    statusBarStyle: 'light-content',
    statusBarBackground: '#121212'
};

// Shadow presets
export const SHADOWS = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0
    },
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8
    },
    xlarge: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 16
    }
};

// Typography presets
export const TYPOGRAPHY = {
    h1: {
        fontSize: FONT_SIZES.xxxl,
        fontWeight: FONT_WEIGHTS.bold,
        lineHeight: FONT_SIZES.xxxl * LINE_HEIGHTS.tight
    },
    h2: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: FONT_WEIGHTS.bold,
        lineHeight: FONT_SIZES.xxl * LINE_HEIGHTS.tight
    },
    h3: {
        fontSize: FONT_SIZES.xl,
        fontWeight: FONT_WEIGHTS.semibold,
        lineHeight: FONT_SIZES.xl * LINE_HEIGHTS.normal
    },
    h4: {
        fontSize: FONT_SIZES.lg,
        fontWeight: FONT_WEIGHTS.semibold,
        lineHeight: FONT_SIZES.lg * LINE_HEIGHTS.normal
    },
    h5: {
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.medium,
        lineHeight: FONT_SIZES.md * LINE_HEIGHTS.normal
    },
    h6: {
        fontSize: FONT_SIZES.sm,
        fontWeight: FONT_WEIGHTS.medium,
        lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal
    },
    body1: {
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.normal,
        lineHeight: FONT_SIZES.md * LINE_HEIGHTS.relaxed
    },
    body2: {
        fontSize: FONT_SIZES.sm,
        fontWeight: FONT_WEIGHTS.normal,
        lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.relaxed
    },
    caption: {
        fontSize: FONT_SIZES.xs,
        fontWeight: FONT_WEIGHTS.normal,
        lineHeight: FONT_SIZES.xs * LINE_HEIGHTS.normal
    },
    button: {
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.medium,
        lineHeight: FONT_SIZES.md * LINE_HEIGHTS.tight
    },
    overline: {
        fontSize: FONT_SIZES.xs,
        fontWeight: FONT_WEIGHTS.medium,
        lineHeight: FONT_SIZES.xs * LINE_HEIGHTS.tight,
        letterSpacing: 1.5,
        textTransform: 'uppercase'
    }
};

// Component styles
export const COMPONENT_STYLES = {
    button: {
        borderRadius: BORDER_RADIUS.md,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        minHeight: 48,
        ...SHADOWS.small
    },
    input: {
        borderRadius: BORDER_RADIUS.md,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        minHeight: 48,
        borderWidth: 1
    },
    card: {
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        ...SHADOWS.medium
    },
    modal: {
        borderRadius: BORDER_RADIUS.lg,
        ...SHADOWS.large
    }
};

// Create theme object
export const createTheme = (colors) => ({
    colors,
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    fontSizes: FONT_SIZES,
    fontWeights: FONT_WEIGHTS,
    lineHeights: LINE_HEIGHTS,
    typography: TYPOGRAPHY,
    shadows: SHADOWS,
    animations: ANIMATIONS,
    breakpoints: BREAKPOINTS,
    zIndex: Z_INDEX,
    components: COMPONENT_STYLES,
    
    // Utility functions
    getSpacing: (size) => SPACING[size] || size,
    getFontSize: (size) => FONT_SIZES[size] || size,
    getBorderRadius: (size) => BORDER_RADIUS[size] || size,
    getShadow: (size) => SHADOWS[size] || SHADOWS.none,
    getTypography: (variant) => TYPOGRAPHY[variant] || TYPOGRAPHY.body1,
    
    // Platform specific helpers
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    
    // Screen dimensions
    screen: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        isSmall: SCREEN_WIDTH < BREAKPOINTS.medium,
        isMedium: SCREEN_WIDTH >= BREAKPOINTS.medium && SCREEN_WIDTH < BREAKPOINTS.large,
        isLarge: SCREEN_WIDTH >= BREAKPOINTS.large && SCREEN_WIDTH < BREAKPOINTS.tablet,
        isTablet: SCREEN_WIDTH >= BREAKPOINTS.tablet
    }
});

// Light theme
export const lightTheme = createTheme(LIGHT_COLORS);

// Dark theme
export const darkTheme = createTheme(DARK_COLORS);

// Theme utilities
export const getThemeColor = (theme, colorPath) => {
    const pathArray = colorPath.split('.');
    return pathArray.reduce((obj, key) => obj?.[key], theme.colors);
};

export const createThemedStyle = (theme, styleFunction) => {
    return typeof styleFunction === 'function' ? styleFunction(theme) : styleFunction;
};

export const hexToRgba = (hex, alpha = 1) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
        : hex;
};

export const lighten = (color, percentage) => {
    // Simple color lightening utility
    // In production, consider using a color manipulation library
    return color;
};

export const darken = (color, percentage) => {
    // Simple color darkening utility
    // In production, consider using a color manipulation library
    return color;
};

// Export default themes
export default {
    light: lightTheme,
    dark: darkTheme,
    createTheme,
    SPACING,
    BORDER_RADIUS,
    FONT_SIZES,
    FONT_WEIGHTS,
    LINE_HEIGHTS,
    TYPOGRAPHY,
    SHADOWS,
    ANIMATIONS,
    BREAKPOINTS,
    Z_INDEX,
    COMPONENT_STYLES
};