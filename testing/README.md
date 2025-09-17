# Testing Templates

A comprehensive testing framework supporting unit testing, integration testing, and end-to-end (E2E) testing with zero external dependencies.

## Overview

This testing library provides:
- **Unit Testing**: Zero-dependency test runner with assertions, mocks, and spies
- **Integration Testing**: HTTP client testing, database testing, and service mocking
- **E2E Testing**: Browser automation simulation and page object model
- **Test Utilities**: Data generation, mocking helpers, and common test patterns

## Modules

### 1. Test Framework (`test-framework.js`)

#### TestRunner Class
Zero-dependency test runner with full testing capabilities:

```javascript
const { TestRunner, expect, createMock } = require('./test-framework');

const runner = new TestRunner({
    timeout: 5000,
    retries: 2,
    verbose: true
});

// Define test suites
runner.describe('User Service', () => {
    let userService;
    
    runner.beforeEach(() => {
        userService = new UserService();
    });
    
    runner.it('should create a new user', async () => {
        const userData = { name: 'John', email: 'john@example.com' };
        const user = await userService.create(userData);
        
        expect(user).toHaveProperty('id');
        expect(user.name).toBe('John');
        expect(user.email).toBe('john@example.com');
    });
    
    runner.it('should validate email format', () => {
        const invalidEmail = 'invalid-email';
        
        expect(() => {
            userService.validateEmail(invalidEmail);
        }).toThrow('Invalid email format');
    });
});

// Run tests
runner.run().then(stats => {
    console.log(`Tests completed: ${stats.passed}/${stats.total} passed`);
});
```

#### Assertion Library
Comprehensive assertion methods:

```javascript
const { expect } = require('./test-framework');

// Basic assertions
expect(actual).toBe(expected);
expect(actual).toEqual(expected);
expect(actual).toBeNull();
expect(actual).toBeUndefined();
expect(actual).toBeTruthy();
expect(actual).toBeFalsy();

// Negation
expect(actual).not.toBe(expected);

// Array and string assertions
expect(['a', 'b', 'c']).toContain('b');
expect('hello world').toContain('world');
expect([1, 2, 3]).toHaveLength(3);

// Object assertions
expect(user).toHaveProperty('name');
expect(user).toHaveProperty('age', 25);
expect(error).toBeInstanceOf(Error);

// Function assertions
expect(() => {
    throw new Error('Test error');
}).toThrow('Test error');

expect(() => {
    throw new TypeError('Wrong type');
}).toThrow(TypeError);
```

#### Mock and Spy System
```javascript
const { createMock } = require('./test-framework');

// Create mock function
const mockCallback = createMock((x) => x * 2);

// Configure mock behavior
mockCallback.mockReturnValue(42);
mockCallback.mockImplementation((x) => x + 1);
mockCallback.mockThrow(new Error('Mock error'));

// Use mock
const result = mockCallback(5);

// Verify mock calls
expect(mockCallback.toHaveBeenCalled()).toBe(true);
expect(mockCallback.toHaveBeenCalledTimes(1));
expect(mockCallback.toHaveBeenCalledWith(5)).toBe(true);

// Access call history
console.log(mockCallback.calls); // Array of call objects

// Reset mock
mockCallback.reset();
```

#### Test Utilities
```javascript
const { TestUtils } = require('./test-framework');

// Generate test data
const user = TestUtils.createTestData({
    name: (i) => `User ${i}`,
    email: (i) => `user${i}@example.com`,
    age: () => TestUtils.randomNumber(18, 65),
    id: (i) => i + 1
});

const users = TestUtils.createTestData({
    name: (i) => `User ${i}`,
    email: (i) => TestUtils.randomEmail()
}, 5); // Create 5 users

// Utility functions
const randomStr = TestUtils.randomString(10);
const randomEmail = TestUtils.randomEmail();
const randomNum = TestUtils.randomNumber(1, 100);

// Deep cloning
const cloned = TestUtils.deepClone(complexObject);

// Test delays
await TestUtils.sleep(1000); // Wait 1 second
```

### 2. Integration Testing (`integration-testing.js`)

