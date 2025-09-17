# Database Templates

A comprehensive database library providing connection management, query building, migrations, and ORM functionality for multiple database systems.

## Overview

This database library supports:
- **Connection Management**: Universal connection pooling for MySQL, PostgreSQL, SQLite, MongoDB, and Redis
- **Query Builder**: Fluent SQL query builder with support for complex joins and conditions
- **Migrations**: Schema versioning and rollback system
- **ORM**: Simple Object-Relational Mapping with Active Record pattern

## Modules

### 1. Connection Manager (`connection-manager.js`)

#### DatabaseManager Class
Universal database connection manager with pooling:

```javascript
const { DatabaseManager, DatabaseFactory } = require('./connection-manager');

// Create MySQL connection
const mysql = DatabaseFactory.createMySQL({
    host: 'localhost',
    port: 3306,
    username: 'user',
    password: 'password',
    database: 'myapp',
    maxConnections: 10
});

await mysql.connect();

// Execute queries
const users = await mysql.query('SELECT * FROM users WHERE active = ?', [true]);

// Transaction support
await mysql.transaction(async (db) => {
    await db.query('INSERT INTO users (name, email) VALUES (?, ?)', ['John', 'john@example.com']);
    await db.query('INSERT INTO profiles (user_id, bio) VALUES (?, ?)', [1, 'Developer']);
});

await mysql.close();
```

#### Supported Databases
- **MySQL**: Native connection with connection pooling
- **PostgreSQL**: Full-featured PostgreSQL support
- **SQLite**: File-based database with zero configuration
- **MongoDB**: Document database with collection operations
- **Redis**: Key-value store with caching capabilities

#### Connection Examples

```javascript
// PostgreSQL
const postgres = DatabaseFactory.createPostgreSQL({
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'password',
    database: 'myapp'
});

// SQLite
const sqlite = DatabaseFactory.createSQLite({
    database: './data/app.db'
});

// MongoDB
const mongo = DatabaseFactory.createMongoDB({
    host: 'localhost',
    port: 27017,
    database: 'myapp'
});

// MongoDB operations
await mongo.query('users', {
    type: 'find',
    filter: { active: true }
});

await mongo.query('users', {
    type: 'insert',
    document: { name: 'John', email: 'john@example.com' }
});

// Redis
const redis = DatabaseFactory.createRedis({
    host: 'localhost',
    port: 6379,
    password: 'secret'
});

await redis.query('set', ['user:1', JSON.stringify({ name: 'John' })]);
const user = await redis.query('get', ['user:1']);
```

### 2. Query Builder (`query-builder.js`)

#### QueryBuilder Class
Fluent SQL query builder supporting complex queries:

```javascript
const { QueryBuilder, QueryBuilderFactory } = require('./query-builder');

const qb = QueryBuilderFactory.mysql();

// SELECT queries
const userQuery = qb.select(['id', 'name', 'email'])
    .from('users')
    .where('active', true)
    .where('age', '>', 18)
    .orderBy('created_at', 'DESC')
    .limit(10)
    .build();

console.log(userQuery.query); // SELECT id, name, email FROM users WHERE active = ? AND age > ? ORDER BY created_at DESC LIMIT 10
console.log(userQuery.parameters); // [true, 18]

// Complex JOIN queries
const orderQuery = qb.select(['o.id', 'o.total', 'u.name', 'p.name as product'])
    .from('orders o')
    .leftJoin('users u', 'o.user_id = u.id')
    .leftJoin('order_items oi', 'o.id = oi.order_id')
    .leftJoin('products p', 'oi.product_id = p.id')
    .where('o.status', 'completed')
    .groupBy(['o.id'])
    .having('o.total', '>', 100)
    .build();

// INSERT queries
const insertQuery = qb.insert({
    name: 'John Doe',
    email: 'john@example.com',
    active: true
}).into('users').build();

// UPDATE queries
const updateQuery = qb.update('users')
    .set({ name: 'Jane Doe', updated_at: new Date() })
    .where('id', 1)
    .build();

// DELETE queries
const deleteQuery = qb.delete()
    .from('users')
    .where('active', false)
    .where('last_login', '<', '2023-01-01')
    .build();
```

#### Advanced Features

