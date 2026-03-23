# Section 3: Component Structure
## Waste Coordination & Recycling Management System
### India Pilot MVP — Node.js + Express + React

**Consistency Note:** All structure decisions are downstream of Section 1 (Architecture) and Section 2 (Database Design).  
Every file listed here has a defined responsibility. No file does two jobs.

---

## Table of Contents

1. [Design Principles for Structure](#1-design-principles-for-structure)
2. [Backend: Full Folder Structure](#2-backend-full-folder-structure)
3. [Backend: Layer-by-Layer Responsibilities](#3-backend-layer-by-layer-responsibilities)
4. [Backend: Module Deep Dives](#4-backend-module-deep-dives)
5. [Frontend: Application Architecture](#5-frontend-application-architecture)
6. [Frontend: Full Folder Structure](#6-frontend-full-folder-structure)
7. [Frontend: Layer-by-Layer Responsibilities](#7-frontend-layer-by-layer-responsibilities)
8. [Frontend: State Management Design](#8-frontend-state-management-design)
9. [Shared Contracts Between Frontend and Backend](#9-shared-contracts-between-frontend-and-backend)
10. [Inter-Module Dependency Rules](#10-inter-module-dependency-rules)

---

## 1. Design Principles for Structure

Before the file tree, the rules that govern it.

### 1.1 Vertical Slicing, Not Horizontal Layering

The backend is organized by **feature module**, not by layer.

```
❌ HORIZONTAL (rejected):
src/
  controllers/
    auth.controller.js
    pickup.controller.js
    payment.controller.js
  services/
    auth.service.js
    pickup.service.js
  models/
    user.model.js
    pickup.model.js

✅ VERTICAL (adopted):
src/
  modules/
    auth/
      auth.controller.js
      auth.service.js
      auth.routes.js
      auth.validation.js
    pickup/
      pickup.controller.js
      pickup.service.js
      pickup.routes.js
      pickup.validation.js
```

**Why vertical slicing:**
- A developer working on pickup logic touches one folder, not four
- Module boundaries map to the service boundaries defined in Section 1
- Each module can be extracted to a microservice in the future by moving one folder
- New engineers onboard faster — "everything about pickups is in `/modules/pickup`"

### 1.2 Single Responsibility Per File

Every file has one job that can be stated in one sentence.

- `auth.service.js` — executes auth business logic
- `auth.controller.js` — translates HTTP requests into service calls
- `auth.routes.js` — declares routes and their middleware chain
- `auth.validation.js` — defines Zod schemas for auth request payloads

If you cannot describe a file's job in one sentence, it needs to be split.

### 1.3 Dependency Direction is One-Way

```
Routes → Controller → Service → DB Layer
                    ↘
                  Other Services (via direct function call)
                    ↘
                  Shared Utilities
```

- Controllers never import other controllers
- Services never import controllers
- DB layer never imports services
- Middleware never contains business logic

Violations of this rule are architecture bugs, treated as such.

### 1.4 No Business Logic in Controllers

Controllers do exactly three things:
1. Extract validated inputs from `req`
2. Call one service method
3. Shape and send the response

Any `if` statement in a controller that is about business rules — not HTTP concerns — belongs in the service.

### 1.5 No HTTP Concerns in Services

Services never touch `req`, `res`, or `next`. They receive plain data objects and return plain data objects. This makes services testable in isolation without spinning up an HTTP server.

---

## 2. Backend: Full Folder Structure

```
waste-management-backend/
│
├── package.json
├── package-lock.json
├── .env                          ← Local only, git-ignored
├── .env.example                  ← Committed to repo, all keys with placeholder values
├── .eslintrc.js
├── .prettierrc
├── jest.config.js
├── nodemon.json
│
├── src/
│   │
│   ├── server.js                 ← Express app factory (does NOT call listen())
│   ├── index.js                  ← Entry point: imports server.js, calls listen()
│   │                               Separation allows server.js to be imported
│   │                               by tests without binding to a port
│   │
│   ├── config/
│   │   ├── env.js                ← Parses and validates all env vars via Zod
│   │   │                           Throws on startup if required vars are missing
│   │   ├── database.js           ← PostgreSQL pool: singleton, exported
│   │   ├── redis.js              ← Redis client: singleton, exported
│   │   └── storage.js            ← S3/GCS client config for file uploads
│   │
│   ├── middleware/
│   │   ├── authenticate.js       ← Verifies JWT, attaches req.user
│   │   ├── authorize.js          ← Role check factory: authorizeRole('citizen')
│   │   ├── validateRequest.js    ← Zod schema runner: validateRequest(schema)
│   │   ├── rateLimiter.js        ← Redis-backed per-user + per-IP rate limiting
│   │   ├── requestLogger.js      ← Winston structured request logging
│   │   ├── errorHandler.js       ← Centralized error → HTTP response mapping
│   │   └── sanitize.js           ← Strip HTML tags from string inputs (XSS defence)
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.validation.js
│   │   │
│   │   ├── pickup/
│   │   │   ├── pickup.routes.js
│   │   │   ├── pickup.controller.js
│   │   │   ├── pickup.service.js
│   │   │   └── pickup.validation.js
│   │   │
│   │   ├── assignment/
│   │   │   ├── assignment.routes.js
│   │   │   ├── assignment.controller.js
│   │   │   ├── assignment.service.js
│   │   │   └── engine/
│   │   │       ├── AssignmentEngine.js   ← Scoring + candidate selection
│   │   │       ├── LearningLoop.js       ← Weight update algorithm
│   │   │       └── weightConfig.js       ← Fetches active weights from DB + Redis cache
│   │   │
│   │   ├── payment/
│   │   │   ├── payment.routes.js
│   │   │   ├── payment.controller.js
│   │   │   ├── payment.service.js
│   │   │   └── payment.validation.js
│   │   │
│   │   ├── locality/
│   │   │   ├── locality.routes.js
│   │   │   ├── locality.controller.js
│   │   │   ├── locality.service.js
│   │   │   └── locality.validation.js
│   │   │
│   │   ├── kabadiwala/
│   │   │   ├── kabadiwala.routes.js
│   │   │   ├── kabadiwala.controller.js
│   │   │   ├── kabadiwala.service.js
│   │   │   └── kabadiwala.validation.js
│   │   │
│   │   ├── citizen/
│   │   │   ├── citizen.routes.js
│   │   │   ├── citizen.controller.js
│   │   │   ├── citizen.service.js
│   │   │   └── citizen.validation.js
│   │   │
│   │   ├── admin/
│   │   │   ├── admin.routes.js
│   │   │   ├── admin.controller.js
│   │   │   ├── admin.service.js
│   │   │   └── admin.validation.js
│   │   │
│   │   ├── notification/
│   │   │   ├── notification.service.js   ← No routes: called by other services
│   │   │   ├── providers/
│   │   │   │   ├── sms.provider.js       ← MSG91 / Twilio abstraction
│   │   │   │   └── inapp.provider.js     ← Writes to notifications table
│   │   │   └── templates/
│   │   │       ├── sms.templates.js
│   │   │       └── inapp.templates.js
│   │   │
│   │   └── garbage/
│   │       ├── garbage.routes.js
│   │       ├── garbage.controller.js
│   │       ├── garbage.service.js
│   │       └── garbage.validation.js
│   │
│   ├── shared/
│   │   │
│   │   ├── db/
│   │   │   ├── index.js           ← Exports: query(), transaction(), queryOne()
│   │   │   └── migrations/        ← Ordered SQL migration files
│   │   │       ├── 001_create_enums.sql
│   │   │       ├── 002_create_localities.sql
│   │   │       ├── 003_create_users.sql
│   │   │       ├── 004_create_profiles.sql
│   │   │       ├── 005_create_scrap_rates.sql
│   │   │       ├── 006_create_pickup_requests.sql
│   │   │       ├── 007_create_pickup_assignments.sql
│   │   │       ├── 008_create_status_history.sql
│   │   │       ├── 009_create_payment_records.sql
│   │   │       ├── 010_create_learning_tables.sql
│   │   │       ├── 011_create_operational_tables.sql
│   │   │       └── 012_seed_data.sql
│   │   │
│   │   ├── errors/
│   │   │   ├── AppError.js        ← Base class: message, statusCode, errorCode
│   │   │   ├── ValidationError.js ← 400 with field-level detail array
│   │   │   ├── AuthError.js       ← 401 / 403
│   │   │   ├── NotFoundError.js   ← 404
│   │   │   ├── ConflictError.js   ← 409 (duplicate request, duplicate OTP, etc.)
│   │   │   └── RateLimitError.js  ← 429
│   │   │
│   │   ├── constants/
│   │   │   ├── pickupStatus.js    ← Object.freeze({ REQUESTED: 'requested', ... })
│   │   │   ├── assignmentStatus.js
│   │   │   ├── paymentStatus.js
│   │   │   ├── roles.js           ← Object.freeze({ CITIZEN, KABADIWALA, ADMIN })
│   │   │   ├── wasteCategory.js
│   │   │   └── timeSlot.js
│   │   │
│   │   └── utils/
│   │       ├── haversine.js       ← Distance between two lat/lng coordinates (km)
│   │       ├── phoneUtils.js      ← Normalize, validate Indian phone numbers
│   │       ├── dateUtils.js       ← isWeekday, isWithinDays, formatIST, etc.
│   │       ├── paginationUtils.js ← Parse page/limit, build offset query helpers
│   │       ├── hashIds.js         ← Encode/decode BIGINT IDs for API exposure
│   │       └── logger.js          ← Winston logger instance (imported everywhere)
│   │
│   └── jobs/
│       ├── scheduler.js           ← node-cron registrations, imports all job files
│       ├── learningLoop.job.js    ← Weekly: triggers LearningLoop.run()
│       ├── reliabilityScore.job.js← Daily: recomputes kabadiwala reliability_score
│       ├── stalePickup.job.js     ← Hourly: flags pickups stuck in 'assigned' > 24h
│       └── rateReminder.job.js    ← Daily 9 AM: alerts admin if any rate is > 7 days old
│
└── tests/
    ├── unit/
    │   ├── auth.service.test.js
    │   ├── pickup.service.test.js
    │   ├── assignment.engine.test.js  ← Algorithmic unit tests
    │   ├── learningLoop.test.js
    │   ├── payment.service.test.js
    │   └── utils/
    │       ├── haversine.test.js
    │       └── phoneUtils.test.js
    ├── integration/
    │   ├── auth.routes.test.js        ← Supertest: full request cycle with test DB
    │   ├── pickup.routes.test.js
    │   └── assignment.routes.test.js
    └── fixtures/
        ├── users.fixture.js
        ├── localities.fixture.js
        └── pickups.fixture.js
```

---

## 3. Backend: Layer-by-Layer Responsibilities

### 3.1 `src/index.js` — Process Entry Point

```javascript
// src/index.js
const app = require('./server');
const { env } = require('./config/env');
const { pool } = require('./config/database');
const { redisClient } = require('./config/redis');
const { scheduler } = require('./jobs/scheduler');
const logger = require('./shared/utils/logger');

const PORT = env.PORT;

async function start() {
  try {
    // 1. Verify DB connectivity before accepting traffic
    await pool.query('SELECT 1');
    logger.info('PostgreSQL connection verified');

    // 2. Verify Redis connectivity
    await redisClient.ping();
    logger.info('Redis connection verified');

    // 3. Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} [${env.NODE_ENV}]`);
    });

    // 4. Register background jobs
    scheduler.start();
    logger.info('Background jobs registered');

    // 5. Graceful shutdown handlers
    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        await pool.end();
        await redisClient.quit();
        scheduler.stop();
        logger.info('All connections closed. Exiting.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    logger.error('Startup failed', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

start();
```

**What this file owns:** Process lifecycle — start, verify dependencies, register jobs, handle shutdown.  
**What it does NOT own:** Express configuration, route registration, business logic.

---

### 3.2 `src/server.js` — Express App Factory

```javascript
// src/server.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { env } = require('./config/env');
const { requestLogger } = require('./middleware/requestLogger');
const { errorHandler } = require('./middleware/errorHandler');
const { NotFoundError } = require('./shared/errors/NotFoundError');

// Route imports
const authRoutes       = require('./modules/auth/auth.routes');
const pickupRoutes     = require('./modules/pickup/pickup.routes');
const assignmentRoutes = require('./modules/assignment/assignment.routes');
const paymentRoutes    = require('./modules/payment/payment.routes');
const localityRoutes   = require('./modules/locality/locality.routes');
const citizenRoutes    = require('./modules/citizen/citizen.routes');
const kabadiRoutes     = require('./modules/kabadiwala/kabadiwala.routes');
const adminRoutes      = require('./modules/admin/admin.routes');
const garbageRoutes    = require('./modules/garbage/garbage.routes');

const app = express();

// ── Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:", "https://*.s3.amazonaws.com"],
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

// ── CORS (allowed origins from env, never '*' in production)
app.use(cors({
  origin: env.CORS_ORIGINS.split(',').map(o => o.trim()),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ── Body parsing and compression
app.use(express.json({ limit: '1mb' }));          // Reject payloads > 1MB
app.use(express.urlencoded({ extended: false }));
app.use(compression());

// ── Request logging (before routes, after body parsing)
app.use(requestLogger);

// ── Health check (no auth, no rate limit — monitored by uptime tools)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API routes
const API = '/api';
app.use(`${API}/auth`,        authRoutes);
app.use(`${API}/pickups`,     pickupRoutes);
app.use(`${API}/assignments`, assignmentRoutes);
app.use(`${API}/payments`,    paymentRoutes);
app.use(`${API}/localities`,  localityRoutes);
app.use(`${API}/citizen`,     citizenRoutes);
app.use(`${API}/kabadiwala`,  kabadiRoutes);
app.use(`${API}/admin`,       adminRoutes);
app.use(`${API}/garbage`,     garbageRoutes);

// ── 404 handler (must be after all routes)
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
});

// ── Centralized error handler (must be last middleware, 4-argument signature)
app.use(errorHandler);

module.exports = app;
```

**What this file owns:** Express configuration, middleware stack order, route mounting.  
**What it does NOT own:** Port binding, job scheduling, business logic.

---

### 3.3 `src/config/env.js` — Environment Validation

```javascript
// src/config/env.js
const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV:          z.enum(['development', 'staging', 'production']),
  PORT:              z.string().default('4000').transform(Number),

  // Database
  DB_HOST:           z.string(),
  DB_PORT:           z.string().default('5432').transform(Number),
  DB_NAME:           z.string(),
  DB_USER:           z.string(),
  DB_PASSWORD:       z.string(),
  DB_POOL_MAX:       z.string().default('20').transform(Number),
  DB_READ_HOST:      z.string().optional(),  // Read replica (analytics)

  // Redis
  REDIS_URL:         z.string(),

  // Auth
  JWT_SECRET:        z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRY:        z.string().default('7d'),

  // SMS
  SMS_PROVIDER:      z.enum(['msg91', 'twilio', 'console']).default('console'),
  SMS_API_KEY:       z.string().optional(),
  SMS_SENDER_ID:     z.string().optional(),

  // Storage
  STORAGE_PROVIDER:  z.enum(['s3', 'gcs', 'local']).default('local'),
  S3_BUCKET:         z.string().optional(),
  AWS_REGION:        z.string().optional(),

  // CORS
  CORS_ORIGINS:      z.string().default('http://localhost:5173'),

  // Feature flags
  LEARNING_LOOP_ENABLED: z.string().default('true').transform(v => v === 'true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Environment validation failed:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

module.exports = { env: parsed.data };
```

**Why this exists:** The application fails at startup with a clear, structured error message if any required environment variable is missing or invalid. No more runtime crashes in production due to a missing `.env` key.

---

### 3.4 `src/shared/db/index.js` — Database Abstraction

```javascript
// src/shared/db/index.js
const { pool } = require('../../config/database');
const logger = require('../utils/logger');

/**
 * Execute a single parameterized query.
 * @param {string} sql - Parameterized SQL string
 * @param {Array}  params - Bound parameters
 * @returns {Promise<QueryResult>}
 */
async function query(sql, params = []) {
  const start = Date.now();
  try {
    const result = await pool.query(sql, params);
    const duration = Date.now() - start;
    if (duration > 500) {
      // Log slow queries (threshold configurable)
      logger.warn('Slow query detected', { sql: sql.substring(0, 100), duration });
    }
    return result;
  } catch (err) {
    logger.error('Database query error', {
      sql: sql.substring(0, 100),
      params: params.map(() => '[REDACTED]'), // Never log actual params (may contain PII)
      error: err.message
    });
    throw err;
  }
}

/**
 * Execute a query expecting exactly one row.
 * Throws NotFoundError if no rows returned.
 */
async function queryOne(sql, params = []) {
  const result = await query(sql, params);
  return result.rows[0] ?? null;
}

/**
 * Execute multiple operations in a single transaction.
 * @param {Function} callback - Receives client, executes queries, returns result
 */
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { query, queryOne, transaction };
```

**What this file owns:** Connection acquisition, query execution, transaction lifecycle, slow query logging.  
**What it does NOT own:** SQL string construction, business logic.

---

### 3.5 `src/middleware/authenticate.js`

```javascript
// src/middleware/authenticate.js
const jwt = require('jsonwebtoken');
const { redisClient } = require('../../config/redis');
const { AuthError } = require('../shared/errors/AuthError');
const { env } = require('../../config/env');

async function authenticate(req, res, next) {
  try {
    // 1. Extract token
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AuthError('Authorization header missing or malformed', 401);
    }
    const token = header.split(' ')[1];

    // 2. Verify JWT signature and expiry
    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      throw new AuthError(
        err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
        401
      );
    }

    // 3. Verify session still exists in Redis
    // (Allows token invalidation on logout or account deactivation)
    const sessionKey = `session:${payload.userId}`;
    const session = await redisClient.get(sessionKey);
    if (!session) {
      throw new AuthError('Session expired or invalidated', 401);
    }

    // 4. Attach user context to request
    req.user = {
      userId:     payload.userId,
      role:       payload.role,
      localityId: payload.localityId,
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate };
```

---

### 3.6 `src/middleware/errorHandler.js`

```javascript
// src/middleware/errorHandler.js
const { AppError } = require('../shared/errors/AppError');
const logger = require('../shared/utils/logger');

function errorHandler(err, req, res, next) {
  // Log the full error internally
  logger.error('Request error', {
    method: req.method,
    path: req.path,
    userId: req.user?.userId ?? 'unauthenticated',
    errorCode: err.errorCode ?? 'UNKNOWN',
    message: err.message,
    stack: err.stack,
  });

  // Known operational errors (AppError subclasses)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code:    err.errorCode,
        message: err.message,
        // Include field-level details only for validation errors
        ...(err.details && { details: err.details }),
      }
    });
  }

  // PostgreSQL unique violation (code 23505)
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: {
        code:    'CONFLICT',
        message: 'This record already exists or conflicts with existing data',
      }
    });
  }

  // Unknown errors — never expose internals in production
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message;

  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message }
  });
}

