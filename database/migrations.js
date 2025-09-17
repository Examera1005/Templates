/**
 * Database Migration System
 * Handles schema changes, versioning, and rollbacks
 * Supports MySQL, PostgreSQL, and SQLite
 */

class Migration {
    constructor(name, dialect = 'mysql') {
        this.name = name;
        this.dialect = dialect;
        this.version = Date.now();
        this.upQueries = [];
        this.downQueries = [];
    }
    
    // Schema creation methods
    createTable(tableName, callback) {
        const tableBuilder = new TableBuilder(tableName, this.dialect);
        callback(tableBuilder);
        
        this.upQueries.push(tableBuilder.buildCreate());
        this.downQueries.unshift(`DROP TABLE IF EXISTS ${tableName}`);
        
        return this;
    }
    
    dropTable(tableName) {
        this.upQueries.push(`DROP TABLE IF EXISTS ${tableName}`);
        // Note: Cannot automatically generate recreate query for rollback
        this.downQueries.unshift(`-- Cannot auto-generate table recreation for ${tableName}`);
        return this;
    }
    
    addColumn(tableName, columnName, type, options = {}) {
        const columnDef = this.buildColumnDefinition(columnName, type, options);
        this.upQueries.push(`ALTER TABLE ${tableName} ADD COLUMN ${columnDef}`);
        this.downQueries.unshift(`ALTER TABLE ${tableName} DROP COLUMN ${columnName}`);
        return this;
    }
    
    dropColumn(tableName, columnName) {
        this.upQueries.push(`ALTER TABLE ${tableName} DROP COLUMN ${columnName}`);
        this.downQueries.unshift(`-- Cannot auto-generate column recreation for ${tableName}.${columnName}`);
        return this;
    }
    
