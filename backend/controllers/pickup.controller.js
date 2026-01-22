const pool = require("../config/database");

// CREATE PICKUP REQUEST
exports.createPickupRequest = async (req, res) => {
  try {
    const {
      localityId,
      category,
      estimatedWeight,
      pickupAddress,
      landmark,
      preferredDate,
      preferredTimeSlot,
      notes,
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO pickup_requests 
       (citizen_id, locality_id, category, estimated_weight, pickup_address, landmark, preferred_date, preferred_time_slot, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId,
        localityId,
        category,
        estimatedWeight,
        pickupAddress,
        landmark,
        preferredDate,
        preferredTimeSlot,
        notes,
      ]
    );

    res.json({
      success: true,
      message: "Pickup request created successfully",
      requestId: result.insertId,
    });
  } catch (error) {
    console.error("Create pickup error:", error);
    res.status(500).json({ error: "Failed to create pickup request" });
  }
};

// GET MY PICKUP REQUESTS
exports.getMyPickupRequests = async (req, res) => {
  try {
    const [requests] = await pool.query(
      `SELECT pr.*, l.name as locality_name,
              pa.assignment_id, pa.status as assignment_status, pa.actual_weight,
              u.name as kabadiwala_name, u.phone_number as kabadiwala_phone,
              pay.payment_status, pay.amount as payment_amount
       FROM pickup_requests pr
       LEFT JOIN localities l ON pr.locality_id = l.locality_id
       LEFT JOIN pickup_assignments pa ON pr.request_id = pa.request_id
       LEFT JOIN users u ON pa.kabadiwala_id = u.user_id
       LEFT JOIN payment_records pay ON pa.assignment_id = pay.assignment_id
       WHERE pr.citizen_id = ?
       ORDER BY pr.created_at DESC`,
      [req.userId]
    );

    res.json({ requests });
  } catch (error) {
    console.error("Get pickup requests error:", error);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
};