module.exports = { errorHandler };
```

---

## 4. Backend: Module Deep Dives

### 4.1 Auth Module

**`auth.routes.js`**
```javascript
const router = require('express').Router();
const { authController } = require('./auth.controller');
const { validateRequest } = require('../../middleware/validateRequest');
const { sendOtpSchema, verifyOtpSchema } = require('./auth.validation');
const { rateLimiter } = require('../../middleware/rateLimiter');

// Auth endpoints are PUBLIC — no authenticate middleware
router.post('/send-otp',
  rateLimiter({ windowSeconds: 3600, maxRequests: 5, keyPrefix: 'otp_req' }),
  validateRequest(sendOtpSchema),
  authController.sendOtp
);

router.post('/verify-otp',
  rateLimiter({ windowSeconds: 900, maxRequests: 10, keyPrefix: 'otp_verify' }),
  validateRequest(verifyOtpSchema),
  authController.verifyOtp
);

router.post('/logout',
  authenticate,        // Must be authenticated to log out
  authController.logout
);

module.exports = router;
```

**`auth.validation.js`**
```javascript
const { z } = require('zod');

const sendOtpSchema = z.object({
  body: z.object({
    phoneNumber: z.string()
      .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  })
});

const verifyOtpSchema = z.object({
  body: z.object({
    phoneNumber: z.string().regex(/^\d{10}$/, 'Invalid phone number'),
    otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
    // Role is provided at first login only. Subsequent logins ignore this field.
    role: z.enum(['citizen', 'kabadiwala']).optional(),
  })
});