#### HTTP Client Testing
```javascript
const { IntegrationTestHelper } = require('./integration-testing');

const client = new IntegrationTestHelper({
    baseUrl: 'http://localhost:3000'
});

// HTTP requests
const response = await client.get('/api/users');
const newUser = await client.post('/api/users', {
    name: 'John Doe',
    email: 'john@example.com'
});

// Authentication
client.setAuth('jwt-token-here');
const profile = await client.get('/api/profile');

// Cookies
client.setCookie('session', 'session-value');
const dashboard = await client.get('/dashboard');

// Response assertions
client.expectStatus(response, 200);
client.expectJson(response);
client.expectProperty(response, 'data');
client.expectArray(response, 'users');
client.expectLength(response, 5, 'users');
```

#### Database Testing
```javascript
const { DatabaseTestHelper } = require('./integration-testing');

const dbHelper = new DatabaseTestHelper(dbManager);

// Load test fixtures
await dbHelper.loadFixtures({
    users: [
        { id: 1, name: 'John', email: 'john@example.com' },
        { id: 2, name: 'Jane', email: 'jane@example.com' }
    ],
    posts: [
        { id: 1, title: 'First Post', user_id: 1 },
        { id: 2, title: 'Second Post', user_id: 2 }
    ]
});

// Test database operations
await dbHelper.expectRecordExists('users', { email: 'john@example.com' });
await dbHelper.expectRecordCount('posts', 2);

const user = await dbHelper.getRecord('users', { id: 1 });
expect(user.name).toBe('John');

// Test in transaction (auto-rollback)
await dbHelper.rollbackAfterTest(async () => {
    await userService.createUser({ name: 'Test', email: 'test@example.com' });
    
    // Test operations here - will be rolled back
    await dbHelper.expectRecordExists('users', { email: 'test@example.com' });
});

// Cleanup fixtures
await dbHelper.cleanupFixtures();
```

#### Service Mocking
```javascript
const { ServiceMockHelper } = require('./integration-testing');

const mockHelper = new ServiceMockHelper();

// Mock HTTP service
mockHelper.mockHttpService('https://api.external.com', {
    'GET /users': {
        status: 200,
        data: [{ id: 1, name: 'External User' }]
    },
    'POST /users': {
        status: 201,
        data: { id: 2, name: 'Created User' }
    }
});

// Mock database queries
mockHelper.mockDatabaseService(dbManager, {
    'SELECT * FROM users': [
        { id: 1, name: 'Mocked User' }
    ],
    'INSERT INTO users': { insertId: 123 }
});

// Mock email service
const sentEmails = mockHelper.mockEmailService(emailService);

// Run tests with mocked services
await myService.sendWelcomeEmail('user@example.com');

// Verify interactions
mockHelper.expectHttpRequest('POST', '/users', 1);
mockHelper.expectDatabaseQuery('INSERT INTO users', 1);
expect(sentEmails).toHaveLength(1);
expect(sentEmails[0].to).toBe('user@example.com');

// Restore original services
mockHelper.restoreAll();
```

#### Complete Integration Test Suite
```javascript
const { IntegrationTestSuite } = require('./integration-testing');

const suite = new IntegrationTestSuite({
    http: { baseUrl: 'http://localhost:3000' }
});

suite.setDatabase(dbManager);

// Setup before tests
await suite.setup();

// Test CRUD operations
const results = await suite.testCrudOperations('users', {
    name: 'Test User',
    email: 'test@example.com'
});

console.log('CRUD test results:', results);

// Test authenticated endpoints
await suite.testAuthenticatedEndpoint('GET', '/api/profile', 'jwt-token');

// Cleanup after tests
await suite.teardown();
```

### 3. E2E Testing (`e2e-testing.js`)

#### Browser Automation
```javascript
const { E2ETestHelper } = require('./e2e-testing');

const e2e = new E2ETestHelper({
    headless: false,
    width: 1280,
    height: 720,
    screenshots: true
});

// Setup browser
const page = await e2e.setup();

// Navigate and interact
await page.goto('http://localhost:3000/login');
await page.type('#email', 'user@example.com');
await page.type('#password', 'password123');
await page.click('#loginButton');

// Wait for navigation
await page.waitForNavigation();

// Take screenshot
await e2e.screenshot('after_login');

// Verify page content
const title = await page.$('#pageTitle');
const titleText = await title.getText();
expect(titleText).toBe('Dashboard');

// Cleanup
await e2e.teardown();
```

