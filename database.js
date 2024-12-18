const fs = require('fs').promises;
const path = require('path');

class Database {
  constructor(dbName) {
    this.dbName = dbName;
    this.tables = new Map();
    this.dbPath = path.join(process.cwd(), `${dbName}.json`);
  }

  // Intialize the database
  async init() {
    try {
      const data = await fs.readFile(this.dbPath, 'utf8');
      const parsed = JSON.parse(data);
      this.tables = new Map(Object.entries(parsed));
    } catch (e) {
      await this.save();
    }
  }

  // Save database to file
  async save() {
    const data = Object.fromEntries(this.tables);
    await fs.writeFile(this.dbPath, JSON.stringify(data, null, 2));
  }

  // Create table
  createTable(tableName, schema) {
    if (this.tables.has(tableName)) {
      throw new Error(`Table ${tableName} already exists`);
    }

    this.tables.set(tableName, {
      schema,
      data: [],
      autoIncrement: 1,
    });
    return this.save();
  }

  // Insert record
  async insert(tableName, record) {
    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error('Table not found');
    }

    // Validate schema
    for (const [field, type] of Object.entries(table.schema)) {
      if (type.required && !(field in record)) {
        throw new Error(`Required field ${field} missing`);
      }
      if (record[field] && typeof record[field] !== type.type) {
        throw new Error(`Invalid type for ${field}`);
      }
    }

    const id = table.autoIncrement++;
    const newRecord = { id, ...record };
    table.data.push(newRecord);
    await this.save();
    return newRecord;
  }

  // Select records
  select(tableName, conditions = {}) {
    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error('Table not found');
    }

    return table.data.filter((record) => {
      return Object.entries(conditions).every(
        ([key, value]) => record[key] === value
      );
    });
  }

  // Update record
  async update(tableName, id, updates) {
    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error('Table not found');
    }

    const index = table.data.findIndex((record) => record.id === id);
    if (index === -1) {
      throw new Error('Record not found');
    }

    // Validate schema for updates
    for (const [field, value] of Object.entries(updates)) {
      if (!(field in table.schema)) {
        throw new Error(`Invalid field ${field}`);
      }
      if (typeof value !== table.schema[field].type) {
        throw new Error(`Invalid type for ${field}`);
      }
    }

    table.data[index] = { ...table.data[index], ...updates };
    await this.save();
    return table.data[index];
  }

  // Delete record
  async delete(tableName, id) {
    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} does not exist`);
    }

    const index = table.data.findIndex((record) => record.id === id);
    if (index === -1) {
      throw new Error(`Record not found for ${tableName}`);
    }

    table.data.splice(index, 1);
    await this.save();
  }

  // Join tables
  join(table1Name, table2Name, foreignKey) {
    const table1 = this.tables.get(table1Name);
    const table2 = this.tables.get(table2Name);
    if (!table1 || !table2) {
      throw new Error(`Table ${table1Name} or ${table2Name} does not exist`);
    }

    return table1.data.map((record1) => ({
      ...record1,
      [table2Name]: table2.data.find(
        (record2) => record2.id === record1[foreignKey]
      ),
    }));
  }
}

module.exports = Database;
