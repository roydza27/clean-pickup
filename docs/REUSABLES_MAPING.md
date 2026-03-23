# Section 9: Reuse Component / Logic Mapping
## Waste Coordination & Recycling Management System
### India Pilot MVP

## 9.1 Status Mappings

### Pickup Status — Full Reference
```javascript
// shared/constants/pickupStatus.js
const PICKUP_STATUS = Object.freeze({
  REQUESTED:                  'requested',
  ASSIGNED:                   'assigned',
  IN_PROGRESS:                'in_progress',
  COMPLETED:                  'completed',
  FAILED:                     'failed',
  CANCELLED:                  'cancelled',
  UNASSIGNED_NO_AVAILABILITY: 'unassigned_no_availability',
});

// Display labels (frontend: packages/constants/statusLabels.js)
const PICKUP_STATUS_LABELS = {
  requested:                  'Pending',
  assigned:                   'Kabadiwala Assigned',
  in_progress:                'On the Way',
  completed:                  'Completed',
  failed:                     'Could Not Complete',
  cancelled:                  'Cancelled',
  unassigned_no_availability: 'Awaiting Availability',
};

// Display colors for StatusBadge component
const PICKUP_STATUS_COLORS = {
  requested:                  { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  assigned:                   { bg: 'bg-blue-100',   text: 'text-blue-800'   },
  in_progress:                { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  completed:                  { bg: 'bg-green-100',  text: 'text-green-800'  },
  failed:                     { bg: 'bg-red-100',    text: 'text-red-800'    },
  cancelled:                  { bg: 'bg-gray-100',   text: 'text-gray-600'   },
  unassigned_no_availability: { bg: 'bg-orange-100', text: 'text-orange-800' },
};

// Terminal states — no further transitions possible
const PICKUP_TERMINAL_STATES = ['completed', 'cancelled'];

// States that indicate a pickup is "active" (for dashboard display)
const PICKUP_ACTIVE_STATES   = ['requested', 'assigned', 'in_progress', 'unassigned_no_availability'];
```

### Valid Status Transitions Map
```javascript
// Used by both backend (assertValidTransition) and frontend (disable buttons)
const PICKUP_VALID_TRANSITIONS = {
  requested:                  ['assigned', 'unassigned_no_availability', 'cancelled'],
  assigned:                   ['in_progress', 'failed', 'cancelled'],
  in_progress:                ['completed', 'failed'],
  failed:                     ['assigned', 'cancelled'],
  unassigned_no_availability: ['assigned', 'cancelled'],
  completed:                  [],
  cancelled:                  [],
};

// Helper: is a specific transition allowed?
function canTransition(fromStatus, toStatus) {
  return (PICKUP_VALID_TRANSITIONS[fromStatus] ?? []).includes(toStatus);
}
```

### Payment Status Map
```javascript
const PAYMENT_STATUS = Object.freeze({
  PENDING:  'pending',
  PAID:     'paid',
  DISPUTED: 'disputed',
  CANCELLED:'cancelled',
});

const PAYMENT_STATUS_LABELS = {
  pending:   'Awaiting Payment',
  paid:      'Payment Confirmed',
  disputed:  'Under Review',
  cancelled: 'Cancelled',
};

const PAYMENT_STATUS_COLORS = {
  pending:   { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  paid:      { bg: 'bg-green-100',  text: 'text-green-800'  },
  disputed:  { bg: 'bg-red-100',    text: 'text-red-800'    },
  cancelled: { bg: 'bg-gray-100',   text: 'text-gray-600'   },
};

const PAYMENT_VALID_TRANSITIONS = {
  pending:   ['paid', 'disputed'],
  paid:      [],         // terminal
  disputed:  ['paid', 'cancelled'],
  cancelled: [],         // terminal
};
```

---

## 9.2 Role Mapping
```javascript
// shared/constants/roles.js
const ROLES = Object.freeze({
  CITIZEN:    'citizen',
  KABADIWALA: 'kabadiwala',
  ADMIN:      'admin',
});

// Which roles can create a pickup request?
const CAN_CREATE_PICKUP = [ROLES.CITIZEN];

// Which roles can complete a pickup?
const CAN_COMPLETE_PICKUP = [ROLES.KABADIWALA];

// Which roles can see all pickups (not just their own)?
const CAN_VIEW_ALL_PICKUPS = [ROLES.ADMIN];

// Which roles can set scrap rates?
const CAN_SET_RATES = [ROLES.ADMIN];

// Roles that have a locality-scoped view (vs. system-wide)
const LOCALITY_SCOPED_ROLES = [ROLES.CITIZEN, ROLES.KABADIWALA];
```

