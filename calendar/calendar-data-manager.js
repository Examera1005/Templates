// Calendar Data Manager - handles both local storage and user-based storage
import { CalendarConfig } from './calendar-config.js';

export class CalendarDataManager {
  constructor() {
    this.events = [];
    this.currentUser = null;
    this.loadEvents();
  }

  // Initialize with optional user context
  setUser(user) {
    this.currentUser = user;
    this.loadEvents();
  }

  // Load events based on auth mode
  loadEvents() {
    if (CalendarConfig.useAuth && this.currentUser) {
      this.loadUserEvents();
    } else {
      this.loadLocalEvents();
    }
  }

  // Load from localStorage
  loadLocalEvents() {
    try {
      const stored = localStorage.getItem(CalendarConfig.storageKeys.events);
      this.events = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading local events:', error);
      this.events = [];
    }
  }

  // Load user-specific events
  async loadUserEvents() {
    try {
      if (CalendarConfig.auth.getUserEvents) {
        this.events = await CalendarConfig.auth.getUserEvents(this.currentUser.id);
      } else {
        // Fallback to localStorage with user prefix
        const userKey = `${CalendarConfig.storageKeys.userEvents}-${this.currentUser.id}`;
        const stored = localStorage.getItem(userKey);
        this.events = stored ? JSON.parse(stored) : [];
      }
    } catch (error) {
      console.error('Error loading user events:', error);
      this.loadLocalEvents(); // Fallback to local storage
    }
  }

  // Save events
  async saveEvents() {
    try {
      if (CalendarConfig.useAuth && this.currentUser) {
        await this.saveUserEvents();
      } else {
        this.saveLocalEvents();
      }
    } catch (error) {
      console.error('Error saving events:', error);
    }
  }

  // Save to localStorage
  saveLocalEvents() {
    localStorage.setItem(CalendarConfig.storageKeys.events, JSON.stringify(this.events));
  }

  // Save user-specific events
  async saveUserEvents() {
    if (CalendarConfig.auth.saveUserEvent) {
      // If custom save function provided, save each event individually
      // This is typically used for backend integration
      return;
    } else {
      // Fallback to localStorage with user prefix
      const userKey = `${CalendarConfig.storageKeys.userEvents}-${this.currentUser.id}`;
      localStorage.setItem(userKey, JSON.stringify(this.events));
    }
  }

  // Validate event data
  validateEvent(event) {
    const errors = [];
    
    if (!event.title || event.title.trim().length === 0) {
      errors.push('Title is required');
    }
    
    if (event.title && event.title.length > CalendarConfig.validation.maxTitleLength) {
      errors.push(`Title must be less than ${CalendarConfig.validation.maxTitleLength} characters`);
    }
    
    if (event.description && event.description.length > CalendarConfig.validation.maxDescriptionLength) {
      errors.push(`Description must be less than ${CalendarConfig.validation.maxDescriptionLength} characters`);
    }
    
    if (!event.date) {
      errors.push('Date is required');
    }
    
    if (!CalendarConfig.validation.allowPastEvents) {
      const eventDate = new Date(event.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (eventDate < today) {
        errors.push('Past events are not allowed');
      }
    }
    
    return errors;
  }

  // Add event
  async addEvent(eventData) {
    const errors = this.validateEvent(eventData);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const event = {
      id: this.generateId(),
      title: eventData.title.trim(),
      description: eventData.description?.trim() || '',
      date: eventData.date,
      time: eventData.time || '',
      duration: eventData.duration || 60,
      color: eventData.color || '#007bff',
      userId: this.currentUser?.id || null,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    // If using auth and custom save function, use it
    if (CalendarConfig.useAuth && this.currentUser && CalendarConfig.auth.saveUserEvent) {
      await CalendarConfig.auth.saveUserEvent(event);
    }

    this.events.push(event);
    await this.saveEvents();
    return event;
  }

  // Update event
  async updateEvent(eventId, updates) {
    const eventIndex = this.events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) {
      throw new Error('Event not found');
    }

    const currentEvent = this.events[eventIndex];
    
    // Check permissions for auth mode
    if (CalendarConfig.useAuth && this.currentUser && currentEvent.userId !== this.currentUser.id) {
      throw new Error('Not authorized to update this event');
    }

    const updatedEvent = { ...currentEvent, ...updates, updated: new Date().toISOString() };
    
    const errors = this.validateEvent(updatedEvent);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    this.events[eventIndex] = updatedEvent;
    await this.saveEvents();
    return updatedEvent;
  }

  // Delete event
  async deleteEvent(eventId) {
    const eventIndex = this.events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) {
      throw new Error('Event not found');
    }

    const event = this.events[eventIndex];
    
    // Check permissions for auth mode
    if (CalendarConfig.useAuth && this.currentUser && event.userId !== this.currentUser.id) {
      throw new Error('Not authorized to delete this event');
    }

    // If using auth and custom delete function, use it
    if (CalendarConfig.useAuth && this.currentUser && CalendarConfig.auth.deleteUserEvent) {
      await CalendarConfig.auth.deleteUserEvent(eventId);
    }

    this.events.splice(eventIndex, 1);
    await this.saveEvents();
    return true;
  }

  // Get events for a specific date range
  getEvents(startDate, endDate) {
    return this.events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= startDate && eventDate <= endDate;
    });
  }

  // Get events for a specific date
  getEventsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    return this.events.filter(event => event.date === dateStr);
  }

  // Get all events
  getAllEvents() {
    return [...this.events];
  }

  // Generate unique ID
  generateId() {
    return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Clear all events (useful for logout)
  clearEvents() {
    this.events = [];
    this.saveEvents();
  }
}