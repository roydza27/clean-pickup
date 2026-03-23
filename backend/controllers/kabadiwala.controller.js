const { query, queryOne, transaction } = require('../shared/db/index');
const ConflictError = require('../shared/errors/ConflictError');
const NotFoundError = require('../shared/errors/NotFoundError');
const AuthError = require('../shared/errors/AuthError');
const ValidationError = require('../shared/errors/ValidationError');

// ─── GET ASSIGNED PICKUPS ─────────────────────────────────────────────────────

exports.getPickups = async (req, res, next) => {
  try {
    const { date } = req.query;
    const kabadiwalId = req.user.userId;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = await query(
      `SELECT pa.*, pr.*,
              u.name  AS citizen_name,
              u.phone_number AS citizen_phone,
              l.name  AS locality_name,
              sr.rate_per_kg
       FROM pickup_assignments pa
       JOIN pickup_requests pr ON pa.request_id = pr.request_id
       JOIN users u            ON pr.citizen_id = u.user_id
       JOIN localities l       ON pr.locality_id = l.locality_id
       LEFT JOIN scrap_rates sr
         ON pr.locality_id = sr.locality_id
        AND pr.category    = sr.category
        AND sr.is_active   = TRUE
       WHERE pa.kabadiwala_id = $1
         AND pa.assigned_date = $2
         AND pa.status NOT IN ('reassigned')
       ORDER BY pa.sequence_order`,
      [kabadiwalId, targetDate]
    );

    res.json({ success: true, pickups: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─── GET KABADIWALA PROFILE ───────────────────────────────────────────────────

exports.getProfile = async (req, res, next) => {
  try {
    const kabadiwalId = req.user.userId;

    const row = await queryOne(
      `SELECT u.user_id, u.name, u.phone_number, u.created_at,
              kp.profile_id, kp.service_locality_id, kp.vehicle_type,
              kp.reliability_score, kp.total_pickups, kp.completed_pickups,
              kp.is_available,
              l.name AS service_locality_name
       FROM users u
       JOIN kabadiwala_profiles kp ON u.user_id = kp.user_id
       LEFT JOIN localities l      ON kp.service_locality_id = l.locality_id
       WHERE u.user_id = $1`,
      [kabadiwalId]
    );

    if (!row) {
      throw new NotFoundError('Kabadiwala profile not found', 'PROFILE_NOT_FOUND');
    }

    res.json({ success: true, profile: row });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE PICKUP STATUS ─────────────────────────────────────────────────────

exports.updatePickupStatus = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { status } = req.body;
    const kabadiwalId = req.user.userId;

    const assignment = await queryOne(
      `SELECT pa.*, pr.status AS pickup_status
       FROM pickup_assignments pa
       JOIN pickup_requests pr ON pa.request_id = pr.request_id
       WHERE pa.assignment_id = $1`,
      [assignmentId]
    );

    if (!assignment) {
      throw new NotFoundError('Assignment not found', 'ASSIGNMENT_NOT_FOUND');
    }
    // KAB-02: Ownership check
    if (assignment.kabadiwala_id !== kabadiwalId) {
      throw new AuthError('You do not own this assignment', 403, 'FORBIDDEN');
    }

    await transaction(async (db) => {
      await db.query(
        `UPDATE pickup_assignments SET status = $1 WHERE assignment_id = $2`,
        [status, assignmentId]
      );
      // Keep pickup_requests status in sync
      const pickupStatusMap = { in_progress: 'in_progress', failed: 'failed' };
      if (pickupStatusMap[status]) {
        await db.query(
          `UPDATE pickup_requests SET status = $1 WHERE request_id = $2`,
          [pickupStatusMap[status], assignment.request_id]
        );
      }
    });

    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    next(err);
  }
};

// ─── COMPLETE PICKUP ──────────────────────────────────────────────────────────

exports.completePickup = async (req, res, next) => {
  try {
    const { assignmentId, actualWeight } = req.body;
    const kabadiwalId = req.user.userId;

    if (actualWeight == null || actualWeight <= 0) {
      throw new ValidationError('Invalid actual weight', [
        { field: 'actualWeight', message: 'Must be a positive number' },
      ]);
    }

    // DUP-04: ALREADY_COMPLETED guard BEFORE transaction
    const existing = await queryOne(
      `SELECT status FROM pickup_assignments WHERE assignment_id = $1`,
      [assignmentId]
    );
    if (!existing) {
      throw new NotFoundError('Assignment not found', 'ASSIGNMENT_NOT_FOUND');
    }
    if (existing.status === 'completed') {
      throw new ConflictError('Pickup is already completed', 'ALREADY_COMPLETED');
    }

    await transaction(async (db) => {
      const assignment = await db.queryOne(
        `SELECT pa.*, pr.citizen_id, pr.locality_id, pr.category, pr.rate_snapshot
         FROM pickup_assignments pa
         JOIN pickup_requests pr ON pa.request_id = pr.request_id
         WHERE pa.assignment_id = $1`,
        [assignmentId]
      );

      if (!assignment) {
        throw new NotFoundError('Assignment not found', 'ASSIGNMENT_NOT_FOUND');
      }
      // KAB-02: Ownership check inside transaction too
      if (assignment.kabadiwala_id !== kabadiwalId) {
        throw new AuthError('You do not own this assignment', 403, 'FORBIDDEN');
      }

      await db.query(
        `UPDATE pickup_assignments
         SET status = 'completed',
             actual_weight = $1,
             pickup_completed_at = CURRENT_TIMESTAMP
         WHERE assignment_id = $2`,
        [actualWeight, assignmentId]
      );

      await db.query(
        `UPDATE pickup_requests SET status = 'completed' WHERE request_id = $1`,
        [assignment.request_id]
      );

      // Use rate_snapshot (captured at request time) for payment calculation
      let ratePerKg = assignment.rate_snapshot;
      if (ratePerKg == null) {
        const rateRow = await db.queryOne(
          `SELECT rate_per_kg FROM scrap_rates
           WHERE locality_id = $1 AND category = $2 AND is_active = TRUE
           ORDER BY effective_date DESC LIMIT 1`,
          [assignment.locality_id, assignment.category]
        );
        ratePerKg = rateRow ? parseFloat(rateRow.rate_per_kg) : 0;
      }

      const amount = parseFloat(actualWeight) * parseFloat(ratePerKg);

      await db.query(
        `INSERT INTO payment_records
           (assignment_id, citizen_id, kabadiwala_id, amount, payment_status)
         VALUES ($1, $2, $3, $4, 'pending')`,
        [assignmentId, assignment.citizen_id, kabadiwalId, amount]
      );

      await db.query(
        `UPDATE kabadiwala_profiles
         SET completed_pickups = completed_pickups + 1
         WHERE user_id = $1`,
        [kabadiwalId]
      );

      // Create learning_feedback record for future learning loop
      await db.query(
        `INSERT INTO learning_feedback
           (assignment_id, actual_weight, completed_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (assignment_id) DO NOTHING`,
        [assignmentId, actualWeight]
      );
    });

    res.json({ success: true, message: 'Pickup completed successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── GET EARNINGS ─────────────────────────────────────────────────────────────

exports.getEarnings = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const kabadiwalId = req.user.userId;

    let sql = `
      SELECT
          DATE(pa.pickup_completed_at) AS date,
          COUNT(pa.assignment_id)      AS pickups_completed,
          SUM(pr_pay.amount)           AS total_earnings,
          SUM(pa.actual_weight)        AS total_weight
       FROM pickup_assignments pa
       LEFT JOIN payment_records pr_pay ON pa.assignment_id = pr_pay.assignment_id
       WHERE pa.kabadiwala_id = $1
         AND pa.status = 'completed'
    `;

    const params = [kabadiwalId];
    let idx = 2;

    if (startDate) { sql += ` AND pa.pickup_completed_at >= $${idx++}`; params.push(startDate); }
    if (endDate)   { sql += ` AND pa.pickup_completed_at <= $${idx++}`; params.push(endDate);   }

    sql += ` GROUP BY DATE(pa.pickup_completed_at) ORDER BY date DESC`;

    const result = await query(sql, params);
    const earnings = result.rows;

    const summary = {
      totalPickups:  earnings.reduce((s, e) => s + Number(e.pickups_completed), 0),
      totalEarnings: earnings.reduce((s, e) => s + Number(e.total_earnings || 0), 0),
      totalWeight:   earnings.reduce((s, e) => s + Number(e.total_weight   || 0), 0),
    };

    res.json({ success: true, earnings, summary });
  } catch (err) {
    next(err);
  }
};
