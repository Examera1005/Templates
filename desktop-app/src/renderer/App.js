/**
 * Desktop App Main React Component
 * Complete desktop application with native OS integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// Import components
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import SettingsModal from './components/SettingsModal';
import UpdaterModal from './components/UpdaterModal';
import NotificationToast from './components/NotificationToast';
import StatusBar from './components/StatusBar';

// Custom hooks
import { useElectronAPI } from './hooks/useElectronAPI';
import { useAppSettings } from './hooks/useAppSettings';
import { useTheme } from './hooks/useTheme';

function App() {
    // State management
    const [currentView, setCurrentView] = useState('dashboard');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showUpdater, setShowUpdater] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [appStatus, setAppStatus] = useState('ready');
    
    // Custom hooks
    const { electronAPI, isElectron } = useElectronAPI();
    const { settings, updateSetting, loadSettings } = useAppSettings();
    const { theme, toggleTheme, isDarkMode } = useTheme();

    // App initialization
    useEffect(() => {
        initializeApp();
        setupEventListeners();
        
        return () => {
            cleanupEventListeners();
        };
    }, []);

    const initializeApp = async () => {
        try {
            setAppStatus('initializing');
            
            // Load settings
            await loadSettings();
            
            // Get app info
            if (electronAPI) {
                const version = await electronAPI.getAppVersion();
                const name = await electronAPI.getAppName();
                console.log(`${name} v${version} started`);
            }
            
            setAppStatus('ready');
            
            // Show welcome notification
            addNotification('Welcome to Desktop App!', 'success');
            
        } catch (error) {
            console.error('App initialization error:', error);
            setAppStatus('error');
            addNotification('Failed to initialize app', 'error');
        }
    };

    const setupEventListeners = () => {
        if (!electronAPI) return;

        // Menu actions
        const cleanupMenu = electronAPI.onMenuAction((action, data) => {
            handleMenuAction(action, data);
        });

        // App events
        const cleanupApp = electronAPI.onAppEvent((event, data) => {
            handleAppEvent(event, data);
        });

        // Updater events
        const cleanupUpdater = electronAPI.onUpdaterEvent((event, data) => {
            handleUpdaterEvent(event, data);
        });

        // Store cleanup functions
        window.cleanupEventListeners = () => {
            cleanupMenu();
            cleanupApp();
            cleanupUpdater();
        };
    };

    const cleanupEventListeners = () => {
        if (window.cleanupEventListeners) {
            window.cleanupEventListeners();
        }
    };

    const handleMenuAction = (action, data) => {
        switch (action) {
            case 'new':
                handleNewDocument();
                break;
            case 'open':
                handleOpenFile(data);
                break;
            case 'save':
                handleSaveDocument();
                break;
            case 'preferences':
                setShowSettings(true);
                break;
            default:
                console.log('Unhandled menu action:', action);
        }
    };

    const handleAppEvent = (event, data) => {
        switch (event) {
            case 'suspend':
                setAppStatus('suspended');
                addNotification('App suspended', 'info');
                break;
            case 'resume':
                setAppStatus('ready');
                addNotification('App resumed', 'info');
                break;
            case 'power-ac':
                addNotification('Power connected', 'info');
                break;
            case 'power-battery':
                addNotification('Running on battery', 'warning');
                break;
            case 'theme-changed':
                addNotification(`System theme changed to ${data}`, 'info');
                break;
            default:
                console.log('Unhandled app event:', event);
        }
    };

    const handleUpdaterEvent = (event, data) => {
        switch (event) {
            case 'checking':
                setAppStatus('checking-updates');
                break;
            case 'update-available':
                setShowUpdater(true);
                addNotification('Update available!', 'info');
                break;
            case 'update-not-available':
                setAppStatus('ready');
                addNotification('App is up to date', 'success');
                break;
            case 'error':
                setAppStatus('ready');
                addNotification('Update check failed', 'error');
                break;
            case 'download-progress':
                setAppStatus('downloading-update');
                break;
            case 'update-downloaded':
                setAppStatus('ready');
                addNotification('Update ready to install', 'success');
                break;
            default:
                console.log('Unhandled updater event:', event);
        }
    };

    const handleNewDocument = () => {
        addNotification('New document created', 'success');
        setCurrentView('editor');
    };

    const handleOpenFile = async (filePath) => {
        if (filePath) {
            addNotification(`Opening file: ${filePath}`, 'info');
            setCurrentView('editor');
        } else {
            // Show open dialog
            if (electronAPI) {
                const result = await electronAPI.showOpenDialog({
                    properties: ['openFile'],
                    filters: [
                        { name: 'Text Files', extensions: ['txt', 'md'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                });
                
                if (!result.canceled && result.filePaths.length > 0) {
                    handleOpenFile(result.filePaths[0]);
                }
            }
        }
    };

    const handleSaveDocument = async () => {
        if (electronAPI) {
            const result = await electronAPI.showSaveDialog({
                filters: [
                    { name: 'Text Files', extensions: ['txt'] },
                    { name: 'Markdown Files', extensions: ['md'] }
                ]
            });
            
            if (!result.canceled) {
                addNotification(`Saved to: ${result.filePath}`, 'success');
            }
        }
    };

    const addNotification = useCallback((message, type = 'info') => {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date()
        };
        
        setNotifications(prev => [notification, ...prev.slice(0, 4)]);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            removeNotification(notification.id);
        }, 5000);
    }, []);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleSettingsChange = async (key, value) => {
        await updateSetting(key, value);
        
        // Handle specific settings
        switch (key) {
            case 'theme':
                if (value !== 'system') {
                    toggleTheme(value === 'dark');
                }
                break;
            case 'autoLaunch':
                if (electronAPI) {
                    await electronAPI.setAutoLaunch(value);
                }
                break;
            default:
                break;
        }
        
        addNotification('Settings updated', 'success');
    };

    const checkForUpdates = () => {
        if (electronAPI) {
            electronAPI.checkForUpdates();
            addNotification('Checking for updates...', 'info');
        }
    };

    // Window controls
    const minimizeWindow = () => {
        if (electronAPI) {
            electronAPI.minimizeWindow();
        }
    };

    const maximizeWindow = () => {
        if (electronAPI) {
            electronAPI.maximizeWindow();
        }
    };

    const closeWindow = () => {
        if (electronAPI) {
            electronAPI.closeWindow();
        }
    };

    return (
        <div className={`app ${isDarkMode ? 'dark' : 'light'}`} data-status={appStatus}>
            {/* Custom title bar for Windows/Linux */}
            {isElectron && !window.platform?.isMac && (
                <TitleBar
                    onMinimize={minimizeWindow}
                    onMaximize={maximizeWindow}
                    onClose={closeWindow}
                />
            )}
            
            <div className="app-content">
                <Sidebar
                    currentView={currentView}
                    onViewChange={setCurrentView}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                />
                
                <div className="main-area">
                    <MainContent
                        currentView={currentView}
                        onNewDocument={handleNewDocument}
                        onOpenFile={() => handleOpenFile()}
                        onSaveDocument={handleSaveDocument}
                        settings={settings}
                    />
                    
                    <StatusBar
                        status={appStatus}
                        onSettingsClick={() => setShowSettings(true)}
                        onUpdateClick={checkForUpdates}
                    />
                </div>
            </div>
            
            {/* Modals */}
            {showSettings && (
                <SettingsModal
                    settings={settings}
                    onSettingChange={handleSettingsChange}
                    onClose={() => setShowSettings(false)}
                />
            )}
            
            {showUpdater && (
                <UpdaterModal
                    onClose={() => setShowUpdater(false)}
                />
            )}
            
            {/* Notifications */}
            <div className="notifications-container">
                {notifications.map(notification => (
                    <NotificationToast
                        key={notification.id}
                        notification={notification}
                        onRemove={removeNotification}
                    />
                ))}
            </div>
        </div>
    );
}

export default App;