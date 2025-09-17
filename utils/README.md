# Utility Functions Library

A comprehensive collection of utility functions for common programming tasks, organized into focused modules for easy integration into any project.

## Modules

### 1. Data Utilities (`data-utils.js`)
Comprehensive data manipulation functions:
- **Array Operations**: chunk, flatten, unique, intersection, difference, groupBy, sortBy
- **Object Operations**: deepClone, merge, pick, omit, hasPath, getPath, setPath
- **String Operations**: capitalize, slugify, truncate, removeAccents, wordCount
- **Date Operations**: addDays, formatDate, parseDate, getDateRange, isValidDate
- **URL Operations**: parseQueryString, buildQueryString, extractDomain, isValidUrl

### 2. Validation Utilities (`validation-utils.js`)
Form validation and data sanitization:
- **Field Validation**: email, phone, password, credit card, date, URL validation
- **Form Framework**: complete form validation with error handling
- **Sanitization**: HTML, SQL injection prevention, XSS protection
- **Custom Validators**: extensible validation system

### 3. DOM Utilities (`dom-utils.js`)
Browser DOM manipulation helpers:
- **Element Selection**: enhanced query selectors with shortcuts
- **Element Creation**: programmatic element creation with attributes
- **Class Management**: addClass, removeClass, toggleClass, hasClass
- **Event Handling**: on, off, once, delegate event binding
- **Animation**: fadeIn, fadeOut, slideUp, slideDown helpers
- **Form Utilities**: getFormData, setFormData, clearForm
- **Position/Viewport**: element positioning and viewport detection

### 4. Format Utilities (`format-utils.js`)
Data formatting and display functions:
- **Number Formatting**: currency, percentage, file size, duration
- **Date Formatting**: relative time, internationalization, custom formats
- **String Formatting**: capitalize, titleCase, camelCase, kebabCase, truncate
- **Phone/Card Formatting**: US/international phone, credit card display
- **Color Utilities**: hex to RGB conversion, color manipulation
- **Template Utilities**: string interpolation, HTML escaping

### 5. Common Utilities (`common-utils.js`)
Advanced programming patterns:
- **Async Utilities**: retry, timeout, parallel execution, sleep
- **Functional Programming**: pipe, compose, curry, memoize
- **Caching**: TTL cache with size limits and automatic cleanup
- **Event System**: custom event emitter implementation
- **State Management**: simple store with subscriptions
- **Rate Limiting**: request rate limiting with time windows
- **Feature Flags**: runtime feature toggling system
- **Logging**: configurable logger with multiple levels
- **Batch Processing**: efficient batch operation handling

## Usage Examples

### Basic Data Manipulation
```javascript
const DataUtils = require('./data-utils');

// Array operations
const chunks = DataUtils.chunk([1, 2, 3, 4, 5, 6], 2); // [[1,2], [3,4], [5,6]]
const unique = DataUtils.unique([1, 2, 2, 3, 3, 4]); // [1, 2, 3, 4]

// Object operations
const merged = DataUtils.merge({a: 1}, {b: 2}); // {a: 1, b: 2}
const cloned = DataUtils.deepClone(complexObject);
```

### Form Validation
```javascript
const ValidationUtils = require('./validation-utils');

const validator = new ValidationUtils();
validator.addRule('email', 'Please enter a valid email');
validator.addRule('required', 'This field is required');

const isValid = validator.validate(formData);
```

### DOM Manipulation
```javascript
const DOMUtils = require('./dom-utils');

// Create elements
const button = DOMUtils.create('button', {
    className: 'btn btn-primary',
    textContent: 'Click me'
});

// Event handling
DOMUtils.on(button, 'click', () => console.log('Clicked!'));

// Animations
DOMUtils.fadeIn(element, 300);
```

### Formatting
```javascript
const FormatUtils = require('./format-utils');

const price = FormatUtils.formatCurrency(1234.56, 'USD'); // "$1,234.56"
const time = FormatUtils.formatRelativeTime(new Date(Date.now() - 3600000)); // "1 hour ago"
const slug = FormatUtils.slugify("Hello World!"); // "hello-world"
```

### Advanced Patterns
```javascript
const CommonUtils = require('./common-utils');

// Async retry with exponential backoff
const result = await CommonUtils.retry(async () => {
    return await fetchData();
}, 3, 1000);

// Memoized expensive function
const memoizedFn = CommonUtils.memoize(expensiveCalculation);

// Rate limiting
const limiter = CommonUtils.createRateLimiter(5, 60000); // 5 requests per minute
if (limiter.isAllowed()) {
    // Process request
}
```

## Features

- **Zero Dependencies**: Pure JavaScript implementations
- **Browser & Node.js Compatible**: Works in both environments
- **Modular Design**: Import only what you need
- **Comprehensive**: Covers most common programming tasks
- **Well Tested**: Robust implementations with error handling
- **Performance Optimized**: Efficient algorithms and memory usage

## Installation

Simply copy the utility files you need into your project:

```bash
# Copy all utilities
cp utils/*.js your-project/src/utils/

# Or copy specific modules
cp utils/data-utils.js your-project/src/utils/
cp utils/validation-utils.js your-project/src/utils/
```

## Browser Usage

```html
<script src="utils/data-utils.js"></script>
<script src="utils/dom-utils.js"></script>
<script>
    const chunks = DataUtils.chunk([1, 2, 3, 4], 2);
    DOMUtils.ready(() => {
        console.log('DOM ready');
    });
</script>
```

## Node.js Usage

```javascript
const DataUtils = require('./utils/data-utils');
const ValidationUtils = require('./utils/validation-utils');

// Use the utilities
const result = DataUtils.groupBy(data, 'category');
```

## Contributing

Each utility module is self-contained and can be extended independently. Add new functions following the existing patterns and maintain backward compatibility.