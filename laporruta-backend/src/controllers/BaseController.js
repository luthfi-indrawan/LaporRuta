class BaseController {
  constructor(service) {
    if (new.target === BaseController) {
      throw new Error('BaseController is abstract and cannot be instantiated directly');
    }
    this.service = service;
  }

  sendSuccess(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  sendError(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
    };
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
  }

  async getAll(req, res, next) {
    try {
      const data = await this.service.getAll(req.query);
      return this.sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await this.service.getById(req.params.id);
      return this.sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const data = await this.service.create(req.body);
      return this.sendSuccess(res, data, 'Created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = await this.service.update(req.params.id, req.body);
      return this.sendSuccess(res, data, 'Updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await this.service.delete(req.params.id);
      return this.sendSuccess(res, null, 'Deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BaseController;
