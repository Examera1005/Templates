/**
 * Universal Modal Component
 * Pure JavaScript modal system with multiple types and configurations
 * Zero dependencies, fully accessible, and responsive
 */

class Modal {
  constructor(options = {}) {
    this.options = {
      type: 'default', // default, alert, confirm, form, fullscreen
      size: 'medium', // small, medium, large, fullscreen
      closable: true,
      closeOnOverlay: true,
      closeOnEscape: true,
      animation: true,
      removeOnClose: true,
      appendTo: document.body,
      className: '',
      ...options
    };

    this.isOpen = false;
    this.element = null;
    this.overlay = null;
    this.focusTrap = null;
    this.previousFocus = null;
    
    this.init();
  }

  init() {
    this.createElement();
    this.bindEvents();
  }

  createElement() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.style.display = 'none';

    // Create modal element
    this.element = document.createElement('div');
    this.element.className = `modal ${this.options.type} ${this.options.size} ${this.options.className}`.trim();
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-modal', 'true');
    this.element.setAttribute('aria-hidden', 'true');

    this.overlay.appendChild(this.element);
  }

  bindEvents() {
    // Close on overlay click
    if (this.options.closeOnOverlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.close();
        }
      });
    }

    // Close on escape key
    if (this.options.closeOnEscape) {
      this.handleEscape = (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      };
      document.addEventListener('keydown', this.handleEscape);
    }
  }

  setContent(content) {
    if (typeof content === 'string') {
      this.element.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      this.element.innerHTML = '';
      this.element.appendChild(content);
    }

    // Add close button if closable and not already present
    if (this.options.closable && !this.element.querySelector('.modal-close')) {
      this.addCloseButton();
    }

    // Setup focus trap
    this.setupFocusTrap();
    
    return this;
  }

  addCloseButton() {
    const header = this.element.querySelector('.modal-header');
    if (header && !header.querySelector('.modal-close')) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'modal-close';
      closeBtn.innerHTML = '×';
      closeBtn.setAttribute('aria-label', 'Close modal');
      closeBtn.addEventListener('click', () => this.close());
      header.appendChild(closeBtn);
    }
  }

  setupFocusTrap() {
    const focusableElements = this.element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    this.focusTrap = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    this.element.addEventListener('keydown', this.focusTrap);
  }

  open() {
    if (this.isOpen) return this;

    this.previousFocus = document.activeElement;
    this.options.appendTo.appendChild(this.overlay);
    
    // Force reflow for animation
    this.overlay.offsetHeight;
    
    this.overlay.style.display = 'flex';
    this.element.setAttribute('aria-hidden', 'false');
    
    // Focus first focusable element
    requestAnimationFrame(() => {
      const firstFocusable = this.element.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        this.element.focus();
      }
    });

    this.isOpen = true;
    document.body.style.overflow = 'hidden';
    
    this.trigger('open');
    return this;
  }

  close() {
    if (!this.isOpen) return this;

    this.element.setAttribute('aria-hidden', 'true');
    
    if (this.options.animation) {
      this.overlay.style.animation = 'modalFadeIn 0.2s ease-out reverse';
      this.element.style.animation = 'modalSlideIn 0.3s ease-out reverse';
      
      setTimeout(() => {
        this.performClose();
      }, 200);
    } else {
      this.performClose();
    }

    return this;
  }

  performClose() {
    if (this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    
    document.body.style.overflow = '';
    
    // Restore focus
    if (this.previousFocus) {
      this.previousFocus.focus();
    }

    this.isOpen = false;
    this.trigger('close');

    if (this.options.removeOnClose) {
      this.destroy();
    }
  }

  destroy() {
    if (this.handleEscape) {
      document.removeEventListener('keydown', this.handleEscape);
    }
    
    if (this.focusTrap) {
      this.element.removeEventListener('keydown', this.focusTrap);
    }

    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }

    this.trigger('destroy');
  }

  trigger(eventName) {
    const event = new CustomEvent(`modal:${eventName}`, {
      detail: { modal: this }
    });
    document.dispatchEvent(event);
  }

  // Static methods for common modal types
  static alert(message, options = {}) {
    const modal = new Modal({
      type: 'alert',
      size: 'small',
      ...options
    });

    const content = `
      <div class="modal-header">
        <h3 class="modal-title">${options.title || 'Alert'}</h3>
      </div>
      <div class="modal-body">
        <div class="alert-icon">
          ${Modal.getAlertIcon(options.variant || 'info')}
        </div>
        <p>${message}</p>
      </div>
      <div class="modal-footer">
        <button class="modal-btn primary" data-action="close">OK</button>
      </div>
    `;

    modal.setContent(content);
    modal.element.addEventListener('click', (e) => {
      if (e.target.dataset.action === 'close') {
        modal.close();
        if (options.onOk) options.onOk();
      }
    });

    modal.open();
    return modal;
  }

  static confirm(message, options = {}) {
    return new Promise((resolve) => {
      const modal = new Modal({
        type: 'confirm',
        size: 'small',
        closeOnOverlay: false,
        closeOnEscape: false,
        ...options
      });

      const content = `
        <div class="modal-header">
          <h3 class="modal-title">${options.title || 'Confirm'}</h3>
        </div>
        <div class="modal-body">
          <div class="confirm-icon">⚠</div>
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button class="modal-btn outline" data-action="cancel">${options.cancelText || 'Cancel'}</button>
          <button class="modal-btn ${options.danger ? 'danger' : 'primary'}" data-action="confirm">${options.confirmText || 'Confirm'}</button>
        </div>
      `;

      modal.setContent(content);
      modal.element.addEventListener('click', (e) => {
        if (e.target.dataset.action === 'confirm') {
          modal.close();
          resolve(true);
        } else if (e.target.dataset.action === 'cancel') {
          modal.close();
          resolve(false);
        }
      });

      modal.open();
    });
  }

  static form(formConfig, options = {}) {
    return new Promise((resolve, reject) => {
      const modal = new Modal({
        type: 'form',
        size: options.size || 'medium',
        ...options
      });

      const formHTML = Modal.generateFormHTML(formConfig);
      const content = `
        <div class="modal-header">
          <h3 class="modal-title">${options.title || 'Form'}</h3>
        </div>
        <div class="modal-body">
          <form class="modal-form">
            ${formHTML}
          </form>
        </div>
        <div class="modal-footer">
          <button class="modal-btn outline" type="button" data-action="cancel">${options.cancelText || 'Cancel'}</button>
          <button class="modal-btn primary" type="button" data-action="submit">${options.submitText || 'Submit'}</button>
        </div>
      `;

      modal.setContent(content);
      
      const form = modal.element.querySelector('.modal-form');
      modal.element.addEventListener('click', (e) => {
        if (e.target.dataset.action === 'submit') {
          const formData = new FormData(form);
          const data = Object.fromEntries(formData.entries());
          
          if (Modal.validateForm(form, formConfig)) {
            modal.close();
            resolve(data);
          }
        } else if (e.target.dataset.action === 'cancel') {
          modal.close();
          reject(new Error('Form cancelled'));
        }
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        modal.element.querySelector('[data-action="submit"]').click();
      });

      modal.open();
    });
  }

  static generateFormHTML(config) {
    return config.fields.map(field => {
      const { type, name, label, placeholder, required, options, validation } = field;
      
      let input = '';
      switch (type) {
        case 'text':
        case 'email':
        case 'password':
        case 'number':
          input = `<input type="${type}" name="${name}" class="form-input" placeholder="${placeholder || ''}" ${required ? 'required' : ''}>`;
          break;
        case 'textarea':
          input = `<textarea name="${name}" class="form-textarea" placeholder="${placeholder || ''}" ${required ? 'required' : ''}></textarea>`;
          break;
        case 'select':
          const optionsHTML = options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
          input = `<select name="${name}" class="form-select" ${required ? 'required' : ''}>${optionsHTML}</select>`;
          break;
      }

      return `
        <div class="form-group">
          <label class="form-label">${label}${required ? ' *' : ''}</label>
          ${input}
          <div class="form-error" style="display: none;"></div>
        </div>
      `;
    }).join('');
  }

  static validateForm(form, config) {
    let isValid = true;
    
    config.fields.forEach(field => {
      const input = form.querySelector(`[name="${field.name}"]`);
      const errorDiv = input.parentNode.querySelector('.form-error');
      let error = '';

      if (field.required && !input.value.trim()) {
        error = `${field.label} is required`;
        isValid = false;
      } else if (field.validation && input.value) {
        const validationResult = field.validation(input.value);
        if (validationResult !== true) {
          error = validationResult;
          isValid = false;
        }
      }

      if (error) {
        errorDiv.textContent = error;
        errorDiv.style.display = 'block';
        input.style.borderColor = '#dc2626';
      } else {
        errorDiv.style.display = 'none';
        input.style.borderColor = '#d1d5db';
      }
    });

    return isValid;
  }

  static getAlertIcon(variant) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[variant] || icons.info;
  }
}

// Global modal utilities
window.Modal = Modal;

// Event delegation for modal triggers
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-modal-trigger]');
  if (!trigger) return;

  e.preventDefault();
  
  const action = trigger.dataset.modalTrigger;
  const target = trigger.dataset.modalTarget;
  
  if (action === 'open' && target) {
    const content = document.querySelector(target);
    if (content) {
      const modal = new Modal({
        size: trigger.dataset.modalSize || 'medium',
        type: trigger.dataset.modalType || 'default'
      });
      modal.setContent(content.innerHTML);
      modal.open();
    }
  }
});

// Auto-initialize modals with data attributes
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-modal]').forEach(element => {
    const config = JSON.parse(element.dataset.modal || '{}');
    const modal = new Modal(config);
    
    if (element.id) {
      window[element.id] = modal;
    }
  });
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Modal;
}