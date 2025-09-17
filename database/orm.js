/**
 * Simple Object-Relational Mapping (ORM)
 * Zero-dependency ORM with active record pattern
 * Supports relationships, validations, and query scopes
 */

class Model {
    constructor(attributes = {}) {
        this.attributes = {};
        this.originalAttributes = {};
        this.isDirty = false;
        this.isNew = true;
        this.relationships = new Map();
        
        // Set attributes
        this.fill(attributes);
        
        // Set original state
        this.originalAttributes = { ...this.attributes };
        this.isDirty = false;
    }
    
    // Class methods (static)
    static get tableName() {
        return this.name.toLowerCase() + 's';
    }
    
    static get primaryKey() {
        return 'id';
    }
    
    static get fillable() {
        return [];
    }
    
    static get hidden() {
        return [];
    }
    
    static get casts() {
        return {};
    }
    
    static setConnection(dbManager) {
        this.db = dbManager;
    }
    
    static getConnection() {
        if (!this.db) {
            throw new Error('Database connection not set. Call Model.setConnection(dbManager) first.');
        }
        return this.db;
    }
    
    // Query methods
    static async find(id) {
        const query = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ? LIMIT 1`;
        const results = await this.getConnection().query(query, [id]);
        
        if (results.length === 0) {
            return null;
        }
        
        const instance = new this(results[0]);
        instance.isNew = false;
        instance.isDirty = false;
        return instance;
    }
    
    static async findOrFail(id) {
        const instance = await this.find(id);
        if (!instance) {
            throw new Error(`${this.name} with ${this.primaryKey} ${id} not found`);
        }
        return instance;
    }
    
    static async findBy(field, value) {
        const query = `SELECT * FROM ${this.tableName} WHERE ${field} = ? LIMIT 1`;
        const results = await this.getConnection().query(query, [value]);
        
        if (results.length === 0) {
            return null;
        }
        
        const instance = new this(results[0]);
        instance.isNew = false;
        instance.isDirty = false;
        return instance;
    }
    
    static async where(field, operator, value) {
        if (arguments.length === 2) {
            value = operator;
            operator = '=';
        }
        
        const query = `SELECT * FROM ${this.tableName} WHERE ${field} ${operator} ?`;
        const results = await this.getConnection().query(query, [value]);
        
        return results.map(row => {
            const instance = new this(row);
            instance.isNew = false;
            instance.isDirty = false;
            return instance;
        });
    }
    
    static async all() {
        const query = `SELECT * FROM ${this.tableName}`;
        const results = await this.getConnection().query(query);
        
        return results.map(row => {
            const instance = new this(row);
            instance.isNew = false;
            instance.isDirty = false;
            return instance;
        });
    }
    
    static async create(attributes) {
        const instance = new this(attributes);
        await instance.save();
        return instance;
    }
    
    static async updateOrCreate(conditions, attributes) {
        let instance = await this.findBy(Object.keys(conditions)[0], Object.values(conditions)[0]);
        
        if (instance) {
            instance.fill(attributes);
            await instance.save();
        } else {
            instance = await this.create({ ...conditions, ...attributes });
        }
        
        return instance;
    }
    
    static async count(conditions = {}) {
        let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
        const params = [];
        
        if (Object.keys(conditions).length > 0) {
            const whereClauses = Object.keys(conditions).map(key => `${key} = ?`);
            query += ` WHERE ${whereClauses.join(' AND ')}`;
            params.push(...Object.values(conditions));
        }
        
        const results = await this.getConnection().query(query, params);
        return results[0].count;
    }
    
    static async paginate(page = 1, perPage = 10, conditions = {}) {
        const offset = (page - 1) * perPage;
        let query = `SELECT * FROM ${this.tableName}`;
        const params = [];
        
        if (Object.keys(conditions).length > 0) {
            const whereClauses = Object.keys(conditions).map(key => `${key} = ?`);
            query += ` WHERE ${whereClauses.join(' AND ')}`;
            params.push(...Object.values(conditions));
        }
        
        query += ` LIMIT ? OFFSET ?`;
        params.push(perPage, offset);
        
        const results = await this.getConnection().query(query, params);
        const total = await this.count(conditions);
        
        const items = results.map(row => {
            const instance = new this(row);
            instance.isNew = false;
            instance.isDirty = false;
            return instance;
        });
        
        return {
            data: items,
            total,
            page,
            perPage,
            totalPages: Math.ceil(total / perPage),
            hasNextPage: page < Math.ceil(total / perPage),
            hasPrevPage: page > 1
        };
    }
    
    // Instance methods
    fill(attributes) {
        const fillable = this.constructor.fillable;
        
        Object.keys(attributes).forEach(key => {
            if (fillable.length === 0 || fillable.includes(key)) {
                this.setAttribute(key, attributes[key]);
            }
        });
        
        return this;
    }
    
    setAttribute(key, value) {
        const casts = this.constructor.casts;
        
        if (casts[key]) {
            value = this.castAttribute(key, value, casts[key]);
        }
        
        this.attributes[key] = value;
        this.isDirty = true;
        
        return this;
    }
    
    getAttribute(key) {
        return this.attributes[key];
    }
    
    castAttribute(key, value, type) {
        if (value === null || value === undefined) {
            return value;
        }
        
        switch (type) {
            case 'int':
            case 'integer':
                return parseInt(value);
            case 'float':
            case 'double':
                return parseFloat(value);
            case 'bool':
            case 'boolean':
                return Boolean(value);
            case 'string':
                return String(value);
            case 'json':
                return typeof value === 'string' ? JSON.parse(value) : value;
            case 'date':
                return new Date(value);
            default:
                return value;
        }
    }
    
    async save() {
        if (this.isNew) {
            return await this.insert();
        } else if (this.isDirty) {
            return await this.update();
        }
        return this;
    }
    
    async insert() {
        const fillableAttributes = this.getFillableAttributes();
        const fields = Object.keys(fillableAttributes);
        const values = Object.values(fillableAttributes);
        const placeholders = fields.map(() => '?').join(', ');
        
        const query = `INSERT INTO ${this.constructor.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
        
        try {
            const result = await this.constructor.getConnection().query(query, values);
            
            // Set the primary key if it was auto-generated
            if (result.insertId) {
                this.attributes[this.constructor.primaryKey] = result.insertId;
            }
            
            this.isNew = false;
            this.isDirty = false;
            this.originalAttributes = { ...this.attributes };
            
            return this;
        } catch (error) {
            throw new Error(`Failed to save ${this.constructor.name}: ${error.message}`);
        }
    }
    
    async update() {
        const primaryKeyValue = this.attributes[this.constructor.primaryKey];
        if (!primaryKeyValue) {
            throw new Error('Cannot update model without primary key');
        }
        
        const changedAttributes = this.getChangedAttributes();
        if (Object.keys(changedAttributes).length === 0) {
            return this; // No changes to save
        }
        
        const fields = Object.keys(changedAttributes);
        const values = Object.values(changedAttributes);
        const setClauses = fields.map(field => `${field} = ?`).join(', ');
        
        const query = `UPDATE ${this.constructor.tableName} SET ${setClauses} WHERE ${this.constructor.primaryKey} = ?`;
        values.push(primaryKeyValue);
        
        try {
            await this.constructor.getConnection().query(query, values);
            
            this.isDirty = false;
            this.originalAttributes = { ...this.attributes };
            
            return this;
        } catch (error) {
            throw new Error(`Failed to update ${this.constructor.name}: ${error.message}`);
        }
    }
    
    async delete() {
        const primaryKeyValue = this.attributes[this.constructor.primaryKey];
        if (!primaryKeyValue) {
            throw new Error('Cannot delete model without primary key');
        }
        
        const query = `DELETE FROM ${this.constructor.tableName} WHERE ${this.constructor.primaryKey} = ?`;
        
        try {
            await this.constructor.getConnection().query(query, [primaryKeyValue]);
            return true;
        } catch (error) {
            throw new Error(`Failed to delete ${this.constructor.name}: ${error.message}`);
        }
    }
    
    async reload() {
        const primaryKeyValue = this.attributes[this.constructor.primaryKey];
        if (!primaryKeyValue) {
            throw new Error('Cannot reload model without primary key');
        }
        
        const fresh = await this.constructor.find(primaryKeyValue);
        if (fresh) {
            this.attributes = fresh.attributes;
            this.originalAttributes = { ...this.attributes };
            this.isDirty = false;
        }
        
        return this;
    }
    
    // Relationship methods
    hasMany(relatedModel, foreignKey = null) {
        const fk = foreignKey || this.constructor.name.toLowerCase() + '_id';
        return new HasManyRelation(this, relatedModel, fk);
    }
    
    belongsTo(relatedModel, foreignKey = null) {
        const fk = foreignKey || relatedModel.name.toLowerCase() + '_id';
        return new BelongsToRelation(this, relatedModel, fk);
    }
    
    belongsToMany(relatedModel, pivotTable = null, localKey = null, foreignKey = null) {
        const pivot = pivotTable || [this.constructor.tableName, relatedModel.tableName].sort().join('_');
        const lk = localKey || this.constructor.name.toLowerCase() + '_id';
        const fk = foreignKey || relatedModel.name.toLowerCase() + '_id';
        
        return new BelongsToManyRelation(this, relatedModel, pivot, lk, fk);
    }
    
    // Utility methods
    getFillableAttributes() {
        const fillable = this.constructor.fillable;
        const result = {};
        
        Object.keys(this.attributes).forEach(key => {
            if (key !== this.constructor.primaryKey && (fillable.length === 0 || fillable.includes(key))) {
                result[key] = this.attributes[key];
            }
        });
        
        return result;
    }
    
    getChangedAttributes() {
        const changed = {};
        const fillable = this.constructor.fillable;
        
        Object.keys(this.attributes).forEach(key => {
            if (key !== this.constructor.primaryKey && 
                (fillable.length === 0 || fillable.includes(key)) &&
                this.attributes[key] !== this.originalAttributes[key]) {
                changed[key] = this.attributes[key];
            }
        });
        
        return changed;
    }
    
    toJSON() {
        const result = { ...this.attributes };
        const hidden = this.constructor.hidden;
        
        hidden.forEach(key => {
            delete result[key];
        });
        
        return result;
    }
    
    toString() {
        return JSON.stringify(this.toJSON(), null, 2);
    }
}

// Relationship classes
class HasManyRelation {
    constructor(parent, relatedModel, foreignKey) {
        this.parent = parent;
        this.relatedModel = relatedModel;
        this.foreignKey = foreignKey;
    }
    
