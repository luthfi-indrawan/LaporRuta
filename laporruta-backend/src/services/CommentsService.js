const CommentsModel = require("../models/CommentsModel");
const db = require("../config/database");
const ApiError = require("../utils/ApiError");

class CommentsService {
  constructor() {
    this.commentsModel = CommentsModel;
    this.db = db;
  }

  async getComments(reportId) {
    if (!reportId) {
      throw new ApiError("Report id wajib diisi", 400);
    }

    const query = `
      SELECT
        c.id,
        u.full_name,
        c.text,
        c.created_at
      FROM comments c
      INNER JOIN users u
        ON c.user_id = u.id
      WHERE c.report_id = $1
      ORDER BY c.created_at DESC
    `;

    const { rows } = await this.db.query(query, [reportId]);

    const data = rows.map((comment) => ({
      id: comment.id,
      user: {
        full_name: comment.full_name,
      },
      text: comment.text,
      created_at: comment.created_at,
    }));

    return {
      data,
      metadata: {
        total: data.length,
      },
    };
  }

  async create(reportId, userId, data) {
    if (!reportId) {
      throw new ApiError("Report id wajib diisi", 400);
    }

    if (!userId) {
      throw new ApiError("Unauthorized", 401);
    }

    const { text } = data;

    if (!text) {
      throw new ApiError("Text wajib diisi", 400);
    }

    if (text.length > 500) {
      throw new ApiError("Text maksimal 500 karakter", 400);
    }

    const reportResult = await this.db.query(
      `
      SELECT id, status
      FROM reports
      WHERE id = $1
      `,
      [reportId],
    );

    if (reportResult.rows.length === 0) {
      throw new ApiError("Report tidak ditemukan", 404);
    }

    if (reportResult.rows[0].status !== "verified") {
      throw new ApiError(
        "Komentar hanya dapat ditambahkan pada laporan yang telah diverifikasi",
        400,
      );
    }

    return await this.commentsModel.create({
      report_id: reportId,
      user_id: userId,
      text,
    });
  }
}

module.exports = new CommentsService();
