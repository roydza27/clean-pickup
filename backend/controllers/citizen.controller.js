const { query, queryOne } = require('../shared/db/index');
const NotFoundError = require('../shared/errors/NotFoundError');
const ValidationError = require('../shared/errors/ValidationError');

// ─── GET CITIZEN PROFILE ──────────────────────────────────────────────────────

exports.getProfile = async (req, res, next) => {
  try {
    const row = await queryOne(
      `SELECT u.user_id, u.name, u.phone_number, u.role, u.created_at,
              cp.profile_id, cp.locality_id, cp.address_line1, cp.address_line2,
              cp.landmark, cp.preferred_language, cp.notification_enabled,
              l.name AS locality_name, l.pincode, l.city
       FROM users u
       JOIN citizen_profiles cp ON u.user_id = cp.user_id
       LEFT JOIN localities l   ON cp.locality_id = l.locality_id
       WHERE u.user_id = $1`,
      [req.user.userId]
    );

    if (!row) {
      throw new NotFoundError('Citizen profile not found', 'PROFILE_NOT_FOUND');
    }

    res.json({ success: true, profile: row });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE CITIZEN PROFILE ───────────────────────────────────────────────────

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, age, preferredLanguage, localityId, addressLine1, addressLine2, landmark } = req.body;
    const userId = req.user.userId;

    if (name !== undefined) {
      await query('UPDATE users SET name = $1 WHERE user_id = $2', [name, userId]);
    }

    const fields  = [];
    const values  = [];
    let idx = 1;

    if (age !== undefined && age !== null) {
      const parsedAge = Number(age);
      if (!Number.isInteger(parsedAge) || parsedAge <= 0) {
        throw new ValidationError('Invalid age', [{ field: 'age', message: 'Must be a positive integer' }]);
      }
      fields.push(`age = $${idx++}`); values.push(parsedAge);
    }

    if (preferredLanguage !== undefined) { fields.push(`preferred_language = $${idx++}`); values.push(preferredLanguage); }
    if (localityId       !== undefined) { fields.push(`locality_id = $${idx++}`);         values.push(localityId); }
    if (addressLine1     !== undefined) { fields.push(`address_line1 = $${idx++}`);        values.push(addressLine1); }
    if (addressLine2     !== undefined) { fields.push(`address_line2 = $${idx++}`);        values.push(addressLine2); }
    if (landmark         !== undefined) { fields.push(`landmark = $${idx++}`);             values.push(landmark); }

    if (fields.length > 0) {
      const updated = await query(
        `UPDATE citizen_profiles SET ${fields.join(', ')} WHERE user_id = $${idx}`,
        [...values, userId]
      );
      if (updated.rowCount === 0) {
        // Profile doesn't exist yet — insert it
        const cols  = fields.map((f) => f.split(' = ')[0]).join(', ');
        const phs   = values.map((_, i) => `$${i + 2}`).join(', ');
        await query(
          `INSERT INTO citizen_profiles (user_id, ${cols}) VALUES ($1, ${phs})`,
          [userId, ...values]
        );
      }
    }

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE NOTIFICATION PREFERENCES ─────────────────────────────────────────

exports.updatePreferences = async (req, res, next) => {
  try {
    const { notifyPickupUpdates, notifyPaymentUpdates, notifyGeneral, notificationEnabled } = req.body;
    const userId = req.user.userId;

    await query(
      `UPDATE citizen_profiles
       SET notify_pickup_updates  = COALESCE($1, notify_pickup_updates),
           notify_payment_updates = COALESCE($2, notify_payment_updates),
           notify_general         = COALESCE($3, notify_general),
           notification_enabled   = COALESCE($4, notification_enabled)
       WHERE user_id = $5`,
      [notifyPickupUpdates, notifyPaymentUpdates, notifyGeneral, notificationEnabled, userId]
    );

    res.json({ success: true, message: 'Preferences updated successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── GET PICKUP HISTORY ───────────────────────────────────────────────────────

exports.getPickupHistory = async (req, res, next) => {
  try {
    const citizenId = req.user.userId;

    const result = await query(
      `SELECT pr.*,
              l.name AS locality_name,
              pa.actual_weight,
              pa.pickup_completed_at,
              ku.name AS kabadiwala_name,
              pay.amount AS payment_amount,
              pay.payment_status
       FROM pickup_requests pr
       LEFT JOIN localities l         ON pr.locality_id   = l.locality_id
       LEFT JOIN pickup_assignments pa ON pr.request_id   = pa.request_id
                                      AND pa.status = 'completed'
       LEFT JOIN users ku             ON pa.kabadiwala_id = ku.user_id
       LEFT JOIN payment_records pay  ON pa.assignment_id = pay.assignment_id
       WHERE pr.citizen_id = $1
         AND pr.status = 'completed'
       ORDER BY pa.pickup_completed_at DESC`,
      [citizenId]
    );

    res.json({ success: true, history: result.rows });
  } catch (err) {
    next(err);
  }
};