#### Page Object Model
```javascript
const { LoginPage, DashboardPage } = require('./e2e-testing');

// Initialize page objects
const loginPage = new LoginPage(page);
const dashboardPage = new DashboardPage(page);

// Use page objects
await loginPage.goto();
const loginSuccess = await loginPage.login('user@example.com', 'password123');

if (loginSuccess) {
    await dashboardPage.goto();
    const welcomeMessage = await dashboardPage.getWelcomeMessage();
    expect(welcomeMessage).toContain('Welcome');
    
    await dashboardPage.navigateToProfile();
}
```

#### Custom Page Objects
```javascript
const { PageObject } = require('./e2e-testing');

class ProductPage extends PageObject {
    constructor(page) {
        super(page);
        this.productTitle = '#product-title';
        this.addToCartButton = '#add-to-cart';
        this.quantityInput = '#quantity';
        this.priceDisplay = '.price';
    }
    
    async goto(productId) {
        await this.page.goto(`/products/${productId}`);
        await this.waitForLoad();
    }
    
    async isLoaded() {
        try {
            await this.page.waitForSelector(this.productTitle, { timeout: 1000 });
            return true;
        } catch {
            return false;
        }
    }
    
    async addToCart(quantity = 1) {
        await this.page.type(this.quantityInput, String(quantity));
        await this.page.click(this.addToCartButton);
        
        // Wait for success indicator
        await this.page.waitForSelector('.cart-success', { timeout: 5000 });
    }
    
    async getPrice() {
        const priceElement = await this.page.$(this.priceDisplay);
        const priceText = await priceElement.getText();
        return parseFloat(priceText.replace('$', ''));
    }
}

// Use custom page object
const productPage = new ProductPage(page);
await productPage.goto(123);
await productPage.addToCart(2);
const price = await productPage.getPrice();
```

#### Advanced E2E Testing
```javascript
// Test complete user flow
const results = await e2e.testCompleteUserFlow({
    email: 'user@example.com',
    password: 'password123'
});

// Test responsive design
const responsiveResults = await e2e.testResponsiveDesign([320, 768, 1024]);

// Test accessibility
const accessibilityResults = await e2e.testAccessibility();

// Custom element interactions
await page.evaluate(() => {
    // JavaScript executed in browser context
    return document.title;
});

const elements = await page.$$('.item'); // Get all matching elements
for (const element of elements) {
    await element.click();
}

// File uploads
await page.setInputFiles('#file-input', './test-file.jpg');

// Form handling
await page.select('#country', 'US');
await page.check('#agree-terms');
await page.uncheck('#newsletter');
```

## Complete Testing Example

### Test File Structure
```
tests/
├── unit/
│   ├── user.test.js
│   ├── product.test.js
│   └── utils.test.js
├── integration/
│   ├── api.test.js
│   ├── database.test.js
│   └── services.test.js
├── e2e/
│   ├── user-flow.test.js
│   ├── checkout.test.js
│   └── admin.test.js
└── fixtures/
    ├── users.json
    └── products.json
```

### Unit Test Example
```javascript
// tests/unit/user.test.js
const { TestRunner, expect, createMock } = require('../../testing/test-framework');
const { User } = require('../../src/models/User');

const runner = new TestRunner();

runner.describe('User Model', () => {
    let user;
    
    runner.beforeEach(() => {
        user = new User();
    });
    
    runner.describe('validation', () => {
        runner.it('should validate email format', () => {
            expect(() => {
                user.setEmail('invalid-email');
            }).toThrow('Invalid email format');
        });
        
        runner.it('should accept valid email', () => {
            expect(() => {
                user.setEmail('user@example.com');
            }).not.toThrow();
            
            expect(user.email).toBe('user@example.com');
        });
        
        runner.it('should hash password', async () => {
            await user.setPassword('password123');
            
            expect(user.password).not.toBe('password123');
            expect(user.password).toHaveLength(60); // bcrypt hash length
        });
    });
    
    runner.describe('methods', () => {
        runner.it('should generate full name', () => {
            user.firstName = 'John';
            user.lastName = 'Doe';
            
            expect(user.getFullName()).toBe('John Doe');
        });
        
        runner.it('should check if user is adult', () => {
            user.birthDate = new Date('1990-01-01');
            
            expect(user.isAdult()).toBe(true);
        });
    });
});

// Export for running
module.exports = runner;
```

