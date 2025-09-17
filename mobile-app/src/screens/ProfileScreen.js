/**
 * Profile Screen
 * User profile management and settings
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    Image,
    TouchableOpacity,
    Platform,
    ActionSheetIOS
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { 
    Button, 
    Input, 
    Card, 
    Avatar, 
    CustomSwitch,
    LoadingSpinner 
} from '../components/UIComponents';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { StorageService } from '../services/StorageService';
import { AuthService } from '../services/AuthService';

const ProfileScreen = ({ navigation }) => {
    const { user, updateUser } = useAuth();
    const { theme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        bio: '',
        avatar: null
    });
    const [preferences, setPreferences] = useState({
        notifications: true,
        biometricAuth: false,
        autoBackup: true,
        locationTracking: false
    });

    useEffect(() => {
        loadUserData();
        loadPreferences();
    }, [user]);

    const loadUserData = () => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                bio: user.bio || '',
                avatar: user.avatar || null
            });
        }
    };

    const loadPreferences = async () => {
        try {
            const userPreferences = await StorageService.getUserPreferences();
            setPreferences(prev => ({ ...prev, ...userPreferences }));
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePreferenceChange = async (key, value) => {
        try {
            const newPreferences = { ...preferences, [key]: value };
            setPreferences(newPreferences);
            await StorageService.setUserPreferences(newPreferences);
            
            // Handle special preferences
            if (key === 'biometricAuth' && value) {
                const isSupported = await AuthService.isBiometricSupported();
                if (!isSupported) {
                    Alert.alert(
                        'Biometric Authentication',
                        'Biometric authentication is not available on this device.'
                    );
                    setPreferences(prev => ({ ...prev, biometricAuth: false }));
                    return;
                }
                
                const isEnabled = await AuthService.enableBiometricAuth();
                if (!isEnabled) {
                    setPreferences(prev => ({ ...prev, biometricAuth: false }));
                }
            }
        } catch (error) {
            console.error('Error updating preference:', error);
            Alert.alert('Error', 'Failed to update preference');
        }
    };

    const handleImagePicker = () => {
        const options = [
            'Take Photo',
            'Choose from Library',
            'Cancel'
        ];

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex: 2,
                },
                (buttonIndex) => {
                    if (buttonIndex === 0) {
                        openCamera();
                    } else if (buttonIndex === 1) {
                        openImageLibrary();
                    }
                }
            );
        } else {
            Alert.alert(
                'Select Photo',
                'Choose an option',
                [
                    { text: 'Take Photo', onPress: openCamera },
                    { text: 'Choose from Library', onPress: openImageLibrary },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        }
    };

    const openCamera = () => {
        const options = {
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 500,
            maxHeight: 500,
        };

        launchCamera(options, (response) => {
            if (response.assets && response.assets[0]) {
                setFormData(prev => ({
                    ...prev,
                    avatar: response.assets[0].uri
                }));
            }
        });
    };

    const openImageLibrary = () => {
        const options = {
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 500,
            maxHeight: 500,
        };

        launchImageLibrary(options, (response) => {
            if (response.assets && response.assets[0]) {
                setFormData(prev => ({
                    ...prev,
                    avatar: response.assets[0].uri
                }));
            }
        });
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            
            // Validate required fields
            if (!formData.name.trim()) {
                Alert.alert('Error', 'Name is required');
                return;
            }
            
            if (!formData.email.trim()) {
                Alert.alert('Error', 'Email is required');
                return;
            }

            // Update user profile
            const updatedUser = {
                ...user,
                ...formData
            };

            await updateUser(updatedUser);
            
            // Cache user data
            await StorageService.setCachedData('user_profile', updatedUser);
            
            setIsEditing(false);
            Alert.alert('Success', 'Profile updated successfully');
            
        } catch (error) {
            console.error('Error saving profile:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        loadUserData();
        setIsEditing(false);
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: confirmDeleteAccount
                }
            ]
        );
    };

    const confirmDeleteAccount = () => {
        Alert.alert(
            'Final Confirmation',
            'This will permanently delete your account and all associated data. Type "DELETE" to confirm.',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'I understand, delete my account', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            // In a real app, call API to delete account
                            await AuthService.deleteAccount();
                            // Clear all local data
                            await StorageService.clearAllData();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete account');
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <LoadingSpinner text="Loading profile..." />
            </SafeAreaView>
        );
    }

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
                        Profile
                    </Text>
                    <TouchableOpacity
                        onPress={() => setIsEditing(!isEditing)}
                        style={styles.editButton}
                    >
                        <Text style={[styles.editText, { color: theme.primary }]}>
                            {isEditing ? 'Cancel' : 'Edit'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Avatar Section */}
                <Card style={[styles.avatarCard, { backgroundColor: theme.surface }]}>
                    <View style={styles.avatarContainer}>
                        <Avatar
                            source={formData.avatar ? { uri: formData.avatar } : null}
                            name={formData.name}
                            size={100}
                            onPress={isEditing ? handleImagePicker : null}
                        />
                        {isEditing && (
                            <TouchableOpacity
                                style={[styles.changePhotoButton, { backgroundColor: theme.primary }]}
                                onPress={handleImagePicker}
                            >
                                <Text style={styles.changePhotoText}>Change Photo</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Card>

                {/* Profile Information */}
                <Card style={[styles.infoCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Personal Information
                    </Text>
                    
                    <Input
                        label="Full Name"
                        value={formData.name}
                        onChangeText={(value) => handleInputChange('name', value)}
                        editable={isEditing}
                        style={!isEditing && styles.disabledInput}
                    />
                    
                    <Input
                        label="Email"
                        value={formData.email}
                        onChangeText={(value) => handleInputChange('email', value)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={isEditing}
                        style={!isEditing && styles.disabledInput}
                    />
                    
                    <Input
                        label="Phone"
                        value={formData.phone}
                        onChangeText={(value) => handleInputChange('phone', value)}
                        keyboardType="phone-pad"
                        editable={isEditing}
                        style={!isEditing && styles.disabledInput}
                    />
                    
                    <Input
                        label="Bio"
                        value={formData.bio}
                        onChangeText={(value) => handleInputChange('bio', value)}
                        multiline
                        numberOfLines={3}
                        editable={isEditing}
                        style={!isEditing && styles.disabledInput}
                    />
                </Card>

                {/* Preferences */}
                <Card style={[styles.preferencesCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Preferences
                    </Text>
                    
                    <View style={styles.preferenceItem}>
                        <View style={styles.preferenceInfo}>
                            <Text style={[styles.preferenceLabel, { color: theme.text }]}>
                                Push Notifications
                            </Text>
                            <Text style={[styles.preferenceDescription, { color: theme.textSecondary }]}>
                                Receive notifications for updates
                            </Text>
                        </View>
                        <CustomSwitch
                            value={preferences.notifications}
                            onValueChange={(value) => handlePreferenceChange('notifications', value)}
                        />
                    </View>
                    
                    <View style={styles.preferenceItem}>
                        <View style={styles.preferenceInfo}>
                            <Text style={[styles.preferenceLabel, { color: theme.text }]}>
                                Biometric Authentication
                            </Text>
                            <Text style={[styles.preferenceDescription, { color: theme.textSecondary }]}>
                                Use fingerprint or face recognition
                            </Text>
                        </View>
                        <CustomSwitch
                            value={preferences.biometricAuth}
                            onValueChange={(value) => handlePreferenceChange('biometricAuth', value)}
                        />
                    </View>
                    
                    <View style={styles.preferenceItem}>
                        <View style={styles.preferenceInfo}>
                            <Text style={[styles.preferenceLabel, { color: theme.text }]}>
                                Auto Backup
                            </Text>
                            <Text style={[styles.preferenceDescription, { color: theme.textSecondary }]}>
                                Automatically backup your data
                            </Text>
                        </View>
                        <CustomSwitch
                            value={preferences.autoBackup}
                            onValueChange={(value) => handlePreferenceChange('autoBackup', value)}
                        />
                    </View>
                    
                    <View style={styles.preferenceItem}>
                        <View style={styles.preferenceInfo}>
                            <Text style={[styles.preferenceLabel, { color: theme.text }]}>
                                Location Tracking
                            </Text>
                            <Text style={[styles.preferenceDescription, { color: theme.textSecondary }]}>
                                Allow location-based features
                            </Text>
                        </View>
                        <CustomSwitch
                            value={preferences.locationTracking}
                            onValueChange={(value) => handlePreferenceChange('locationTracking', value)}
                        />
                    </View>
                </Card>

                {/* Action Buttons */}
                {isEditing && (
                    <View style={styles.actionButtons}>
                        <Button
                            title="Save Changes"
                            onPress={handleSave}
                            loading={isSaving}
                            variant="primary"
                            style={styles.saveButton}
                        />
                        <Button
                            title="Cancel"
                            onPress={handleCancel}
                            variant="outline"
                            style={styles.cancelButton}
                        />
                    </View>
                )}

                {/* Danger Zone */}
                <Card style={[styles.dangerCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: '#dc3545' }]}>
                        Danger Zone
                    </Text>
                    <Text style={[styles.dangerDescription, { color: theme.textSecondary }]}>
                        These actions cannot be undone. Please be careful.
                    </Text>
                    <Button
                        title="Delete Account"
                        onPress={handleDeleteAccount}
                        variant="outline"
                        style={[styles.deleteButton, { borderColor: '#dc3545' }]}
                        textStyle={{ color: '#dc3545' }}
                    />
                </Card>
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
    editButton: {
        padding: 8,
    },
    editText: {
        fontSize: 16,
        fontWeight: '500',
    },
    avatarCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        alignItems: 'center',
        paddingVertical: 24,
    },
    avatarContainer: {
        alignItems: 'center',
    },
    changePhotoButton: {
        marginTop: 12,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 16,
    },
    changePhotoText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    infoCard: {
        marginHorizontal: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    disabledInput: {
        opacity: 0.7,
    },
    preferencesCard: {
        marginHorizontal: 16,
        marginBottom: 16,
    },
    preferenceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    preferenceInfo: {
        flex: 1,
        marginRight: 16,
    },
    preferenceLabel: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    preferenceDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    actionButtons: {
        marginHorizontal: 16,
        marginBottom: 16,
        gap: 12,
    },
    saveButton: {
        marginBottom: 8,
    },
    cancelButton: {
        backgroundColor: 'transparent',
    },
    dangerCard: {
        marginHorizontal: 16,
        marginBottom: 32,
    },
    dangerDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    deleteButton: {
        backgroundColor: 'transparent',
    },
});

export default ProfileScreen;