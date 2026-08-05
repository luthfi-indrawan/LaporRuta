const AdminPusatModel = require("../models/AdminPusatModel");
const db = require("../config/database");

class AdminPusatService {
  constructor() {
    this.adminPusatModel = AdminPusatModel;
    this.db = db;
  }

  async getAllReports(filters = {}) {
    const values = [];
    const conditions = [];

    let query = `
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
    `;

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

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += `
      GROUP BY
        r.id,
        c.id,
        w.id,
        u.id

      ORDER BY
        c.urgency_weight DESC,
        r.created_at DESC
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

    JOIN categories c
      ON c.id = r.category_id

    JOIN wilayah w
      ON w.id = r.wilayah_id

    JOIN users u
      ON u.id = r.user_id

    LEFT JOIN upvotes up
      ON up.report_id = r.id

    WHERE
      r.status = 'pending_verification'
      AND NOT EXISTS (
        SELECT 1
        FROM users aw
        WHERE aw.role = 'admin_wilayah'
          AND aw.assigned_wilayah_id = r.wilayah_id
          AND aw.is_active = TRUE
      )

    GROUP BY
      r.id,
      c.id,
      w.id,
      u.id

    ORDER BY
      c.urgency_weight DESC,
      r.created_at DESC
  `;

    const result = await this.db.query(query);

    return result.rows;
  }
  async overrideReportStatus(reportId, adminId, status, reason) {
    return await this.db.transaction(async (client) => {
      const reportResult = await client.query(
        `
      SELECT id, status
      FROM reports
      WHERE id = $1
      `,
        [reportId],
      );

      if (reportResult.rows.length === 0) {
        const err = new Error("Report tidak ditemukan");
        err.statusCode = 404;
        throw err;
      }

      const oldStatus = reportResult.rows[0].status;
      await client.query(
        `
      UPDATE reports
      SET
        status = $1,
        updated_at = NOW()
      WHERE id = $2
      `,
        [status, reportId],
      );

      await client.query(
        `
      INSERT INTO activity_logs (
        report_id,
        actor_id,
        action_type,
        old_value,
        new_value,
        metadata,
        is_override,
        created_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        TRUE,
        NOW()
      )
      `,
        [
          reportId,
          adminId,
          "status_override",
          oldStatus,
          status,
          JSON.stringify({ reason }),
        ],
      );

      return {
        report_id: reportId,
        old_status: oldStatus,
        new_status: status,
        reason,
      };
    });
  }
  async reassignReportZone(reportId, adminId, wilayahId) {
    return await this.db.transaction(async (client) => {
      const reportResult = await client.query(
        `
      SELECT id, wilayah_id
      FROM reports
      WHERE id = $1
      `,
        [reportId],
      );

      if (reportResult.rows.length === 0) {
        const err = new Error("Report tidak ditemukan");
        err.statusCode = 404;
        throw err;
      }

      const wilayahResult = await client.query(
        `
      SELECT id, name
      FROM wilayah
      WHERE id = $1
      `,
        [wilayahId],
      );

      if (wilayahResult.rows.length === 0) {
        const err = new Error("Wilayah tidak ditemukan");
        err.statusCode = 404;
        throw err;
      }

      const oldWilayahId = reportResult.rows[0].wilayah_id;

      await client.query(
        `
      UPDATE reports
      SET
        wilayah_id = $1,
        updated_at = NOW()
      WHERE id = $2
      `,
        [wilayahId, reportId],
      );

      const adminResult = await client.query(
        `
      SELECT id
      FROM users
      WHERE role = 'admin_wilayah'
        AND assigned_wilayah_id = $1
        AND is_active = TRUE
      LIMIT 1
      `,
        [wilayahId],
      );

      const hasAdmin = adminResult.rows.length > 0;

      await client.query(
        `
      INSERT INTO activity_logs (
        report_id,
        actor_id,
        action_type,
        old_value,
        new_value,
        metadata,
        is_override,
        created_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        TRUE,
        NOW()
      )
      `,
        [
          reportId,
          adminId,
          "zone_reassigned",
          oldWilayahId,
          wilayahId,
          JSON.stringify({
            has_admin: hasAdmin,
          }),
        ],
      );

      return {
        report_id: reportId,
        old_wilayah_id: oldWilayahId,
        new_wilayah_id: wilayahId,
        fallback_admin_pusat: !hasAdmin,
      };
    });
  }
  async editReportMetadata(reportId, adminId, data) {
    return await this.db.transaction(async (client) => {
      const { title, description, category_id, address_text } = data;

      const reportResult = await client.query(
        `
      SELECT *
      FROM reports
      WHERE id = $1
      `,
        [reportId],
      );

      if (reportResult.rows.length === 0) {
        const err = new Error("Report tidak ditemukan");
        err.statusCode = 404;
        throw err;
      }

      const report = reportResult.rows[0];

      const categoryResult = await client.query(
        `
      SELECT id
      FROM categories
      WHERE id = $1
      `,
        [category_id],
      );

      if (categoryResult.rows.length === 0) {
        const err = new Error("Kategori tidak ditemukan");
        err.statusCode = 404;
        throw err;
      }

      await client.query(
        `
      UPDATE reports
      SET
        title = $1,
        description = $2,
        category_id = $3,
        address_text = $4,
        updated_at = NOW()
      WHERE id = $5
      `,
        [title, description, category_id, address_text, reportId],
      );

      await client.query(
        `
      INSERT INTO activity_logs (
        report_id,
        actor_id,
        action_type,
        old_value,
        new_value,
        metadata,
        is_override,
        created_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        FALSE,
        NOW()
      )
      `,
        [
          reportId,
          adminId,
          "report_metadata_updated",
          JSON.stringify({
            title: report.title,
            description: report.description,
            category_id: report.category_id,
            address_text: report.address_text,
          }),
          JSON.stringify({
            title,
            description,
            category_id,
            address_text,
          }),
          JSON.stringify({
            updated_by: "admin_pusat",
          }),
        ],
      );

      return {
        report_id: reportId,
        title,
        description,
        category_id,
        address_text,
      };
    });
  }
}

module.exports = new AdminPusatService();
