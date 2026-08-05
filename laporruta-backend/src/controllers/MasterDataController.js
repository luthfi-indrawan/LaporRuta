const MasterDataService = require("../services/MasterDataService");
const ResponseHelper = require("../utils/ResponseHelper");

class MasterDataController {
  constructor() {
    this.service = MasterDataService;
  }

  async getCategories(req, res, next) {
    try {
      const categories = await this.service.getCategories();

      return ResponseHelper.success(res, categories, "successfully", 200);
    } catch (error) {
      next(error);
    }
  }
  async getWilayah(req, res, next) {
    try {
      const wilayah = await this.service.getWilayah(req.query);

      return ResponseHelper.success(res, wilayah, "successfully", 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MasterDataController();
