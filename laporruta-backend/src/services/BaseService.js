class BaseService {
  constructor(model) {
    if (new.target === BaseService) {
      throw new Error('BaseService is abstract and cannot be instantiated directly');
    }
    this.model = model;
  }

  async getAll(options = {}) {
    return await this.model.findAll(options);
  }

  async getById(id) {
    const data = await this.model.findById(id);
    if (!data) {
      throw new Error('Data not found');
    }
    return data;
  }

  async create(data) {
    return await this.model.create(data);
  }

  async update(id, data) {
    await this.getById(id);
    return await this.model.update(id, data);
  }

  async delete(id) {
    await this.getById(id);
    return await this.model.delete(id);
  }
}

module.exports = BaseService;
