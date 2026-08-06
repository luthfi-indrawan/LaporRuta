const AdminPusatModel = require("../models/AdminPusatModel");
const db = require("../config/database");

class AdminPusatService {
  constructor() {
    this.adminPusatModel = AdminPusatModel;
    this.db = db;
  }

  _createError(message, statusCode = 404) {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
  }

  _buildFilterConditions(filters) {
    const values = [];
    const conditions = [];
    let index = 1;

    if (filters.status) {
      conditions.push(`r.status = $${index++}`);
      values.push(filters.status);
    }

    if (filters.category_id) {
      conditions.push(`r.category_id = $${index++}`);
      values.push(filters.category_id);
    }

    if (filters.wilayah_id) {
      conditions.push(`r.wilayah_id = $${index++}`);
      values.push(filters.wilayah_id);
    }

    const whereClause =
      conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
    return { whereClause, values };
  }

  async _logActivity(
    client,
    {
      reportId,
      actorId,
      actionType,
      oldValue,
      newValue,
      metadata,
      isOverride = true,
    },
  ) {
    const query = `
      INSERT INTO activity_logs (
        report_id, actor_id, action_type, old_value, new_value, metadata, is_override, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `;

    await client.query(query, [
      reportId,
      actorId,
      actionType,
      typeof oldValue === "object" ? JSON.stringify(oldValue) : oldValue,
      typeof newValue === "object" ? JSON.stringify(newValue) : newValue,
      typeof metadata === "object" ? JSON.stringify(metadata) : metadata,
      isOverride,
    ]);
  }

  async getAllReports(filters = {}) {
    const { whereClause, values } = this._buildFilterConditions(filters);

    const query = `
      SELECT
        r.id,
        r.title,
        r.description,
        r.status,
        r.address_text,
        r.created_at,
        r.updated_at,
        c.id AS category_id,
        c.name AS category_name,
        c.color,
        c.urgency_weight,
        w.id AS wilayah_id,
        w.name AS wilayah_name,
        u.id AS reporter_id,
        u.full_name AS reporter_name,
        COUNT(up.id) AS upvotes
      FROM reports r
      JOIN categories c ON c.id = r.category_id
      JOIN wilayah w ON w.id = r.wilayah_id
      JOIN users u ON u.id = r.user_id
      LEFT JOIN upvotes up ON up.report_id = r.id
      ${whereClause}
      GROUP BY r.id, c.id, w.id, u.id
      ORDER BY c.urgency_weight DESC, r.created_at DESC
    `;

    const result = await this.db.query(query, values);
    return result.rows;
  }

  async getZonelessReports() {
    const query = `
      SELECT
        r.id,
        r.title,
        r.description,
        r.status,
        r.address_text,
        r.created_at,
        r.updated_at,
        c.id AS category_id,
        c.name AS category_name,
        c.color,
        c.urgency_weight,
        w.id AS wilayah_id,
        w.name AS wilayah_name,
        u.id AS reporter_id,
        u.full_name AS reporter_name,
        COUNT(up.id) AS upvotes
      FROM reports r
      JOIN categories c ON c.id = r.category_id
      JOIN wilayah w ON w.id = r.wilayah_id
      JOIN users u ON u.id = r.user_id
      LEFT JOIN upvotes up ON up.report_id = r.id
      WHERE r.status = 'pending_verification'
        AND NOT EXISTS (
          SELECT 1
          FROM users aw
          WHERE aw.role = 'admin_wilayah'
            AND aw.assigned_wilayah_id = r.wilayah_id
            AND aw.is_active = TRUE
        )
      GROUP BY r.id, c.id, w.id, u.id
      ORDER BY c.urgency_weight DESC, r.created_at DESC
    `;

    const result = await this.db.query(query);
    return result.rows;
  }

  async overrideReportStatus(reportId, adminId, status, reason) {
    return this.db.transaction(async (client) => {
      const reportResult = await client.query(
        `SELECT id, status FROM reports WHERE id = $1`,
        [reportId],
      );

      if (reportResult.rows.length === 0) {
        throw this._createError("Report tidak ditemukan", 404);
      }

      const oldStatus = reportResult.rows[0].status;

      await client.query(
        `UPDATE reports SET status = $1, updated_at = NOW() WHERE id = $2`,
        [status, reportId],
      );

      await this._logActivity(client, {
        reportId,
        actorId: adminId,
        actionType: "status_override",
        oldValue: oldStatus,
        newValue: status,
        metadata: { reason },
        isOverride: true,
      });

      return {
        report_id: reportId,
        old_status: oldStatus,
        new_status: status,
        reason,
      };
    });
  }

