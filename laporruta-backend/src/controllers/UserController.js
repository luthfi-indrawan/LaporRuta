const BaseController = require('./BaseController');
const UserService = require('../services/UserService');

class UserController extends BaseController {
  constructor() {
    super(UserService);
  }

  async getAll(req, res, next) {
    try {
      const data = await UserService.getAllWithCache();
      return this.sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await UserService.getByIdWithCache(req.params.id);
      return this.sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
