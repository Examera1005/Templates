/**
 * Electron Main Process
 * Core application logic, window management, and system integration
 */

const { app, BrowserWindow, Menu, shell, ipcMain, dialog, powerMonitor, systemPreferences } = require('electron');
const { autoUpdater } = require('electron-updater');
const windowStateKeeper = require('electron-window-state');
const contextMenu = require('electron-context-menu');
const Store = require('electron-store');
const log = require('electron-log');
const { is } = require('electron-util');
const path = require('path');
const AutoLaunch = require('auto-launch');

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// Initialize electron store for settings
const store = new Store({
    defaults: {
        windowBounds: { width: 1200, height: 800 },
        theme: 'system',
        autoLaunch: false,
        notifications: true,
        minimizeToTray: true,
        checkForUpdates: true
    }
});

// Auto launcher configuration
const autoLauncher = new AutoLaunch({
    name: 'Your Desktop App',
    path: app.getPath('exe')
});

class AppManager {
    constructor() {
        this.mainWindow = null;
        this.splashWindow = null;
        this.isQuitting = false;
        this.updateDownloaded = false;
        
        this.initializeApp();
    }

    initializeApp() {
        // Configure auto updater
        this.configureAutoUpdater();
        
        // Set up context menu
        contextMenu({
            showLookUpSelection: false,
            showSearchWithGoogle: true,
            showCopyImage: true,
            showSaveImage: true,
            showInspectElement: is.development
        });

        // App event listeners
        this.setupAppEvents();
        
        // Power monitor events
        this.setupPowerEvents();
        
        // System preferences (macOS)
        this.setupSystemPreferences();
    }

