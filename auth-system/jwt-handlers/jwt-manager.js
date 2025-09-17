// JWT Token Manager - Client Side
// Handles JWT token storage, validation, and automatic refresh

class JWTManager {
    constructor(options = {}) {
        this.options = {
            tokenKey: 'auth_token',
            refreshKey: 'refresh_token',
            apiBaseUrl: '/api',
            refreshEndpoint: '/auth/refresh',
            loginUrl: '/login',
            autoRefresh: true,
            refreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
            ...options
        };

        this.token = null;
        this.refreshToken = null;
        this.refreshTimeout = null;
        this.isRefreshing = false;
        this.subscribers = [];

        this.loadTokens();
        this.setupInterceptors();
        
        if (this.options.autoRefresh && this.token) {
            this.scheduleRefresh();
        }
    }

    // Load tokens from storage
    loadTokens() {
        this.token = localStorage.getItem(this.options.tokenKey);
        this.refreshToken = localStorage.getItem(this.options.refreshKey);
    }

    // Save tokens to storage
    saveTokens(token, refreshToken = null) {
        this.token = token;
        
        if (token) {
            localStorage.setItem(this.options.tokenKey, token);
        } else {
            localStorage.removeItem(this.options.tokenKey);
        }

        if (refreshToken !== null) {
            this.refreshToken = refreshToken;
            if (refreshToken) {
                localStorage.setItem(this.options.refreshKey, refreshToken);
            } else {
                localStorage.removeItem(this.options.refreshKey);
            }
        }

        if (this.options.autoRefresh && token) {
            this.scheduleRefresh();
        }
    }

    // Get current token
    getToken() {
        return this.token;
    }

    // Get refresh token
    getRefreshToken() {
        return this.refreshToken;
    }

    // Check if token exists
    hasToken() {
        return !!this.token;
    }

