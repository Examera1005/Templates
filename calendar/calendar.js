// Interactive Calendar Component
import { CalendarDataManager } from './calendar-data-manager.js';
import { CalendarConfig } from './calendar-config.js';

export class InteractiveCalendar {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }

    this.dataManager = new CalendarDataManager();
    this.currentDate = new Date();
    this.selectedDate = null;
    this.currentView = options.defaultView || CalendarConfig.ui.defaultView;
    this.currentUser = null;

    // Bind methods
    this.handleCellClick = this.handleCellClick.bind(this);
    this.handleEventClick = this.handleEventClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
    
    // Add keyboard support
    document.addEventListener('keydown', this.handleKeyDown);
    
    // Check if auth is enabled and user is provided
    if (CalendarConfig.useAuth && CalendarConfig.auth.getCurrentUser) {
      this.currentUser = CalendarConfig.auth.getCurrentUser();
      this.dataManager.setUser(this.currentUser);
    }
  }

  // Set user for auth mode
  setUser(user) {
    this.currentUser = user;
    this.dataManager.setUser(user);
    this.refreshCalendar();
  }

  // Handle keyboard navigation
  handleKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.navigateMonth(-1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.navigateMonth(1);
        break;
      case 'n':
      case 'N':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.showEventModal();
        }
        break;
      case 'Escape':
        this.closeModal();
        break;
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="calendar-container">
        <div class="calendar-header">
          <h2 id="calendar-title">${this.getCalendarTitle()}</h2>
          <div class="calendar-nav">
            <button id="prev-btn">‹ Previous</button>
            <button id="today-btn">Today</button>
            <button id="next-btn">Next ›</button>
            <div class="view-selector">
              <button class="view-btn ${this.currentView === 'month' ? 'active' : ''}" data-view="month">Month</button>
              <button class="view-btn ${this.currentView === 'week' ? 'active' : ''}" data-view="week">Week</button>
              <button class="view-btn ${this.currentView === 'day' ? 'active' : ''}" data-view="day">Day</button>
            </div>
            <button id="add-event-btn">+ Add Event</button>
          </div>
        </div>
        <div id="calendar-content">
          ${this.renderCurrentView()}
        </div>
      </div>
      <div id="event-modal" class="modal-overlay" style="display: none;"></div>
    `;
  }

  getCalendarTitle() {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    switch (this.currentView) {
      case 'month':
        return `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
      case 'week':
        const weekStart = this.getWeekStart(this.currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${
          weekStart.getMonth() !== weekEnd.getMonth() ? monthNames[weekEnd.getMonth()] + ' ' : ''
        }${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
      case 'day':
        return `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getDate()}, ${this.currentDate.getFullYear()}`;
      default:
        return '';
    }
  }

  renderCurrentView() {
    switch (this.currentView) {
      case 'month':
        return this.renderMonthView();
      case 'week':
        return this.renderWeekView();
      case 'day':
        return this.renderDayView();
      default:
        return this.renderMonthView();
    }
  }

  renderMonthView() {
    const firstDayOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
    
    // Calculate start and end dates for the calendar grid
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
    
    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()));

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    let html = '<div class="calendar-grid">';
    
    // Header row
    dayNames.forEach(day => {
      html += `<div class="calendar-header-cell">${day}</div>`;
    });

    // Calendar cells
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const isCurrentMonth = currentDate.getMonth() === this.currentDate.getMonth();
      const isToday = this.isToday(currentDate);
      const isSelected = this.selectedDate && this.isSameDate(currentDate, this.selectedDate);
      
      const cellClasses = [
        'calendar-cell',
        !isCurrentMonth ? 'other-month' : '',
        isToday ? 'today' : '',
        isSelected ? 'selected' : ''
      ].filter(Boolean).join(' ');

      const events = this.dataManager.getEventsForDate(currentDate);
      const eventsHtml = this.renderCellEvents(events);

      html += `
        <div class="${cellClasses}" data-date="${currentDate.toISOString().split('T')[0]}">
          <div class="cell-date">${currentDate.getDate()}</div>
          <div class="cell-events">${eventsHtml}</div>
        </div>
      `;

      currentDate.setDate(currentDate.getDate() + 1);
    }

    html += '</div>';
    return html;
  }

  renderWeekView() {
    const weekStart = this.getWeekStart(this.currentDate);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    let html = '<div class="week-view">';
    
    // Time column header
    html += '<div class="calendar-header-cell">Time</div>';
    
    // Day headers
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const isToday = this.isToday(date);
      
      html += `
        <div class="calendar-header-cell ${isToday ? 'today' : ''}">
          ${dayNames[i]}<br>
          <small>${date.getDate()}</small>
        </div>
      `;
    }

    // Time slots
    for (let hour = 0; hour < 24; hour++) {
      const timeStr = this.formatTime(hour, 0);
      html += `<div class="week-time-slot">${timeStr}</div>`;
      
      // Day columns for this hour
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const events = this.getEventsForHour(date, hour);
        
        html += `
          <div class="week-day-column" data-date="${date.toISOString().split('T')[0]}" data-hour="${hour}">
            ${this.renderWeekEvents(events)}
          </div>
        `;
      }
    }

    html += '</div>';
    return html;
  }

  renderDayView() {
    const events = this.dataManager.getEventsForDate(this.currentDate);
    
    let html = '<div class="day-view">';
    
    // Time column
    html += '<div class="day-time-column">';
    for (let hour = 0; hour < 24; hour++) {
      const timeStr = this.formatTime(hour, 0);
      html += `<div class="day-hour-slot">${timeStr}</div>`;
    }
    html += '</div>';
    
    // Events column
    html += `
      <div class="day-events-column" data-date="${this.currentDate.toISOString().split('T')[0]}">
        ${this.renderDayEvents(events)}
      </div>
    `;
    
    html += '</div>';
    return html;
  }

  renderCellEvents(events) {
    const maxVisible = 3;
    let html = '';
    
    events.slice(0, maxVisible).forEach(event => {
      html += `
        <div class="event-item" 
             style="--event-color: ${event.color}" 
             data-event-id="${event.id}">
          ${event.title}
        </div>
      `;
    });
    
    if (events.length > maxVisible) {
      html += `<div class="event-more">+${events.length - maxVisible} more</div>`;
    }
    
    return html;
  }

  renderWeekEvents(events) {
    return events.map(event => {
      const time = event.time ? new Date(`2000-01-01T${event.time}`) : null;
      const top = time ? (time.getHours() * 60 + time.getMinutes()) : 0;
      
      return `
        <div class="week-event" 
             style="--event-color: ${event.color}; top: ${top}px; height: ${event.duration || 60}px;" 
             data-event-id="${event.id}">
          ${event.title}
        </div>
      `;
    }).join('');
  }

  renderDayEvents(events) {
    return events.map(event => {
      const time = event.time ? new Date(`2000-01-01T${event.time}`) : null;
      const top = time ? (time.getHours() * 60 + time.getMinutes()) : 0;
      
      return `
        <div class="day-event" 
             style="--event-color: ${event.color}; top: ${top}px; height: ${event.duration || 60}px;" 
             data-event-id="${event.id}">
          <strong>${event.title}</strong>
          ${event.description ? `<br><small>${event.description}</small>` : ''}
        </div>
      `;
    }).join('');
  }

  attachEventListeners() {
    // Navigation buttons
    document.getElementById('prev-btn').addEventListener('click', () => this.navigate(-1));
    document.getElementById('next-btn').addEventListener('click', () => this.navigate(1));
    document.getElementById('today-btn').addEventListener('click', () => this.goToToday());
    
    // View selector
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.changeView(e.target.dataset.view));
    });
    
    // Add event button
    document.getElementById('add-event-btn').addEventListener('click', () => this.showEventModal());
    
    // Calendar cells and events
    this.container.addEventListener('click', this.handleCellClick);
    this.container.addEventListener('click', this.handleEventClick);
    
    // Modal close
    document.getElementById('event-modal').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.closeModal();
      }
    });
  }

  handleCellClick(e) {
    const cell = e.target.closest('.calendar-cell, .week-day-column, .day-events-column');
    if (cell && !e.target.closest('.event-item, .week-event, .day-event')) {
      const dateStr = cell.dataset.date;
      if (dateStr) {
        this.selectedDate = new Date(dateStr);
        if (this.currentView === 'month') {
          this.refreshCalendar();
        }
        
        // Double click to add event
        if (e.detail === 2) {
          this.showEventModal(dateStr);
        }
      }
    }
  }

  handleEventClick(e) {
    const eventElement = e.target.closest('.event-item, .week-event, .day-event');
    if (eventElement) {
      e.stopPropagation();
      const eventId = eventElement.dataset.eventId;
      this.showEventModal(null, eventId);
    }
  }

  navigate(direction) {
    switch (this.currentView) {
      case 'month':
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        break;
      case 'week':
        this.currentDate.setDate(this.currentDate.getDate() + (direction * 7));
        break;
      case 'day':
        this.currentDate.setDate(this.currentDate.getDate() + direction);
        break;
    }
    this.refreshCalendar();
  }

  goToToday() {
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.refreshCalendar();
  }

  changeView(view) {
    this.currentView = view;
    this.refreshCalendar();
  }

  refreshCalendar() {
    document.getElementById('calendar-title').textContent = this.getCalendarTitle();
    document.getElementById('calendar-content').innerHTML = this.renderCurrentView();
    
    // Update view selector
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === this.currentView);
    });
  }

  // Utility methods
  isToday(date) {
    const today = new Date();
    return this.isSameDate(date, today);
  }

  isSameDate(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  getWeekStart(date) {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay() + CalendarConfig.ui.firstDayOfWeek);
    return weekStart;
  }

  formatTime(hour, minute) {
    if (CalendarConfig.ui.timeFormat === '12h') {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    } else {
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
  }

  getEventsForHour(date, hour) {
    const events = this.dataManager.getEventsForDate(date);
    return events.filter(event => {
      if (!event.time) return hour === 0; // Events without time show at midnight
      const eventTime = new Date(`2000-01-01T${event.time}`);
      return eventTime.getHours() === hour;
    });
  }

  // Modal methods will be implemented in the next part
  showEventModal(date = null, eventId = null) {
    // This will be implemented in the event management section
    console.log('Show event modal', { date, eventId });
  }

  closeModal() {
    document.getElementById('event-modal').style.display = 'none';
  }

  // Cleanup
  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}