    setupAppEvents() {
        app.whenReady().then(() => {
            this.createSplashWindow();
            this.createMainWindow();
            this.createMenu();
            this.setupIpcHandlers();
            
            // Check for updates on startup
            if (store.get('checkForUpdates')) {
                setTimeout(() => {
                    autoUpdater.checkForUpdatesAndNotify();
                }, 3000);
            }
        });

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createMainWindow();
            }
        });

        app.on('before-quit', () => {
            this.isQuitting = true;
        });

        app.on('web-contents-created', (event, contents) => {
            // Security: prevent new window creation
            contents.on('new-window', (event, navigationUrl) => {
                event.preventDefault();
                shell.openExternal(navigationUrl);
            });

            // Security: prevent navigation to external URLs
            contents.on('will-navigate', (event, navigationUrl) => {
                const parsedUrl = new URL(navigationUrl);
                
                if (parsedUrl.origin !== 'http://localhost:3000' && !navigationUrl.startsWith('file://')) {
                    event.preventDefault();
                    shell.openExternal(navigationUrl);
                }
            });
        });
    }

    setupPowerEvents() {
        powerMonitor.on('suspend', () => {
            log.info('System is going to sleep');
            this.mainWindow?.webContents.send('app-suspend');
        });

        powerMonitor.on('resume', () => {
            log.info('System resumed from sleep');
            this.mainWindow?.webContents.send('app-resume');
        });

        powerMonitor.on('on-ac', () => {
            this.mainWindow?.webContents.send('power-ac');
        });

        powerMonitor.on('on-battery', () => {
            this.mainWindow?.webContents.send('power-battery');
        });
    }

    setupSystemPreferences() {
        if (process.platform === 'darwin') {
            // Request media access permissions on macOS
            systemPreferences.askForMediaAccess('camera').then((granted) => {
                log.info('Camera access granted:', granted);
            });

            systemPreferences.askForMediaAccess('microphone').then((granted) => {
                log.info('Microphone access granted:', granted);
            });

            // Monitor theme changes
            systemPreferences.subscribeNotification('AppleInterfaceThemeChangedNotification', () => {
                const isDarkMode = systemPreferences.isDarkMode();
                this.mainWindow?.webContents.send('theme-changed', isDarkMode ? 'dark' : 'light');
            });
        }
    }

    createSplashWindow() {
        this.splashWindow = new BrowserWindow({
            width: 400,
            height: 300,
            frame: false,
            alwaysOnTop: true,
            transparent: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        // Load splash screen
        if (is.development) {
            this.splashWindow.loadFile(path.join(__dirname, '../renderer/splash.html'));
        } else {
            this.splashWindow.loadFile(path.join(__dirname, '../../build/splash.html'));
        }

        // Close splash after main window loads
        setTimeout(() => {
            if (this.splashWindow) {
                this.splashWindow.close();
                this.splashWindow = null;
            }
        }, 2000);
    }

    createMainWindow() {
        // Restore window state
        const mainWindowState = windowStateKeeper({
            defaultWidth: store.get('windowBounds.width'),
            defaultHeight: store.get('windowBounds.height')
        });

        this.mainWindow = new BrowserWindow({
            x: mainWindowState.x,
            y: mainWindowState.y,
            width: mainWindowState.width,
            height: mainWindowState.height,
            minWidth: 800,
            minHeight: 600,
            show: false,
            icon: path.join(__dirname, '../../assets/icon.png'),
            titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, 'preload.js'),
                webSecurity: true,
                allowRunningInsecureContent: false,
                experimentalFeatures: false
            }
        });

        // Let windowStateKeeper manage the window
        mainWindowState.manage(this.mainWindow);

        // Load the app
        if (is.development) {
            this.mainWindow.loadURL('http://localhost:3000');
            this.mainWindow.webContents.openDevTools();
        } else {
            this.mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));
        }

        // Show window when ready
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            
            if (is.development) {
                this.mainWindow.webContents.openDevTools();
            }
        });

        // Handle window close
        this.mainWindow.on('close', (event) => {
            if (!this.isQuitting && store.get('minimizeToTray')) {
                event.preventDefault();
                this.mainWindow.hide();
            } else {
                // Save window state
                const bounds = this.mainWindow.getBounds();
                store.set('windowBounds', bounds);
            }
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        // Handle external links
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: 'deny' };
        });
    }

    createMenu() {
        const template = [
            {
                label: 'File',
                submenu: [
                    {
                        label: 'New',
                        accelerator: 'CmdOrCtrl+N',
                        click: () => {
                            this.mainWindow?.webContents.send('menu-new');
                        }
                    },
                    {
                        label: 'Open',
                        accelerator: 'CmdOrCtrl+O',
                        click: async () => {
                            const result = await dialog.showOpenDialog(this.mainWindow, {
                                properties: ['openFile'],
                                filters: [
                                    { name: 'All Files', extensions: ['*'] }
                                ]
                            });
                            
                            if (!result.canceled) {
                                this.mainWindow?.webContents.send('file-open', result.filePaths[0]);
                            }
                        }
                    },
                    {
                        label: 'Save',
                        accelerator: 'CmdOrCtrl+S',
                        click: () => {
                            this.mainWindow?.webContents.send('menu-save');
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Preferences',
                        accelerator: 'CmdOrCtrl+,',
                        click: () => {
                            this.mainWindow?.webContents.send('show-preferences');
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Quit',
                        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                        click: () => {
                            this.isQuitting = true;
                            app.quit();
                        }
                    }
                ]
            },
            {
                label: 'Edit',
                submenu: [
                    { role: 'undo' },
                    { role: 'redo' },
                    { type: 'separator' },
                    { role: 'cut' },
                    { role: 'copy' },
                    { role: 'paste' },
                    { role: 'selectall' }
                ]
            },
            {
                label: 'View',
                submenu: [
                    { role: 'reload' },
                    { role: 'forceReload' },
                    { role: 'toggleDevTools' },
                    { type: 'separator' },
                    { role: 'resetZoom' },
                    { role: 'zoomIn' },
                    { role: 'zoomOut' },
                    { type: 'separator' },
                    { role: 'togglefullscreen' }
                ]
            },
            {
                label: 'Window',
                submenu: [
                    { role: 'minimize' },
                    { role: 'close' },
                    {
                        label: 'Always on Top',
                        type: 'checkbox',
                        checked: false,
                        click: (menuItem) => {
                            this.mainWindow?.setAlwaysOnTop(menuItem.checked);
                        }
                    }
                ]
            },
            {
                label: 'Help',
                submenu: [
                    {
                        label: 'About',
                        click: () => {
                            this.showAboutDialog();
                        }
                    },
                    {
                        label: 'Check for Updates',
                        click: () => {
                            autoUpdater.checkForUpdatesAndNotify();
                        }
                    },
                    {
                        label: 'Report Issue',
                        click: () => {
                            shell.openExternal('https://github.com/yourusername/your-app/issues');
                        }
                    }
                ]
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    setupIpcHandlers() {
        // App info
        ipcMain.handle('get-app-version', () => {
            return app.getVersion();
        });

        ipcMain.handle('get-app-name', () => {
            return app.getName();
        });

        // Store operations
        ipcMain.handle('store-get', (event, key) => {
            return store.get(key);
        });

        ipcMain.handle('store-set', (event, key, value) => {
            store.set(key, value);
        });

        // System operations
        ipcMain.handle('show-save-dialog', async (event, options) => {
            const result = await dialog.showSaveDialog(this.mainWindow, options);
            return result;
        });

        ipcMain.handle('show-open-dialog', async (event, options) => {
            const result = await dialog.showOpenDialog(this.mainWindow, options);
            return result;
        });

        ipcMain.handle('show-message-box', async (event, options) => {
            const result = await dialog.showMessageBox(this.mainWindow, options);
            return result;
        });

        // Auto launch
        ipcMain.handle('set-auto-launch', async (event, enabled) => {
            try {
                if (enabled) {
                    await autoLauncher.enable();
                } else {
                    await autoLauncher.disable();
                }
                store.set('autoLaunch', enabled);
                return true;
            } catch (error) {
                log.error('Auto launch error:', error);
                return false;
            }
        });

        ipcMain.handle('get-auto-launch', async () => {
            try {
                return await autoLauncher.isEnabled();
            } catch (error) {
                return false;
            }
        });

        // Window operations
        ipcMain.handle('minimize-window', () => {
            this.mainWindow?.minimize();
        });

        ipcMain.handle('maximize-window', () => {
            if (this.mainWindow?.isMaximized()) {
                this.mainWindow.unmaximize();
            } else {
                this.mainWindow?.maximize();
            }
        });

        ipcMain.handle('close-window', () => {
            this.mainWindow?.close();
        });

        // Theme operations
        ipcMain.handle('get-system-theme', () => {
            if (process.platform === 'darwin') {
                return systemPreferences.isDarkMode() ? 'dark' : 'light';
            }
            return 'light';
        });

        // Updater operations
        ipcMain.handle('check-for-updates', () => {
            autoUpdater.checkForUpdatesAndNotify();
        });

        ipcMain.handle('install-update', () => {
            if (this.updateDownloaded) {
                autoUpdater.quitAndInstall();
            }
        });
    }

    configureAutoUpdater() {
        autoUpdater.logger = log;
        autoUpdater.autoDownload = false;
        autoUpdater.autoInstallOnAppQuit = true;

        autoUpdater.on('checking-for-update', () => {
            log.info('Checking for update...');
            this.mainWindow?.webContents.send('updater-checking');
        });

        autoUpdater.on('update-available', (info) => {
            log.info('Update available:', info);
            this.mainWindow?.webContents.send('updater-update-available', info);
            
            dialog.showMessageBox(this.mainWindow, {
                type: 'info',
                title: 'Update Available',
                message: `A new version (${info.version}) is available. Would you like to download it?`,
                buttons: ['Download', 'Later'],
                defaultId: 0
            }).then((result) => {
                if (result.response === 0) {
                    autoUpdater.downloadUpdate();
                }
            });
        });

        autoUpdater.on('update-not-available', (info) => {
            log.info('Update not available:', info);
            this.mainWindow?.webContents.send('updater-update-not-available', info);
        });

        autoUpdater.on('error', (err) => {
            log.error('Updater error:', err);
            this.mainWindow?.webContents.send('updater-error', err.message);
        });

        autoUpdater.on('download-progress', (progressObj) => {
            let log_message = `Download speed: ${progressObj.bytesPerSecond}`;
            log_message += ` - Downloaded ${progressObj.percent}%`;
            log_message += ` (${progressObj.transferred}/${progressObj.total})`;
            log.info(log_message);
            
            this.mainWindow?.webContents.send('updater-download-progress', progressObj);
        });

        autoUpdater.on('update-downloaded', (info) => {
            log.info('Update downloaded:', info);
            this.updateDownloaded = true;
            this.mainWindow?.webContents.send('updater-update-downloaded', info);
            
            dialog.showMessageBox(this.mainWindow, {
                type: 'info',
                title: 'Update Ready',
                message: 'Update downloaded. The application will restart to apply the update.',
                buttons: ['Restart Now', 'Later'],
                defaultId: 0
            }).then((result) => {
                if (result.response === 0) {
                    autoUpdater.quitAndInstall();
                }
            });
        });
    }

    showAboutDialog() {
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'About',
            message: app.getName(),
            detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nNode: ${process.versions.node}\nChrome: ${process.versions.chrome}`
        });
    }
}

// Initialize the app
new AppManager();