module.exports = { sendOtpSchema, verifyOtpSchema };
```

**`auth.controller.js`** — pure HTTP translation
```javascript
const { authService } = require('./auth.service');

async function sendOtp(req, res, next) {
  try {
    const { phoneNumber } = req.body;  // Already validated by middleware
    await authService.sendOtp(phoneNumber);
    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { phoneNumber, otp, role } = req.body;
    const result = await authService.verifyOtp(phoneNumber, otp, role);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.user.userId);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { authController: { sendOtp, verifyOtp, logout } };
```

**`auth.service.js`** — pure business logic, no HTTP
```javascript
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query, queryOne, transaction } = require('../../shared/db');
const { redisClient } = require('../../config/redis');
const { env } = require('../../config/env');
const { notificationService } = require('../notification/notification.service');
const { AuthError } = require('../../shared/errors/AuthError');
const { ConflictError } = require('../../shared/errors/ConflictError');
const logger = require('../../shared/utils/logger');

const OTP_EXPIRY_SECONDS = 300;
const OTP_BCRYPT_ROUNDS = 8;
const JWT_BCRYPT_ROUNDS = 10;

async function sendOtp(phoneNumber) {
  // Generate cryptographically secure 6-digit OTP
  const otp = String(crypto.randomInt(100000, 999999));

  // Hash and store in Redis with TTL
  const hashed = await bcrypt.hash(otp, OTP_BCRYPT_ROUNDS);
  await redisClient.setEx(`otp:${phoneNumber}`, OTP_EXPIRY_SECONDS, hashed);

  // Send via SMS (console fallback in development)
  await notificationService.sendSms(phoneNumber, 'OTP_LOGIN', { otp });

  // In development, include OTP in server logs only (never in response)
  if (env.NODE_ENV === 'development') {
    logger.debug(`[DEV] OTP for ${phoneNumber}: ${otp}`);
  }
}

