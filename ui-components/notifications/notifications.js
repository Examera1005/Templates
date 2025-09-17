/**
 * Universal Notification System
 * 
 * A comprehensive notification system with toasts, alerts, banners, and snackbars
 * Features: Auto-dismiss, actions, animations, positioning, and accessibility
 */

class NotificationManager {
  constructor(options = {}) {
    this.options = {
      position: 'top-right',
      defaultDuration: 5000,
      maxNotifications: 5,
      animations: true,
      pauseOnHover: true,
      ...options
    };
    
    this.notifications = [];
    this.container = null;
    this.notificationId = 0;
    
    this.init();
  }

  init() {
    this.createContainer();
    this.bindEvents();
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.className = `notification-container ${this.options.position}`;
    document.body.appendChild(this.container);
  }

  bindEvents() {
    // Handle escape key to close all notifications
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.clearAll();
      }
    });
  }

  // Main notification creation method
  show(options) {
    const notification = this.createNotification(options);
    this.addToContainer(notification);
    
    if (options.duration !== 0 && options.duration !== false) {
      this.scheduleRemoval(notification, options.duration || this.options.defaultDuration);
    }
    
    return notification;
  }

  createNotification(options) {
    const notification = {
      id: ++this.notificationId,
      element: this.createElement(options),
      options: { ...options },
      timer: null,
      startTime: null,
      remainingTime: options.duration || this.options.defaultDuration
    };

    this.bindNotificationEvents(notification);
    return notification;
  }

  createElement(options) {
    const element = document.createElement('div');
    element.className = this.getNotificationClasses(options);
    element.innerHTML = this.getNotificationHTML(options);
    
    return element;
  }

  getNotificationClasses(options) {
    const classes = ['notification'];
    
    if (options.type) classes.push(options.type);
    if (options.variant) classes.push(options.variant);
    if (options.size) classes.push(options.size);
    if (options.loading) classes.push('loading');
    
    return classes.join(' ');
  }

  getNotificationHTML(options) {
    const icon = this.getIcon(options.type, options.icon);
    const hasActions = options.actions && options.actions.length > 0;
    const showClose = options.closable !== false;
    
    return `
      ${icon ? `<div class="notification-icon">${icon}</div>` : ''}
      <div class="notification-content">
        ${options.title ? `<div class="notification-title">${options.title}</div>` : ''}
        ${options.message ? `<div class="notification-message">${options.message}</div>` : ''}
        ${hasActions ? this.getActionsHTML(options.actions) : ''}
      </div>
      ${showClose ? '<button class="notification-close" aria-label="Close">×</button>' : ''}
      ${options.progress !== false && options.duration ? '<div class="notification-progress"></div>' : ''}
    `;
  }

  getIcon(type, customIcon) {
    if (customIcon) return customIcon;
    
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
      loading: '⟳'
    };
    
    return icons[type] || '';
  }

  getActionsHTML(actions) {
    const actionsHTML = actions.map(action => 
      `<button class="notification-action ${action.variant || 'secondary'}" data-action="${action.action || ''}">${action.text}</button>`
    ).join('');
    
    return `<div class="notification-actions">${actionsHTML}</div>`;
  }

  bindNotificationEvents(notification) {
    const element = notification.element;
    
    // Close button
    const closeBtn = element.querySelector('.notification-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.remove(notification.id));
    }
    
    // Action buttons
    const actionBtns = element.querySelectorAll('.notification-action');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleAction(notification, action, e);
      });
    });
    
    // Pause on hover
    if (this.options.pauseOnHover && notification.timer) {
      element.addEventListener('mouseenter', () => this.pauseTimer(notification));
      element.addEventListener('mouseleave', () => this.resumeTimer(notification));
    }
    
    // Click to dismiss
    if (notification.options.clickToClose) {
      element.addEventListener('click', (e) => {
        if (!e.target.closest('.notification-action, .notification-close')) {
          this.remove(notification.id);
        }
      });
    }
  }

  addToContainer(notification) {
    // Remove oldest if at max capacity
    if (this.notifications.length >= this.options.maxNotifications) {
      const oldest = this.notifications[0];
      this.remove(oldest.id, false);
    }
    
    this.notifications.push(notification);
    
    // Add animation class
    if (this.options.animations) {
      const animationClass = this.getEnterAnimation();
      notification.element.classList.add(animationClass);
    }
    
    this.container.appendChild(notification.element);
    
    // Trigger accessibility announcement
    this.announceToScreenReader(notification);
  }

  getEnterAnimation() {
    const position = this.options.position;
    if (position.includes('right')) return 'slide-in-right';
    if (position.includes('left')) return 'slide-in-left';
    if (position.includes('top')) return 'slide-in-top';
    if (position.includes('bottom')) return 'slide-in-bottom';
    return 'fade-in';
  }

  getExitAnimation() {
    const position = this.options.position;
    if (position.includes('right')) return 'slide-out-right';
    if (position.includes('left')) return 'slide-out-left';
    if (position.includes('top')) return 'slide-out-top';
    if (position.includes('bottom')) return 'slide-out-bottom';
    return 'fade-out';
  }

  scheduleRemoval(notification, duration) {
    notification.startTime = Date.now();
    notification.remainingTime = duration;
    
    notification.timer = setTimeout(() => {
      this.remove(notification.id);
    }, duration);
    
    // Update progress bar
    if (notification.options.progress !== false) {
      this.updateProgressBar(notification, duration);
    }
  }

  updateProgressBar(notification, duration) {
    const progressBar = notification.element.querySelector('.notification-progress');
    if (!progressBar) return;
    
    progressBar.style.width = '100%';
    progressBar.style.transition = `width ${duration}ms linear`;
    
    // Trigger reflow and start animation
    setTimeout(() => {
      progressBar.style.width = '0%';
    }, 10);
  }

  pauseTimer(notification) {
    if (!notification.timer) return;
    
    clearTimeout(notification.timer);
    notification.remainingTime -= Date.now() - notification.startTime;
    
    // Pause progress bar
    const progressBar = notification.element.querySelector('.notification-progress');
    if (progressBar) {
      progressBar.style.animationPlayState = 'paused';
    }
  }

  resumeTimer(notification) {
    if (notification.remainingTime <= 0) return;
    
    notification.startTime = Date.now();
    notification.timer = setTimeout(() => {
      this.remove(notification.id);
    }, notification.remainingTime);
    
    // Resume progress bar
    const progressBar = notification.element.querySelector('.notification-progress');
    if (progressBar) {
      progressBar.style.animationPlayState = 'running';
    }
  }

  handleAction(notification, action, event) {
    const result = this.emit('action', { 
      notification, 
      action, 
      event,
      data: notification.options.data 
    });
    
    // Auto-close after action unless prevented
    if (result !== false && notification.options.closeOnAction !== false) {
      this.remove(notification.id);
    }
  }

  remove(id, animate = true) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index === -1) return;
    
    const notification = this.notifications[index];
    
    // Clear timer
    if (notification.timer) {
      clearTimeout(notification.timer);
    }
    
    if (animate && this.options.animations) {
      const animationClass = this.getExitAnimation();
      notification.element.classList.add(animationClass);
      
      setTimeout(() => {
        this.removeElement(notification, index);
      }, 300);
    } else {
      this.removeElement(notification, index);
    }
  }

  removeElement(notification, index) {
    if (notification.element.parentNode) {
      notification.element.parentNode.removeChild(notification.element);
    }
    
    this.notifications.splice(index, 1);
    
    this.emit('remove', { notification });
  }

  clearAll() {
    const notificationsCopy = [...this.notifications];
    notificationsCopy.forEach(notification => {
      this.remove(notification.id);
    });
  }

  // Convenience methods
  success(message, options = {}) {
    return this.show({
      type: 'success',
      message,
      ...options
    });
  }

  error(message, options = {}) {
    return this.show({
      type: 'error',
      message,
      duration: options.duration !== undefined ? options.duration : 0, // Don't auto-dismiss errors by default
      ...options
    });
  }

  warning(message, options = {}) {
    return this.show({
      type: 'warning',
      message,
      ...options
    });
  }

  info(message, options = {}) {
    return this.show({
      type: 'info',
      message,
      ...options
    });
  }

  loading(message, options = {}) {
    return this.show({
      type: 'info',
      loading: true,
      message,
      duration: 0, // Don't auto-dismiss loading notifications
      closable: false,
      ...options
    });
  }

  // Update existing notification
  update(id, options) {
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) return;
    
    // Merge options
    Object.assign(notification.options, options);
    
    // Update element
    notification.element.className = this.getNotificationClasses(notification.options);
    notification.element.innerHTML = this.getNotificationHTML(notification.options);
    
    // Re-bind events
    this.bindNotificationEvents(notification);
    
    return notification;
  }

  announceToScreenReader(notification) {
    const message = `${notification.options.title || ''} ${notification.options.message || ''}`.trim();
    if (!message) return;
    
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Event system
  on(event, callback) {
    if (!this.events) this.events = {};
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
    return this;
  }

  off(event, callback) {
    if (!this.events || !this.events[event]) return this;
    
    if (callback) {
      const index = this.events[event].indexOf(callback);
      if (index > -1) {
        this.events[event].splice(index, 1);
      }
    } else {
      this.events[event] = [];
    }
    
    return this;
  }

  emit(event, data) {
    if (!this.events || !this.events[event]) return;
    
    let result;
    this.events[event].forEach(callback => {
      try {
        const callbackResult = callback(data);
        if (callbackResult !== undefined) {
          result = callbackResult;
        }
      } catch (error) {
        console.error('Notification event callback error:', error);
      }
    });
    
    return result;
  }

  // Utility methods
  setPosition(position) {
    this.options.position = position;
    this.container.className = `notification-container ${position}`;
    return this;
  }

  destroy() {
    this.clearAll();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.events = {};
  }
}

