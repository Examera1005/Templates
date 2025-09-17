// Formatting Utilities
class FormatUtils {
    // Number formatting
    static formatNumber(number, options = {}) {
        const {
            locale = 'en-US',
            style = 'decimal',
            minimumFractionDigits = 0,
            maximumFractionDigits = 2
        } = options;

        return new Intl.NumberFormat(locale, {
            style,
            minimumFractionDigits,
            maximumFractionDigits
        }).format(number);
    }

    static formatCurrency(amount, currency = 'USD', locale = 'en-US') {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    static formatPercentage(number, decimals = 1) {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    // Date formatting
    static formatDate(date, format = 'short', locale = 'en-US') {
        const d = new Date(date);
        
        const formats = {
            short: { dateStyle: 'short' },
            medium: { dateStyle: 'medium' },
            long: { dateStyle: 'long' },
            full: { dateStyle: 'full' },
            iso: null,
            relative: null
        };

        if (format === 'iso') {
            return d.toISOString().split('T')[0];
        }

        if (format === 'relative') {
            return this.formatRelativeTime(d);
        }

        return new Intl.DateTimeFormat(locale, formats[format]).format(d);
    }

    static formatDateTime(date, locale = 'en-US') {
        return new Intl.DateTimeFormat(locale, {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(new Date(date));
    }

    static formatRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
        if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
        if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (seconds > 30) return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
        return 'Just now';
    }

    // String formatting
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    static titleCase(str) {
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    static camelCase(str) {
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
            return index === 0 ? word.toLowerCase() : word.toUpperCase();
        }).replace(/\s+/g, '');
    }

    static kebabCase(str) {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();
    }

    static snakeCase(str) {
        return str
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .replace(/[\s-]+/g, '_')
            .toLowerCase();
    }

    static truncate(str, length, suffix = '...') {
        if (str.length <= length) return str;
        return str.substring(0, length - suffix.length) + suffix;
    }

    static pluralize(count, singular, plural = null) {
        if (count === 1) return singular;
        return plural || singular + 's';
    }

    static slugify(str) {
        return str
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }

    // Phone number formatting
    static formatPhone(phone, format = 'us') {
        const cleaned = phone.replace(/\D/g, '');
        
        if (format === 'us' && cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
        
        if (format === 'international' && cleaned.length >= 10) {
            const country = cleaned.slice(0, cleaned.length - 10);
            const area = cleaned.slice(-10, -7);
            const prefix = cleaned.slice(-7, -4);
            const number = cleaned.slice(-4);
            return `+${country} (${area}) ${prefix}-${number}`;
        }
        
        return phone;
    }

    // Credit card formatting
    static formatCreditCard(number) {
        const cleaned = number.replace(/\D/g, '');
        const match = cleaned.match(/(\d{1,4})(\d{1,4})?(\d{1,4})?(\d{1,4})?/);
        
        if (!match) return number;
        
        return [match[1], match[2], match[3], match[4]]
            .filter(Boolean)
            .join(' ');
    }

    // Color formatting
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    // Address formatting
    static formatAddress(address) {
        const {
            street,
            city,
            state,
            zipCode,
            country = 'US'
        } = address;

        if (country === 'US') {
            return `${street}\n${city}, ${state} ${zipCode}`;
        }
        
        return `${street}\n${city}, ${state}\n${zipCode}\n${country}`;
    }

    // Template utilities
    static template(str, data) {
        return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data.hasOwnProperty(key) ? data[key] : match;
        });
    }

    static interpolate(template, values) {
        return template.replace(/\${(\w+)}/g, (match, key) => {
            return values.hasOwnProperty(key) ? values[key] : match;
        });
    }

    // HTML utilities
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static unescapeHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    static stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    // Social media formatting
    static formatHashtag(text) {
        return text.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
    }

    static formatMention(text) {
        return text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
    }

    static formatLinks(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormatUtils;
}