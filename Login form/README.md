# Convex Auth Template

A comprehensive, production-ready authentication template for React applications using Convex Auth. This template provides everything you need to implement secure authentication with multiple providers, form validation, and role-based access control.

## 🚀 Features

- **Multiple Authentication Providers**
  - Email/Password authentication
  - Google OAuth
  - GitHub OAuth
  - Easy to add more providers

- **Comprehensive Form Handling**
  - Real-time validation
  - Error handling
  - Loading states
  - Accessibility support

- **Security & User Experience**
  - TypeScript for type safety
  - Role-based access control
  - Protected routes
  - Remember me functionality
  - Password strength validation

- **Modern UI**
  - Responsive design
  - Dark/light theme support
  - CSS modules for styling
  - Customizable appearance

- **Developer Experience**
  - Well-documented code
  - Reusable components
  - Custom hooks
  - Easy integration

## 📦 Installation

### 1. Install Dependencies

```bash
npm install @convex-dev/auth convex react
# or
yarn add @convex-dev/auth convex react
```

### 2. Copy Template Files

Copy all files from this template to your project:

```
src/
├── components/
│   ├── AuthWrapper.tsx
│   ├── LoginForm.tsx
│   ├── SignUpForm.tsx
│   └── index.ts
├── hooks/
│   ├── useAuth.ts
│   └── useFormValidation.ts
├── types/
│   └── auth.ts
└── styles/
    ├── variables.css
    └── AuthForm.module.css

convex/
└── auth.ts
```

### 3. Environment Setup

Create a `.env.local` file in your project root:

```env
# Convex
CONVEX_DEPLOYMENT=your-deployment-url
NEXT_PUBLIC_CONVEX_URL=your-convex-url

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 4. Update Convex Configuration

In your `convex/_generated/api.ts`, make sure you have the users query:

```typescript
// convex/users.ts
import { query } from "./_generated/server";
import { auth } from "./auth";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});
```

## 🛠 Usage

### Basic Setup

```typescript
// App.tsx
import React from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { LoginForm, AuthWrapper } from './src/components';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function App() {
  return (
    <ConvexProvider client={convex}>
      <ConvexAuthProvider>
        <AuthWrapper requireAuth>
          <Dashboard />
        </AuthWrapper>
      </ConvexAuthProvider>
    </ConvexProvider>
  );
}

export default App;
```

### Login Form

```typescript
import { LoginForm } from './src/components';

function LoginPage() {
  return (
    <LoginForm
      onSuccess={(user) => {
        console.log('Login successful:', user);
        // Redirect to dashboard
      }}
      onError={(error) => {
        console.error('Login failed:', error);
      }}
      redirectTo="/dashboard"
    />
  );
}
```

### Sign Up Form

```typescript
import { SignUpForm } from './src/components';

function SignUpPage() {
  return (
    <SignUpForm
      onSuccess={(user) => {
        console.log('Sign up successful:', user);
        // Redirect to onboarding
      }}
      onError={(error) => {
        console.error('Sign up failed:', error);
      }}
    />
  );
}
```

### Protected Routes

```typescript
import { ProtectedRoute } from './src/components';

function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
```

### Using the Auth Hook

```typescript
import { useAuth } from './src/components';

