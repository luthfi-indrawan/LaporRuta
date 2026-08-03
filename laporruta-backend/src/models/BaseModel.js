const db = require('../config/database');

class BaseModel {
  constructor(tableName) {
    if (new.target === BaseModel) {
      throw new Error('BaseModel is abstract and cannot be instantiated directly');
    }
    this.tableName = tableName;
    this.db = db;
  }

  async findAll(options = {}) {
    const { where = {}, orderBy = 'id DESC', limit = null, offset = null } = options;
    let query = `SELECT * FROM ${this.tableName}`;
    const values = [];
    const conditions = [];

    Object.keys(where).forEach((key, index) => {
      conditions.push(`${key} = $${index + 1}`);
      values.push(where[key]);
    });

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY ${orderBy}`;

    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    if (offset) {
      query += ` OFFSET ${offset}`;
    }

    const result = await this.db.query(query, values);
    return result.rows;
  }

  async findById(id) {
    const result = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findOne(where) {
    const rows = await this.findAll({ where, limit: 1 });
    return rows[0] || null;
  }

  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    const result = await this.db.query(
      `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

    const result = await this.db.query(
      `UPDATE ${this.tableName} SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    return result.rows[0];
  }

  async delete(id) {
    const result = await this.db.query(
      `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  async count(where = {}) {
    let query = `SELECT COUNT(*) FROM ${this.tableName}`;
    const values = [];
    const conditions = [];

    Object.keys(where).forEach((key, index) => {
      conditions.push(`${key} = $${index + 1}`);
      values.push(where[key]);
    });

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await this.db.query(query, values);
    return parseInt(result.rows[0].count);
  }
}

module.exports = BaseModel;
