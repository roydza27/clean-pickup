const { query, queryOne, transaction } = require('../shared/db/index');
const { haversineKm } = require('../shared/utils/haversine');
const logger = require('../shared/utils/logger');
const { getRedisClient } = require('../config/redis');
const ConflictError = require('../shared/errors/ConflictError');
const NotFoundError = require('../shared/errors/NotFoundError');
const AuthError = require('../shared/errors/AuthError');

const WEIGHTS_CACHE_KEY = 'active_weights';
const WEIGHTS_CACHE_TTL = 300; // seconds

// ─── Weight Config ────────────────────────────────────────────────────────────

async function getActiveWeights() {
  const redis = getRedisClient();
  const cached = await redis.get(WEIGHTS_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached);
  }

  const row = await queryOne(
    `SELECT * FROM weight_configurations WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1`
  );
  if (!row) {
    throw new Error('No active weight configuration found');
  }

  const weights = {
    wDistance:      parseFloat(row.w_distance),
    wWorkload:      parseFloat(row.w_workload),
    wReliability:   parseFloat(row.w_reliability),
    weightConfigId: row.config_id,
  };

  await redis.setex(WEIGHTS_CACHE_KEY, WEIGHTS_CACHE_TTL, JSON.stringify(weights));
  return weights;
}

async function invalidateWeightCache() {
  const redis = getRedisClient();
  await redis.del(WEIGHTS_CACHE_KEY);
}

// ─── Candidate Selection ─────────────────────────────────────────────────────

async function fetchCandidates(localityId, preferredDate, maxDailyPickups) {
  const result = await query(
    `SELECT
       u.user_id,
       u.name,
       kp.reliability_score,
       kp.last_known_lat,
       kp.last_known_lng,
       kp.last_location_updated_at,
       l.centroid_lat,
       l.centroid_lng,
       COUNT(pa.assignment_id) AS today_pickups
     FROM kabadiwala_profiles kp
     JOIN users u                ON kp.user_id = u.user_id
     JOIN localities l           ON kp.service_locality_id = l.locality_id
     LEFT JOIN pickup_assignments pa
       ON pa.kabadiwala_id = kp.user_id
      AND pa.assigned_date = $2
      AND pa.status NOT IN ('completed', 'reassigned', 'failed')
     WHERE kp.service_locality_id = $1
       AND kp.is_available = TRUE
       AND u.is_active = TRUE
     GROUP BY
       u.user_id, u.name, kp.reliability_score,
       kp.last_known_lat, kp.last_known_lng, kp.last_location_updated_at,
       l.centroid_lat, l.centroid_lng
     HAVING COUNT(pa.assignment_id) < $3`,
    [localityId, preferredDate, maxDailyPickups]
  );
  return result.rows;
}

// ─── Score a Candidate ────────────────────────────────────────────────────────

function scoreCandidate(candidate, pickupLat, pickupLng, maxDailyPickups, weights) {
  // Location: use last known if <4h old, else locality centroid
  let kabLat = candidate.centroid_lat;
  let kabLng = candidate.centroid_lng;

  if (
    candidate.last_known_lat != null &&
    candidate.last_known_lng != null &&
    candidate.last_location_updated_at
  ) {
    const ageMs = Date.now() - new Date(candidate.last_location_updated_at).getTime();
    if (ageMs < 4 * 60 * 60 * 1000) {
      kabLat = candidate.last_known_lat;
      kabLng = candidate.last_known_lng;
    }
  }

  const distanceKm    = (pickupLat != null && pickupLng != null && kabLat != null && kabLng != null)
    ? haversineKm(pickupLat, pickupLng, parseFloat(kabLat), parseFloat(kabLng))
    : 5; // fallback distance

  const workloadCount  = parseInt(candidate.today_pickups, 10);
  const distanceScore  = 1 / (1 + distanceKm);
  const workloadScore  = (maxDailyPickups - workloadCount) / maxDailyPickups;
  const reliabilityScore = parseFloat(candidate.reliability_score ?? 0.5);

  const finalScore =
    weights.wDistance    * distanceScore +
    weights.wWorkload    * workloadScore +
    weights.wReliability * reliabilityScore;

  return {
    distanceKm,
    distanceScore,
    workloadCount,
    workloadScore,
    reliabilityScore,
    finalScore,
  };
}

// ─── triggerAutoAssignment ────────────────────────────────────────────────────