### Integration Test Example
```javascript
// tests/integration/api.test.js
const { TestRunner, expect } = require('../../testing/test-framework');
const { IntegrationTestSuite } = require('../../testing/integration-testing');
const { DatabaseManager } = require('../../database/connection-manager');

const runner = new TestRunner();

runner.describe('User API', () => {
    let suite;
    let client;
    
    runner.beforeAll(async () => {
        const db = new DatabaseManager({
            type: 'sqlite',
            database: ':memory:'
        });
        await db.connect();
        
        suite = new IntegrationTestSuite({
            http: { baseUrl: 'http://localhost:3001' }
        });
        suite.setDatabase(db);
        
        await suite.setup();
        client = suite.httpClient;
    });
    
    runner.afterAll(async () => {
        await suite.teardown();
    });
    
    runner.beforeEach(async () => {
        // Load fresh fixtures for each test
        await suite.dbHelper.loadFixtures({
            users: [
                { id: 1, name: 'John', email: 'john@example.com', active: true },
                { id: 2, name: 'Jane', email: 'jane@example.com', active: false }
            ]
        });
    });
    
    runner.afterEach(async () => {
        await suite.dbHelper.cleanupFixtures();
    });
    
    runner.it('should get all users', async () => {
        const response = await client.get('/api/users');
        
        client.expectStatus(response, 200);
        client.expectJson(response);
        client.expectArray(response, 'users');
        client.expectLength(response, 2, 'users');
    });
    
    runner.it('should create new user', async () => {
        const userData = {
            name: 'Bob Smith',
            email: 'bob@example.com'
        };
        
        const response = await client.post('/api/users', userData);
        
        client.expectStatus(response, 201);
        client.expectProperty(response, 'id');
        
        // Verify in database
        await suite.dbHelper.expectRecordExists('users', {
            email: 'bob@example.com'
        });
    });
    
    runner.it('should handle validation errors', async () => {
        const invalidData = {
            name: '', // Invalid: empty name
            email: 'invalid-email' // Invalid: bad format
        };
        
        const response = await client.post('/api/users', invalidData);
        
        client.expectStatus(response, 400);
        client.expectProperty(response, 'errors');
        
        expect(response.data.errors).toContain('name');
        expect(response.data.errors).toContain('email');
    });
});

module.exports = runner;
```

### E2E Test Example
```javascript
// tests/e2e/user-flow.test.js
const { TestRunner, expect } = require('../../testing/test-framework');
const { E2ETestHelper } = require('../../testing/e2e-testing');

const runner = new TestRunner({
    timeout: 30000 // Longer timeout for E2E tests
});

runner.describe('User Registration Flow', () => {
    let e2e;
    let page;
    
    runner.beforeAll(async () => {
        e2e = new E2ETestHelper({
            headless: true,
            screenshots: true
        });
        page = await e2e.setup();
    });
    
    runner.afterAll(async () => {
        await e2e.teardown();
    });
    
    runner.it('should complete user registration', async () => {
        // Navigate to registration page
        await page.goto('http://localhost:3000/register');
        
        // Fill registration form
        await page.type('#firstName', 'John');
        await page.type('#lastName', 'Doe');
        await page.type('#email', 'john.doe@example.com');
        await page.type('#password', 'SecurePassword123');
        await page.type('#confirmPassword', 'SecurePassword123');
        
        // Accept terms
        await page.click('#acceptTerms');
        
        // Submit form
        await page.click('#registerButton');
        
        // Wait for success page
        await page.waitForSelector('.registration-success');
        
        // Take screenshot
        await e2e.screenshot('registration_success');
        
        // Verify success message
        const successMessage = await page.$('.registration-success');
        const messageText = await successMessage.getText();
        expect(messageText).toContain('Registration successful');
        
        // Verify redirect to login
        await page.waitForNavigation();
        const currentUrl = await page.evaluate(() => window.location.pathname);
        expect(currentUrl).toBe('/login');
    });
    
    runner.it('should handle registration errors', async () => {
        await page.goto('http://localhost:3000/register');
        
        // Submit empty form
        await page.click('#registerButton');
        
        // Wait for error messages
        await page.waitForSelector('.error-message');
        
        const errorMessages = await page.$$('.error-message');
        expect(errorMessages.length).toBeGreaterThan(0);
        
        await e2e.screenshot('registration_errors');
    });
});

module.exports = runner;
```

