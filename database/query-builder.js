/**
 * Universal Query Builder
 * Generates SQL queries for MySQL, PostgreSQL, SQLite
 * Supports complex joins, conditions, and aggregations
 */

class QueryBuilder {
    constructor(dialect = 'mysql') {
        this.dialect = dialect; // mysql, postgresql, sqlite
        this.reset();
    }
    
    reset() {
        this.queryType = '';
        this.selectFields = [];
        this.fromTable = '';
        this.joinClauses = [];
        this.whereConditions = [];
        this.groupByFields = [];
        this.havingConditions = [];
        this.orderByFields = [];
        this.limitValue = null;
        this.offsetValue = null;
        this.insertData = {};
        this.updateData = {};
        this.parameters = [];
        return this;
    }
    
    // SELECT queries
    select(fields = '*') {
        this.queryType = 'select';
        if (Array.isArray(fields)) {
            this.selectFields = fields;
        } else if (typeof fields === 'string') {
            this.selectFields = fields === '*' ? ['*'] : [fields];
        }
        return this;
    }
    
    from(table) {
        this.fromTable = table;
        return this;
    }
    
    join(table, condition, type = 'INNER') {
        this.joinClauses.push({
            type: type.toUpperCase(),
            table,
            condition
        });
        return this;
    }
    
    leftJoin(table, condition) {
        return this.join(table, condition, 'LEFT');
    }
    
    rightJoin(table, condition) {
        return this.join(table, condition, 'RIGHT');
    }
    
    innerJoin(table, condition) {
        return this.join(table, condition, 'INNER');
    }
    
    where(field, operator, value) {
        if (arguments.length === 1 && typeof field === 'object') {
            // where({ name: 'John', age: 25 })
            Object.entries(field).forEach(([key, val]) => {
                this.whereConditions.push({
                    field: key,
                    operator: '=',
                    value: val,
                    logic: 'AND'
                });
            });
        } else if (arguments.length === 2) {
            // where('name', 'John')
            this.whereConditions.push({
                field,
                operator: '=',
                value: operator,
                logic: 'AND'
            });
        } else {
            // where('age', '>', 18)
            this.whereConditions.push({
                field,
                operator,
                value,
                logic: 'AND'
            });
        }
        return this;
    }
    
    orWhere(field, operator, value) {
        const condition = this.where(field, operator, value);
        if (this.whereConditions.length > 0) {
            this.whereConditions[this.whereConditions.length - 1].logic = 'OR';
        }
        return this;
    }
    
    whereIn(field, values) {
        this.whereConditions.push({
            field,
            operator: 'IN',
            value: values,
            logic: 'AND'
        });
        return this;
    }
    
    whereNotIn(field, values) {
        this.whereConditions.push({
            field,
            operator: 'NOT IN',
            value: values,
            logic: 'AND'
        });
        return this;
    }
    
    whereBetween(field, min, max) {
        this.whereConditions.push({
            field,
            operator: 'BETWEEN',
            value: [min, max],
            logic: 'AND'
        });
        return this;
    }
    
    whereNull(field) {
        this.whereConditions.push({
            field,
            operator: 'IS NULL',
            value: null,
            logic: 'AND'
        });
        return this;
    }
    
    whereNotNull(field) {
        this.whereConditions.push({
            field,
            operator: 'IS NOT NULL',
            value: null,
            logic: 'AND'
        });
        return this;
    }
    
    whereLike(field, pattern) {
        this.whereConditions.push({
            field,
            operator: 'LIKE',
            value: pattern,
            logic: 'AND'
        });
        return this;
    }
    
    groupBy(fields) {
        if (Array.isArray(fields)) {
            this.groupByFields = fields;
        } else {
            this.groupByFields = [fields];
        }
        return this;
    }
    
    having(field, operator, value) {
        this.havingConditions.push({
            field,
            operator,
            value,
            logic: 'AND'
        });
        return this;
    }
    
