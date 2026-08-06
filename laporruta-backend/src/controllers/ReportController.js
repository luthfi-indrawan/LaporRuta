const ReportService = require("../services/ReportService");
const ResponseHelper = require("../utils/ResponseHelper");

class ReportController {
  constructor() {
    this.service = ReportService;
  }

  // POST /reports
  create = async (req, res, next) => {
    try {
      const userId = req.user.sub;
      const files = req.files || [];
      const data = await this.service.create(userId, req.body, files);
      return ResponseHelper.success(
        res,
        data,
        "Laporan berhasil dikirim dan sedang menunggu verifikasi admin.",
        201
      );
    } catch (error) {
      next(error);
    }
  };

  // GET /reports
  getAllReports = async (req, res, next) => {
    try {
      const page = Number.parseInt(req.query.page, 10) || 1;
      const limit = Number.parseInt(req.query.limit, 10) || 20;
      const data = await this.service.getAllReports({ page, limit });
      return ResponseHelper.success(res, data);
    } catch (error) {
      next(error);
    }
  };

  // GET /reports/my
  getMyReports = async (req, res, next) => {
    try {
      const userId = req.user.sub;
      const page = Number.parseInt(req.query.page, 10) || 1;
      const limit = Number.parseInt(req.query.limit, 10) || 20;
      const data = await this.service.getMyReports(userId, { page, limit });
      return ResponseHelper.success(res, data);
    } catch (error) {
      next(error);
    }
  };

  // GET /reports/my/:id
  getMyReportDetail = async (req, res, next) => {
    try {
      const userId = req.user.sub;
      const data = await this.service.getMyReportDetail(userId, req.params.id);
      return ResponseHelper.success(res, data);
    } catch (error) {
      next(error);
    }
  };

  // POST /reports/:id/dispute
  dispute = async (req, res, next) => {
    try {
      const userId = req.user.sub;
      const { reason } = req.body;
      const data = await this.service.createDispute(userId, req.params.id, reason);
      return ResponseHelper.success(
        res,
        data,
        "Permintaan tinjauan ulang berhasil dikirim",
        201
      );
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new ReportController();