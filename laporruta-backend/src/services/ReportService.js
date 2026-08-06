const sharp = require("sharp");
const db = require("../config/database");
const UploadService = require("./UploadService");
const socket = require("../config/socket");
const httpStatus = require("../constants/httpStatus");

class ReportService {
  constructor() {
    this.db = db;
    this.uploadService = UploadService;
  }

  get io() {
    return socket.getIO();
  }

  async create(userId, data, files = []) {
    const { title, description, category_id, wilayah_id, address_text, lat, lng } = data;
    const uploaded = [];

    return await this.db.transaction(async (client) => {
      const insertReport = await client.query(
        `INSERT INTO reports
          (user_id, title, description, category_id, wilayah_id, address_text, lat, lng, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending_verification')
         RETURNING *`,
        [userId, title, description, category_id, wilayah_id, address_text, lat ?? null, lng ?? null],
      );
      const report = insertReport.rows[0];

      try {
        for (const file of files) {
          file.buffer = await this.compressImage(file.buffer);

          file.originalname = file.originalname.replace(/\.[^/.]+$/, "") + ".webp";
          file.mimetype = "image/webp";

          const folder = `reports/${report.id}`;
          
          const result = await this.uploadService.uploadSingle(file, folder);
          
          const filePath = result.fileName;
          const imageUrl = result.publicUrl;

          uploaded.push(filePath);

          await client.query(
            `INSERT INTO report_images (report_id, image_url, file_path, is_after)
             VALUES ($1, $2, $3, false)`,
            [report.id, imageUrl, filePath],
          );
        }
      } catch (uploadErr) {
        for (const path of uploaded) {
          try {
            await this.uploadService.deleteFile(path);
          } catch (cleanupErr) {
            console.error("Error occurred while cleaning up upload:", cleanupErr);
          }
        }
        const err = new Error("Gagal mengunggah gambar laporan");
        console.error("Upload error:", uploadErr);
        err.statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        throw err;
      }

      const adminCheck = await client.query(
        `SELECT id FROM users
         WHERE role = 'admin_wilayah' AND assigned_wilayah_id = $1 AND is_active = true
         LIMIT 1`,
        [wilayah_id],
      );
      const hasAssignedAdmin = adminCheck.rows.length > 0;

      await client.query(
        `INSERT INTO activity_logs (report_id, actor_id, action_type, old_value, new_value, is_override)
         VALUES ($1, $2, 'report_created', NULL, 'pending_verification', false)`,
        [report.id, userId],
      );

      const room = hasAssignedAdmin ? `admin:${wilayah_id}` : "admin:pusat";
      this.io.to(room).emit("admin:report_assigned", {
        id: report.id,
        title: report.title,
        wilayah_id,
        zoneless: !hasAssignedAdmin,
      });

      return {
        id: report.id,
        status: report.status,
        redirect_to: "/laporan-saya",
      };
    });
  }