async function verifyOtp(phoneNumber, providedOtp, role) {
  // Fetch stored OTP hash
  const storedHash = await redisClient.get(`otp:${phoneNumber}`);
  if (!storedHash) {
    throw new AuthError('OTP has expired or was not requested', 400);
  }

  // Check failed attempts
  const failKey = `otp_fail:${phoneNumber}`;
  const failCount = parseInt(await redisClient.get(failKey) ?? '0', 10);
  if (failCount >= 5) {
    throw new AuthError('Too many failed attempts. Please request a new OTP.', 429);
  }

  // Compare OTP
  const isValid = await bcrypt.compare(providedOtp, storedHash);
  if (!isValid) {
    await redisClient.multi()
      .incr(failKey)
      .expire(failKey, 900) // 15-min lockout window
      .exec();
    throw new AuthError('Invalid OTP', 400);
  }

  // Consume OTP — single use enforced here
  await redisClient.multi()
    .del(`otp:${phoneNumber}`)
    .del(failKey)
    .exec();

  // Upsert user and profile in a transaction
  const { user, isNewUser } = await transaction(async (client) => {
    let user = await client.query(
      'SELECT id, name, role, is_active FROM users WHERE phone_number = $1',
      [phoneNumber]
    ).then(r => r.rows[0]);

    let isNewUser = false;

    if (!user) {
      // New user: role must be provided at signup
      if (!role) throw new AuthError('Role is required for new users', 400);

      const insertResult = await client.query(
        `INSERT INTO users (phone_number, role)
         VALUES ($1, $2) RETURNING id, name, role`,
        [phoneNumber, role]
      );
      user = insertResult.rows[0];
      isNewUser = true;

      // Create role-specific profile
      if (role === 'citizen') {
        await client.query(
          'INSERT INTO citizen_profiles (user_id) VALUES ($1)',
          [user.id]
        );
      } else if (role === 'kabadiwala') {
        await client.query(
          'INSERT INTO kabadiwala_profiles (user_id) VALUES ($1)',
          [user.id]
        );
      }
    } else {
      if (!user.is_active) {
        throw new AuthError('Account is deactivated. Contact support.', 403);
      }
      // Role mismatch on re-login (someone tries to login as a different role)
      if (role && role !== user.role) {
        throw new AuthError('Role mismatch. This account is registered as a different role.', 403);
      }
    }

    return { user, isNewUser };
  });

  // Fetch locality for JWT payload
  const localityId = await _getUserLocalityId(user.id, user.role);

  // Sign JWT
  const token = jwt.sign(
    { userId: user.id, role: user.role, localityId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRY }
  );

  // Store session in Redis
  await redisClient.setEx(
    `session:${user.id}`,
    7 * 24 * 60 * 60,   // 7 days in seconds
    JSON.stringify({ userId: user.id, role: user.role })
  );

  return { token, user: { userId: user.id, name: user.name, role: user.role }, isNewUser };
}

async function logout(userId) {
  await redisClient.del(`session:${userId}`);
}

async function _getUserLocalityId(userId, role) {
  if (role === 'citizen') {
    const row = await queryOne(
      'SELECT locality_id FROM citizen_profiles WHERE user_id = $1', [userId]
    );
    return row?.locality_id ?? null;
  }
  if (role === 'kabadiwala') {
    const row = await queryOne(
      'SELECT service_locality_id FROM kabadiwala_profiles WHERE user_id = $1', [userId]
    );
    return row?.service_locality_id ?? null;
  }
  return null;
}

module.exports = { authService: { sendOtp, verifyOtp, logout } };
```

---

### 4.2 Assignment Engine Module

The assignment module contains the most complex logic. It is split across three files within `/engine/`:

**`engine/weightConfig.js`** — weight fetching with Redis cache
```javascript
// Fetches the active weight configuration.
// Cache in Redis (5-min TTL) to avoid hitting DB on every assignment.

const { queryOne } = require('../../../shared/db');
const { redisClient } = require('../../../config/redis');

const CACHE_KEY = 'active_weights';
const CACHE_TTL = 300; // seconds

async function getActiveWeights() {
  // Try cache first
  const cached = await redisClient.get(CACHE_KEY);
  if (cached) return JSON.parse(cached);

  // Fetch from DB
  const row = await queryOne(
    `SELECT id, w_distance, w_workload, w_reliability
     FROM weight_configurations
     WHERE is_active = true`
  );

  if (!row) throw new Error('No active weight configuration found');

  const weights = {
    configId:     row.id,
    wDistance:    parseFloat(row.w_distance),
    wWorkload:    parseFloat(row.w_workload),
    wReliability: parseFloat(row.w_reliability),
  };

  await redisClient.setEx(CACHE_KEY, CACHE_TTL, JSON.stringify(weights));
  return weights;
}

// Called after learning loop updates weights — invalidates cache
async function invalidateWeightCache() {
  await redisClient.del(CACHE_KEY);
}

module.exports = { getActiveWeights, invalidateWeightCache };
```

**`engine/AssignmentEngine.js`** — scoring and selection
```javascript
const { query, queryOne } = require('../../../shared/db');
const { getActiveWeights } = require('./weightConfig');
const { haversine } = require('../../../shared/utils/haversine');
const { NotFoundError } = require('../../../shared/errors/NotFoundError');
const logger = require('../../../shared/utils/logger');

const MAX_DAILY_PICKUPS = 10;       // Overridden by system_configurations
const MAX_ASSIGNMENT_DISTANCE_KM = 10;

class AssignmentEngine {

