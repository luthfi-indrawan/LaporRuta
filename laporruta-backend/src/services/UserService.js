const BaseService = require('./BaseService');
const UserModel = require('../models/UserModel');
const redisClient = require('../config/redis');

class UserService extends BaseService {
  constructor() {
    super(UserModel);
  }

  async getAllWithCache() {
    return await redisClient.getOrSet(
      'users:all',
      async () => await this.getAll(),
      300
    );
  }

  async getByIdWithCache(id) {
    return await redisClient.getOrSet(
      `users:${id}`,
      async () => await this.getById(id),
      300
    );
  }

  async invalidateCache(id = null) {
    await redisClient.del('users:all');
    if (id) await redisClient.del(`users:${id}`);
  }

  async create(data) {
    const result = await super.create(data);
    await this.invalidateCache();
    return result;
  }

  async update(id, data) {
    const result = await super.update(id, data);
    await this.invalidateCache(id);
    return result;
  }

  async delete(id) {
    const result = await super.delete(id);
    await this.invalidateCache(id);
    return result;
  }
}

module.exports = new UserService();
