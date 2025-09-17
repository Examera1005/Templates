/**
 * Universal Card Component System
 * 
 * A comprehensive card system with multiple types and layouts
 * Features: Profile cards, pricing cards, testimonials, stats, and more
 */

class Card {
  constructor(element, options = {}) {
    this.element = typeof element === 'string' ? document.querySelector(element) : element;
    this.options = {
      clickable: false,
      variant: 'default',
      size: 'md',
      animations: true,
      loadingState: false,
      ...options
    };
    
    this.isLoading = false;
    this.data = {};
    
    this.init();
  }

  init() {
    if (!this.element) return;
    
    this.setupCard();
    this.bindEvents();
    
    if (this.options.loadingState) {
      this.showLoading();
    }
  }

  setupCard() {
    this.element.classList.add('card');
    
    if (this.options.clickable) {
      this.element.classList.add('clickable');
      this.element.setAttribute('tabindex', '0');
    }
    
    if (this.options.variant !== 'default') {
      this.element.classList.add(this.options.variant);
    }
    
    if (this.options.size !== 'md') {
      this.element.classList.add(this.options.size);
    }
  }

  bindEvents() {
    if (this.options.clickable) {
      this.element.addEventListener('click', (e) => this.handleClick(e));
      this.element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleClick(e);
        }
      });
    }

    // Handle button clicks within card
    this.element.addEventListener('click', (e) => {
      if (e.target.matches('.card-btn')) {
        this.handleButtonClick(e);
      }
    });
  }

  handleClick(e) {
    if (e.target.closest('.card-btn')) return; // Don't trigger card click for buttons
    
    this.emit('click', { card: this, event: e });
  }

  handleButtonClick(e) {
    const button = e.target;
    const action = button.dataset.action;
    
    if (action) {
      this.emit('action', { 
        action, 
        button, 
        card: this, 
        event: e 
      });
    }
  }

  // Content management methods
  setTitle(title) {
    const titleEl = this.element.querySelector('.card-title');
    if (titleEl) {
      titleEl.textContent = title;
    }
    return this;
  }

  setSubtitle(subtitle) {
    const subtitleEl = this.element.querySelector('.card-subtitle');
    if (subtitleEl) {
      subtitleEl.textContent = subtitle;
    }
    return this;
  }

  setText(text) {
    const textEl = this.element.querySelector('.card-text');
    if (textEl) {
      textEl.textContent = text;
    }
    return this;
  }

  setImage(src, alt = '') {
    const imageEl = this.element.querySelector('.card-image');
    if (imageEl) {
      imageEl.src = src;
      imageEl.alt = alt;
    }
    return this;
  }

  setBadge(text, variant = 'default') {
    let badgeEl = this.element.querySelector('.card-badge');
    if (!badgeEl) {
      badgeEl = document.createElement('div');
      badgeEl.className = 'card-badge';
      this.element.appendChild(badgeEl);
    }
    
    badgeEl.textContent = text;
    badgeEl.className = `card-badge ${variant}`;
    return this;
  }

  setAvatar(src, alt = '') {
    const avatarEl = this.element.querySelector('.card-avatar');
    if (avatarEl) {
      avatarEl.src = src;
      avatarEl.alt = alt;
    }
    return this;
  }

  // Loading states
  showLoading() {
    this.isLoading = true;
    this.element.classList.add('card-loading');
    
    const content = this.element.innerHTML;
    this.element.dataset.originalContent = content;
    
    this.element.innerHTML = `
      <div class="card-loading">
        <div style="text-align: center;">
          <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid #e5e7eb; border-top: 2px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <div style="margin-top: 8px;">Loading...</div>
        </div>
      </div>
    `;
    
    return this;
  }

  hideLoading() {
    this.isLoading = false;
    this.element.classList.remove('card-loading');
    
    if (this.element.dataset.originalContent) {
      this.element.innerHTML = this.element.dataset.originalContent;
      delete this.element.dataset.originalContent;
      this.bindEvents(); // Re-bind events after content restore
    }
    
    return this;
  }

  showSkeleton() {
    this.element.classList.add('card-skeleton');
    
    const content = this.element.innerHTML;
    this.element.dataset.originalContent = content;
    
    this.element.innerHTML = `
      <div class="card-header">
        <div class="skeleton skeleton-avatar"></div>
        <div style="flex: 1;">
          <div class="skeleton skeleton-text" style="width: 60%;"></div>
          <div class="skeleton skeleton-text sm" style="width: 40%;"></div>
        </div>
      </div>
      <div class="skeleton skeleton-image"></div>
      <div class="card-body">
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width: 80%;"></div>
      </div>
    `;
    
    return this;
  }

  hideSkeleton() {
    this.element.classList.remove('card-skeleton');
    
    if (this.element.dataset.originalContent) {
      this.element.innerHTML = this.element.dataset.originalContent;
      delete this.element.dataset.originalContent;
      this.bindEvents();
    }
    
    return this;
  }

  // Animation methods
  shake() {
    if (!this.options.animations) return this;
    
    this.element.style.animation = 'none';
    this.element.offsetHeight; // Trigger reflow
    this.element.style.animation = 'shake 0.5s ease-in-out';
    
    setTimeout(() => {
      this.element.style.animation = '';
    }, 500);
    
    return this;
  }

  pulse() {
    if (!this.options.animations) return this;
    
    this.element.style.animation = 'cardPulse 1s ease-in-out';
    
    setTimeout(() => {
      this.element.style.animation = '';
    }, 1000);
    
    return this;
  }

  // State management
  enable() {
    this.element.style.opacity = '';
    this.element.style.pointerEvents = '';
    return this;
  }

  disable() {
    this.element.style.opacity = '0.6';
    this.element.style.pointerEvents = 'none';
    return this;
  }

  hide() {
    this.element.style.display = 'none';
    return this;
  }

  show() {
    this.element.style.display = '';
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
        console.error('Card event callback error:', error);
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

// Card Builder for programmatic card creation
class CardBuilder {
  constructor(options = {}) {
    this.cardData = {
      type: 'basic',
      classes: ['card'],
      ...options
    };
  }

  static create(options) {
    return new CardBuilder(options);
  }

  type(type) {
    this.cardData.type = type;
    return this;
  }

  variant(variant) {
    this.cardData.classes.push(variant);
    return this;
  }

  size(size) {
    this.cardData.classes.push(size);
    return this;
  }

  clickable(clickable = true) {
    if (clickable) {
      this.cardData.classes.push('clickable');
    }
    return this;
  }

  title(title) {
    this.cardData.title = title;
    return this;
  }

  subtitle(subtitle) {
    this.cardData.subtitle = subtitle;
    return this;
  }

  text(text) {
    this.cardData.text = text;
    return this;
  }

  image(src, alt = '') {
    this.cardData.image = { src, alt };
    return this;
  }

  avatar(src, alt = '') {
    this.cardData.avatar = { src, alt };
    return this;
  }

  badge(text, variant = 'default') {
    this.cardData.badge = { text, variant };
    return this;
  }

  actions(actions) {
    this.cardData.actions = actions;
    return this;
  }

  stats(stats) {
    this.cardData.stats = stats;
    return this;
  }

  list(items) {
    this.cardData.list = items;
    return this;
  }

  footer(content) {
    this.cardData.footer = content;
    return this;
  }

  build() {
    const element = document.createElement('div');
    element.className = this.cardData.classes.join(' ');

    switch (this.cardData.type) {
      case 'profile':
        this.buildProfileCard(element);
        break;
      case 'pricing':
        this.buildPricingCard(element);
        break;
      case 'testimonial':
        this.buildTestimonialCard(element);
        break;
      case 'stats':
        this.buildStatsCard(element);
        break;
      default:
        this.buildBasicCard(element);
    }

    return element;
  }

  buildBasicCard(element) {
    let html = '';

    if (this.cardData.image) {
      html += `<img src="${this.cardData.image.src}" alt="${this.cardData.image.alt}" class="card-image">`;
    }

    if (this.cardData.badge) {
      html += `<div class="card-badge ${this.cardData.badge.variant}">${this.cardData.badge.text}</div>`;
    }

    if (this.cardData.title || this.cardData.subtitle || this.cardData.avatar) {
      html += '<div class="card-header">';
      
      if (this.cardData.avatar) {
        html += `<img src="${this.cardData.avatar.src}" alt="${this.cardData.avatar.alt}" class="card-avatar">`;
      }
      
      if (this.cardData.title || this.cardData.subtitle) {
        html += '<div class="card-meta">';
        if (this.cardData.title) {
          html += `<h3 class="card-title">${this.cardData.title}</h3>`;
        }
        if (this.cardData.subtitle) {
          html += `<p class="card-subtitle">${this.cardData.subtitle}</p>`;
        }
        html += '</div>';
      }
      
      html += '</div>';
    }

    if (this.cardData.text || this.cardData.list) {
      html += '<div class="card-body">';
      
      if (this.cardData.text) {
        html += `<p class="card-text">${this.cardData.text}</p>`;
      }
      
      if (this.cardData.list) {
        html += '<ul class="card-list">';
        this.cardData.list.forEach(item => {
          html += `<li class="card-list-item">
            ${item.icon ? `<span class="card-list-item-icon">${item.icon}</span>` : ''}
            <div class="card-list-item-content">
              <div class="card-list-item-title">${item.title}</div>
              ${item.subtitle ? `<div class="card-list-item-subtitle">${item.subtitle}</div>` : ''}
            </div>
          </li>`;
        });
        html += '</ul>';
      }
      
      html += '</div>';
    }

    if (this.cardData.actions || this.cardData.footer) {
      html += '<div class="card-footer">';
      
      if (this.cardData.actions) {
        this.cardData.actions.forEach(action => {
          html += `<button class="card-btn ${action.variant || 'primary'}" data-action="${action.action || ''}">${action.text}</button>`;
        });
      }
      
      if (this.cardData.footer) {
        html += this.cardData.footer;
      }
      
      html += '</div>';
    }

    element.innerHTML = html;
  }

  buildProfileCard(element) {
    element.classList.add('card-profile');
    
    let html = '<div class="card-body">';
    
    if (this.cardData.avatar) {
      html += `<img src="${this.cardData.avatar.src}" alt="${this.cardData.avatar.alt}" class="card-avatar">`;
    }
    
    if (this.cardData.title) {
      html += `<h3 class="card-title">${this.cardData.title}</h3>`;
    }
    
    if (this.cardData.subtitle) {
      html += `<p class="card-subtitle">${this.cardData.subtitle}</p>`;
    }
    
    if (this.cardData.text) {
      html += `<p class="card-text">${this.cardData.text}</p>`;
    }
    
    if (this.cardData.stats) {
      html += '<div class="card-stats">';
      this.cardData.stats.forEach(stat => {
        html += `<div class="card-stat">
          <div class="card-stat-value">${stat.value}</div>
          <div class="card-stat-label">${stat.label}</div>
        </div>`;
      });
      html += '</div>';
    }
    
    html += '</div>';
    
    if (this.cardData.actions) {
      html += '<div class="card-footer">';
      this.cardData.actions.forEach(action => {
        html += `<button class="card-btn ${action.variant || 'primary'}" data-action="${action.action || ''}">${action.text}</button>`;
      });
      html += '</div>';
    }
    
    element.innerHTML = html;
  }

  buildPricingCard(element) {
    element.classList.add('card-pricing');
    
    let html = '<div class="card-body">';
    
    if (this.cardData.badge) {
      html = `<div class="card-pricing-badge">${this.cardData.badge.text}</div>` + html;
      element.classList.add('featured');
    }
    
    if (this.cardData.title) {
      html += `<h3 class="card-title">${this.cardData.title}</h3>`;
    }
    
    if (this.cardData.price) {
      html += `<div class="card-pricing-price">
        $${this.cardData.price}
        ${this.cardData.period ? `<span class="card-pricing-period">/${this.cardData.period}</span>` : ''}
      </div>`;
    }
    
    if (this.cardData.text) {
      html += `<p class="card-text">${this.cardData.text}</p>`;
    }
    
    if (this.cardData.list) {
      html += '<ul class="card-list">';
      this.cardData.list.forEach(item => {
        html += `<li class="card-list-item">
          <span class="card-list-item-icon">✓</span>
          <div class="card-list-item-content">
            <div class="card-list-item-title">${item}</div>
          </div>
        </li>`;
      });
      html += '</ul>';
    }
    
    html += '</div>';
    
    if (this.cardData.actions) {
      html += '<div class="card-footer">';
      this.cardData.actions.forEach(action => {
        html += `<button class="card-btn ${action.variant || 'primary'}" data-action="${action.action || ''}">${action.text}</button>`;
      });
      html += '</div>';
    }
    
    element.innerHTML = html;
  }

  buildTestimonialCard(element) {
    element.classList.add('card-testimonial');
    
    let html = '<div class="card-body">';
    
    if (this.cardData.text) {
      html += `<p class="card-text">"${this.cardData.text}"</p>`;
    }
    
    html += '</div>';
    
    if (this.cardData.avatar || this.cardData.title || this.cardData.subtitle) {
      html += '<div class="card-footer">';
      
      if (this.cardData.avatar) {
        html += `<img src="${this.cardData.avatar.src}" alt="${this.cardData.avatar.alt}" class="card-avatar sm">`;
      }
      
      if (this.cardData.title || this.cardData.subtitle) {
        html += '<div>';
        if (this.cardData.title) {
          html += `<div class="card-title sm">${this.cardData.title}</div>`;
        }
        if (this.cardData.subtitle) {
          html += `<div class="card-subtitle">${this.cardData.subtitle}</div>`;
        }
        html += '</div>';
      }
      
      html += '</div>';
    }
    
    element.innerHTML = html;
  }

  buildStatsCard(element) {
    let html = '';
    
    if (this.cardData.title) {
      html += `<div class="card-header">
        <h3 class="card-title">${this.cardData.title}</h3>
      </div>`;
    }
    
    if (this.cardData.stats) {
      html += '<div class="card-stats">';
      this.cardData.stats.forEach(stat => {
        html += `<div class="card-stat">
          <div class="card-stat-value">${stat.value}</div>
          <div class="card-stat-label">${stat.label}</div>
          ${stat.change ? `<div class="card-stat-change ${stat.change > 0 ? 'positive' : 'negative'}">
            ${stat.change > 0 ? '+' : ''}${stat.change}%
          </div>` : ''}
        </div>`;
      });
      html += '</div>';
    }
    
    element.innerHTML = html;
  }

  // Additional pricing card configuration
  price(price, period = null) {
    this.cardData.price = price;
    if (period) this.cardData.period = period;
    return this;
  }

  featured(text = 'Popular') {
    this.cardData.badge = { text, variant: 'featured' };
    return this;
  }
}

// Card Grid Manager
class CardGrid {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = {
      columns: 'auto',
      gap: '24px',
      responsive: true,
      masonry: false,
      ...options
    };
    
    this.cards = [];
    this.init();
  }

  init() {
    if (!this.container) return;
    
    this.setupGrid();
    this.bindEvents();
  }

  setupGrid() {
    this.container.classList.add('card-grid');
    
    if (this.options.masonry) {
      this.container.classList.add('card-masonry');
    } else if (this.options.columns !== 'auto') {
      this.container.classList.add(`cols-${this.options.columns}`);
    } else {
      this.container.classList.add('auto');
    }
    
    this.container.style.gap = this.options.gap;
  }

  bindEvents() {
    if (this.options.responsive) {
      window.addEventListener('resize', () => this.handleResize());
    }
  }

  handleResize() {
    // Responsive grid adjustments can be handled here
    // Currently handled via CSS media queries
  }

  addCard(cardElement) {
    const card = new Card(cardElement);
    this.cards.push(card);
    this.container.appendChild(cardElement);
    return card;
  }

  removeCard(card) {
    const index = this.cards.indexOf(card);
    if (index > -1) {
      this.cards.splice(index, 1);
      if (card.element && card.element.parentNode) {
        card.element.parentNode.removeChild(card.element);
      }
      card.destroy();
    }
  }

  clear() {
    this.cards.forEach(card => card.destroy());
    this.cards = [];
    this.container.innerHTML = '';
  }

  getCards() {
    return this.cards;
  }

  filter(predicate) {
    this.cards.forEach(card => {
      if (predicate(card)) {
        card.show();
      } else {
        card.hide();
      }
    });
  }

  sort(compareFn) {
    const sortedCards = this.cards.slice().sort(compareFn);
    sortedCards.forEach(card => {
      this.container.appendChild(card.element);
    });
  }
}

// Add CSS animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Card, CardBuilder, CardGrid };
} else if (typeof window !== 'undefined') {
  window.Card = Card;
  window.CardBuilder = CardBuilder;
  window.CardGrid = CardGrid;
}