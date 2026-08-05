const BaseModel = require("./BaseModel");

class ActivityLogsModel extends BaseModel {
  constructor() {
    super("activity_logs");
  }

  async getTimeline(reportId) {
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
      gen_random_uuid() AS id,
      'upvote_aggregated' AS action_type,
      NULL AS actor_name,
      NULL AS old_value,
      NULL AS new_value,
      jsonb_build_object(
        'week', TO_CHAR(date_trunc('week', created_at), 'IYYY-"W"IW'),
        'count', COUNT(*)
      ) AS metadata,
      FALSE AS is_override,
      MAX(created_at) AS created_at
    FROM upvotes
    WHERE report_id = $1
    GROUP BY date_trunc('week', created_at)

    ORDER BY created_at DESC;
  `;

    const result = await this.db.query(query, [reportId]);

    return result.rows;
  }
}

module.exports = new ActivityLogsModel();
