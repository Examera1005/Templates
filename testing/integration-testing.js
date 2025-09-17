/**
 * Integration Testing Utilities
 * Tools for testing API endpoints, database operations, and service integrations
 * Supports HTTP testing, database mocking, and external service simulation
 */

class IntegrationTestHelper {
    constructor(options = {}) {
        this.options = {
            baseUrl: 'http://localhost:3000',
            timeout: 10000,
            retries: 2,
            ...options
        };
        
        this.cookies = new Map();
        this.headers = new Map();
        this.interceptors = [];
    }
    
    // HTTP Client methods
    async get(url, options = {}) {
        return this.request('GET', url, null, options);
    }
    
    async post(url, data = null, options = {}) {
        return this.request('POST', url, data, options);
    }
    
    async put(url, data = null, options = {}) {
        return this.request('PUT', url, data, options);
    }
    
    async patch(url, data = null, options = {}) {
        return this.request('PATCH', url, data, options);
    }
    
    async delete(url, options = {}) {
        return this.request('DELETE', url, null, options);
    }
    
    async request(method, url, data = null, options = {}) {
        const fullUrl = url.startsWith('http') ? url : `${this.options.baseUrl}${url}`;
        
        const requestOptions = {
            method: method.toUpperCase(),
            headers: {
                'Content-Type': 'application/json',
                ...Object.fromEntries(this.headers),
                ...options.headers
            },
            timeout: options.timeout || this.options.timeout,
            ...options
        };
        
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            requestOptions.body = JSON.stringify(data);
        }
        
        // Add cookies
        if (this.cookies.size > 0) {
            const cookieString = Array.from(this.cookies.entries())
                .map(([key, value]) => `${key}=${value}`)
                .join('; ');
            requestOptions.headers.Cookie = cookieString;
        }
        
        // Apply interceptors
        for (const interceptor of this.interceptors) {
            if (interceptor.request) {
                await interceptor.request(requestOptions);
            }
        }
        
        try {
            const response = await this.fetchWithTimeout(fullUrl, requestOptions);
            
            // Extract cookies from response
            const setCookieHeader = response.headers.get('set-cookie');
            if (setCookieHeader) {
                this.parseCookies(setCookieHeader);
            }
            
            // Parse response body
            let body = null;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                body = await response.json();
            } else {
                body = await response.text();
            }
            
            const result = {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                data: body,
                ok: response.ok
            };
            
            // Apply response interceptors
            for (const interceptor of this.interceptors) {
                if (interceptor.response) {
                    await interceptor.response(result);
                }
            }
            
            return result;
            
        } catch (error) {
            throw new Error(`Request failed: ${error.message}`);
        }
    }
    
    async fetchWithTimeout(url, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    
    parseCookies(setCookieHeader) {
        const cookies = setCookieHeader.split(',');
        cookies.forEach(cookie => {
            const [nameValue] = cookie.split(';');
            const [name, value] = nameValue.split('=');
            if (name && value) {
                this.cookies.set(name.trim(), value.trim());
            }
        });
    }
    
    // Configuration methods
    setHeader(name, value) {
        this.headers.set(name, value);
        return this;
    }
    
    setAuth(token, type = 'Bearer') {
        this.setHeader('Authorization', `${type} ${token}`);
        return this;
    }
    
    setCookie(name, value) {
        this.cookies.set(name, value);
        return this;
    }
    
    clearCookies() {
        this.cookies.clear();
        return this;
    }
    
    addInterceptor(interceptor) {
        this.interceptors.push(interceptor);
        return this;
    }
    
    // Response assertion helpers
    expectStatus(response, expectedStatus) {
        if (response.status !== expectedStatus) {
            throw new Error(`Expected status ${expectedStatus} but got ${response.status}`);
        }
        return this;
    }
    
    expectJson(response) {
        if (typeof response.data !== 'object') {
            throw new Error('Expected JSON response but got non-object data');
        }
        return this;
    }
    
    expectProperty(response, property, value = undefined) {
        if (!response.data || !response.data.hasOwnProperty(property)) {
            throw new Error(`Expected response to have property '${property}'`);
        }
        
        if (value !== undefined && response.data[property] !== value) {
            throw new Error(`Expected property '${property}' to be '${value}' but got '${response.data[property]}'`);
        }
        
        return this;
    }
    
    expectArray(response, property = null) {
        const data = property ? response.data[property] : response.data;
        
        if (!Array.isArray(data)) {
            throw new Error(`Expected ${property ? `property '${property}'` : 'response data'} to be an array`);
        }
        
        return this;
    }
    
    expectLength(response, expectedLength, property = null) {
        const data = property ? response.data[property] : response.data;
        
        if (!data || typeof data.length !== 'number') {
            throw new Error('Cannot check length on non-array/string data');
        }
        
        if (data.length !== expectedLength) {
            throw new Error(`Expected length ${expectedLength} but got ${data.length}`);
        }
        
        return this;
    }
}

