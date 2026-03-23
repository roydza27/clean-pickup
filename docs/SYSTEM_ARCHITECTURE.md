# System Architecture Document
## Waste Coordination & Recycling Management System
### India Pilot MVP — Production Design

**Version:** 1.0  
**Audience:** Engineers, Architects, Investors, Academic Evaluators  
**Stack:** React · Node.js + Express · PostgreSQL  

---

## Table of Contents

1. [Architectural Philosophy](#1-architectural-philosophy)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Layer-by-Layer Breakdown](#3-layer-by-layer-breakdown)
4. [Request Flow](#4-request-flow)
5. [Role-Based Access Design](#5-role-based-access-design)
6. [Data Flow Diagrams](#6-data-flow-diagrams)
7. [Service Boundaries](#7-service-boundaries)
8. [Security Architecture](#8-security-architecture)
9. [Infrastructure Design](#9-infrastructure-design)
10. [Future Scalability Considerations](#10-future-scalability-considerations)

---

## 1. Architectural Philosophy

This system is a **logistics + coordination platform**, not a CRUD application. The architectural decisions reflect three non-negotiable principles:

### 1.1 Human-Centered Automation

The informal recycling ecosystem runs on human relationships and trust. Full automation would:

- Erode Kabadiwala agency and income predictability
- Remove contextual judgment from edge cases
- Create unexplainable black-box decisions

**Decision:** All system logic is deterministic and rule-based **except** one bounded learning component — the pickup assignment engine. Every other decision is transparent, overridable by admin, and auditable.

### 1.2 Bounded Intelligence

One learning component. One. Its scope is strictly limited to adjusting three factor weights in the assignment scoring function. It cannot touch pricing, user accounts, payment records, or any other domain.

**Why:** Allows academic validation of the learning component in isolation. If the system misbehaves, the blast radius is contained to assignment optimization, not the entire platform.

### 1.3 Progressive Scalability

The MVP is designed as a **modular monolith** — a single deployable unit organized into clearly bounded modules (Auth, Pickup, Assignment, Payment, Analytics). This deliberately avoids microservices overhead at MVP stage while preserving the ability to extract services later with minimal refactoring.

**Trade-off acknowledged:** A modular monolith is slower to scale individual components but far faster to develop, debug, and deploy for a 2–5 person team in an MVP phase.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT TIER                                      │
│                                                                              │
│   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────────┐   │
│   │  Citizen Web App │   │ Kabadiwala Web   │   │  Admin Dashboard     │   │
│   │  (React SPA)     │   │ App (React SPA)  │   │  (React SPA)         │   │
│   │                  │   │                  │   │                      │   │
│   │  - Pickup form   │   │  - Daily queue   │   │  - Analytics         │   │
│   │  - Tracking      │   │  - Route map     │   │  - Rate config       │   │
│   │  - Payment hist  │   │  - Earnings      │   │  - Assignment mgmt   │   │
│   └────────┬─────────┘   └────────┬─────────┘   └─────────┬────────────┘   │
└────────────┼──────────────────────┼─────────────────────────┼───────────────┘
             │                      │                         │
             │         HTTPS/TLS — All traffic encrypted      │
             │                      │                         │
             └──────────────────────┼─────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             API GATEWAY (Nginx)                              │
│                                                                              │
│   - TLS Termination          - Request Logging                               │
│   - Rate Limiting (IP)       - Gzip Compression                              │
│   - CORS Enforcement         - Static Asset Serving (React builds)           │
│   - Proxy → Express Server                                                   │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     APPLICATION SERVER (Node.js + Express)                   │
│                           [MODULAR MONOLITH]                                 │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Auth Module  │  │Pickup Module │  │Payment Module│  │ Admin Module │   │
│  │              │  │              │  │              │  │              │   │
│  │ OTP gen/val  │  │ Lifecycle    │  │ Calculation  │  │ Config mgmt  │   │
│  │ JWT sign/ver │  │ Status mgmt  │  │ Status track │  │ Analytics    │   │
│  │ Role binding │  │ Validation   │  │ History      │  │ Overrides    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────────────┐   │
│  │Locality/Rate │  │Notification  │  │  🧠 ASSIGNMENT ENGINE (ML)       │   │
│  │  Module      │  │  Module      │  │                                  │   │
│  │              │  │              │  │  - Factor scoring                │   │
│  │ Scrap rates  │  │ SMS dispatch │  │  - Gradient descent learning     │   │
│  │ Zone config  │  │ In-app notif │  │  - Weight update (bounded)       │   │
│  │ Schedules    │  │ Templates    │  │  - Performance validation        │   │
│  └──────────────┘  └──────────────┘  └─────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                  SHARED MIDDLEWARE LAYER                              │   │
│  │  authenticateToken · authorizeRole · validateRequest · errorHandler  │   │
│  │  requestLogger · rateLimiter · sanitizeInput                         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                       │
          ▼                      ▼                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────────┐
│  PostgreSQL 15   │  │   Redis 7        │  │  Object Storage (S3/GCS)     │
│  (Primary DB)    │  │   (Cache + Jobs) │  │                              │
│                  │  │                  │  │  - Pickup completion photos  │
│  - All entities  │  │  - Session cache │  │  - ID document uploads       │
│  - ACID txns     │  │  - OTP store     │  │  - Exported reports (CSV)    │
│  - Audit logs    │  │  - Rate limits   │  │                              │
│  - Read replica  │  │  - Job queues    │  │  CDN-backed for fast access  │
│    (analytics)   │  │  - Scrap rates   │  │                              │
└──────────────────┘  └──────────────────┘  └──────────────────────────────┘
          │
          ▼
┌──────────────────┐
│  PostgreSQL      │
│  Read Replica    │
│  (Analytics &    │
│  Reporting only) │
└──────────────────┘
```

### 2.1 Why This Topology

| Decision | Rationale |
|---|---|
| Modular monolith over microservices | Single deployment, simpler debugging, faster MVP iteration. Modules have clear boundaries for future extraction. |
| Nginx in front of Express | TLS termination, rate limiting, static file serving, and connection pooling — none of which Express should own. |
| Redis for OTP, not PostgreSQL only | OTP records are ephemeral (5-min TTL), high-write, zero-relation to domain data. Redis TTL is idiomatic for this. PostgreSQL is fallback persistence. |
| Read replica for analytics | Prevents analytics queries (aggregations, full-table scans) from locking or slowing down transactional writes. |
| S3/GCS for file storage | Application servers should never store files. Horizontal scaling becomes impossible if file state lives on disk. |

---

## 3. Layer-by-Layer Breakdown

### 3.1 Presentation Layer (React)

Three separate React SPAs sharing a common design system and API client library:

```
Client Apps
├── citizen-app/          ← Public-facing, mobile-first
├── kabadiwala-app/       ← Simplified UI, icon-heavy, low-bandwidth optimized
└── admin-app/            ← Desktop-optimized, data-dense dashboard
```

**Shared across all three:**
- `api/client.js` — Axios instance with JWT interceptor
- `hooks/useAuth.js` — Auth state + token refresh
- `components/ui/` — Button, Input, Modal, Toast (shared design tokens)
- `constants/` — Status enums, role constants, API base URLs

**Per-app state management:**
- React Context for auth state (lightweight, sufficient for MVP)
- React Query for server state (caching, background refetch, stale-while-revalidate)
- Local component state for UI-only concerns (form inputs, toggles)

**Performance considerations at client layer:**
- Code splitting by route (React.lazy + Suspense)
- Service worker for offline support on Kabadiwala app (critical given intermittent connectivity)
- Image lazy loading for pickup photo galleries
- Kabadiwala app targets 3G performance budget: < 150KB initial JS bundle

---

### 3.2 API Gateway Layer (Nginx)

```nginx
# Conceptual configuration
upstream express_app {
    server 127.0.0.1:4000;
    keepalive 64;
}

server {
    listen 443 ssl http2;
    
    # Rate limiting: 60 req/min per IP globally, 10 req/min for /auth
    limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=60r/m;
    
    location /api/auth/ {
        limit_req zone=auth burst=5 nodelay;
        proxy_pass http://express_app;
    }
    
    location /api/ {
        limit_req zone=api burst=20;
        proxy_pass http://express_app;
    }
    
    # Serve React builds as static files (no Express involved)
    location / {
        root /var/www/citizen-app;
        try_files $uri $uri/ /index.html;
    }
}
```

**Nginx owns:**
- TLS certificate management (Let's Encrypt via Certbot)
- IP-level rate limiting (auth endpoint has stricter limit)
- Gzip/Brotli compression
- Static asset caching headers
- WebSocket upgrade headers (for future real-time features)

**Nginx does NOT own:**
- Business-level rate limiting (that's Redis + Express middleware)
- JWT validation (that's Express middleware)
- Request logging at application level (Express Winston logger)

---

### 3.3 Application Layer (Node.js + Express)

The Express application follows a strict layered architecture:

```
src/
├── server.js                    ← Entry point, Express app bootstrap
├── config/
│   ├── database.js              ← PostgreSQL pool configuration
│   ├── redis.js                 ← Redis client configuration
│   └── env.js                   ← Validated env variables (zod schema)
│
├── middleware/
│   ├── authenticate.js          ← JWT verification, user context attachment
│   ├── authorize.js             ← Role-based access (citizenOnly, kabadiOnly, adminOnly)
│   ├── validateRequest.js       ← Zod schema validation per route
│   ├── rateLimiter.js           ← Redis-backed per-user rate limiting
│   ├── requestLogger.js         ← Winston structured logging
│   └── errorHandler.js          ← Centralized error normalization
│
├── modules/
│   ├── auth/
│   │   ├── auth.routes.js
│   │   ├── auth.controller.js
│   │   ├── auth.service.js      ← OTP generation, JWT signing, session creation
│   │   └── auth.validation.js   ← Zod schemas for auth payloads
│   │
│   ├── pickup/
│   │   ├── pickup.routes.js
│   │   ├── pickup.controller.js
│   │   ├── pickup.service.js    ← Lifecycle management, status transitions
│   │   └── pickup.validation.js
│   │
│   ├── assignment/
│   │   ├── assignment.routes.js
│   │   ├── assignment.controller.js
│   │   ├── assignment.service.js     ← Orchestrates AssignmentEngine
│   │   └── engine/
│   │       ├── AssignmentEngine.js   ← 🧠 Scoring + assignment logic
│   │       ├── LearningLoop.js       ← Weight update algorithm
│   │       └── weights.config.js     ← Current factor weights (DB-backed)
│   │
│   ├── payment/
│   │   ├── payment.routes.js
│   │   ├── payment.controller.js
│   │   └── payment.service.js    ← Calculation, status tracking, history
│   │
│   ├── locality/
│   │   ├── locality.routes.js
│   │   ├── locality.controller.js
│   │   └── locality.service.js   ← Scrap rates, zones, schedules
│   │
│   ├── notification/
│   │   ├── notification.service.js   ← SMS (MSG91/Twilio), in-app notifs
│   │   └── templates/
│   │       ├── sms.templates.js
│   │       └── notification.templates.js
│   │
│   ├── admin/
│   │   ├── admin.routes.js
│   │   ├── admin.controller.js
│   │   └── admin.service.js      ← Analytics queries, manual overrides
│   │
│   └── kabadiwala/
│       ├── kabadiwala.routes.js
│       ├── kabadiwala.controller.js
│       └── kabadiwala.service.js
│
├── shared/
│   ├── db/
│   │   └── queryBuilder.js       ← Parameterized query helpers (no raw string concat)
│   ├── errors/
│   │   ├── AppError.js           ← Base error class
│   │   ├── ValidationError.js
│   │   ├── AuthError.js
│   │   └── NotFoundError.js
│   ├── constants/
│   │   ├── pickup.status.js      ← Enum: requested|assigned|in_progress|completed|cancelled
│   │   ├── roles.js              ← Enum: citizen|kabadiwala|admin
│   │   └── payment.status.js    ← Enum: pending|paid|disputed
│   └── utils/
│       ├── dateUtils.js
│       ├── distanceUtils.js      ← Haversine formula for lat/lng distance
│       └── phoneUtils.js         ← Indian phone number normalization
│
└── jobs/
    ├── scheduler.js              ← node-cron job registration
    ├── learningLoop.job.js       ← Weekly weight update trigger
    └── stalePickup.job.js        ← Flag pickups stuck in assigned state > 24h
```

**Strict layer responsibilities:**

| Layer | Owns | Does NOT own |
|---|---|---|
| Controller | HTTP req/res, input extraction, response shaping | Business logic, DB queries |
| Service | Business rules, orchestration, domain logic | HTTP concerns, SQL |
| Engine (Assignment) | Algorithm, weight math, scoring | HTTP, DB transactions |
| Middleware | Cross-cutting concerns (auth, validation, logging) | Domain logic |
| Shared/DB | Query construction, parameter binding | Business rules |

---

### 3.4 Data Layer

**PostgreSQL 15** — primary transactional database.

Connection pooling via `pg` library:

```javascript
// config/database.js
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,               // Max pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false
});
```

All queries use parameterized statements. No string concatenation for SQL. Zero ORM — raw SQL with a lightweight query builder for parameter binding safety. This decision is intentional: ORMs abstract away PostgreSQL-specific performance features (partial indexes, CTEs, window functions) that this system will need as it scales.

**Redis 7** — cache + ephemeral state + job queue.

Key namespacing convention:
```
otp:{phoneNumber}         → "123456"  TTL: 300s
session:{userId}          → JWT payload JSON  TTL: 7 days
rate:auth:{ip}            → request count  TTL: 60s
rate:api:{userId}         → request count  TTL: 60s
scrap_rates:{localityId}  → JSON rates  TTL: 1 hour
```

---

## 4. Request Flow

### 4.1 Authenticated API Request (Standard Path)

```
Client (React)
    │
    │  1. Request with Authorization: Bearer <JWT>
    ▼
Nginx
    │  2. Rate limit check (IP-level)
    │  3. TLS termination
    │  4. Proxy to Express
    ▼
Express — Middleware Stack (executes in order)
    │
    │  5. requestLogger.js
    │     → Log: method, path, ip, user-agent, timestamp
    │
    │  6. authenticate.js
    │     → Extract token from Authorization header
    │     → jwt.verify(token, JWT_SECRET)
    │     → If invalid/expired → throw AuthError(401)
    │     → Fetch session from Redis: GET session:{userId}
    │     → If no session → throw AuthError(401) [token revoked]
    │     → Attach req.user = { userId, role, localityId }
    │
    │  7. validateRequest.js (route-specific Zod schema)
    │     → Parse and validate req.body / req.params / req.query
    │     → If invalid → throw ValidationError(400) with field-level errors
    │
    │  8. authorize.js (route-specific role check)
    │     → Check req.user.role against allowed roles for route
    │     → If unauthorized → throw AuthError(403)
    │
    │  9. rateLimiter.js (Redis-backed per-user)
    │     → INCR rate:api:{userId}  EXPIRE 60
    │     → If count > threshold → throw RateLimitError(429)
    │
    ▼
Controller
    │  10. Extract validated inputs from req.body / req.params
    │  11. Call service method with plain data (no req/res passed to service)
    │
    ▼
Service
    │  12. Apply business logic
    │  13. Execute DB queries (parameterized)
    │  14. Orchestrate cross-module calls if needed
    │  15. Return domain object
    │
    ▼
Controller
    │  16. Shape response: { success: true, data: {...} }
    │  17. res.status(200).json(response)
    │
    ▼
errorHandler.js (catches any thrown error)
    │  → Normalize error to: { success: false, error: { code, message, details? } }
    │  → Log full stack trace (Winston)
    │  → Send sanitized response (no stack trace in production)
```

### 4.2 OTP Authentication Flow

```
1. POST /api/auth/send-otp { phoneNumber }
   │
   ├── Validate: 10-digit Indian phone number (Zod)
   ├── Check rate limit: max 5 OTPs per phone per hour
   │   → Redis: INCR otp_req:{phoneNumber}  EXPIRE 3600
   │   → If > 5 → 429 Too Many Requests
   ├── Generate 6-digit OTP (crypto.randomInt, NOT Math.random)
   ├── Store in Redis: SET otp:{phoneNumber} {hash} EX 300
   │   → Hash with bcrypt (rounds=8, faster than login bcrypt)
   │   → NOT stored in PostgreSQL (ephemeral by design)
   ├── Send via SMS gateway (MSG91/Twilio)
   │   → If SMS fails → log error, return success anyway
   │     (OTP shown in dev console only; prevents enumeration attacks)
   └── Response: { success: true, message: "OTP sent" }
       → In development ONLY: include otp in response for testing

2. POST /api/auth/verify-otp { phoneNumber, otp, role }
   │
   ├── Validate inputs (Zod)
   ├── Check failed attempt count:
   │   → Redis: GET otp_fail:{phoneNumber}
   │   → If >= 5 → 429 (brute-force protection)
   ├── Fetch hashed OTP: Redis GET otp:{phoneNumber}
   │   → If null → 400 "OTP expired or not found"
   ├── bcrypt.compare(providedOtp, storedHash)
   │   → If mismatch:
   │       INCR otp_fail:{phoneNumber}  EXPIRE 900
   │       → 400 "Invalid OTP"
   ├── Delete OTP from Redis (single-use enforcement)
   │   → DEL otp:{phoneNumber}
   │   → DEL otp_fail:{phoneNumber}
   ├── Upsert user in PostgreSQL:
   │   → SELECT * FROM users WHERE phone_number = $1
   │   → If not found: INSERT (new user, role assigned here)
   │   → If found: role validated against stored role (role immutability)
   ├── Create/refresh profile for role (citizen_profiles / kabadiwala_profiles)
   ├── Sign JWT: { userId, role, localityId }  expires 7 days
   ├── Store session in Redis: SET session:{userId} {payload} EX 604800
   └── Response: { success: true, token, user: { userId, name, role } }
```

### 4.3 Pickup Assignment Flow (Core Logic Path)

```
POST /api/pickups/request (Citizen)
    │
    ▼
pickup.service.createPickupRequest()
    │  → Validate locality is serviceable
    │  → Validate preferred_date is a future date (not past)
    │  → Validate preferred_date is not > 7 days out (business rule)
    │  → Validate no duplicate pending request from same citizen, same date
    │  → BEGIN TRANSACTION
    │     → INSERT INTO pickup_requests (status = 'requested')
    │     → COMMIT
    │  → Return requestId
    │
    ▼ (async, does not block citizen response)
assignment.service.triggerAutoAssignment(requestId)
    │
    ▼
AssignmentEngine.findBestKabadiwala(requestId)
    │
    ├── Fetch pickup details (locality, preferred_date, category)
    ├── Fetch available Kabadiwalas:
    │   SELECT kp.*, up.name
    │   FROM kabadiwala_profiles kp
    │   JOIN users up ON kp.user_id = up.id
    │   WHERE kp.service_locality_id = $1
    │   AND kp.is_available = true
    │   AND kp.user_id NOT IN (
    │       -- Exclude those already at max daily workload
    │       SELECT kabadiwala_id FROM pickup_assignments
    │       WHERE assigned_date = $2
    │       GROUP BY kabadiwala_id
    │       HAVING COUNT(*) >= 10
    │   )
    │
    ├── For each candidate Kabadiwala, compute score:
    │
    │   distance_score = 1 / (1 + haversine(kabadiwala.lat, kabadiwala.lng,
    │                                        pickup.lat, pickup.lng))
    │
    │   current_assignments = COUNT of assignments for today
    │   workload_score = (MAX_DAILY - current_assignments) / MAX_DAILY
    │
    │   completed = kabadiwala.completed_pickups
    │   total = kabadiwala.total_pickups
    │   reliability_score = completed / MAX(total, 1)
    │
    │   [w_d, w_w, w_r] = weights fetched from weight_configurations table
    │   (current active weights, updated by learning loop)
    │
    │   total_score = (w_d × distance_score) +
    │                 (w_w × workload_score) +
    │                 (w_r × reliability_score)
    │
    ├── Sort candidates by total_score DESC
    ├── Select candidate[0] (highest score)
    │
    ├── If no candidates available:
    │   → Update pickup status = 'unassigned_no_availability'
    │   → Notify admin via in-app notification
    │   → Log for admin manual assignment queue
    │   → Return gracefully (no failure thrown)
    │
    ├── BEGIN TRANSACTION
    │   → INSERT INTO pickup_assignments (request_id, kabadiwala_id, status='assigned')
    │   → UPDATE pickup_requests SET status = 'assigned'
    │   → UPDATE kabadiwala_profiles SET total_pickups = total_pickups + 1
    │   → COMMIT
    │
    └── notification.service.send(kabadiwalId, 'NEW_PICKUP_ASSIGNED')
        notification.service.send(citizenId, 'PICKUP_ASSIGNED')
```

---

## 5. Role-Based Access Design

### 5.1 Role Hierarchy

```
System
├── ADMIN          ← Full access. Can see and override everything.
│   ├── KABADIWALA ← Own data + assigned pickups only.
│   └── CITIZEN    ← Own data + public data only.
```

Roles are **immutable after assignment**. A user's role is set at first login and cannot be changed through any API endpoint. Only a database administrator can change roles via direct DB access, and this creates an audit log entry.

### 5.2 Access Control Matrix

| Resource | Citizen | Kabadiwala | Admin |
|---|:---:|:---:|:---:|
| Own profile (read/write) | ✅ | ✅ | ✅ |
| Other users' profiles | ❌ | ❌ | ✅ |
| Scrap rates (read) | ✅ | ✅ | ✅ |
| Scrap rates (write) | ❌ | ❌ | ✅ |
| Create pickup request | ✅ | ❌ | ❌ |
| View own pickup requests | ✅ | ❌ | ❌ |
| View assigned pickups | ❌ | ✅ | ❌ |
| Complete pickup | ❌ | ✅ | ❌ |
| Manual pickup assignment | ❌ | ❌ | ✅ |
| Override assignment | ❌ | ❌ | ✅ |
| Manage localities | ❌ | ❌ | ✅ |
| View analytics | ❌ | ❌ | ✅ |
| View learning weights | ❌ | ❌ | ✅ |
| Adjust learning weights | ❌ | ❌ | ✅ |
| View garbage schedules | ✅ | ❌ | ✅ |
| Report missed garbage | ✅ | ❌ | ❌ |
| Payment history (own) | ✅ | ✅ | ❌ |
| All payment history | ❌ | ❌ | ✅ |
| Update payment status | ✅ (own) | ✅ (own) | ✅ (all) |

### 5.3 Middleware Implementation

```javascript
// middleware/authorize.js

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AuthError('Authentication required', 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthError(
        `Role '${req.user.role}' is not authorized for this action`,
        403
      );
    }
    next();
  };
};

// Usage in routes:
router.post('/request',
  authenticate,
  authorizeRole('citizen'),       // ← Only citizens
  validateRequest(pickupSchema),
  pickupController.createRequest
);

router.post('/complete-pickup',
  authenticate,
  authorizeRole('kabadiwala'),     // ← Only kabadiwalas
  validateRequest(completeSchema),
  kabadiController.completePickup
);

router.get('/analytics',
  authenticate,
  authorizeRole('admin'),          // ← Only admin
  adminController.getAnalytics
);
```

### 5.4 Data Ownership Enforcement

Role-based access alone is insufficient — a citizen must only see **their own** pickups, not other citizens' pickups even if they somehow have a valid citizen token.

This is enforced at the **service layer**, not just the route layer:

```javascript
// pickup.service.js
async getMyPickupRequests(userId, role) {
  if (role !== 'citizen') throw new AuthError('Forbidden', 403);

  // userId is from req.user (JWT payload, not user-supplied)
  // Never accept userId from req.body or req.params for ownership queries
  const query = `
    SELECT pr.*, pa.kabadiwala_id, u.name as kabadiwala_name
    FROM pickup_requests pr
    LEFT JOIN pickup_assignments pa ON pr.id = pa.request_id
    LEFT JOIN users u ON pa.kabadiwala_id = u.id
    WHERE pr.citizen_id = $1    -- ← Bound to authenticated user's ID
    ORDER BY pr.created_at DESC
  `;
  return db.query(query, [userId]);
}
```

**Rule:** `userId` used in ownership-scoped queries is **always** sourced from `req.user.userId` (set by JWT middleware), never from request input.

---

## 6. Data Flow Diagrams

### 6.1 System State Machine — Pickup Lifecycle

```
                            [CITIZEN SUBMITS]
                                    │
                                    ▼
                           ┌──────────────┐
                           │  requested   │
                           └──────┬───────┘
                                  │
                    ┌─────────────┴──────────────────┐
                    │                                 │
                    │ Auto-assignment succeeds         │ No Kabadiwala available
                    ▼                                 ▼
             ┌────────────┐                 ┌──────────────────────┐
             │  assigned  │                 │ unassigned_no_avail  │
             └─────┬──────┘                 └──────────┬───────────┘
                   │                                   │
                   │                       Admin manually assigns
                   │                                   │
                   │◄──────────────────────────────────┘
                   │
                   │ Kabadiwala starts
                   ▼
           ┌─────────────────┐
           │   in_progress   │
           └────────┬────────┘
                    │
          ┌─────────┴──────────────────────┐
          │                                │
          │ Kabadiwala completes             │ Kabadiwala marks failed
          ▼                                ▼
   ┌─────────────┐                 ┌─────────────────┐
   │  completed  │                 │     failed      │
   └─────────────┘                 └────────┬────────┘
                                            │
                                   Admin reviews
                                            │
                               ┌────────────┴───────────┐
                               │                        │
                               ▼                        ▼
                        ┌────────────┐          ┌─────────────┐
                        │ reassigned │          │  cancelled  │
                        └────────────┘          └─────────────┘
```

**Invalid transitions are enforced at the database level (CHECK constraint) AND at the service layer (state machine validation).**

### 6.2 Payment State Machine

```
   [Pickup completed by Kabadiwala]
               │
               ▼ (auto-created)
        ┌────────────┐
        │  pending   │
        └─────┬──────┘
              │
    ┌─────────┴──────────────────────┐
    │                                │
    │ Citizen confirms payment         │ Dispute raised
    ▼                                ▼
┌──────────┐                  ┌────────────┐
│   paid   │                  │  disputed  │
└──────────┘                  └─────┬──────┘
                                    │
                              Admin resolves
                                    │
                        ┌───────────┴──────────┐
                        │                      │
                        ▼                      ▼
                  ┌──────────┐          ┌────────────┐
                  │   paid   │          │  cancelled │
                  └──────────┘          └────────────┘
```

### 6.3 Learning Loop Data Flow

```
TRIGGER: node-cron (every Sunday 2 AM IST)
    │
    ▼
LearningLoop.run()
    │
    ├── 1. FETCH FEEDBACK DATA
    │      SELECT lf.*, pa.factors_snapshot, pa.weights_snapshot
    │      FROM learning_feedback lf
    │      JOIN pickup_assignments pa ON lf.assignment_id = pa.id
    │      WHERE lf.created_at >= NOW() - INTERVAL '7 days'
    │      AND lf.processed = false
    │
    ├── 2. SCORE EACH OUTCOME
    │      completed_on_time AND rating >= 3.5  →  outcome_score = +1.0
    │      completed_late OR rating < 3.5       →  outcome_score = +0.5
    │      not_completed                        →  outcome_score = -1.0
    │
    ├── 3. COMPUTE GRADIENT FOR EACH WEIGHT
    │      For weight w_distance:
    │        gradient = α × Σ(outcome_score_i × distance_factor_i) / N
    │        where α = 0.05 (learning rate, configurable)
    │
    │      For weight w_workload:
    │        gradient = α × Σ(outcome_score_i × workload_factor_i) / N
    │
    │      For weight w_reliability:
    │        gradient = α × Σ(outcome_score_i × reliability_factor_i) / N
    │
    ├── 4. UPDATE WEIGHTS
    │      w_d_new = CLAMP(w_d_old + gradient_d, 0.10, 0.60)
    │      w_w_new = CLAMP(w_w_old + gradient_w, 0.10, 0.60)
    │      w_r_new = CLAMP(w_r_old + gradient_r, 0.10, 0.60)
    │
    │      Normalize: total = w_d + w_w + w_r
    │      w_d_norm = w_d_new / total  (etc.)
    │
    ├── 5. VALIDATE IMPROVEMENT
    │      Simulate assignments from past 7 days with new weights
    │      Compare simulated success_rate vs. actual success_rate
    │      IF improvement < 5% → REJECT new weights (keep current)
    │      IF improvement >= 5% → ACCEPT new weights
    │
    ├── 6. PERSIST IF ACCEPTED
    │      INSERT INTO weight_configurations
    │        (w_distance, w_workload, w_reliability, is_active, reason, metrics_snapshot)
    │      UPDATE weight_configurations SET is_active = false
    │        WHERE id != new_config_id  (deactivate old)
    │
    ├── 7. MARK FEEDBACK AS PROCESSED
    │      UPDATE learning_feedback SET processed = true
    │        WHERE created_at <= NOW() - INTERVAL '7 days'
    │
    └── 8. NOTIFY ADMIN
           INSERT INTO notifications (type='WEIGHTS_UPDATED', payload={...})
```

**Guard rails on the learning loop:**

- Weights are bounded: each weight is always between 0.10 and 0.60
- Weights always sum to 1.0 (normalized after update)
- New weights only take effect if simulated performance improves by ≥ 5%
- Every weight update is audited in `weight_configurations` with a `metrics_snapshot`
- Admin can manually override weights through the admin dashboard
- Admin can disable the learning loop entirely via a system configuration flag

---

## 7. Service Boundaries

### 7.1 Module Dependency Map

```
HTTP Request
     │
     ▼
[Route Layer]
     │
     ▼
[Controller] ──────────────────────────────────┐
     │                                         │
     ▼                                         ▼
[Service]                              [Middleware Layer]
     │                                  authenticate.js
     ├──► pickup.service                 authorize.js
     ├──► payment.service                validate.js
     ├──► assignment.service             rateLimit.js
     ├──► notification.service
     └──► locality.service
               │
               ▼
     [Shared DB Layer]
     db.query(sql, params)
               │
               ▼
       [PostgreSQL Pool]
```

### 7.2 Cross-Module Communication Rules

Services communicate with other services **only through direct function calls**, never through HTTP calls (since this is a monolith). This is the contract:

```
pickup.service  ──calls──►  assignment.service.triggerAutoAssignment()
pickup.service  ──calls──►  notification.service.send()
assignment.service  ──calls──►  notification.service.send()
payment.service  ──calls──►  notification.service.send()
kabadiwala.service  ──calls──►  payment.service.createPaymentRecord()
```

**Strict prohibition:** Services do **not** import controllers. Controllers do **not** import other controllers. The dependency arrow is strictly downward: Route → Controller → Service → DB.

### 7.3 Assignment Engine Boundary

The AssignmentEngine is the only module with complex internal logic. Its boundary is explicit:

```javascript
// assignment/engine/AssignmentEngine.js

class AssignmentEngine {
  // PUBLIC API (used by assignment.service.js)
  async findBestKabadiwala(requestId)   → { kabadiwalId, score, factors }
  async getScores(requestId)            → [{ kabadiwalId, score, breakdown }]

  // PRIVATE (not exported)
  _computeDistanceScore(k, pickup)
  _computeWorkloadScore(k, date)
  _computeReliabilityScore(k)
  _fetchCurrentWeights()
}

// LearningLoop.js (separate class, same module)
class LearningLoop {
  async run()                           → { accepted: bool, improvement: float }
  async simulate(weights, pickups)      → success_rate
}
```

**The learning loop runs asynchronously via a job scheduler. It never runs inline with a request.**

---

## 8. Security Architecture

### 8.1 Authentication Security

| Threat | Mitigation |
|---|---|
| OTP brute force | Max 5 attempts → 15-min lockout. Redis INCR with TTL. |
| OTP replay | OTP deleted from Redis immediately after successful verification. |
| OTP enumeration | Same response regardless of whether phone exists or not. |
| JWT forgery | HS256 signature with 64-byte secret. Secret in env variable, never in code. |
| JWT hijacking | Short-lived access tokens (7 days). Session invalidation via Redis. |
| Privilege escalation | Role is embedded in JWT, sourced from DB at login time, not user input. |
| Role tampering via API | All role-change endpoints are absent from the API. No endpoint allows role modification. |

### 8.2 Data Security

- All passwords: bcrypt with minimum 10 rounds
- All OTPs: bcrypt with 8 rounds (performance-tuned for ephemeral data)
- Database credentials: Environment variables only, never in source code
- SQL injection: Parameterized queries throughout, no string concatenation in SQL
- XSS: Content-Security-Policy header, React's built-in HTML escaping
- Sensitive fields: Phone numbers partially masked in non-admin API responses
- PII in logs: Phone numbers and user IDs are **never** logged in full — truncated or hashed

### 8.3 API Security

- HTTPS enforced at Nginx layer (HTTP → 301 redirect to HTTPS)
- CORS restricted to known frontend origins (not `*` in production)
- Rate limiting at both Nginx (IP-level) and Express (user-level)
- Helmet.js for security headers (HSTS, X-Frame-Options, X-Content-Type-Options)
- Input validation via Zod schemas on every endpoint before controller execution
- File uploads: type whitelist (JPEG, PNG only), size limit (5MB), stored to S3 not local disk

---

## 9. Infrastructure Design

### 9.1 MVP Production Infrastructure

```
Internet
    │
    ▼
[Cloudflare] ← DDoS protection, DNS, CDN for static assets
    │
    ▼
[Load Balancer] (e.g., AWS ALB / DigitalOcean LB)
    │
    ├──────────────────────────────────────┐
    ▼                                      ▼
[App Server 1]                       [App Server 2]
Node.js + Nginx                      Node.js + Nginx
(Active)                             (Active or Standby)
    │
    ├──────────────────────────────────────┐
    ▼                                      ▼
[PostgreSQL Primary]             [PostgreSQL Read Replica]
(Writes + Transactional reads)   (Analytics queries only)
    │
    ▼
[Redis Cluster] ← Session, OTP, cache, job queues
    │
    ▼
[S3 / GCS] ← File storage (CDN-served)
```

### 9.2 Environment Configuration

| Environment | Purpose | Differences from Production |
|---|---|---|
| Local (dev) | Developer machines | OTP logged to console, no SMS, local PG + Redis |
| Staging | Pre-release testing | Full stack, fake SMS provider, seeded test data |
| Production | Live system | Real SMS, SSL, replica DB, monitoring active |

### 9.3 Observability Stack

| Layer | Tool | Purpose |
|---|---|---|
| Application logs | Winston → stdout → CloudWatch/Loki | Structured JSON logs, queryable |
| Error tracking | Sentry | Real-time error alerts, stack traces |
| Performance monitoring | Prometheus + Grafana | API latency, DB query time, Redis hit rate |
| Uptime monitoring | Pingdom / Better Uptime | Availability alerting, SLA tracking |
| Database monitoring | pgBadger + pg_stat_statements | Slow query identification |

---

## 10. Future Scalability Considerations

### 10.1 Module → Microservice Extraction Path

When any single module exceeds a defined load threshold or development velocity demands, it can be extracted to a microservice with minimal code changes — because the module boundaries are already clean:

```
Phase 1 (MVP): Single deployable Node.js app
Phase 2:       Extract Assignment Engine as separate service
               (High compute, independent scaling, ML model hosting)
Phase 3:       Extract Notification Service
               (High volume, message queue integration)
Phase 4:       Extract Analytics Service
               (Heavy read workload, separate DB, potential OLAP store)
```

### 10.2 Database Scaling Path

| Volume | Strategy |
|---|---|
| < 100K pickups | Single PostgreSQL instance + 1 read replica |
| 100K–1M pickups | Partition `pickup_requests` by locality_id + date range |
| 1M+ pickups | Shard by locality cluster (geography-based sharding) |
| Analytics at scale | Migrate analytics queries to TimescaleDB or ClickHouse |

### 10.3 Multi-City Expansion

The schema is designed locality-first, not city-first. Adding a new city requires:

1. `INSERT INTO localities (name, city, state, pincode, is_serviceable=true)`
2. `INSERT INTO scrap_rates` for new locality
3. Admin user creation for new city
4. Kabadiwala onboarding in new locality

No code changes required. The system is configuration-driven for geographic expansion.

### 10.4 Learning Component Scaling

As pickup volume grows, the learning loop can be enhanced:

| Volume | Enhancement |
|---|---|
| < 1K pickups/month | Current gradient descent on weekly batch |
| 1K–10K pickups/month | Move to daily batch updates, add more features (weather, time-of-day) |
| 10K+ pickups/month | Per-locality weight models (Koramangala Kabadiwalas may behave differently from Whitefield) |
| 100K+ pickups/month | Online learning, real-time weight adjustments |

The learning component is deliberately kept simple for MVP. The architecture supports this evolutionary path without requiring structural changes.

### 10.5 Key Architectural Constraints to Preserve

Regardless of how the system evolves, these constraints must be maintained:

1. **Role immutability** — A user's role cannot change after signup. This is a trust and security guarantee.
2. **Assignment engine isolation** — The learning component must never have direct write access to pickup_requests or payment_records. It only writes to assignment-related tables.
3. **Audit trail** — Every status transition in pickup_requests and payment_records must generate an audit log entry. This is non-negotiable for dispute resolution.
4. **Admin override capability** — Any decision made by automated systems (assignment engine, learning loop) must be overridable by an admin with a documented reason.
5. **Parameterized queries** — As the system grows and more engineers contribute, the zero-string-concatenation-in-SQL rule must be enforced via linting (eslint-plugin-sql).

---

*End of Section 1: System Architecture*

*Next: Section 2 — Database Design (Entity Relationship, Table Breakdown, Indexing Strategy)*

---

**Document Version:** 1.0  
**Last Updated:** March 2026  
**Status:** Final — MVP Design