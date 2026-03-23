# Section 4: Business Rules
## Waste Coordination & Recycling Management System
### India Pilot MVP

**Consistency Note:** All rules map directly to schema constraints (Section 2) and service layer code (Section 3).  
Rules are numbered for traceability. Every rule states: what it is, why it exists, where it is enforced, and what happens when it is violated.

---

## Table of Contents

1. [Rule Enforcement Layers](#1-rule-enforcement-layers)
2. [Authentication Rules](#2-authentication-rules)
3. [User & Role Rules](#3-user--role-rules)
4. [Pickup Lifecycle Rules](#4-pickup-lifecycle-rules)
5. [Assignment Rules](#5-assignment-rules)
6. [Payment Rules](#6-payment-rules)
7. [Scrap Rate Rules](#7-scrap-rate-rules)
8. [Kabadiwala Operational Rules](#8-kabadiwala-operational-rules)
9. [Data Validation Rules](#9-data-validation-rules)
10. [Duplicate & Conflict Prevention Rules](#10-duplicate--conflict-prevention-rules)
11. [Learning Loop Rules](#11-learning-loop-rules)
12. [Admin Override Rules](#12-admin-override-rules)
13. [System Configuration Rules](#13-system-configuration-rules)
14. [Business Rule Violation Reference](#14-business-rule-violation-reference)

---

## 1. Rule Enforcement Layers

Every business rule in this system is enforced at the **most appropriate layer** — and in critical cases, at multiple layers. The principle is defence-in-depth: the database is the last line of defence, but the service layer catches violations before they reach it.

```
Layer 1: Client (React)
  → UX-level: disables buttons, restricts date pickers, hides unavailable options
  → NOT a security boundary. Can be bypassed. Cannot be trusted.

Layer 2: Zod Validation Middleware (Express)
  → Structural: correct types, required fields, format patterns
  → Runs before the controller. Rejects malformed requests with 400.

Layer 3: Service Layer (Business Logic)
  → Domain rules: state machines, ownership, capacity limits, date logic
  → The primary enforcement layer. All business rules live here.

Layer 4: Database (PostgreSQL)
  → Constraints: ENUMs, CHECK, UNIQUE, FK, triggers
  → Catches anything the service layer misses. Last line of defence.
  → A database constraint violation is a bug in the service layer.
```

**A database constraint violation is always a bug in the service layer, never an expected outcome.** If a CHECK constraint fires in production, there is a missing rule in the service layer that must be added.

---

## 2. Authentication Rules

### AUTH-01: OTP Generation Rate Limit

**Rule:** A phone number may request at most **5 OTPs per hour**.

**Why:** Prevents SMS bombing attacks and controls SMS gateway costs.

**Enforcement:**
```javascript
// Layer 2 (Rate Limiter middleware on /auth/send-otp route):
// Redis INCR otp_req:{phoneNumber}  EXPIRE 3600
// If count > 5 → 429 Too Many Requests

// Layer 3 (auth.service.sendOtp):
const count = await redisClient.incr(`otp_req:${phoneNumber}`);
await redisClient.expire(`otp_req:${phoneNumber}`, 3600);
if (count > 5) throw new RateLimitError('OTP_RATE_EXCEEDED');
```

**Violation response:** `429 { code: "OTP_RATE_EXCEEDED", message: "Too many OTP requests. Try again in 1 hour." }`

---

### AUTH-02: OTP Expiry

**Rule:** An OTP is valid for exactly **5 minutes** from generation. After that, it cannot be used.

**Why:** Limits the window for OTP interception or brute force.

**Enforcement:**
- Layer 3: Redis TTL `SET otp:{phoneNumber} {hash} EX 300`
- Redis atomically deletes the key after 300 seconds
- `GET otp:{phoneNumber}` returns `null` after expiry → service throws `AuthError`

**Violation response:** `400 { code: "OTP_EXPIRED", message: "OTP has expired. Please request a new one." }`

---

### AUTH-03: OTP Single-Use Enforcement

**Rule:** An OTP is consumed immediately upon successful verification. It cannot be used a second time.

**Why:** Prevents replay attacks where an intercepted OTP is reused.

**Enforcement:**
```javascript
// Layer 3 (auth.service.verifyOtp) — within the same Redis pipeline:
await redisClient.multi()
  .del(`otp:${phoneNumber}`)      // ← Delete OTP immediately
  .del(`otp_fail:${phoneNumber}`) // ← Reset failed attempt counter
  .exec();
// The DEL and the successful comparison are logically atomic via pipeline
```

---

### AUTH-04: OTP Failed Attempt Lockout

**Rule:** After **5 consecutive failed OTP attempts** for a phone number, that phone number is locked out from OTP verification for **15 minutes**.

**Why:** Prevents brute-force of the 6-digit OTP space (1,000,000 combinations).

**Enforcement:**
```javascript
// Layer 3 (auth.service.verifyOtp — on mismatch):
await redisClient.multi()
  .incr(`otp_fail:${phoneNumber}`)
  .expire(`otp_fail:${phoneNumber}`, 900) // 15-min TTL
  .exec();

// On every verification attempt — check before comparing:
const failCount = parseInt(await redisClient.get(`otp_fail:${phoneNumber}`) ?? '0', 10);
if (failCount >= 5) throw new RateLimitError('OTP_MAX_ATTEMPTS');
```

**Violation response:** `429 { code: "OTP_MAX_ATTEMPTS", message: "Account locked. Request a new OTP after 15 minutes." }`

---

### AUTH-05: OTP Must Not Be Returned in Production

**Rule:** The OTP value is **never included** in any API response in `staging` or `production` environments. It may be included in `development` only, in server logs — never in the response body.

**Why:** Returning the OTP defeats the entire purpose of OTP authentication.

**Enforcement:**
```javascript
// Layer 3 (auth.service.sendOtp):
if (env.NODE_ENV === 'development') {
  logger.debug(`[DEV ONLY] OTP for ${phoneNumber.slice(0,4)}XXXXXX: ${otp}`);
  // Even in dev: only logged server-side, never in response
}
// The API response is always: { success: true, message: "OTP sent successfully" }
// No OTP in the response body, ever.
```

---

### AUTH-06: Role Provided Only at First Login

**Rule:** The `role` field in `/auth/verify-otp` is **required for new users** and **ignored for returning users**.

**Why:** A returning user's role is immutable (see USER-02). Accepting role on re-login would allow privilege escalation by a user who claims a different role.

**Enforcement:**
```javascript
// Layer 3 (auth.service.verifyOtp):
if (!user) {
  // New user path
  if (!role) throw new AuthError('Role required for new users', 400);
  // role is used to create the account
} else {
  // Returning user path — role field in request body is silently ignored
  // The role from the database is used, not the request
  if (role && role !== user.role) {
    throw new AuthError('Role mismatch. This account is registered as a different role.', 403);
  }
}
```

---

### AUTH-07: Session Invalidation on Logout

**Rule:** When a user logs out, their session token is immediately invalidated. Any requests with that token after logout must return `401`.

**Why:** JWT tokens are stateless — they remain valid until expiry unless we explicitly revoke them. Redis session storage enables revocation.

**Enforcement:**
```javascript
// Layer 3 (auth.service.logout):
await redisClient.del(`session:${userId}`);

// Layer 3 (authenticate.js middleware — on every request):
const session = await redisClient.get(`session:${userId}`);
if (!session) throw new AuthError('Session expired or invalidated', 401);
```

---

### AUTH-08: Admin Accounts Cannot Be Created via API

**Rule:** Admin accounts are created **only via direct database insertion** by a system administrator. There is no API endpoint for admin signup.

**Why:** Prevents privilege escalation via API. An attacker cannot register as an admin.

**Enforcement:**
- Layer 2: `verifyOtpSchema` only accepts `role` values of `['citizen', 'kabadiwala']`
- Layer 3: `enum(['citizen', 'kabadiwala']).optional()` — admin is excluded from the enum
- Layer 4: No constraint needed — the schema validation blocks it upstream

---

## 3. User & Role Rules

### USER-01: Phone Number as Primary Identity

**Rule:** A user's phone number is their **immutable primary identity**. It cannot be changed after account creation.

**Why:** The phone number is the authentication credential. Allowing it to change would sever the link between identity and authentication.

**Enforcement:**
- Layer 4: `phone_number` column has `UNIQUE` constraint. No `UPDATE phone_number` is permitted at the service layer — the field is absent from all profile update schemas.

---

### USER-02: Role Immutability

**Rule:** A user's role **cannot change** after assignment at signup. Ever. Through any mechanism.

**Why:** Role changes are a privilege escalation vector. A citizen must not become an admin. A kabadiwala must not become a citizen to manipulate their own pickup requests.

**Enforcement:**
```sql
-- Layer 4: Database trigger on users table
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'User role cannot be changed. Current: %. Attempted: %',
                    OLD.role, NEW.role;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_role_immutability
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION prevent_role_change();
```

- Layer 3: No service method accepts a role parameter in any update operation
- Layer 2: No update schema includes a `role` field

---

### USER-03: Soft Deletion Only

**Rule:** User accounts are **never hard-deleted**. Deactivation sets `is_active = false`.

**Why:** Hard deletion would cascade-fail against `pickup_requests`, `payment_records`, and `pickup_status_history` which use `RESTRICT` on delete. More importantly: financial and operational history must be preserved even if a user leaves the platform.

**Enforcement:**
- Layer 4: `pickup_requests.citizen_id` → `REFERENCES users(id) ON DELETE RESTRICT`
- Layer 3: No `DELETE FROM users` query exists in any service file
- Layer 3: Deactivation is: `UPDATE users SET is_active = false WHERE id = $1`

---

### USER-04: Inactive User Cannot Authenticate

**Rule:** A user with `is_active = false` is rejected at login with a specific error message distinct from an authentication failure.

**Why:** Provides a clear signal to both the user and support staff. An inactive user should contact support, not keep trying to log in.

**Enforcement:**
```javascript
// Layer 3 (auth.service.verifyOtp):
if (!user.is_active) {
  throw new AuthError('Account is deactivated. Please contact support.', 403);
  // 403 Forbidden, not 401 Unauthorized — they authenticated correctly,
  // but are not permitted access
}
```

---

### USER-05: One Profile Per User Per Role

**Rule:** Each user has **exactly one** role-specific profile (`citizen_profiles` or `kabadiwala_profiles`). A second profile cannot be created for the same user.

**Enforcement:**
- Layer 4: `UNIQUE` constraint on `citizen_profiles.user_id` and `kabadiwala_profiles.user_id`
- Layer 3: Profiles are created within the same transaction as the user — not via a separate API call

---

## 4. Pickup Lifecycle Rules

### PICKUP-01: Valid Status Transitions

**Rule:** A pickup request may only move through these status transitions:

```
requested ──────────────────────────────► assigned
    │                                        │
    │                                        ▼
    │                                   in_progress
    │                                        │
    │                          ┌─────────────┴──────────────┐
    │                          ▼                            ▼
    │                      completed                     failed
    │                                                       │
    │                                              ┌────────┴───────┐
    │                                              ▼                ▼
    │                                          assigned         cancelled
    │                                       (reassigned)
    ▼
unassigned_no_availability ────────────► assigned (admin manual)

Any status ─────────────────────────────────────────────────────► cancelled
  (except completed)
```

**Invalid transitions (rejected with 409):**
- `completed → any` — completed is a terminal state
- `cancelled → any` — cancelled is a terminal state
- `in_progress → requested` — cannot go backward
- `assigned → requested` — cannot go backward
- `failed → in_progress` — failed requires reassignment, not continuation

**Enforcement:**
```javascript
// Layer 3 (pickup.service.js) — state machine guard:
const VALID_TRANSITIONS = {
  requested:                    ['assigned', 'unassigned_no_availability', 'cancelled'],
  assigned:                     ['in_progress', 'failed', 'cancelled'],
  in_progress:                  ['completed', 'failed'],
  failed:                       ['assigned', 'cancelled'],
  unassigned_no_availability:   ['assigned', 'cancelled'],
  completed:                    [],   // Terminal
  cancelled:                    [],   // Terminal
};

function assertValidTransition(from, to) {
  const allowed = VALID_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new ConflictError(
      `Invalid status transition: ${from} → ${to}`,
      'INVALID_STATUS_TRANSITION'
    );
  }
}
```

- Layer 4: `pickup_status` PostgreSQL ENUM prevents any value outside the defined set

---

### PICKUP-02: One Active Pickup Per Citizen Per Date

**Rule:** A citizen may have **at most one active pickup request per calendar date**. "Active" means any status except `cancelled` or `failed`.

**Why:** Prevents scheduling chaos — a citizen cannot have two pickups on the same day from different Kabadiwalas arriving at the same address. Also simplifies the assignment engine's workload calculation.

**Enforcement:**
```sql
-- Layer 4: Partial unique index
CREATE UNIQUE INDEX idx_pr_citizen_date_active
  ON pickup_requests (citizen_id, preferred_date)
  WHERE status NOT IN ('cancelled', 'failed');
```

```javascript
// Layer 3 (pickup.service.createPickupRequest) — checked before INSERT:
const existing = await queryOne(
  `SELECT id FROM pickup_requests
   WHERE citizen_id = $1
     AND preferred_date = $2
     AND status NOT IN ('cancelled', 'failed')`,
  [citizenId, preferredDate]
);
if (existing) {
  throw new ConflictError(
    'You already have an active pickup request for this date.',
    'DUPLICATE_PICKUP_DATE'
  );
}
```

**Note:** A cancelled request does not block a new request for the same date. The citizen can re-request after cancelling.

---

### PICKUP-03: Future Dates Only

**Rule:** `preferred_date` must be **today or a future date**. Past dates are rejected.

**Why:** A pickup cannot be scheduled in the past. This is a logical constraint.

**Enforcement:**
```javascript
// Layer 2 (pickup.validation.js — Zod schema):
preferredDate: z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((val) => {
    const date = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, 'Pickup date must be today or in the future'),
```

```sql
-- Layer 4 (CHECK constraint on pickup_requests):
CONSTRAINT pr_preferred_date_future CHECK (preferred_date >= CURRENT_DATE)
```

**Edge case:** `CURRENT_DATE` in PostgreSQL is evaluated at transaction time. A request submitted at 11:58 PM for "today" is valid — the date has not rolled over yet. This is accepted behaviour.

---

### PICKUP-04: Maximum Advance Booking Window

**Rule:** A pickup cannot be scheduled more than **7 days in advance**. Requests beyond this window are rejected.

**Why:** Scrap rates are updated daily. A booking 30 days in advance would lock in a rate that may be significantly different by pickup time. 7 days is a practical window where rate volatility is manageable.

**Enforcement:**
```javascript
// Layer 3 (pickup.service.createPickupRequest):
const maxDate = new Date();
maxDate.setDate(maxDate.getDate() + 7);
maxDate.setHours(23, 59, 59, 999);

if (new Date(preferredDate) > maxDate) {
  throw new ValidationError(
    'Pickup cannot be scheduled more than 7 days in advance.',
    [{ field: 'preferredDate', message: 'Maximum 7 days advance booking allowed' }]
  );
}
```

**Configuration:** The `7` comes from `system_configurations.pickup_advance_booking_days`, not a hardcoded constant. Admin can change it without a deployment.

---

### PICKUP-05: Rate Snapshot at Request Creation

**Rule:** The scrap rate in effect **at the time of request creation** is captured in `pickup_requests.rate_per_kg_at_request`. This rate is used for all payment calculations for that pickup, regardless of subsequent rate changes.

**Why:** A citizen who requests a pickup at ₹15/kg for plastic should receive ₹15/kg even if the admin updates the rate to ₹12/kg the next day. Price transparency requires rate stability after commitment.

**Enforcement:**
```javascript
// Layer 3 (pickup.service.createPickupRequest):
const currentRate = await localityService.getCurrentRate(localityId, category);
if (!currentRate) {
  throw new NotFoundError(`No scrap rate found for ${category} in this locality`);
}

await query(
  `INSERT INTO pickup_requests
     (citizen_id, locality_id, category, estimated_weight,
      pickup_address, preferred_date, preferred_time_slot,
      rate_per_kg_at_request, ...)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ...)`,
  [citizenId, localityId, category, estimatedWeight,
   pickupAddress, preferredDate, preferredTimeSlot,
   currentRate.rate_per_kg, ...]
);
```

---

### PICKUP-06: Locality Must Be Serviceable

**Rule:** A pickup request can only be created for a locality where `is_serviceable = true`.

**Why:** Prevents requests to areas where no Kabadiwalas are operational, which would always result in `unassigned_no_availability`.

**Enforcement:**
```javascript
// Layer 3 (pickup.service.createPickupRequest):
const locality = await queryOne(
  'SELECT id, is_serviceable FROM localities WHERE id = $1',
  [localityId]
);
if (!locality) throw new NotFoundError('Locality not found');
if (!locality.is_serviceable) {
  throw new ValidationError(
    'Pickup service is not available in this locality yet.',
    [{ field: 'localityId', message: 'Locality not currently serviceable' }]
  );
}
```

---

### PICKUP-07: Cancellation Terminal State Rules

**Rule:** A pickup in `completed` status **cannot be cancelled**. A pickup in `cancelled` status **cannot be re-activated**. Both are terminal states.

**Enforcement:**
- Layer 3: `assertValidTransition` (see PICKUP-01) — `VALID_TRANSITIONS.completed = []`
- Layer 3: Cancellation service method checks current status before proceeding:

```javascript
// Layer 3 (pickup.service.cancelPickup):
async function cancelPickup(requestId, cancelledByUserId, cancelledByRole) {
  const pickup = await queryOne(
    'SELECT id, status, citizen_id FROM pickup_requests WHERE id = $1',
    [requestId]
  );
  if (!pickup) throw new NotFoundError('Pickup request not found');

  // Ownership check — citizen can only cancel their own
  if (cancelledByRole === 'citizen' && pickup.citizen_id !== cancelledByUserId) {
    throw new AuthError('You can only cancel your own pickup requests', 403);
  }

  assertValidTransition(pickup.status, 'cancelled');  // Throws if completed or already cancelled

  await transaction(async (client) => {
    await client.query(
      `UPDATE pickup_requests SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [requestId]
    );
    // If assignment exists, mark it as reassigned (free up kabadiwala's slot)
    await client.query(
      `UPDATE pickup_assignments SET status = 'reassigned', updated_at = NOW()
       WHERE request_id = $1 AND status NOT IN ('completed', 'failed', 'reassigned')`,
      [requestId]
    );
    // Decrement kabadiwala's total_pickups (slot freed)
    await client.query(
      `UPDATE kabadiwala_profiles kp
       SET total_pickups = GREATEST(total_pickups - 1, 0), updated_at = NOW()
       FROM pickup_assignments pa
       WHERE pa.request_id = $1
         AND pa.kabadiwala_id = kp.user_id
         AND pa.status = 'reassigned'`,
      [requestId]
    );
  });
}
```

---

### PICKUP-08: Pickup Address Cannot Change After Assignment

**Rule:** Once a pickup is in `assigned` or later status, the `pickup_address` and `pickup_lat`/`pickup_lng` fields are **locked and cannot be changed**.

**Why:** A Kabadiwala has already been assigned and may be en route. Changing the address after assignment would cause them to go to the wrong location.

**Enforcement:**
```javascript
// Layer 3 (pickup.service.updatePickupAddress):
if (!['requested'].includes(pickup.status)) {
  throw new ConflictError(
    'Pickup address cannot be changed after the request has been assigned.',
    'PICKUP_LOCKED'
  );
}
```

---

## 5. Assignment Rules

### ASSIGN-01: Automatic Assignment Runs Asynchronously

**Rule:** When a pickup request is created, the assignment engine runs **asynchronously** — it does not block the citizen's API response. The citizen receives a `requestId` immediately. The assignment happens within seconds in the background.

**Why:** The assignment engine queries multiple Kabadiwalas, does distance calculations, and writes to multiple tables within a transaction. Making the citizen wait for all of this degrades the perceived performance of the application.

**Enforcement:**
```javascript
// Layer 3 (pickup.service.createPickupRequest):
const { rows } = await query(`INSERT INTO pickup_requests (...) RETURNING id`);
const requestId = rows[0].id;

// DO NOT await — fire and forget (with error logging)
assignmentService.triggerAutoAssignment(requestId).catch(err => {
  logger.error('Auto-assignment failed silently', { requestId, error: err.message });
  // The pickup remains in 'requested' status and enters the admin's unassigned queue
});

return { requestId };   // ← Citizen gets this immediately
```

---

### ASSIGN-02: Kabadiwala Eligibility Criteria

**Rule:** A Kabadiwala is eligible for assignment only if ALL of the following are true:

1. `kabadiwala_profiles.is_available = true`
2. `users.is_active = true`
3. `kabadiwala_profiles.service_locality_id` matches the pickup's `locality_id`
4. Number of active assignments for the kabadiwala on `preferred_date` is **less than** `max_daily_pickups_per_kabadiwala` (default: 10)

**Enforcement:**
```sql
-- Layer 3 (AssignmentEngine._fetchCandidates):
WHERE kp.service_locality_id = $1  -- locality match
  AND kp.is_available = true        -- availability flag
  AND u.is_active = true            -- account active
  -- Workload check via HAVING:
HAVING COUNT(pa.id) < $3           -- under daily cap
```

---

### ASSIGN-03: No Assignment Without an Active Scrap Rate

**Rule:** The assignment engine will not assign a pickup if there is no active scrap rate for the pickup's `category` in the pickup's `locality`. The request is flagged and the admin is notified.

**Why:** Without a rate, the payment calculation on completion is impossible. A completed pickup with no rate creates an irresolvable payment dispute.

**Enforcement:**
```javascript
// Layer 3 (pickup.service.createPickupRequest) — checked BEFORE creating the request:
const currentRate = await localityService.getCurrentRate(localityId, category);
if (!currentRate) {
  throw new NotFoundError(
    `No scrap rate configured for ${category} in this locality. Contact admin.`
  );
}
// If no rate exists, the pickup request itself is rejected at creation time
// The assignment engine never sees a request without a confirmed rate
```

---

### ASSIGN-04: Assignment Snapshot Requirement

**Rule:** Every assignment record **must** store a `factors_snapshot` and `weights_snapshot` at the time of creation. These cannot be null or empty.

**Why:** The learning loop's training data depends on knowing exactly what inputs the engine used for each assignment. Without the snapshot, the learning loop cannot compute gradients for historical assignments.

**Enforcement:**
```sql
-- Layer 4:
factors_snapshot  JSONB NOT NULL DEFAULT '{}'
weights_snapshot  JSONB NOT NULL DEFAULT '{}'
```

```javascript
// Layer 3 (assignment.service.triggerAutoAssignment):
// AssignmentEngine.findBestKabadiwala always returns factorsSnapshot + weightsSnapshot
// These are mandatory fields in the INSERT statement — no path skips them
```

---

### ASSIGN-05: Manual Assignment Excludes Learning Feedback

**Rule:** Assignments created by admin manual override (`assigned_by = 'manual'`) **do not generate `learning_feedback` records**. They are excluded from the learning loop's training data.

**Why:** Manual assignments represent human judgment overriding the engine — often for exceptional circumstances (Kabadiwala requested a specific pickup, emergency redistribution). Including them in training data would teach the engine to mimic human overrides, not to optimise assignment quality.

**Enforcement:**
```javascript
// Layer 3 (assignment.service.manualAssign):
await transaction(async (client) => {
  // Create assignment
  await client.query(
    `INSERT INTO pickup_assignments (..., assigned_by, admin_note)
     VALUES (..., 'manual', $N)`,
    [...]
  );
  // Update pickup status
  await client.query(...);
  // Increment kabadiwala counter
  await client.query(...);

  // NOTE: No INSERT INTO learning_feedback here.
  // Manual assignments are intentionally excluded from training data.
});
```

---

### ASSIGN-06: One Active Assignment Per Pickup Request

**Rule:** A pickup request can have **at most one non-reassigned assignment** at any time.

**Why:** Two Kabadiwalas showing up for the same pickup creates confusion, competition, and a broken payment calculation.

**Enforcement:**
```sql
-- Layer 4: UNIQUE constraint on pickup_assignments.request_id
UNIQUE (request_id)
-- This prevents two active assignments for the same request
-- Reassignment works by: UPDATE old assignment SET status='reassigned',
-- then INSERT new assignment. The UNIQUE constraint is not violated
-- because the old row is updated first within the same transaction.
```

```javascript
// Layer 3 (assignment.service) — reassignment pattern:
await transaction(async (client) => {
  // 1. Mark old assignment as reassigned FIRST (releases the UNIQUE slot)
  await client.query(
    `UPDATE pickup_assignments SET status = 'reassigned' WHERE request_id = $1`,
    [requestId]
  );
  // 2. Insert new assignment (UNIQUE constraint is now free)
  await client.query(
    `INSERT INTO pickup_assignments (request_id, kabadiwala_id, ...) VALUES ($1, $2, ...)`,
    [requestId, newKabadiwalId, ...]
  );
});
```

---

### ASSIGN-07: Distance Cap for Auto-Assignment

**Rule:** The assignment engine **will not consider** a Kabadiwala whose distance to the pickup exceeds `assignment_max_distance_km` (default: 10 km), even if they are the only available Kabadiwala.

**Why:** An assignment that is 15km away is impractical and unfair to the Kabadiwala. The admin is notified instead, and can make a judgment call on whether to override.

**Enforcement:**
```javascript
// Layer 3 (AssignmentEngine._computeFactors):
if (distanceKm > MAX_ASSIGNMENT_DISTANCE_KM) {
  return null;  // Exclude this candidate from scoring
}

// In findBestKabadiwala, filter out null-scored candidates:
const validCandidates = scored.filter(c => c !== null);
if (validCandidates.length === 0) {
  // All candidates exceeded distance cap — treat as no availability
  return null;
}
```

---

### ASSIGN-08: Reassignment on Failure

**Rule:** When a Kabadiwala marks a pickup as `failed`, the system **automatically attempts reassignment** to a different Kabadiwala. If no other Kabadiwala is available, the request enters the admin's manual queue with status `unassigned_no_availability`.

**Why:** A single Kabadiwala failure should not permanently block a citizen's pickup request. The system should recover automatically.

**Enforcement:**
```javascript
// Layer 3 (kabadiwala.service.markPickupFailed):
async function markPickupFailed(assignmentId, kabadiwalId, failureReason) {
  await transaction(async (client) => {
    await client.query(
      `UPDATE pickup_assignments
       SET status = 'failed', failure_reason = $2, failed_at = NOW()
       WHERE id = $1 AND kabadiwala_id = $3`,
      [assignmentId, failureReason, kabadiwalId]
    );
    await client.query(
      `UPDATE pickup_requests SET status = 'failed', updated_at = NOW()
       WHERE id = (SELECT request_id FROM pickup_assignments WHERE id = $1)`,
      [assignmentId]
    );
    // Decrement kabadiwala total_pickups (failed, slot freed)
    await client.query(
      `UPDATE kabadiwala_profiles SET total_pickups = GREATEST(total_pickups - 1, 0)
       WHERE user_id = $1`,
      [kabadiwalId]
    );
  });

  // Async: attempt reassignment (exclude the failed kabadiwala)
  const request = await queryOne(
    `SELECT request_id FROM pickup_assignments WHERE id = $1`, [assignmentId]
  );
  await assignmentService.triggerAutoAssignment(
    request.request_id,
    { excludeKabadiwalId: kabadiwalId }   // ← Engine excludes the failed kabadiwala
  ).catch(err => logger.error('Reassignment failed', { err }));
}
```

---

## 6. Payment Rules

### PAY-01: Payment Record Created Automatically on Completion

**Rule:** When a Kabadiwala completes a pickup (marking `assignment_status = 'completed'`), a `payment_records` row is **automatically created** by the system. The citizen does not initiate payment creation.

**Why:** The amount is a system calculation — not a value the citizen or Kabadiwala enters. Citizen only confirms payment after it is calculated.

**Enforcement:**
```javascript
// Layer 3 (kabadiwala.service.completePickup):
await transaction(async (client) => {
  // 1. Update assignment
  await client.query(
    `UPDATE pickup_assignments
     SET status = 'completed', actual_weight = $2, completed_at = NOW()
     WHERE id = $1`,
    [assignmentId, actualWeight]
  );

  // 2. Update pickup request
  await client.query(
    `UPDATE pickup_requests SET status = 'completed', updated_at = NOW()
     WHERE id = (SELECT request_id FROM pickup_assignments WHERE id = $1)`,
    [assignmentId]
  );

  // 3. Auto-calculate payment
  const rate = await client.query(
    `SELECT pr.rate_per_kg_at_request, pr.citizen_id, pa.kabadiwala_id
     FROM pickup_assignments pa
     JOIN pickup_requests pr ON pa.request_id = pr.id
     WHERE pa.id = $1`,
    [assignmentId]
  );
  const { rate_per_kg_at_request, citizen_id, kabadiwala_id } = rate.rows[0];
  const amount = parseFloat((actualWeight * rate_per_kg_at_request).toFixed(2));

  // 4. Create payment record
  await client.query(
    `INSERT INTO payment_records (assignment_id, citizen_id, kabadiwala_id, amount)
     VALUES ($1, $2, $3, $4)`,
    [assignmentId, citizen_id, kabadiwala_id, amount]
  );

  // 5. Update kabadiwala counters
  await client.query(
    `UPDATE kabadiwala_profiles
     SET completed_pickups = completed_pickups + 1, updated_at = NOW()
     WHERE user_id = $1`,
    [kabadiwala_id]
  );
});
```

---

### PAY-02: Payment Amount Calculation Formula

**Rule:** `payment_amount = actual_weight (kg) × rate_per_kg_at_request (₹)`

The rate used is **always** `pickup_requests.rate_per_kg_at_request` — the rate snapshotted at request creation time — never the current scrap rate.

**Why:** See PICKUP-05. Rate protection is the core of price transparency.

**Enforcement:**
```javascript
// Layer 3: Formula is computed in code and stored — never user-supplied
const amount = parseFloat((actualWeight * rate_per_kg_at_request).toFixed(2));
// toFixed(2) → rounds to 2 decimal places (paise precision)
```

---

### PAY-03: Payment Amount Is Immutable After Creation

**Rule:** Once a `payment_records` row is created, the `amount` field **cannot be changed** through any API.

**Why:** The amount is a calculated fact based on immutable inputs (actual_weight, rate_at_request). Any discrepancy is a dispute, handled via the dispute workflow — not an edit.

**Enforcement:**
```javascript
// Layer 3 (payment.service.updatePaymentStatus):
// The only fields permitted in a payment update are: status, upi_reference, paid_at
// amount is NOT in the update schema and NOT in the UPDATE statement
await query(
  `UPDATE payment_records
   SET status = $2, upi_reference = $3, paid_at = $4, updated_at = NOW()
   WHERE id = $1`,
  [paymentId, status, upiReference, new Date()]
);
// amount is never in this query
```

---

### PAY-04: Payment Confirmation Requires UPI Reference

**Rule:** A payment cannot be moved to `paid` status without a `upi_reference` value.

**Why:** Without a transaction reference, the payment confirmation is unverifiable. The reference provides a dispute resolution handle.

**Enforcement:**
```javascript
// Layer 2 (payment.validation.js):
updatePaymentStatusSchema: z.object({
  body: z.object({
    paymentStatus: z.literal('paid'),
    upiReference: z.string().min(8, 'UPI reference must be at least 8 characters'),
  })
})
```

```sql
-- Layer 4 (payment_records):
CONSTRAINT pr_upi_on_paid CHECK (
  (status = 'paid' AND upi_reference IS NOT NULL) OR (status != 'paid')
)
```

---

### PAY-05: Only the Citizen Can Confirm Payment

**Rule:** Only the citizen on the pickup request can mark the payment as `paid`. The Kabadiwala cannot mark their own payment as received.

**Why:** A Kabadiwala marking a payment as paid without receiving money would be fraudulent. The citizen is the payer — only they can confirm the payment happened.

**Enforcement:**
```javascript
// Layer 3 (payment.service.confirmPayment):
async function confirmPayment(paymentId, userId, userRole) {
  const payment = await queryOne(
    'SELECT id, citizen_id, status FROM payment_records WHERE id = $1',
    [paymentId]
  );
  if (!payment) throw new NotFoundError('Payment record not found');

  // Ownership enforcement
  if (userRole === 'citizen' && payment.citizen_id !== userId) {
    throw new AuthError('You can only confirm payments for your own pickups', 403);
  }
  if (userRole === 'kabadiwala') {
    throw new AuthError('Kabadiwalas cannot confirm payment status', 403);
  }

  if (payment.status !== 'pending') {
    throw new ConflictError(`Payment is already ${payment.status}`, 'PAYMENT_NOT_PENDING');
  }
  // Proceed with update...
}
```

---

### PAY-06: Payment Status Flow

**Rule:** Payments follow a strict status machine:

```
pending ──────────────────────────────► paid (citizen confirms)
    │
    └──────────────────────────────────► disputed (citizen or kabadiwala raises)
                                              │
                                    Admin resolves
                                              │
                                   ┌──────────┴──────────┐
                                   ▼                     ▼
                                  paid               cancelled
```

- `paid` and `cancelled` are terminal states
- A `paid` payment cannot be disputed after confirmation
- `disputed` can only be resolved by admin

**Enforcement:** Same pattern as PICKUP-01 — state machine guard in `payment.service.js`.

---

### PAY-07: Actual Weight Must Be Within Reasonable Bounds

**Rule:** The `actual_weight` entered by the Kabadiwala must be:
- Greater than `0 kg`
- Less than or equal to `500 kg`
- If `estimated_weight` was provided: actual weight should not exceed `5× the estimated weight`

**Why:** A Kabadiwala should not be able to enter `9999 kg` for a residential scrap pickup. The 5× rule catches data entry errors (entering weight in grams instead of kg, extra zeros).

**Enforcement:**
```javascript
// Layer 2 (kabadiwala.validation.js):
actualWeight: z.number()
  .positive('Weight must be greater than 0')
  .max(500, 'Weight cannot exceed 500kg'),

// Layer 3 (kabadiwala.service.completePickup):
if (estimatedWeight && actualWeight > estimatedWeight * 5) {
  throw new ValidationError(
    `Actual weight (${actualWeight}kg) is more than 5× the estimated weight
     (${estimatedWeight}kg). Please verify the weight entry.`,
    [{ field: 'actualWeight', message: 'Unusually high weight — please verify' }]
  );
}
```

---

## 7. Scrap Rate Rules

### RATE-01: Rates Are Immutable Once Created

**Rule:** A scrap rate record is **never updated**. A new rate supersedes the old one by having a later `effective_date`. The old rate remains in the database permanently.

**Why:** Historical rates are required for payment dispute resolution and analytics. If a payment dispute arises about a pickup from 3 months ago, the exact rate at that time must be queryable.

**Enforcement:**
- Layer 4: No `updated_at` column on `scrap_rates` — a design signal that updates are not intended
- Layer 3: `scrap_rate.service.setRate()` only does `INSERT`, never `UPDATE`
- Layer 4: `UNIQUE (locality_id, category, effective_date)` — cannot insert two rates for the same day

---

### RATE-02: Only Admin Can Set Rates

**Rule:** Scrap rate creation is restricted to `admin` role only.

**Enforcement:**
```javascript
// Layer 2 (locality.routes.js):
router.post('/scrap-rates',
  authenticate,
  authorizeRole('admin'),          // ← Only admin
  validateRequest(setRateSchema),
  localityController.setScrapRate
);
```

---

### RATE-03: Effective Date Cannot Be in the Past

**Rule:** A new scrap rate's `effective_date` must be today or a future date. Admin cannot retroactively set rates for past dates.

**Why:** Setting a past rate would retroactively change the payment amount for already-created pickup requests, violating PICKUP-05.

**Enforcement:**
```javascript
// Layer 2 (locality.validation.js):
effectiveDate: z.string()
  .refine(val => new Date(val) >= new Date(new Date().toDateString()),
    'Effective date cannot be in the past')
```

---

### RATE-04: At Least One Rate Must Exist Per Serviceable Locality

**Rule:** When a locality is marked `is_serviceable = true`, at least one scrap rate for each supported category must exist.

**Why:** Citizens need to see rates before submitting a request. An active locality with no rates is operationally broken.

**Enforcement:**
```javascript
// Layer 3 (admin.service.toggleLocalityServiceability):
if (setServiceable === true) {
  const rateCount = await queryOne(
    `SELECT COUNT(DISTINCT category) AS cnt FROM scrap_rates
     WHERE locality_id = $1
       AND effective_date <= CURRENT_DATE`,
    [localityId]
  );
  const REQUIRED_CATEGORIES = 3; // plastic, paper, metal
  if (parseInt(rateCount.cnt) < REQUIRED_CATEGORIES) {
    throw new ValidationError(
      'Cannot activate locality: scrap rates for all categories must be set first.',
      [{ field: 'localityId', message: 'Missing rates for one or more categories' }]
    );
  }
}
```

---

### RATE-05: Admin Receives Stale Rate Alert

**Rule:** If any scrap rate has not been updated for more than **7 days**, the admin receives a daily in-app notification.

**Why:** Scrap markets are volatile. A 7-day-old rate may be significantly off-market. Admins need a nudge to review rates.

**Enforcement:**
```javascript
// Layer: Background job (jobs/rateReminder.job.js) — runs daily at 9 AM IST
async function run() {
  const staleRates = await query(
    `SELECT DISTINCT ON (locality_id, category)
       l.name AS locality_name, sr.category, sr.effective_date
     FROM scrap_rates sr
     JOIN localities l ON sr.locality_id = l.id
     WHERE l.is_serviceable = true
     ORDER BY locality_id, category, effective_date DESC`
  );

  const stale = staleRates.rows.filter(r => {
    const daysSince = (Date.now() - new Date(r.effective_date)) / (1000 * 86400);
    return daysSince > 7;
  });

  if (stale.length > 0) {
    await notificationService.notifyAdmins('STALE_RATE_ALERT', { staleRates: stale });
  }
}
```

---

## 8. Kabadiwala Operational Rules

### KAB-01: Daily Pickup Cap

**Rule:** A Kabadiwala cannot be assigned more than `max_daily_pickups_per_kabadiwala` (default: 10) pickups on any single day.

**Why:** Protects Kabadiwala welfare and ensures service quality. A Kabadiwala with 20 pickups in a day will rush, compromise on weighing accuracy, and likely fail several.

**Enforcement:**
```javascript
// Layer 3 (AssignmentEngine._fetchCandidates):
HAVING COUNT(pa.id) < $3  // $3 = max_daily_pickups_per_kabadiwala
```

```javascript
// Layer 3 (assignment.service — secondary check before INSERT):
const todayCount = await queryOne(
  `SELECT COUNT(*) AS cnt FROM pickup_assignments
   WHERE kabadiwala_id = $1 AND assigned_date = $2
     AND status NOT IN ('failed', 'reassigned')`,
  [kabadiwalId, assignedDate]
);
if (parseInt(todayCount.cnt) >= maxDailyPickups) {
  throw new ConflictError('Kabadiwala has reached their daily pickup limit', 'KABADIWALA_OVERLOADED');
}
```

---

### KAB-02: Only Assigned Kabadiwala Can Complete a Pickup

**Rule:** Only the Kabadiwala to whom a pickup is currently assigned can mark it as `completed` or `failed`. No other Kabadiwala — including admin — can complete pickups on another Kabadiwala's behalf.

**Why:** Prevents one Kabadiwala from claiming another's completed pickups and the associated earnings.

**Enforcement:**
```javascript
// Layer 3 (kabadiwala.service.completePickup):
const assignment = await queryOne(
  `SELECT id, kabadiwala_id, status FROM pickup_assignments WHERE id = $1`,
  [assignmentId]
);
if (!assignment) throw new NotFoundError('Assignment not found');

if (assignment.kabadiwala_id !== userId) {
  throw new AuthError(
    'You can only complete your own assigned pickups', 403
  );
}
```

---

### KAB-03: Availability Toggle

**Rule:** A Kabadiwala can toggle their `is_available` status at any time. Setting `is_available = false` **does not affect pickups already assigned** for the current day. It only prevents **new assignments** from being created.

**Why:** A Kabadiwala who goes unavailable mid-day should not have their existing assignments cancelled — they have already committed to those pickups.

**Enforcement:**
```javascript
// Layer 3 (kabadiwala.service.setAvailability):
// Only updates kabadiwala_profiles.is_available
// Does NOT touch any existing pickup_assignments
await query(
  'UPDATE kabadiwala_profiles SET is_available = $2 WHERE user_id = $1',
  [userId, isAvailable]
);
// The assignment engine checks is_available at scoring time — future assignments excluded
```

---

### KAB-04: Reliability Score Recomputation

**Rule:** `kabadiwala_profiles.reliability_score` is recomputed **daily** by a background job. The formula is:

```
reliability_score = completed_pickups / MAX(total_pickups, 1)
```

Clamped to `[0.000, 1.000]`.

**Why:** The denormalized `reliability_score` must be kept in sync with the actual completion ratio as new pickups complete or fail. The assignment engine reads this field — stale values skew scoring.

**Enforcement:**
```javascript
// Layer: Background job (jobs/reliabilityScore.job.js) — runs daily at 1 AM IST
async function run() {
  await query(
    `UPDATE kabadiwala_profiles
     SET reliability_score = LEAST(
       CAST(completed_pickups AS DECIMAL) / GREATEST(total_pickups, 1),
       1.000
     ),
     updated_at = NOW()`
  );
  logger.info('Reliability scores recomputed for all kabadiwalas');
}
```

---

### KAB-05: Stale Assignment Alert

**Rule:** If a pickup is in `assigned` status for more than **24 hours** without moving to `in_progress`, a system alert is raised to the admin.

**Why:** A Kabadiwala may have become unavailable, lost their device, or forgotten about the assignment. The admin needs visibility to intervene.

**Enforcement:**
```javascript
// Layer: Background job (jobs/stalePickup.job.js) — runs hourly
async function run() {
  const stale = await query(
    `SELECT pa.id, pa.kabadiwala_id, pr.id AS request_id, pr.preferred_date
     FROM pickup_assignments pa
     JOIN pickup_requests pr ON pa.request_id = pr.id
     WHERE pa.status = 'assigned'
       AND pa.created_at < NOW() - INTERVAL '24 hours'`
  );

  for (const row of stale.rows) {
    await notificationService.notifyAdmins('STALE_ASSIGNMENT_ALERT', {
      assignmentId: row.id,
      requestId:    row.request_id,
      kabadiwalId:  row.kabadiwala_id,
    });
  }
}
```

---

## 9. Data Validation Rules

### VAL-01: Phone Number Format

**Rule:** All phone numbers must be exactly **10 digits**, numeric only, representing Indian mobile numbers. No country code prefix.

```javascript
// Zod schema (shared):
phoneNumber: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits')

// Normalisation utility (shared/utils/phoneUtils.js):
function normalizePhone(input) {
  // Strip leading +91 or 0 if present
  const stripped = input.replace(/^(\+91|91|0)/, '');
  if (!/^\d{10}$/.test(stripped)) throw new Error('Invalid phone number');
  return stripped;
}
```

---

### VAL-02: Waste Category

**Rule:** `category` must be one of `['plastic', 'paper', 'metal']`. Case-insensitive on input — normalised to lowercase at the service layer.

```javascript
// Layer 2 (Zod):
category: z.enum(['plastic', 'paper', 'metal'])

// Layer 4 (PostgreSQL ENUM):
CREATE TYPE waste_category AS ENUM ('plastic', 'paper', 'metal');
```

---

### VAL-03: Estimated Weight Bounds

**Rule:** `estimated_weight` must be:
- Greater than `0`
- A maximum of `500 kg`
- Numeric (no strings)

```javascript
// Layer 2:
estimatedWeight: z.number()
  .positive('Estimated weight must be greater than 0')
  .max(500, 'Maximum estimated weight is 500kg')
  .finite()
```

---

### VAL-04: Time Slot Values

**Rule:** `preferred_time_slot` must be one of `['morning', 'afternoon', 'evening']`.

- Morning: 8 AM – 12 PM
- Afternoon: 12 PM – 4 PM
- Evening: 4 PM – 7 PM

These are display-only ranges. The system does not enforce arrival within the window — it is communicated to the Kabadiwala as a preference.

```javascript
// Layer 2:
preferredTimeSlot: z.enum(['morning', 'afternoon', 'evening']).default('morning')
```

---

### VAL-05: Address Field Lengths

**Rule:**
- `pickup_address`: required, maximum 500 characters
- `landmark`: optional, maximum 255 characters
- `notes`: optional, maximum 1000 characters

```javascript
// Layer 2:
pickupAddress: z.string().min(10, 'Address too short').max(500, 'Address too long'),
landmark:      z.string().max(255).optional(),
notes:         z.string().max(1000).optional(),
```

---

### VAL-06: Pincode Format

**Rule:** Locality pincodes must be exactly **6 digits** numeric (Indian PIN code format).

```sql
-- Layer 4:
CONSTRAINT localities_pincode_format CHECK (pincode ~ '^\d{6}$')
```

---

### VAL-07: Input Sanitization for Text Fields

**Rule:** All free-text fields (`pickup_address`, `landmark`, `notes`, `name`) are stripped of HTML tags before storage.

**Why:** Prevents stored XSS if the content is ever rendered without escaping (e.g., admin notes in an email, exported report).

```javascript
// Layer 2 (sanitize.js middleware):
const sanitizeHtml = require('sanitize-html');

function sanitize(req, res, next) {
  const sanitizeValue = (val) => {
    if (typeof val === 'string') {
      return sanitizeHtml(val, { allowedTags: [], allowedAttributes: {} });
    }
    return val;
  };

  req.body = deepMap(req.body, sanitizeValue);
  next();
}
```

---

## 10. Duplicate & Conflict Prevention Rules

### DUP-01: Duplicate OTP Request Prevention

**Rule:** Requesting a new OTP overwrites the previous unexpired OTP for the same phone number. The old OTP is immediately invalidated.

**Why:** A user who requests OTP twice should use the latest one. The previous OTP must not remain valid.

**Enforcement:**
```javascript
// Layer 3 (auth.service.sendOtp):
// Redis SETEX always overwrites the existing key for the phone number
// Old OTP is gone; only the new one is valid
await redisClient.setEx(`otp:${phoneNumber}`, OTP_EXPIRY_SECONDS, hashedOtp);
```

---

### DUP-02: Duplicate Pickup Request Same Date

**Rule:** See PICKUP-02. One active request per citizen per date. Partial unique index enforces this at the database level as a second line of defence after the service-layer check.

---

### DUP-03: Duplicate Payment Record Prevention

**Rule:** One `payment_records` row per `assignment_id`. If a payment record already exists for an assignment, the system rejects a second creation attempt.

**Enforcement:**
```sql
-- Layer 4:
assignment_id BIGINT NOT NULL UNIQUE REFERENCES pickup_assignments(id)
```

```javascript
// Layer 3 (kabadiwala.service.completePickup):
// Payment INSERT is inside a transaction with the assignment UPDATE
// If the assignment is already completed (idempotency risk from retry),
// the UNIQUE constraint on assignment_id will throw a 23505 error
// which the error handler maps to 409 CONFLICT
```

---

### DUP-04: Idempotent Completion Guard

**Rule:** If a Kabadiwala accidentally submits the completion form twice (network retry, double-tap), the second submission is rejected gracefully with a `409 Conflict` — not a `500 Internal Server Error`.

**Enforcement:**
```javascript
// Layer 3 (kabadiwala.service.completePickup) — explicit check before transaction:
const assignment = await queryOne(
  'SELECT id, status FROM pickup_assignments WHERE id = $1',
  [assignmentId]
);

if (assignment.status === 'completed') {
  throw new ConflictError(
    'This pickup has already been completed.',
    'ALREADY_COMPLETED'
  );
}
// Only then proceed with transaction
```

---

### DUP-05: Duplicate Scrap Rate Same Day

**Rule:** Only one scrap rate per `(locality_id, category, effective_date)` combination.

**Enforcement:**
```sql
-- Layer 4:
CONSTRAINT scrap_rates_locality_category_date_uq
  UNIQUE (locality_id, category, effective_date)
```

---

## 11. Learning Loop Rules

### LEARN-01: Minimum Data Threshold

**Rule:** The learning loop will **not run** if fewer than **30 unprocessed feedback records** exist. It silently exits and logs a warning.

**Why:** Gradient descent on 3 samples is noise, not signal. At fewer than 30 samples the weight update is statistically meaningless and could degrade performance.

**Enforcement:**
```javascript
// Layer: LearningLoop.run()
const feedbackCount = await queryOne(
  `SELECT COUNT(*) AS cnt FROM learning_feedback WHERE processed = false`,
);
if (parseInt(feedbackCount.cnt) < 30) {
  logger.warn('Learning loop skipped: insufficient feedback data', {
    count: feedbackCount.cnt, required: 30
  });
  return { accepted: false, reason: 'INSUFFICIENT_DATA' };
}
```

---

### LEARN-02: Weight Bounds Are Hard Constraints

**Rule:** No individual weight (`w_distance`, `w_workload`, `w_reliability`) can fall below `0.100` or exceed `0.600`, regardless of gradient direction. All three weights must always sum to exactly `1.000`.

**Why:** Unconstrained gradient descent could collapse one weight to near-zero (e.g., reliability weight → 0.01), effectively making the engine ignore reliability entirely. The bounds ensure all three factors remain meaningful throughout the learning process.

**Enforcement:**
```javascript
// Layer 3 (LearningLoop.computeNewWeights):
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

let wD = clamp(currentWeights.wDistance    + gradients.distance,    0.10, 0.60);
let wW = clamp(currentWeights.wWorkload    + gradients.workload,    0.10, 0.60);
let wR = clamp(currentWeights.wReliability + gradients.reliability, 0.10, 0.60);

// Normalize to sum exactly 1.0
const total = wD + wW + wR;
wD = parseFloat((wD / total).toFixed(3));
wW = parseFloat((wW / total).toFixed(3));
wR = parseFloat(1.000 - wD - wW).toFixed(3);  // Remainder to ensure exact 1.000
```

```sql
-- Layer 4 (weight_configurations):
CONSTRAINT wc_weights_sum CHECK (ROUND(w_distance + w_workload + w_reliability, 3) = 1.000)
CONSTRAINT wc_distance_range   CHECK (w_distance   BETWEEN 0.100 AND 0.600)
CONSTRAINT wc_workload_range   CHECK (w_workload   BETWEEN 0.100 AND 0.600)
CONSTRAINT wc_reliability_range CHECK (w_reliability BETWEEN 0.100 AND 0.600)
```

---

### LEARN-03: Improvement Threshold Gate

**Rule:** New weights are **only accepted** if simulation shows a ≥ **5% improvement** in assignment success rate over the previous 7-day period. If improvement is below this threshold, current weights are retained and the loop logs the result without updating.

**Why:** Prevents random noise in small datasets from causing harmful weight updates. A 2% "improvement" on 30 samples is not statistically meaningful.

**Enforcement:**
```javascript
// Layer 3 (LearningLoop.run):
const simulatedSuccessRate = await simulate(newWeights, recentAssignments);
const currentSuccessRate   = await simulate(currentWeights, recentAssignments);

const improvementPct = ((simulatedSuccessRate - currentSuccessRate) / currentSuccessRate) * 100;

if (improvementPct < MIN_IMPROVEMENT_PCT) {  // 5.0 from system_configurations
  logger.info('Learning loop: weights rejected (insufficient improvement)', {
    improvementPct: improvementPct.toFixed(2),
    required: MIN_IMPROVEMENT_PCT
  });
  return { accepted: false, improvementPct };
}
```

---

### LEARN-04: Learning Loop Can Be Disabled by Admin

**Rule:** The learning loop respects the `system_configurations.learning_loop_enabled` flag. If set to `'false'`, the scheduled job exits immediately without running.

**Why:** Provides a kill switch for the learning component without requiring a deployment. If the learning loop causes unexpected weight changes, admin can disable it immediately from the dashboard.

**Enforcement:**
```javascript
// Layer: LearningLoop.run() — first line of execution
const enabled = await queryOne(
  `SELECT value FROM system_configurations WHERE key = 'learning_loop_enabled'`
);
if (enabled.value !== 'true') {
  logger.info('Learning loop disabled via system configuration');
  return { accepted: false, reason: 'DISABLED' };
}
```

---

### LEARN-05: Admin Notified After Every Loop Run

**Rule:** After every execution of the learning loop — whether weights are accepted or rejected — the admin receives an in-app notification with the outcome summary.

**Why:** The admin must maintain oversight of the learning component. A black-box algorithm that silently updates without human visibility violates the human-centered architecture principle.

**Enforcement:**
```javascript
// Layer: LearningLoop.run() — at end of execution
await notificationService.notifyAdmins('WEIGHTS_UPDATED', {
  accepted: result.accepted,
  reason:   result.reason ?? null,
  oldWeights: currentWeights,
  newWeights: result.accepted ? newWeights : currentWeights,
  improvementPct: result.improvementPct,
  pickupsAnalyzed: feedbackCount,
});
```

---

## 12. Admin Override Rules

### ADMIN-01: Admin Can Manually Assign Any Pending Pickup

**Rule:** Admin can manually assign a pickup in any of the following statuses: `requested`, `unassigned_no_availability`, `failed`.

Admin **cannot** manually assign a pickup that is `assigned`, `in_progress`, `completed`, or `cancelled` — these are either already handled or terminal.

**Enforcement:**
```javascript
// Layer 3 (admin.service.manualAssign):
const MANUAL_ASSIGNABLE_STATUSES = ['requested', 'unassigned_no_availability', 'failed'];
if (!MANUAL_ASSIGNABLE_STATUSES.includes(pickup.status)) {
  throw new ConflictError(
    `Cannot manually assign a pickup in '${pickup.status}' status`,
    'INVALID_MANUAL_ASSIGN_STATUS'
  );
}
```

---

### ADMIN-02: Admin Manual Assignment Must Include a Note

**Rule:** When admin performs a manual assignment, the `admin_note` field is **required** (minimum 10 characters).

**Why:** Manual overrides of the assignment engine should be documented. "Why did admin override the system?" is an important audit question.

**Enforcement:**
```javascript
// Layer 2 (admin.validation.js):
manualAssignSchema: z.object({
  body: z.object({
    requestId:    z.number().int().positive(),
    kabadiwalId:  z.number().int().positive(),
    adminNote:    z.string().min(10, 'Admin note required for manual assignments (min 10 chars)'),
  })
})
```

---

### ADMIN-03: Admin Cannot Override Weight Configuration to Violate Bounds

**Rule:** If admin manually sets factor weights via the admin dashboard, the same bounds apply as the learning loop: each weight between `0.100` and `0.600`, sum must equal `1.000`.

**Enforcement:**
```javascript
// Layer 2 (admin.validation.js):
manualWeightSchema: z.object({
  body: z.object({
    wDistance:    z.number().min(0.1).max(0.6),
    wWorkload:    z.number().min(0.1).max(0.6),
    wReliability: z.number().min(0.1).max(0.6),
    adminNote:    z.string().min(10),
  }).refine(
    (d) => Math.abs(d.wDistance + d.wWorkload + d.wReliability - 1.0) < 0.001,
    { message: 'Weights must sum to 1.0' }
  )
})
```

---

### ADMIN-04: Admin Rate Changes Are Audited

**Rule:** Every scrap rate change records `set_by_admin_id`. This field is populated at the service layer from `req.user.userId` (not from request body).

**Why:** Rate changes directly affect citizen payments. Attribution is mandatory for accountability.

**Enforcement:**
```javascript
// Layer 3 (locality.service.setScrapRate):
// adminId comes from req.user.userId (set by authenticate middleware)
// Never from req.body — prevents spoofed attribution
await query(
  `INSERT INTO scrap_rates (locality_id, category, rate_per_kg, effective_date, set_by_admin_id)
   VALUES ($1, $2, $3, $4, $5)`,
  [localityId, category, ratePerKg, effectiveDate, adminId]
);
```

---

## 13. System Configuration Rules

### CONFIG-01: Configuration Values Are Strings

**Rule:** All values in `system_configurations` are stored as `TEXT`. The consuming code is responsible for parsing to the correct type.

**Why:** A generic key-value store cannot know the type of every value. Type safety is the consumer's responsibility.

```javascript
// Usage pattern — always parse, never assume:
const maxPickups = parseInt(
  (await queryOne(`SELECT value FROM system_configurations WHERE key = $1`,
   ['max_daily_pickups_per_kabadiwala'])).value,
  10
);
```

---

### CONFIG-02: Configuration Updates Are Audited

**Rule:** Every `system_configurations` update records `updated_by_id` (the admin who changed it) and `updated_at`.

**Enforcement:**
```javascript
// Layer 3 (admin.service.updateSystemConfig):
await query(
  `UPDATE system_configurations
   SET value = $2, updated_by_id = $3, updated_at = NOW()
   WHERE key = $1`,
  [key, value, adminId]  // adminId from req.user.userId
);
```

---

### CONFIG-03: Restricted Keys Cannot Be Modified via API

**Rule:** The following keys are **read-only** via API and can only be changed via direct DB access:

- `otp_expiry_seconds`
- `otp_max_attempts`
- `otp_lockout_seconds`

**Why:** These are security parameters. Changing them via API (even by admin) creates a risk where a compromised admin account is used to weaken authentication security.

**Enforcement:**
```javascript
// Layer 3 (admin.service.updateSystemConfig):
const READONLY_KEYS = ['otp_expiry_seconds', 'otp_max_attempts', 'otp_lockout_seconds'];
if (READONLY_KEYS.includes(key)) {
  throw new AuthError(
    `Configuration key '${key}' is protected and cannot be modified via API.`,
    403
  );
}
```

---

## 14. Business Rule Violation Reference

Complete mapping of all business rule violations to HTTP responses:

| Rule | Violation | HTTP Status | Error Code |
|---|---|---|---|
| AUTH-01 | > 5 OTP requests/hour | 429 | `OTP_RATE_EXCEEDED` |
| AUTH-02 | OTP TTL elapsed | 400 | `OTP_EXPIRED` |
| AUTH-04 | > 5 failed OTP attempts | 429 | `OTP_MAX_ATTEMPTS` |
| AUTH-06 | Role not provided for new user | 400 | `VALIDATION_ERROR` |
| AUTH-06 | Role mismatch on re-login | 403 | `ROLE_MISMATCH` |
| AUTH-07 | Request after logout | 401 | `SESSION_INVALID` |
| AUTH-08 | Attempt to register as admin | 400 | `VALIDATION_ERROR` |
| USER-02 | Attempt to change role | 500* | `DB_TRIGGER_VIOLATION` |
| USER-04 | Login with inactive account | 403 | `ACCOUNT_INACTIVE` |
| PICKUP-01 | Invalid status transition | 409 | `INVALID_STATUS_TRANSITION` |
| PICKUP-02 | Duplicate pickup same date | 409 | `DUPLICATE_PICKUP_DATE` |
| PICKUP-03 | Past date for pickup | 400 | `VALIDATION_ERROR` |
| PICKUP-04 | Pickup > 7 days out | 400 | `VALIDATION_ERROR` |
| PICKUP-06 | Non-serviceable locality | 400 | `LOCALITY_NOT_SERVICEABLE` |
| PICKUP-07 | Cancel a completed pickup | 409 | `INVALID_STATUS_TRANSITION` |
| PICKUP-08 | Change address post-assignment | 409 | `PICKUP_LOCKED` |
| ASSIGN-02 | No eligible Kabadiwalas | — | Admin notified, status updated |
| ASSIGN-06 | Duplicate assignment for request | 500* | `DB_CONSTRAINT_VIOLATION` |
| ASSIGN-07 | All candidates > distance cap | — | Admin notified, status updated |
| PAY-03 | Attempt to change payment amount | 400 | `VALIDATION_ERROR` |
| PAY-04 | Confirm payment without UPI ref | 400 | `VALIDATION_ERROR` |
| PAY-05 | Kabadiwala confirms own payment | 403 | `FORBIDDEN` |
| PAY-06 | Invalid payment status transition | 409 | `INVALID_STATUS_TRANSITION` |
| PAY-07 | Actual weight > 5× estimated | 400 | `VALIDATION_ERROR` |
| RATE-03 | Set rate with past effective date | 400 | `VALIDATION_ERROR` |
| RATE-04 | Activate locality without rates | 400 | `MISSING_SCRAP_RATES` |
| KAB-01 | Assign to overloaded Kabadiwala | 409 | `KABADIWALA_OVERLOADED` |
| KAB-02 | Complete another's pickup | 403 | `FORBIDDEN` |
| DUP-04 | Complete already-completed pickup | 409 | `ALREADY_COMPLETED` |
| LEARN-01 | Run loop with < 30 samples | — | Loop skips, logs warning |
| LEARN-03 | Improvement < 5% | — | Weights rejected, admin notified |
| LEARN-04 | Loop disabled | — | Loop skips, logs info |
| ADMIN-02 | Manual assign without note | 400 | `VALIDATION_ERROR` |
| ADMIN-03 | Weights outside bounds | 400 | `VALIDATION_ERROR` |
| CONFIG-03 | Modify protected config key | 403 | `FORBIDDEN` |

*`500` responses marked with asterisk indicate the rule was not caught at the service layer — these represent bugs, not expected user errors. They should never occur in production if the service-layer rules are correctly implemented.

---

*End of Section 4: Business Rules*

*Next: Section 5 — API Contract (Endpoint list, request/response formats, auth requirements, error responses, naming conventions)*

---

**Document Version:** 1.0  
**Last Updated:** March 2026  
**Consistency:** All rules reference specific tables, columns, and constants established in Sections 1–3.  
Every rule is traceable to a schema constraint, a service method, or a middleware check.