// Database Test Helper
class DatabaseTestHelper {
    constructor(dbManager) {
        this.db = dbManager;
        this.fixtures = new Map();
        this.cleanup = [];
    }
    
    // Fixture management
    async loadFixtures(fixtures) {
        for (const [table, records] of Object.entries(fixtures)) {
            await this.insertFixtures(table, records);
        }
    }
    
    async insertFixtures(table, records) {
        const insertedRecords = [];
        
        for (const record of records) {
            const result = await this.db.query(
                `INSERT INTO ${table} (${Object.keys(record).join(', ')}) VALUES (${Object.keys(record).map(() => '?').join(', ')})`,
                Object.values(record)
            );
            
            // Store for cleanup
            insertedRecords.push({
                table,
                id: result.insertId || record.id
            });
        }
        
        this.cleanup.push(...insertedRecords);
        this.fixtures.set(table, records);
        
        return insertedRecords;
    }
    
    async cleanupFixtures() {
        // Clean up in reverse order
        for (const record of this.cleanup.reverse()) {
            try {
                await this.db.query(`DELETE FROM ${record.table} WHERE id = ?`, [record.id]);
            } catch (error) {
                console.warn(`Failed to cleanup record ${record.id} from ${record.table}:`, error.message);
            }
        }
        
        this.cleanup = [];
        this.fixtures.clear();
    }
    
    // Transaction helpers
    async inTransaction(callback) {
        return await this.db.transaction(callback);
    }
    
    async rollbackAfterTest(callback) {
        try {
            await this.db.query('BEGIN');
            await callback();
        } finally {
            await this.db.query('ROLLBACK');
        }
    }
    
    // Query helpers
    async expectRecordExists(table, conditions) {
        const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
        const result = await this.db.query(
            `SELECT COUNT(*) as count FROM ${table} WHERE ${whereClause}`,
            Object.values(conditions)
        );
        
        if (result[0].count === 0) {
            throw new Error(`Expected record to exist in ${table} with conditions ${JSON.stringify(conditions)}`);
        }
        
        return this;
    }
    
    async expectRecordCount(table, expectedCount, conditions = {}) {
        let query = `SELECT COUNT(*) as count FROM ${table}`;
        const params = [];
        
        if (Object.keys(conditions).length > 0) {
            const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
            query += ` WHERE ${whereClause}`;
            params.push(...Object.values(conditions));
        }
        
        const result = await this.db.query(query, params);
        
        if (result[0].count !== expectedCount) {
            throw new Error(`Expected ${expectedCount} records in ${table} but found ${result[0].count}`);
        }
        
        return this;
    }
    
    async getRecord(table, conditions) {
        const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
        const result = await this.db.query(
            `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`,
            Object.values(conditions)
        );
        
        return result[0] || null;
    }
    
    async getAllRecords(table, conditions = {}) {
        let query = `SELECT * FROM ${table}`;
        const params = [];
        
        if (Object.keys(conditions).length > 0) {
            const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
            query += ` WHERE ${whereClause}`;
            params.push(...Object.values(conditions));
        }
        
        return await this.db.query(query, params);
    }
}

// Service Mock Helper
class ServiceMockHelper {
    constructor() {
        this.mocks = new Map();
        this.interceptedRequests = [];
    }
    
