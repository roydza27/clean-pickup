const pool = require("../config/database");

exports.getSchedule = async (req, res) => {
  try {
    const { localityId } = req.params;

    const [schedules] = await pool.query(
      `SELECT gs.*, l.name as locality_name
       FROM garbage_schedules gs
       JOIN localities l ON gs.locality_id = l.locality_id
       WHERE gs.locality_id = ? AND gs.is_active = TRUE
       ORDER BY 
         CASE gs.collection_day
           WHEN 'monday' THEN 1
           WHEN 'tuesday' THEN 2
           WHEN 'wednesday' THEN 3
           WHEN 'thursday' THEN 4
           WHEN 'friday' THEN 5
           WHEN 'saturday' THEN 6
           WHEN 'sunday' THEN 7
         END`,
      [localityId]
    );

    res.json({ schedules });
  } catch (error) {
    console.error("Get schedule error:", error);
    res.status(500).json({ error: "Failed to fetch garbage schedule" });
  }
};

exports.reportMissed = async (req, res) => {
  try {
    const { localityId, scheduledDate, notes } = req.body;

    await pool.query(
      `INSERT INTO missed_garbage_pickups
       (locality_id, scheduled_date, reported_by_user_id, notes)
       VALUES (?, ?, ?, ?)`,
      [localityId, scheduledDate, req.userId, notes]
    );

    res.json({ success: true, message: "Missed pickup reported" });
  } catch (error) {
    console.error("Report missed pickup error:", error);
    res.status(500).json({ error: "Failed to report missed pickup" });
  }
};
