# Desktop App Template

A comprehensive Electron desktop application template with modern features and cross-platform support.

## Features

✨ **Modern Architecture**
- Electron with React renderer
- Secure preload scripts with context isolation
- TypeScript support ready
- Modular component architecture

🔒 **Security First**
- Context isolation enabled
- Secure IPC communication
- CSP headers configured
- Sandboxed renderer processes

🎨 **User Interface**
- Modern, responsive design
- Dark/Light theme support
- Native OS integration
- Customizable settings

🔄 **Auto-Updater**
- Automatic update checking
- Background downloads
- User-controlled installation
- Progress tracking

🛠️ **Developer Experience**
- Hot reload in development
- Comprehensive build system
- Cross-platform packaging
- Code signing support

📦 **Cross-Platform**
- Windows (NSIS, Portable, ZIP)
- macOS (DMG, ZIP)
- Linux (AppImage, DEB, RPM)

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

```bash
# Clone the template
git clone <repository-url> my-desktop-app
cd my-desktop-app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development

```bash
# Start development with hot reload
npm run dev

# Build for production
npm run build

# Package for current platform
npm run dist

# Package for all platforms
npm run dist:all

# Run tests
npm test

# Lint code
npm run lint
```

## Project Structure

```
desktop-app/
├── src/
│   ├── main/               # Main process
│   │   ├── main.js         # Application entry point
│   │   └── AppManager.js   # Main process manager
│   ├── preload/            # Preload scripts
│   │   └── preload.js      # Secure IPC bridge
│   └── renderer/           # Renderer process
│       ├── App.js          # React application
│       ├── App.css         # Application styles
│       ├── components/     # React components
│       └── hooks/          # Custom React hooks
├── build/                  # Build configuration
│   ├── icons/              # Application icons
│   ├── electron-builder.json # Build settings
│   └── entitlements.mac.plist # macOS permissions
├── package.json
└── README.md
```

## Configuration

### App Settings

Customize your application in `package.json`:

```json
{
  "name": "your-app-name",
  "productName": "Your App Name",
  "description": "Your app description",
  "version": "1.0.0",
  "main": "src/main/main.js"
}
```

### Build Configuration

Edit `build/electron-builder.json` for packaging options:

```json
{
  "appId": "com.yourcompany.yourapp",
  "productName": "Your App Name",
  "directories": {
    "output": "dist"
  }
}
```

### Security Configuration

The app includes security best practices:

- **Context Isolation**: Enabled by default
- **Node Integration**: Disabled in renderer
- **Sandbox**: Enabled for renderer processes
- **CSP**: Content Security Policy headers

## Available Components

### Core Components
- `TitleBar` - Custom window controls
- `Sidebar` - Navigation sidebar
- `MainContent` - Main application area
- `StatusBar` - Status information

### Modals
- `SettingsModal` - Application preferences
- `UpdaterModal` - Update management
- `NotificationToast` - User notifications

### Custom Hooks
- `useElectronAPI` - Electron integration
- `useAppSettings` - Settings management
- `useTheme` - Theme switching
- `useNotifications` - Notification system
- `useAutoUpdater` - Update handling

## Building for Distribution

### Windows

```bash
# NSIS installer
npm run dist:win

# Portable executable
npm run build -- --win portable

# ZIP archive
npm run build -- --win zip
```

### macOS

```bash
# DMG installer
npm run dist:mac

# ZIP archive  
npm run build -- --mac zip

# Mac App Store
npm run build -- --mac mas
```

### Linux

```bash
# AppImage
npm run dist:linux

# DEB package
npm run build -- --linux deb

# RPM package
npm run build -- --linux rpm
```

## Auto-Updater Setup

1. **Configure Update Server**
   ```json
   "publish": [
     {
       "provider": "github",
       "owner": "your-username", 
       "repo": "your-repo"
     }
   ]
   ```

2. **Enable Auto-Updates**
   ```javascript
   // In main process
   autoUpdater.checkForUpdatesAndNotify();
   ```

3. **Handle Update Events**
   ```javascript
   // Update available
   autoUpdater.on('update-available', (info) => {
     // Notify user
   });
   
   // Update downloaded
   autoUpdater.on('update-downloaded', () => {
     // Prompt for restart
   });
   ```

## Code Signing

### Windows
```bash
# Set environment variables
set CSC_LINK=path/to/certificate.p12
set CSC_KEY_PASSWORD=certificate_password
npm run dist:win
```

### macOS
```bash
# Set environment variables
export CSC_LINK=path/to/certificate.p12
export CSC_KEY_PASSWORD=certificate_password
export APPLE_ID=your@apple.id
export APPLE_ID_PASSWORD=app_specific_password
npm run dist:mac
```

## Customization

### Themes

Add custom themes in `App.css`:

```css
.app.custom-theme {
  --bg-primary: #your-color;
  --text-primary: #your-color;
  --accent-color: #your-color;
}
```

### Menu Bar

Customize the application menu in `main.js`:

```javascript
const menuTemplate = [
  {
    label: 'File',
    submenu: [
      { label: 'New', accelerator: 'CmdOrCtrl+N' },
      { label: 'Open', accelerator: 'CmdOrCtrl+O' }
    ]
  }
];
```

### Window Options

Configure window behavior:

```javascript
new BrowserWindow({
  width: 1200,
  height: 800,
  minWidth: 800,
  minHeight: 600,
  titleBarStyle: 'hidden', // macOS
  frame: false, // Custom title bar
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, 'preload.js')
  }
});
```

## API Reference

### Electron API Bridge

The preload script exposes a secure API:

```javascript
// File operations
window.electronAPI.selectFile();
window.electronAPI.selectDirectory();
window.electronAPI.readFile(path);
window.electronAPI.writeFile(path, content);

// System integration
window.electronAPI.showNotification(options);
window.electronAPI.openExternal(url);
window.electronAPI.showMessageBox(options);

// Window controls
window.electronAPI.minimizeWindow();
window.electronAPI.maximizeWindow();
window.electronAPI.closeWindow();

// App information
window.electronAPI.getAppVersion();
window.electronAPI.checkForUpdates();
```

### Settings API

```javascript
// Get all settings
const settings = await electronAPI.getSettings();

// Update setting
await electronAPI.setSetting('theme', 'dark');

// Reset to defaults
await electronAPI.resetSettings();
```

## Troubleshooting

### Common Issues

**Build fails on macOS**
- Ensure Xcode Command Line Tools are installed
- Check code signing certificates

**Auto-updater not working**
- Verify update server configuration
- Check network connectivity
- Ensure proper code signing

**High memory usage**
- Check for memory leaks in renderer
- Optimize image and asset sizes
- Use lazy loading for large components

### Debug Mode

Enable debug logging:

```bash
# Development
DEBUG=* npm run dev

# Production build
npm run build -- --debug
```

## Performance Optimization

### Bundle Size
- Use dynamic imports for large components
- Optimize images and assets
- Remove unused dependencies

### Memory Usage
- Implement proper cleanup in components
- Use React.memo for expensive components
- Avoid memory leaks in event listeners

### Startup Time
- Lazy load non-critical components
- Optimize main process initialization
- Use splash screen for perceived performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](issues/)
- 💬 [Discussions](discussions/)
- 📧 [Support Email](mailto:support@yourapp.com)

## Acknowledgments

- [Electron](https://electronjs.org/) - Desktop app framework
- [React](https://reactjs.org/) - UI library
- [electron-builder](https://electron.build/) - Packaging solution
- [electron-updater](https://github.com/electron-userland/electron-updater) - Auto-updater

---

Built with ❤️ using Electron and React