// Alert Banner Component
class AlertBanner {
  constructor(options = {}) {
    this.options = {
      type: 'info',
      message: '',
      closable: true,
      duration: 0,
      ...options
    };
    
    this.element = null;
    this.timer = null;
    
    this.init();
  }

  init() {
    this.createElement();
    this.bindEvents();
    this.show();
    
    if (this.options.duration > 0) {
      this.scheduleHide();
    }
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.className = `alert-banner ${this.options.type}`;
    this.element.innerHTML = `
      <div class="alert-banner-content">
        ${this.options.message}
      </div>
      ${this.options.closable ? '<button class="alert-banner-close" aria-label="Close">×</button>' : ''}
    `;
    
    document.body.appendChild(this.element);
  }

  bindEvents() {
    if (this.options.closable) {
      const closeBtn = this.element.querySelector('.alert-banner-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.hide());
      }
    }
    
    // Close on escape key
    this.keyHandler = (e) => {
      if (e.key === 'Escape') {
        this.hide();
      }
    };
    document.addEventListener('keydown', this.keyHandler);
  }

  show() {
    setTimeout(() => {
      this.element.classList.add('show');
    }, 10);
  }

  hide() {
    this.element.classList.remove('show');
    
    setTimeout(() => {
      this.destroy();
    }, 300);
  }

