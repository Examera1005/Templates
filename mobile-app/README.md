# React Native Mobile App Template

A comprehensive React Native mobile application template with modern features, authentication, navigation, and production-ready architecture.

## 📱 Features

### 🔐 Authentication System
- **Secure Login/Registration**: JWT-based authentication with proper validation
- **Biometric Authentication**: Fingerprint and Face ID support
- **Password Management**: Secure password reset and change functionality
- **Token Management**: Automatic token refresh and secure storage

### 🧭 Navigation
- **React Navigation v6**: Modern navigation with stack, tab, and drawer navigators
- **Deep Linking**: Support for custom URL schemes
- **Screen Management**: Proper screen lifecycle management

### 💾 Data Management
- **Offline Storage**: AsyncStorage with encrypted secure storage
- **Cache Management**: Intelligent caching with TTL support
- **Offline Queue**: Automatic sync when connection is restored
- **Data Persistence**: User preferences and app state persistence

### 🔔 Push Notifications
- **Firebase Cloud Messaging**: Cross-platform push notifications
- **Local Notifications**: Schedule and manage local notifications
- **Notification History**: Track and display notification history
- **Badge Management**: iOS badge count management

### 🎨 Theming & UI
- **Dark/Light Mode**: System-aware theme switching
- **Custom Themes**: Extensible theming system
- **UI Components**: Comprehensive component library
- **Responsive Design**: Adaptive layouts for different screen sizes

### 🛡️ Security Features
- **Secure Storage**: Encrypted keychain storage for sensitive data
- **Network Security**: Certificate pinning and secure API calls
- **Input Validation**: Comprehensive form validation
- **Error Handling**: Global error boundary and reporting

### 📱 Native Features
- **Camera Integration**: Photo capture and gallery selection
- **Permissions Management**: Runtime permission handling
- **Device Info**: Access to device information and capabilities
- **Network Detection**: Online/offline state management

## 🚀 Quick Start

### Prerequisites
- Node.js (>=16)
- React Native CLI
- Xcode (for iOS development)
- Android Studio (for Android development)

### Installation

1. **Clone the template**
   ```bash
   git clone https://github.com/yourusername/react-native-mobile-app-template.git
   cd react-native-mobile-app-template
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **iOS Setup** (macOS only)
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Run the application**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── UIComponents.js  # Core UI component library
│   ├── ErrorBoundary.js # Error handling component
│   └── NetworkStatus.js # Network connectivity component
├── screens/            # Application screens
│   ├── HomeScreen.js   # Main dashboard screen
│   ├── LoginScreen.js  # Authentication screen
│   ├── ProfileScreen.js # User profile management
│   └── SettingsScreen.js # App settings and preferences
├── contexts/           # React Context providers
│   ├── AuthContext.js  # Authentication state management
│   └── ThemeContext.js # Theme and styling management
├── services/           # Business logic and API services
│   ├── AuthService.js  # Authentication service
│   ├── StorageService.js # Data storage service
│   └── NotificationService.js # Push notifications service
├── themes/             # Theme configuration
│   └── index.js        # Theme definitions and utilities
└── App.js              # Main application component
```

## 🔧 Configuration

### Firebase Setup (for Push Notifications)

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Add iOS and Android apps

2. **Download Configuration Files**
   - iOS: Download `GoogleService-Info.plist` to `ios/` directory
   - Android: Download `google-services.json` to `android/app/` directory

3. **Update Package Names**
   - Update bundle identifier in iOS project
   - Update package name in Android manifest

### Environment Variables

Create a `.env` file in the project root:

```env
API_BASE_URL=https://your-api-server.com
API_TIMEOUT=10000
ENABLE_FLIPPER=true
SENTRY_DSN=your-sentry-dsn
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 📱 Building for Production

### Android

```bash
# Generate APK
npm run build:android

# Generate AAB (recommended for Play Store)
cd android
./gradlew bundleRelease
```

### iOS

```bash
# Archive for App Store
npm run build:ios

# Or use Xcode
# Open ios/YourApp.xcworkspace in Xcode
# Product > Archive
```

## 🔒 Security Considerations

### Data Protection
- All sensitive data is stored in encrypted keychain/keystore
- API tokens are automatically rotated
- Biometric authentication adds extra security layer

### Network Security
- Certificate pinning prevents man-in-the-middle attacks
- API calls use HTTPS with proper timeout handling
- Offline queue prevents data loss during network issues

### Input Validation
- All user inputs are validated on client and server
- SQL injection and XSS protection
- Proper error handling without exposing sensitive information

## 📊 Performance Optimization

### Bundle Size
- Tree shaking removes unused code
- Image optimization reduces app size
- Lazy loading for non-critical components

### Runtime Performance
- Efficient state management with Context API
- Optimized list rendering with FlatList
- Memory leak prevention with proper cleanup

### Network Optimization
- Request caching reduces API calls
- Offline-first approach improves user experience
- Automatic retry logic for failed requests

## 🛠️ Customization

### Adding New Screens

1. Create screen component in `src/screens/`
2. Add to navigation stack in `App.js`
3. Update any necessary context providers

### Custom Themes

```javascript
// src/themes/customTheme.js
import { createTheme, LIGHT_COLORS } from './index';

const customColors = {
  ...LIGHT_COLORS,
  primary: '#your-brand-color',
  secondary: '#your-secondary-color'
};

export const customTheme = createTheme(customColors);
```

### API Integration

```javascript
// src/services/apiService.js
import { AuthService } from './AuthService';

class ApiService {
  async makeRequest(endpoint, options = {}) {
    const token = await AuthService.getToken();
    // Implement your API logic
  }
}
```

## 📚 Dependencies

### Core Dependencies
- **react-native**: Framework for building native apps
- **@react-navigation/native**: Navigation library
- **@react-native-async-storage/async-storage**: Persistent storage
- **react-native-keychain**: Secure storage for iOS/Android

### Optional Dependencies
- **@react-native-firebase/messaging**: Push notifications
- **react-native-biometrics**: Biometric authentication
- **react-native-image-picker**: Camera and photo library access
- **zustand**: Lightweight state management (alternative to Redux)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/yourusername/react-native-mobile-app-template/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/react-native-mobile-app-template/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/react-native-mobile-app-template/discussions)

## 🗺️ Roadmap

- [ ] Add unit and integration tests
- [ ] Implement state management with Zustand
- [ ] Add internationalization (i18n) support
- [ ] Create CI/CD pipeline with GitHub Actions
- [ ] Add performance monitoring with Flipper
- [ ] Implement code push for over-the-air updates

---

**Note**: This template is designed to be a starting point for React Native applications. Customize it according to your specific requirements and remove any features you don't need.