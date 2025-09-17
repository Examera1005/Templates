/**
 * Universal Button Component System
 * 
 * A comprehensive button system with multiple variants, states, and interactions
 * Features: Loading states, animations, button groups, toggle buttons, and more
 */

class Button {
  constructor(element, options = {}) {
    this.element = typeof element === 'string' ? document.querySelector(element) : element;
    this.options = {
      variant: 'primary',
      size: 'md',
      loading: false,
      disabled: false,
      toggle: false,
      dropdown: false,
      animations: true,
      ...options
    };
    
    this.isLoading = false;
    this.isActive = false;
    this.data = {};
    
    this.init();
  }

  init() {
    if (!this.element) return;
    
    this.setupButton();
    this.bindEvents();
    
    if (this.options.loading) {
      this.showLoading();
    }
    
    if (this.options.disabled) {
      this.disable();
    }
  }

  setupButton() {
    this.element.classList.add('btn');
    
    if (this.options.variant !== 'primary') {
      this.element.classList.add(this.options.variant);
    } else {
      this.element.classList.add('primary');
    }
    
    if (this.options.size !== 'md') {
      this.element.classList.add(this.options.size);
    }
    
    if (this.options.toggle) {
      this.element.classList.add('toggle');
    }
    
    if (this.options.dropdown) {
      this.element.classList.add('dropdown');
    }

    // Ensure proper button structure
    this.wrapTextContent();
  }

  wrapTextContent() {
    const textNodes = Array.from(this.element.childNodes).filter(node => 
      node.nodeType === Node.TEXT_NODE && node.textContent.trim()
    );
    
    textNodes.forEach(node => {
      const span = document.createElement('span');
      span.className = 'btn-text';
      span.textContent = node.textContent;
      node.parentNode.replaceChild(span, node);
    });
  }

  bindEvents() {
    this.element.addEventListener('click', (e) => this.handleClick(e));
    this.element.addEventListener('keydown', (e) => this.handleKeydown(e));
    
    if (this.options.dropdown) {
      this.element.addEventListener('click', (e) => this.toggleDropdown(e));
    }
  }

  handleClick(e) {
    if (this.isLoading || this.element.disabled) {
      e.preventDefault();
      return;
    }

    if (this.options.toggle) {
      this.toggle();
    }

    this.emit('click', { button: this, event: e });
    
    // Add click animation
    if (this.options.animations) {
      this.addClickRipple(e);
    }
  }

  handleKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleClick(e);
    }
  }

  // Loading state management
  showLoading() {
    this.isLoading = true;
    this.element.classList.add('loading');
    this.element.disabled = true;
    
    this.emit('loadingStart', { button: this });
    return this;
  }

  hideLoading() {
    this.isLoading = false;
    this.element.classList.remove('loading');
    this.element.disabled = this.options.disabled;
    
    this.emit('loadingEnd', { button: this });
    return this;
  }

  // State management
  enable() {
    this.options.disabled = false;
    this.element.disabled = false;
    this.element.classList.remove('disabled');
    return this;
  }

  disable() {
    this.options.disabled = true;
    this.element.disabled = true;
    this.element.classList.add('disabled');
    return this;
  }

  toggle() {
    this.isActive = !this.isActive;
    this.element.classList.toggle('active', this.isActive);
    
    this.emit('toggle', { button: this, active: this.isActive });
    return this;
  }

  setActive(active = true) {
    this.isActive = active;
    this.element.classList.toggle('active', active);
    
    this.emit('toggle', { button: this, active: this.isActive });
    return this;
  }

  // Content management
  setText(text) {
    const textEl = this.element.querySelector('.btn-text');
    if (textEl) {
      textEl.textContent = text;
    } else {
      // If no text element exists, create one
      const span = document.createElement('span');
      span.className = 'btn-text';
      span.textContent = text;
      this.element.appendChild(span);
    }
    return this;
  }

  setIcon(iconHtml, position = 'left') {
    // Remove existing icons
    this.element.querySelectorAll('.btn-icon').forEach(icon => icon.remove());
    
    if (iconHtml) {
      const iconEl = document.createElement('span');
      iconEl.className = 'btn-icon';
      iconEl.innerHTML = iconHtml;
      
      if (position === 'left') {
        this.element.insertBefore(iconEl, this.element.firstChild);
      } else {
        this.element.appendChild(iconEl);
      }
    }
    
    return this;
  }

  // Style management
  setVariant(variant) {
    // Remove existing variant classes
    const variants = ['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'outline', 'ghost', 'gradient'];
    variants.forEach(v => this.element.classList.remove(v));
    
    this.options.variant = variant;
    this.element.classList.add(variant);
    return this;
  }

  setSize(size) {
    // Remove existing size classes
    const sizes = ['xs', 'sm', 'lg', 'xl'];
    sizes.forEach(s => this.element.classList.remove(s));
    
    this.options.size = size;
    if (size !== 'md') {
      this.element.classList.add(size);
    }
    
    return this;
  }

  // Animation methods
  pulse() {
    if (!this.options.animations) return this;
    
    this.element.classList.remove('pulse');
    this.element.offsetHeight; // Trigger reflow
    this.element.classList.add('pulse');
    
    setTimeout(() => {
      this.element.classList.remove('pulse');
    }, 1000);
    
    return this;
  }

  shake() {
    if (!this.options.animations) return this;
    
    this.element.classList.remove('shake');
    this.element.offsetHeight; // Trigger reflow
    this.element.classList.add('shake');
    
    setTimeout(() => {
      this.element.classList.remove('shake');
    }, 500);
    
    return this;
  }

  bounce() {
    if (!this.options.animations) return this;
    
    this.element.classList.remove('bounce');
    this.element.offsetHeight; // Trigger reflow
    this.element.classList.add('bounce');
    
    setTimeout(() => {
      this.element.classList.remove('bounce');
    }, 1000);
    
    return this;
  }

  addClickRipple(event) {
    const ripple = document.createElement('span');
    const rect = this.element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
      z-index: 1;
    `;
    
    this.element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  // Dropdown functionality
  toggleDropdown(e) {
    if (!this.options.dropdown) return;
    
    e.stopPropagation();
    this.element.classList.toggle('open');
    
    this.emit('dropdownToggle', { 
      button: this, 
      open: this.element.classList.contains('open') 
    });
  }

  closeDropdown() {
    this.element.classList.remove('open');
    this.emit('dropdownClose', { button: this });
    return this;
  }

  // Data binding
  setData(key, value) {
    if (typeof key === 'object') {
      Object.assign(this.data, key);
    } else {
      this.data[key] = value;
    }
    return this;
  }

  getData(key) {
    return key ? this.data[key] : this.data;
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
    if (!this.events || !this.events[event]) return this;
    
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Button event callback error:', error);
      }
    });
    
    return this;
  }

  // Utility methods
  destroy() {
    if (this.element) {
      this.element.removeEventListener('click', this.handleClick);
      this.element.removeEventListener('keydown', this.handleKeydown);
      this.element = null;
    }
    this.events = {};
    this.data = {};
  }
}

// Button Group Manager
class ButtonGroup {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = {
      vertical: false,
      toggle: 'none', // 'none', 'single', 'multiple'
      ...options
    };
    
    this.buttons = [];
    this.activeButtons = new Set();
    
    this.init();
  }

  init() {
    if (!this.container) return;
    
    this.setupGroup();
    this.bindEvents();
    this.scanExistingButtons();
  }

  setupGroup() {
    this.container.classList.add('btn-group');
    
    if (this.options.vertical) {
      this.container.classList.add('vertical');
    }
  }

  bindEvents() {
    this.container.addEventListener('click', (e) => {
      const buttonEl = e.target.closest('.btn');
      if (buttonEl) {
        const button = this.buttons.find(b => b.element === buttonEl);
        if (button && this.options.toggle !== 'none') {
          this.handleToggle(button);
        }
      }
    });
  }

  scanExistingButtons() {
    const buttonElements = this.container.querySelectorAll('.btn');
    buttonElements.forEach(el => {
      this.addButton(new Button(el));
    });
  }

  addButton(button) {
    if (button instanceof Button) {
      this.buttons.push(button);
      if (!button.element.parentNode || button.element.parentNode !== this.container) {
        this.container.appendChild(button.element);
      }
    } else {
      // Assume it's an element or selector
      const btn = new Button(button);
      this.buttons.push(btn);
      this.container.appendChild(btn.element);
    }
    
    return this;
  }

  removeButton(button) {
    const index = this.buttons.indexOf(button);
    if (index > -1) {
      this.buttons.splice(index, 1);
      this.activeButtons.delete(button);
      if (button.element && button.element.parentNode) {
        button.element.parentNode.removeChild(button.element);
      }
      button.destroy();
    }
    return this;
  }

  handleToggle(button) {
    if (this.options.toggle === 'single') {
      // Deactivate all other buttons
      this.buttons.forEach(b => {
        if (b !== button) {
          b.setActive(false);
          this.activeButtons.delete(b);
        }
      });
      
      // Toggle the clicked button
      button.toggle();
      if (button.isActive) {
        this.activeButtons.add(button);
      } else {
        this.activeButtons.delete(button);
      }
    } else if (this.options.toggle === 'multiple') {
      // Toggle the clicked button
      button.toggle();
      if (button.isActive) {
        this.activeButtons.add(button);
      } else {
        this.activeButtons.delete(button);
      }
    }
    
    this.emit('toggle', { 
      button, 
      activeButtons: Array.from(this.activeButtons) 
    });
  }

  getActiveButtons() {
    return Array.from(this.activeButtons);
  }

  setActiveButton(button) {
    if (this.options.toggle === 'single') {
      this.buttons.forEach(b => {
        b.setActive(b === button);
        if (b === button) {
          this.activeButtons.add(b);
        } else {
          this.activeButtons.delete(b);
        }
      });
    }
    return this;
  }

  clearActive() {
    this.buttons.forEach(b => b.setActive(false));
    this.activeButtons.clear();
    return this;
  }

  // Event system
  on(event, callback) {
    if (!this.events) this.events = {};
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
    return this;
  }

  emit(event, data) {
    if (!this.events || !this.events[event]) return this;
    
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('ButtonGroup event callback error:', error);
      }
    });
    
    return this;
  }
}

// Button Builder for programmatic creation
class ButtonBuilder {
  constructor(options = {}) {
    this.buttonData = {
      tag: 'button',
      classes: ['btn'],
      attributes: {},
      ...options
    };
  }

  static create(options) {
    return new ButtonBuilder(options);
  }

  // Basic properties
  text(text) {
    this.buttonData.text = text;
    return this;
  }

  variant(variant) {
    // Remove existing variant classes
    this.buttonData.classes = this.buttonData.classes.filter(c => 
      !['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'outline', 'ghost', 'gradient'].includes(c)
    );
    this.buttonData.classes.push(variant);
    return this;
  }

  size(size) {
    // Remove existing size classes
    this.buttonData.classes = this.buttonData.classes.filter(c => 
      !['xs', 'sm', 'lg', 'xl'].includes(c)
    );
    if (size !== 'md') {
      this.buttonData.classes.push(size);
    }
    return this;
  }

  // Styling
  rounded(rounded = true) {
    if (rounded) {
      this.buttonData.classes.push('rounded');
    }
    return this;
  }

  circle(circle = true) {
    if (circle) {
      this.buttonData.classes.push('circle', 'icon-only');
    }
    return this;
  }

  block(block = true) {
    if (block) {
      this.buttonData.classes.push('block');
    }
    return this;
  }

  // States
  disabled(disabled = true) {
    if (disabled) {
      this.buttonData.attributes.disabled = true;
    }
    return this;
  }

  loading(loading = true) {
    if (loading) {
      this.buttonData.classes.push('loading');
    }
    return this;
  }

  // Interactive features
  toggle(toggle = true) {
    if (toggle) {
      this.buttonData.classes.push('toggle');
    }
    return this;
  }

  dropdown(dropdown = true) {
    if (dropdown) {
      this.buttonData.classes.push('dropdown');
    }
    return this;
  }

  // Icons
  icon(iconHtml, position = 'left') {
    this.buttonData.icon = { html: iconHtml, position };
    return this;
  }

  iconOnly(iconHtml) {
    this.buttonData.classes.push('icon-only');
    this.buttonData.icon = { html: iconHtml, position: 'left' };
    return this;
  }

  // Attributes
  id(id) {
    this.buttonData.attributes.id = id;
    return this;
  }

  className(className) {
    this.buttonData.classes.push(className);
    return this;
  }

  onClick(handler) {
    this.buttonData.onClick = handler;
    return this;
  }

  data(key, value) {
    if (!this.buttonData.data) this.buttonData.data = {};
    this.buttonData.data[key] = value;
    return this;
  }

  // Special button types
  fab(mini = false) {
    this.buttonData.classes.push('fab');
    if (mini) {
      this.buttonData.classes.push('mini');
    }
    return this;
  }

  // Build the button
  build() {
    const element = document.createElement(this.buttonData.tag);
    element.className = this.buttonData.classes.join(' ');
    
    // Set attributes
    Object.entries(this.buttonData.attributes).forEach(([key, value]) => {
      if (value === true) {
        element.setAttribute(key, '');
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // Add content
    let content = '';
    
    if (this.buttonData.icon && this.buttonData.icon.position === 'left') {
      content += `<span class="btn-icon">${this.buttonData.icon.html}</span>`;
    }
    
    if (this.buttonData.text) {
      content += `<span class="btn-text">${this.buttonData.text}</span>`;
    }
    
    if (this.buttonData.icon && this.buttonData.icon.position === 'right') {
      content += `<span class="btn-icon">${this.buttonData.icon.html}</span>`;
    }
    
    element.innerHTML = content;
    
    // Set data attributes
    if (this.buttonData.data) {
      Object.entries(this.buttonData.data).forEach(([key, value]) => {
        element.dataset[key] = value;
      });
    }
    
    // Add event listeners
    if (this.buttonData.onClick) {
      element.addEventListener('click', this.buttonData.onClick);
    }
    
    return element;
  }

  // Convenience methods for common button types
  static primary(text, onClick) {
    return new ButtonBuilder()
      .variant('primary')
      .text(text)
      .onClick(onClick)
      .build();
  }

  static secondary(text, onClick) {
    return new ButtonBuilder()
      .variant('secondary')
      .text(text)
      .onClick(onClick)
      .build();
  }

  static success(text, onClick) {
    return new ButtonBuilder()
      .variant('success')
      .text(text)
      .onClick(onClick)
      .build();
  }

  static danger(text, onClick) {
    return new ButtonBuilder()
      .variant('danger')
      .text(text)
      .onClick(onClick)
      .build();
  }
}

// Add CSS animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(2);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Button, ButtonGroup, ButtonBuilder };
} else if (typeof window !== 'undefined') {
  window.Button = Button;
  window.ButtonGroup = ButtonGroup;
  window.ButtonBuilder = ButtonBuilder;
}