    // HTTP service mocking
    mockHttpService(baseUrl, responses) {
        const originalFetch = global.fetch;
        
        global.fetch = async (url, options = {}) => {
            // Check if this URL should be mocked
            if (url.startsWith(baseUrl)) {
                const path = url.replace(baseUrl, '');
                const method = (options.method || 'GET').toUpperCase();
                const key = `${method} ${path}`;
                
                // Store request for verification
                this.interceptedRequests.push({
                    url,
                    method,
                    path,
                    options,
                    timestamp: Date.now()
                });
                
                // Find matching mock response
                const mockResponse = responses[key] || responses[path];
                
                if (mockResponse) {
                    return this.createMockResponse(mockResponse);
                }
            }
            
            // Fall back to original fetch
            return originalFetch(url, options);
        };
        
        this.mocks.set('fetch', originalFetch);
    }
    
    createMockResponse(mockConfig) {
        const {
            status = 200,
            statusText = 'OK',
            headers = {},
            data = {},
            delay = 0
        } = mockConfig;
        
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    status,
                    statusText,
                    ok: status >= 200 && status < 300,
                    headers: new Map(Object.entries(headers)),
                    json: async () => data,
                    text: async () => typeof data === 'string' ? data : JSON.stringify(data)
                });
            }, delay);
        });
    }
    
    // Database service mocking
    mockDatabaseService(dbManager, queries) {
        const originalQuery = dbManager.query.bind(dbManager);
        
        dbManager.query = async (sql, params = []) => {
            // Check if this query should be mocked
            const normalizedSql = sql.replace(/\s+/g, ' ').trim().toLowerCase();
            
            for (const [pattern, mockResult] of Object.entries(queries)) {
                const normalizedPattern = pattern.replace(/\s+/g, ' ').trim().toLowerCase();
                
                if (normalizedSql.includes(normalizedPattern)) {
                    // Store query for verification
                    this.interceptedRequests.push({
                        type: 'database',
                        sql,
                        params,
                        timestamp: Date.now()
                    });
                    
                    if (typeof mockResult === 'function') {
                        return await mockResult(sql, params);
                    } else {
                        return mockResult;
                    }
                }
            }
            
            // Fall back to original query
            return await originalQuery(sql, params);
        };
        
        this.mocks.set('database', originalQuery);
    }
    
    // Email service mocking
    mockEmailService(emailService) {
        const sentEmails = [];
        
        const originalSend = emailService.send.bind(emailService);
        
        emailService.send = async (to, subject, content, options = {}) => {
            sentEmails.push({
                to,
                subject,
                content,
                options,
                timestamp: Date.now()
            });
            
            // Simulate successful send
            return {
                messageId: `mock-${Date.now()}`,
                status: 'sent'
            };
        };
        
        this.mocks.set('email', {
            original: originalSend,
            sentEmails
        });
        
        return sentEmails;
    }
    
    // File system mocking
    mockFileSystem(fs) {
        const fileOperations = [];
        
        const originalWriteFile = fs.writeFile;
        const originalReadFile = fs.readFile;
        const originalUnlink = fs.unlink;
        
        fs.writeFile = (path, data, callback) => {
            fileOperations.push({
                operation: 'writeFile',
                path,
                data,
                timestamp: Date.now()
            });
            
            // Simulate successful write
            if (callback) callback(null);
        };
        
        fs.readFile = (path, callback) => {
            fileOperations.push({
                operation: 'readFile',
                path,
                timestamp: Date.now()
            });
            
            // Return mock file content
            if (callback) callback(null, `mock content for ${path}`);
        };
        
        fs.unlink = (path, callback) => {
            fileOperations.push({
                operation: 'unlink',
                path,
                timestamp: Date.now()
            });
            
            // Simulate successful deletion
            if (callback) callback(null);
        };
        
        this.mocks.set('filesystem', {
            originalWriteFile,
            originalReadFile,
            originalUnlink,
            fileOperations
        });
        
        return fileOperations;
    }
    
    // Verification methods
    expectHttpRequest(method, path, times = 1) {
        const requests = this.interceptedRequests.filter(req => 
            req.method === method.toUpperCase() && req.path === path
        );
        
        if (requests.length !== times) {
            throw new Error(`Expected ${times} ${method} requests to ${path} but found ${requests.length}`);
        }
        
        return requests;
    }
    
    expectDatabaseQuery(pattern, times = 1) {
        const queries = this.interceptedRequests.filter(req => 
            req.type === 'database' && req.sql.toLowerCase().includes(pattern.toLowerCase())
        );
        
        if (queries.length !== times) {
            throw new Error(`Expected ${times} database queries matching '${pattern}' but found ${queries.length}`);
        }
        
        return queries;
    }
    
    getInterceptedRequests(type = null) {
        if (type) {
            return this.interceptedRequests.filter(req => req.type === type);
        }
        return [...this.interceptedRequests];
    }
    
    // Cleanup
    restoreAll() {
        // Restore fetch
        if (this.mocks.has('fetch')) {
            global.fetch = this.mocks.get('fetch');
        }
        
        // Restore other mocked services
        for (const [service, mock] of this.mocks) {
            if (service === 'email' && mock.original) {
                // Restore email service
            }
            if (service === 'filesystem') {
                // Restore file system methods
                if (typeof require !== 'undefined') {
                    const fs = require('fs');
                    fs.writeFile = mock.originalWriteFile;
                    fs.readFile = mock.originalReadFile;
                    fs.unlink = mock.originalUnlink;
                }
            }
        }
        
        this.mocks.clear();
        this.interceptedRequests = [];
    }
}

