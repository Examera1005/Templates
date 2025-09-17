class DashboardManager {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.setupChart();
        this.startRealTimeUpdates();
    }

    init() {
        // Mobile toggle functionality
        this.mobileToggle = document.getElementById('mobile-toggle');
        this.sidebar = document.getElementById('sidebar');
        this.mobileOverlay = document.getElementById('mobile-overlay');
        
        // User dropdown
        this.userMenu = document.getElementById('user-menu');
        this.userDropdown = document.getElementById('user-dropdown');
        
        // Task management
        this.taskCheckboxes = document.querySelectorAll('.task-checkbox');
        
        // Activity data
        this.activities = [];
        this.stats = {
            users: 2847,
            revenue: 24750,
            orders: 1234,
            uptime: 98.5
        };
    }

    setupEventListeners() {
        // Mobile toggle
        this.mobileToggle?.addEventListener('click', () => {
            this.toggleMobileSidebar();
        });

        // Mobile overlay
        this.mobileOverlay?.addEventListener('click', () => {
            this.closeMobileSidebar();
        });

        // User dropdown
        this.userMenu?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleUserDropdown();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            this.closeUserDropdown();
        });

        // Task checkboxes
        this.taskCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.handleTaskToggle(e.target);
            });
        });

        // Quick action cards
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', () => {
                this.handleQuickAction(card);
            });
        });

        // Sidebar navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleNavigation(e, item);
            });
        });

        // Search functionality
        const searchInput = document.querySelector('.search-input');
        searchInput?.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Window resize handler
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    toggleMobileSidebar() {
        this.sidebar?.classList.toggle('active');
        this.mobileOverlay?.classList.toggle('active');
        document.body.style.overflow = this.sidebar?.classList.contains('active') ? 'hidden' : '';
    }

    closeMobileSidebar() {
        this.sidebar?.classList.remove('active');
        this.mobileOverlay?.classList.remove('active');
        document.body.style.overflow = '';
    }

    toggleUserDropdown() {
        const dropdown = this.userMenu?.closest('.dropdown');
        dropdown?.classList.toggle('active');
    }

    closeUserDropdown() {
        const dropdown = this.userMenu?.closest('.dropdown');
        dropdown?.classList.remove('active');
    }

    handleTaskToggle(checkbox) {
        const taskContent = checkbox.nextElementSibling;
        const taskItem = checkbox.closest('.task-item');
        
        if (checkbox.checked) {
            taskContent.classList.add('completed');
            taskItem.style.opacity = '0.7';
            this.showNotification('Task completed!', 'success');
        } else {
            taskContent.classList.remove('completed');
            taskItem.style.opacity = '1';
            this.showNotification('Task reopened', 'info');
        }
        
        this.updateTaskProgress();
    }

    updateTaskProgress() {
        const total = this.taskCheckboxes.length;
        const completed = document.querySelectorAll('.task-checkbox:checked').length;
        const percentage = (completed / total) * 100;
        
        // You could update a progress bar here
        console.log(`Task progress: ${completed}/${total} (${percentage.toFixed(1)}%)`);
    }

    handleQuickAction(card) {
        const actionType = card.querySelector('h4').textContent;
        this.showNotification(`Opening ${actionType}...`, 'info');
        
        // Add click animation
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);
        
        // Simulate action
        setTimeout(() => {
            this.handleActionComplete(actionType);
        }, 1000);
    }

    handleActionComplete(actionType) {
        switch (actionType) {
            case 'Add Product':
                this.showNotification('Product form opened', 'success');
                break;
            case 'Invite User':
                this.showNotification('Invitation sent successfully', 'success');
                break;
            case 'Create Invoice':
                this.showNotification('Invoice created #INV-001', 'success');
                break;
            case 'View Reports':
                this.showNotification('Analytics dashboard loaded', 'info');
                break;
        }
    }

    handleNavigation(e, item) {
        e.preventDefault();
        
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.remove('active');
        });
        
        // Add active class to clicked item
        item.classList.add('active');
        
        // Get navigation target
        const navText = item.querySelector('span').textContent;
        this.showNotification(`Navigating to ${navText}...`, 'info');
        
        // Close mobile sidebar if open
        if (window.innerWidth <= 768) {
            this.closeMobileSidebar();
        }
        
        // Simulate page change
        this.simulatePageChange(navText);
    }

    simulatePageChange(page) {
        const pageTitle = document.querySelector('.page-title h1');
        const pageDescription = document.querySelector('.page-title p');
        
        if (pageTitle && pageDescription) {
            pageTitle.textContent = page;
            pageDescription.textContent = `Manage your ${page.toLowerCase()} here.`;
        }
    }

    handleSearch(query) {
        if (query.length < 2) return;
        
        // Simulate search
        console.log(`Searching for: ${query}`);
        this.showNotification(`Searching for "${query}"...`, 'info');
        
        // You could implement actual search functionality here
        setTimeout(() => {
            this.showNotification(`Found results for "${query}"`, 'success');
        }, 500);
    }

    handleResize() {
        // Close mobile sidebar on resize to desktop
        if (window.innerWidth > 768) {
            this.closeMobileSidebar();
        }
    }

    setupChart() {
        const canvas = document.getElementById('revenue-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Sample data for the chart
        const data = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Revenue',
                data: [12000, 19000, 15000, 25000, 22000, 30000],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        };
        
        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 4,
                        hoverRadius: 6
                    }
                }
            }
        };
        
        new Chart(ctx, config);
    }

    startRealTimeUpdates() {
        // Simulate real-time updates
        setInterval(() => {
            this.updateStats();
            this.addRandomActivity();
        }, 30000); // Update every 30 seconds
        
        // Update time indicators
        setInterval(() => {
            this.updateTimeIndicators();
        }, 60000); // Update every minute
    }

    updateStats() {
        // Simulate stat changes
        const changes = {
            users: Math.floor(Math.random() * 10) - 5,
            revenue: Math.floor(Math.random() * 1000) - 500,
            orders: Math.floor(Math.random() * 20) - 10,
            uptime: (Math.random() * 0.2) - 0.1
        };
        
        Object.keys(changes).forEach(key => {
            this.stats[key] += changes[key];
            if (key === 'uptime') {
                this.stats[key] = Math.max(95, Math.min(100, this.stats[key]));
            }
        });
        
        this.renderStats();
    }

    renderStats() {
        const statCards = document.querySelectorAll('.stat-card');
        const values = [
            this.formatNumber(this.stats.users),
            `$${this.formatNumber(this.stats.revenue)}`,
            this.formatNumber(this.stats.orders),
            `${this.stats.uptime.toFixed(1)}%`
        ];
        
        statCards.forEach((card, index) => {
            const valueElement = card.querySelector('.stat-value');
            if (valueElement && values[index]) {
                this.animateValue(valueElement, values[index]);
            }
        });
    }

    animateValue(element, newValue) {
        element.style.transform = 'scale(1.1)';
        element.style.color = 'var(--primary-color)';
        
        setTimeout(() => {
            element.textContent = newValue;
            element.style.transform = '';
            element.style.color = '';
        }, 200);
    }

    formatNumber(num) {
        return new Intl.NumberFormat().format(Math.floor(num));
    }

    addRandomActivity() {
        const activities = [
            'New user registration',
            'Order completed',
            'Payment processed',
            'Product updated',
            'Inventory restocked'
        ];
        
        const users = ['Alice Johnson', 'Bob Smith', 'Carol Williams', 'David Brown'];
        const activity = activities[Math.floor(Math.random() * activities.length)];
        const user = users[Math.floor(Math.random() * users.length)];
        
        this.addActivity(user, activity);
    }

    addActivity(user, action) {
        const activityList = document.querySelector('.activity-list');
        if (!activityList) return;
        
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.style.opacity = '0';
        activityItem.style.transform = 'translateY(-20px)';
        
        activityItem.innerHTML = `
            <div class="activity-avatar">
                <img src="https://picsum.photos/32/32?random=${Math.floor(Math.random() * 100)}" alt="User">
            </div>
            <div class="activity-content">
                <p><strong>${user}</strong> ${action}</p>
                <small class="activity-time">Just now</small>
            </div>
            <div class="activity-status success">
                <i class="fas fa-check"></i>
            </div>
        `;
        
        // Insert at the beginning
        activityList.insertBefore(activityItem, activityList.firstChild);
        
        // Animate in
        setTimeout(() => {
            activityItem.style.opacity = '1';
            activityItem.style.transform = 'translateY(0)';
        }, 100);
        
        // Remove oldest activity if too many
        const activities = activityList.querySelectorAll('.activity-item');
        if (activities.length > 6) {
            const lastActivity = activities[activities.length - 1];
            lastActivity.style.opacity = '0';
            setTimeout(() => {
                lastActivity.remove();
            }, 300);
        }
    }

    updateTimeIndicators() {
        document.querySelectorAll('.activity-time').forEach(timeElement => {
            const text = timeElement.textContent;
            if (text === 'Just now') {
                timeElement.textContent = '1 minute ago';
            } else if (text.includes('minute')) {
                const minutes = parseInt(text) + 1;
                timeElement.textContent = `${minutes} minutes ago`;
            }
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 12px 16px;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            z-index: 1002;
            max-width: 300px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        // Set notification color based on type
        const colors = {
            success: 'var(--success-color)',
            error: 'var(--error-color)',
            warning: 'var(--warning-color)',
            info: 'var(--info-color)'
        };
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 4px; height: 20px; background: ${colors[type]}; border-radius: 2px;"></div>
                <span style="font-size: 0.875rem;">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="margin-left: auto; background: none; border: none; cursor: pointer; padding: 2px;">
                    <i class="fas fa-times" style="font-size: 0.75rem; color: var(--text-secondary);"></i>
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
        }, 3000);
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

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardManager;
}