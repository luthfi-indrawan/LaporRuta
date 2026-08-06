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
  async getStatistics(req, res, next) {
    try {
      const result = await this.service.getStatistics();

      return ResponseHelper.success(res, result, "successfully", 200);
    } catch (error) {
      next(error);
    }
  }
  async getHeatmapData(req, res, next) {
    try {
      const result = await this.service.getHeatmapData();

      return ResponseHelper.success(res, result, "successfully", 200);
    } catch (error) {
      next(error);
    }
  }
  async exportCSV(req, res, next) {
    try {
      const reports = await this.service.exportReportsCSV(req.query);

      const headers = [
        "Title",
        "Description",
        "Category",
        "Wilayah",
        "Address",
        "Status",
        "Created At",
      ];

      const rows = reports.map((report) => [
        report.title,
        report.description,
        report.category,
        report.wilayah,
        report.address_text,
        report.status,
        report.created_at,
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
            .join(","),
        ),
      ].join("\n");

      const today = new Date().toISOString().split("T")[0];

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="laporan-${today}.csv"`,
      );

      return res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminPusatController();