    async get() {
        const parentId = this.parent.getAttribute(this.parent.constructor.primaryKey);
        return await this.relatedModel.where(this.foreignKey, parentId);
    }
    
    async create(attributes) {
        const parentId = this.parent.getAttribute(this.parent.constructor.primaryKey);
        attributes[this.foreignKey] = parentId;
        return await this.relatedModel.create(attributes);
    }
}

class BelongsToRelation {
    constructor(child, relatedModel, foreignKey) {
        this.child = child;
        this.relatedModel = relatedModel;
        this.foreignKey = foreignKey;
    }
    
    async get() {
        const foreignId = this.child.getAttribute(this.foreignKey);
        if (!foreignId) {
            return null;
        }
        return await this.relatedModel.find(foreignId);
    }
    
    async associate(model) {
        const foreignId = model.getAttribute(model.constructor.primaryKey);
        this.child.setAttribute(this.foreignKey, foreignId);
        return this.child;
    }
    
    async dissociate() {
        this.child.setAttribute(this.foreignKey, null);
        return this.child;
    }
}

class BelongsToManyRelation {
    constructor(parent, relatedModel, pivotTable, localKey, foreignKey) {
        this.parent = parent;
        this.relatedModel = relatedModel;
        this.pivotTable = pivotTable;
        this.localKey = localKey;
        this.foreignKey = foreignKey;
    }
    
