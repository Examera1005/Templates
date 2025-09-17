class LandingPageManager {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.setupAnimations();
        this.setupPricingToggle();
    }

    init() {
        // Navigation elements
        this.navbar = document.getElementById('navbar');
        this.navToggle = document.getElementById('nav-toggle');
        this.navMenu = document.getElementById('nav-menu');
        
        // Pricing toggle
        this.pricingToggle = document.getElementById('pricing-toggle');
        this.priceAmounts = document.querySelectorAll('.amount');
        
        // Scroll position
        this.lastScrollY = window.scrollY;
        
        // Animation observers
        this.observedElements = new Set();
        this.setupIntersectionObserver();
    }

    setupEventListeners() {
        // Mobile navigation toggle
        this.navToggle?.addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Close mobile menu when clicking on links
        this.navMenu?.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                this.handleSmoothScroll(e, link);
            });
        });

        // Scroll events
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });

        // Resize events
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Video play button
        document.querySelectorAll('.play-button').forEach(button => {
            button.addEventListener('click', () => {
                this.handleVideoPlay(button);
            });
        });

        // CTA buttons
        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleCTAClick(e, button);
            });
        });

        // Feature cards hover
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                this.animateFeatureCard(card, true);
            });
            card.addEventListener('mouseleave', () => {
                this.animateFeatureCard(card, false);
            });
        });
    }

    toggleMobileMenu() {
        this.navMenu?.classList.toggle('active');
        this.navToggle?.classList.toggle('active');
        
        // Toggle body scroll
        document.body.style.overflow = 
            this.navMenu?.classList.contains('active') ? 'hidden' : '';
    }

    closeMobileMenu() {
        this.navMenu?.classList.remove('active');
        this.navToggle?.classList.remove('active');
        document.body.style.overflow = '';
    }

    handleSmoothScroll(e, link) {
        const href = link.getAttribute('href');
        
        if (href.startsWith('#')) {
            e.preventDefault();
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Account for navbar height
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // Update active nav link
                this.updateActiveNavLink(targetId);
            }
        }
    }

    updateActiveNavLink(activeId) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${activeId}`) {
                link.classList.add('active');
            }
        });
    }

    handleScroll() {
        const currentScrollY = window.scrollY;
        
        // Update navbar appearance
        if (currentScrollY > 50) {
            this.navbar?.classList.add('scrolled');
        } else {
            this.navbar?.classList.remove('scrolled');
        }
        
        // Update active section
        this.updateActiveSection();
        
        this.lastScrollY = currentScrollY;
    }

    updateActiveSection() {
        const sections = ['home', 'features', 'pricing'];
        const scrollPosition = window.scrollY + 100;
        
        for (const sectionId of sections) {
            const section = document.getElementById(sectionId);
            if (section) {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    this.updateActiveNavLink(sectionId);
                    break;
                }
            }
        }
    }

    handleResize() {
        // Close mobile menu on resize to desktop
        if (window.innerWidth > 768) {
            this.closeMobileMenu();
        }
    }

    setupPricingToggle() {
        this.pricingToggle?.addEventListener('change', () => {
            this.togglePricing();
        });
    }

    togglePricing() {
        const isAnnual = this.pricingToggle?.checked;
        
        this.priceAmounts.forEach(amount => {
            const monthly = amount.getAttribute('data-monthly');
            const annual = amount.getAttribute('data-annual');
            
            if (monthly && annual) {
                // Animate the price change
                amount.style.transform = 'scale(0.8)';
                amount.style.opacity = '0.5';
                
                setTimeout(() => {
                    amount.textContent = isAnnual ? annual : monthly;
                    amount.style.transform = 'scale(1)';
                    amount.style.opacity = '1';
                }, 150);
            }
        });
        
        // Show notification
        this.showNotification(
            isAnnual ? 'Switched to annual pricing (20% savings!)' : 'Switched to monthly pricing',
            'info'
        );
    }

    setupAnimations() {
        // Hero floating animation
        this.animateHeroElements();
        
        // Stats counter animation
        this.setupStatsAnimation();
        
        // Parallax effects
        this.setupParallax();
    }

    animateHeroElements() {
        const heroShapes = document.querySelectorAll('.shape');
        
        heroShapes.forEach((shape, index) => {
            const delay = index * 1000;
            const duration = 4000 + (index * 1000);
            
            setInterval(() => {
                shape.style.transform = `translateY(-20px) rotate(${Math.random() * 360}deg)`;
                
                setTimeout(() => {
                    shape.style.transform = `translateY(0px) rotate(0deg)`;
                }, duration / 2);
            }, duration);
        });
    }

    setupStatsAnimation() {
        const stats = document.querySelectorAll('.stat h3');
        
        stats.forEach(stat => {
            const finalValue = stat.textContent;
            const isPercentage = finalValue.includes('%');
            const numericValue = parseFloat(finalValue.replace(/[^\d.]/g, ''));
            
            this.observedElements.add({
                element: stat,
                animation: () => this.animateCounter(stat, 0, numericValue, isPercentage, finalValue)
            });
        });
    }

    animateCounter(element, start, end, isPercentage, originalText) {
        const duration = 2000;
        const increment = (end - start) / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            
            if (current >= end) {
                current = end;
                clearInterval(timer);
            }
            
            if (isPercentage) {
                element.textContent = `${current.toFixed(1)}%`;
            } else if (originalText.includes('K')) {
                element.textContent = `${Math.floor(current / 1000)}K+`;
            } else {
                element.textContent = originalText;
            }
        }, 16);
    }

    setupParallax() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.hero-shapes');
            
            parallaxElements.forEach(element => {
                const speed = 0.5;
                element.style.transform = `translateY(${scrolled * speed}px)`;
            });
        });
    }

    setupIntersectionObserver() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    
                    // Trigger custom animations
                    this.observedElements.forEach(item => {
                        if (item.element === entry.target && item.animation) {
                            item.animation();
                        }
                    });
                }
            });
        }, options);
        
        // Observe elements for animation
        document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card, .stat').forEach(el => {
            this.observer.observe(el);
        });
    }

    animateFeatureCard(card, isHover) {
        const icon = card.querySelector('.feature-icon');
        
        if (isHover) {
            icon.style.transform = 'scale(1.1) rotate(5deg)';
            card.style.borderColor = 'var(--primary-color)';
        } else {
            icon.style.transform = 'scale(1) rotate(0deg)';
            card.style.borderColor = 'var(--border-color)';
        }
    }

    handleVideoPlay(button) {
        // Simulate video play
        const videoContainer = button.closest('.video-container');
        
        // Add loading animation
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        setTimeout(() => {
            this.showNotification('Demo video would start playing here', 'info');
            button.innerHTML = '<i class="fas fa-play"></i>';
        }, 1000);
        
        // Track video play event
        this.trackEvent('video_play', { location: 'demo_section' });
    }

    handleCTAClick(e, button) {
        const buttonText = button.textContent.trim();
        
        // Add click animation
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
        
        // Handle different CTA types
        if (buttonText.includes('Start Free Trial') || buttonText.includes('Get Started')) {
            this.handleSignup(e, button);
        } else if (buttonText.includes('Contact Sales') || buttonText.includes('Talk to Sales')) {
            this.handleContactSales(e, button);
        } else if (buttonText.includes('Watch Demo')) {
            this.handleDemoRequest(e, button);
        }
        
        // Track CTA click
        this.trackEvent('cta_click', { 
            button_text: buttonText,
            location: this.getCurrentSection()
        });
    }

    handleSignup(e, button) {
        e.preventDefault();
        
        // Show signup flow
        this.showNotification('Redirecting to signup...', 'success');
        
        // Simulate signup redirect
        setTimeout(() => {
            console.log('Would redirect to signup page');
        }, 1000);
    }

    handleContactSales(e, button) {
        e.preventDefault();
        
        // Show contact form or redirect
        this.showNotification('Opening contact form...', 'info');
        
        // You could open a modal here
        setTimeout(() => {
            console.log('Would open contact sales form');
        }, 500);
    }

    handleDemoRequest(e, button) {
        e.preventDefault();
        
        // Show demo booking
        this.showNotification('Opening demo booking...', 'info');
        
        setTimeout(() => {
            console.log('Would open demo booking calendar');
        }, 500);
    }

    getCurrentSection() {
        const scrollPosition = window.scrollY + 100;
        const sections = [
            { id: 'home', element: document.getElementById('home') },
            { id: 'features', element: document.getElementById('features') },
            { id: 'pricing', element: document.getElementById('pricing') }
        ];
        
        for (const section of sections) {
            if (section.element) {
                const sectionTop = section.element.offsetTop;
                const sectionHeight = section.element.offsetHeight;
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    return section.id;
                }
            }
        }
        
        return 'unknown';
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 16px 20px;
            background: white;
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius-lg);
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            max-width: 350px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            font-size: 14px;
        `;
        
        // Set notification color based on type
        const colors = {
            success: 'var(--success-color)',
            error: 'var(--error-color)',
            warning: 'var(--warning-color)',
            info: 'var(--primary-color)'
        };
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 4px; height: 24px; background: ${colors[type]}; border-radius: 2px; flex-shrink: 0;"></div>
                <span style="flex: 1;">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; cursor: pointer; padding: 4px; color: var(--text-secondary);">
                    <i class="fas fa-times" style="font-size: 12px;"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 4000);
    }

    trackEvent(eventName, properties = {}) {
        // Analytics tracking
        console.log('Event tracked:', eventName, properties);
        
        // You could integrate with analytics services like:
        // - Google Analytics
        // - Mixpanel
        // - Amplitude
        // - Custom analytics
        
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, properties);
        }
    }

    // Utility methods
    debounce(func, wait) {
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

    throttle(func, limit) {
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

    // Performance monitoring
    measurePerformance() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                this.trackEvent('page_load_time', { load_time: loadTime });
            });
        }
    }

    // A/B testing helper
    getVariant(testName, variants) {
        const userId = this.getUserId();
        const hash = this.hashCode(userId + testName);
        const variantIndex = Math.abs(hash) % variants.length;
        return variants[variantIndex];
    }

    getUserId() {
        let userId = localStorage.getItem('user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('user_id', userId);
        }
        return userId;
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }
}

// Initialize landing page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.landingPageManager = new LandingPageManager();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        animation: slideInUp 0.6s ease-out forwards;
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .feature-card, .pricing-card, .testimonial-card {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease-out;
    }
    
    .feature-icon {
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(style);

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LandingPageManager;
}