function UserProfile() {
  const { user, signOut, updateProfile } = useAuth();

  if (!user) return null;

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Email: {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Conditional Rendering

```typescript
import { ConditionalAuthContent } from './src/components';

function HomePage() {
  return (
    <ConditionalAuthContent
      authenticated={<Dashboard />}
      unauthenticated={<LandingPage />}
      loading={<LoadingSpinner />}
    />
  );
}
```

## 🎨 Customization

### Styling

The template uses CSS modules and CSS custom properties for easy customization:

```css
/* Override default colors */
:root {
  --auth-primary: #your-brand-color;
  --auth-primary-hover: #your-brand-color-hover;
  --auth-bg-primary: #your-background-color;
}

/* Dark theme customization */
[data-theme="dark"] {
  --auth-primary: #your-dark-theme-primary;
}
```

### Adding New Providers

```typescript
// convex/auth.ts
import { MicrosoftOAuth } from "@convex-dev/auth/providers/MicrosoftOAuth";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password(),
    GoogleOAuth(),
    GitHubOAuth(),
    MicrosoftOAuth(), // Add new provider
  ],
});
```

### Custom Validation Rules

```typescript
// Custom validation for your form fields
const customValidationRules = {
  username: (value: string) => {
    if (!value) return 'Username is required';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
    return null;
  },
};
```

## 🔧 Configuration Options

### Auth Configuration

```typescript
const authConfig: AuthConfig = {
  providers: {
    password: true,
    google: true,
    github: true,
  },
  features: {
    rememberMe: true,
    emailVerification: false,
    passwordReset: true,
    profileUpdate: true,
  },
  ui: {
    showProviderIcons: true,
    allowProviderSwitching: true,
    theme: 'auto',
  },
  security: {
    minPasswordLength: 8,
    requireStrongPassword: true,
    sessionTimeout: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
};
```

## 📱 Responsive Design

The template is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)  
- Mobile (320px - 767px)

## ♿ Accessibility

- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

## 🧪 Testing

```typescript
// Example test for LoginForm
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from './LoginForm';

test('validates email format', async () => {
  render(<LoginForm />);
  
  const emailInput = screen.getByLabelText(/email/i);
  fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
  fireEvent.blur(emailInput);
  
  await waitFor(() => {
    expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
  });
});
```

## 🚨 Security Considerations

1. **Environment Variables**: Never expose sensitive keys in client-side code
2. **HTTPS**: Always use HTTPS in production
3. **Password Strength**: Enforce strong password requirements
4. **Rate Limiting**: Implement rate limiting for auth endpoints
5. **Session Management**: Use secure session handling
6. **Input Validation**: Validate all inputs on both client and server

## 🔄 Migration Guide

### From Other Auth Solutions

1. **From Firebase Auth**:
   - Replace Firebase hooks with `useAuth`
   - Update provider configurations
   - Migrate user data structure

2. **From Auth0**:
   - Replace Auth0Provider with ConvexAuthProvider
   - Update authentication flows
   - Migrate user metadata

3. **From NextAuth**:
   - Replace NextAuth providers with Convex Auth providers
   - Update session handling
   - Migrate database schema

## 📚 API Reference

### Components

#### `LoginForm`
```typescript
interface AuthFormProps {
  onSuccess?: (user: User) => void;
  onError?: (error: string) => void;
  redirectTo?: string;
  className?: string;
}
```

#### `SignUpForm`
```typescript
// Same props as LoginForm
```

#### `AuthWrapper`
```typescript
interface AuthWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
  requiredRole?: User['role'];
}
```

### Hooks

#### `useAuth`
```typescript
interface UseAuthReturn extends AuthState, AuthActions {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  error: string | null;
  signIn: (provider: AuthProvider, data?: LoginFormData) => Promise<void>;
  signUp: (data: SignUpFormData) => Promise<void>;
  signOut: () => Promise<void>;
  // ... more methods
}
```

## 🛟 Troubleshooting

### Common Issues

1. **"Cannot find module 'convex/react'"**
   - Ensure Convex is properly installed and configured

2. **OAuth providers not working**
   - Check environment variables
   - Verify OAuth app configuration
   - Ensure redirect URLs are correct

3. **Styling not applied**
   - Verify CSS modules are supported in your build setup
   - Check CSS import paths

4. **TypeScript errors**
   - Ensure all dependencies have proper type definitions
   - Update TypeScript configuration if needed

### Debug Mode

Enable debug logging:

```typescript
// Add to your app initialization
if (process.env.NODE_ENV === 'development') {
  localStorage.setItem('convex-auth-debug', 'true');
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- [Convex Auth Documentation](https://docs.convex.dev/auth)
- [Convex Documentation](https://docs.convex.dev)
- [React Documentation](https://react.dev)

## 📞 Support

- Open an issue on GitHub
- Check the documentation
- Join the Convex Discord community

---

Made with ❤️ for the developer community