```javascript
// WHERE conditions
qb.select().from('users')
    .where('name', 'John')
    .orWhere('email', 'john@example.com')
    .whereIn('status', ['active', 'pending'])
    .whereNotNull('email_verified_at')
    .whereBetween('age', 18, 65)
    .whereLike('name', '%john%')
    .build();

// Bulk insert
const bulkInsert = qb.insert([
    { name: 'User 1', email: 'user1@example.com' },
    { name: 'User 2', email: 'user2@example.com' },
    { name: 'User 3', email: 'user3@example.com' }
]).into('users').build();

// Pagination helper
const paginatedQuery = qb.paginate('users', 2, 10, { active: true });

// Aggregation functions
const userCount = qb.count('users', '*', { active: true });
const averageAge = qb.avg('users', 'age', { active: true });
const maxSalary = qb.max('employees', 'salary', { department: 'engineering' });
```

#### Relational Query Builder

```javascript
const { RelationalQueryBuilder } = require('./query-builder');

const rqb = new RelationalQueryBuilder('mysql');

// Define relationships
rqb.hasMany('posts', 'id', 'user_id')
   .belongsTo('profile', 'profile_id', 'id');

// Load with relationships
const userWithPosts = rqb.select().from('users')
    .with(['posts', 'profile'])
    .where('id', 1)
    .buildWithRelations();
```

### 3. Migrations (`migrations.js`)

#### Migration Class
Database schema versioning and management:

```javascript
const { Migration, MigrationRunner, TableBuilder } = require('./migrations');

// Create a migration
const createUsersTable = new Migration('create_users_table');

createUsersTable.createTable('users', (table) => {
    table.id();
    table.string('name', 100);
    table.string('email', 150, { unique: true });
    table.string('password');
    table.boolean('active', { default: true });
    table.timestamp('email_verified_at', { nullable: true });
    table.timestamps();
});

// Add indexes
createUsersTable.addIndex('users', ['email'], { unique: true });
createUsersTable.addIndex('users', ['name', 'active']);

// Add foreign key
createUsersTable.addForeignKey('users', 'profile_id', 'profiles', 'id', {
    onDelete: 'CASCADE'
});

console.log('Up queries:', createUsersTable.getUpQueries());
console.log('Down queries:', createUsersTable.getDownQueries());
```

#### Migration Runner

```javascript
// Initialize migration runner
const runner = new MigrationRunner(dbManager);

// Run migrations
await runner.run(createUsersTable);

// Rollback migrations
await runner.rollback(createUsersTable);

// Get migration status
const executed = await runner.getExecutedMigrations();
const lastMigration = await runner.getLastMigration();

// Run all pending migrations
const migrations = [createUsersTable, createPostsTable, addUserIndexes];
const pendingCount = await runner.runPending(migrations);
```

#### Migration Generator

```javascript
const { MigrationGenerator } = require('./migrations');

const generator = new MigrationGenerator('mysql');

// Generate table creation migration
const usersMigration = generator.generateCreateTable('users', [
    { name: 'name', type: 'string', length: 100 },
    { name: 'email', type: 'string', length: 150, options: { unique: true } },
    { name: 'age', type: 'integer', options: { nullable: true } },
    { name: 'active', type: 'boolean', options: { default: true } }
]);

// Generate column addition migration
const addColumnMigration = generator.generateAddColumn('users', 'phone', 'VARCHAR(20)', {
    nullable: true
});

// Generate index migration
const indexMigration = generator.generateAddIndex('users', ['email', 'active'], {
    name: 'idx_users_email_active'
});
```

### 4. ORM (`orm.js`)

#### Model Class
Simple Object-Relational Mapping with Active Record pattern:

```javascript
const { Model } = require('./orm');

class User extends Model {
    static get tableName() {
        return 'users';
    }
    
    static get fillable() {
        return ['name', 'email', 'password', 'active'];
    }
    
    static get hidden() {
        return ['password'];
    }
    
    static get casts() {
        return {
            active: 'boolean',
            created_at: 'date'
        };
    }
    
    // Define relationships
    posts() {
        return this.hasMany(Post, 'user_id');
    }
    
    profile() {
        return this.belongsTo(Profile, 'profile_id');
    }
    
    roles() {
        return this.belongsToMany(Role, 'user_roles', 'user_id', 'role_id');
    }
}

// Set database connection
User.setConnection(dbManager);
```

#### Model Usage

```javascript
// Create new user
const user = new User({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashed_password'
});

await user.save();

// Find users
const user = await User.find(1);
const activeUsers = await User.where('active', true);
const allUsers = await User.all();

// Create directly
const newUser = await User.create({
    name: 'Jane Doe',
    email: 'jane@example.com'
});

// Update
user.name = 'John Smith';
await user.save();

// Delete
await user.delete();

// Relationships
const userPosts = await user.posts().get();
const userProfile = await user.profile().get();

// Create related models
await user.posts().create({
    title: 'My First Post',
    content: 'Hello, world!'
});

// Many-to-many relationships
await user.roles().attach(adminRole);
await user.roles().detach(guestRole);
```

