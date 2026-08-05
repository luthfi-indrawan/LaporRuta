const MasterDataModel = require("../models/MasterDataModel");

class MasterDataService {
  constructor() {
    this.masterDataModel = MasterDataModel;
  }

  async getCategories() {
    const categories = await this.masterDataModel.getCategories();

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      urgency_weight: category.urgency_weight,
      icon: category.icon,
      description: category.description,
    }));
  }

  async getWilayah(query) {
    const filters = {};

    if (query.type) {
      filters.type = query.type;
    }

    if (query.parent_id) {
      filters.parent_id = query.parent_id;
    }

    const wilayah = await this.masterDataModel.getWilayah(filters);

    return wilayah.map((item) => ({
      id: item.id,
      parent_id: item.parent_id,
      name: item.name,
      type: item.type,
      code: item.code,
      latitude: item.latitude,
      longitude: item.longitude,
    }));
  }
}
module.exports = new MasterDataService();
