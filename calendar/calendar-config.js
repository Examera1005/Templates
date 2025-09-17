// Calendar Configuration
export const CalendarConfig = {
  // Toggle authentication mode
  useAuth: false, // Set to true to enable user-specific events, false for local storage only
  
  // Storage keys
  storageKeys: {
    events: 'calendar-events',
    userEvents: 'user-calendar-events' // Used when useAuth is true
  },
  
  // Event validation
  validation: {
    maxTitleLength: 100,
    maxDescriptionLength: 500,
    allowPastEvents: true
  },
  
  // UI Configuration
  ui: {
    theme: 'default', // 'default', 'dark', 'light'
    defaultView: 'month', // 'month', 'week', 'day'
    showWeekNumbers: false,
    firstDayOfWeek: 0, // 0 = Sunday, 1 = Monday
    timeFormat: '12h' // '12h' or '24h'
  },
  
  // Optional auth callbacks (implement these when useAuth is true)
  auth: {
    getCurrentUser: null, // Function that returns current user object
    onAuthRequired: null, // Function called when auth is required but user not logged in
    getUserEvents: null, // Function to fetch user events from backend
    saveUserEvent: null, // Function to save event to backend
    deleteUserEvent: null // Function to delete event from backend
  }
};