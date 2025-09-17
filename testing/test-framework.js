/**
 * Universal Testing Framework
 * Zero-dependency testing utilities supporting unit, integration, and E2E testing
 * Compatible with multiple test runners and assertion libraries
 */

class TestRunner {
    constructor(options = {}) {
        this.options = {
            timeout: 5000,
            retries: 0,
            bail: false,
            verbose: false,
            parallel: false,
            ...options
        };
        
        this.tests = [];
        this.suites = [];
        this.hooks = {
            beforeAll: [],
            beforeEach: [],
            afterEach: [],
            afterAll: []
        };
        
        this.stats = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0,
            duration: 0
        };
        
        this.reporter = new ConsoleReporter();
    }
    
    // Test definition methods
    describe(name, callback) {
        const suite = new TestSuite(name, this);
        this.suites.push(suite);
        
        // Switch context to the suite
        const originalContext = global.currentSuite;
        global.currentSuite = suite;
        
        try {
            callback();
        } finally {
            global.currentSuite = originalContext;
        }
        
        return suite;
    }
    
    it(name, callback, options = {}) {
        const test = new Test(name, callback, {
            timeout: options.timeout || this.options.timeout,
            retries: options.retries || this.options.retries,
            skip: options.skip || false,
            only: options.only || false
        });
        
        if (global.currentSuite) {
            global.currentSuite.addTest(test);
        } else {
            this.tests.push(test);
        }
        
        return test;
    }
    
    test(name, callback, options = {}) {
        return this.it(name, callback, options);
    }
    
    skip(name, callback) {
        return this.it(name, callback, { skip: true });
    }
    
    only(name, callback) {
        return this.it(name, callback, { only: true });
    }
    
    // Hook methods
    beforeAll(callback) {
        this.hooks.beforeAll.push(callback);
    }
    
    beforeEach(callback) {
        this.hooks.beforeEach.push(callback);
    }
    
    afterEach(callback) {
        this.hooks.afterEach.push(callback);
    }
    
    afterAll(callback) {
        this.hooks.afterAll.push(callback);
    }
    
    // Execution methods
    async run() {
        const startTime = Date.now();
        
        this.reporter.onStart();
        
        try {
            // Run beforeAll hooks
            await this.runHooks(this.hooks.beforeAll);
            
            // Check for 'only' tests
            const hasOnly = this.hasOnlyTests();
            
            // Run suites
            for (const suite of this.suites) {
                await this.runSuite(suite, hasOnly);
            }
            
            // Run standalone tests
            for (const test of this.tests) {
                if (!hasOnly || test.only) {
                    await this.runTest(test);
                }
            }
            
            // Run afterAll hooks
            await this.runHooks(this.hooks.afterAll);
            
        } catch (error) {
            this.reporter.onError(error);
        }
        
        this.stats.duration = Date.now() - startTime;
        this.reporter.onComplete(this.stats);
        
        return this.stats;
    }
    
    async runSuite(suite, hasOnly = false) {
        this.reporter.onSuiteStart(suite);
        
        try {
            // Run suite beforeAll hooks
            await this.runHooks(suite.hooks.beforeAll);
            
            // Run tests in suite
            for (const test of suite.tests) {
                if (!hasOnly || test.only || (!this.hasOnlyInSuite(suite) && !hasOnly)) {
                    await this.runTest(test, suite);
                }
            }
            
            // Run suite afterAll hooks
            await this.runHooks(suite.hooks.afterAll);
            
        } catch (error) {
            this.reporter.onSuiteError(suite, error);
        }
        
        this.reporter.onSuiteComplete(suite);
    }
    
    async runTest(test, suite = null) {
        if (test.skip) {
            this.stats.skipped++;
            this.stats.total++;
            this.reporter.onTestSkipped(test);
            return;
        }
        
        this.stats.total++;
        
        const startTime = Date.now();
        let attempts = 0;
        const maxAttempts = test.retries + 1;
        
        while (attempts < maxAttempts) {
            attempts++;
            
            try {
                this.reporter.onTestStart(test);
                
                // Run beforeEach hooks
                await this.runHooks(this.hooks.beforeEach);
                if (suite) {
                    await this.runHooks(suite.hooks.beforeEach);
                }
                
                // Run the test with timeout
                await this.runWithTimeout(test.callback, test.timeout);
                
                // Run afterEach hooks
                if (suite) {
                    await this.runHooks(suite.hooks.afterEach);
                }
                await this.runHooks(this.hooks.afterEach);
                
                // Test passed
                test.duration = Date.now() - startTime;
                test.passed = true;
                this.stats.passed++;
                this.reporter.onTestPassed(test);
                break;
                
            } catch (error) {
                test.error = error;
                
                if (attempts === maxAttempts) {
                    // Final attempt failed
                    test.duration = Date.now() - startTime;
                    test.passed = false;
                    this.stats.failed++;
                    this.reporter.onTestFailed(test);
                    
                    if (this.options.bail) {
                        throw new Error(`Test failed: ${test.name}`);
                    }
                } else {
                    // Retry the test
                    this.reporter.onTestRetry(test, attempts);
                }
            }
        }
    }
    
    async runHooks(hooks) {
        for (const hook of hooks) {
            await hook();
        }
    }
    
    async runWithTimeout(callback, timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Test timeout after ${timeout}ms`));
            }, timeout);
            
            Promise.resolve(callback())
                .then(result => {
                    clearTimeout(timer);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    }
    
    hasOnlyTests() {
        return this.tests.some(test => test.only) || 
               this.suites.some(suite => suite.tests.some(test => test.only));
    }
    
    hasOnlyInSuite(suite) {
        return suite.tests.some(test => test.only);
    }
    
    // Utility methods
    setReporter(reporter) {
        this.reporter = reporter;
    }
    
    getStats() {
        return { ...this.stats };
    }
}

class TestSuite {
    constructor(name, runner) {
        this.name = name;
        this.runner = runner;
        this.tests = [];
        this.hooks = {
            beforeAll: [],
            beforeEach: [],
            afterEach: [],
            afterAll: []
        };
    }
    
    addTest(test) {
        this.tests.push(test);
    }
    
    beforeAll(callback) {
        this.hooks.beforeAll.push(callback);
    }
    
    beforeEach(callback) {
        this.hooks.beforeEach.push(callback);
    }
    
    afterEach(callback) {
        this.hooks.afterEach.push(callback);
    }
    
    afterAll(callback) {
        this.hooks.afterAll.push(callback);
    }
}

class Test {
    constructor(name, callback, options = {}) {
        this.name = name;
        this.callback = callback;
        this.timeout = options.timeout || 5000;
        this.retries = options.retries || 0;
        this.skip = options.skip || false;
        this.only = options.only || false;
        this.passed = null;
        this.error = null;
        this.duration = 0;
    }
}

// Assertion Library
class Assertion {
    constructor(actual) {
        this.actual = actual;
        this.negated = false;
    }
    
    get not() {
        this.negated = !this.negated;
        return this;
    }
    
    toBe(expected) {
        const passed = this.actual === expected;
        this.assert(passed, `Expected ${this.actual} to be ${expected}`, `Expected ${this.actual} not to be ${expected}`);
        return this;
    }
    
    toEqual(expected) {
        const passed = this.deepEqual(this.actual, expected);
        this.assert(passed, `Expected ${JSON.stringify(this.actual)} to equal ${JSON.stringify(expected)}`, `Expected ${JSON.stringify(this.actual)} not to equal ${JSON.stringify(expected)}`);
        return this;
    }
    
    toBeNull() {
        const passed = this.actual === null;
        this.assert(passed, `Expected ${this.actual} to be null`, `Expected ${this.actual} not to be null`);
        return this;
    }
    
    toBeUndefined() {
        const passed = this.actual === undefined;
        this.assert(passed, `Expected ${this.actual} to be undefined`, `Expected ${this.actual} not to be undefined`);
        return this;
    }
    
    toBeTruthy() {
        const passed = Boolean(this.actual);
        this.assert(passed, `Expected ${this.actual} to be truthy`, `Expected ${this.actual} not to be truthy`);
        return this;
    }
    
    toBeFalsy() {
        const passed = !Boolean(this.actual);
        this.assert(passed, `Expected ${this.actual} to be falsy`, `Expected ${this.actual} not to be falsy`);
        return this;
    }
    
    toContain(item) {
        let passed = false;
        
        if (Array.isArray(this.actual)) {
            passed = this.actual.includes(item);
        } else if (typeof this.actual === 'string') {
            passed = this.actual.includes(item);
        } else if (this.actual && typeof this.actual.includes === 'function') {
            passed = this.actual.includes(item);
        }
        
        this.assert(passed, `Expected ${this.actual} to contain ${item}`, `Expected ${this.actual} not to contain ${item}`);
        return this;
    }
    
    toHaveLength(length) {
        const actualLength = this.actual && this.actual.length;
        const passed = actualLength === length;
        this.assert(passed, `Expected length ${actualLength} to be ${length}`, `Expected length ${actualLength} not to be ${length}`);
        return this;
    }
    
    toThrow(expectedError) {
        let passed = false;
        let thrownError = null;
        
        try {
            if (typeof this.actual === 'function') {
                this.actual();
            }
        } catch (error) {
            thrownError = error;
            if (expectedError) {
                if (typeof expectedError === 'string') {
                    passed = error.message.includes(expectedError);
                } else if (expectedError instanceof RegExp) {
                    passed = expectedError.test(error.message);
                } else if (typeof expectedError === 'function') {
                    passed = error instanceof expectedError;
                }
            } else {
                passed = true;
            }
        }
        
        this.assert(passed, `Expected function to throw${expectedError ? ' ' + expectedError : ''}`, `Expected function not to throw${expectedError ? ' ' + expectedError : ''}`);
        return this;
    }
    
    toBeInstanceOf(constructor) {
        const passed = this.actual instanceof constructor;
        this.assert(passed, `Expected ${this.actual} to be instance of ${constructor.name}`, `Expected ${this.actual} not to be instance of ${constructor.name}`);
        return this;
    }
    
    toHaveProperty(property, value) {
        const hasProperty = this.actual && this.actual.hasOwnProperty(property);
        let passed = hasProperty;
        
        if (hasProperty && value !== undefined) {
            passed = this.actual[property] === value;
        }
        
        const message = value !== undefined 
            ? `Expected ${JSON.stringify(this.actual)} to have property ${property} with value ${value}`
            : `Expected ${JSON.stringify(this.actual)} to have property ${property}`;
            
        const negatedMessage = value !== undefined 
            ? `Expected ${JSON.stringify(this.actual)} not to have property ${property} with value ${value}`
            : `Expected ${JSON.stringify(this.actual)} not to have property ${property}`;
        
        this.assert(passed, message, negatedMessage);
        return this;
    }
    
    assert(condition, message, negatedMessage) {
        const passed = this.negated ? !condition : condition;
        
        if (!passed) {
            const errorMessage = this.negated ? negatedMessage : message;
            throw new AssertionError(errorMessage);
        }
    }
    
    deepEqual(a, b) {
        if (a === b) return true;
        
        if (a instanceof Date && b instanceof Date) {
            return a.getTime() === b.getTime();
        }
        
        if (!a || !b || (typeof a !== 'object' && typeof b !== 'object')) {
            return a === b;
        }
        
        if (a === null || a === undefined || b === null || b === undefined) {
            return false;
        }
        
        if (a.prototype !== b.prototype) return false;
        
        const keys = Object.keys(a);
        if (keys.length !== Object.keys(b).length) {
            return false;
        }
        
        return keys.every(k => this.deepEqual(a[k], b[k]));
    }
}

class AssertionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AssertionError';
    }
}

// Expect function
function expect(actual) {
    return new Assertion(actual);
}

// Mock and Spy utilities
class Mock {
    constructor(implementation) {
        this.implementation = implementation || (() => {});
        this.calls = [];
        this.returnValue = undefined;
        this.throwError = null;
    }
    
    mockReturnValue(value) {
        this.returnValue = value;
        return this;
    }
    
    mockImplementation(fn) {
        this.implementation = fn;
        return this;
    }
    
    mockThrow(error) {
        this.throwError = error;
        return this;
    }
    
    call(...args) {
        this.calls.push({
            args,
            timestamp: Date.now()
        });
        
        if (this.throwError) {
            throw this.throwError;
        }
        
        if (this.returnValue !== undefined) {
            return this.returnValue;
        }
        
        return this.implementation(...args);
    }
    
    toHaveBeenCalled() {
        return this.calls.length > 0;
    }
    
    toHaveBeenCalledTimes(times) {
        return this.calls.length === times;
    }
    
    toHaveBeenCalledWith(...args) {
        return this.calls.some(call => 
            call.args.length === args.length &&
            call.args.every((arg, index) => arg === args[index])
        );
    }
    
    reset() {
        this.calls = [];
        this.returnValue = undefined;
        this.throwError = null;
    }
}

function createMock(implementation) {
    const mock = new Mock(implementation);
    const mockFunction = (...args) => mock.call(...args);
    
    // Add mock methods to the function
    Object.assign(mockFunction, {
        mockReturnValue: (value) => mock.mockReturnValue(value),
        mockImplementation: (fn) => mock.mockImplementation(fn),
        mockThrow: (error) => mock.mockThrow(error),
        toHaveBeenCalled: () => mock.toHaveBeenCalled(),
        toHaveBeenCalledTimes: (times) => mock.toHaveBeenCalledTimes(times),
        toHaveBeenCalledWith: (...args) => mock.toHaveBeenCalledWith(...args),
        reset: () => mock.reset(),
        calls: mock.calls
    });
    
    return mockFunction;
}

// Test utilities
class TestUtils {
    static async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    static createTestData(template, count = 1) {
        const results = [];
        for (let i = 0; i < count; i++) {
            const data = {};
            Object.keys(template).forEach(key => {
                const value = template[key];
                if (typeof value === 'function') {
                    data[key] = value(i);
                } else {
                    data[key] = value;
                }
            });
            results.push(data);
        }
        return count === 1 ? results[0] : results;
    }
    
    static randomString(length = 10) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    static randomEmail() {
        return `${this.randomString(8)}@${this.randomString(5)}.com`;
    }
    
    static randomNumber(min = 0, max = 100) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.deepClone(item));
        }
        
        const cloned = {};
        Object.keys(obj).forEach(key => {
            cloned[key] = this.deepClone(obj[key]);
        });
        
        return cloned;
    }
}

// Console Reporter
class ConsoleReporter {
    constructor(options = {}) {
        this.options = {
            verbose: false,
            colors: true,
            ...options
        };
    }
    
    onStart() {
        console.log('Starting test run...\n');
    }
    
    onSuiteStart(suite) {
        if (this.options.verbose) {
            console.log(`\n${this.colorize('cyan', suite.name)}`);
        }
    }
    
    onSuiteComplete(suite) {
        // Suite completed
    }
    
    onSuiteError(suite, error) {
        console.error(`\nSuite error in ${suite.name}:`, error.message);
    }
    
    onTestStart(test) {
        if (this.options.verbose) {
            process.stdout.write(`  ${test.name} ... `);
        }
    }
    
    onTestPassed(test) {
        if (this.options.verbose) {
            console.log(this.colorize('green', '✓'));
        } else {
            process.stdout.write(this.colorize('green', '.'));
        }
    }
    
    onTestFailed(test) {
        if (this.options.verbose) {
            console.log(this.colorize('red', '✗'));
            console.log(`    ${this.colorize('red', test.error.message)}`);
        } else {
            process.stdout.write(this.colorize('red', 'F'));
        }
    }
    
    onTestSkipped(test) {
        if (this.options.verbose) {
            console.log(`  ${test.name} ... ${this.colorize('yellow', 'SKIPPED')}`);
        } else {
            process.stdout.write(this.colorize('yellow', 'S'));
        }
    }
    
    onTestRetry(test, attempt) {
        if (this.options.verbose) {
            console.log(`    Retry ${attempt}...`);
        }
    }
    
    onComplete(stats) {
        console.log('\n\nTest Results:');
        console.log(`${this.colorize('green', '✓')} ${stats.passed} passed`);
        console.log(`${this.colorize('red', '✗')} ${stats.failed} failed`);
        console.log(`${this.colorize('yellow', '-')} ${stats.skipped} skipped`);
        console.log(`Total: ${stats.total} tests`);
        console.log(`Duration: ${stats.duration}ms`);
        
        if (stats.failed > 0) {
            console.log(`\n${this.colorize('red', 'FAILED')}`);
        } else {
            console.log(`\n${this.colorize('green', 'PASSED')}`);
        }
    }
    
    onError(error) {
        console.error('\nTest runner error:', error);
    }
    
    colorize(color, text) {
        if (!this.options.colors) {
            return text;
        }
        
        const colors = {
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            cyan: '\x1b[36m',
            reset: '\x1b[0m'
        };
        
        return `${colors[color]}${text}${colors.reset}`;
    }
}

module.exports = {
    TestRunner,
    TestSuite,
    Test,
    expect,
    createMock,
    TestUtils,
    ConsoleReporter,
    AssertionError
};