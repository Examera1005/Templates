/**
 * Electron Preload Script
 * Secure bridge between main and renderer processes
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // App information
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppName: () => ipcRenderer.invoke('get-app-name'),
    
    // Store operations
    store: {
        get: (key) => ipcRenderer.invoke('store-get', key),
        set: (key, value) => ipcRenderer.invoke('store-set', key, value)
    },
    
    // Dialog operations
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
    
    // Window operations
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
    closeWindow: () => ipcRenderer.invoke('close-window'),
    
    // Auto launch
    setAutoLaunch: (enabled) => ipcRenderer.invoke('set-auto-launch', enabled),
    getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
    
    // Theme operations
    getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
    
    // Updater operations
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    installUpdate: () => ipcRenderer.invoke('install-update'),
    
    // Event listeners
    onMenuAction: (callback) => {
        const handlers = {
            'menu-new': () => callback('new'),
            'menu-save': () => callback('save'),
            'file-open': (event, filePath) => callback('open', filePath),
            'show-preferences': () => callback('preferences')
        };
        
        Object.keys(handlers).forEach(event => {
            ipcRenderer.on(event, handlers[event]);
        });
        
        // Return cleanup function
        return () => {
            Object.keys(handlers).forEach(event => {
                ipcRenderer.removeAllListeners(event);
            });
        };
    },
    
    onAppEvent: (callback) => {
        const handlers = {
            'app-suspend': () => callback('suspend'),
            'app-resume': () => callback('resume'),
            'power-ac': () => callback('power-ac'),
            'power-battery': () => callback('power-battery'),
            'theme-changed': (event, theme) => callback('theme-changed', theme)
        };
        
        Object.keys(handlers).forEach(event => {
            ipcRenderer.on(event, handlers[event]);
        });
        
        return () => {
            Object.keys(handlers).forEach(event => {
                ipcRenderer.removeAllListeners(event);
            });
        };
    },
    
    onUpdaterEvent: (callback) => {
        const handlers = {
            'updater-checking': () => callback('checking'),
            'updater-update-available': (event, info) => callback('update-available', info),
            'updater-update-not-available': (event, info) => callback('update-not-available', info),
            'updater-error': (event, error) => callback('error', error),
            'updater-download-progress': (event, progress) => callback('download-progress', progress),
            'updater-update-downloaded': (event, info) => callback('update-downloaded', info)
        };
        
        Object.keys(handlers).forEach(event => {
            ipcRenderer.on(event, handlers[event]);
        });
        
        return () => {
            Object.keys(handlers).forEach(event => {
                ipcRenderer.removeAllListeners(event);
            });
        };
    },
    
    // Utility functions
    openExternal: (url) => {
        // Security: validate URL before opening
        try {
            const validUrl = new URL(url);
            if (validUrl.protocol === 'http:' || validUrl.protocol === 'https:') {
                ipcRenderer.send('open-external', url);
            }
        } catch (error) {
            console.error('Invalid URL:', url);
        }
    },
    
    // File system operations (secure)
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
    
    // System information
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    
    // Notification
    showNotification: (title, body, options = {}) => {
        ipcRenderer.send('show-notification', { title, body, ...options });
    }
});

// Platform information
contextBridge.exposeInMainWorld('platform', {
    isMac: process.platform === 'darwin',
    isWindows: process.platform === 'win32',
    isLinux: process.platform === 'linux',
    platform: process.platform,
    arch: process.arch,
    versions: process.versions
});

// Development helpers
if (process.env.NODE_ENV === 'development') {
    contextBridge.exposeInMainWorld('dev', {
        reload: () => ipcRenderer.send('reload'),
        toggleDevTools: () => ipcRenderer.send('toggle-dev-tools'),
        log: (...args) => console.log('[Renderer]', ...args)
    });
}

// Security: Remove Node.js globals from renderer process
delete global.require;
delete global.exports;
delete global.module;
delete global.__dirname;
delete global.__filename;
delete global.process;
delete global.Buffer;
delete global.setImmediate;
delete global.clearImmediate;