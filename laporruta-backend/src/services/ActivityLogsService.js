const ActivityLogsModel = require("../models/ActivityLogsModel");
const ApiError = require("../utils/ApiError");

class ActivityLogsService {
  constructor() {
    this.activityLogsModel = ActivityLogsModel;
  }

  async getTimeline(reportId) {
    if (!reportId) {
      throw new ApiError("Report id wajib diisi", 400);
    }

    return await this.activityLogsModel.getTimeline(reportId);
  }
}

module.exports = new ActivityLogsService();