#### Advanced Model Features

```javascript
// Pagination
const paginatedUsers = await User.paginate(1, 10, { active: true });
console.log(paginatedUsers.data); // Array of users
console.log(paginatedUsers.total); // Total count
console.log(paginatedUsers.hasNextPage); // Boolean

// Count and aggregates
const userCount = await User.count({ active: true });

// Update or create
const user = await User.updateOrCreate(
    { email: 'john@example.com' },
    { name: 'John Updated', active: true }
);

// Reload from database
await user.reload();

// JSON serialization
const json = user.toJSON(); // Excludes hidden fields
```

#### Model Factory

```javascript
const { ModelFactory } = require('./orm');

const userFactory = new ModelFactory(User);

userFactory.define('default', () => ({
    name: 'Test User',
    email: `user${Date.now()}@example.com`,
    active: true
}));

userFactory.define('admin', () => ({
    name: 'Admin User',
    email: `admin${Date.now()}@example.com`,
    active: true,
    role: 'admin'
}));

// Create test users
const user = userFactory.create('default');
const savedUser = await userFactory.make('admin');
const manyUsers = await userFactory.makeMany('default', 5);
```

## Complete Application Example

### Setup Database Connection

```javascript
const { DatabaseFactory } = require('./database/connection-manager');
const { Model } = require('./database/orm');

// Initialize database
const db = DatabaseFactory.createMySQL({
    host: 'localhost',
    username: 'root',
    password: 'password',
    database: 'blog_app'
});

await db.connect();

// Set global connection for models
Model.setConnection(db);
```

### Define Models

```javascript
class User extends Model {
    static get tableName() { return 'users'; }
    static get fillable() { return ['name', 'email', 'password']; }
    static get hidden() { return ['password']; }
    
    posts() {
        return this.hasMany(Post, 'user_id');
    }
    
    profile() {
        return this.belongsTo(Profile, 'profile_id');
    }
}

class Post extends Model {
    static get tableName() { return 'posts'; }
    static get fillable() { return ['title', 'content', 'user_id', 'published']; }
    static get casts() { return { published: 'boolean' }; }
    
    author() {
        return this.belongsTo(User, 'user_id');
    }
    
    tags() {
        return this.belongsToMany(Tag, 'post_tags', 'post_id', 'tag_id');
    }
}

class Tag extends Model {
    static get tableName() { return 'tags'; }
    static get fillable() { return ['name', 'slug']; }
    
    posts() {
        return this.belongsToMany(Post, 'post_tags', 'tag_id', 'post_id');
    }
}
```

### Create Migrations

```javascript
const { Migration, MigrationRunner } = require('./database/migrations');

// Users table migration
const createUsersTable = new Migration('create_users_table');
createUsersTable.createTable('users', (table) => {
    table.id();
    table.string('name', 100);
    table.string('email', 150, { unique: true });
    table.string('password');
    table.bigInteger('profile_id', { nullable: true });
    table.timestamps();
});

// Posts table migration
const createPostsTable = new Migration('create_posts_table');
createPostsTable.createTable('posts', (table) => {
    table.id();
    table.string('title', 200);
    table.text('content');
    table.bigInteger('user_id');
    table.boolean('published', { default: false });
    table.timestamps();
});

createPostsTable.addForeignKey('posts', 'user_id', 'users', 'id', {
    onDelete: 'CASCADE'
});

// Run migrations
const runner = new MigrationRunner(db);
await runner.run(createUsersTable);
await runner.run(createPostsTable);
```

### Application Logic

```javascript
// Create user with posts
const user = await User.create({
    name: 'John Blogger',
    email: 'john@blog.com',
    password: 'hashed_password'
});

const post = await user.posts().create({
    title: 'My First Blog Post',
    content: 'This is the content of my first blog post...',
    published: true
});

// Query with relationships
const publishedPosts = await Post.where('published', true);
for (const post of publishedPosts) {
    const author = await post.author().get();
    console.log(`${post.title} by ${author.name}`);
}

// Complex queries with query builder
const { QueryBuilderFactory } = require('./database/query-builder');

const qb = QueryBuilderFactory.mysql();
const popularPosts = qb.select(['p.title', 'u.name as author', 'COUNT(c.id) as comment_count'])
    .from('posts p')
    .leftJoin('users u', 'p.user_id = u.id')
    .leftJoin('comments c', 'p.id = c.post_id')
    .where('p.published', true)
    .groupBy(['p.id'])
    .having('comment_count', '>', 5)
    .orderBy('comment_count', 'DESC')
    .limit(10)
    .build();

const results = await db.query(popularPosts.query, popularPosts.parameters);
```