// Integration Test Suite
class IntegrationTestSuite {
    constructor(options = {}) {
        this.options = {
            setupTimeout: 30000,
            teardownTimeout: 10000,
            ...options
        };
        
        this.httpClient = new IntegrationTestHelper(options.http || {});
        this.dbHelper = null;
        this.mockHelper = new ServiceMockHelper();
        this.setupComplete = false;
    }
    
    setDatabase(dbManager) {
        this.dbHelper = new DatabaseTestHelper(dbManager);
        return this;
    }
    
    async setup() {
        if (this.setupComplete) return;
        
        // Database setup
        if (this.dbHelper) {
            // Clean up any existing test data
            await this.dbHelper.cleanupFixtures();
        }
        
        this.setupComplete = true;
    }
    
    async teardown() {
        if (!this.setupComplete) return;
        
        // Clean up database
        if (this.dbHelper) {
            await this.dbHelper.cleanupFixtures();
        }
        
        // Restore mocked services
        this.mockHelper.restoreAll();
        
        this.setupComplete = false;
    }
    
    // Test helpers
    async testEndpoint(method, url, data = null, expectedStatus = 200) {
        const response = await this.httpClient.request(method, url, data);
        this.httpClient.expectStatus(response, expectedStatus);
        return response;
    }
    
    async testAuthenticatedEndpoint(method, url, token, data = null, expectedStatus = 200) {
        this.httpClient.setAuth(token);
        const response = await this.testEndpoint(method, url, data, expectedStatus);
        return response;
    }
    
    async testCrudOperations(resource, testData) {
        const results = {};
        
        // Create
        results.created = await this.testEndpoint('POST', `/${resource}`, testData, 201);
        const createdId = results.created.data.id;
        
        // Read
        results.read = await this.testEndpoint('GET', `/${resource}/${createdId}`, null, 200);
        
        // Update
        const updateData = { ...testData, name: `${testData.name} Updated` };
        results.updated = await this.testEndpoint('PUT', `/${resource}/${createdId}`, updateData, 200);
        
        // List
        results.list = await this.testEndpoint('GET', `/${resource}`, null, 200);
        this.httpClient.expectArray(results.list);
        
        // Delete
        results.deleted = await this.testEndpoint('DELETE', `/${resource}/${createdId}`, null, 204);
        
        return results;
    }
}

module.exports = {
    IntegrationTestHelper,
    DatabaseTestHelper,
    ServiceMockHelper,
    IntegrationTestSuite
};