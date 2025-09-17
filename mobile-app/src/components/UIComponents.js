/**
 * Mobile UI Component Library
 * Reusable components optimized for mobile interfaces
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
    ActivityIndicator,
    Modal,
    SafeAreaView,
    ScrollView,
    TextInput,
    Image,
    Alert
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Button Component
export const Button = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    icon = null,
    style = {},
    textStyle = {},
    ...props
}) => {
    const buttonStyles = [
        styles.button,
        styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
        styles[`button${size.charAt(0).toUpperCase() + size.slice(1)}`],
        disabled && styles.buttonDisabled,
        style
    ];

    const textStyles = [
        styles.buttonText,
        styles[`buttonText${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
        styles[`buttonText${size.charAt(0).toUpperCase() + size.slice(1)}`],
        disabled && styles.buttonTextDisabled,
        textStyle
    ];

    return (
        <TouchableOpacity
            style={buttonStyles}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
            ) : (
                <View style={styles.buttonContent}>
                    {icon && <View style={styles.buttonIcon}>{icon}</View>}
                    <Text style={textStyles}>{title}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

// Input Component
export const Input = ({
    value,
    onChangeText,
    placeholder,
    secureTextEntry = false,
    multiline = false,
    error = null,
    label = null,
    icon = null,
    style = {},
    inputStyle = {},
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={[styles.inputContainer, style]}>
            {label && <Text style={styles.inputLabel}>{label}</Text>}
            <View style={[
                styles.inputWrapper,
                isFocused && styles.inputWrapperFocused,
                error && styles.inputWrapperError
            ]}>
                {icon && <View style={styles.inputIcon}>{icon}</View>}
                <TextInput
                    style={[styles.input, inputStyle]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#999"
                    secureTextEntry={secureTextEntry}
                    multiline={multiline}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />
            </View>
            {error && <Text style={styles.inputError}>{error}</Text>}
        </View>
    );
};

// Card Component
export const Card = ({
    children,
    style = {},
    onPress = null,
    shadow = true,
    padding = true,
    ...props
}) => {
    const Component = onPress ? TouchableOpacity : View;
    
    return (
        <Component
            style={[
                styles.card,
                shadow && styles.cardShadow,
                padding && styles.cardPadding,
                style
            ]}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            {...props}
        >
            {children}
        </Component>
    );
};

// Modal Component
export const CustomModal = ({
    visible,
    onClose,
    title,
    children,
    animationType = 'slide',
    showCloseButton = true,
    style = {}
}) => {
    return (
        <Modal
            visible={visible}
            animationType={animationType}
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <SafeAreaView style={styles.modalContainer}>
                    <View style={[styles.modalContent, style]}>
                        {title && (
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{title}</Text>
                                {showCloseButton && (
                                    <TouchableOpacity
                                        onPress={onClose}
                                        style={styles.modalCloseButton}
                                    >
                                        <Text style={styles.modalCloseText}>×</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                        <ScrollView style={styles.modalBody}>
                            {children}
                        </ScrollView>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

// Loading Component
export const LoadingSpinner = ({
    size = 'large',
    color = '#007bff',
    style = {},
    text = null
}) => {
    return (
        <View style={[styles.loadingContainer, style]}>
            <ActivityIndicator size={size} color={color} />
            {text && <Text style={styles.loadingText}>{text}</Text>}
        </View>
    );
};

// Avatar Component
export const Avatar = ({
    source,
    size = 50,
    name = '',
    style = {},
    onPress = null
}) => {
    const Component = onPress ? TouchableOpacity : View;
    const avatarStyle = [
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        style
    ];

    const initials = name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <Component style={avatarStyle} onPress={onPress} activeOpacity={0.7}>
            {source ? (
                <Image source={source} style={styles.avatarImage} />
            ) : (
                <View style={styles.avatarPlaceholder}>
                    <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
                        {initials}
                    </Text>
                </View>
            )}
        </Component>
    );
};

// Badge Component
export const Badge = ({
    value,
    maxValue = 99,
    style = {},
    textStyle = {},
    showZero = false
}) => {
    if (!showZero && (!value || value === 0)) {
        return null;
    }

    const displayValue = value > maxValue ? `${maxValue}+` : value.toString();

    return (
        <View style={[styles.badge, style]}>
            <Text style={[styles.badgeText, textStyle]}>{displayValue}</Text>
        </View>
    );
};

// Switch Component
export const CustomSwitch = ({
    value,
    onValueChange,
    disabled = false,
    trackColor = { false: '#ccc', true: '#007bff' },
    thumbColor = '#fff',
    style = {}
}) => {
    const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [value]);

    const handlePress = () => {
        if (!disabled) {
            onValueChange(!value);
        }
    };

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 22],
    });

    const backgroundColor = value ? trackColor.true : trackColor.false;

    return (
        <TouchableOpacity
            style={[
                styles.switchContainer,
                { backgroundColor },
                disabled && styles.switchDisabled,
                style
            ]}
            onPress={handlePress}
            activeOpacity={0.7}
            disabled={disabled}
        >
            <Animated.View
                style={[
                    styles.switchThumb,
                    { backgroundColor: thumbColor, transform: [{ translateX }] }
                ]}
            />
        </TouchableOpacity>
    );
};

// Progress Bar Component
export const ProgressBar = ({
    progress = 0,
    height = 8,
    backgroundColor = '#e0e0e0',
    progressColor = '#007bff',
    style = {},
    animated = true
}) => {
    const animatedWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (animated) {
            Animated.timing(animatedWidth, {
                toValue: progress,
                duration: 300,
                useNativeDriver: false,
            }).start();
        } else {
            animatedWidth.setValue(progress);
        }
    }, [progress, animated]);

    const width = animated ? animatedWidth.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
    }) : `${Math.max(0, Math.min(100, progress * 100))}%`;

    return (
        <View style={[
            styles.progressContainer,
            { height, backgroundColor },
            style
        ]}>
            <Animated.View
                style={[
                    styles.progressBar,
                    { backgroundColor: progressColor, width }
                ]}
            />
        </View>
    );
};

// Chip Component
export const Chip = ({
    label,
    onPress = null,
    onDelete = null,
    selected = false,
    disabled = false,
    style = {},
    textStyle = {}
}) => {
    const Component = onPress ? TouchableOpacity : View;

    return (
        <Component
            style={[
                styles.chip,
                selected && styles.chipSelected,
                disabled && styles.chipDisabled,
                style
            ]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
        >
            <Text style={[
                styles.chipText,
                selected && styles.chipTextSelected,
                disabled && styles.chipTextDisabled,
                textStyle
            ]}>
                {label}
            </Text>
            {onDelete && (
                <TouchableOpacity
                    style={styles.chipDeleteButton}
                    onPress={onDelete}
                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                    <Text style={styles.chipDeleteText}>×</Text>
                </TouchableOpacity>
            )}
        </Component>
    );
};

// Divider Component
export const Divider = ({
    style = {},
    color = '#e0e0e0',
    height = 1,
    horizontal = true
}) => {
    const dividerStyle = horizontal
        ? { height, backgroundColor: color, width: '100%' }
        : { width: height, backgroundColor: color, height: '100%' };

    return <View style={[dividerStyle, style]} />;
};

// Styles
const styles = StyleSheet.create({
    // Button Styles
    button: {
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    buttonPrimary: {
        backgroundColor: '#007bff',
    },
    buttonSecondary: {
        backgroundColor: '#6c757d',
    },
    buttonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#007bff',
    },
    buttonText: {
        fontWeight: '600',
        textAlign: 'center',
    },
    buttonTextPrimary: {
        color: '#ffffff',
    },
    buttonTextSecondary: {
        color: '#ffffff',
    },
    buttonTextOutline: {
        color: '#007bff',
    },
    buttonSmall: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    buttonMedium: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    buttonLarge: {
        paddingVertical: 16,
        paddingHorizontal: 32,
    },
    buttonTextSmall: {
        fontSize: 14,
    },
    buttonTextMedium: {
        fontSize: 16,
    },
    buttonTextLarge: {
        fontSize: 18,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonTextDisabled: {
        color: '#999',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonIcon: {
        marginRight: 8,
    },

    // Input Styles
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    inputWrapperFocused: {
        borderColor: '#007bff',
    },
    inputWrapperError: {
        borderColor: '#dc3545',
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#333',
    },
    inputIcon: {
        paddingLeft: 12,
    },
    inputError: {
        marginTop: 4,
        fontSize: 14,
        color: '#dc3545',
    },

    // Card Styles
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 16,
    },
    cardShadow: {
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    cardPadding: {
        padding: 16,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: SCREEN_WIDTH * 0.9,
        maxHeight: SCREEN_HEIGHT * 0.8,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    modalCloseButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#666',
    },
    modalBody: {
        padding: 16,
    },

    // Loading Styles
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },

    // Avatar Styles
    avatar: {
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
    },

    // Badge Styles
    badge: {
        backgroundColor: '#dc3545',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },

    // Switch Styles
    switchContainer: {
        width: 44,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
    },
    switchThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        position: 'absolute',
    },
    switchDisabled: {
        opacity: 0.5,
    },

    // Progress Bar Styles
    progressContainer: {
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },

    // Chip Styles
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#e0e0e0',
        marginRight: 8,
        marginBottom: 8,
    },
    chipSelected: {
        backgroundColor: '#007bff',
    },
    chipDisabled: {
        opacity: 0.5,
    },
    chipText: {
        fontSize: 14,
        color: '#333',
    },
    chipTextSelected: {
        color: '#fff',
    },
    chipTextDisabled: {
        color: '#999',
    },
    chipDeleteButton: {
        marginLeft: 6,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipDeleteText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});