### API Integration

```javascript
// Express.js API endpoints
app.get('/api/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const users = await User.paginate(page, 20);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json(user.toJSON());
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findOrFail(req.params.id);
        const author = await post.author().get();
        const tags = await post.tags().get();
        
        res.json({
            ...post.toJSON(),
            author: author.toJSON(),
            tags: tags.map(tag => tag.toJSON())
        });
    } catch (error) {
        res.status(404).json({ error: 'Post not found' });
    }
});
```

## Database-Specific Features

### MySQL Features
- AUTO_INCREMENT support
- ENGINE and charset specification
- MySQL-specific data types (TINYINT, MEDIUMTEXT, etc.)
- ON UPDATE CURRENT_TIMESTAMP for timestamps

### PostgreSQL Features
- SERIAL and BIGSERIAL for auto-increment
- Advanced data types (JSONB, ARRAY, etc.)
- PostgreSQL-specific operators and functions
- Schema support

### SQLite Features
- File-based database (no server required)
- Full-text search capabilities
- WAL mode for better concurrency
- Simplified data types

### MongoDB Features
- Document-based operations
- Collection methods (find, insert, update, delete)
- Aggregation pipeline support
- GridFS for file storage

### Redis Features
- Key-value operations
- Data structure support (lists, sets, hashes)
- Pub/Sub messaging
- Expiration and TTL support

## Performance Optimization

### Connection Pooling
```javascript
const db = DatabaseFactory.createMySQL({
    host: 'localhost',
    username: 'user',
    password: 'password',
    database: 'app',
    maxConnections: 20,     // Pool size
    timeout: 30000,         // Connection timeout
    acquireTimeoutMillis: 30000,  // Pool acquire timeout
    idleTimeoutMillis: 600000     // Idle connection timeout
});
```

### Query Optimization
```javascript
// Use indexes effectively
const qb = QueryBuilderFactory.mysql();

// Index on frequently queried columns
const query = qb.select().from('users')
    .where('email', 'user@example.com')  // email should be indexed
    .where('active', true)               // composite index on (email, active)
    .build();

// Limit results for pagination
const paginatedQuery = qb.select().from('posts')
    .where('published', true)
    .orderBy('created_at', 'DESC')
    .limit(20)                          // Always limit large result sets
    .offset(60)
    .build();
```

### Batch Operations
```javascript
// Bulk insert for better performance
const users = [
    { name: 'User 1', email: 'user1@example.com' },
    { name: 'User 2', email: 'user2@example.com' },
    // ... more users
];

const bulkInsert = qb.insert(users).into('users').build();
await db.query(bulkInsert.query, bulkInsert.parameters);
```

## Security Best Practices

### SQL Injection Prevention
- Always use parameterized queries
- Never concatenate user input directly into SQL
- Validate and sanitize input data

```javascript
// GOOD: Parameterized query
const users = await db.query('SELECT * FROM users WHERE email = ?', [userEmail]);

// BAD: String concatenation
// const users = await db.query(`SELECT * FROM users WHERE email = '${userEmail}'`);
```

### Data Validation
```javascript
class User extends Model {
    static get fillable() {
        return ['name', 'email', 'password'];
    }
    
    // Override save to add validation
    async save() {
        this.validate();
        return super.save();
    }
    
    validate() {
        if (!this.attributes.email || !this.attributes.email.includes('@')) {
            throw new Error('Invalid email address');
        }
        
        if (!this.attributes.name || this.attributes.name.length < 2) {
            throw new Error('Name must be at least 2 characters');
        }
    }
}
```

### Password Security
```javascript
const bcrypt = require('bcrypt');

class User extends Model {
    async setPassword(plainPassword) {
        this.attributes.password = await bcrypt.hash(plainPassword, 12);
    }
    
    async verifyPassword(plainPassword) {
        return await bcrypt.compare(plainPassword, this.attributes.password);
    }
}
```

## Browser Support

- **Node.js**: Full support (recommended environment)
- **Browser**: Limited support (connection management not available)
- **Electron**: Full support
- **React Native**: Limited support (SQLite only)

## Dependencies

This library is designed to work with zero external dependencies, providing fallback implementations when database drivers are not available. For production use, install appropriate database drivers:

```bash
# MySQL
npm install mysql2

# PostgreSQL
npm install pg

# SQLite
npm install sqlite3

# MongoDB
npm install mongodb

# Redis
npm install redis
```