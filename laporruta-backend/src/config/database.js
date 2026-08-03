const { Pool } = require("pg");
require("dotenv").config();

class Database {
  constructor() {
    if (!Database.instance) {
      this.pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl:
          process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      this.pool.on("error", (err) => {
        console.error("Unexpected error on idle client", err);
        process.exit(-1);
      });

      Database.instance = this;
    }
    return Database.instance;
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log("Executed query", {
        text: text.substring(0, 50),
        duration,
        rows: result.rowCount,
      });
      return result;
    } catch (error) {
      console.error("Database query error:", error);
      throw error;
    }
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

const db = new Database();
module.exports = db;