  async reassignReportZone(reportId, adminId, wilayahId) {
    return this.db.transaction(async (client) => {
      const reportResult = await client.query(
        `SELECT id, wilayah_id FROM reports WHERE id = $1`,
        [reportId],
      );

      if (reportResult.rows.length === 0) {
        throw this._createError("Report tidak ditemukan", 404);
      }

      const wilayahResult = await client.query(
        `SELECT id, name FROM wilayah WHERE id = $1`,
        [wilayahId],
      );

      if (wilayahResult.rows.length === 0) {
        throw this._createError("Wilayah tidak ditemukan", 404);
      }

      const oldWilayahId = reportResult.rows[0].wilayah_id;

      await client.query(
        `UPDATE reports SET wilayah_id = $1, updated_at = NOW() WHERE id = $2`,
        [wilayahId, reportId],
      );

      const adminResult = await client.query(
        `SELECT id FROM users WHERE role = 'admin_wilayah' AND assigned_wilayah_id = $1 AND is_active = TRUE LIMIT 1`,
        [wilayahId],
      );

      const hasAdmin = adminResult.rows.length > 0;

      await this._logActivity(client, {
        reportId,
        actorId: adminId,
        actionType: "zone_reassigned",
        oldValue: oldWilayahId,
        newValue: wilayahId,
        metadata: { has_admin: hasAdmin },
        isOverride: true,
      });

      return {
        report_id: reportId,
        old_wilayah_id: oldWilayahId,
        new_wilayah_id: wilayahId,
        fallback_admin_pusat: !hasAdmin,
      };
    });
  }

  async editReportMetadata(reportId, adminId, data) {
    return this.db.transaction(async (client) => {
      const { title, description, category_id, address_text } = data;

      const reportResult = await client.query(
        `SELECT * FROM reports WHERE id = $1`,
        [reportId],
      );

      if (reportResult.rows.length === 0) {
        throw this._createError("Report tidak ditemukan", 404);
      }

      const report = reportResult.rows[0];

      const categoryResult = await client.query(
        `SELECT id FROM categories WHERE id = $1`,
        [category_id],
      );

      if (categoryResult.rows.length === 0) {
        throw this._createError("Kategori tidak ditemukan", 404);
      }

      await client.query(
        `UPDATE reports SET title = $1, description = $2, category_id = $3, address_text = $4, updated_at = NOW() WHERE id = $5`,
        [title, description, category_id, address_text, reportId],
      );

      await this._logActivity(client, {
        reportId,
        actorId: adminId,
        actionType: "report_metadata_updated",
        oldValue: {
          title: report.title,
          description: report.description,
          category_id: report.category_id,
          address_text: report.address_text,
        },
        newValue: { title, description, category_id, address_text },
        metadata: { updated_by: "admin_pusat" },
        isOverride: false,
      });

      return {
        report_id: reportId,
        title,
        description,
        category_id,
        address_text,
      };
    });
  }

  async getStatistics() {
    const [
      totalResult,
      statusResult,
      categoryResult,
      resolutionResult,
      avgResult,
    ] = await Promise.all([
      this.db.query(`SELECT COUNT(*) AS total_reports FROM reports`),
      this.db.query(
        `SELECT status, COUNT(*) AS total FROM reports GROUP BY status`,
      ),
      this.db.query(`
        SELECT c.name AS category, COUNT(r.id) AS count
        FROM reports r
        JOIN categories c ON c.id = r.category_id
        GROUP BY c.id, c.name
        ORDER BY count DESC
        LIMIT 5
      `),
      this.db.query(`
        SELECT ROUND(
          (COUNT(*) FILTER (WHERE status = 'resolved')::numeric / NULLIF(COUNT(*), 0)) * 100, 2
        ) AS resolution_rate
        FROM reports
      `),
      this.db.query(`
        SELECT ROUND(
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400)::numeric, 2
        ) AS avg_resolution_days
        FROM reports
        WHERE status = 'resolved'
      `),
    ]);

    const statusBreakdown = {
      pending_verification: 0,
      verified: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0,
    };

    statusResult.rows.forEach((row) => {
      statusBreakdown[row.status] = Number(row.total);
    });

    return {
      total_reports: Number(totalResult.rows[0].total_reports),
      resolution_rate: Number(resolutionResult.rows[0].resolution_rate) || 0,
      avg_resolution_days: Number(avgResult.rows[0].avg_resolution_days) || 0,
      status_breakdown: statusBreakdown,
      top_categories: categoryResult.rows.map((row) => ({
        category: row.category,
        count: Number(row.count),
      })),
    };
  }

  async getHeatmapData() {
    const query = `
      SELECT r.lat, r.lng, COUNT(u.id) + 1 AS intensity
      FROM reports r
      LEFT JOIN upvotes u ON u.report_id = r.id
      WHERE r.lat IS NOT NULL AND r.lng IS NOT NULL
      GROUP BY r.id, r.lat, r.lng
      ORDER BY intensity DESC
    `;

    const result = await this.db.query(query);

    return result.rows.map((row) => ({
      lat: Number(row.lat),
      lng: Number(row.lng),
      intensity: Number(row.intensity),
    }));
  }

  async exportReportsCSV(filters = {}) {
    const { whereClause, values } = this._buildFilterConditions(filters);

    const query = `
      SELECT
        r.title,
        r.description,
        c.name AS category,
        w.name AS wilayah,
        r.address_text,
        r.status,
        r.created_at
      FROM reports r
      JOIN categories c ON c.id = r.category_id
      JOIN wilayah w ON w.id = r.wilayah_id
      ${whereClause}
      ORDER BY r.created_at DESC
    `;

    const result = await this.db.query(query, values);
    return result.rows;
  }
}

module.exports = new AdminPusatService();
