const { query, queryOne, transaction } = require('../shared/db/index');
const { PICKUP_VALID_TRANSITIONS, PICKUP_TERMINAL_STATES } = require('../shared/constants/pickupStatus');
const ConflictError = require('../shared/errors/ConflictError');
const NotFoundError = require('../shared/errors/NotFoundError');
const ValidationError = require('../shared/errors/ValidationError');
const AuthError = require('../shared/errors/AuthError');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function assertValidTransition(from, to) {
  const allowed = PICKUP_VALID_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new ConflictError(
      `Invalid status transition: ${from} → ${to}`,
      'INVALID_STATUS_TRANSITION'
    );
  }
}

// ─── CREATE PICKUP REQUEST ────────────────────────────────────────────────────

exports.createPickupRequest = async (req, res, next) => {
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

    const citizenId = req.user.userId;

    // PICKUP-03: Reject past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reqDate = new Date(preferredDate);
    if (reqDate < today) {
      throw new ValidationError('Preferred date cannot be in the past', [
        { field: 'preferredDate', message: 'Must be today or a future date' },
      ]);
    }

    // PICKUP-04: Reject dates beyond max advance booking (from system_configurations)
    const configRow = await queryOne(
      `SELECT value FROM system_configurations WHERE key = 'max_advance_booking_days'`
    );
    const maxDays = configRow ? parseInt(configRow.value, 10) : 7;
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + maxDays);
    if (reqDate > maxDate) {
      throw new ValidationError(`Preferred date cannot be more than ${maxDays} days in the future`, [
        { field: 'preferredDate', message: `Must be within ${maxDays} days from today` },
      ]);
    }

    // PICKUP-06: Verify locality is serviceable
    const locality = await queryOne(
      'SELECT locality_id, is_serviceable FROM localities WHERE locality_id = $1',
      [localityId]
    );
    if (!locality) {
      throw new NotFoundError('Locality not found', 'LOCALITY_NOT_FOUND');
    }
    if (!locality.is_serviceable) {
      throw new ConflictError('This locality is not currently serviceable', 'LOCALITY_NOT_SERVICEABLE');
    }

    // PICKUP-02: Check for duplicate active pickup on same date
    const duplicate = await queryOne(
      `SELECT request_id FROM pickup_requests
       WHERE citizen_id = $1
         AND preferred_date = $2
         AND status NOT IN ('cancelled', 'failed')`,
      [citizenId, preferredDate]
    );
    if (duplicate) {
      throw new ConflictError(
        'You already have an active pickup request for this date.',
        'DUPLICATE_PICKUP_DATE'
      );
    }

    // PICKUP-05: Snapshot the scrap rate at time of creation
    const rateRow = await queryOne(
      `SELECT rate_per_kg FROM scrap_rates
       WHERE locality_id = $1 AND category = $2 AND is_active = TRUE
       ORDER BY effective_date DESC LIMIT 1`,
      [localityId, category]
    );
    const snapshotRate = rateRow ? rateRow.rate_per_kg : null;

    const result = await query(
      `INSERT INTO pickup_requests
       (citizen_id, locality_id, category, estimated_weight, pickup_address,
        landmark, preferred_date, preferred_time_slot, notes, status, rate_snapshot)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'requested',$10)
       RETURNING request_id`,
      [
        citizenId,
        localityId,
        category,
        estimatedWeight,
        pickupAddress,
        landmark,
        preferredDate,
        preferredTimeSlot || 'morning',
        notes,
        snapshotRate,
      ]
    );

    const requestId = result.rows[0].request_id;

    // ASSIGN-01: Trigger auto-assignment asynchronously — never blocks response
    setImmediate(() => {
      const { triggerAutoAssignment } = require('./assignment.controller');
      triggerAutoAssignment(requestId).catch((err) => {
        const logger = require('../shared/utils/logger');
        logger.error('Auto-assignment failed', { requestId, error: err.message });
      });
    });

    res.status(201).json({
      success:   true,
      message:   'Pickup request created successfully',
      requestId,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET MY PICKUP REQUESTS ───────────────────────────────────────────────────

exports.getMyPickupRequests = async (req, res, next) => {
  try {
    const citizenId = req.user.userId;

    const result = await query(
      `SELECT pr.*,
              l.name  AS locality_name,
              pa.assignment_id,
              pa.status AS assignment_status,
              pa.actual_weight,
              u.name  AS kabadiwala_name,
              u.phone_number AS kabadiwala_phone,
              pay.payment_status,
              pay.amount AS payment_amount
       FROM pickup_requests pr
       LEFT JOIN localities l         ON pr.locality_id = l.locality_id
       LEFT JOIN pickup_assignments pa ON pr.request_id  = pa.request_id
                                      AND pa.status NOT IN ('reassigned', 'failed')
       LEFT JOIN users u              ON pa.kabadiwala_id = u.user_id
       LEFT JOIN payment_records pay  ON pa.assignment_id = pay.assignment_id
       WHERE pr.citizen_id = $1
       ORDER BY pr.created_at DESC`,
      [citizenId]
    );

    res.json({ success: true, requests: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─── GET SINGLE PICKUP ────────────────────────────────────────────────────────

exports.getPickupById = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const citizenId = req.user.userId;

    const row = await queryOne(
      `SELECT pr.*,
              l.name AS locality_name,
              pa.assignment_id,
              pa.status AS assignment_status,
              pa.actual_weight,
              u.name AS kabadiwala_name,
              pay.payment_status,
              pay.amount AS payment_amount
       FROM pickup_requests pr
       LEFT JOIN localities l         ON pr.locality_id  = l.locality_id
       LEFT JOIN pickup_assignments pa ON pr.request_id  = pa.request_id
                                      AND pa.status NOT IN ('reassigned', 'failed')
       LEFT JOIN users u              ON pa.kabadiwala_id = u.user_id
       LEFT JOIN payment_records pay  ON pa.assignment_id = pay.assignment_id
       WHERE pr.request_id = $1`,
      [requestId]
    );

    if (!row) {
      throw new NotFoundError('Pickup request not found', 'PICKUP_NOT_FOUND');
    }

    // Citizens can only see their own pickups; admins see all
    if (req.user.role === 'citizen' && row.citizen_id !== citizenId) {
      throw new AuthError('You do not have access to this pickup', 403, 'FORBIDDEN');
    }

    res.json({ success: true, request: row });
  } catch (err) {
    next(err);
  }
};

// ─── CANCEL PICKUP ────────────────────────────────────────────────────────────

exports.cancelPickup = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const citizenId = req.user.userId;

    await transaction(async (db) => {
      const pr = await db.queryOne(
        'SELECT request_id, citizen_id, status FROM pickup_requests WHERE request_id = $1',
        [requestId]
      );

      if (!pr) {
        throw new NotFoundError('Pickup request not found', 'PICKUP_NOT_FOUND');
      }
      if (pr.citizen_id !== citizenId) {
        throw new AuthError('You do not own this pickup request', 403, 'FORBIDDEN');
      }

      assertValidTransition(pr.status, 'cancelled');

      await db.query(
        `UPDATE pickup_requests SET status = 'cancelled' WHERE request_id = $1`,
        [requestId]
      );

      // Mark any active assignment as 'reassigned' and decrement total_pickups
      const assignment = await db.queryOne(
        `SELECT assignment_id, kabadiwala_id FROM pickup_assignments
         WHERE request_id = $1 AND status NOT IN ('completed', 'reassigned', 'failed')`,
        [requestId]
      );
      if (assignment) {
        await db.query(
          `UPDATE pickup_assignments SET status = 'reassigned' WHERE assignment_id = $1`,
          [assignment.assignment_id]
        );
        await db.query(
          `UPDATE kabadiwala_profiles SET total_pickups = GREATEST(0, total_pickups - 1)
           WHERE user_id = $1`,
          [assignment.kabadiwala_id]
        );
      }
    });

    res.json({ success: true, message: 'Pickup request cancelled' });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE PICKUP ADDRESS ────────────────────────────────────────────────────

exports.updatePickupAddress = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { pickupAddress, landmark } = req.body;
    const citizenId = req.user.userId;

    const pr = await queryOne(
      'SELECT request_id, citizen_id, status FROM pickup_requests WHERE request_id = $1',
      [requestId]
    );

    if (!pr) {
      throw new NotFoundError('Pickup request not found', 'PICKUP_NOT_FOUND');
    }
    if (pr.citizen_id !== citizenId) {
      throw new AuthError('You do not own this pickup request', 403, 'FORBIDDEN');
    }
    // PICKUP-08: Can only update address when status is 'requested'
    if (pr.status !== 'requested') {
      throw new ConflictError(
        'Address can only be updated when the pickup is in requested status',
        'INVALID_STATUS_FOR_UPDATE'
      );
    }

    await query(
      `UPDATE pickup_requests SET pickup_address = $1, landmark = $2 WHERE request_id = $3`,
      [pickupAddress, landmark, requestId]
    );

    res.json({ success: true, message: 'Pickup address updated' });
  } catch (err) {
    next(err);
  }
};