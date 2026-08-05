const BaseModel = require("./BaseModel");

class MasterDataModel extends BaseModel {
  constructor() {
    super("master_data");
  }

  async getCategories() {
    this.tableName = "categories";

    return this.findAll({
      orderBy: "urgency_weight DESC, name ASC",
    });
  }

  async getWilayah(filters = {}) {
    this.tableName = "wilayah";

    return this.findAll({
      where: filters,
      orderBy: "name ASC",
    });
  }
}

module.exports = new MasterDataModel();