    modifyColumn(tableName, columnName, type, options = {}) {
        const columnDef = this.buildColumnDefinition(columnName, type, options);
        
        if (this.dialect === 'mysql') {
            this.upQueries.push(`ALTER TABLE ${tableName} MODIFY COLUMN ${columnDef}`);
        } else if (this.dialect === 'postgresql') {
            this.upQueries.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} TYPE ${type}`);
        } else if (this.dialect === 'sqlite') {
            // SQLite doesn't support ALTER COLUMN, need to recreate table
            this.upQueries.push(`-- SQLite ALTER COLUMN not supported for ${tableName}.${columnName}`);
        }
        
        this.downQueries.unshift(`-- Cannot auto-generate column modification rollback for ${tableName}.${columnName}`);
        return this;
    }
    
    addIndex(tableName, columns, options = {}) {
        const indexName = options.name || `idx_${tableName}_${columns.join('_')}`;
        const unique = options.unique ? 'UNIQUE ' : '';
        const columnList = Array.isArray(columns) ? columns.join(', ') : columns;
        
        this.upQueries.push(`CREATE ${unique}INDEX ${indexName} ON ${tableName} (${columnList})`);
        this.downQueries.unshift(`DROP INDEX ${indexName}`);
        return this;
    }
    
    dropIndex(indexName) {
        this.upQueries.push(`DROP INDEX ${indexName}`);
        this.downQueries.unshift(`-- Cannot auto-generate index recreation for ${indexName}`);
        return this;
    }
    
    addForeignKey(tableName, column, referencedTable, referencedColumn, options = {}) {
        const constraintName = options.name || `fk_${tableName}_${column}`;
        const onDelete = options.onDelete || 'RESTRICT';
        const onUpdate = options.onUpdate || 'RESTRICT';
        
        if (this.dialect === 'sqlite') {
            this.upQueries.push(`-- SQLite foreign key constraints must be defined at table creation`);
        } else {
            this.upQueries.push(
                `ALTER TABLE ${tableName} ADD CONSTRAINT ${constraintName} ` +
                `FOREIGN KEY (${column}) REFERENCES ${referencedTable}(${referencedColumn}) ` +
                `ON DELETE ${onDelete} ON UPDATE ${onUpdate}`
            );
        }
        
        this.downQueries.unshift(`ALTER TABLE ${tableName} DROP CONSTRAINT ${constraintName}`);
        return this;
    }
    
    raw(upQuery, downQuery = null) {
        this.upQueries.push(upQuery);
        if (downQuery) {
            this.downQueries.unshift(downQuery);
        }
        return this;
    }
    
    buildColumnDefinition(columnName, type, options = {}) {
        let definition = `${columnName} ${type}`;
        
        if (options.notNull || options.required) {
            definition += ' NOT NULL';
        }
        
        if (options.default !== undefined) {
            if (typeof options.default === 'string' && options.default.toLowerCase() !== 'null') {
                definition += ` DEFAULT '${options.default}'`;
            } else {
                definition += ` DEFAULT ${options.default}`;
            }
        }
        
        if (options.autoIncrement || options.primaryKey) {
            if (this.dialect === 'mysql') {
                definition += ' AUTO_INCREMENT';
            } else if (this.dialect === 'postgresql') {
                definition = definition.replace(type, 'SERIAL');
            } else if (this.dialect === 'sqlite') {
                definition += ' AUTOINCREMENT';
            }
        }
        
        if (options.primaryKey) {
            definition += ' PRIMARY KEY';
        }
        
        if (options.unique) {
            definition += ' UNIQUE';
        }
        
        return definition;
    }
    
    getUpQueries() {
        return this.upQueries;
    }
    
    getDownQueries() {
        return this.downQueries;
    }
}

class TableBuilder {
    constructor(tableName, dialect = 'mysql') {
        this.tableName = tableName;
        this.dialect = dialect;
        this.columns = [];
        this.indexes = [];
        this.foreignKeys = [];
        this.primaryKeys = [];
    }
    
    // Column types
    id(columnName = 'id') {
        const type = this.dialect === 'postgresql' ? 'SERIAL' : 'INT';
        return this.integer(columnName, { primaryKey: true, autoIncrement: true });
    }
    
    string(columnName, length = 255, options = {}) {
        const type = `VARCHAR(${length})`;
        return this.addColumn(columnName, type, options);
    }
    
    text(columnName, options = {}) {
        return this.addColumn(columnName, 'TEXT', options);
    }
    
    integer(columnName, options = {}) {
        const type = this.dialect === 'postgresql' && options.autoIncrement ? 'SERIAL' : 'INT';
        return this.addColumn(columnName, type, options);
    }
    
    bigInteger(columnName, options = {}) {
        const type = this.dialect === 'postgresql' && options.autoIncrement ? 'BIGSERIAL' : 'BIGINT';
        return this.addColumn(columnName, type, options);
    }
    
    decimal(columnName, precision = 8, scale = 2, options = {}) {
        return this.addColumn(columnName, `DECIMAL(${precision},${scale})`, options);
    }
    
    float(columnName, options = {}) {
        return this.addColumn(columnName, 'FLOAT', options);
    }
    
    double(columnName, options = {}) {
        return this.addColumn(columnName, 'DOUBLE', options);
    }
    
    boolean(columnName, options = {}) {
        const type = this.dialect === 'mysql' ? 'TINYINT(1)' : 'BOOLEAN';
        return this.addColumn(columnName, type, options);
    }
    
    date(columnName, options = {}) {
        return this.addColumn(columnName, 'DATE', options);
    }
    
    dateTime(columnName, options = {}) {
        const type = this.dialect === 'mysql' ? 'DATETIME' : 'TIMESTAMP';
        return this.addColumn(columnName, type, options);
    }
    
    timestamp(columnName, options = {}) {
        return this.addColumn(columnName, 'TIMESTAMP', options);
    }
    
    timestamps() {
        this.timestamp('created_at', { default: 'CURRENT_TIMESTAMP' });
        this.timestamp('updated_at', { 
            default: this.dialect === 'mysql' ? 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' : 'CURRENT_TIMESTAMP' 
        });
        return this;
    }
    
    json(columnName, options = {}) {
        const type = this.dialect === 'mysql' ? 'JSON' : 'TEXT';
        return this.addColumn(columnName, type, options);
    }
    
    enum(columnName, values, options = {}) {
        if (this.dialect === 'mysql') {
            const enumValues = values.map(v => `'${v}'`).join(', ');
            return this.addColumn(columnName, `ENUM(${enumValues})`, options);
        } else {
            // For PostgreSQL and SQLite, use CHECK constraint
            const checkValues = values.map(v => `'${v}'`).join(', ');
            options.check = `${columnName} IN (${checkValues})`;
            return this.addColumn(columnName, 'VARCHAR(50)', options);
        }
    }
    
    addColumn(columnName, type, options = {}) {
        this.columns.push({
            name: columnName,
            type,
            options
        });
        
        if (options.primaryKey) {
            this.primaryKeys.push(columnName);
        }
        
        return this;
    }
    
    // Indexes
    index(columns, options = {}) {
        this.indexes.push({
            columns: Array.isArray(columns) ? columns : [columns],
            unique: false,
            ...options
        });
        return this;
    }
    
    unique(columns, options = {}) {
        return this.index(columns, { ...options, unique: true });
    }
    
    // Foreign keys
    foreign(column, options = {}) {
        this.foreignKeys.push({
            column,
            ...options
        });
        return this;
    }
    
    buildCreate() {
        let sql = `CREATE TABLE ${this.tableName} (\n`;
        
        // Add columns
        const columnDefs = this.columns.map(col => {
            let def = `  ${col.name} ${col.type}`;
            
            if (col.options.notNull || col.options.required) {
                def += ' NOT NULL';
            }
            
            if (col.options.default !== undefined) {
                if (typeof col.options.default === 'string' && col.options.default.toLowerCase() !== 'null') {
                    def += ` DEFAULT '${col.options.default}'`;
                } else {
                    def += ` DEFAULT ${col.options.default}`;
                }
            }
            
            if (col.options.autoIncrement) {
                if (this.dialect === 'mysql') {
                    def += ' AUTO_INCREMENT';
                } else if (this.dialect === 'sqlite') {
                    def += ' AUTOINCREMENT';
                }
            }
            
            if (col.options.unique && !col.options.primaryKey) {
                def += ' UNIQUE';
            }
            
            if (col.options.check) {
                def += ` CHECK (${col.options.check})`;
            }
            
            return def;
        });
        
        sql += columnDefs.join(',\n');
        
        // Add primary key
        if (this.primaryKeys.length > 0) {
            sql += `,\n  PRIMARY KEY (${this.primaryKeys.join(', ')})`;
        }
        
        // Add foreign keys (except for SQLite which handles them differently)
        if (this.dialect !== 'sqlite') {
            this.foreignKeys.forEach(fk => {
                sql += `,\n  FOREIGN KEY (${fk.column}) REFERENCES ${fk.references}(${fk.on})`;
                if (fk.onDelete) {
                    sql += ` ON DELETE ${fk.onDelete}`;
                }
                if (fk.onUpdate) {
                    sql += ` ON UPDATE ${fk.onUpdate}`;
                }
            });
        }
        
        sql += '\n)';
        
        // Add table options for MySQL
        if (this.dialect === 'mysql') {
            sql += ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
        }
        
        return sql;
    }
}

class MigrationRunner {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.migrationsTable = 'migrations';
    }
    
    async initialize() {
        // Create migrations table if it doesn't exist
        const createMigrationsTable = `
            CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                version BIGINT NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_name (name)
            )
        `;
        
        await this.dbManager.query(createMigrationsTable);
    }
    
    async run(migration) {
        await this.initialize();
        
        // Check if migration already executed
        const existing = await this.dbManager.query(
            `SELECT * FROM ${this.migrationsTable} WHERE name = ?`,
            [migration.name]
        );
        
        if (existing.length > 0) {
            console.log(`Migration ${migration.name} already executed`);
            return;
        }
        
        try {
            // Execute up queries in transaction
            await this.dbManager.transaction(async (db) => {
                for (const query of migration.getUpQueries()) {
                    await db.query(query);
                }
                
                // Record migration
                await db.query(
                    `INSERT INTO ${this.migrationsTable} (name, version) VALUES (?, ?)`,
                    [migration.name, migration.version]
                );
            });
            
            console.log(`Migration ${migration.name} executed successfully`);
        } catch (error) {
            console.error(`Migration ${migration.name} failed:`, error);
            throw error;
        }
    }
    
    async rollback(migration) {
        await this.initialize();
        
        // Check if migration was executed
        const existing = await this.dbManager.query(
            `SELECT * FROM ${this.migrationsTable} WHERE name = ?`,
            [migration.name]
        );
        
        if (existing.length === 0) {
            console.log(`Migration ${migration.name} not found`);
            return;
        }
        
        try {
            // Execute down queries in transaction
            await this.dbManager.transaction(async (db) => {
                for (const query of migration.getDownQueries()) {
                    if (!query.startsWith('-- ')) { // Skip comments
                        await db.query(query);
                    }
                }
                
                // Remove migration record
                await db.query(
                    `DELETE FROM ${this.migrationsTable} WHERE name = ?`,
                    [migration.name]
                );
            });
            
            console.log(`Migration ${migration.name} rolled back successfully`);
        } catch (error) {
            console.error(`Migration ${migration.name} rollback failed:`, error);
            throw error;
        }
    }
    
    async getExecutedMigrations() {
        await this.initialize();
        
        const migrations = await this.dbManager.query(
            `SELECT * FROM ${this.migrationsTable} ORDER BY executed_at DESC`
        );
        
        return migrations;
    }
    
    async getLastMigration() {
        const migrations = await this.getExecutedMigrations();
        return migrations.length > 0 ? migrations[0] : null;
    }
    
    async runPending(migrations) {
        const executed = await this.getExecutedMigrations();
        const executedNames = new Set(executed.map(m => m.name));
        
        const pending = migrations.filter(m => !executedNames.has(m.name));
        
        for (const migration of pending) {
            await this.run(migration);
        }
        
        return pending.length;
    }
}

// Migration file generator
class MigrationGenerator {
    constructor(dialect = 'mysql') {
        this.dialect = dialect;
    }
    
    generateCreateTable(tableName, columns) {
        const migration = new Migration(`create_${tableName}_table`, this.dialect);
        
        migration.createTable(tableName, (table) => {
            table.id();
            
            columns.forEach(col => {
                switch (col.type) {
                    case 'string':
                        table.string(col.name, col.length || 255, col.options || {});
                        break;
                    case 'text':
                        table.text(col.name, col.options || {});
                        break;
                    case 'integer':
                        table.integer(col.name, col.options || {});
                        break;
                    case 'boolean':
                        table.boolean(col.name, col.options || {});
                        break;
                    case 'timestamp':
                        table.timestamp(col.name, col.options || {});
                        break;
                    default:
                        table.addColumn(col.name, col.type, col.options || {});
                }
            });
            
            table.timestamps();
        });
        
        return migration;
    }
    
    generateAddColumn(tableName, columnName, type, options = {}) {
        const migration = new Migration(`add_${columnName}_to_${tableName}`, this.dialect);
        migration.addColumn(tableName, columnName, type, options);
        return migration;
    }
    
    generateDropColumn(tableName, columnName) {
        const migration = new Migration(`drop_${columnName}_from_${tableName}`, this.dialect);
        migration.dropColumn(tableName, columnName);
        return migration;
    }
    
    generateAddIndex(tableName, columns, options = {}) {
        const columnStr = Array.isArray(columns) ? columns.join('_') : columns;
        const migration = new Migration(`add_index_${tableName}_${columnStr}`, this.dialect);
        migration.addIndex(tableName, columns, options);
        return migration;
    }
}

module.exports = {
    Migration,
    TableBuilder,
    MigrationRunner,
    MigrationGenerator
};