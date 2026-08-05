const ActivityLogsService = require("../services/ActivityLogsService");
const ResponseHelper = require("../utils/ResponseHelper");

class ActivityLogsController {
  constructor() {
    this.service = ActivityLogsService;
  }

  async getTimeline(req, res, next) {
    try {
      const timeline = await this.service.getTimeline(req.params.id);

      return ResponseHelper.success(res, timeline, "successfully", 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ActivityLogsController();