  async getAllReports({ page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;

    const dataResult = await this.db.query(
      `SELECT
         r.id, r.title, r.status, r.created_at, r.updated_at,
         c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
         (SELECT image_url FROM report_images WHERE report_id = r.id AND is_after = false LIMIT 1) AS thumbnail_url,
         (SELECT COUNT(*) FROM upvotes WHERE report_id = r.id) AS upvote_count,
         (r.updated_at > COALESCE(u.last_seen_at, 'epoch')) AS is_unread
       FROM reports r
       JOIN categories c ON c.id = r.category_id
       JOIN users u ON u.id = r.user_id
       ORDER BY r.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    const countResult = await this.db.query(
      `SELECT COUNT(*) FROM reports`,
    );
    const totalItems = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    const data = dataResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      category: {
        name: row.category_name,
        icon: row.category_icon,
        color: row.category_color,
      },
      created_at: row.created_at,
      updated_at: row.updated_at,
      thumbnail_url: row.thumbnail_url,
      upvote_count: parseInt(row.upvote_count, 10),
      is_unread: row.is_unread,
    }));

    return {
      data,
      metadata: {
        current_page: page,
        page_size: limit,
        total_pages: totalPages,
        total_items: totalItems,
        has_next_page: page < totalPages,
        has_prev_page: page > 1,
      },
    };
  }

  async getMyReports(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;

    const dataResult = await this.db.query(
      `SELECT
         r.id, r.title, r.status, r.created_at, r.updated_at,
         c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
         (SELECT image_url FROM report_images WHERE report_id = r.id AND is_after = false LIMIT 1) AS thumbnail_url,
         (SELECT COUNT(*) FROM upvotes WHERE report_id = r.id) AS upvote_count,
         (r.updated_at > COALESCE(u.last_seen_at, 'epoch')) AS is_unread
       FROM reports r
       JOIN categories c ON c.id = r.category_id
       JOIN users u ON u.id = r.user_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );

    const countResult = await this.db.query(
      `SELECT COUNT(*) FROM reports WHERE user_id = $1`,
      [userId],
    );
    const totalItems = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    const data = dataResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      category: {
        name: row.category_name,
        icon: row.category_icon,
        color: row.category_color,
      },
      created_at: row.created_at,
      updated_at: row.updated_at,
      thumbnail_url: row.thumbnail_url,
      upvote_count: parseInt(row.upvote_count, 10),
      is_unread: row.is_unread,
    }));

    return {
      data,
      metadata: {
        current_page: page,
        page_size: limit,
        total_pages: totalPages,
        total_items: totalItems,
        has_next_page: page < totalPages,
        has_prev_page: page > 1,
      },
    };
  }

  async getMyReportDetail(userId, reportId) {
    const result = await this.db.query(
      `SELECT r.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
              w.name AS wilayah_name, w.type AS wilayah_type
       FROM reports r
       JOIN categories c ON c.id = r.category_id
       JOIN wilayah w ON w.id = r.wilayah_id
       WHERE r.id = $1 AND r.user_id = $2`,
      [reportId, userId],
    );

    const report = result.rows[0];
    if (!report) {
      const err = new Error("Laporan tidak ditemukan");
      err.statusCode = httpStatus.NOT_FOUND;
      throw err;
    }

    const imagesResult = await this.db.query(
      `SELECT id, image_url, is_after FROM report_images WHERE report_id = $1 ORDER BY created_at ASC`,
      [reportId],
    );

    return {
      id: report.id,
      title: report.title,
      description: report.description,
      status: report.status,
      rejection_reason: report.rejection_reason,
      address_text: report.address_text,
      lat: report.lat,
      lng: report.lng,
      category: {
        name: report.category_name,
        icon: report.category_icon,
        color: report.category_color,
      },
      wilayah: { name: report.wilayah_name, type: report.wilayah_type },
      images: imagesResult.rows,
      created_at: report.created_at,
      updated_at: report.updated_at,
    };
  }

  async createDispute(userId, reportId, reason) {
    const reportResult = await this.db.query(
      `SELECT id, status FROM reports WHERE id = $1 AND user_id = $2`,
      [reportId, userId],
    );
    const report = reportResult.rows[0];

    if (!report) {
      const err = new Error("Laporan tidak ditemukan");
      err.statusCode = httpStatus.NOT_FOUND;
      throw err;
    }
    if (report.status !== "resolved") {
      const err = new Error("Hanya laporan berstatus resolved yang dapat diajukan sengketa");
      err.statusCode = httpStatus.BAD_REQUEST;
      throw err;
    }

    return await this.db.transaction(async (client) => {
      const disputeResult = await client.query(
        `INSERT INTO disputes (report_id, user_id, reason, status)
         VALUES ($1, $2, $3, 'flagged_for_review')
         RETURNING id`,
        [reportId, userId, reason],
      );

      await client.query(
        `INSERT INTO activity_logs (report_id, actor_id, action_type, old_value, new_value, is_override)
         VALUES ($1, $2, 'dispute_requested', 'resolved', 'flagged_for_review', false)`,
        [reportId, userId],
      );

      this.io.to("admin:pusat").emit("report:dispute_requested", {
        report_id: reportId,
        dispute_id: disputeResult.rows[0].id,
      });

      return {
        dispute_id: disputeResult.rows[0].id,
        status: "flagged_for_review",
      };
    });
  }

  async compressImage(buffer) {
    let output = await sharp(buffer)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    if (output.length > 500 * 1024) {
      output = await sharp(buffer)
        .resize(800, 800, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 60 })
        .toBuffer();
    }
    return output;
  }
}

module.exports = new ReportService();