    async get() {
        const parentId = this.parent.getAttribute(this.parent.constructor.primaryKey);
        
        const query = `
            SELECT r.* FROM ${this.relatedModel.tableName} r
            INNER JOIN ${this.pivotTable} p ON r.${this.relatedModel.primaryKey} = p.${this.foreignKey}
            WHERE p.${this.localKey} = ?
        `;
        
        const results = await this.parent.constructor.getConnection().query(query, [parentId]);
        
        return results.map(row => {
            const instance = new this.relatedModel(row);
            instance.isNew = false;
            instance.isDirty = false;
            return instance;
        });
    }
    
    async attach(model, pivotData = {}) {
        const parentId = this.parent.getAttribute(this.parent.constructor.primaryKey);
        const relatedId = model.getAttribute(model.constructor.primaryKey);
        
        const data = {
            [this.localKey]: parentId,
            [this.foreignKey]: relatedId,
            ...pivotData
        };
        
        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map(() => '?').join(', ');
        
        const query = `INSERT INTO ${this.pivotTable} (${fields.join(', ')}) VALUES (${placeholders})`;
        
        await this.parent.constructor.getConnection().query(query, values);
    }
    
    async detach(model = null) {
        const parentId = this.parent.getAttribute(this.parent.constructor.primaryKey);
        
        if (model) {
            const relatedId = model.getAttribute(model.constructor.primaryKey);
            const query = `DELETE FROM ${this.pivotTable} WHERE ${this.localKey} = ? AND ${this.foreignKey} = ?`;
            await this.parent.constructor.getConnection().query(query, [parentId, relatedId]);
        } else {
            const query = `DELETE FROM ${this.pivotTable} WHERE ${this.localKey} = ?`;
            await this.parent.constructor.getConnection().query(query, [parentId]);
        }
    }
}

// Model factory for creating test data
class ModelFactory {
    constructor(modelClass) {
        this.modelClass = modelClass;
        this.definitions = new Map();
    }
    
    define(name, factory) {
        this.definitions.set(name, factory);
        return this;
    }
    
    create(name, overrides = {}) {
        const factory = this.definitions.get(name);
        if (!factory) {
            throw new Error(`Factory ${name} not defined`);
        }
        
        const attributes = { ...factory(), ...overrides };
        return new this.modelClass(attributes);
    }
    
    async make(name, overrides = {}) {
        const instance = this.create(name, overrides);
        await instance.save();
        return instance;
    }
    
    async makeMany(name, count, overrides = {}) {
        const instances = [];
        for (let i = 0; i < count; i++) {
            instances.push(await this.make(name, overrides));
        }
        return instances;
    }
}

module.exports = {
    Model,
    HasManyRelation,
    BelongsToRelation,
    BelongsToManyRelation,
    ModelFactory
};