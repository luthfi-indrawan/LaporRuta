const BaseModel = require("./BaseModel");

class ActivityLogsModel extends BaseModel {
  constructor() {
    super("activity_logs");
  }
}

module.exports = new ActivityLogsModel();
