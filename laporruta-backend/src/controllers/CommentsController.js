const CommentsService = require("../services/CommentsService");
const ResponseHelper = require("../utils/ResponseHelper");

class CommentsController {
  constructor() {
    this.service = CommentsService;
  }

  async getComments(req, res, next) {
    try {
      const result = await this.service.getComments(req.params.id);

      return ResponseHelper.paginated(res, result.data, result.metadata);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const result = await this.service.create(
        req.params.id,
        req.user.sub,
        req.body,
      );

      return ResponseHelper.success(res, result, "successfully", 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CommentsController();
