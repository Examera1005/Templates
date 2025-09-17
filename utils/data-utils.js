// Data Manipulation Utilities
class DataUtils {
    // Array utilities
    static chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    static flatten(array) {
        return array.flat(Infinity);
    }

    static unique(array) {
        return [...new Set(array)];
    }

    static groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = typeof key === 'function' ? key(item) : item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }

    static sortBy(array, key, direction = 'asc') {
        return [...array].sort((a, b) => {
            const aVal = typeof key === 'function' ? key(a) : a[key];
            const bVal = typeof key === 'function' ? key(b) : b[key];
            
            if (direction === 'desc') {
                return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
            }
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        });
    }

    static filterBy(array, filters) {
        return array.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
                if (typeof value === 'function') {
                    return value(item[key]);
                }
                return item[key] === value;
            });
        });
    }

    // Object utilities
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        
        const cloned = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }

    static merge(target, ...sources) {
        return sources.reduce((acc, source) => {
            Object.keys(source).forEach(key => {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    acc[key] = this.merge(acc[key] || {}, source[key]);
                } else {
                    acc[key] = source[key];
                }
            });
            return acc;
        }, { ...target });
    }

    static pick(obj, keys) {
        return keys.reduce((picked, key) => {
            if (obj.hasOwnProperty(key)) {
                picked[key] = obj[key];
            }
            return picked;
        }, {});
    }

    static omit(obj, keys) {
        const omitted = { ...obj };
        keys.forEach(key => delete omitted[key]);
        return omitted;
    }

    static isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    // String utilities
    static camelCase(str) {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }

    static kebabCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }

    static snakeCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    }

    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static truncate(str, length, suffix = '...') {
        return str.length > length ? str.substring(0, length) + suffix : str;
    }

    // Number utilities
    static clamp(number, min, max) {
        return Math.min(Math.max(number, min), max);
    }

    static random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static round(number, decimals = 0) {
        return Number(Math.round(number + 'e' + decimals) + 'e-' + decimals);
    }

    // Date utilities
    static formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day);
    }

    static timeAgo(date) {
        const now = new Date();
        const diffInMs = now - new Date(date);
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMinutes < 1) return 'just now';
        if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        
        return this.formatDate(date);
    }

    // URL utilities
    static buildUrl(base, params = {}) {
        const url = new URL(base);
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                url.searchParams.set(key, value);
            }
        });
        return url.toString();
    }

    static parseQueryString(queryString) {
        const params = new URLSearchParams(queryString);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataUtils;
}