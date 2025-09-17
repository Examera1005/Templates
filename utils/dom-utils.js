// DOM Utilities
class DOMUtils {
    // Element selection and manipulation
    static $(selector, context = document) {
        return context.querySelector(selector);
    }

    static $$(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    }

    static create(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, value);
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else {
                element[key] = value;
            }
        });

        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });

        return element;
    }

    static remove(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    static empty(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    // Class manipulation
    static addClass(element, className) {
        if (element) {
            element.classList.add(className);
        }
    }

    static removeClass(element, className) {
        if (element) {
            element.classList.remove(className);
        }
    }

    static toggleClass(element, className) {
        if (element) {
            element.classList.toggle(className);
        }
    }

    static hasClass(element, className) {
        return element ? element.classList.contains(className) : false;
    }

    // Event handling
    static on(element, event, handler, options = {}) {
        if (element) {
            element.addEventListener(event, handler, options);
        }
    }

    static off(element, event, handler) {
        if (element) {
            element.removeEventListener(event, handler);
        }
    }

    static once(element, event, handler) {
        if (element) {
            element.addEventListener(event, handler, { once: true });
        }
    }

    static delegate(parent, selector, event, handler) {
        if (parent) {
            parent.addEventListener(event, (e) => {
                if (e.target.matches(selector)) {
                    handler.call(e.target, e);
                }
            });
        }
    }

    // Position and dimensions
    static getOffset(element) {
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top + window.pageYOffset,
            left: rect.left + window.pageXOffset,
            width: rect.width,
            height: rect.height
        };
    }

    static getViewportSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }

    static isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
        );
    }

    static scrollTo(element, options = {}) {
        const {
            behavior = 'smooth',
            block = 'start',
            inline = 'nearest'
        } = options;

        element.scrollIntoView({ behavior, block, inline });
    }

    // Animation helpers
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const start = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    static fadeOut(element, duration = 300) {
        const start = performance.now();
        const initialOpacity = parseFloat(getComputedStyle(element).opacity);
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = initialOpacity * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        };
        
        requestAnimationFrame(animate);
    }

    static slideUp(element, duration = 300) {
        const height = element.offsetHeight;
        element.style.overflow = 'hidden';
        element.style.transition = `height ${duration}ms ease`;
        element.style.height = height + 'px';
        
        requestAnimationFrame(() => {
            element.style.height = '0px';
            setTimeout(() => {
                element.style.display = 'none';
                element.style.height = '';
                element.style.overflow = '';
                element.style.transition = '';
            }, duration);
        });
    }

    static slideDown(element, duration = 300) {
        element.style.display = 'block';
        const height = element.scrollHeight;
        element.style.overflow = 'hidden';
        element.style.height = '0px';
        element.style.transition = `height ${duration}ms ease`;
        
        requestAnimationFrame(() => {
            element.style.height = height + 'px';
            setTimeout(() => {
                element.style.height = '';
                element.style.overflow = '';
                element.style.transition = '';
            }, duration);
        });
    }

    // Form utilities
    static getFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            if (data[key]) {
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        return data;
    }

    static setFormData(form, data) {
        Object.entries(data).forEach(([key, value]) => {
            const element = form.querySelector(`[name="${key}"]`);
            if (element) {
                if (element.type === 'checkbox' || element.type === 'radio') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        });
    }

    static clearForm(form) {
        const elements = form.querySelectorAll('input, select, textarea');
        elements.forEach(element => {
            if (element.type === 'checkbox' || element.type === 'radio') {
                element.checked = false;
            } else {
                element.value = '';
            }
        });
    }

    // Storage helpers
    static ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    // Debounce and throttle for DOM events
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DOMUtils;
}