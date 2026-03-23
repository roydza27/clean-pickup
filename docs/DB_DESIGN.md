# Section 2: Database Design
## Waste Coordination & Recycling Management System
### India Pilot MVP — PostgreSQL 15

**Consistency Note:** All design decisions are downstream of the System Architecture (Section 1).  
PostgreSQL 15. No ORM. Raw SQL with parameterized queries throughout.

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Entity Relationship Overview](#2-entity-relationship-overview)
3. [Schema — Complete DDL](#3-schema--complete-ddl)
4. [Table-by-Table Breakdown](#4-table-by-table-breakdown)
5. [Relationship Map](#5-relationship-map)
6. [Indexing Strategy](#6-indexing-strategy)
7. [Constraints & Integrity Rules](#7-constraints--integrity-rules)
8. [Audit & Immutability Design](#8-audit--immutability-design)
9. [Schema Trade-offs & Decisions](#9-schema-trade-offs--decisions)
10. [Query Patterns Reference](#10-query-patterns-reference)

---

## 1. Design Principles

Before the schema, the rules that govern every table in it:

### 1.1 Normalization Level: 3NF with Intentional Denormalization

The schema targets **Third Normal Form (3NF)** as a baseline.  
Denormalization is applied **only** where it is explicitly justified by a query pattern — and documented in the trade-offs section.

Every denormalization that exists in this schema is intentional. There are no accidents.

### 1.2 No Soft Enum Columns

Columns that represent a fixed set of states use **PostgreSQL native ENUMs**, not VARCHAR with application-level enforcement. This guarantees invalid states cannot enter the database even if application-layer validation is bypassed.

```sql
CREATE TYPE pickup_status AS ENUM (
    'requested', 'assigned', 'in_progress', 'completed',
    'failed', 'cancelled', 'unassigned_no_availability'
);
```

### 1.3 Timestamps: Always UTC, Always Both

Every table carries:
- `created_at TIMESTAMPTZ DEFAULT NOW()` — immutable after insert
- `updated_at TIMESTAMPTZ DEFAULT NOW()` — updated by trigger on every row change

`TIMESTAMPTZ` (timestamp with time zone) stores UTC and returns in the session timezone. This is non-negotiable for a system that may expand to multiple time zones.

### 1.4 Primary Keys: BIGSERIAL for Performance

All tables use `BIGSERIAL` (auto-incrementing 64-bit integer) as the primary key.

**Why not UUID?**  
- B-Tree index fragmentation on UUID is a real problem at 1M+ rows due to random insert order
- BIGSERIAL is sequential, which means near-sequential disk writes — far more cache-friendly
- UUIDs are 16 bytes vs 8 bytes for BIGINT — matters in large join tables
- External exposure of IDs: The API layer adds a layer of indirection if needed (hashed IDs via `hashids`) — the database does not need to solve this problem

### 1.5 Referential Integrity at Database Level

All foreign keys are declared. `ON DELETE` behavior is explicitly chosen per relationship. No orphaned records are architecturally possible.

### 1.6 The Assignment Snapshot Rule

When an assignment is created, the **factor values** and **weights used at that moment** are snapshotted into the assignment record. This is critical for the learning loop — it needs to know what inputs produced what outcome, not what the current inputs are.

---

## 2. Entity Relationship Overview

### 2.1 Core Entity Groups

```
GROUP 1: IDENTITY
─────────────────
users
citizen_profiles
kabadiwala_profiles

GROUP 2: GEOGRAPHY
──────────────────
localities
scrap_rates

GROUP 3: COORDINATION (Core)
─────────────────────────────
pickup_requests
pickup_assignments
pickup_status_history   ← audit trail for every status change

GROUP 4: FINANCIALS
────────────────────
payment_records

GROUP 5: INTELLIGENCE
──────────────────────
learning_feedback
weight_configurations

GROUP 6: OPERATIONS
────────────────────
garbage_schedules
missed_garbage_pickups
notifications
system_configurations
```

### 2.2 High-Level ER Diagram (Textual)

```
localities ──────────────────────────────────────────────────────┐
    │                                                             │
    │ 1:N                                                         │
    ▼                                                             │
scrap_rates                                                       │
                                                                  │
users ──────────────────┬───────────────────────────┐            │
  │                     │                           │            │
  │ 1:1                 │ 1:1                       │            │
  ▼                     ▼                           │            │
citizen_profiles   kabadiwala_profiles              │            │
  │                     │                           │            │
  │                     │ locality FK               │            │
  │                     └──────────────────────────►│            │
  │                                                 │            │
  │ 1:N                                             │            │
  ▼                                                 │            │
pickup_requests ─────────────────────────────────── ┘            │
  │                                                              │
  │ locality FK ────────────────────────────────────────────────►┘
  │
  │ 1:1 (at most one active assignment per request)
  ▼
pickup_assignments
  │  ├── kabadiwala_id → users
  │  ├── factors_snapshot (JSONB)   ← distance, workload, reliability at assignment time
  │  └── weights_snapshot (JSONB)   ← w_d, w_w, w_r at assignment time
  │
  │ 1:1
  ▼
payment_records
  │
  └── assignment_id → pickup_assignments

pickup_status_history
  └── request_id → pickup_requests  (append-only audit log)

learning_feedback
  └── assignment_id → pickup_assignments

weight_configurations
  (standalone — tracks all weight versions, one is_active=true at any time)

notifications
  └── user_id → users
```

---

## 3. Schema — Complete DDL

```sql
-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('citizen', 'kabadiwala', 'admin');

CREATE TYPE pickup_status AS ENUM (
    'requested',
    'assigned',
    'in_progress',
    'completed',
    'failed',
    'cancelled',
    'unassigned_no_availability'
);

CREATE TYPE assignment_status AS ENUM (
    'assigned',
    'in_progress',
    'completed',
    'failed',
    'reassigned'
);

CREATE TYPE payment_status AS ENUM (
    'pending',
    'paid',
    'disputed',
    'cancelled'
);

CREATE TYPE waste_category AS ENUM ('plastic', 'paper', 'metal');

CREATE TYPE time_slot AS ENUM ('morning', 'afternoon', 'evening');

CREATE TYPE notification_type AS ENUM (
    'PICKUP_REQUESTED',
    'PICKUP_ASSIGNED',
    'PICKUP_STARTED',
    'PICKUP_COMPLETED',
    'PICKUP_FAILED',
    'PAYMENT_CREATED',
    'PAYMENT_CONFIRMED',
    'WEIGHTS_UPDATED',
    'MISSED_GARBAGE_REPORTED',
    'SYSTEM_ALERT'
);


-- ============================================================
-- FUNCTION: auto-update updated_at on row change
-- Applied via trigger to all mutable tables
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- TABLE 1: localities
-- ============================================================

CREATE TABLE localities (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(100)    NOT NULL,
    city                VARCHAR(100)    NOT NULL,
    state               VARCHAR(100)    NOT NULL    DEFAULT 'Karnataka',
    pincode             CHAR(6)         NOT NULL,
    latitude            DECIMAL(10, 7),
    longitude           DECIMAL(10, 7),
    is_serviceable      BOOLEAN         NOT NULL    DEFAULT false,
    max_daily_pickups   INTEGER         NOT NULL    DEFAULT 50,
    created_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),

    CONSTRAINT localities_pincode_name_uq UNIQUE (pincode, name),
    CONSTRAINT localities_pincode_format  CHECK (pincode ~ '^\d{6}$'),
    CONSTRAINT localities_lat_range       CHECK (latitude  BETWEEN -90  AND 90),
    CONSTRAINT localities_lng_range       CHECK (longitude BETWEEN -180 AND 180),
    CONSTRAINT localities_max_daily_pos   CHECK (max_daily_pickups > 0)
);

CREATE TRIGGER set_localities_updated_at
    BEFORE UPDATE ON localities
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================
-- TABLE 2: users
-- ============================================================

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    phone_number    CHAR(10)        NOT NULL    UNIQUE,
    name            VARCHAR(150),
    role            user_role       NOT NULL,
    is_active       BOOLEAN         NOT NULL    DEFAULT true,
    created_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),

    CONSTRAINT users_phone_format CHECK (phone_number ~ '^\d{10}$')
);

CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Prevent role change via UPDATE at DB level
-- Role immutability enforced by application layer AND this trigger
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        RAISE EXCEPTION 'User role cannot be changed after assignment. '
                        'Current role: %. Attempted: %', OLD.role, NEW.role;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_role_immutability
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION prevent_role_change();


-- ============================================================
-- TABLE 3: citizen_profiles
-- ============================================================

CREATE TABLE citizen_profiles (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT          NOT NULL    UNIQUE
                            REFERENCES users(id) ON DELETE CASCADE,
    locality_id         BIGINT
                            REFERENCES localities(id) ON DELETE SET NULL,
    address_line1       VARCHAR(255),
    address_line2       VARCHAR(255),
    landmark            VARCHAR(255),
    preferred_language  VARCHAR(20)     NOT NULL    DEFAULT 'english',
    latitude            DECIMAL(10, 7),
    longitude           DECIMAL(10, 7),
    created_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),

    CONSTRAINT cp_preferred_language_chk CHECK (
        preferred_language IN ('english', 'hindi', 'kannada', 'tamil', 'telugu')
    )
);

CREATE TRIGGER set_citizen_profiles_updated_at
    BEFORE UPDATE ON citizen_profiles
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================
-- TABLE 4: kabadiwala_profiles
-- ============================================================

CREATE TABLE kabadiwala_profiles (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 BIGINT          NOT NULL    UNIQUE
                                REFERENCES users(id) ON DELETE CASCADE,
    service_locality_id     BIGINT
                                REFERENCES localities(id) ON DELETE SET NULL,
    is_available            BOOLEAN         NOT NULL    DEFAULT true,
    vehicle_type            VARCHAR(50),
    -- Denormalized counters: updated atomically with assignment operations
    -- Avoids expensive COUNT(*) on pickup_assignments in hot paths
    total_pickups           INTEGER         NOT NULL    DEFAULT 0,
    completed_pickups       INTEGER         NOT NULL    DEFAULT 0,
    -- Reliability score: recomputed by background job, cached here for assignment scoring
    reliability_score       DECIMAL(4, 3)   NOT NULL    DEFAULT 0.000
                                CHECK (reliability_score BETWEEN 0.000 AND 1.000),
    -- Last known GPS coordinates (updated when kabadiwala starts a pickup)
    last_known_lat          DECIMAL(10, 7),
    last_known_lng          DECIMAL(10, 7),
    last_location_at        TIMESTAMPTZ,
    created_at              TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),

    CONSTRAINT kp_total_gte_completed CHECK (total_pickups >= completed_pickups),
    CONSTRAINT kp_total_non_negative  CHECK (total_pickups >= 0),
    CONSTRAINT kp_completed_non_neg   CHECK (completed_pickups >= 0)
);

CREATE TRIGGER set_kabadiwala_profiles_updated_at
    BEFORE UPDATE ON kabadiwala_profiles
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================
-- TABLE 5: scrap_rates
-- ============================================================

CREATE TABLE scrap_rates (
    id              BIGSERIAL PRIMARY KEY,
    locality_id     BIGINT          NOT NULL
                        REFERENCES localities(id) ON DELETE CASCADE,
    category        waste_category  NOT NULL,
    rate_per_kg     DECIMAL(8, 2)   NOT NULL,
    effective_date  DATE            NOT NULL    DEFAULT CURRENT_DATE,
    set_by_admin_id BIGINT          NOT NULL
                        REFERENCES users(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),

    -- Only one active rate per locality+category combination at a time
    -- "Active" = latest by effective_date
    CONSTRAINT scrap_rates_rate_positive CHECK (rate_per_kg > 0),
    CONSTRAINT scrap_rates_locality_category_date_uq
        UNIQUE (locality_id, category, effective_date)
);

-- Note: No updated_at on scrap_rates — rates are immutable once created.
-- A new rate record supersedes old ones. This preserves rate history.


-- ============================================================
-- TABLE 6: pickup_requests
-- ============================================================

CREATE TABLE pickup_requests (
    id                  BIGSERIAL PRIMARY KEY,
    citizen_id          BIGINT          NOT NULL
                            REFERENCES users(id) ON DELETE RESTRICT,
    locality_id         BIGINT          NOT NULL
                            REFERENCES localities(id) ON DELETE RESTRICT,
    category            waste_category  NOT NULL,
    estimated_weight    DECIMAL(6, 2)   NOT NULL,
    pickup_address      TEXT            NOT NULL,
    landmark            VARCHAR(255),
    preferred_date      DATE            NOT NULL,
    preferred_time_slot time_slot       NOT NULL    DEFAULT 'morning',
    notes               TEXT,
    -- Coordinates captured at request creation (citizen's address)
    pickup_lat          DECIMAL(10, 7),
    pickup_lng          DECIMAL(10, 7),
    status              pickup_status   NOT NULL    DEFAULT 'requested',
    -- Snapshot of the scrap rate at time of request (for payment reference)
    rate_per_kg_at_request  DECIMAL(8, 2)   NOT NULL,
    created_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),

    CONSTRAINT pr_estimated_weight_pos   CHECK (estimated_weight > 0),
    CONSTRAINT pr_estimated_weight_max   CHECK (estimated_weight <= 500),
    CONSTRAINT pr_preferred_date_future  CHECK (preferred_date >= CURRENT_DATE),
    -- Prevent citizen from having more than 1 pending/assigned request for the same date
    -- Enforced in application layer; partial index here acts as second line of defence
    CONSTRAINT pr_rate_per_kg_positive   CHECK (rate_per_kg_at_request > 0)
);

CREATE TRIGGER set_pickup_requests_updated_at
    BEFORE UPDATE ON pickup_requests
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Partial unique index: a citizen cannot have two active requests for the same date
-- 'Active' = not cancelled or failed
CREATE UNIQUE INDEX idx_pr_citizen_date_active
    ON pickup_requests (citizen_id, preferred_date)
    WHERE status NOT IN ('cancelled', 'failed');


-- ============================================================
-- TABLE 7: pickup_assignments
-- ============================================================

CREATE TABLE pickup_assignments (
    id                  BIGSERIAL PRIMARY KEY,
    request_id          BIGINT          NOT NULL    UNIQUE
                            REFERENCES pickup_requests(id) ON DELETE RESTRICT,
    kabadiwala_id       BIGINT          NOT NULL
                            REFERENCES users(id) ON DELETE RESTRICT,
    assigned_date       DATE            NOT NULL,
    sequence_order      INTEGER         NOT NULL    DEFAULT 1,
    status              assignment_status   NOT NULL    DEFAULT 'assigned',
    -- Assignment engine scoring data (snapshot at time of assignment)
    -- Stored as JSONB for flexibility — fields: distance_km, workload_count, reliability_score,
    -- distance_score, workload_score, final_score
    factors_snapshot    JSONB           NOT NULL    DEFAULT '{}',
    -- Weights active at time of assignment
    -- Fields: w_distance, w_workload, w_reliability, weight_config_id
    weights_snapshot    JSONB           NOT NULL    DEFAULT '{}',
    -- Assignment source: 'auto' (engine) or 'manual' (admin override)
    assigned_by         VARCHAR(20)     NOT NULL    DEFAULT 'auto'
                            CHECK (assigned_by IN ('auto', 'manual')),
    admin_note          TEXT,           -- Populated only when assigned_by = 'manual'
    -- Completion data (populated when kabadiwala completes)
    actual_weight       DECIMAL(6, 2)
                            CHECK (actual_weight > 0 AND actual_weight <= 500),
    completion_photo_url    TEXT,
    completed_at        TIMESTAMPTZ,
    -- Failure data
    failure_reason      TEXT,
    failed_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),

    CONSTRAINT pa_sequence_positive     CHECK (sequence_order > 0),
    -- Ensure completed_at is set when status = completed
    CONSTRAINT pa_completed_at_required CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed')
    ),
    -- Ensure actual_weight is set when status = completed
    CONSTRAINT pa_weight_required_on_complete CHECK (
        (status = 'completed' AND actual_weight IS NOT NULL) OR
        (status != 'completed')
    )
);

CREATE TRIGGER set_pickup_assignments_updated_at
    BEFORE UPDATE ON pickup_assignments
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Prevent a kabadiwala from being assigned more than max_daily_pickups in one day
-- This cannot be a table constraint — enforced in application service layer
-- Index below optimises the COUNT(*) query used in that check
CREATE INDEX idx_pa_kabadiwala_date
    ON pickup_assignments (kabadiwala_id, assigned_date)
    WHERE status NOT IN ('failed', 'reassigned');


-- ============================================================
-- TABLE 8: pickup_status_history
-- Append-only audit log. Never updated, never deleted.
-- ============================================================

CREATE TABLE pickup_status_history (
    id              BIGSERIAL PRIMARY KEY,
    request_id      BIGINT          NOT NULL
                        REFERENCES pickup_requests(id) ON DELETE RESTRICT,
    from_status     pickup_status,      -- NULL for initial insert
    to_status       pickup_status   NOT NULL,
    changed_by_id   BIGINT              -- NULL for system-triggered changes
                        REFERENCES users(id) ON DELETE SET NULL,
    changed_by_role user_role,
    reason          TEXT,
    metadata        JSONB           DEFAULT '{}',
    created_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW()
    -- No updated_at: this table is append-only
);

-- This trigger fires on every pickup_requests status update
-- and writes to pickup_status_history automatically
CREATE OR REPLACE FUNCTION log_pickup_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO pickup_status_history (
            request_id, from_status, to_status, changed_by_role
        ) VALUES (
            NEW.id, OLD.status, NEW.status, NULL
            -- changed_by_id populated at application layer when context is available
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER capture_pickup_status_change
    AFTER UPDATE ON pickup_requests
    FOR EACH ROW EXECUTE FUNCTION log_pickup_status_change();


-- ============================================================
-- TABLE 9: payment_records
-- ============================================================

CREATE TABLE payment_records (
    id                  BIGSERIAL PRIMARY KEY,
    assignment_id       BIGINT          NOT NULL    UNIQUE
                            REFERENCES pickup_assignments(id) ON DELETE RESTRICT,
    citizen_id          BIGINT          NOT NULL
                            REFERENCES users(id) ON DELETE RESTRICT,
    kabadiwala_id       BIGINT          NOT NULL
                            REFERENCES users(id) ON DELETE RESTRICT,
    -- Calculated at completion time: actual_weight × rate_per_kg_at_request
    amount              DECIMAL(10, 2)  NOT NULL,
    status              payment_status  NOT NULL    DEFAULT 'pending',
    -- UPI reference entered by citizen after paying
    upi_reference       VARCHAR(100),
    paid_at             TIMESTAMPTZ,
    -- Dispute fields
    dispute_reason      TEXT,
    dispute_raised_at   TIMESTAMPTZ,
    dispute_resolved_at TIMESTAMPTZ,
    resolved_by_id      BIGINT
                            REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),

    CONSTRAINT pr_amount_positive       CHECK (amount > 0),
    CONSTRAINT pr_paid_at_on_paid       CHECK (
        (status = 'paid' AND paid_at IS NOT NULL) OR
        (status != 'paid')
    ),
    CONSTRAINT pr_upi_on_paid           CHECK (
        (status = 'paid' AND upi_reference IS NOT NULL) OR
        (status != 'paid')
    )
);

CREATE TRIGGER set_payment_records_updated_at
    BEFORE UPDATE ON payment_records
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================
-- TABLE 10: learning_feedback
-- ============================================================

CREATE TABLE learning_feedback (
    id              BIGSERIAL PRIMARY KEY,
    assignment_id   BIGINT          NOT NULL    UNIQUE
                        REFERENCES pickup_assignments(id) ON DELETE RESTRICT,
    -- Outcome classification (populated at pickup completion or failure)
    outcome         VARCHAR(30)     NOT NULL
                        CHECK (outcome IN ('completed_on_time', 'completed_late',
                                          'failed_kabadiwala', 'failed_citizen',
                                          'cancelled')),
    -- Delay in minutes (negative = early, positive = late, NULL = not applicable)
    delay_minutes   INTEGER,
    -- Citizen's rating for this pickup (1-5, optional)
    citizen_rating  SMALLINT
                        CHECK (citizen_rating BETWEEN 1 AND 5),
    -- Computed outcome score used in gradient calculation
    -- +1.0 = successful, +0.5 = partial, -1.0 = failure
    outcome_score   DECIMAL(3, 1)   NOT NULL
                        CHECK (outcome_score IN (1.0, 0.5, -1.0)),
    -- Whether this record has been consumed by a learning loop run
    processed       BOOLEAN         NOT NULL    DEFAULT false,
    processed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW()
);

-- Index for learning loop batch fetch
CREATE INDEX idx_lf_unprocessed
    ON learning_feedback (created_at)
    WHERE processed = false;


-- ============================================================
-- TABLE 11: weight_configurations
-- One row per learning iteration. One row has is_active = true.
-- ============================================================

CREATE TABLE weight_configurations (
    id                  BIGSERIAL PRIMARY KEY,
    w_distance          DECIMAL(4, 3)   NOT NULL
                            CHECK (w_distance  BETWEEN 0.100 AND 0.600),
    w_workload          DECIMAL(4, 3)   NOT NULL
                            CHECK (w_workload  BETWEEN 0.100 AND 0.600),
    w_reliability       DECIMAL(4, 3)   NOT NULL
                            CHECK (w_reliability BETWEEN 0.100 AND 0.600),
    -- Weights must sum to 1.0 (enforced to 3 decimal precision)
    is_active           BOOLEAN         NOT NULL    DEFAULT false,
    -- How these weights were set
    source              VARCHAR(30)     NOT NULL    DEFAULT 'learning_loop'
                            CHECK (source IN ('initial', 'learning_loop', 'admin_override')),
    -- Performance metrics that justified this update
    metrics_snapshot    JSONB           NOT NULL    DEFAULT '{}',
    -- Simulated improvement % over previous weights
    improvement_pct     DECIMAL(5, 2),
    set_by_admin_id     BIGINT              -- Populated only for admin_override
                            REFERENCES users(id) ON DELETE SET NULL,
    admin_note          TEXT,
    effective_from      TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    created_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),

    CONSTRAINT wc_weights_sum CHECK (
        ROUND(w_distance + w_workload + w_reliability, 3) = 1.000
    )
);

-- Enforce only one active weight configuration at any time
CREATE UNIQUE INDEX idx_wc_single_active
    ON weight_configurations (is_active)
    WHERE is_active = true;

-- Seed: initial equal-weight configuration
INSERT INTO weight_configurations
    (w_distance, w_workload, w_reliability, is_active, source,
     metrics_snapshot, improvement_pct)
VALUES
    (0.333, 0.334, 0.333, true, 'initial', '{}', NULL);


-- ============================================================
-- TABLE 12: garbage_schedules
-- ============================================================

CREATE TABLE garbage_schedules (
    id                  BIGSERIAL PRIMARY KEY,
    locality_id         BIGINT          NOT NULL
                            REFERENCES localities(id) ON DELETE CASCADE,
    collection_day      VARCHAR(10)     NOT NULL
                            CHECK (collection_day IN (
                                'monday','tuesday','wednesday','thursday',
                                'friday','saturday','sunday'
                            )),
    time_window_start   TIME            NOT NULL,
    time_window_end     TIME            NOT NULL,
    is_active           BOOLEAN         NOT NULL    DEFAULT true,
    created_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),

    CONSTRAINT gs_time_window_valid     CHECK (time_window_end > time_window_start),
    CONSTRAINT gs_locality_day_uq       UNIQUE (locality_id, collection_day)
);

CREATE TRIGGER set_garbage_schedules_updated_at
    BEFORE UPDATE ON garbage_schedules
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================
-- TABLE 13: missed_garbage_pickups
-- ============================================================

CREATE TABLE missed_garbage_pickups (
    id              BIGSERIAL PRIMARY KEY,
    locality_id     BIGINT          NOT NULL
                        REFERENCES localities(id) ON DELETE CASCADE,
    schedule_id     BIGINT
                        REFERENCES garbage_schedules(id) ON DELETE SET NULL,
    reported_by_id  BIGINT          NOT NULL
                        REFERENCES users(id) ON DELETE RESTRICT,
    scheduled_date  DATE            NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW()
);


-- ============================================================
-- TABLE 14: notifications
-- ============================================================

CREATE TABLE notifications (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT          NOT NULL
                        REFERENCES users(id) ON DELETE CASCADE,
    type            notification_type   NOT NULL,
    title           VARCHAR(200)    NOT NULL,
    body            TEXT            NOT NULL,
    -- Flexible reference to the related entity
    entity_type     VARCHAR(50),    -- e.g., 'pickup_request', 'payment_record'
    entity_id       BIGINT,
    is_read         BOOLEAN         NOT NULL    DEFAULT false,
    read_at         TIMESTAMPTZ,
    -- SMS delivery status (null if in-app only)
    sms_sent        BOOLEAN         NOT NULL    DEFAULT false,
    sms_sent_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW()
);

-- Fetch unread notifications for a user efficiently
CREATE INDEX idx_notif_user_unread
    ON notifications (user_id, created_at DESC)
    WHERE is_read = false;


-- ============================================================
-- TABLE 15: system_configurations
-- Key-value store for admin-configurable system parameters
-- ============================================================

CREATE TABLE system_configurations (
    key             VARCHAR(100)    PRIMARY KEY,
    value           TEXT            NOT NULL,
    description     TEXT,
    updated_by_id   BIGINT
                        REFERENCES users(id) ON DELETE SET NULL,
    updated_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW()
);

-- Seed: default configurations
INSERT INTO system_configurations (key, value, description) VALUES
    ('max_daily_pickups_per_kabadiwala', '10',
        'Maximum pickups assignable to one kabadiwala per day'),
    ('otp_expiry_seconds', '300',
        'OTP validity window in seconds'),
    ('otp_max_attempts', '5',
        'Maximum failed OTP attempts before lockout'),
    ('otp_lockout_seconds', '900',
        'Duration of lockout after max failed OTP attempts'),
    ('learning_loop_enabled', 'true',
        'Toggle to disable the learning loop without code changes'),
    ('learning_rate_alpha', '0.05',
        'Gradient descent learning rate for weight updates'),
    ('learning_min_improvement_pct', '5.0',
        'Minimum improvement % required to accept new weights'),
    ('assignment_max_distance_km', '10.0',
        'Maximum distance (km) to consider a kabadiwala for assignment'),
    ('pickup_advance_booking_days', '7',
        'Maximum days in advance a pickup can be requested');
```

---

## 4. Table-by-Table Breakdown

### TABLE 1: `localities`

**Why it exists:**  
The system is locality-first, not city-first. Scrap rates, Kabadiwala availability, and garbage schedules are all scoped to a locality. This enables independent configuration per neighborhood without code changes.

**Key design choices:**
- `is_serviceable` flag means a locality can exist in the DB before service launches there. Admin can toggle it to `true` when ready.
- `max_daily_pickups` is a configurable cap per locality — prevents overloading a small area.
- `latitude`/`longitude` represent the centroid of the locality. Used by the assignment engine when a Kabadiwala's precise location is unavailable — falls back to locality centroid distance.

**What it does NOT store:**  
Individual address coordinates. Those live on `citizen_profiles` and `pickup_requests`.

---

### TABLE 2: `users`

**Why it exists:**  
Single identity store. Every actor in the system — citizen, kabadiwala, admin — has one row here. Role-specific data is separated into profile tables.

**Key design choices:**
- `phone_number CHAR(10) UNIQUE` — 10-digit Indian mobile number. `CHAR` (fixed-length) not `VARCHAR` because we know the exact length.
- `role user_role NOT NULL` — assigned at signup, enforced immutable by DB trigger.
- `is_active BOOLEAN` — soft disable without deleting. Deleted users would violate foreign key constraints in pickup history.
- `name` is nullable — a user can authenticate before providing their name.

**Role immutability trigger:**
```sql
-- Defined in DDL above — raises EXCEPTION if role changes
CREATE TRIGGER enforce_role_immutability
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION prevent_role_change();
```

---

### TABLE 3: `citizen_profiles`

**Why it exists:**  
Separates citizen-specific attributes from the shared identity in `users`. `users` stays lean and role-agnostic. `citizen_profiles` owns address, locality preference, and coordinates.

**Key design choices:**
- `UNIQUE` on `user_id` — one citizen profile per user, enforced at DB level.
- `locality_id` is nullable (SET NULL on locality delete) — a citizen without a locality can still exist; the app guides them to select one before requesting a pickup.
- `latitude`/`longitude` — citizen's home coordinates for more precise distance calculation than using the locality centroid. Populated when citizen grants browser geolocation permission.
- `preferred_language` — drives UI language selection on next login. Checked against a list of supported languages.

---

### TABLE 4: `kabadiwala_profiles`

**Why it exists:**  
Kabadiwala-specific operational data. This table is read in the **hot path** of every assignment decision, so it is deliberately denormalized with counter columns.

**Key design choices:**
- `total_pickups` and `completed_pickups` are **denormalized counters**. They are incremented atomically within the same transaction as assignment creation/completion. This avoids `COUNT(*)` on `pickup_assignments` in the assignment engine's scoring loop, which would be expensive when scoring 20+ kabadiwalas simultaneously.
- `reliability_score` is also denormalized — recomputed by the learning background job and cached here. The assignment engine reads `reliability_score` directly rather than computing `completed/total` at query time.
- `last_known_lat`/`last_known_lng` + `last_location_at` — updated when a kabadiwala marks a pickup as in-progress. Used as the distance input in the assignment engine. If stale (> 4 hours), falls back to service locality centroid.
- `is_available` — kabadiwala can toggle this off when taking a day off. Assignment engine excludes all kabadiwalas where `is_available = false`.

**Counter integrity constraint:**
```sql
CONSTRAINT kp_total_gte_completed CHECK (total_pickups >= completed_pickups)
```

---

### TABLE 5: `scrap_rates`

**Why it exists:**  
Scrap prices change daily based on market conditions. This table keeps a full history of every rate change, per locality, per category. The current rate is always the one with the latest `effective_date`.

**Key design choices:**
- Rates are **immutable once inserted**. No `UPDATE` ever touches this table. A new rate for the same locality+category supersedes the old one by having a later `effective_date`.
- `UNIQUE (locality_id, category, effective_date)` — prevents duplicate rate entries for the same day.
- `set_by_admin_id` — full auditability. Every rate change is attributed to the admin who made it.
- `rate_per_kg_at_request` is snapshotted into `pickup_requests` at request creation — the citizen sees the rate that was in effect when they submitted, not a later rate.

**Current rate query:**
```sql
SELECT DISTINCT ON (locality_id, category)
    locality_id, category, rate_per_kg, effective_date
FROM scrap_rates
WHERE locality_id = $1
  AND effective_date <= CURRENT_DATE
ORDER BY locality_id, category, effective_date DESC;
```

---

### TABLE 6: `pickup_requests`

**Why it exists:**  
The central entity. Every citizen interaction ultimately creates or queries a pickup request. This is the highest-traffic table in the system.

**Key design choices:**
- `status pickup_status` — PostgreSQL ENUM. Invalid states are impossible to insert.
- `rate_per_kg_at_request DECIMAL(8,2)` — snapshot of the scrap rate at request time. Critical for payment calculation: the rate cannot change retroactively on the citizen.
- `pickup_lat`/`pickup_lng` — captured at request creation if citizen allows geolocation. Used by assignment engine for precise distance calculation. If null, falls back to `citizen_profiles` coordinates, then to locality centroid.
- Partial unique index:
  ```sql
  CREATE UNIQUE INDEX idx_pr_citizen_date_active
      ON pickup_requests (citizen_id, preferred_date)
      WHERE status NOT IN ('cancelled', 'failed');
  ```
  This enforces the business rule: **one active pickup per citizen per day**. A cancelled request does not block the citizen from requesting again for the same date. This cannot be a regular UNIQUE constraint because it needs to ignore certain status values — only a partial index achieves this in PostgreSQL.
- `preferred_date >= CURRENT_DATE` constraint prevents backdated requests. **Important caveat:** `CURRENT_DATE` is evaluated at insert time in PostgreSQL. A request made at 11:59 PM for "today" is valid; this is an accepted edge case.

---

### TABLE 7: `pickup_assignments`

**Why it exists:**  
Separates the act of requesting (citizen) from the act of assigning (system/admin). A pickup request can exist without an assignment (status: `requested` or `unassigned_no_availability`). One request maps to exactly one non-reassigned assignment at any time.

**Key design choices:**
- `UNIQUE` on `request_id` — enforced at DB level. One assignment per request. If reassignment is needed (failure case), the old assignment is marked `status = 'reassigned'` and a new one is inserted. The UNIQUE constraint does NOT block this because the old row is updated before the new one is inserted.
- `factors_snapshot JSONB` — records the exact inputs the assignment engine used. Format:
  ```json
  {
    "distance_km": 1.2,
    "distance_score": 0.455,
    "workload_count": 3,
    "workload_score": 0.700,
    "reliability_score": 0.967,
    "final_score": 0.691
  }
  ```
  This snapshot is what the learning loop reads to correlate inputs with outcomes.
- `weights_snapshot JSONB` — records the active weights at assignment time:
  ```json
  {
    "w_distance": 0.333,
    "w_workload": 0.334,
    "w_reliability": 0.333,
    "weight_config_id": 1
  }
  ```
- `assigned_by` — distinguishes engine-driven from admin-override assignments. This matters for learning loop data quality: manual overrides are excluded from learning feedback because they represent human judgment, not engine decisions.
- Completion constraints:
  ```sql
  CONSTRAINT pa_completed_at_required CHECK (
      (status = 'completed' AND completed_at IS NOT NULL) OR (status != 'completed')
  )
  ```
  PostgreSQL will reject any attempt to mark an assignment complete without setting `completed_at`. Same for `actual_weight`.

---

### TABLE 8: `pickup_status_history`

**Why it exists:**  
Dispute resolution, audit, debugging, and analytics all require knowing the exact sequence of state transitions for every pickup. The `pickup_requests.status` column only shows the current state. This table shows the complete history.

**Key design choices:**
- **Append-only.** No `UPDATE`, no `DELETE`, ever. Enforced by:
  1. No `UPDATE` permission granted to the application DB user on this table
  2. A trigger on `pickup_requests` that auto-populates this table on every status change (see DDL)
  3. Application layer never calls an UPDATE on `pickup_status_history` directly
- `changed_by_id` is nullable — system-triggered changes (auto-assignment engine) do not have a human user ID. In that case, `changed_by_role = NULL`.
- `metadata JSONB` — flexible field for context. Example: `{ "failure_reason": "citizen_not_available", "kabadiwala_id": 5 }`.

---

### TABLE 9: `payment_records`

**Why it exists:**  
Separates financial tracking from the coordination workflow. A payment record is created automatically when a pickup is completed — the amount is calculated from `actual_weight × rate_per_kg_at_request` (from `pickup_requests`).

**Key design choices:**
- `citizen_id` and `kabadiwala_id` are both stored here despite being derivable from `pickup_assignments → pickup_requests`. This is intentional denormalization — financial queries (citizen payment history, kabadiwala earnings) should not require multi-hop joins.
- `upi_reference` — citizen-entered UPI transaction ID after paying. Currently unverified (manual trust system in MVP). Phase 2: UPI webhook verification.
- Constraint ensures `upi_reference IS NOT NULL` when `status = 'paid'` — prevents accidentally marking a payment as paid without a reference.
- Dispute flow is self-contained: `dispute_reason`, `dispute_raised_at`, `dispute_resolved_at`, `resolved_by_id` — all in the same table. No separate dispute table needed at MVP scale.

---

### TABLE 10: `learning_feedback`

**Why it exists:**  
This is the training data for the assignment engine. Every completed or failed assignment generates exactly one feedback record. The learning loop batch-processes these records weekly.

**Key design choices:**
- `UNIQUE` on `assignment_id` — one feedback record per assignment, guaranteed.
- `outcome_score DECIMAL(3,1) CHECK IN (1.0, 0.5, -1.0)` — three discrete values only. The scoring rubric is:
  - `+1.0` → Completed on time, rating ≥ 3.5
  - `+0.5` → Completed late OR rating < 3.5
  - `-1.0` → Not completed (failure, cancellation)
- `processed BOOLEAN DEFAULT false` — the learning loop marks records as processed after consuming them. The partial index on `processed = false` makes the learning loop's batch fetch fast.
- Manual assignment rows (`assigned_by = 'manual'`) are **excluded** from learning feedback. They are created in `pickup_assignments` but no corresponding `learning_feedback` row is inserted. The application layer enforces this in `assignment.service.js`.

---

### TABLE 11: `weight_configurations`

**Why it exists:**  
Every version of the assignment weights must be recorded — for auditability, for rollback, and for the admin to understand how the system has evolved over time. This is not just a config table; it is a versioned history.

**Key design choices:**
- `is_active BOOLEAN` with a partial unique index:
  ```sql
  CREATE UNIQUE INDEX idx_wc_single_active
      ON weight_configurations (is_active)
      WHERE is_active = true;
  ```
  This enforces that **at most one row can have `is_active = true`** at any time. It's impossible to accidentally activate two weight configurations simultaneously.
- `CONSTRAINT wc_weights_sum CHECK (ROUND(w_distance + w_workload + w_reliability, 3) = 1.000)` — weights must always sum to 1.0, enforced at DB level.
- `source VARCHAR CHECK IN ('initial', 'learning_loop', 'admin_override')` — the learning loop's updates are distinguishable from admin manual overrides in the history.
- `metrics_snapshot JSONB` — records performance metrics at the time of the update:
  ```json
  {
    "pickups_analyzed": 147,
    "success_rate_before": 0.82,
    "success_rate_after_simulated": 0.89,
    "avg_delay_before": 23.4,
    "avg_delay_after_simulated": 18.1
  }
  ```

---

### TABLES 12–15: Operational Tables

**`garbage_schedules`:** Municipality collection schedule per locality per day. Citizens view these to know when to put waste out. Separate from the platform's pickup coordination.

**`missed_garbage_pickups`:** Citizen-reported missed municipal collections. Aggregate data here can be shared with municipal authorities. One practical civic engagement feature.

**`notifications`:** In-app notification log. Also tracks SMS delivery status per notification. The `entity_type`/`entity_id` pattern (polymorphic reference without FK) allows notifications to point to any entity without coupling the table to specific foreign keys.

**`system_configurations`:** Key-value store for admin-tunable parameters (learning rate, max pickups per day, OTP expiry, etc.). Avoids hardcoding constants in application code or `.env` files for operational parameters that change at runtime.

---

## 5. Relationship Map

### 5.1 Foreign Key Summary

| Table | Foreign Key Column | References | On Delete |
|---|---|---|---|
| `citizen_profiles` | `user_id` | `users.id` | CASCADE |
| `citizen_profiles` | `locality_id` | `localities.id` | SET NULL |
| `kabadiwala_profiles` | `user_id` | `users.id` | CASCADE |
| `kabadiwala_profiles` | `service_locality_id` | `localities.id` | SET NULL |
| `scrap_rates` | `locality_id` | `localities.id` | CASCADE |
| `scrap_rates` | `set_by_admin_id` | `users.id` | RESTRICT |
| `pickup_requests` | `citizen_id` | `users.id` | RESTRICT |
| `pickup_requests` | `locality_id` | `localities.id` | RESTRICT |
| `pickup_assignments` | `request_id` | `pickup_requests.id` | RESTRICT |
| `pickup_assignments` | `kabadiwala_id` | `users.id` | RESTRICT |
| `pickup_status_history` | `request_id` | `pickup_requests.id` | RESTRICT |
| `pickup_status_history` | `changed_by_id` | `users.id` | SET NULL |
| `payment_records` | `assignment_id` | `pickup_assignments.id` | RESTRICT |
| `payment_records` | `citizen_id` | `users.id` | RESTRICT |
| `payment_records` | `kabadiwala_id` | `users.id` | RESTRICT |
| `payment_records` | `resolved_by_id` | `users.id` | SET NULL |
| `learning_feedback` | `assignment_id` | `pickup_assignments.id` | RESTRICT |
| `weight_configurations` | `set_by_admin_id` | `users.id` | SET NULL |
| `garbage_schedules` | `locality_id` | `localities.id` | CASCADE |
| `missed_garbage_pickups` | `locality_id` | `localities.id` | CASCADE |
| `missed_garbage_pickups` | `schedule_id` | `garbage_schedules.id` | SET NULL |
| `missed_garbage_pickups` | `reported_by_id` | `users.id` | RESTRICT |
| `notifications` | `user_id` | `users.id` | CASCADE |
| `system_configurations` | `updated_by_id` | `users.id` | SET NULL |

### 5.2 ON DELETE Behavior Rationale

| Behavior | Applied When |
|---|---|
| `CASCADE` | Child data has no independent meaning without the parent (notification without a user; garbage schedule without a locality) |
| `RESTRICT` | Deletion must be blocked because child records represent real-world events that must be preserved for audit/legal reasons (pickup requests, payment records, status history) |
| `SET NULL` | Parent deletion is possible but child should be retained with a null reference (who set a rate vs. the rate itself; who resolved a dispute vs. the dispute record) |

**Why `RESTRICT` on pickup and payment tables:**  
A kabadiwala or citizen account is never truly deleted in this system. `is_active = false` is the "deletion" operation. Physical deletion of a `users` row would cascade-fail because `pickup_requests`, `pickup_assignments`, and `payment_records` all `RESTRICT` on user deletion. This is intentional — financial records must be preserved even if a user deactivates.

---

## 6. Indexing Strategy

### 6.1 Index Inventory

```sql
-- ─────────────────────────────────────────────────
-- TABLE: pickup_requests
-- ─────────────────────────────────────────────────

-- Hot path: citizen fetching their own requests
CREATE INDEX idx_pr_citizen_id
    ON pickup_requests (citizen_id, created_at DESC);

-- Hot path: admin pending queue + assignment engine fetching requests by locality
CREATE INDEX idx_pr_locality_date_status
    ON pickup_requests (locality_id, preferred_date, status);

-- Partial unique: one active request per citizen per day (described above)
CREATE UNIQUE INDEX idx_pr_citizen_date_active
    ON pickup_requests (citizen_id, preferred_date)
    WHERE status NOT IN ('cancelled', 'failed');

-- Analytics: status distribution over time
CREATE INDEX idx_pr_status_created
    ON pickup_requests (status, created_at);


-- ─────────────────────────────────────────────────
-- TABLE: pickup_assignments
-- ─────────────────────────────────────────────────

-- Hot path: kabadiwala's daily queue
CREATE INDEX idx_pa_kabadiwala_date
    ON pickup_assignments (kabadiwala_id, assigned_date)
    WHERE status NOT IN ('failed', 'reassigned');

-- Used by assignment engine: count kabadiwala's active assignments for a date
-- (Same index above also serves this query)

-- Admin assignment oversight
CREATE INDEX idx_pa_status_date
    ON pickup_assignments (status, assigned_date);


-- ─────────────────────────────────────────────────
-- TABLE: pickup_status_history
-- ─────────────────────────────────────────────────

-- Lookup full history for a specific request
CREATE INDEX idx_psh_request_id
    ON pickup_status_history (request_id, created_at ASC);


-- ─────────────────────────────────────────────────
-- TABLE: payment_records
-- ─────────────────────────────────────────────────

-- Citizen payment history
CREATE INDEX idx_pay_citizen_id
    ON payment_records (citizen_id, created_at DESC);

-- Kabadiwala earnings query
CREATE INDEX idx_pay_kabadiwala_date
    ON payment_records (kabadiwala_id, created_at DESC);

-- Admin: pending payment monitoring
CREATE INDEX idx_pay_status
    ON payment_records (status)
    WHERE status IN ('pending', 'disputed');


-- ─────────────────────────────────────────────────
-- TABLE: scrap_rates
-- ─────────────────────────────────────────────────

-- Current rate lookup (locality + category → latest by date)
CREATE INDEX idx_sr_locality_category_date
    ON scrap_rates (locality_id, category, effective_date DESC);


-- ─────────────────────────────────────────────────
-- TABLE: kabadiwala_profiles
-- ─────────────────────────────────────────────────

-- Assignment engine: fetch available kabadiwalas in a locality
CREATE INDEX idx_kp_locality_available
    ON kabadiwala_profiles (service_locality_id, is_available)
    WHERE is_available = true;


-- ─────────────────────────────────────────────────
-- TABLE: learning_feedback
-- ─────────────────────────────────────────────────

-- Learning loop batch fetch
CREATE INDEX idx_lf_unprocessed
    ON learning_feedback (created_at)
    WHERE processed = false;


-- ─────────────────────────────────────────────────
-- TABLE: notifications
-- ─────────────────────────────────────────────────

-- Unread notification count + list for a user
CREATE INDEX idx_notif_user_unread
    ON notifications (user_id, created_at DESC)
    WHERE is_read = false;
```

### 6.2 Index Design Rationale

**Partial indexes are used aggressively.** PostgreSQL partial indexes only index rows that satisfy a `WHERE` clause. This means:

- `idx_pr_citizen_date_active` does not index cancelled/failed requests — the most common states for historical records. The index stays small and fast.
- `idx_pa_kabadiwala_date` excludes failed/reassigned assignments — the assignment engine only needs to count active assignments.
- `idx_kp_locality_available` only indexes available Kabadiwalas — excludes those who are off.
- `idx_lf_unprocessed` only indexes unprocessed feedback — shrinks as the learning loop runs.
- `idx_pay_status` only indexes pending/disputed payments — the admin's primary concern.

**Composite index column order follows cardinality:**  
The first column in a composite index should be the one with the highest selectivity (most distinct values) for the query pattern it serves. For `idx_pr_locality_date_status`, `locality_id` has moderate cardinality (few localities), `preferred_date` has high cardinality, `status` has very low cardinality (7 values). This order supports the assignment engine query pattern: "give me all `requested` pickups in locality 1 for 2026-01-20."

**No index on `users.phone_number`:**  
The `UNIQUE` constraint on `users.phone_number` implicitly creates a B-Tree index. No additional index needed.

---

## 7. Constraints & Integrity Rules

### 7.1 CHECK Constraints Summary

| Table | Constraint | Rule |
|---|---|---|
| `localities` | `pincode_format` | Must match `^\d{6}$` |
| `localities` | `lat_range` / `lng_range` | Valid coordinate ranges |
| `users` | `phone_format` | Must match `^\d{10}$` |
| `kabadiwala_profiles` | `reliability_score` | BETWEEN 0.000 AND 1.000 |
| `kabadiwala_profiles` | `total_gte_completed` | total_pickups ≥ completed_pickups |
| `scrap_rates` | `rate_positive` | rate_per_kg > 0 |
| `pickup_requests` | `weight_pos` | estimated_weight > 0 |
| `pickup_requests` | `weight_max` | estimated_weight ≤ 500 (kg) |
| `pickup_requests` | `date_future` | preferred_date ≥ CURRENT_DATE |
| `pickup_assignments` | `completed_at_required` | IF completed THEN completed_at NOT NULL |
| `pickup_assignments` | `weight_required` | IF completed THEN actual_weight NOT NULL |
| `pickup_assignments` | `assigned_by_values` | IN ('auto', 'manual') |
| `payment_records` | `amount_positive` | amount > 0 |
| `payment_records` | `paid_at_required` | IF paid THEN paid_at NOT NULL |
| `payment_records` | `upi_required` | IF paid THEN upi_reference NOT NULL |
| `learning_feedback` | `outcome_score_values` | IN (1.0, 0.5, -1.0) |
| `learning_feedback` | `citizen_rating_range` | BETWEEN 1 AND 5 |
| `weight_configurations` | `weights_sum` | w_d + w_w + w_r = 1.000 |
| `weight_configurations` | `each_weight_range` | Each weight BETWEEN 0.100 AND 0.600 |
| `garbage_schedules` | `time_window_valid` | end > start |

### 7.2 DB-Level Trigger Guards

| Trigger | Table | Prevents |
|---|---|---|
| `enforce_role_immutability` | `users` | Any UPDATE that changes `role` |
| `log_pickup_status_change` | `pickup_requests` | Status changes without audit log |
| `trigger_set_updated_at` | All mutable tables | Stale `updated_at` on updates |
| `prevent_role_change` function | `users` | Role escalation even via direct SQL |

### 7.3 Application-Level Rules (Not Enforceable in DB)

These rules are enforced in the service layer but documented here for completeness:

| Rule | Enforcement Location |
|---|---|
| Kabadiwala max 10 pickups per day | `assignment.service.js` → COUNT query before insert |
| Pickup preferred_date max 7 days out | `pickup.service.js` → date arithmetic validation |
| OTP max 5 attempts before lockout | `auth.service.js` → Redis counter |
| Assignment engine excludes manual overrides from learning | `assignment.service.js` → no `learning_feedback` insert for manual |
| Payment amount cannot be edited after creation | `payment.service.js` → UPDATE only allows status/upi_reference changes |

---

## 8. Audit & Immutability Design

### 8.1 Append-Only Tables

| Table | Reason |
|---|---|
| `pickup_status_history` | Legal/dispute audit trail. Every state change must be permanent record. |
| `scrap_rates` | Rate history preservation. Disputes about past payments need historical rates. |
| `learning_feedback` | Training data integrity. Cannot modify what the algorithm learned from. |
| `weight_configurations` | Full learning version history. Rollback requires knowing all past weights. |

**How append-only is enforced:**
1. Application DB user has no `UPDATE` or `DELETE` privilege on `pickup_status_history`
2. `scrap_rates` has no `updated_at` column — a design signal that it is not meant to be updated
3. Application services for these tables expose only `insert` methods, never `update` or `delete`

### 8.2 Soft Deletion Pattern

**No hard deletes anywhere in the system.**

- Users: `users.is_active = false`
- Localities: `localities.is_serviceable = false`
- Garbage schedules: `garbage_schedules.is_active = false`
- Pickup requests / assignments: status transitions to `cancelled` or `failed`

This guarantees that foreign key constraints are never violated and historical data is always intact.

---

## 9. Schema Trade-offs & Decisions

### 9.1 Denormalization Decisions

| Denormalized Field | Where | Why | Cost |
|---|---|---|---|
| `total_pickups`, `completed_pickups` | `kabadiwala_profiles` | Assignment scoring loop reads these per Kabadiwala candidate. COUNT(*) on 20+ candidates simultaneously would be slow. | Must be incremented atomically with assignment writes. Risk of drift if transaction fails mid-way (mitigated by ACID transaction wrapping both operations). |
| `reliability_score` | `kabadiwala_profiles` | Pre-computed for assignment engine hot path. | Must be recomputed by background job after learning loop runs. Eventual consistency (not real-time). |
| `citizen_id`, `kabadiwala_id` | `payment_records` | Earnings and payment history queries avoid multi-hop joins. | Data duplication — but these values are immutable after creation. |
| `rate_per_kg_at_request` | `pickup_requests` | Citizen's rate must not change retroactively when admin updates rates. | Extra column per request. Worth it: prevents payment disputes. |

### 9.2 JSONB Usage

JSONB is used in two places:
- `pickup_assignments.factors_snapshot` — algorithm inputs at assignment time
- `pickup_assignments.weights_snapshot` — weights at assignment time
- `weight_configurations.metrics_snapshot` — performance metrics at weight update time
- `system_configurations.value` stores strings only (no JSONB here)

**Why JSONB over normalized columns for snapshots?**
The learning algorithm's inputs may evolve over time (new factors added in Phase 2). Using JSONB means schema migrations are not required to add a new factor. The snapshot is also read-only after creation, so the lack of strict column typing is acceptable.

**Why NOT JSONB for everything else?**  
JSONB fields are opaque to the query planner for equality filters. They cannot be indexed with standard B-Tree indexes (require GIN indexes). They have no foreign key support. Everything that is queried, filtered, joined, or constrained should be a proper typed column.

### 9.3 Single `users` Table vs. Separate Tables Per Role

**Decision: Single `users` table + role-specific profile tables.**

**Alternative rejected: Separate `citizens` and `kabadiwalas` tables.**  
Rejected because:
- OTP authentication queries `SELECT * FROM users WHERE phone_number = $1` — needs a single table to search
- Notifications, audit logs, and admin queries all reference users by ID — a single FK target is far simpler
- Role-specific data lives in profile tables anyway — the single users table just stores identity

### 9.4 No UUIDs as Primary Keys

Addressed in Section 1. Sequential BIGSERIAL. Not UUID. The rationale is B-Tree index fragmentation and storage cost. If external API exposure of sequential IDs is a concern (enumeration attacks), the API layer uses `hashids` to encode/decode IDs without changing the database schema.

### 9.5 No Soft Enum (VARCHAR) vs. Hard Enum (PostgreSQL ENUM Type)

**Decision: PostgreSQL ENUM for all status columns.**

Trade-off: PostgreSQL ENUMs require an `ALTER TYPE ... ADD VALUE` migration to add new values. However:
- Invalid states cannot enter the DB even if application validation is bypassed
- ENUM is stored as a 4-byte integer internally — smaller than VARCHAR
- The additional status values anticipated (see Roadmap) can be added via migration when needed

---

## 10. Query Patterns Reference

The most critical queries in the system, optimized against the indexes above.

### Q1: Assignment Engine — Fetch Candidates
```sql
-- Fetch available kabadiwalas for a locality with today's assignment count
SELECT
    kp.user_id,
    u.name,
    kp.reliability_score,
    kp.last_known_lat,
    kp.last_known_lng,
    kp.service_locality_id,
    COUNT(pa.id) AS todays_assignments
FROM kabadiwala_profiles kp
JOIN users u ON kp.user_id = u.id
LEFT JOIN pickup_assignments pa
    ON pa.kabadiwala_id = kp.user_id
    AND pa.assigned_date = $2                       -- today
    AND pa.status NOT IN ('failed', 'reassigned')
WHERE kp.service_locality_id = $1                  -- locality
  AND kp.is_available = true
  AND u.is_active = true
GROUP BY kp.user_id, u.name, kp.reliability_score,
         kp.last_known_lat, kp.last_known_lng, kp.service_locality_id
HAVING COUNT(pa.id) < (
    SELECT value::integer FROM system_configurations
    WHERE key = 'max_daily_pickups_per_kabadiwala'
)
ORDER BY kp.reliability_score DESC;

-- Uses: idx_kp_locality_available, idx_pa_kabadiwala_date
```

### Q2: Current Scrap Rate for Locality + Category
```sql
SELECT rate_per_kg
FROM scrap_rates
WHERE locality_id = $1
  AND category = $2
  AND effective_date <= CURRENT_DATE
ORDER BY effective_date DESC
LIMIT 1;

-- Uses: idx_sr_locality_category_date (covers all three WHERE/ORDER columns)
```

### Q3: Citizen's Active Pickup with Assignment Details
```sql
SELECT
    pr.id AS request_id,
    pr.status,
    pr.category,
    pr.pickup_address,
    pr.preferred_date,
    pr.preferred_time_slot,
    pr.rate_per_kg_at_request,
    pa.id AS assignment_id,
    pa.status AS assignment_status,
    pa.actual_weight,
    pa.completed_at,
    u.name AS kabadiwala_name,
    u.phone_number AS kabadiwala_phone,
    pay.amount AS payment_amount,
    pay.status AS payment_status,
    pay.upi_reference
FROM pickup_requests pr
LEFT JOIN pickup_assignments pa ON pr.id = pa.request_id
    AND pa.status != 'reassigned'
LEFT JOIN users u ON pa.kabadiwala_id = u.id
LEFT JOIN payment_records pay ON pa.id = pay.assignment_id
WHERE pr.citizen_id = $1                           -- from JWT, not user input
ORDER BY pr.created_at DESC
LIMIT 50;

-- Uses: idx_pr_citizen_id
```

### Q4: Kabadiwala Daily Queue
```sql
SELECT
    pa.id AS assignment_id,
    pa.request_id,
    pa.sequence_order,
    pa.status AS assignment_status,
    pr.category,
    pr.pickup_address,
    pr.landmark,
    pr.preferred_time_slot,
    pr.pickup_lat,
    pr.pickup_lng,
    pr.estimated_weight,
    pr.notes,
    pr.rate_per_kg_at_request,
    u.name AS citizen_name,
    u.phone_number AS citizen_phone
FROM pickup_assignments pa
JOIN pickup_requests pr ON pa.request_id = pr.id
JOIN users u ON pr.citizen_id = u.id
WHERE pa.kabadiwala_id = $1                        -- from JWT
  AND pa.assigned_date = $2                        -- today or requested date
  AND pa.status NOT IN ('failed', 'reassigned')
ORDER BY pa.sequence_order ASC;

-- Uses: idx_pa_kabadiwala_date
```

### Q5: Admin Analytics Dashboard (Read Replica Query)
```sql
-- Runs against read replica, NOT primary DB
SELECT
    l.name AS locality,
    COUNT(pr.id) FILTER (WHERE pr.status = 'completed') AS completed,
    COUNT(pr.id) FILTER (WHERE pr.status = 'requested') AS pending,
    COUNT(pr.id) FILTER (WHERE pr.status = 'failed')    AS failed,
    SUM(pa.actual_weight) FILTER (WHERE pr.status = 'completed') AS total_kg,
    SUM(pay.amount) FILTER (WHERE pay.status = 'paid') AS total_paid
FROM pickup_requests pr
JOIN localities l ON pr.locality_id = l.id
LEFT JOIN pickup_assignments pa ON pr.id = pa.request_id
    AND pa.status != 'reassigned'
LEFT JOIN payment_records pay ON pa.id = pay.assignment_id
WHERE pr.created_at >= $1 AND pr.created_at < $2  -- date range
GROUP BY l.name
ORDER BY completed DESC;

-- Runs on read replica. Not time-sensitive. No index optimization needed for MVP.
-- If slow at scale: add idx_pr_locality_created_at and consider materialized view.
```

### Q6: Learning Loop — Fetch Unprocessed Feedback
```sql
SELECT
    lf.id,
    lf.assignment_id,
    lf.outcome,
    lf.outcome_score,
    lf.delay_minutes,
    pa.factors_snapshot,
    pa.weights_snapshot
FROM learning_feedback lf
JOIN pickup_assignments pa ON lf.assignment_id = pa.id
WHERE lf.processed = false
  AND lf.created_at >= NOW() - INTERVAL '7 days'
ORDER BY lf.created_at ASC;

-- Uses: idx_lf_unprocessed
```

---

*End of Section 2: Database Design*

*Next: Section 3 — Component Structure (Backend folder layout, Frontend structure, Layer responsibilities)*

---

**Document Version:** 1.0  
**Last Updated:** March 2026  
**Consistency:** All tables, constraints, and queries are consistent with Section 1 architecture decisions.