/**
 * Universal Navigation Components
 * Pure JavaScript navigation system with multiple types and responsive design
 * Zero dependencies, fully accessible, and customizable
 */

class Navigation {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      mobile: true,
      dropdown: true,
      sticky: false,
      autoClose: true,
      activeClass: 'active',
      ...options
    };

    this.isOpen = false;
    this.init();
  }

  init() {
    this.setupMobile();
    this.setupDropdowns();
    this.setupSticky();
    this.bindEvents();
  }

  setupMobile() {
    if (!this.options.mobile) return;

    const toggle = this.element.querySelector('.navbar-toggle');
    const mobileMenu = this.element.querySelector('.navbar-mobile');

    if (!toggle || !mobileMenu) return;

    toggle.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      mobileMenu.classList.toggle('open', this.isOpen);
      toggle.setAttribute('aria-expanded', this.isOpen);
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target) && this.isOpen) {
        this.closeMobile();
      }
    });

    // Close mobile menu on window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && this.isOpen) {
        this.closeMobile();
      }
    });
  }

  setupDropdowns() {
    if (!this.options.dropdown) return;

    const dropdownItems = this.element.querySelectorAll('.nav-item');

    dropdownItems.forEach(item => {
      const dropdown = item.querySelector('.nav-dropdown');
      if (!dropdown) return;

      const link = item.querySelector('.nav-link');
      
      // Toggle dropdown on click for mobile
      link.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          item.classList.toggle('open');
        }
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!item.contains(e.target)) {
          item.classList.remove('open');
        }
      });
    });
  }

  setupSticky() {
    if (!this.options.sticky) return;

    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 100) {
        this.element.classList.add('scrolled');
      } else {
        this.element.classList.remove('scrolled');
      }

      lastScrollY = currentScrollY;
    });
  }

  bindEvents() {
    // Handle active navigation items
    const navLinks = this.element.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // Skip if it's a dropdown trigger or external link
        if (!href || href === '#' || href.startsWith('http')) {
          return;
        }

        // Update active state
        this.setActive(link);
        
        // Close mobile menu if open
        if (this.isOpen && this.options.autoClose) {
          this.closeMobile();
        }
      });
    });
  }

  setActive(activeLink) {
    const navLinks = this.element.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove(this.options.activeClass));
    activeLink.classList.add(this.options.activeClass);
  }

  closeMobile() {
    this.isOpen = false;
    const mobileMenu = this.element.querySelector('.navbar-mobile');
    const toggle = this.element.querySelector('.navbar-toggle');
    
    if (mobileMenu) mobileMenu.classList.remove('open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  open() {
    if (!this.isOpen) {
      const toggle = this.element.querySelector('.navbar-toggle');
      if (toggle) toggle.click();
    }
  }

  close() {
    if (this.isOpen) {
      this.closeMobile();
    }
  }
}

