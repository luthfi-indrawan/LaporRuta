const BaseModel = require("./BaseModel");

class AdminPusatModel extends BaseModel {
  constructor() {
    super("admin_pusat");
  }
}

module.exports = new AdminPusatModel();