  /**
   * Find the best Kabadiwala for a pickup request.
   * Returns { kabadiwalId, score, factorsSnapshot, weightsSnapshot }
   * Returns null if no suitable candidate found.
   */
  async findBestKabadiwala(requestId) {
    // 1. Fetch the pickup request
    const pickup = await queryOne(
      `SELECT pr.*, l.latitude AS locality_lat, l.longitude AS locality_lng
       FROM pickup_requests pr
       JOIN localities l ON pr.locality_id = l.id
       WHERE pr.id = $1`,
      [requestId]
    );
    if (!pickup) throw new NotFoundError(`Pickup request ${requestId} not found`);

    // 2. Get current factor weights
    const weights = await getActiveWeights();

    // 3. Fetch active kabadiwalas in the locality
    const candidates = await this._fetchCandidates(
      pickup.locality_id,
      pickup.preferred_date
    );

    if (candidates.length === 0) {
      logger.info('No candidates available for assignment', { requestId });
      return null;
    }

    // 4. Score each candidate
    const scored = candidates.map(k => {
      const factors = this._computeFactors(k, pickup);
      const score =
        weights.wDistance    * factors.distanceScore +
        weights.wWorkload    * factors.workloadScore +
        weights.wReliability * factors.reliabilityScore;

      return {
        kabadiwalId:      k.user_id,
        score:            parseFloat(score.toFixed(6)),
        factorsSnapshot:  { ...factors, distanceKm: k.distanceKm },
        weightsSnapshot: {
          wDistance:    weights.wDistance,
          wWorkload:    weights.wWorkload,
          wReliability: weights.wReliability,
          weightConfigId: weights.configId,
        },
      };
    });

    // 5. Sort and select best
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    logger.info('Assignment engine selected candidate', {
      requestId,
      kabadiwalId: best.kabadiwalId,
      score: best.score,
      factorsSnapshot: best.factorsSnapshot,
    });

    return best;
  }

  async _fetchCandidates(localityId, preferredDate) {
    const result = await query(
      `SELECT
          kp.user_id,
          kp.reliability_score,
          kp.last_known_lat,
          kp.last_known_lng,
          kp.service_locality_id,
          l.latitude   AS locality_lat,
          l.longitude  AS locality_lng,
          COUNT(pa.id) AS todays_assignment_count
       FROM kabadiwala_profiles kp
       JOIN users u ON kp.user_id = u.id
       JOIN localities l ON kp.service_locality_id = l.id
       LEFT JOIN pickup_assignments pa
           ON pa.kabadiwala_id = kp.user_id
           AND pa.assigned_date = $2
           AND pa.status NOT IN ('failed', 'reassigned')
       WHERE kp.service_locality_id = $1
         AND kp.is_available = true
         AND u.is_active = true
       GROUP BY kp.user_id, kp.reliability_score,
                kp.last_known_lat, kp.last_known_lng,
                kp.service_locality_id, l.latitude, l.longitude
       HAVING COUNT(pa.id) < $3`,
      [localityId, preferredDate, MAX_DAILY_PICKUPS]
    );
    return result.rows;
  }

  _computeFactors(kabadiwala, pickup) {
    // Use kabadiwala's last known location if recent, else locality centroid
    const kabLat = kabadiwala.last_known_lat ?? kabadiwala.locality_lat;
    const kabLng = kabadiwala.last_known_lng ?? kabadiwala.locality_lng;
    const pickupLat = pickup.pickup_lat ?? pickup.locality_lat;
    const pickupLng = pickup.pickup_lng ?? pickup.locality_lng;

    const distanceKm = haversine(kabLat, kabLng, pickupLat, pickupLng);
    kabadiwala.distanceKm = distanceKm;

    // Score: closer = higher. Formula gives ~0.5 at 1km, ~0.33 at 2km
    const distanceScore = 1 / (1 + distanceKm);

    // Score: fewer assignments = more available = higher score
    const workloadScore =
      (MAX_DAILY_PICKUPS - kabadiwala.todays_assignment_count) / MAX_DAILY_PICKUPS;

    // Score: directly from pre-computed reliability_score (0.0 - 1.0)
    const reliabilityScore = parseFloat(kabadiwala.reliability_score);

    return {
      distanceScore:    parseFloat(distanceScore.toFixed(6)),
      workloadScore:    parseFloat(workloadScore.toFixed(6)),
      reliabilityScore: parseFloat(reliabilityScore.toFixed(6)),
    };
  }
}

module.exports = { assignmentEngine: new AssignmentEngine() };
```

**`assignment.service.js`** — orchestrates engine + DB writes
```javascript
const { assignmentEngine } = require('./engine/AssignmentEngine');
const { query, queryOne, transaction } = require('../../shared/db');
const { notificationService } = require('../notification/notification.service');
const { PICKUP_STATUS } = require('../../shared/constants/pickupStatus');
const { ASSIGNMENT_STATUS } = require('../../shared/constants/assignmentStatus');
const logger = require('../../shared/utils/logger');

/**
 * Triggered after a pickup request is created.
 * Runs async — does not block the citizen's response.
 */
async function triggerAutoAssignment(requestId) {
  try {
    const best = await assignmentEngine.findBestKabadiwala(requestId);

    if (!best) {
      // No kabadiwala available — flag for admin
      await query(
        `UPDATE pickup_requests
         SET status = $1, updated_at = NOW()
         WHERE id = $2`,
        [PICKUP_STATUS.UNASSIGNED_NO_AVAILABILITY, requestId]
      );
      await notificationService.notifyAdmins('NO_KABADIWALA_AVAILABLE', { requestId });
      return;
    }

    // Persist assignment atomically
    await transaction(async (client) => {
      // 1. Create assignment record
      const assignResult = await client.query(
        `INSERT INTO pickup_assignments
           (request_id, kabadiwala_id, assigned_date,
            factors_snapshot, weights_snapshot, assigned_by)
         VALUES ($1, $2,
           (SELECT preferred_date FROM pickup_requests WHERE id = $1),
           $3, $4, 'auto')
         RETURNING id`,
        [
          requestId,
          best.kabadiwalId,
          JSON.stringify(best.factorsSnapshot),
          JSON.stringify(best.weightsSnapshot),
        ]
      );
      const assignmentId = assignResult.rows[0].id;

      // 2. Update pickup request status
      await client.query(
        `UPDATE pickup_requests
         SET status = $1, updated_at = NOW()
         WHERE id = $2`,
        [PICKUP_STATUS.ASSIGNED, requestId]
      );

      // 3. Increment kabadiwala's total_pickups counter
      await client.query(
        `UPDATE kabadiwala_profiles
         SET total_pickups = total_pickups + 1, updated_at = NOW()
         WHERE user_id = $1`,
        [best.kabadiwalId]
      );

      return assignmentId;
    });

    // 4. Send notifications (outside transaction — non-critical)
    const pickup = await queryOne(
      `SELECT pr.citizen_id, pa.kabadiwala_id
       FROM pickup_requests pr
       JOIN pickup_assignments pa ON pr.id = pa.request_id
       WHERE pr.id = $1 AND pa.status != 'reassigned'`,
      [requestId]
    );
    await notificationService.send(pickup.citizen_id, 'PICKUP_ASSIGNED', { requestId });
    await notificationService.send(pickup.kabadiwala_id, 'NEW_PICKUP_ASSIGNED', { requestId });

  } catch (err) {
    logger.error('Auto-assignment failed', { requestId, error: err.message });
    // Non-fatal: log and let admin handle via manual assignment queue
  }
}

// ... manualAssign, reassign functions follow same pattern

module.exports = { assignmentService: { triggerAutoAssignment } };
```

---

### 4.3 Background Jobs

**`jobs/scheduler.js`**
```javascript
const cron = require('node-cron');
const { learningLoopJob } = require('./learningLoop.job');
const { reliabilityScoreJob } = require('./reliabilityScore.job');
const { stalePickupJob } = require('./stalePickup.job');
const { rateReminderJob } = require('./rateReminder.job');
const logger = require('../shared/utils/logger');

const jobs = [];