class Sidebar {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      collapsible: true,
      overlay: true,
      swipe: true,
      activeClass: 'active',
      ...options
    };

    this.isOpen = false;
    this.isCollapsed = false;
    this.init();
  }

  init() {
    this.setupToggle();
    this.setupOverlay();
    this.setupSwipe();
    this.bindEvents();
  }

  setupToggle() {
    const toggles = document.querySelectorAll('[data-sidebar-toggle]');
    
    toggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        this.toggle();
      });
    });

    // Collapse toggle
    const collapseToggle = this.element.querySelector('.sidebar-collapse');
    if (collapseToggle && this.options.collapsible) {
      collapseToggle.addEventListener('click', () => {
        this.toggleCollapse();
      });
    }
  }

  setupOverlay() {
    if (!this.options.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.className = 'sidebar-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 998;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    `;

    this.overlay.addEventListener('click', () => {
      this.close();
    });

    document.body.appendChild(this.overlay);
  }

  setupSwipe() {
    if (!this.options.swipe) return;

    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      currentX = e.touches[0].clientX;
      
      const diffX = currentX - startX;
      
      if (this.isOpen && diffX < -50) {
        this.close();
        isDragging = false;
      } else if (!this.isOpen && startX < 50 && diffX > 50) {
        this.open();
        isDragging = false;
      }
    });

    document.addEventListener('touchend', () => {
      isDragging = false;
    });
  }

  bindEvents() {
    const sidebarLinks = this.element.querySelectorAll('.sidebar-item');
    
    sidebarLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        if (!href || href === '#') {
          return;
        }

        this.setActive(link);
        
        // Close sidebar on mobile after navigation
        if (window.innerWidth <= 768) {
          this.close();
        }
      });
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        this.element.classList.remove('open');
        this.isOpen = false;
        if (this.overlay) {
          this.overlay.style.opacity = '0';
          this.overlay.style.visibility = 'hidden';
        }
      }
    });
  }

  setActive(activeLink) {
    const sidebarLinks = this.element.querySelectorAll('.sidebar-item');
    sidebarLinks.forEach(link => link.classList.remove(this.options.activeClass));
    activeLink.classList.add(this.options.activeClass);
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.element.classList.add('open');
    
    if (this.overlay) {
      this.overlay.style.opacity = '1';
      this.overlay.style.visibility = 'visible';
    }

    document.body.style.overflow = 'hidden';
    this.trigger('open');
  }

  close() {
    this.isOpen = false;
    this.element.classList.remove('open');
    
    if (this.overlay) {
      this.overlay.style.opacity = '0';
      this.overlay.style.visibility = 'hidden';
    }

    document.body.style.overflow = '';
    this.trigger('close');
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.element.classList.toggle('collapsed', this.isCollapsed);
    this.trigger(this.isCollapsed ? 'collapse' : 'expand');
  }

  trigger(eventName) {
    const event = new CustomEvent(`sidebar:${eventName}`, {
      detail: { sidebar: this }
    });
    document.dispatchEvent(event);
  }
}

class Tabs {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      activeClass: 'active',
      fade: true,
      ...options
    };

    this.currentTab = 0;
    this.init();
  }

  init() {
    this.tabLinks = this.element.querySelectorAll('.tab-link');
    this.tabPanes = this.element.querySelectorAll('.tab-pane');
    
    this.bindEvents();
    this.showTab(this.getCurrentActiveIndex());
  }

  getCurrentActiveIndex() {
    const activeTab = this.element.querySelector('.tab-link.active');
    return activeTab ? Array.from(this.tabLinks).indexOf(activeTab) : 0;
  }

  bindEvents() {
    this.tabLinks.forEach((link, index) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.showTab(index);
      });
    });

    // Keyboard navigation
    this.element.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const direction = e.key === 'ArrowLeft' ? -1 : 1;
        const newIndex = (this.currentTab + direction + this.tabLinks.length) % this.tabLinks.length;
        this.showTab(newIndex);
        this.tabLinks[newIndex].focus();
      }
    });
  }

  showTab(index) {
    if (index < 0 || index >= this.tabLinks.length) return;

    // Update active states
    this.tabLinks.forEach(link => link.classList.remove(this.options.activeClass));
    this.tabPanes.forEach(pane => pane.classList.remove(this.options.activeClass));

    this.tabLinks[index].classList.add(this.options.activeClass);
    this.tabPanes[index].classList.add(this.options.activeClass);

    this.currentTab = index;
    
    // Trigger event
    this.trigger('change', { index, tab: this.tabLinks[index], pane: this.tabPanes[index] });
  }

  next() {
    const nextIndex = (this.currentTab + 1) % this.tabLinks.length;
    this.showTab(nextIndex);
  }

  previous() {
    const prevIndex = (this.currentTab - 1 + this.tabLinks.length) % this.tabLinks.length;
    this.showTab(prevIndex);
  }

  trigger(eventName, detail = {}) {
    const event = new CustomEvent(`tabs:${eventName}`, {
      detail: { tabs: this, ...detail }
    });
    document.dispatchEvent(event);
  }
}

