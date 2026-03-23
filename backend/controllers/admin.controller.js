const { query, queryOne, transaction } = require('../shared/db/index');
const { manualAssign } = require('./assignment.controller');
const NotFoundError = require('../shared/errors/NotFoundError');
const ValidationError = require('../shared/errors/ValidationError');

// ─── Get all pending/unassigned pickup requests ───────────────────────────────

exports.getPendingPickups = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT pr.*,
              u.name  AS citizen_name,
              u.phone_number AS citizen_phone,
              l.name  AS locality_name,
              l.city
       FROM pickup_requests pr
       JOIN users u      ON pr.citizen_id  = u.user_id
       JOIN localities l ON pr.locality_id = l.locality_id
       WHERE pr.status IN ('requested', 'unassigned_no_availability', 'failed')
       ORDER BY pr.preferred_date, pr.created_at`
    );

    res.json({ success: true, requests: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─── Get all pickups (admin view) ─────────────────────────────────────────────

exports.getAllPickups = async (req, res, next) => {
  try {
    const { status, localityId, date } = req.query;

    let sql = `
      SELECT pr.*,
             u.name  AS citizen_name,
             u.phone_number AS citizen_phone,
             l.name  AS locality_name,
             pa.assignment_id,
             pa.status AS assignment_status,
             ku.name AS kabadiwala_name
      FROM pickup_requests pr
      JOIN users u      ON pr.citizen_id  = u.user_id
      JOIN localities l ON pr.locality_id = l.locality_id
      LEFT JOIN pickup_assignments pa ON pr.request_id = pa.request_id
                                     AND pa.status NOT IN ('reassigned', 'failed')
      LEFT JOIN users ku ON pa.kabadiwala_id = ku.user_id
      WHERE 1=1
    `;

    const params = [];
    let idx = 1;

    if (status)     { sql += ` AND pr.status = $${idx++}`;         params.push(status); }
    if (localityId) { sql += ` AND pr.locality_id = $${idx++}`;    params.push(localityId); }
    if (date)       { sql += ` AND pr.preferred_date = $${idx++}`; params.push(date); }

    sql += ' ORDER BY pr.preferred_date DESC, pr.created_at DESC';

    const result = await query(sql, params);
    res.json({ success: true, requests: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─── Get available kabadiwalas ────────────────────────────────────────────────

exports.getKabadiwalas = async (req, res, next) => {
  try {
    const { localityId } = req.query;

    let sql = `
      SELECT u.user_id, u.name, u.phone_number,
             kp.reliability_score, kp.total_pickups, kp.completed_pickups, kp.is_available,
             l.name AS service_locality_name
      FROM users u
      JOIN kabadiwala_profiles kp ON u.user_id = kp.user_id
      LEFT JOIN localities l      ON kp.service_locality_id = l.locality_id
      WHERE u.role = 'kabadiwala' AND u.is_active = TRUE
    `;

    const params = [];
    if (localityId) {
      sql += ' AND kp.service_locality_id = $1';
      params.push(localityId);
    }

    sql += ' ORDER BY kp.reliability_score DESC, kp.is_available DESC';

    const result = await query(sql, params);
    res.json({ success: true, kabadiwalas: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─── Assign pickup to kabadiwala (manual override) ────────────────────────────

exports.assignPickup = async (req, res, next) => {
  try {
    const { requestId, kabadiwalId, adminNote } = req.body;

    if (!adminNote) {
      throw new ValidationError('Admin note is required for manual assignment', [
        { field: 'adminNote', message: 'Required' },
      ]);
    }

    await manualAssign(requestId, kabadiwalId, adminNote, req.user.userId);

    res.json({ success: true, message: 'Pickup assigned successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── Get all users ────────────────────────────────────────────────────────────

exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive } = req.query;

    let sql = `
      SELECT u.user_id, u.phone_number, u.name, u.role, u.is_active, u.created_at
      FROM users u
      WHERE 1=1
    `;

    const params = [];
    let idx = 1;

    if (role)     { sql += ` AND u.role = $${idx++}`;      params.push(role); }
    if (isActive !== undefined) {
      sql += ` AND u.is_active = $${idx++}`;
      params.push(isActive === 'true');
    }

    sql += ' ORDER BY u.created_at DESC';

    const result = await query(sql, params);
    res.json({ success: true, users: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─── Deactivate user (soft delete) ───────────────────────────────────────────

exports.deactivateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await queryOne('SELECT user_id, role FROM users WHERE user_id = $1', [userId]);
    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }
    if (user.role === 'admin') {
      throw new ValidationError('Cannot deactivate admin users', [
        { field: 'userId', message: 'Admin accounts cannot be deactivated via API' },
      ]);
    }

    await query('UPDATE users SET is_active = FALSE WHERE user_id = $1', [userId]);

    res.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    next(err);
  }
};

// ─── Create locality ──────────────────────────────────────────────────────────

exports.createLocality = async (req, res, next) => {
  try {
    const { name, pincode, city, state, centroidLat, centroidLng } = req.body;

    const result = await query(
      `INSERT INTO localities (name, pincode, city, state, centroid_lat, centroid_lng)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING locality_id`,
      [name, pincode, city, state, centroidLat, centroidLng]
    );

    res.status(201).json({ success: true, localityId: result.rows[0].locality_id });
  } catch (err) {
    next(err);
  }
};

// ─── Analytics dashboard ──────────────────────────────────────────────────────

exports.getAnalytics = async (req, res, next) => {
  try {
    const [totalPickups, totalWeight, totalEarnings, activeKabadiwalas] = await Promise.all([
      queryOne("SELECT COUNT(*) AS count FROM pickup_requests WHERE status = 'completed'"),
      queryOne("SELECT SUM(actual_weight) AS total FROM pickup_assignments WHERE status = 'completed'"),
      queryOne("SELECT SUM(amount) AS total FROM payment_records WHERE payment_status = 'paid'"),
      queryOne("SELECT COUNT(*) AS count FROM kabadiwala_profiles WHERE is_available = TRUE"),
    ]);

    res.json({
      success: true,
      summary: {
        totalPickups:      parseInt(totalPickups.count),
        totalWeightKg:     totalWeight.total  || 0,
        totalEarnings:     totalEarnings.total || 0,
        activeKabadiwalas: parseInt(activeKabadiwalas.count),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── System configuration ─────────────────────────────────────────────────────

exports.getSystemConfig = async (req, res, next) => {
  try {
    const result = await query('SELECT key, value, description FROM system_configurations ORDER BY key');
    res.json({ success: true, configurations: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.updateSystemConfig = async (req, res, next) => {
  try {
    const { key, value } = req.body;

    const existing = await queryOne(
      'SELECT key FROM system_configurations WHERE key = $1', [key]
    );
    if (!existing) {
      throw new NotFoundError(`Configuration key '${key}' not found`, 'CONFIG_NOT_FOUND');
    }

    await query(
      'UPDATE system_configurations SET value = $1 WHERE key = $2',
      [String(value), key]
    );

    res.json({ success: true, message: 'Configuration updated' });
  } catch (err) {
    next(err);
  }
};