    orderBy(field, direction = 'ASC') {
        this.orderByFields.push({
            field,
            direction: direction.toUpperCase()
        });
        return this;
    }
    
    limit(count) {
        this.limitValue = count;
        return this;
    }
    
    offset(count) {
        this.offsetValue = count;
        return this;
    }
    
    // INSERT queries
    insert(data) {
        this.queryType = 'insert';
        this.insertData = data;
        return this;
    }
    
    into(table) {
        this.fromTable = table;
        return this;
    }
    
    // UPDATE queries
    update(table) {
        this.queryType = 'update';
        this.fromTable = table;
        return this;
    }
    
    set(data) {
        this.updateData = { ...this.updateData, ...data };
        return this;
    }
    
    // DELETE queries
    delete() {
        this.queryType = 'delete';
        return this;
    }
    
    // Build the final query
    build() {
        switch (this.queryType) {
            case 'select':
                return this.buildSelect();
            case 'insert':
                return this.buildInsert();
            case 'update':
                return this.buildUpdate();
            case 'delete':
                return this.buildDelete();
            default:
                throw new Error('No query type specified');
        }
    }
    
    buildSelect() {
        let query = 'SELECT ';
        
        // SELECT fields
        query += this.selectFields.join(', ');
        
        // FROM table
        query += ` FROM ${this.fromTable}`;
        
        // JOIN clauses
        this.joinClauses.forEach(join => {
            query += ` ${join.type} JOIN ${join.table} ON ${join.condition}`;
        });
        
        // WHERE conditions
        if (this.whereConditions.length > 0) {
            query += ' WHERE ';
            query += this.buildWhereClause();
        }
        
        // GROUP BY
        if (this.groupByFields.length > 0) {
            query += ` GROUP BY ${this.groupByFields.join(', ')}`;
        }
        
        // HAVING
        if (this.havingConditions.length > 0) {
            query += ' HAVING ';
            query += this.buildHavingClause();
        }
        
        // ORDER BY
        if (this.orderByFields.length > 0) {
            const orderClauses = this.orderByFields.map(
                order => `${order.field} ${order.direction}`
            );
            query += ` ORDER BY ${orderClauses.join(', ')}`;
        }
        
        // LIMIT and OFFSET
        if (this.limitValue !== null) {
            if (this.dialect === 'mysql' || this.dialect === 'postgresql') {
                query += ` LIMIT ${this.limitValue}`;
                if (this.offsetValue !== null) {
                    query += ` OFFSET ${this.offsetValue}`;
                }
            } else if (this.dialect === 'sqlite') {
                query += ` LIMIT ${this.limitValue}`;
                if (this.offsetValue !== null) {
                    query += ` OFFSET ${this.offsetValue}`;
                }
            }
        }
        
        return { query, parameters: this.parameters };
    }
    