class Pagination {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      totalPages: 1,
      currentPage: 1,
      maxVisible: 7,
      showFirstLast: true,
      showPrevNext: true,
      showInfo: true,
      itemsPerPage: 10,
      totalItems: 0,
      ...options
    };

    this.currentPage = this.options.currentPage;
    this.totalPages = this.options.totalPages;
    
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
  }

  render() {
    let html = '';

    if (this.options.showInfo && this.options.totalItems) {
      const start = (this.currentPage - 1) * this.options.itemsPerPage + 1;
      const end = Math.min(this.currentPage * this.options.itemsPerPage, this.options.totalItems);
      
      html += `<div class="page-info">Showing ${start}-${end} of ${this.options.totalItems} items</div>`;
    }

    html += '<ul class="pagination">';

    // Previous button
    if (this.options.showPrevNext) {
      const disabled = this.currentPage === 1 ? 'disabled' : '';
      html += `
        <li class="page-item ${disabled}">
          <a class="page-link" href="#" data-page="${this.currentPage - 1}">‹</a>
        </li>
      `;
    }

    // First page
    if (this.options.showFirstLast && this.currentPage > Math.ceil(this.options.maxVisible / 2)) {
      html += `
        <li class="page-item">
          <a class="page-link" href="#" data-page="1">1</a>
        </li>
      `;
      
      if (this.currentPage > Math.ceil(this.options.maxVisible / 2) + 1) {
        html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
    }

    // Page numbers
    const start = Math.max(1, this.currentPage - Math.floor(this.options.maxVisible / 2));
    const end = Math.min(this.totalPages, start + this.options.maxVisible - 1);

    for (let i = start; i <= end; i++) {
      const active = i === this.currentPage ? 'active' : '';
      html += `
        <li class="page-item ${active}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `;
    }

    // Last page
    if (this.options.showFirstLast && this.currentPage < this.totalPages - Math.floor(this.options.maxVisible / 2)) {
      if (this.currentPage < this.totalPages - Math.floor(this.options.maxVisible / 2) - 1) {
        html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
      
      html += `
        <li class="page-item">
          <a class="page-link" href="#" data-page="${this.totalPages}">${this.totalPages}</a>
        </li>
      `;
    }

    // Next button
    if (this.options.showPrevNext) {
      const disabled = this.currentPage === this.totalPages ? 'disabled' : '';
      html += `
        <li class="page-item ${disabled}">
          <a class="page-link" href="#" data-page="${this.currentPage + 1}">›</a>
        </li>
      `;
    }

    html += '</ul>';
    this.element.innerHTML = html;
  }

  bindEvents() {
    this.element.addEventListener('click', (e) => {
      e.preventDefault();
      
      if (e.target.matches('.page-link') && !e.target.closest('.disabled')) {
        const page = parseInt(e.target.dataset.page);
        if (page && page !== this.currentPage) {
          this.goToPage(page);
        }
      }
    });
  }

  goToPage(page) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.render();
    
    this.trigger('change', { page: this.currentPage });
  }

  setTotalPages(totalPages) {
    this.totalPages = totalPages;
    this.render();
  }

  setCurrentPage(page) {
    this.goToPage(page);
  }

  trigger(eventName, detail = {}) {
    const event = new CustomEvent(`pagination:${eventName}`, {
      detail: { pagination: this, ...detail }
    });
    document.dispatchEvent(event);
  }
}

// Auto-initialize components
document.addEventListener('DOMContentLoaded', () => {
  // Initialize navigation
  document.querySelectorAll('.navbar').forEach(navbar => {
    new Navigation(navbar);
  });

  // Initialize sidebars
  document.querySelectorAll('.sidebar').forEach(sidebar => {
    new Sidebar(sidebar);
  });

  // Initialize tabs
  document.querySelectorAll('.tabs').forEach(tabs => {
    new Tabs(tabs);
  });

  // Initialize pagination
  document.querySelectorAll('[data-pagination]').forEach(element => {
    const options = JSON.parse(element.dataset.pagination || '{}');
    new Pagination(element, options);
  });
});

// Handle smooth scrolling for anchor links
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;

  const href = link.getAttribute('href');
  if (href === '#') return;

  const target = document.querySelector(href);
  if (target) {
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
  }
});

// Export classes
window.Navigation = Navigation;
window.Sidebar = Sidebar;
window.Tabs = Tabs;
window.Pagination = Pagination;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Navigation, Sidebar, Tabs, Pagination };
}