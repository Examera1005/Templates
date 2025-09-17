// Main Calendar Module - Entry Point
import { InteractiveCalendar } from './calendar.js';
import { addEventManagement } from './event-manager.js';
import { CalendarAuth, createCalendarWithAuth, AuthExamples } from './auth.js';
import { CalendarConfig } from './calendar-config.js';

// Add event management to calendar
addEventManagement(InteractiveCalendar);

// Main factory function to create calendar
export function createCalendar(containerId, options = {}) {
  const {
    useAuth = false,
    authOptions = {},
    ...calendarOptions
  } = options;

  if (useAuth) {
    // Configure auth mode
    CalendarConfig.useAuth = true;
    
    // Create calendar with auth integration
    return createCalendarWithAuth(containerId, authOptions, calendarOptions);
  } else {
    // Create simple calendar without auth
    CalendarConfig.useAuth = false;
    return Promise.resolve(new InteractiveCalendar(containerId, calendarOptions));
  }
}

// Export all components for advanced usage
export {
  InteractiveCalendar,
  CalendarAuth,
  AuthExamples,
  CalendarConfig,
  createCalendarWithAuth
};

// Global initialization for script tag usage
if (typeof window !== 'undefined') {
  window.InteractiveCalendar = {
    create: createCalendar,
    Calendar: InteractiveCalendar,
    Auth: CalendarAuth,
    Config: CalendarConfig,
    AuthExamples
  };
}

// Default export
export default {
  create: createCalendar,
  Calendar: InteractiveCalendar,
  Auth: CalendarAuth,
  Config: CalendarConfig,
  AuthExamples
};