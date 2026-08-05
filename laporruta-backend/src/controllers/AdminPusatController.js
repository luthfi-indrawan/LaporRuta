const AdminPusatService = require("../services/AdminPusatService");
const ResponseHelper = require("../utils/ResponseHelper");

class AdminPusatController {
  constructor() {
    this.service = AdminPusatService;
  }

  async getAllReports(req, res, next) {
    try {
      const reports = await this.service.getAllReports(req.query);

      return ResponseHelper.success(res, reports, "successfully", 200);
    } catch (error) {
      next(error);
    }
  }
  async getZonelessReports(req, res, next) {
    try {
      const reports = await this.service.getZonelessReports();

      return ResponseHelper.success(res, reports, "successfully", 200);
    } catch (error) {
      next(error);
    }
  }
  async overrideReportStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!status) {
        const err = new Error("Status wajib diisi");
        err.statusCode = 400;
        throw err;
      }

      const result = await this.service.overrideReportStatus(
        id,
        req.user.sub,
        status,
        reason,
      );

      return ResponseHelper.success(
        res,
        result,
        "Status laporan berhasil diubah",
        200,
      );
    } catch (error) {
      next(error);
    }
  }
  async reassignReportZone(req, res, next) {
    try {
      const { id } = req.params;
      const { wilayah_id } = req.body;

      if (!wilayah_id) {
        const err = new Error("Wilayah wajib diisi");
        err.statusCode = 400;
        throw err;
      }

      const result = await this.service.reassignReportZone(
        id,
        req.user.sub,
        wilayah_id,
      );

      return ResponseHelper.success(
        res,
        result,
        "Zona laporan berhasil dipindahkan",
        200,
      );
    } catch (error) {
      next(error);
    }
  }
  async editReportMetadata(req, res, next) {
    try {
      const { id } = req.params;

      const result = await this.service.editReportMetadata(
        id,
        req.user.sub,
        req.body,
      );

      return ResponseHelper.success(
        res,
        result,
        "Metadata laporan berhasil diperbarui",
        200,
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminPusatController();