    // Decode JWT payload (without verification)
    decodeToken(token = null) {
        const tokenToUse = token || this.token;
        if (!tokenToUse) return null;

        try {
            const payload = tokenToUse.split('.')[1];
            const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
            return JSON.parse(decoded);
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    // Check if token is expired
    isTokenExpired(token = null) {
        const decoded = this.decodeToken(token);
        if (!decoded || !decoded.exp) return true;

        const currentTime = Math.floor(Date.now() / 1000);
        return decoded.exp < currentTime;
    }

    // Check if token expires soon
    isTokenExpiringSoon(token = null, threshold = null) {
        const decoded = this.decodeToken(token);
        if (!decoded || !decoded.exp) return true;

        const thresholdMs = threshold || this.options.refreshThreshold;
        const currentTime = Date.now();
        const expiryTime = decoded.exp * 1000;
        
        return (expiryTime - currentTime) <= thresholdMs;
    }

    // Get user info from token
    getUserInfo() {
        const decoded = this.decodeToken();
        if (!decoded) return null;

        return {
            id: decoded.sub || decoded.userId || decoded.id,
            email: decoded.email,
            name: decoded.name,
            roles: decoded.roles || [],
            permissions: decoded.permissions || [],
            ...decoded
        };
    }

    // Refresh token
    async refreshTokens() {
        if (this.isRefreshing) {
            // If already refreshing, wait for it to complete
            return new Promise((resolve, reject) => {
                this.subscribers.push({ resolve, reject });
            });
        }

        if (!this.refreshToken) {
            this.logout();
            throw new Error('No refresh token available');
        }

        this.isRefreshing = true;

        try {
            const response = await fetch(`${this.options.apiBaseUrl}${this.options.refreshEndpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refreshToken: this.refreshToken
                })
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            
            if (data.accessToken) {
                this.saveTokens(data.accessToken, data.refreshToken);
                
                // Notify subscribers
                this.subscribers.forEach(({ resolve }) => resolve(data.accessToken));
                this.subscribers = [];
                
                return data.accessToken;
            } else {
                throw new Error('Invalid refresh response');
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            
            // Notify subscribers of error
            this.subscribers.forEach(({ reject }) => reject(error));
            this.subscribers = [];
            
            // If refresh fails, logout user
            this.logout();
            throw error;
        } finally {
            this.isRefreshing = false;
        }
    }

    // Schedule automatic token refresh
    scheduleRefresh() {
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
        }

        if (!this.token || !this.options.autoRefresh) return;

        const decoded = this.decodeToken();
        if (!decoded || !decoded.exp) return;

        const currentTime = Date.now();
        const expiryTime = decoded.exp * 1000;
        const refreshTime = expiryTime - this.options.refreshThreshold;
        const timeUntilRefresh = refreshTime - currentTime;

        if (timeUntilRefresh > 0) {
            this.refreshTimeout = setTimeout(() => {
                this.refreshTokens().catch(error => {
                    console.error('Scheduled token refresh failed:', error);
                });
            }, timeUntilRefresh);
        } else {
            // Token is already expired or expires very soon
            this.refreshTokens().catch(error => {
                console.error('Immediate token refresh failed:', error);
            });
        }
    }

    // Make authenticated request
    async authenticatedFetch(url, options = {}) {
        // Ensure we have a valid token
        if (!this.token || this.isTokenExpired()) {
            if (this.refreshToken) {
                await this.refreshTokens();
            } else {
                this.logout();
                throw new Error('No valid token available');
            }
        }

        // Add authorization header
        const headers = {
            'Authorization': `Bearer ${this.token}`,
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        // Handle 401 responses
        if (response.status === 401) {
            if (this.refreshToken) {
                try {
                    await this.refreshTokens();
                    // Retry the request with new token
                    return fetch(url, {
                        ...options,
                        headers: {
                            ...options.headers,
                            'Authorization': `Bearer ${this.token}`
                        }
                    });
                } catch (refreshError) {
                    this.logout();
                    throw new Error('Authentication failed');
                }
            } else {
                this.logout();
                throw new Error('Authentication failed');
            }
        }

        return response;
    }

    // Setup fetch interceptors
    setupInterceptors() {
        // Store original fetch
        const originalFetch = window.fetch;
        const self = this;

        // Override fetch to automatically add auth headers
        window.fetch = function(url, options = {}) {
            // Only intercept API calls
            if (typeof url === 'string' && url.startsWith(self.options.apiBaseUrl)) {
                return self.authenticatedFetch(url, options);
            }
            
            return originalFetch(url, options);
        };
    }

    // Logout user
    logout() {
        this.saveTokens(null, null);
        
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
        }

        // Redirect to login if specified
        if (this.options.loginUrl && window.location.pathname !== this.options.loginUrl) {
            window.location.href = this.options.loginUrl;
        }

        // Trigger logout event
        window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    // Check authentication status
    isAuthenticated() {
        return this.hasToken() && !this.isTokenExpired();
    }

    // Initialize from login response
    handleLoginSuccess(response) {
        const { accessToken, refreshToken, token } = response;
        const tokenToUse = accessToken || token;
        
        if (tokenToUse) {
            this.saveTokens(tokenToUse, refreshToken);
            
            // Trigger login event
            window.dispatchEvent(new CustomEvent('auth:login', {
                detail: { user: this.getUserInfo() }
            }));
            
            return true;
        }
        
        return false;
    }

    // Get authorization header
    getAuthHeader() {
        return this.token ? `Bearer ${this.token}` : null;
    }

    // Add event listeners for auth events
    onLogin(callback) {
        window.addEventListener('auth:login', callback);
    }

    onLogout(callback) {
        window.addEventListener('auth:logout', callback);
    }

    // Remove event listeners
    removeListener(event, callback) {
        window.removeEventListener(event, callback);
    }

    // Destroy the manager
    destroy() {
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
        }
        
        // Reset fetch to original
        if (window.originalFetch) {
            window.fetch = window.originalFetch;
        }
    }
}

// Create global instance
const jwtManager = new JWTManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { JWTManager, jwtManager };
}

// Export for ES6 modules
if (typeof window !== 'undefined') {
    window.JWTManager = JWTManager;
    window.jwtManager = jwtManager;
}