  scheduleHide() {
    this.timer = setTimeout(() => {
      this.hide();
    }, this.options.duration);
  }

  destroy() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    document.removeEventListener('keydown', this.keyHandler);
  }
}

// Snackbar Component
class Snackbar {
  constructor(options = {}) {
    this.options = {
      message: '',
      action: null,
      duration: 4000,
      ...options
    };
    
    this.element = null;
    this.timer = null;
    
    this.init();
  }

  init() {
    this.createElement();
    this.bindEvents();
    this.show();
    
    if (this.options.duration > 0) {
      this.scheduleHide();
    }
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'snackbar';
    
    const actionHTML = this.options.action ? 
      `<button class="snackbar-action">${this.options.action.text}</button>` : '';
    
    this.element.innerHTML = `
      <div class="snackbar-message">${this.options.message}</div>
      ${actionHTML}
    `;
    
    document.body.appendChild(this.element);
  }

  bindEvents() {
    if (this.options.action) {
      const actionBtn = this.element.querySelector('.snackbar-action');
      if (actionBtn) {
        actionBtn.addEventListener('click', () => {
          if (this.options.action.callback) {
            this.options.action.callback();
          }
          this.hide();
        });
      }
    }
  }

  show() {
    setTimeout(() => {
      this.element.classList.add('show');
    }, 10);
  }

  hide() {
    this.element.classList.remove('show');
    
    setTimeout(() => {
      this.destroy();
    }, 300);
  }

  scheduleHide() {
    this.timer = setTimeout(() => {
      this.hide();
    }, this.options.duration);
  }

  destroy() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

// Global notification instance
let globalNotificationManager = null;

// Convenience functions for global use
const notifications = {
  init(options = {}) {
    if (globalNotificationManager) {
      globalNotificationManager.destroy();
    }
    globalNotificationManager = new NotificationManager(options);
    return globalNotificationManager;
  },

  show(options) {
    if (!globalNotificationManager) {
      globalNotificationManager = new NotificationManager();
    }
    return globalNotificationManager.show(options);
  },

  success(message, options = {}) {
    if (!globalNotificationManager) {
      globalNotificationManager = new NotificationManager();
    }
    return globalNotificationManager.success(message, options);
  },

  error(message, options = {}) {
    if (!globalNotificationManager) {
      globalNotificationManager = new NotificationManager();
    }
    return globalNotificationManager.error(message, options);
  },

  warning(message, options = {}) {
    if (!globalNotificationManager) {
      globalNotificationManager = new NotificationManager();
    }
    return globalNotificationManager.warning(message, options);
  },

  info(message, options = {}) {
    if (!globalNotificationManager) {
      globalNotificationManager = new NotificationManager();
    }
    return globalNotificationManager.info(message, options);
  },

  loading(message, options = {}) {
    if (!globalNotificationManager) {
      globalNotificationManager = new NotificationManager();
    }
    return globalNotificationManager.loading(message, options);
  },

  banner(message, type = 'info', options = {}) {
    return new AlertBanner({
      message,
      type,
      ...options
    });
  },

  snackbar(message, options = {}) {
    return new Snackbar({
      message,
      ...options
    });
  },

  clearAll() {
    if (globalNotificationManager) {
      globalNotificationManager.clearAll();
    }
  }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    NotificationManager, 
    AlertBanner, 
    Snackbar, 
    notifications 
  };
} else if (typeof window !== 'undefined') {
  window.NotificationManager = NotificationManager;
  window.AlertBanner = AlertBanner;
  window.Snackbar = Snackbar;
  window.notifications = notifications;
}