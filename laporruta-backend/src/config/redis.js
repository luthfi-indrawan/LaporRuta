const redis = require("redis");
require("dotenv").config();

class RedisClient {
  constructor() {
    if (!RedisClient.instance) {
      this.client = redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || "localhost",
          port: process.env.REDIS_PORT || 6379,
        },
        password: process.env.REDIS_PASSWORD || undefined,
        database: parseInt(process.env.REDIS_DB || "0"),
      });

      this.client.on("error", (err) =>
        console.error("Redis Client Error:", err),
      );
      this.client.on("connect", () => console.log("Redis connected"));

      RedisClient.instance = this;
    }
    return RedisClient.instance;
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async disconnect() {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }

  async get(key) {
    await this.connect();
    return await this.client.get(key);
  }

  async set(key, value, ttlSeconds = null) {
    await this.connect();
    if (ttlSeconds) {
      return await this.client.setEx(key, ttlSeconds, value);
    }
    return await this.client.set(key, value);
  }

  async del(key) {
    await this.connect();
    return await this.client.del(key);
  }

  async exists(key) {
    await this.connect();
    return await this.client.exists(key);
  }

  async getOrSet(key, callback, ttlSeconds = 3600) {
    const cached = await this.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    const data = await callback();
    await this.set(key, JSON.stringify(data), ttlSeconds);
    return data;
  }

  async flush() {
    await this.connect();
    return await this.client.flushDb();
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
