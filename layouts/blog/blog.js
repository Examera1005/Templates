class BlogManager {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.setupTheme();
        this.setupSearch();
        this.setupFilters();
        this.setupAnimations();
    }

    init() {
        // Navigation elements
        this.navToggle = document.getElementById('nav-toggle');
        this.navMenu = document.getElementById('nav-menu');
        this.themeToggle = document.getElementById('theme-toggle');
        
        // Search elements
        this.searchInput = document.querySelector('.search-input');
        this.searchBtn = document.querySelector('.search-btn');
        
        // Filter elements
        this.filterTabs = document.querySelectorAll('.filter-tab');
        this.articleCards = document.querySelectorAll('.article-card');
        this.articlesGrid = document.getElementById('articles-grid');
        
        // Load more button
        this.loadMoreBtn = document.getElementById('load-more');
        
        // Newsletter form
        this.newsletterForm = document.querySelector('.newsletter-form');
        
        // Article data for dynamic loading
        this.allArticles = this.getArticleData();
        this.displayedArticles = 6; // Initial number of articles shown
        this.currentFilter = 'all';
        this.searchQuery = '';
        
        // Theme preference
        this.currentTheme = localStorage.getItem('blog-theme') || 'light';
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

        // Theme toggle
        this.themeToggle?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Search functionality
        this.searchInput?.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        this.searchBtn?.addEventListener('click', () => {
            this.performSearch();
        });

        this.searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Filter tabs
        this.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.handleFilter(tab.dataset.filter);
            });
        });

        // Load more articles
        this.loadMoreBtn?.addEventListener('click', () => {
            this.loadMoreArticles();
        });

        // Newsletter form
        this.newsletterForm?.addEventListener('submit', (e) => {
            this.handleNewsletterSubmit(e);
        });

        // Article interactions
        this.setupArticleInteractions();

        // Scroll events
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });

        // Resize events
        window.addEventListener('resize', () => {
            this.handleResize();
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

    setupTheme() {
        // Apply saved theme
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateThemeIcon();
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('blog-theme', this.currentTheme);
        this.updateThemeIcon();
        
        this.showNotification(
            `Switched to ${this.currentTheme} theme`,
            'info'
        );
    }

    updateThemeIcon() {
        const icon = this.themeToggle?.querySelector('i');
        if (icon) {
            icon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    setupSearch() {
        // Setup search functionality
        this.searchDebounced = this.debounce((query) => {
            this.searchQuery = query.toLowerCase();
            this.filterArticles();
        }, 300);
    }

    handleSearch(query) {
        this.searchDebounced(query);
    }

    performSearch() {
        const query = this.searchInput?.value || '';
        this.handleSearch(query);
        
        if (query) {
            this.trackEvent('search_performed', { query });
        }
    }

    setupFilters() {
        // Initialize filter system
        this.filterArticles();
    }

    handleFilter(filter) {
        // Update active filter tab
        this.filterTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.filter === filter) {
                tab.classList.add('active');
            }
        });
        
        this.currentFilter = filter;
        this.filterArticles();
        
        this.trackEvent('filter_applied', { filter });
    }

    filterArticles() {
        let visibleCount = 0;
        
        this.articleCards.forEach(card => {
            const category = card.dataset.category;
            const title = card.querySelector('.article-title a')?.textContent.toLowerCase() || '';
            const excerpt = card.querySelector('.article-excerpt')?.textContent.toLowerCase() || '';
            
            const matchesFilter = this.currentFilter === 'all' || category === this.currentFilter;
            const matchesSearch = !this.searchQuery || 
                title.includes(this.searchQuery) || 
                excerpt.includes(this.searchQuery);
            
            if (matchesFilter && matchesSearch) {
                card.classList.remove('hidden');
                card.style.animationDelay = `${visibleCount * 0.1}s`;
                card.classList.add('fade-in-up');
                visibleCount++;
            } else {
                card.classList.add('hidden');
            }
        });
        
        // Show/hide load more button
        this.updateLoadMoreButton(visibleCount);
    }

    updateLoadMoreButton(visibleCount) {
        const totalAvailable = this.allArticles.filter(article => {
            const matchesFilter = this.currentFilter === 'all' || article.category === this.currentFilter;
            const matchesSearch = !this.searchQuery || 
                article.title.toLowerCase().includes(this.searchQuery) ||
                article.excerpt.toLowerCase().includes(this.searchQuery);
            return matchesFilter && matchesSearch;
        }).length;
        
        if (this.loadMoreBtn) {
            if (visibleCount >= totalAvailable) {
                this.loadMoreBtn.style.display = 'none';
            } else {
                this.loadMoreBtn.style.display = 'inline-flex';
            }
        }
    }

    loadMoreArticles() {
        // Simulate loading more articles
        this.loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        
        setTimeout(() => {
            this.addMoreArticles();
            this.loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Load More Articles';
        }, 1000);
    }

    addMoreArticles() {
        const articlesPerLoad = 3;
        const startIndex = this.displayedArticles;
        const endIndex = Math.min(startIndex + articlesPerLoad, this.allArticles.length);
        
        for (let i = startIndex; i < endIndex; i++) {
            const article = this.allArticles[i];
            if (article) {
                this.createArticleCard(article);
            }
        }
        
        this.displayedArticles = endIndex;
        
        // Update filter after adding new articles
        this.filterArticles();
        
        this.showNotification('More articles loaded!', 'success');
    }

    createArticleCard(article) {
        const articleCard = document.createElement('article');
        articleCard.className = 'article-card';
        articleCard.dataset.category = article.category;
        
        articleCard.innerHTML = `
            <div class="article-image">
                <img src="${article.image}" alt="${article.title}">
                <div class="article-category">${article.category}</div>
            </div>
            <div class="article-content">
                <div class="article-meta">
                    <div class="author-info">
                        <img src="${article.authorAvatar}" alt="${article.author}" class="author-avatar">
                        <span class="author-name">${article.author}</span>
                    </div>
                    <time class="article-date">${article.date}</time>
                </div>
                <h3 class="article-title">
                    <a href="#">${article.title}</a>
                </h3>
                <p class="article-excerpt">${article.excerpt}</p>
                <div class="article-footer">
                    <div class="article-tags">
                        ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <span class="read-time">${article.readTime}</span>
                </div>
            </div>
        `;
        
        this.articlesGrid?.appendChild(articleCard);
        
        // Add event listeners to new article
        this.setupArticleCardInteractions(articleCard);
    }

    setupArticleInteractions() {
        // Add interactions to existing articles
        this.articleCards.forEach(card => {
            this.setupArticleCardInteractions(card);
        });
        
        // Popular articles clicks
        document.querySelectorAll('.popular-article a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.trackEvent('popular_article_click', { 
                    title: link.textContent.trim() 
                });
                this.showNotification('Article would open here', 'info');
            });
        });
        
        // Tag clicks
        document.querySelectorAll('.tag, .tag-cloud').forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.preventDefault();
                const tagText = tag.textContent.trim();
                this.searchInput.value = tagText;
                this.handleSearch(tagText);
                this.trackEvent('tag_click', { tag: tagText });
            });
        });
    }

    setupArticleCardInteractions(card) {
        // Article click tracking
        const titleLink = card.querySelector('.article-title a');
        titleLink?.addEventListener('click', (e) => {
            e.preventDefault();
            const title = titleLink.textContent.trim();
            this.trackEvent('article_click', { title });
            this.showNotification('Article would open here', 'info');
        });
        
        // Tag clicks within this card
        card.querySelectorAll('.tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.preventDefault();
                const tagText = tag.textContent.trim();
                this.searchInput.value = tagText;
                this.handleSearch(tagText);
                this.trackEvent('tag_click', { tag: tagText });
            });
        });
    }

    handleNewsletterSubmit(e) {
        e.preventDefault();
        
        const emailInput = e.target.querySelector('input[type="email"]');
        const email = emailInput?.value;
        
        if (email) {
            // Simulate newsletter signup
            const submitBtn = e.target.querySelector('button');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                this.showNotification('Successfully subscribed to newsletter!', 'success');
                emailInput.value = '';
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                this.trackEvent('newsletter_signup', { email });
            }, 1500);
        }
    }

    setupAnimations() {
        // Setup intersection observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                }
            });
        }, observerOptions);
        
        // Observe article cards
        this.articleCards.forEach(card => {
            this.observer.observe(card);
        });
        
        // Observe widgets
        document.querySelectorAll('.widget').forEach(widget => {
            this.observer.observe(widget);
        });
    }

    handleScroll() {
        // Update header background on scroll
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header?.classList.add('scrolled');
        } else {
            header?.classList.remove('scrolled');
        }
        
        // Reading progress indicator (if desired)
        this.updateReadingProgress();
    }

    updateReadingProgress() {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        
        // You could update a progress bar here
        // progressBar.style.width = scrolled + "%";
    }

    handleResize() {
        // Close mobile menu on resize to desktop
        if (window.innerWidth > 768) {
            this.closeMobileMenu();
        }
    }

    getArticleData() {
        // Sample article data for dynamic loading
        return [
            {
                title: "Advanced React Patterns for 2024",
                excerpt: "Explore the latest React patterns that will improve your development workflow.",
                category: "development",
                author: "Alex Johnson",
                authorAvatar: "https://picsum.photos/32/32?random=30",
                date: "February 28, 2024",
                readTime: "8 min read",
                image: "https://picsum.photos/400/250?random=30",
                tags: ["React", "JavaScript"]
            },
            {
                title: "The Future of Web Design",
                excerpt: "Discover upcoming trends that will shape web design in the coming years.",
                category: "design",
                author: "Maria Garcia",
                authorAvatar: "https://picsum.photos/32/32?random=31",
                date: "February 25, 2024",
                readTime: "6 min read",
                image: "https://picsum.photos/400/250?random=31",
                tags: ["Design", "Trends"]
            },
            {
                title: "Building Scalable APIs with Node.js",
                excerpt: "Learn best practices for creating robust and scalable API services.",
                category: "development",
                author: "James Wilson",
                authorAvatar: "https://picsum.photos/32/32?random=32",
                date: "February 22, 2024",
                readTime: "12 min read",
                image: "https://picsum.photos/400/250?random=32",
                tags: ["Node.js", "API"]
            }
        ];
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
            background: var(--bg-primary);
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
                <span style="flex: 1; color: var(--text-primary);">${message}</span>
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
        
        // You could integrate with analytics services here
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

    // Reading time calculator
    calculateReadingTime(text) {
        const wordsPerMinute = 200;
        const words = text.trim().split(/\s+/).length;
        const readingTime = Math.ceil(words / wordsPerMinute);
        return `${readingTime} min read`;
    }

    // Format date
    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    }

    // Social sharing
    shareArticle(title, url) {
        if (navigator.share) {
            navigator.share({
                title: title,
                url: url
            });
        } else {
            // Fallback to copy to clipboard
            navigator.clipboard.writeText(url);
            this.showNotification('Link copied to clipboard!', 'success');
        }
    }
}

// Initialize blog when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.blogManager = new BlogManager();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlogManager;
}