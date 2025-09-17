// Authentication Integration for Calendar
import { CalendarConfig } from './calendar-config.js';

export class CalendarAuth {
  constructor() {
    this.currentUser = null;
    this.callbacks = {
      onLogin: [],
      onLogout: [],
      onUserChange: []
    };
  }

  // Set the current user
  setUser(user) {
    const previousUser = this.currentUser;
    this.currentUser = user;
    
    // Update config
    if (CalendarConfig.auth.getCurrentUser) {
      CalendarConfig.auth.getCurrentUser = () => this.currentUser;
    }
    
    // Trigger callbacks
    this.triggerCallbacks('onUserChange', { user, previousUser });
    
    if (user && !previousUser) {
      this.triggerCallbacks('onLogin', { user });
    } else if (!user && previousUser) {
      this.triggerCallbacks('onLogout', { previousUser });
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!this.currentUser;
  }

  // Login user
  login(user) {
    this.setUser(user);
  }

  // Logout user
  logout() {
    this.setUser(null);
  }

  // Register callback for auth events
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  // Remove callback
  off(event, callback) {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].indexOf(callback);
      if (index > -1) {
        this.callbacks[event].splice(index, 1);
      }
    }
  }

  // Trigger callbacks
  triggerCallbacks(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} callback:`, error);
        }
      });
    }
  }

  // Configure auth integration
  configure(options = {}) {
    // Set auth mode
    if (typeof options.useAuth !== 'undefined') {
      CalendarConfig.useAuth = options.useAuth;
    }

    // Set auth callbacks
    if (options.getCurrentUser) {
      CalendarConfig.auth.getCurrentUser = options.getCurrentUser;
    }

    if (options.onAuthRequired) {
      CalendarConfig.auth.onAuthRequired = options.onAuthRequired;
    }

    if (options.getUserEvents) {
      CalendarConfig.auth.getUserEvents = options.getUserEvents;
    }

    if (options.saveUserEvent) {
      CalendarConfig.auth.saveUserEvent = options.saveUserEvent;
    }

    if (options.deleteUserEvent) {
      CalendarConfig.auth.deleteUserEvent = options.deleteUserEvent;
    }

    // Set initial user if provided
    if (options.currentUser) {
      this.setUser(options.currentUser);
    }
  }

  // Create a wrapper for calendar that automatically handles auth
  createAuthWrapper(calendar) {
    return new AuthenticatedCalendar(calendar, this);
  }
}

// Authenticated Calendar Wrapper
class AuthenticatedCalendar {
  constructor(calendar, auth) {
    this.calendar = calendar;
    this.auth = auth;
    
    // Set up auth event listeners
    this.auth.on('onLogin', (data) => this.handleLogin(data));
    this.auth.on('onLogout', (data) => this.handleLogout(data));
    this.auth.on('onUserChange', (data) => this.handleUserChange(data));
    
    // Initialize with current user
    if (this.auth.getCurrentUser()) {
      this.calendar.setUser(this.auth.getCurrentUser());
    }
  }

  handleLogin(data) {
    this.calendar.setUser(data.user);
    this.calendar.refreshCalendar();
  }

  handleLogout(data) {
    this.calendar.setUser(null);
    this.calendar.dataManager.clearEvents(); // Clear local events on logout
    this.calendar.refreshCalendar();
  }

  handleUserChange(data) {
    if (data.user !== data.previousUser) {
      this.calendar.setUser(data.user);
      this.calendar.refreshCalendar();
    }
  }

  // Proxy all calendar methods
  navigateMonth(direction) { return this.calendar.navigateMonth(direction); }
  goToToday() { return this.calendar.goToToday(); }
  changeView(view) { return this.calendar.changeView(view); }
  refreshCalendar() { return this.calendar.refreshCalendar(); }
  destroy() { return this.calendar.destroy(); }
}

// Helper function to create calendar with auth integration
export function createCalendarWithAuth(containerId, authOptions = {}, calendarOptions = {}) {
  // Create auth instance
  const auth = new CalendarAuth();
  auth.configure(authOptions);
  
  // Import calendar class dynamically to avoid circular dependencies
  return import('./calendar.js').then(({ InteractiveCalendar }) => {
    import('./event-manager.js').then(({ addEventManagement }) => {
      addEventManagement(InteractiveCalendar);
    });
    
    const calendar = new InteractiveCalendar(containerId, calendarOptions);
    return auth.createAuthWrapper(calendar);
  });
}

// Example auth implementations
export const AuthExamples = {
  // Simple localStorage-based auth
  localStorage: {
    getCurrentUser: () => {
      const userStr = localStorage.getItem('calendar-user');
      return userStr ? JSON.parse(userStr) : null;
    },
    
    login: (user) => {
      localStorage.setItem('calendar-user', JSON.stringify(user));
    },
    
    logout: () => {
      localStorage.removeItem('calendar-user');
    },
    
    onAuthRequired: () => {
      const username = prompt('Please enter your username:');
      if (username) {
        const user = { id: username, name: username };
        AuthExamples.localStorage.login(user);
        return user;
      }
      return null;
    }
  },

  // Mock API auth
  mockAPI: {
    getCurrentUser: () => {
      return window.currentUser || null;
    },
    
    getUserEvents: async (userId) => {
      // Mock API call
      const response = await fetch(`/api/users/${userId}/events`);
      return response.json();
    },
    
    saveUserEvent: async (event) => {
      // Mock API call
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      return response.json();
    },
    
    deleteUserEvent: async (eventId) => {
      // Mock API call
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
      });
      return response.ok;
    },
    
    onAuthRequired: () => {
      // Redirect to login page or show login modal
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
    }
  }
};