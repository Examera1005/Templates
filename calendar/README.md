# Interactive Calendar Component

A flexible, plug-and-play calendar component that works with or without authentication. Perfect for integrating into any project with minimal setup.

## Features

- **Dual Mode Operation**: Works with or without user authentication
- **Multiple Views**: Month, Week, and Day views
- **Event Management**: Create, edit, and delete events
- **Flexible Storage**: localStorage by default, with optional backend integration
- **Responsive Design**: Works on desktop and mobile devices
- **Keyboard Navigation**: Full keyboard support
- **Customizable**: Easy to theme and configure
- **Zero Dependencies**: Pure JavaScript, no external libraries required

## Quick Start

### 1. Include the Files

```html
<link rel="stylesheet" href="calendar.css">
<script type="module" src="index.js"></script>
```

### 2. Create a Container

```html
<div id="my-calendar"></div>
```

### 3. Initialize the Calendar

```javascript
import { createCalendar } from './index.js';

// Simple calendar (no authentication)
const calendar = await createCalendar('my-calendar');

// Calendar with authentication
const authCalendar = await createCalendar('my-calendar', {
  useAuth: true,
  authOptions: {
    getCurrentUser: () => getCurrentUser(), // Your auth function
    onAuthRequired: () => showLoginModal()  // Your login handler
  }
});
```

## Configuration Options

### Basic Configuration

```javascript
const calendar = await createCalendar('container-id', {
  useAuth: false,           // Enable/disable authentication
  defaultView: 'month',     // 'month', 'week', 'day'
  
  // Calendar options
  firstDayOfWeek: 0,        // 0 = Sunday, 1 = Monday
  timeFormat: '12h',        // '12h' or '24h'
  allowPastEvents: true,    // Allow creating events in the past
  
  // Auth options (when useAuth: true)
  authOptions: {
    getCurrentUser: () => user,
    onAuthRequired: () => {},
    getUserEvents: async (userId) => events,
    saveUserEvent: async (event) => {},
    deleteUserEvent: async (eventId) => {}
  }
});
```

### Advanced Configuration

You can also configure the calendar by modifying the global config:

```javascript
import { CalendarConfig } from './calendar-config.js';

// Global configuration
CalendarConfig.useAuth = true;
CalendarConfig.ui.theme = 'dark';
CalendarConfig.ui.defaultView = 'week';
CalendarConfig.validation.maxTitleLength = 200;

// Auth configuration
CalendarConfig.auth.getCurrentUser = () => myUser;
CalendarConfig.auth.onAuthRequired = () => redirectToLogin();
```

## Usage Examples

### 1. Simple Local Calendar

```javascript
// Basic setup - events stored in localStorage
const calendar = await createCalendar('calendar-container', {
  useAuth: false
});
```

### 2. Multi-User Calendar with Simple Auth

```javascript
let currentUser = null;

const calendar = await createCalendar('calendar-container', {
  useAuth: true,
  authOptions: {
    getCurrentUser: () => currentUser,
    onAuthRequired: () => {
      const username = prompt('Enter username:');
      if (username) {
        currentUser = { id: username, name: username };
        calendar.setUser(currentUser);
      }
    }
  }
});

// Login/logout functions
function login(user) {
  currentUser = user;
  calendar.setUser(user);
}

function logout() {
  currentUser = null;
  calendar.setUser(null);
}
```

### 3. Calendar with Backend Integration

```javascript
const calendar = await createCalendar('calendar-container', {
  useAuth: true,
  authOptions: {
    getCurrentUser: () => window.currentUser,
    
    onAuthRequired: () => {
      window.location.href = '/login';
    },
    
    getUserEvents: async (userId) => {
      const response = await fetch(`/api/users/${userId}/events`);
      return response.json();
    },
    
    saveUserEvent: async (event) => {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      return response.json();
    },
    
    deleteUserEvent: async (eventId) => {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
      });
      return response.ok;
    }
  }
});
```

### 4. React Integration

```jsx
import { useEffect, useRef } from 'react';
import { createCalendar } from './calendar/index.js';

function CalendarComponent({ user, onAuthRequired }) {
  const containerRef = useRef(null);
  const calendarRef = useRef(null);

  useEffect(() => {
    const initCalendar = async () => {
      if (containerRef.current) {
        calendarRef.current = await createCalendar(containerRef.current.id, {
          useAuth: !!user,
          authOptions: {
            getCurrentUser: () => user,
            onAuthRequired: onAuthRequired
          }
        });
      }
    };

    initCalendar();

    return () => {
      if (calendarRef.current?.destroy) {
        calendarRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (calendarRef.current?.setUser) {
      calendarRef.current.setUser(user);
    }
  }, [user]);

  return <div id="react-calendar" ref={containerRef}></div>;
}
```