function start() {
  // Weekly: Sunday 2 AM IST (UTC+5:30 = Sunday 20:30 UTC Saturday)
  jobs.push(cron.schedule('30 20 * * 0', async () => {
    logger.info('Job started: learningLoop');
    await learningLoopJob.run().catch(e => logger.error('learningLoop failed', e));
  }));

  // Daily: 1 AM IST
  jobs.push(cron.schedule('30 19 * * *', async () => {
    logger.info('Job started: reliabilityScore');
    await reliabilityScoreJob.run().catch(e => logger.error('reliabilityScore failed', e));
  }));

  // Hourly: every hour on the hour
  jobs.push(cron.schedule('0 * * * *', async () => {
    await stalePickupJob.run().catch(e => logger.error('stalePickup failed', e));
  }));

  // Daily: 9 AM IST
  jobs.push(cron.schedule('30 3 * * *', async () => {
    await rateReminderJob.run().catch(e => logger.error('rateReminder failed', e));
  }));

  logger.info(`${jobs.length} background jobs scheduled`);
}

function stop() {
  jobs.forEach(job => job.destroy());
  logger.info('Background jobs stopped');
}

module.exports = { scheduler: { start, stop } };
```

---

## 5. Frontend: Application Architecture

### 5.1 Three-App Monorepo Structure

Three separate React applications share a common workspace:

```
waste-management-frontend/
├── package.json            ← Root: workspaces config, shared scripts
├── apps/
│   ├── citizen/            ← Citizen-facing SPA
│   ├── kabadiwala/         ← Kabadiwala operational app
│   └── admin/              ← Admin dashboard
└── packages/
    ├── ui/                 ← Shared component library (Button, Input, Modal, etc.)
    ├── api-client/         ← Shared Axios instance + all API functions
    └── constants/          ← Shared role enums, status enums, route paths
```

**Why separate apps, not one app with role-based routes?**

- Bundle size: a citizen should not download admin dashboard code
- Separate deployments: admin app can be restricted to VPN/internal network
- Independent release cycles: kabadiwala app can be updated without touching citizen app
- Tailored UX: kabadiwala app needs a radically simpler interface — trying to serve both from one codebase creates tension

---

## 6. Frontend: Full Folder Structure

### 6.1 Citizen App

```
apps/citizen/
│
├── index.html
├── vite.config.js
├── tailwind.config.js
│
└── src/
    ├── main.jsx               ← ReactDOM.createRoot, QueryClientProvider, AuthProvider
    ├── App.jsx                ← Router, route definitions, protected route wrapper
    │
    ├── pages/
    │   ├── Login/
    │   │   ├── Login.page.jsx
    │   │   ├── PhoneStep.jsx        ← Phone number entry + send OTP
    │   │   └── OtpStep.jsx          ← OTP entry + verify
    │   │
    │   ├── Dashboard/
    │   │   ├── Dashboard.page.jsx   ← Overview: active pickup, recent history
    │   │   └── ActivePickupCard.jsx ← Status card for the current pickup
    │   │
    │   ├── RequestPickup/
    │   │   ├── RequestPickup.page.jsx
    │   │   ├── CategorySelector.jsx ← Plastic / Paper / Metal with rates displayed
    │   │   ├── DateTimeSelector.jsx ← Date picker + time slot
    │   │   ├── AddressForm.jsx      ← Address + landmark + optional GPS pin
    │   │   └── RequestSummary.jsx   ← Review + submit
    │   │
    │   ├── PickupHistory/
    │   │   ├── PickupHistory.page.jsx
    │   │   └── PickupHistoryCard.jsx
    │   │
    │   ├── Payments/
    │   │   ├── Payments.page.jsx
    │   │   ├── PaymentCard.jsx
    │   │   └── UpiConfirmModal.jsx  ← Citizen enters UPI reference
    │   │
    │   ├── GarbageSchedule/
    │   │   ├── GarbageSchedule.page.jsx
    │   │   └── ReportMissedModal.jsx
    │   │
    │   └── Profile/
    │       ├── Profile.page.jsx
    │       └── EditProfileForm.jsx
    │
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.jsx          ← Navigation bar + page content slot
    │   │   ├── BottomNav.jsx         ← Mobile bottom nav: Home, Request, History, Profile
    │   │   └── PageHeader.jsx        ← Back button + title
    │   │
    │   └── pickup/
    │       ├── StatusBadge.jsx       ← Color-coded pickup status chip
    │       ├── ScrapRateDisplay.jsx  ← ₹/kg rate with category icon
    │       └── PickupTimeline.jsx    ← Visual progress: Requested → Assigned → Done
    │
    ├── hooks/
    │   ├── useAuth.js               ← Auth state, login, logout, current user
    │   ├── usePickups.js            ← React Query hooks for pickup data
    │   ├── useScrapRates.js         ← Cached scrap rates with staleTime
    │   ├── useLocalities.js         ← Locality list
    │   └── usePayments.js           ← Payment history and status updates
    │
    ├── context/
    │   └── AuthContext.jsx          ← Auth state provider, JWT persistence
    │
    ├── router/
    │   ├── routes.js                ← Route path constants
    │   └── ProtectedRoute.jsx       ← Redirects to /login if not authenticated
    │
    └── styles/
        ├── globals.css              ← Tailwind base + custom variables
        └── tokens.css               ← Design tokens: colors, spacing, typography
```

### 6.2 Kabadiwala App

```
apps/kabadiwala/
└── src/
    ├── pages/
    │   ├── Login/
    │   │   └── Login.page.jsx       ← Same flow as citizen login
    │   │
    │   ├── TodayQueue/
    │   │   ├── TodayQueue.page.jsx  ← Core screen: ordered list of today's pickups
    │   │   ├── PickupQueueItem.jsx  ← Card: address, category, citizen phone, navigate CTA
    │   │   └── EmptyQueue.jsx       ← Friendly empty state
    │   │
    │   ├── ActivePickup/
    │   │   ├── ActivePickup.page.jsx ← Active pickup: map link, complete button
    │   │   ├── WeightEntryForm.jsx   ← Numeric input for actual weight (kg)
    │   │   └── CompletePickupModal.jsx
    │   │
    │   ├── Earnings/
    │   │   ├── Earnings.page.jsx
    │   │   ├── EarningsSummaryCard.jsx  ← Today's total ₹ + pickups
    │   │   └── EarningsHistoryList.jsx
    │   │
    │   └── Profile/
    │       └── Profile.page.jsx     ← Availability toggle + basic info
    │
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.jsx
    │   │   └── BottomNav.jsx        ← Today / Earnings / Profile
    │   │
    │   └── pickup/
    │       ├── CategoryIcon.jsx     ← Visual icon for plastic/paper/metal
    │       ├── StatusBadge.jsx
    │       └── NavigateButton.jsx   ← Opens Google Maps with pickup address
    │
    ├── hooks/
    │   ├── useAuth.js
    │   ├── useTodayPickups.js       ← Polls every 2 min for new assignments
    │   ├── useCompletePickup.js     ← Mutation: complete pickup with weight
    │   └── useEarnings.js
    │
    └── context/
        └── AuthContext.jsx
