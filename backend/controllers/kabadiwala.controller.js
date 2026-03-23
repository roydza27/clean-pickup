const pool = require("../config/database");

// GET ASSIGNED PICKUPS
exports.getPickups = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split("T")[0];

    const result = await pool.query(
      `SELECT pa.*, pr.*, 
              u.name as citizen_name,
              u.phone_number as citizen_phone,
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
       WHERE pa.kabadiwala_id = $1
       AND pa.assigned_date = $2
       ORDER BY pa.sequence_order`,
      [req.userId, targetDate]
    );

    res.json({ pickups: result.rows });

  } catch (error) {
    console.error("Get pickups error:", error);
    res.status(500).json({ error: "Failed to fetch pickups" });
  }
};

// COMPLETE PICKUP
exports.completePickup = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { assignmentId, actualWeight } = req.body;

    await client.query(
      `UPDATE pickup_assignments
       SET status = 'completed',
           actual_weight = $1,
           pickup_completed_at = CURRENT_TIMESTAMP
       WHERE assignment_id = $2
       AND kabadiwala_id = $3`,
      [actualWeight, assignmentId, req.userId]
    );

    // update pickup request
    await client.query(
      `UPDATE pickup_requests
       SET status = 'completed'
       FROM pickup_assignments
       WHERE pickup_requests.request_id = pickup_assignments.request_id
       AND pickup_assignments.assignment_id = $1`,
      [assignmentId]
    );

    const assignment = await client.query(
      `SELECT pa.*, pr.citizen_id, sr.rate_per_kg
       FROM pickup_assignments pa
       JOIN pickup_requests pr ON pa.request_id = pr.request_id
       LEFT JOIN scrap_rates sr
         ON pr.locality_id = sr.locality_id
        AND pr.category = sr.category
        AND sr.is_active = TRUE
       WHERE pa.assignment_id = $1`,
      [assignmentId]
    );

    if (assignment.rows.length) {

      const row = assignment.rows[0];

      const amount = actualWeight * (row.rate_per_kg || 0);

      await client.query(
        `INSERT INTO payment_records
         (assignment_id, citizen_id, kabadiwala_id, amount)
         VALUES ($1,$2,$3,$4)`,
        [
          assignmentId,
          row.citizen_id,
          req.userId,
          amount
        ]
      );
    }

    await client.query(
      `UPDATE kabadiwala_profiles
       SET completed_pickups = completed_pickups + 1
       WHERE user_id = $1`,
      [req.userId]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Pickup completed successfully",
    });

  } catch (error) {

    await client.query("ROLLBACK");

    console.error("Complete pickup error:", error);

    res.status(500).json({
      error: "Failed to complete pickup",
    });

  } finally {
    client.release();
  }
};

// GET EARNINGS
exports.getEarnings = async (req, res) => {
  try {

    const { startDate, endDate } = req.query;

    let query = `
      SELECT
          DATE(pa.pickup_completed_at) as date,
          COUNT(pa.assignment_id) as pickups_completed,
          SUM(pr.amount) as total_earnings,
          SUM(pa.actual_weight) as total_weight
       FROM pickup_assignments pa
       LEFT JOIN payment_records pr
         ON pa.assignment_id = pr.assignment_id
       WHERE pa.kabadiwala_id = $1
       AND pa.status = 'completed'
    `;

    const params = [req.userId];
    let index = 2;

    if (startDate) {
      query += ` AND pa.pickup_completed_at >= $${index++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND pa.pickup_completed_at <= $${index++}`;
      params.push(endDate);
    }

    query += `
       GROUP BY DATE(pa.pickup_completed_at)
       ORDER BY date DESC
    `;

    const result = await pool.query(query, params);

    const earnings = result.rows;

    const summary = {
      totalPickups: earnings.reduce((s, e) => s + Number(e.pickups_completed), 0),
      totalEarnings: earnings.reduce((s, e) => s + Number(e.total_earnings || 0), 0),
      totalWeight: earnings.reduce((s, e) => s + Number(e.total_weight || 0), 0),
    };

    res.json({ earnings, summary });

  } catch (error) {
    console.error("Get earnings error:", error);
    res.status(500).json({ error: "Failed to fetch earnings" });
  }
};
