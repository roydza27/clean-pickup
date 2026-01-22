const pool = require("../config/database");

// GET ASSIGNED PICKUPS
exports.getPickups = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split("T")[0];

    const [pickups] = await pool.query(
      `SELECT pa.*, pr.*, 
              u.name as citizen_name, u.phone_number as citizen_phone,
              l.name as locality_name,
              sr.rate_per_kg
       FROM pickup_assignments pa
       JOIN pickup_requests pr ON pa.request_id = pr.request_id
       JOIN users u ON pr.citizen_id = u.user_id
       JOIN localities l ON pr.locality_id = l.locality_id
       LEFT JOIN scrap_rates sr 
         ON pr.locality_id = sr.locality_id 
        AND pr.category = sr.category 
        AND sr.is_active = TRUE
       WHERE pa.kabadiwala_id = ? 
         AND pa.assigned_date = ?
       ORDER BY pa.sequence_order`,
      [req.userId, targetDate]
    );

    res.json({ pickups });
  } catch (error) {
    console.error("Get pickups error:", error);
    res.status(500).json({ error: "Failed to fetch pickups" });
  }
};

// COMPLETE PICKUP
exports.completePickup = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { assignmentId, actualWeight } = req.body;

    await connection.query(
      `UPDATE pickup_assignments 
       SET status = 'completed', 
           actual_weight = ?, 
           pickup_completed_at = NOW()
       WHERE assignment_id = ? 
         AND kabadiwala_id = ?`,
      [actualWeight, assignmentId, req.userId]
    );

    await connection.query(
      `UPDATE pickup_requests pr
       JOIN pickup_assignments pa 
         ON pr.request_id = pa.request_id
       SET pr.status = 'completed'
       WHERE pa.assignment_id = ?`,
      [assignmentId]
    );

    const [assignments] = await connection.query(
      `SELECT pa.*, pr.citizen_id, sr.rate_per_kg
       FROM pickup_assignments pa
       JOIN pickup_requests pr ON pa.request_id = pr.request_id
       LEFT JOIN scrap_rates sr 
         ON pr.locality_id = sr.locality_id 
        AND pr.category = sr.category 
        AND sr.is_active = TRUE
       WHERE pa.assignment_id = ?`,
      [assignmentId]
    );

    if (assignments.length) {
      const amount = actualWeight * (assignments[0].rate_per_kg || 0);

      await connection.query(
        `INSERT INTO payment_records 
         (assignment_id, citizen_id, kabadiwala_id, amount)
         VALUES (?, ?, ?, ?)`,
        [
          assignmentId,
          assignments[0].citizen_id,
          req.userId,
          amount,
        ]
      );
    }

    await connection.query(
      `UPDATE kabadiwala_profiles
       SET completed_pickups = completed_pickups + 1
       WHERE user_id = ?`,
      [req.userId]
    );

    await connection.commit();

    res.json({ success: true, message: "Pickup completed successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Complete pickup error:", error);
    res.status(500).json({ error: "Failed to complete pickup" });
  } finally {
    connection.release();
  }
};

// GET EARNINGS
exports.getEarnings = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const [earnings] = await pool.query(
      `SELECT 
          DATE(pa.pickup_completed_at) as date,
          COUNT(pa.assignment_id) as pickups_completed,
          SUM(pr.amount) as total_earnings,
          SUM(pa.actual_weight) as total_weight
       FROM pickup_assignments pa
       LEFT JOIN payment_records pr 
         ON pa.assignment_id = pr.assignment_id
       WHERE pa.kabadiwala_id = ?
         AND pa.status = 'completed'
       ${startDate ? "AND pa.pickup_completed_at >= ?" : ""}
       ${endDate ? "AND pa.pickup_completed_at <= ?" : ""}
       GROUP BY DATE(pa.pickup_completed_at)
       ORDER BY date DESC`,
      [req.userId, startDate, endDate].filter(Boolean)
    );

    const summary = {
      totalPickups: earnings.reduce((s, e) => s + e.pickups_completed, 0),
      totalEarnings: earnings.reduce((s, e) => s + (e.total_earnings || 0), 0),
      totalWeight: earnings.reduce((s, e) => s + (e.total_weight || 0), 0),
    };

    res.json({ earnings, summary });
  } catch (error) {
    console.error("Get earnings error:", error);
    res.status(500).json({ error: "Failed to fetch earnings" });
  }
};