    buildInsert() {
        if (Array.isArray(this.insertData)) {
            // Bulk insert
            return this.buildBulkInsert();
        }
        
        const fields = Object.keys(this.insertData);
        const placeholders = fields.map(() => this.getPlaceholder());
        
        this.parameters = Object.values(this.insertData);
        
        const query = `INSERT INTO ${this.fromTable} (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
        
        return { query, parameters: this.parameters };
    }
    
    buildBulkInsert() {
        if (this.insertData.length === 0) {
            throw new Error('No data provided for bulk insert');
        }
        
        const fields = Object.keys(this.insertData[0]);
        const valueRows = [];
        
        this.insertData.forEach(row => {
            const rowPlaceholders = fields.map(() => this.getPlaceholder());
            valueRows.push(`(${rowPlaceholders.join(', ')})`);
            this.parameters.push(...Object.values(row));
        });
        
        const query = `INSERT INTO ${this.fromTable} (${fields.join(', ')}) VALUES ${valueRows.join(', ')}`;
        
        return { query, parameters: this.parameters };
    }
    
    buildUpdate() {
        const setFields = Object.keys(this.updateData);
        const setClauses = setFields.map(field => `${field} = ${this.getPlaceholder()}`);
        
        this.parameters = Object.values(this.updateData);
        
        let query = `UPDATE ${this.fromTable} SET ${setClauses.join(', ')}`;
        
        if (this.whereConditions.length > 0) {
            query += ' WHERE ';
            query += this.buildWhereClause();
        }
        
        return { query, parameters: this.parameters };
    }
    
    buildDelete() {
        let query = `DELETE FROM ${this.fromTable}`;
        
        if (this.whereConditions.length > 0) {
            query += ' WHERE ';
            query += this.buildWhereClause();
        }
        
        return { query, parameters: this.parameters };
    }
    
    buildWhereClause() {
        let clause = '';
        
        this.whereConditions.forEach((condition, index) => {
            if (index > 0) {
                clause += ` ${condition.logic} `;
            }
            
            clause += this.buildCondition(condition);
        });
        
        return clause;
    }
    
    buildHavingClause() {
        let clause = '';
        
        this.havingConditions.forEach((condition, index) => {
            if (index > 0) {
                clause += ` ${condition.logic} `;
            }
            
            clause += this.buildCondition(condition);
        });
        
        return clause;
    }
    
    buildCondition(condition) {
        const { field, operator, value } = condition;
        
        if (operator === 'IS NULL' || operator === 'IS NOT NULL') {
            return `${field} ${operator}`;
        }
        
        if (operator === 'IN' || operator === 'NOT IN') {
            const placeholders = value.map(() => this.getPlaceholder());
            this.parameters.push(...value);
            return `${field} ${operator} (${placeholders.join(', ')})`;
        }
        
        if (operator === 'BETWEEN') {
            const placeholder1 = this.getPlaceholder();
            const placeholder2 = this.getPlaceholder();
            this.parameters.push(value[0], value[1]);
            return `${field} ${operator} ${placeholder1} AND ${placeholder2}`;
        }
        
        const placeholder = this.getPlaceholder();
        this.parameters.push(value);
        return `${field} ${operator} ${placeholder}`;
    }
    
    getPlaceholder() {
        switch (this.dialect) {
            case 'mysql':
                return '?';
            case 'postgresql':
                return `$${this.parameters.length + 1}`;
            case 'sqlite':
                return '?';
            default:
                return '?';
        }
    }
    
    // Convenience methods for common queries
    findById(table, id) {
        return this.select()
            .from(table)
            .where('id', id)
            .limit(1)
            .build();
    }
    
    findAll(table, conditions = {}) {
        const query = this.select().from(table);
        
        Object.entries(conditions).forEach(([field, value]) => {
            query.where(field, value);
        });
        
        return query.build();
    }
    
    paginate(table, page = 1, perPage = 10, conditions = {}) {
        const query = this.select().from(table);
        
        Object.entries(conditions).forEach(([field, value]) => {
            query.where(field, value);
        });
        
        const offset = (page - 1) * perPage;
        return query.limit(perPage).offset(offset).build();
    }
    
    // Aggregate functions
    count(table, field = '*', conditions = {}) {
        const query = this.select(`COUNT(${field}) as count`).from(table);
        
        Object.entries(conditions).forEach(([field, value]) => {
            query.where(field, value);
        });
        
        return query.build();
    }
    
    sum(table, field, conditions = {}) {
        const query = this.select(`SUM(${field}) as sum`).from(table);
        
        Object.entries(conditions).forEach(([field, value]) => {
            query.where(field, value);
        });
        
        return query.build();
    }
    
    avg(table, field, conditions = {}) {
        const query = this.select(`AVG(${field}) as avg`).from(table);
        
        Object.entries(conditions).forEach(([field, value]) => {
            query.where(field, value);
        });
        
        return query.build();
    }
    
    max(table, field, conditions = {}) {
        const query = this.select(`MAX(${field}) as max`).from(table);
        
        Object.entries(conditions).forEach(([field, value]) => {
            query.where(field, value);
        });
        
        return query.build();
    }
    
    min(table, field, conditions = {}) {
        const query = this.select(`MIN(${field}) as min`).from(table);
        
        Object.entries(conditions).forEach(([field, value]) => {
            query.where(field, value);
        });
        
        return query.build();
    }
}

// Advanced Query Builder with Relations
class RelationalQueryBuilder extends QueryBuilder {
    constructor(dialect = 'mysql') {
        super(dialect);
        this.relations = new Map();
        this.withRelations = [];
    }
    
    // Define relationships
    hasMany(foreignTable, localKey, foreignKey) {
        this.relations.set(foreignTable, {
            type: 'hasMany',
            localKey,
            foreignKey
        });
        return this;
    }
    
    belongsTo(foreignTable, localKey, foreignKey) {
        this.relations.set(foreignTable, {
            type: 'belongsTo',
            localKey,
            foreignKey
        });
        return this;
    }
    
    belongsToMany(foreignTable, pivotTable, localKey, foreignKey) {
        this.relations.set(foreignTable, {
            type: 'belongsToMany',
            pivotTable,
            localKey,
            foreignKey
        });
        return this;
    }
    
    // Load relations
    with(relations) {
        if (Array.isArray(relations)) {
            this.withRelations = relations;
        } else {
            this.withRelations = [relations];
        }
        return this;
    }
    
    buildWithRelations() {
        const baseQuery = this.build();
        const queries = [baseQuery];
        
        this.withRelations.forEach(relationName => {
            const relation = this.relations.get(relationName);
            if (relation) {
                const relationQuery = this.buildRelationQuery(relationName, relation);
                queries.push(relationQuery);
            }
        });
        
        return queries;
    }
    
    buildRelationQuery(relationName, relation) {
        const builder = new QueryBuilder(this.dialect);
        
        switch (relation.type) {
            case 'hasMany':
                return builder
                    .select()
                    .from(relationName)
                    .where(relation.foreignKey, 'IN', '(SELECT id FROM main_query)')
                    .build();
            
            case 'belongsTo':
                return builder
                    .select()
                    .from(relationName)
                    .join(this.fromTable, `${relationName}.${relation.foreignKey} = ${this.fromTable}.${relation.localKey}`)
                    .build();
            
            case 'belongsToMany':
                return builder
                    .select(`${relationName}.*`)
                    .from(relationName)
                    .join(relation.pivotTable, `${relationName}.id = ${relation.pivotTable}.${relation.foreignKey}`)
                    .join(this.fromTable, `${relation.pivotTable}.${relation.localKey} = ${this.fromTable}.id`)
                    .build();
        }
    }
}

// Query Builder Factory
class QueryBuilderFactory {
    static create(dialect = 'mysql') {
        return new QueryBuilder(dialect);
    }
    
    static createRelational(dialect = 'mysql') {
        return new RelationalQueryBuilder(dialect);
    }
    
    static mysql() {
        return new QueryBuilder('mysql');
    }
    
    static postgresql() {
        return new QueryBuilder('postgresql');
    }
    
    static sqlite() {
        return new QueryBuilder('sqlite');
    }
}

// Raw Query Builder for complex queries
class RawQueryBuilder {
    constructor(dialect = 'mysql') {
        this.dialect = dialect;
        this.query = '';
        this.parameters = [];
    }
    
    raw(query, params = []) {
        this.query = query;
        this.parameters = params;
        return this;
    }
    
    union(query, params = []) {
        this.query += ` UNION ${query}`;
        this.parameters.push(...params);
        return this;
    }
    
    unionAll(query, params = []) {
        this.query += ` UNION ALL ${query}`;
        this.parameters.push(...params);
        return this;
    }
    
    build() {
        return {
            query: this.query,
            parameters: this.parameters
        };
    }
}

module.exports = {
    QueryBuilder,
    RelationalQueryBuilder,
    QueryBuilderFactory,
    RawQueryBuilder
};