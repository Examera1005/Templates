// Event Management for Interactive Calendar
import { CalendarConfig } from './calendar-config.js';

export class EventManager {
  constructor(calendar) {
    this.calendar = calendar;
    this.currentEvent = null;
    this.isEditing = false;
  }

  showEventModal(date = null, eventId = null) {
    // Check auth requirements
    if (CalendarConfig.useAuth && !this.calendar.currentUser) {
      if (CalendarConfig.auth.onAuthRequired) {
        CalendarConfig.auth.onAuthRequired();
        return;
      } else {
        this.showAuthNotice();
        return;
      }
    }

    this.isEditing = !!eventId;
    
    if (eventId) {
      const events = this.calendar.dataManager.getAllEvents();
      this.currentEvent = events.find(e => e.id === eventId);
      if (!this.currentEvent) {
        this.showError('Event not found');
        return;
      }
    } else {
      this.currentEvent = null;
    }

    const modalHtml = this.renderEventModal(date, this.currentEvent);
    document.getElementById('event-modal').innerHTML = modalHtml;
    document.getElementById('event-modal').style.display = 'flex';
    
    this.attachModalEventListeners();
    
    // Focus first input
    setTimeout(() => {
      const firstInput = document.querySelector('#event-form input[type="text"]');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  renderEventModal(selectedDate, event) {
    const title = event ? 'Edit Event' : 'Add Event';
    const defaultDate = selectedDate || (event ? event.date : new Date().toISOString().split('T')[0]);
    
    const colorOptions = [
      '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8',
      '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#6c757d'
    ];

    return `
      <div class="modal">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        
        ${CalendarConfig.useAuth && !this.calendar.currentUser ? this.renderAuthNotice() : ''}
        
        <form id="event-form">
          <div class="form-group">
            <label for="event-title">Title *</label>
            <input type="text" id="event-title" name="title" required 
                   value="${event ? event.title : ''}" 
                   maxlength="${CalendarConfig.validation.maxTitleLength}">
          </div>
          
          <div class="form-group">
            <label for="event-description">Description</label>
            <textarea id="event-description" name="description" 
                      maxlength="${CalendarConfig.validation.maxDescriptionLength}"
                      placeholder="Optional description...">${event ? event.description : ''}</textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="event-date">Date *</label>
              <input type="date" id="event-date" name="date" required value="${defaultDate}">
            </div>
            
            <div class="form-group">
              <label for="event-time">Time</label>
              <input type="time" id="event-time" name="time" value="${event ? event.time : ''}">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="event-duration">Duration (minutes)</label>
              <select id="event-duration" name="duration">
                <option value="15" ${event && event.duration === 15 ? 'selected' : ''}>15 minutes</option>
                <option value="30" ${event && event.duration === 30 ? 'selected' : ''}>30 minutes</option>
                <option value="60" ${!event || event.duration === 60 ? 'selected' : ''}>1 hour</option>
                <option value="90" ${event && event.duration === 90 ? 'selected' : ''}>1.5 hours</option>
                <option value="120" ${event && event.duration === 120 ? 'selected' : ''}>2 hours</option>
                <option value="180" ${event && event.duration === 180 ? 'selected' : ''}>3 hours</option>
                <option value="240" ${event && event.duration === 240 ? 'selected' : ''}>4 hours</option>
                <option value="480" ${event && event.duration === 480 ? 'selected' : ''}>8 hours</option>
                <option value="1440" ${event && event.duration === 1440 ? 'selected' : ''}>All day</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Color</label>
              <div class="color-picker">
                ${colorOptions.map(color => `
                  <div class="color-option ${(!event && color === '#007bff') || (event && event.color === color) ? 'selected' : ''}" 
                       style="background-color: ${color}" 
                       data-color="${color}"></div>
                `).join('')}
              </div>
            </div>
          </div>
          
          <div id="form-error" class="error-message" style="display: none;"></div>
          
          <div class="modal-actions">
            ${event ? '<button type="button" class="btn btn-danger" id="delete-event-btn">Delete</button>' : ''}
            <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-primary">${event ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    `;
  }

  renderAuthNotice() {
    return `
      <div class="auth-notice">
        <strong>Authentication Required</strong><br>
        Please log in to manage events.
      </div>
    `;
  }

  attachModalEventListeners() {
    // Close modal
    document.getElementById('modal-close-btn').addEventListener('click', () => this.closeModal());
    document.getElementById('cancel-btn').addEventListener('click', () => this.closeModal());
    
    // Color picker
    document.querySelectorAll('.color-option').forEach(option => {
      option.addEventListener('click', (e) => {
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        e.target.classList.add('selected');
      });
    });
    
    // Form submission
    document.getElementById('event-form').addEventListener('submit', (e) => this.handleFormSubmit(e));
    
    // Delete button
    const deleteBtn = document.getElementById('delete-event-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.handleDelete());
    }
    
    // Real-time validation
    document.getElementById('event-title').addEventListener('input', () => this.clearError());
    document.getElementById('event-date').addEventListener('change', () => this.clearError());
  }

  async handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const selectedColor = document.querySelector('.color-option.selected')?.dataset.color || '#007bff';
    
    const eventData = {
      title: formData.get('title').trim(),
      description: formData.get('description').trim(),
      date: formData.get('date'),
      time: formData.get('time'),
      duration: parseInt(formData.get('duration')),
      color: selectedColor
    };

    try {
      if (this.isEditing) {
        await this.calendar.dataManager.updateEvent(this.currentEvent.id, eventData);
      } else {
        await this.calendar.dataManager.addEvent(eventData);
      }
      
      this.closeModal();
      this.calendar.refreshCalendar();
      this.showSuccess(this.isEditing ? 'Event updated successfully!' : 'Event created successfully!');
      
    } catch (error) {
      this.showError(error.message);
    }
  }

  async handleDelete() {
    if (!this.currentEvent) return;
    
    const confirmed = confirm('Are you sure you want to delete this event?');
    if (!confirmed) return;
    
    try {
      await this.calendar.dataManager.deleteEvent(this.currentEvent.id);
      this.closeModal();
      this.calendar.refreshCalendar();
      this.showSuccess('Event deleted successfully!');
      
    } catch (error) {
      this.showError(error.message);
    }
  }

  showError(message) {
    const errorDiv = document.getElementById('form-error');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
  }

  clearError() {
    const errorDiv = document.getElementById('form-error');
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }

  showSuccess(message) {
    // Create a temporary success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 1001;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  }

  showAuthNotice() {
    const modal = document.getElementById('event-modal');
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>Authentication Required</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').style.display='none'">&times;</button>
        </div>
        <div class="auth-notice">
          <strong>Please log in to manage events.</strong><br><br>
          This calendar is configured to require authentication for event management.
          Please log in to add, edit, or delete events.
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').style.display='none'">Close</button>
        </div>
      </div>
    `;
    modal.style.display = 'flex';
  }

  closeModal() {
    document.getElementById('event-modal').style.display = 'none';
    this.currentEvent = null;
    this.isEditing = false;
  }
}

// Extend the InteractiveCalendar class with event management
export function addEventManagement(InteractiveCalendar) {
  InteractiveCalendar.prototype.showEventModal = function(date = null, eventId = null) {
    if (!this.eventManager) {
      this.eventManager = new EventManager(this);
    }
    this.eventManager.showEventModal(date, eventId);
  };

  InteractiveCalendar.prototype.closeModal = function() {
    if (this.eventManager) {
      this.eventManager.closeModal();
    }
  };
}