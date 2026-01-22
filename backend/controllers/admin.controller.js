const pool = require("../config/database");

// Get all pending pickup requests
exports.getPendingPickups = async (req, res) => {
  try {
    const [requests] = await pool.query(
      `SELECT pr.*, 
              u.name as citizen_name, u.phone_number as citizen_phone,
              l.name as locality_name, l.city
       FROM pickup_requests pr
       JOIN users u ON pr.citizen_id = u.user_id
       JOIN localities l ON pr.locality_id = l.locality_id
       WHERE pr.status = 'pending'
       ORDER BY pr.preferred_date, pr.created_at`
    );

    res.json({ requests });
  } catch (error) {
    console.error("Get pending requests error:", error);
    res.status(500).json({ error: "Failed to fetch pending requests" });
  }
};

// Get available kabadiwalas
exports.getKabadiwalas = async (req, res) => {
  try {
    const { localityId } = req.query;

    const query = `
      SELECT u.user_id, u.name, u.phone_number,
             kp.trust_score, kp.total_pickups, kp.completed_pickups, kp.is_available,
             l.name as service_locality_name
      FROM users u
      JOIN kabadiwala_profiles kp ON u.user_id = kp.user_id
      LEFT JOIN localities l ON kp.service_locality_id = l.locality_id
      WHERE u.role = 'kabadiwala' AND u.is_active = TRUE
      ${localityId ? "AND kp.service_locality_id = ?" : ""}
      ORDER BY kp.trust_score DESC, kp.is_available DESC
    `;

    const [kabadiwalas] = await pool.query(
      query,
      localityId ? [localityId] : []
    );

    res.json({ kabadiwalas });
  } catch (error) {
    console.error("Get kabadiwalas error:", error);
    res.status(500).json({ error: "Failed to fetch kabadiwalas" });
  }
};

// Assign pickup to kabadiwala
exports.assignPickup = async (req, res) => {
  try {
    const { requestId, kabadiwalId, assignedDate, sequenceOrder } = req.body;

    const [existing] = await pool.query(
      "SELECT * FROM pickup_assignments WHERE request_id = ?",
      [requestId]
    );

    if (existing.length) {
      return res.status(400).json({ error: "Pickup already assigned" });
    }

    const [result] = await pool.query(
      `INSERT INTO pickup_assignments (request_id, kabadiwala_id, assigned_date, sequence_order)
       VALUES (?, ?, ?, ?)`,
      [requestId, kabadiwalId, assignedDate, sequenceOrder || 1]
    );

    await pool.query(
      "UPDATE pickup_requests SET status = 'assigned' WHERE request_id = ?",
      [requestId]
    );

    await pool.query(
      "UPDATE kabadiwala_profiles SET total_pickups = total_pickups + 1 WHERE user_id = ?",
      [kabadiwalId]
    );

    res.json({
      success: true,
      message: "Pickup assigned successfully",
      assignmentId: result.insertId,
    });
  } catch (error) {
    console.error("Assign pickup error:", error);
    res.status(500).json({ error: "Failed to assign pickup" });
  }
};

// Analytics dashboard
exports.getAnalytics = async (req, res) => {
  try {
    const [[totalPickups]] = await pool.query(
      "SELECT COUNT(*) as count FROM pickup_requests WHERE status = 'completed'"
    );

    const [[totalWeight]] = await pool.query(
      "SELECT SUM(actual_weight) as total FROM pickup_assignments WHERE status = 'completed'"
    );

    const [[totalEarnings]] = await pool.query(
      "SELECT SUM(amount) as total FROM payment_records WHERE payment_status = 'paid'"
    );

    const [[activeKabadiwalas]] = await pool.query(
      "SELECT COUNT(*) as count FROM kabadiwala_profiles WHERE is_available = TRUE"
    );

    res.json({
      summary: {
        totalPickups: totalPickups.count,
        totalWeightKg: totalWeight.total || 0,
        totalEarnings: totalEarnings.total || 0,
        activeKabadiwalas: activeKabadiwalas.count,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};