### 5. Vue Integration

```vue
<template>
  <div id="vue-calendar" ref="calendarContainer"></div>
</template>

<script>
import { createCalendar } from './calendar/index.js';

export default {
  props: ['user'],
  
  async mounted() {
    this.calendar = await createCalendar(this.$refs.calendarContainer.id, {
      useAuth: !!this.user,
      authOptions: {
        getCurrentUser: () => this.user,
        onAuthRequired: () => this.$emit('auth-required')
      }
    });
  },
  
  watch: {
    user(newUser) {
      if (this.calendar?.setUser) {
        this.calendar.setUser(newUser);
      }
    }
  },
  
  beforeUnmount() {
    if (this.calendar?.destroy) {
      this.calendar.destroy();
    }
  }
}
</script>
```

## Event Object Structure

```javascript
const event = {
  id: 'evt_123456789_abc',      // Auto-generated unique ID
  title: 'Meeting',             // Required: Event title
  description: 'Team sync',     // Optional: Event description
  date: '2024-03-15',          // Required: Date in YYYY-MM-DD format
  time: '10:00',               // Optional: Time in HH:MM format
  duration: 60,                // Optional: Duration in minutes
  color: '#007bff',            // Optional: Event color
  userId: 'user123',           // Auto-set: User ID (if auth enabled)
  created: '2024-03-01T10:00:00Z',  // Auto-set: Creation timestamp
  updated: '2024-03-01T10:00:00Z'   // Auto-set: Last update timestamp
};
```

## API Reference

### Calendar Instance Methods

```javascript
// Navigation
calendar.navigate(direction);        // -1 for previous, 1 for next
calendar.goToToday();               // Navigate to today
calendar.changeView(view);          // 'month', 'week', 'day'

// User management (auth mode)
calendar.setUser(user);             // Set current user
calendar.getCurrentUser();          // Get current user

// Event management
await calendar.dataManager.addEvent(eventData);
await calendar.dataManager.updateEvent(eventId, updates);
await calendar.dataManager.deleteEvent(eventId);
calendar.dataManager.getEventsForDate(date);
calendar.dataManager.getAllEvents();

// Display
calendar.refreshCalendar();         // Refresh the display
calendar.destroy();                 // Clean up event listeners
```

### Data Manager API

```javascript
const dataManager = calendar.dataManager;

// Events
await dataManager.addEvent(eventData);
await dataManager.updateEvent(eventId, updates);
await dataManager.deleteEvent(eventId);

// Querying
dataManager.getEvents(startDate, endDate);
dataManager.getEventsForDate(date);
dataManager.getAllEvents();

// User management
dataManager.setUser(user);
dataManager.loadEvents();
dataManager.clearEvents();
```

## Styling and Theming

The calendar uses CSS custom properties for easy theming:

```css
.calendar-container {
  --primary-color: #007bff;
  --background-color: #ffffff;
  --border-color: #e9ecef;
  --text-color: #333333;
  --hover-color: #f8f9fa;
}

/* Dark theme example */
.calendar-container.dark-theme {
  --primary-color: #0d6efd;
  --background-color: #212529;
  --border-color: #495057;
  --text-color: #ffffff;
  --hover-color: #343a40;
}
```

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## File Structure

```
calendar/
├── index.js              # Main entry point
├── calendar.js           # Core calendar component
├── calendar.css          # Styles
├── calendar-config.js    # Configuration
├── calendar-data-manager.js  # Data management
├── event-manager.js      # Event CRUD operations
├── auth.js              # Authentication integration
├── demo.html            # Demo page
└── README.md            # This file
```

## Migration Guide

### From Basic Calendar to Auth-Enabled

1. Change initialization:
```javascript
// Before
const calendar = await createCalendar('container');

// After
const calendar = await createCalendar('container', {
  useAuth: true,
  authOptions: { /* your auth config */ }
});
```

2. Handle user state:
```javascript
// Set user when they log in
calendar.setUser(user);

// Clear user when they log out
calendar.setUser(null);
```

### From Auth to No-Auth

1. Simply change the configuration:
```javascript
const calendar = await createCalendar('container', {
  useAuth: false  // Events will be stored locally
});
```

## Contributing

This calendar is designed to be easily extensible. To add new features:

1. Extend the `CalendarConfig` for new options
2. Add methods to `CalendarDataManager` for data operations
3. Extend the UI in `calendar.js` for display changes
4. Update styles in `calendar.css`

## License

MIT License - feel free to use in any project!

## Support

For questions or issues, please refer to the demo.html file for working examples of all features.