```

### 6.3 Admin App

```
apps/admin/
└── src/
    ├── pages/
    │   ├── Login/
    │   │   └── Login.page.jsx
    │   │
    │   ├── Dashboard/
    │   │   ├── Dashboard.page.jsx        ← System overview cards + charts
    │   │   ├── MetricCard.jsx            ← Single stat (total pickups, kg, ₹, etc.)
    │   │   ├── PickupsByCategory.jsx     ← Bar chart
    │   │   ├── CompletionRateChart.jsx   ← Line chart over time
    │   │   └── RecentActivity.jsx        ← Last 20 completed pickups table
    │   │
    │   ├── Assignments/
    │   │   ├── Assignments.page.jsx      ← Pending + unassigned queue
    │   │   ├── PendingAssignmentRow.jsx
    │   │   └── ManualAssignModal.jsx     ← Select kabadiwala + confirm
    │   │
    │   ├── ScrapRates/
    │   │   ├── ScrapRates.page.jsx       ← Rates table per locality
    │   │   └── UpdateRateModal.jsx       ← Form to set new rate + effective date
    │   │
    │   ├── Localities/
    │   │   ├── Localities.page.jsx
    │   │   └── LocalityToggle.jsx        ← Toggle is_serviceable per locality
    │   │
    │   ├── Kabadiwalas/
    │   │   ├── Kabadiwalas.page.jsx      ← Kabadiwala list + performance stats
    │   │   └── KabadiProfile.jsx         ← Reliability score, pickup counts
    │   │
    │   ├── LearningInsights/
    │   │   ├── LearningInsights.page.jsx ← Weight history, improvement chart
    │   │   ├── WeightHistoryTable.jsx    ← All past weight configs
    │   │   ├── WeightRadarChart.jsx      ← Current weights visualised
    │   │   └── ManualWeightOverride.jsx  ← Admin can set weights manually
    │   │
    │   └── GarbageSchedules/
    │       ├── GarbageSchedules.page.jsx
    │       └── MissedPickupsList.jsx
    │
    ├── components/
    │   ├── layout/
    │   │   ├── AdminShell.jsx            ← Sidebar + topbar layout
    │   │   ├── Sidebar.jsx               ← Navigation links
    │   │   └── Topbar.jsx                ← User info, logout
    │   │
    │   ├── data/
    │   │   ├── DataTable.jsx             ← Sortable, paginated table
    │   │   ├── Pagination.jsx
    │   │   └── ExportButton.jsx          ← CSV download
    │   │
    │   └── charts/
    │       ├── LineChart.jsx             ← Recharts wrapper
    │       ├── BarChart.jsx
    │       └── RadarChart.jsx
    │
    └── hooks/
        ├── useAuth.js
        ├── useDashboard.js
        ├── useAssignments.js
        ├── useScrapRates.js
        ├── useKabadiwalas.js
        └── useLearningInsights.js
```

### 6.4 Shared API Client Package

```
packages/api-client/
├── index.js               ← Exports all API function groups
├── axiosInstance.js       ← Configured Axios with JWT interceptor + error normalizer
├── auth.api.js
├── pickup.api.js
├── payment.api.js
├── locality.api.js
├── kabadiwala.api.js
├── citizen.api.js
├── admin.api.js
└── garbage.api.js
```

**`packages/api-client/axiosInstance.js`**
```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: normalize errors
apiClient.interceptors.response.use(
  (response) => response.data,   // Unwrap .data so callers get the payload directly
  (error) => {
    const status = error.response?.status;
    const apiError = error.response?.data?.error;

    // Token expired: clear storage and redirect to login
    if (status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return;
    }

    // Reject with a structured error object
    return Promise.reject({
      status,
      code:    apiError?.code    ?? 'NETWORK_ERROR',
      message: apiError?.message ?? 'An unexpected error occurred',
      details: apiError?.details ?? null,
    });
  }
);

export default apiClient;
```

**`packages/api-client/pickup.api.js`**
```javascript
import apiClient from './axiosInstance';

export const pickupApi = {
  createRequest: (data) =>
    apiClient.post('/pickups/request', data),

  getMyRequests: (params = {}) =>
    apiClient.get('/pickups/my-requests', { params }),

  getRequestById: (id) =>
    apiClient.get(`/pickups/${id}`),

  cancelRequest: (id) =>
    apiClient.patch(`/pickups/${id}/cancel`),
};
```

---

## 7. Frontend: Layer-by-Layer Responsibilities

### 7.1 Pages

Pages are **route-level components**. They:
- Compose smaller components
- Call custom hooks for data
- Handle loading and error states
- Do NOT contain inline business logic or raw `fetch` calls

```jsx
// pages/RequestPickup/RequestPickup.page.jsx — clean, no logic
function RequestPickupPage() {
  const { localities, isLoading: locLoading } = useLocalities();
  const { scrapRates } = useScrapRates(selectedLocalityId);
  const { createRequest, isPending } = useCreatePickupRequest();

  // Only rendering and orchestration — no axios, no JWT handling, no date math
  return (
    <PageContainer>
      <PageHeader title="Schedule Pickup" />
      {locLoading ? <Spinner /> : (
        <MultiStepForm onSubmit={createRequest} isPending={isPending}>
          <CategorySelector rates={scrapRates} />
          <DateTimeSelector />
          <AddressForm localities={localities} />
          <RequestSummary />
        </MultiStepForm>
      )}
    </PageContainer>
  );
}
```

### 7.2 Components

Components are **pure presentational units**. They:
- Receive all data via props
- Emit events via callbacks (`onSelect`, `onChange`, `onSubmit`)
- Contain zero API calls
- Contain zero business logic

```jsx
// components/pickup/ScrapRateDisplay.jsx — pure presentational
function ScrapRateDisplay({ category, ratePerKg, isSelected, onSelect }) {
  const icons = { plastic: '♻️', paper: '📄', metal: '⚙️' };

  return (
    <button
      className={`rate-card ${isSelected ? 'rate-card--selected' : ''}`}
      onClick={() => onSelect(category)}
      aria-pressed={isSelected}
    >
      <span className="rate-card__icon">{icons[category]}</span>
      <span className="rate-card__label">{category}</span>
      <span className="rate-card__rate">₹{ratePerKg}/kg</span>
    </button>
  );
}
```

### 7.3 Hooks

Custom hooks are the **data and state layer**. They:
- Call API functions (via the shared api-client package)
- Use React Query for caching, loading, and error states
- Return data and action functions to pages
- Do NOT render anything

```javascript
// hooks/useCreatePickupRequest.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pickupApi } from '@waste-mgmt/api-client';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function useCreatePickupRequest() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => pickupApi.createRequest(data),

    onSuccess: (response) => {
      // Invalidate the pickup list cache so it refetches
      queryClient.invalidateQueries({ queryKey: ['pickups', 'mine'] });
      toast.success('Pickup requested successfully!');
      navigate('/dashboard');
    },

    onError: (error) => {
      if (error.code === 'CONFLICT') {
        toast.error('You already have a pickup scheduled for that date.');
      } else {
        toast.error(error.message ?? 'Failed to create pickup. Please try again.');
      }
    },
  });

  return {
    createRequest: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
```

### 7.4 Context

Context is used **only for global state** that truly needs to be accessible anywhere. In this system, that is only auth state.

```jsx
// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Initialize from localStorage (persists across refreshes)
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (token, userData) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Named hook — never use AuthContext directly outside this file
export const useAuth = () => useContext(AuthContext);
```

---

## 8. Frontend: State Management Design

### 8.1 State Taxonomy

| Type of State | Tool | Examples |
|---|---|---|
| **Server state** (data from API) | React Query | Pickup list, scrap rates, payment history |
| **Global client state** (auth) | Context API | Current user, token, isAuthenticated |
| **Local UI state** | useState / useReducer | Form values, modal open/close, step index |
| **Derived state** | useMemo / Computed | Total payment amount, filtered list |
| **URL state** | React Router | Selected date, active tab, page number |

### 8.2 React Query Configuration

```javascript
// main.jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes: data is fresh, no refetch
      gcTime:    10 * 60 * 1000,     // 10 minutes: inactive cache cleared
      retry: 2,                       // Retry failed requests twice
      refetchOnWindowFocus: true,     // Refetch when user returns to tab
      refetchOnReconnect: true,       // Refetch on network reconnect
    },
    mutations: {
      retry: 0,                       // Never auto-retry mutations (side effects)
    }
  }
});
```

### 8.3 React Query Key Conventions

Query keys must be structured consistently to enable targeted cache invalidation:

```javascript
// Query key factory — single source of truth for cache keys
export const queryKeys = {
  pickups: {
    all:      ['pickups'],
    mine:     ['pickups', 'mine'],
    byId:     (id) => ['pickups', id],
    history:  ['pickups', 'history'],
  },
  scrapRates: {
    byLocality: (localityId) => ['scrap-rates', localityId],
  },
  payments: {
    mine:   ['payments', 'mine'],
    byId:   (id) => ['payments', id],
  },
  kabadiwala: {
    queue:     ['kabadiwala', 'queue'],
    earnings:  ['kabadiwala', 'earnings'],
  },
  localities: {
    all: ['localities'],
  },
};

