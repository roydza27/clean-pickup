const pool = require("../config/database");

exports.getCitizenPayments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, 
              ku.name as kabadiwala_name,
              pr.category, pr.pickup_address,
              pa.actual_weight, pa.pickup_completed_at
       FROM payment_records p
       JOIN pickup_assignments pa ON p.assignment_id = pa.assignment_id
       JOIN pickup_requests pr ON pa.request_id = pr.request_id
       JOIN users ku ON p.kabadiwala_id = ku.user_id
       WHERE p.citizen_id = $1
       ORDER BY p.created_at DESC`,
      [req.userId]
    );

    res.json({ payments: result.rows });

  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { paymentStatus, upiReference } = req.body;

    await pool.query(
      `UPDATE payment_records
       SET payment_status = $1,
           upi_reference = $2,
           payment_date = NOW()
       WHERE payment_id = $3`,
      [paymentStatus, upiReference, paymentId]
    );

    res.json({
      success: true,
      message: "Payment status updated",
    });

  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({ error: "Failed to update payment status" });
  }
};
