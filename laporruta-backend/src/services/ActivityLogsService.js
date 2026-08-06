const ActivityLogsModel = require("../models/ActivityLogsModel");
const db = require("../config/database");
const ApiError = require("../utils/ApiError");

class ActivityLogsService {
  constructor() {
    this.activityLogsModel = ActivityLogsModel;
    this.db = db;
  }

  async getTimeline(reportId) {
    if (!reportId) {
      throw new ApiError("Report id wajib diisi", 400);
    }

    const query = `
      SELECT
        al.id,
        al.action_type,
        u.full_name AS actor_name,
        al.old_value,
        al.new_value,
        al.metadata,
        al.is_override,
        al.created_at
      FROM activity_logs al
      LEFT JOIN users u
        ON al.actor_id = u.id
      WHERE al.report_id = $1

      UNION ALL

      SELECT
        gen_random_uuid(),
        'upvote_aggregated',
        NULL,
        NULL,
        NULL,
        jsonb_build_object(
          'week', TO_CHAR(date_trunc('week', created_at), 'IYYY-"W"IW'),
          'count', COUNT(*)
        ),
        FALSE,
        MAX(created_at)
      FROM upvotes
      WHERE report_id = $1
      GROUP BY date_trunc('week', created_at)

      ORDER BY created_at DESC;
    `;

    const { rows } = await this.db.query(query, [reportId]);

    return rows;
  }
}

module.exports = new ActivityLogsService();