async function triggerAutoAssignment(requestId) {
  const pr = await queryOne(
    `SELECT pr.*, l.centroid_lat, l.centroid_lng
     FROM pickup_requests pr
     JOIN localities l ON pr.locality_id = l.locality_id
     WHERE pr.request_id = $1`,
    [requestId]
  );

  if (!pr) {
    logger.warn('triggerAutoAssignment: pickup request not found', { requestId });
    return;
  }

  // Read config values
  const maxDailyRow = await queryOne(
    `SELECT value FROM system_configurations WHERE key = 'max_daily_pickups_per_kabadiwala'`
  );
  const maxDailyPickups = maxDailyRow ? parseInt(maxDailyRow.value, 10) : 10;

  let weights;
  try {
    weights = await getActiveWeights();
  } catch (err) {
    logger.error('triggerAutoAssignment: no active weight config', { requestId, error: err.message });
    // Fall back to equal weights
    weights = { wDistance: 0.333, wWorkload: 0.334, wReliability: 0.333, weightConfigId: null };
  }

  const candidates = await fetchCandidates(pr.locality_id, pr.preferred_date, maxDailyPickups);

  if (!candidates.length) {
    // No candidates — mark as unassigned_no_availability, notify admin
    await query(
      `UPDATE pickup_requests SET status = 'unassigned_no_availability' WHERE request_id = $1`,
      [requestId]
    );
    // Notify admin
    await query(
      `INSERT INTO notifications (user_id, title, message, notification_type)
       SELECT u.user_id, 'Unassigned Pickup', $1, 'general'
       FROM users u WHERE u.role = 'admin' AND u.is_active = TRUE`,
      [`Pickup #${requestId} could not be assigned — no available Kabadiwalas for locality ${pr.locality_id} on ${pr.preferred_date}`]
    );
    logger.warn('triggerAutoAssignment: no candidates', { requestId, localityId: pr.locality_id });
    return;
  }

  // Score all candidates
  const scored = candidates.map((c) => {
    const factors = scoreCandidate(c, pr.centroid_lat, pr.centroid_lng, maxDailyPickups, weights);
    return { candidate: c, factors };
  });
  scored.sort((a, b) => b.factors.finalScore - a.factors.finalScore);

  const best = scored[0];

  const factorsSnapshot = {
    distanceKm:       best.factors.distanceKm,
    distanceScore:    best.factors.distanceScore,
    workloadCount:    best.factors.workloadCount,
    workloadScore:    best.factors.workloadScore,
    reliabilityScore: best.factors.reliabilityScore,
    finalScore:       best.factors.finalScore,
  };
  const weightsSnapshot = {
    wDistance:      weights.wDistance,
    wWorkload:      weights.wWorkload,
    wReliability:   weights.wReliability,
    weightConfigId: weights.weightConfigId,
  };

  await transaction(async (db) => {
    // ASSIGN-04: Always populate snapshots
    await db.query(
      `INSERT INTO pickup_assignments
         (request_id, kabadiwala_id, assigned_date, status, factors_snapshot, weights_snapshot, assigned_by)
       VALUES ($1, $2, $3, 'assigned', $4, $5, 'auto')`,
      [
        requestId,
        best.candidate.user_id,
        pr.preferred_date,
        JSON.stringify(factorsSnapshot),
        JSON.stringify(weightsSnapshot),
      ]
    );

    await db.query(
      `UPDATE pickup_requests SET status = 'assigned' WHERE request_id = $1`,
      [requestId]
    );

    await db.query(
      `UPDATE kabadiwala_profiles SET total_pickups = total_pickups + 1 WHERE user_id = $1`,
      [best.candidate.user_id]
    );
  });

  logger.info('triggerAutoAssignment: assigned', {
    requestId,
    kabadiwalId: best.candidate.user_id,
    score: best.factors.finalScore,
  });
}

// ─── Manual Assignment (Admin) ────────────────────────────────────────────────

async function manualAssign(requestId, kabadiwalId, adminNote, adminUserId) {
  const pr = await queryOne(
    'SELECT request_id, status FROM pickup_requests WHERE request_id = $1',
    [requestId]
  );
  if (!pr) {
    throw new NotFoundError('Pickup request not found', 'PICKUP_NOT_FOUND');
  }

  const allowedStatuses = ['requested', 'unassigned_no_availability', 'failed'];
  if (!allowedStatuses.includes(pr.status)) {
    throw new ConflictError(
      `Manual assignment only allowed for statuses: ${allowedStatuses.join(', ')}`,
      'INVALID_STATUS_FOR_MANUAL_ASSIGN'
    );
  }

  const kab = await queryOne(
    `SELECT kp.user_id FROM kabadiwala_profiles kp
     JOIN users u ON kp.user_id = u.user_id
     WHERE kp.user_id = $1 AND u.is_active = TRUE AND kp.is_available = TRUE`,
    [kabadiwalId]
  );
  if (!kab) {
    throw new NotFoundError('Kabadiwala not found or unavailable', 'KABADIWALA_NOT_FOUND');
  }

  if (!adminNote) {
    throw new Error('Admin note is required for manual assignment');
  }

  await transaction(async (db) => {
    // Reassign any existing active assignment first
    await db.query(
      `UPDATE pickup_assignments SET status = 'reassigned'
       WHERE request_id = $1 AND status NOT IN ('completed', 'reassigned', 'failed')`,
      [requestId]
    );

    // Insert new assignment with manual flag
    await db.query(
      `INSERT INTO pickup_assignments
         (request_id, kabadiwala_id, assigned_date, status,
          factors_snapshot, weights_snapshot, assigned_by, admin_note)
       VALUES ($1, $2, CURRENT_DATE, 'assigned', '{}', '{}', 'manual', $3)`,
      [requestId, kabadiwalId, adminNote]
    );

    await db.query(
      `UPDATE pickup_requests SET status = 'assigned' WHERE request_id = $1`,
      [requestId]
    );

    await db.query(
      `UPDATE kabadiwala_profiles SET total_pickups = total_pickups + 1 WHERE user_id = $1`,
      [kabadiwalId]
    );
  });
}

module.exports = {
  triggerAutoAssignment,
  manualAssign,
  getActiveWeights,
  invalidateWeightCache,
};