### Test Runner Script
```javascript
// run-tests.js
const fs = require('fs');
const path = require('path');

async function runAllTests() {
    const testDirs = ['unit', 'integration', 'e2e'];
    const results = {
        total: 0,
        passed: 0,
        failed: 0,
        suites: []
    };
    
    for (const dir of testDirs) {
        const testPath = path.join(__dirname, 'tests', dir);
        
        if (!fs.existsSync(testPath)) continue;
        
        const testFiles = fs.readdirSync(testPath)
            .filter(file => file.endsWith('.test.js'));
        
        for (const file of testFiles) {
            console.log(`\nRunning ${dir}/${file}...`);
            
            try {
                const testRunner = require(path.join(testPath, file));
                const stats = await testRunner.run();
                
                results.total += stats.total;
                results.passed += stats.passed;
                results.failed += stats.failed;
                results.suites.push({
                    file: `${dir}/${file}`,
                    ...stats
                });
                
            } catch (error) {
                console.error(`Error running ${file}:`, error);
                results.failed++;
            }
        }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = runAllTests;
```

### Package.json Scripts
```json
{
  "scripts": {
    "test": "node run-tests.js",
    "test:unit": "node tests/unit/run-unit-tests.js",
    "test:integration": "node tests/integration/run-integration-tests.js",
    "test:e2e": "node tests/e2e/run-e2e-tests.js",
    "test:watch": "nodemon --exec 'npm test' --watch src --watch tests"
  }
}
```

## Features

### Zero Dependencies
- No external testing libraries required
- Pure JavaScript implementation
- Works in Node.js and browser environments

### Comprehensive Assertions
- Value equality and identity checks
- Type checking and instance verification
- Array and object property assertions
- Function and error testing

### Advanced Mocking
- Function mocks with call tracking
- Return value and implementation mocking
- Service and HTTP request mocking
- Database query mocking

### Browser Automation
- Page navigation and interaction
- Element selection and manipulation
- Screenshot and PDF generation
- Responsive design testing

### Test Organization
- Nested test suites with describe/it syntax
- Before/after hooks for setup and cleanup
- Test skipping and focusing
- Parallel test execution support

### Reporting
- Console output with colors
- Test duration tracking
- Screenshot capture for E2E tests
- Custom reporter support

## Browser Support

- **Node.js**: Full support (recommended)
- **Modern Browsers**: Full support for unit testing
- **E2E Testing**: Simulation mode (works without browser drivers)
- **Electron**: Full support

## Best Practices

### Test Organization
```javascript
// Group related tests
describe('User Authentication', () => {
    describe('login', () => {
        it('should authenticate valid users', () => {});
        it('should reject invalid passwords', () => {});
    });
    
    describe('logout', () => {
        it('should clear session data', () => {});
    });
});
```

### Test Data Management
```javascript
// Use factories for consistent test data
const UserFactory = {
    create: (overrides = {}) => ({
        name: 'Test User',
        email: 'test@example.com',
        active: true,
        ...overrides
    })
};

const user = UserFactory.create({ name: 'Custom Name' });
```

### Async Testing
```javascript
// Always await async operations
it('should handle async operations', async () => {
    const result = await asyncFunction();
    expect(result).toBeDefined();
});

// Use proper error handling
it('should handle async errors', async () => {
    await expect(async () => {
        await failingAsyncFunction();
    }).toThrow('Expected error');
});
```

### Mock Management
```javascript
// Clean up mocks after each test
afterEach(() => {
    mockHelper.restoreAll();
});

// Use specific mocks for each test
it('should use specific mock', () => {
    const mock = createMock();
    mock.mockReturnValue('specific value');
    
    // Test with mock
    expect(mock()).toBe('specific value');
});
```