---

## 9.3 Waste Category Mapping
```javascript
// shared/constants/wasteCategory.js
const WASTE_CATEGORIES = Object.freeze({
  PLASTIC: 'plastic',
  PAPER:   'paper',
  METAL:   'metal',
});

// Frontend display config
const CATEGORY_CONFIG = {
  plastic: {
    label: 'Plastic',
    icon:  '♻️',
    color: 'text-blue-600',
    hint:  'Bottles, containers, packaging',
  },
  paper: {
    label: 'Paper',
    icon:  '📄',
    color: 'text-yellow-600',
    hint:  'Newspapers, cardboard, books',
  },
  metal: {
    label: 'Metal',
    icon:  '⚙️',
    color: 'text-gray-600',
    hint:  'Cans, utensils, appliances',
  },
};
```

---

## 9.4 Common Utility Functions

### Haversine Distance (Backend + Frontend)
```javascript
// shared/utils/haversine.js
// Returns distance in kilometres between two lat/lng coordinates
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

module.exports = { haversine };
```

### Phone Number Utilities
```javascript
// shared/utils/phoneUtils.js
function normalizePhone(input) {
  if (!input) throw new Error('Phone number required');
  const stripped = String(input).replace(/\s+/g, '').replace(/^(\+91|91|0)/, '');
  if (!/^\d{10}$/.test(stripped)) throw new Error(`Invalid phone number: ${input}`);
  return stripped;
}

function maskPhone(phone) {
  // "9876543210" → "98XXXXX210"
  if (!phone || phone.length !== 10) return phone;
  return phone.slice(0, 2) + 'XXXXX' + phone.slice(7);
}

module.exports = { normalizePhone, maskPhone };
```

### Date Utilities
```javascript
// shared/utils/dateUtils.js
const { format, addDays, isAfter, isBefore, parseISO } = require('date-fns');
const { zonedTimeToUtc, utcToZonedTime } = require('date-fns-tz');

const IST = 'Asia/Kolkata';

// Get current date in IST as YYYY-MM-DD string
function todayIST() {
  return format(utcToZonedTime(new Date(), IST), 'yyyy-MM-dd');
}

// Is date within allowed booking window?
function isBookableDate(dateStr) {
  const date = parseISO(dateStr);
  const today = parseISO(todayIST());
  const maxDate = addDays(today, 7);
  return !isBefore(date, today) && !isAfter(date, maxDate);
}

// Format ISO timestamp to IST display string
function formatDisplayIST(isoString) {
  const zoned = utcToZonedTime(new Date(isoString), IST);
  return format(zoned, 'dd MMM yyyy, hh:mm a');
}

// Is a kabadiwala's last known location still recent (< 4 hours)?
function isLocationRecent(lastLocationAt) {
  if (!lastLocationAt) return false;
  const ageMs = Date.now() - new Date(lastLocationAt).getTime();
  return ageMs < 4 * 60 * 60 * 1000;
}

module.exports = { todayIST, isBookableDate, formatDisplayIST, isLocationRecent };
```

### Pagination Utilities
```javascript
// shared/utils/paginationUtils.js
function parsePagination(query) {
  const page  = Math.max(1, parseInt(query.page  ?? '1',  10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function buildPaginationMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

module.exports = { parsePagination, buildPaginationMeta };
```

### Payment Calculation
```javascript
// shared/utils/paymentUtils.js

// Central formula — single source of truth
function calculatePaymentAmount(actualWeightKg, ratePerKg) {
  if (actualWeightKg <= 0) throw new Error('Weight must be positive');
  if (ratePerKg <= 0)      throw new Error('Rate must be positive');
  return parseFloat((actualWeightKg * ratePerKg).toFixed(2));
}

// Estimate for display before pickup (uses estimatedWeight)
function estimatePayment(estimatedWeightKg, ratePerKg) {
  return calculatePaymentAmount(estimatedWeightKg, ratePerKg);
}

module.exports = { calculatePaymentAmount, estimatePayment };
```