// Usage in hook:
const { data } = useQuery({
  queryKey: queryKeys.pickups.mine,
  queryFn: () => pickupApi.getMyRequests(),
});

// Invalidation after mutation:
queryClient.invalidateQueries({ queryKey: queryKeys.pickups.mine });
```

### 8.4 Multi-Step Form State (RequestPickup)

The pickup request form is multi-step. State is managed with `useReducer` to avoid prop drilling across steps:

```javascript
const initialState = {
  step: 1,                    // 1: Category, 2: DateTime, 3: Address, 4: Summary
  localityId: null,
  category: null,
  estimatedWeight: '',
  preferredDate: null,
  preferredTimeSlot: 'morning',
  pickupAddress: '',
  landmark: '',
  notes: '',
};

function formReducer(state, action) {
  switch (action.type) {
    case 'SET_CATEGORY':
      return { ...state, category: action.payload };
    case 'SET_DATETIME':
      return {
        ...state,
        preferredDate: action.payload.date,
        preferredTimeSlot: action.payload.slot,
      };
    case 'SET_ADDRESS':
      return { ...state, ...action.payload };
    case 'NEXT_STEP':
      return { ...state, step: state.step + 1 };
    case 'PREV_STEP':
      return { ...state, step: state.step - 1 };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}
```

---

## 9. Shared Contracts Between Frontend and Backend

### 9.1 API Response Envelope

Every response from the backend follows this envelope structure:

```javascript
// Success
{
  "success": true,
  "data": { ... },       // Present on success
  "meta": {              // Present on paginated responses
    "page": 1,
    "limit": 20,
    "total": 143,
    "totalPages": 8
  }
}

// Error
{
  "success": false,
  "error": {
    "code":    "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [          // Present only on validation errors
      { "field": "preferredDate", "message": "Must be a future date" },
      { "field": "category",      "message": "Required" }
    ]
  }
}
```

### 9.2 Status Code → Error Code Mapping

| HTTP Status | Error Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Zod schema validation failed |
| 400 | `INVALID_OTP` | OTP does not match |
| 400 | `OTP_EXPIRED` | OTP TTL elapsed |
| 401 | `TOKEN_EXPIRED` | JWT expired |
| 401 | `INVALID_TOKEN` | JWT signature invalid |
| 401 | `SESSION_INVALID` | Session not found in Redis |
| 403 | `FORBIDDEN` | Valid token, wrong role |
| 403 | `ACCOUNT_INACTIVE` | User is_active = false |
| 403 | `ROLE_MISMATCH` | Login with wrong role |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Duplicate active request for same date |
| 429 | `RATE_LIMITED` | Too many requests |
| 429 | `OTP_MAX_ATTEMPTS` | 5 failed OTP attempts |
| 500 | `INTERNAL_ERROR` | Unhandled server error |

### 9.3 Date and Time Conventions

| Convention | Standard |
|---|---|
| All timestamps | ISO 8601 UTC (`2026-03-15T14:30:00.000Z`) |
| All dates | `YYYY-MM-DD` (`2026-03-15`) |
| All times | `HH:MM:SS` 24-hour |
| All monetary values | Decimal string with 2 places (`"123.50"`) |
| All weights | Decimal in kg with 2 places (`"5.25"`) |
| Display timezone | IST (UTC+5:30) — handled in frontend, never in backend |

---

## 10. Inter-Module Dependency Rules

### 10.1 Backend Dependency Rules

```
ALLOWED:
  Module A service → Module B service (direct function call)
  Module A service → shared/db
  Module A service → shared/utils
  Module A service → shared/constants
  Module A service → shared/errors
  Any module → notification.service (it is a utility service)

PROHIBITED:
  Service → Controller (any module)
  Service → routes (any module)
  Controller → another Controller
  DB layer → Service layer
  Middleware → Service (except authenticate reading from DB/Redis directly)
  Jobs → Controllers (jobs call services directly)
```

### 10.2 Frontend Dependency Rules

```
ALLOWED:
  Page → Component (composition)
  Page → Hook (data fetching)
  Hook → api-client functions
  Hook → AuthContext
  Component → shared UI components (packages/ui)
  Component → shared constants (packages/constants)

PROHIBITED:
  Component → api-client (no direct API calls from components)
  Component → Context (except via useAuth hook)
  Page → api-client directly (must go through a hook)
  Hook → another Hook that manages different domain state
    (e.g., usePickups must not call usePayments internally)
```

### 10.3 Circular Dependency Prevention

Backend modules that would create circular imports instead use an event-based pattern via an internal event emitter:

```javascript
// The only potential circular dependency:
// pickup.service triggers assignment.service
// assignment.service reads pickup data

// Solution: pickup.service does NOT import assignment.service
// Instead, pickup.service emits an internal event:

// pickup.service.js
const { internalEvents } = require('../../shared/events');

// After creating pickup:
internalEvents.emit('pickup:created', { requestId });

// assignment.service.js — listens, not imported by pickup.service
internalEvents.on('pickup:created', async ({ requestId }) => {
  await assignmentService.triggerAutoAssignment(requestId);
});
```

This keeps the module dependency graph acyclic and the modules independently testable.

---

*End of Section 3: Component Structure*

*Next: Section 4 — Business Rules (Pickup lifecycle, Assignment rules, Payment rules, OTP auth rules, Role restrictions, Edge constraints)*

---

**Document Version:** 1.0  
**Last Updated:** March 2026  
**Consistency:** All file names, module boundaries, and data shapes are consistent with Section 1 (Architecture) and Section 2 (Database Design).