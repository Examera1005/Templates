/**
 * Desktop App React Hooks
 * Custom hooks for Electron integration and app functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Hook for Electron API integration
export const useElectronAPI = () => {
  const [isElectronReady, setIsElectronReady] = useState(false);
  const [electronAPI, setElectronAPI] = useState(null);

  useEffect(() => {
    // Check if running in Electron environment
    if (window.electronAPI) {
      setElectronAPI(window.electronAPI);
      setIsElectronReady(true);
    } else {
      // Fallback for development in browser
      console.warn('Electron API not available - running in browser mode');
      setElectronAPI({
        // Mock API for browser development
        getSystemInfo: () => Promise.resolve({
          platform: 'browser',
          arch: 'unknown',
          version: '0.0.0'
        }),
        showNotification: (options) => {
          if (Notification.permission === 'granted') {
            new Notification(options.title, options);
          }
        },
        openExternal: (url) => window.open(url, '_blank'),
        selectDirectory: () => Promise.resolve(null),
        selectFile: () => Promise.resolve(null),
        writeFile: () => Promise.resolve(),
        readFile: () => Promise.resolve(''),
        showMessageBox: (options) => Promise.resolve({ response: 0 }),
        setTheme: () => {},
        minimizeWindow: () => {},
        maximizeWindow: () => {},
        closeWindow: () => {},
        getAppVersion: () => Promise.resolve('1.0.0'),
        checkForUpdates: () => Promise.resolve(false),
        installUpdate: () => Promise.resolve(),
        onUpdateAvailable: () => {},
        onUpdateDownloaded: () => {},
        removeAllListeners: () => {}
      });
      setIsElectronReady(true);
    }
  }, []);

  // Window controls
  const minimizeWindow = useCallback(() => {
    electronAPI?.minimizeWindow();
  }, [electronAPI]);

  const maximizeWindow = useCallback(() => {
    electronAPI?.maximizeWindow();
  }, [electronAPI]);

  const closeWindow = useCallback(() => {
    electronAPI?.closeWindow();
  }, [electronAPI]);

  // File operations
  const selectFile = useCallback(async (filters = []) => {
    try {
      return await electronAPI?.selectFile(filters);
    } catch (error) {
      console.error('Error selecting file:', error);
      return null;
    }
  }, [electronAPI]);

  const selectDirectory = useCallback(async () => {
    try {
      return await electronAPI?.selectDirectory();
    } catch (error) {
      console.error('Error selecting directory:', error);
      return null;
    }
  }, [electronAPI]);

  const writeFile = useCallback(async (filePath, content) => {
    try {
      return await electronAPI?.writeFile(filePath, content);
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  }, [electronAPI]);

  const readFile = useCallback(async (filePath) => {
    try {
      return await electronAPI?.readFile(filePath);
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }, [electronAPI]);

  // System integration
  const showNotification = useCallback((options) => {
    electronAPI?.showNotification(options);
  }, [electronAPI]);

  const openExternal = useCallback((url) => {
    electronAPI?.openExternal(url);
  }, [electronAPI]);

  const showMessageBox = useCallback(async (options) => {
    try {
      return await electronAPI?.showMessageBox(options);
    } catch (error) {
      console.error('Error showing message box:', error);
      return { response: 0 };
    }
  }, [electronAPI]);

  // App info and updates
  const getAppVersion = useCallback(async () => {
    try {
      return await electronAPI?.getAppVersion();
    } catch (error) {
      console.error('Error getting app version:', error);
      return '1.0.0';
    }
  }, [electronAPI]);

  const checkForUpdates = useCallback(async () => {
    try {
      return await electronAPI?.checkForUpdates();
    } catch (error) {
      console.error('Error checking for updates:', error);
      return false;
    }
  }, [electronAPI]);

  const installUpdate = useCallback(async () => {
    try {
      return await electronAPI?.installUpdate();
    } catch (error) {
      console.error('Error installing update:', error);
      throw error;
    }
  }, [electronAPI]);

  return {
    isElectronReady,
    electronAPI,
    // Window controls
    minimizeWindow,
    maximizeWindow,
    closeWindow,
    // File operations
    selectFile,
    selectDirectory,
    writeFile,
    readFile,
    // System integration
    showNotification,
    openExternal,
    showMessageBox,
    // App info and updates
    getAppVersion,
    checkForUpdates,
    installUpdate
  };
};

// Hook for app settings management
export const useAppSettings = (defaultSettings = {}) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const { electronAPI, isElectronReady } = useElectronAPI();

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!isElectronReady) return;

      try {
        setIsLoading(true);
        const savedSettings = await electronAPI?.getSettings?.();
        if (savedSettings) {
          setSettings({ ...defaultSettings, ...savedSettings });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        // Use localStorage as fallback
        const fallbackSettings = localStorage.getItem('appSettings');
        if (fallbackSettings) {
          setSettings({ ...defaultSettings, ...JSON.parse(fallbackSettings) });
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [isElectronReady, electronAPI, defaultSettings]);

  // Save settings
  const saveSettings = useCallback(async (newSettings) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      // Save to Electron store
      await electronAPI?.setSettings?.(updatedSettings);
      
      // Fallback to localStorage
      localStorage.setItem('appSettings', JSON.stringify(updatedSettings));
      
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }, [settings, electronAPI]);

  // Update single setting
  const updateSetting = useCallback((key, value) => {
    return saveSettings({ [key]: value });
  }, [saveSettings]);

  // Reset settings
  const resetSettings = useCallback(() => {
    return saveSettings(defaultSettings);
  }, [saveSettings, defaultSettings]);

  return {
    settings,
    isLoading,
    saveSettings,
    updateSetting,
    resetSettings
  };
};

// Hook for theme management
export const useTheme = () => {
  const [theme, setTheme] = useState('light');
  const [systemTheme, setSystemTheme] = useState('light');
  const { electronAPI, isElectronReady } = useElectronAPI();

  // Detect system theme
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Load saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('appTheme') || 'auto';
    setTheme(savedTheme);
  }, []);

  // Apply theme to document
  useEffect(() => {
    const effectiveTheme = theme === 'auto' ? systemTheme : theme;
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    
    // Update app class for CSS
    const appElement = document.querySelector('.app');
    if (appElement) {
      appElement.className = `app ${effectiveTheme}`;
    }

    // Notify Electron main process
    electronAPI?.setTheme?.(effectiveTheme);
  }, [theme, systemTheme, electronAPI]);

  const changeTheme = useCallback((newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('appTheme', newTheme);
  }, []);

  const effectiveTheme = theme === 'auto' ? systemTheme : theme;

  return {
    theme,
    effectiveTheme,
    systemTheme,
    changeTheme,
    isDarkMode: effectiveTheme === 'dark'
  };
};

// Hook for notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [permission, setPermission] = useState(Notification.permission);
  const { showNotification } = useElectronAPI();

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    }
    return false;
  }, []);

  // Add notification
  const addNotification = useCallback((notification) => {
    const id = Date.now().toString();
    const newNotification = {
      id,
      timestamp: new Date(),
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep max 10 notifications

    // Show system notification
    if (permission === 'granted') {
      showNotification({
        title: notification.title,
        body: notification.message,
        icon: notification.icon
      });
    }

    // Auto-remove after timeout
    if (notification.timeout !== false) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.timeout || 5000);
    }

    return id;
  }, [permission, showNotification]);

  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Shorthand methods for different types
  const showSuccess = useCallback((message, options = {}) => {
    return addNotification({
      type: 'success',
      title: 'Success',
      message,
      ...options
    });
  }, [addNotification]);

  const showError = useCallback((message, options = {}) => {
    return addNotification({
      type: 'error',
      title: 'Error',
      message,
      timeout: false, // Errors don't auto-dismiss
      ...options
    });
  }, [addNotification]);

  const showWarning = useCallback((message, options = {}) => {
    return addNotification({
      type: 'warning',
      title: 'Warning',
      message,
      ...options
    });
  }, [addNotification]);

  const showInfo = useCallback((message, options = {}) => {
    return addNotification({
      type: 'info',
      title: 'Information',
      message,
      ...options
    });
  }, [addNotification]);

  return {
    notifications,
    permission,
    requestPermission,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

// Hook for auto-updater
export const useAutoUpdater = () => {
  const [updateInfo, setUpdateInfo] = useState({
    available: false,
    downloaded: false,
    downloading: false,
    error: null,
    version: null,
    progress: 0
  });
  
  const { electronAPI, isElectronReady, checkForUpdates, installUpdate } = useElectronAPI();

  // Set up update listeners
  useEffect(() => {
    if (!isElectronReady || !electronAPI) return;

    // Update available
    const handleUpdateAvailable = (info) => {
      setUpdateInfo(prev => ({
        ...prev,
        available: true,
        version: info.version,
        error: null
      }));
    };

    // Update downloaded
    const handleUpdateDownloaded = () => {
      setUpdateInfo(prev => ({
        ...prev,
        downloaded: true,
        downloading: false,
        progress: 100
      }));
    };

    // Download progress
    const handleDownloadProgress = (progress) => {
      setUpdateInfo(prev => ({
        ...prev,
        downloading: true,
        progress: progress.percent
      }));
    };

    // Update error
    const handleUpdateError = (error) => {
      setUpdateInfo(prev => ({
        ...prev,
        error: error.message,
        downloading: false
      }));
    };

    // Register listeners
    electronAPI.onUpdateAvailable?.(handleUpdateAvailable);
    electronAPI.onUpdateDownloaded?.(handleUpdateDownloaded);
    electronAPI.onDownloadProgress?.(handleDownloadProgress);
    electronAPI.onUpdateError?.(handleUpdateError);

    return () => {
      electronAPI.removeAllListeners?.('update-available');
      electronAPI.removeAllListeners?.('update-downloaded');
      electronAPI.removeAllListeners?.('download-progress');
      electronAPI.removeAllListeners?.('update-error');
    };
  }, [isElectronReady, electronAPI]);

  // Check for updates manually
  const checkUpdates = useCallback(async () => {
    try {
      setUpdateInfo(prev => ({ ...prev, error: null }));
      const available = await checkForUpdates();
      if (!available) {
        setUpdateInfo(prev => ({ ...prev, available: false }));
      }
      return available;
    } catch (error) {
      setUpdateInfo(prev => ({ ...prev, error: error.message }));
      return false;
    }
  }, [checkForUpdates]);

  // Download and install update
  const downloadAndInstall = useCallback(async () => {
    try {
      setUpdateInfo(prev => ({ ...prev, error: null, downloading: true }));
      await installUpdate();
    } catch (error) {
      setUpdateInfo(prev => ({ 
        ...prev, 
        error: error.message,
        downloading: false 
      }));
    }
  }, [installUpdate]);

  return {
    updateInfo,
    checkUpdates,
    downloadAndInstall
  };
};

// Hook for keyboard shortcuts
export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const { ctrlKey, metaKey, shiftKey, altKey, key } = event;
      
      // Build shortcut string
      const modifiers = [];
      if (ctrlKey || metaKey) modifiers.push('ctrl');
      if (shiftKey) modifiers.push('shift');
      if (altKey) modifiers.push('alt');
      
      const shortcutString = [...modifiers, key.toLowerCase()].join('+');
      
      // Check if shortcut exists
      const handler = shortcuts[shortcutString];
      if (handler) {
        event.preventDefault();
        handler(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Hook for window state management
export const useWindowState = () => {
  const [windowState, setWindowState] = useState({
    isMaximized: false,
    isMinimized: false,
    isFocused: true,
    bounds: { width: 800, height: 600, x: 0, y: 0 }
  });
  
  const { electronAPI, isElectronReady } = useElectronAPI();

  useEffect(() => {
    if (!isElectronReady || !electronAPI) return;

    // Listen to window state changes
    const handleWindowStateChange = (state) => {
      setWindowState(prev => ({ ...prev, ...state }));
    };

    electronAPI.onWindowStateChange?.(handleWindowStateChange);

    // Get initial state
    electronAPI.getWindowState?.().then(state => {
      if (state) setWindowState(prev => ({ ...prev, ...state }));
    });

    return () => {
      electronAPI.removeAllListeners?.('window-state-change');
    };
  }, [isElectronReady, electronAPI]);

  return windowState;
};

// Hook for drag and drop
export const useDragAndDrop = (onDrop, options = {}) => {
  const dropRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCount, setDragCount] = useState(0);

  useEffect(() => {
    const element = dropRef.current;
    if (!element) return;

    const handleDragEnter = (e) => {
      e.preventDefault();
      setDragCount(prev => prev + 1);
      if (dragCount === 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      setDragCount(prev => {
        const newCount = prev - 1;
        if (newCount === 0) {
          setIsDragging(false);
        }
        return newCount;
      });
    };

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
      setDragCount(0);

      const files = Array.from(e.dataTransfer.files);
      const items = Array.from(e.dataTransfer.items);

      if (files.length > 0 && onDrop) {
        onDrop(files, e);
      }
    };

    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('drop', handleDrop);

    return () => {
      element.removeEventListener('dragenter', handleDragEnter);
      element.removeEventListener('dragleave', handleDragLeave);
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('drop', handleDrop);
    };
  }, [onDrop, dragCount]);

  return { dropRef, isDragging };
};