### Assignment Score Calculator (shared between engine and admin display)
```javascript
// shared/utils/assignmentUtils.js

function computeAssignmentScore(factors, weights) {
  const { distanceScore, workloadScore, reliabilityScore } = factors;
  const { wDistance, wWorkload, wReliability } = weights;

  return parseFloat(
    (
      wDistance    * distanceScore    +
      wWorkload    * workloadScore    +
      wReliability * reliabilityScore
    ).toFixed(6)
  );
}

function computeDistanceScore(distanceKm) {
  return 1 / (1 + distanceKm);
}

function computeWorkloadScore(currentAssignments, maxDailyPickups) {
  return (maxDailyPickups - currentAssignments) / maxDailyPickups;
}

module.exports = {
  computeAssignmentScore,
  computeDistanceScore,
  computeWorkloadScore,
};
```

---

## 9.5 Error Class Hierarchy
```javascript
// shared/errors/AppError.js — base class
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.name       = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode  = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// shared/errors/ValidationError.js
class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details; // [{ field, message }]
  }
}

// shared/errors/AuthError.js
class AuthError extends AppError {
  constructor(message, statusCode = 401) {
    const code = statusCode === 403 ? 'FORBIDDEN' : 'UNAUTHORIZED';
    super(message, statusCode, code);
  }
}

// shared/errors/NotFoundError.js
class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404, 'NOT_FOUND');
  }
}

// shared/errors/ConflictError.js
class ConflictError extends AppError {
  constructor(message, errorCode = 'CONFLICT') {
    super(message, 409, errorCode);
  }
}

// shared/errors/RateLimitError.js
class RateLimitError extends AppError {
  constructor(message, errorCode = 'RATE_LIMITED') {
    super(message, 429, errorCode);
  }
}
```

---

## 9.6 Shared Logic Patterns

### Service Method Pattern (consistent across all modules)
```javascript
// Every service method follows this structure:
async function doSomething(inputs) {
  // 1. Validate ownership / preconditions
  const entity = await queryOne('SELECT ...', [inputs.id]);
  if (!entity) throw new NotFoundError('Entity not found');
  if (entity.ownerId !== inputs.userId) throw new AuthError('Forbidden', 403);

  // 2. Apply business rule guards
  if (entity.status === 'completed') {
    throw new ConflictError('Cannot modify completed entity', 'ALREADY_COMPLETED');
  }

  // 3. Execute DB operation (transaction if multi-table)
  const result = await transaction(async (client) => {
    await client.query('UPDATE ...', [...]);
    await client.query('INSERT ...', [...]);
    return { ... };
  });

  // 4. Side effects outside transaction (notifications, cache invalidation)
  await notificationService.send(entity.userId, 'EVENT_TYPE', { ... });
  await cacheService.invalidate(`key:${inputs.id}`);

  // 5. Return domain object (not HTTP response)
  return result;
}
```

### Controller Method Pattern
```javascript
// Every controller method follows this structure:
async function handleSomething(req, res, next) {
  try {
    // 1. Extract validated inputs (validated by middleware already)
    const { id } = req.params;
    const { field1, field2 } = req.body;
    const { userId, role } = req.user;  // From JWT middleware

    // 2. Call service (one call only)
    const result = await someService.doSomething({ id, field1, field2, userId, role });

    // 3. Shape response
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);  // Always delegate to errorHandler
  }
}
```

### Redis Key Namespace Registry
```javascript
// shared/constants/redisKeys.js
// Central registry — prevents key collisions across modules
const REDIS_KEYS = {
  // Auth
  otp:             (phone)    => `otp:${phone}`,
  otpRequest:      (phone)    => `otp_req:${phone}`,
  otpFail:         (phone)    => `otp_fail:${phone}`,
  session:         (userId)   => `session:${userId}`,

  // Cache
  scrapRates:      (localityId) => `scrap_rates:${localityId}`,
  activeWeights:               => `active_weights`,
  systemConfig:    (key)       => `sys_config:${key}`,

  // Rate limiting
  rateLimitAuth:   (ip)       => `rate:auth:${ip}`,
  rateLimitApi:    (userId)   => `rate:api:${userId}`,
};

module.exports = { REDIS_KEYS };
```

---

*End of Sections 5–9*

---

**Document Version:** 1.0  
**Last Updated:** March 2026  
**Complete Documentation Set:**
- Section 1: System Architecture
- Section 2: Database Design
- Section 3: Component Structure
- Section 4: Business Rules
- Section 5: API Contract ✓
- Section 6: UI Flow ✓
- Section 7: Edge Cases ✓
- Section 8: Performance Considerations ✓
- Section 9: Reusable Mapping / Logic ✓

