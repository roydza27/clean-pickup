const { query } = require('../shared/db/index');

exports.getSchedule = async (req, res, next) => {
  try {
    const { localityId } = req.params;

    const result = await query(
      `SELECT gs.*, l.name AS locality_name
       FROM garbage_schedules gs
       JOIN localities l ON gs.locality_id = l.locality_id
       WHERE gs.locality_id = $1
         AND gs.is_active = TRUE
       ORDER BY
         CASE gs.collection_day
           WHEN 'monday'    THEN 1
           WHEN 'tuesday'   THEN 2
           WHEN 'wednesday' THEN 3
           WHEN 'thursday'  THEN 4
           WHEN 'friday'    THEN 5
           WHEN 'saturday'  THEN 6
           WHEN 'sunday'    THEN 7
         END`,
      [localityId]
    );

    res.json({ success: true, schedules: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.getAllSchedules = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT gs.*, l.name AS locality_name, l.city
       FROM garbage_schedules gs
       JOIN localities l ON gs.locality_id = l.locality_id
       WHERE gs.is_active = TRUE
       ORDER BY l.name, CASE gs.collection_day
         WHEN 'monday'    THEN 1
         WHEN 'tuesday'   THEN 2
         WHEN 'wednesday' THEN 3
         WHEN 'thursday'  THEN 4
         WHEN 'friday'    THEN 5
         WHEN 'saturday'  THEN 6
         WHEN 'sunday'    THEN 7
       END`
    );

    res.json({ success: true, schedules: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.reportMissed = async (req, res, next) => {
  try {
    const { localityId, scheduledDate, notes } = req.body;

    await query(
      `INSERT INTO missed_garbage_pickups (locality_id, scheduled_date, reported_by_user_id, notes)
       VALUES ($1, $2, $3, $4)`,
      [localityId, scheduledDate, req.user.userId, notes]
    );

    res.status(201).json({ success: true, message: 'Missed pickup reported' });
  } catch (err) {
    next(err);
  }
};

exports.getMissedReports = async (req, res, next) => {
  try {
    const { localityId } = req.query;

    let sql = `
      SELECT mgp.*, l.name AS locality_name, u.name AS reported_by_name
      FROM missed_garbage_pickups mgp
      JOIN localities l ON mgp.locality_id = l.locality_id
      JOIN users u       ON mgp.reported_by_user_id = u.user_id
      WHERE 1=1
    `;

    const params = [];
    if (localityId) { sql += ' AND mgp.locality_id = $1'; params.push(localityId); }

    sql += ' ORDER BY mgp.created_at DESC';

    const result = await query(sql, params);
    res.json({ success: true, reports: result.rows });
  } catch (err) {
    next(err);
  }
};
