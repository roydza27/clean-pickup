-- ========================================================
-- WASTE MANAGEMENT SYSTEM - COMPLETE DATABASE SCHEMA
-- ========================================================
-- PostgreSQL 15
-- Do NOT use an ORM. All queries are raw parameterized SQL.

-- ========================================================
-- ENUMS
-- ========================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('citizen', 'kabadiwala', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE pickup_status AS ENUM (
    'requested',
    'assigned',
    'in_progress',
    'completed',
    'failed',
    'cancelled',
    'unassigned_no_availability'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM (
    'assigned',
    'in_progress',
    'completed',
    'failed',
    'reassigned'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending',
    'paid',
    'disputed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE waste_category AS ENUM ('plastic', 'paper', 'metal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE time_slot AS ENUM ('morning', 'afternoon', 'evening');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE language_type AS ENUM ('english', 'hindi');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
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
    'SYSTEM_ALERT',
    'general'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE day_enum AS ENUM
    ('monday','tuesday','wednesday','thursday','friday','saturday','sunday');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========================================================
-- FUNCTION: auto-update updated_at on row change
-- ========================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================================
-- TABLE 1: localities
-- ========================================================

CREATE TABLE IF NOT EXISTS localities (
    locality_id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    pincode         VARCHAR(10)     NOT NULL,
    city            VARCHAR(50)     NOT NULL,
    state           VARCHAR(50)     NOT NULL,
    centroid_lat    DECIMAL(10, 7),
    centroid_lng    DECIMAL(10, 7),
    is_serviceable  BOOLEAN         NOT NULL    DEFAULT TRUE,
    max_daily_pickups INTEGER       NOT NULL    DEFAULT 50
                        CHECK (max_daily_pickups > 0),
    created_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pincode ON localities(pincode);
CREATE INDEX IF NOT EXISTS idx_city    ON localities(city);

DO $$ BEGIN
  CREATE TRIGGER trigger_localities_updated_at
    BEFORE UPDATE ON localities
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========================================================
-- TABLE 2: users
-- ========================================================

CREATE TABLE IF NOT EXISTS users (
    user_id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    phone_number    VARCHAR(15)     UNIQUE NOT NULL,
    name            VARCHAR(150),
    role            user_role       NOT NULL,
    is_active       BOOLEAN         NOT NULL    DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_role  ON users(role);

DO $$ BEGIN
  CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Prevent role change via UPDATE (USER-02)
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

DO $$ BEGIN
  CREATE TRIGGER enforce_role_immutability
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION prevent_role_change();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========================================================
-- TABLE 3: citizen_profiles
-- ========================================================

CREATE TABLE IF NOT EXISTS citizen_profiles (
    profile_id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id                 INT             NOT NULL UNIQUE,
    locality_id             INT,
    address_line1           VARCHAR(200),
    address_line2           VARCHAR(200),
    landmark                VARCHAR(100),
    age                     INT             CHECK (age > 0 AND age < 150),
    preferred_language      language_type   DEFAULT 'english',
    notification_enabled    BOOLEAN         NOT NULL    DEFAULT TRUE,
    notify_pickup_updates   BOOLEAN         NOT NULL    DEFAULT TRUE,
    notify_payment_updates  BOOLEAN         NOT NULL    DEFAULT TRUE,
    notify_general          BOOLEAN         NOT NULL    DEFAULT TRUE,
    created_at              TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    FOREIGN KEY (user_id)     REFERENCES users(user_id)      ON DELETE CASCADE,
    FOREIGN KEY (locality_id) REFERENCES localities(locality_id) ON DELETE SET NULL
);

DO $$ BEGIN
  CREATE TRIGGER trigger_citizen_profiles_updated_at
    BEFORE UPDATE ON citizen_profiles
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========================================================
-- TABLE 4: kabadiwala_profiles
-- ========================================================

CREATE TABLE IF NOT EXISTS kabadiwala_profiles (
    profile_id                  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id                     INT             NOT NULL UNIQUE,
    service_locality_id         INT,
    vehicle_type                VARCHAR(50),
    reliability_score           DECIMAL(4, 3)   NOT NULL    DEFAULT 0.500
                                    CHECK (reliability_score BETWEEN 0.000 AND 1.000),
    total_pickups               INT             NOT NULL    DEFAULT 0
                                    CHECK (total_pickups >= 0),
    completed_pickups           INT             NOT NULL    DEFAULT 0
                                    CHECK (completed_pickups >= 0),
    is_available                BOOLEAN         NOT NULL    DEFAULT TRUE,
    last_known_lat              DECIMAL(10, 7),
    last_known_lng              DECIMAL(10, 7),
    last_location_updated_at    TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    CONSTRAINT kp_total_gte_completed CHECK (total_pickups >= completed_pickups),
    FOREIGN KEY (user_id)             REFERENCES users(user_id)         ON DELETE CASCADE,
    FOREIGN KEY (service_locality_id) REFERENCES localities(locality_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_availability ON kabadiwala_profiles(is_available);

DO $$ BEGIN
  CREATE TRIGGER trigger_kabadiwala_profiles_updated_at
    BEFORE UPDATE ON kabadiwala_profiles
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========================================================
-- TABLE 5: scrap_rates
-- ========================================================

CREATE TABLE IF NOT EXISTS scrap_rates (
    rate_id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    locality_id     INT             NOT NULL,
    category        waste_category  NOT NULL,
    rate_per_kg     DECIMAL(10, 2)  NOT NULL    CHECK (rate_per_kg >= 0),
    effective_date  DATE            NOT NULL    DEFAULT CURRENT_DATE,
    is_active       BOOLEAN         NOT NULL    DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    FOREIGN KEY (locality_id) REFERENCES localities(locality_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_locality_category ON scrap_rates(locality_id, category);
CREATE INDEX IF NOT EXISTS idx_active_scrap_rates ON scrap_rates(locality_id, category) WHERE is_active = TRUE;

DO $$ BEGIN
  CREATE TRIGGER trigger_scrap_rates_updated_at
    BEFORE UPDATE ON scrap_rates
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========================================================
-- TABLE 6: pickup_requests
-- ========================================================

CREATE TABLE IF NOT EXISTS pickup_requests (
    request_id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    citizen_id          INT             NOT NULL,
    locality_id         INT             NOT NULL,
    category            waste_category  NOT NULL,
    estimated_weight    DECIMAL(10, 2)  CHECK (estimated_weight >= 0),
    pickup_address      TEXT            NOT NULL,
    landmark            VARCHAR(100),
    preferred_date      DATE            NOT NULL,
    preferred_time_slot time_slot       NOT NULL    DEFAULT 'morning',
    status              pickup_status   NOT NULL    DEFAULT 'requested',
    notes               TEXT,
    -- PICKUP-05: rate snapshotted at creation time
    rate_snapshot       DECIMAL(10, 2),
    created_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    FOREIGN KEY (citizen_id)  REFERENCES users(user_id)         ON DELETE CASCADE,
    FOREIGN KEY (locality_id) REFERENCES localities(locality_id) ON DELETE CASCADE,
    -- PICKUP-03: future dates only (enforced in service layer primarily)
    CONSTRAINT pr_preferred_date_not_null CHECK (preferred_date IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_status         ON pickup_requests(status);
CREATE INDEX IF NOT EXISTS idx_preferred_date ON pickup_requests(preferred_date);
CREATE INDEX IF NOT EXISTS idx_citizen        ON pickup_requests(citizen_id);

-- PICKUP-02: One active pickup per citizen per date
CREATE UNIQUE INDEX IF NOT EXISTS idx_pr_citizen_date_active
    ON pickup_requests (citizen_id, preferred_date)
    WHERE status NOT IN ('cancelled', 'failed');

DO $$ BEGIN
  CREATE TRIGGER trigger_pickup_requests_updated_at
    BEFORE UPDATE ON pickup_requests
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========================================================
-- TABLE 7: weight_configurations
-- ========================================================

CREATE TABLE IF NOT EXISTS weight_configurations (
    config_id       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    w_distance      DECIMAL(5, 3)   NOT NULL    CHECK (w_distance  BETWEEN 0.10 AND 0.60),
    w_workload      DECIMAL(5, 3)   NOT NULL    CHECK (w_workload  BETWEEN 0.10 AND 0.60),
    w_reliability   DECIMAL(5, 3)   NOT NULL    CHECK (w_reliability BETWEEN 0.10 AND 0.60),
    is_active       BOOLEAN         NOT NULL    DEFAULT FALSE,
    created_by      VARCHAR(20)     NOT NULL    DEFAULT 'system',
    notes           TEXT,
    created_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    -- Weights must sum to 1.000 (enforced in service; DB-level approximation)
    CONSTRAINT wc_weights_sum CHECK (
        ABS((w_distance + w_workload + w_reliability) - 1.000) < 0.001
    )
);

CREATE INDEX IF NOT EXISTS idx_wc_single_active
    ON weight_configurations (is_active)
    WHERE is_active = TRUE;

DO $$ BEGIN
  CREATE TRIGGER trigger_weight_configurations_updated_at
    BEFORE UPDATE ON weight_configurations
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========================================================
-- TABLE 8: pickup_assignments
-- ========================================================

CREATE TABLE IF NOT EXISTS pickup_assignments (
    assignment_id       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    request_id          INT             NOT NULL,
    kabadiwala_id       INT             NOT NULL,
    assigned_date       DATE            NOT NULL,
    sequence_order      INT             NOT NULL    DEFAULT 1   CHECK (sequence_order > 0),
    status              assignment_status NOT NULL  DEFAULT 'assigned',
    -- ASSIGN-04: Snapshots always populated
    factors_snapshot    JSONB           NOT NULL    DEFAULT '{}',
    weights_snapshot    JSONB           NOT NULL    DEFAULT '{}',
    assigned_by         VARCHAR(20)     NOT NULL    DEFAULT 'auto'
                            CHECK (assigned_by IN ('auto', 'manual')),
    admin_note          TEXT,
    actual_weight       DECIMAL(10, 2)  CHECK (actual_weight > 0),
    pickup_completed_at TIMESTAMPTZ,
    failure_reason      TEXT,
    created_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    FOREIGN KEY (request_id)    REFERENCES pickup_requests(request_id)   ON DELETE CASCADE,
    FOREIGN KEY (kabadiwala_id) REFERENCES users(user_id)                ON DELETE CASCADE,
    -- ASSIGN-04: completed_at required when completed
    CONSTRAINT pa_completed_at_required CHECK (
        (status = 'completed' AND pickup_completed_at IS NOT NULL) OR
        (status != 'completed')
    )
);

CREATE INDEX IF NOT EXISTS idx_kabadiwala_date     ON pickup_assignments(kabadiwala_id, assigned_date);
CREATE INDEX IF NOT EXISTS idx_status_assignment   ON pickup_assignments(status);
CREATE INDEX IF NOT EXISTS idx_pa_kabadiwala_date  ON pickup_assignments(kabadiwala_id, assigned_date)
    WHERE status NOT IN ('completed', 'reassigned', 'failed');

DO $$ BEGIN
  CREATE TRIGGER trigger_pickup_assignments_updated_at
    BEFORE UPDATE ON pickup_assignments
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========================================================
-- TABLE 9: pickup_status_history
-- ========================================================

CREATE TABLE IF NOT EXISTS pickup_status_history (
    history_id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    request_id      INT             NOT NULL,
    from_status     pickup_status,
    to_status       pickup_status   NOT NULL,
    changed_by_user INT,
    changed_by_role VARCHAR(20),
    note            TEXT,
    created_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    FOREIGN KEY (request_id)      REFERENCES pickup_requests(request_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by_user) REFERENCES users(user_id)              ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_psh_request ON pickup_status_history(request_id);

-- Trigger to auto-log status changes
CREATE OR REPLACE FUNCTION log_pickup_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO pickup_status_history (request_id, from_status, to_status)
        VALUES (NEW.request_id, OLD.status, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trigger_log_pickup_status
    AFTER UPDATE ON pickup_requests
    FOR EACH ROW EXECUTE FUNCTION log_pickup_status_change();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========================================================
-- TABLE 10: payment_records
-- ========================================================

CREATE TABLE IF NOT EXISTS payment_records (
    payment_id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    assignment_id   INT             NOT NULL UNIQUE,
    citizen_id      INT             NOT NULL,
    kabadiwala_id   INT             NOT NULL,
    amount          DECIMAL(10, 2)  NOT NULL    CHECK (amount >= 0),
    payment_status  payment_status  NOT NULL    DEFAULT 'pending',
    upi_reference   VARCHAR(100),
    payment_date    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    -- pr_upi_on_paid: UPI reference required when paid
    CONSTRAINT pr_upi_on_paid CHECK (
        (payment_status = 'paid' AND upi_reference IS NOT NULL) OR
        (payment_status != 'paid')
    ),
    FOREIGN KEY (assignment_id) REFERENCES pickup_assignments(assignment_id) ON DELETE CASCADE,
    FOREIGN KEY (citizen_id)    REFERENCES users(user_id)                    ON DELETE CASCADE,
    FOREIGN KEY (kabadiwala_id) REFERENCES users(user_id)                    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_citizen_status  ON payment_records(citizen_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_kabadiwala_payment ON payment_records(kabadiwala_id);

DO $$ BEGIN
  CREATE TRIGGER trigger_payment_records_updated_at
    BEFORE UPDATE ON payment_records
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========================================================
-- TABLE 11: learning_feedback
-- ========================================================

CREATE TABLE IF NOT EXISTS learning_feedback (
    feedback_id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    assignment_id   INT             NOT NULL UNIQUE,
    actual_weight   DECIMAL(10, 2),
    completed_at    TIMESTAMPTZ,
    is_processed    BOOLEAN         NOT NULL    DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    FOREIGN KEY (assignment_id) REFERENCES pickup_assignments(assignment_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lf_unprocessed ON learning_feedback(is_processed) WHERE is_processed = FALSE;

-- ========================================================
-- TABLE 12: system_configurations
-- ========================================================

CREATE TABLE IF NOT EXISTS system_configurations (
    key             VARCHAR(100)    PRIMARY KEY,
    value           TEXT            NOT NULL,
    description     TEXT,
    updated_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW()
);

-- ========================================================
-- TABLE 13: garbage_schedules
-- ========================================================

CREATE TABLE IF NOT EXISTS garbage_schedules (
    schedule_id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    locality_id         INT             NOT NULL,
    collection_day      day_enum        NOT NULL,
    time_window_start   TIME            NOT NULL,
    time_window_end     TIME            NOT NULL,
    is_active           BOOLEAN         NOT NULL    DEFAULT TRUE,
    created_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    FOREIGN KEY (locality_id) REFERENCES localities(locality_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_locality_day ON garbage_schedules(locality_id, collection_day);

DO $$ BEGIN
  CREATE TRIGGER trigger_garbage_schedules_updated_at
    BEFORE UPDATE ON garbage_schedules
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========================================================
-- TABLE 14: missed_garbage_pickups
-- ========================================================

CREATE TABLE IF NOT EXISTS missed_garbage_pickups (
    log_id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    locality_id         INT             NOT NULL,
    scheduled_date      DATE            NOT NULL,
    reported_by_user_id INT             NOT NULL,
    notes               TEXT,
    created_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    FOREIGN KEY (locality_id)         REFERENCES localities(locality_id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by_user_id) REFERENCES users(user_id)          ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_locality_date ON missed_garbage_pickups(locality_id, scheduled_date);

-- ========================================================
-- TABLE 15: notifications
-- ========================================================

CREATE TABLE IF NOT EXISTS notifications (
    notification_id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id             INT             NOT NULL,
    title               VARCHAR(200)    NOT NULL,
    message             TEXT            NOT NULL,
    notification_type   VARCHAR(50)     NOT NULL    DEFAULT 'general',
    is_read             BOOLEAN         NOT NULL    DEFAULT FALSE,
    created_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_read         ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_unread_notifications ON notifications(user_id) WHERE is_read = FALSE;

-- ========================================================
-- TABLE 16: otp_verification (fallback table; primary OTP via Redis)
-- ========================================================

CREATE TABLE IF NOT EXISTS otp_verification (
    otp_id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    phone_number    VARCHAR(15)     NOT NULL,
    otp_code        VARCHAR(6)      NOT NULL,
    is_verified     BOOLEAN         NOT NULL    DEFAULT FALSE,
    expires_at      TIMESTAMPTZ     NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_otp ON otp_verification(phone_number, otp_code);
CREATE INDEX IF NOT EXISTS idx_expires   ON otp_verification(expires_at);

-- ========================================================
-- SEED DATA
-- ========================================================

-- Weight configurations (wc_weights_sum = 1.000, is_active = true)
INSERT INTO weight_configurations (w_distance, w_workload, w_reliability, is_active, notes)
VALUES (0.333, 0.334, 0.333, TRUE, 'Initial balanced weights')
ON CONFLICT DO NOTHING;

-- System configurations (9 required keys)
INSERT INTO system_configurations (key, value, description) VALUES
  ('max_advance_booking_days',         '7',    'Maximum days in advance a citizen can book a pickup'),
  ('max_daily_pickups_per_kabadiwala', '10',   'Maximum pickups assigned to one kabadiwala per day'),
  ('max_assignment_distance_km',       '10',   'Maximum distance (km) to consider a kabadiwala eligible'),
  ('otp_expiry_seconds',               '300',  'OTP TTL in seconds (5 minutes)'),
  ('otp_rate_limit_per_hour',          '5',    'Maximum OTP requests per phone number per hour'),
  ('otp_max_failed_attempts',          '5',    'Failed attempts before phone lockout'),
  ('learning_loop_enabled',            'true', 'Whether the learning loop weight update is enabled'),
  ('learning_loop_min_feedback',       '30',   'Minimum feedback records to trigger learning loop'),
  ('learning_loop_min_improvement',    '0.05', 'Minimum score improvement % required to accept new weights')
ON CONFLICT (key) DO NOTHING;

-- Sample localities with coordinates
INSERT INTO localities (name, pincode, city, state, centroid_lat, centroid_lng, is_serviceable) VALUES
  ('Koramangala', '560034', 'Bangalore', 'Karnataka', 12.9352, 77.6245, TRUE),
  ('Indiranagar',  '560038', 'Bangalore', 'Karnataka', 12.9784, 77.6408, TRUE),
  ('Whitefield',   '560066', 'Bangalore', 'Karnataka', 12.9698, 77.7499, TRUE)
ON CONFLICT DO NOTHING;

-- Admin user (phone 9999999999)
INSERT INTO users (phone_number, name, role) VALUES
  ('9999999999', 'System Admin', 'admin')
ON CONFLICT (phone_number) DO NOTHING;

-- Sample scrap rates
INSERT INTO scrap_rates (locality_id, category, rate_per_kg, effective_date, is_active)
SELECT l.locality_id, c.category, c.rate, CURRENT_DATE, TRUE
FROM localities l
CROSS JOIN (VALUES
  ('plastic'::waste_category, 15.00),
  ('paper'::waste_category,   10.00),
  ('metal'::waste_category,   40.00)
) AS c(category, rate)
WHERE l.name IN ('Koramangala', 'Indiranagar', 'Whitefield')
ON CONFLICT DO NOTHING;

-- Sample garbage schedules
INSERT INTO garbage_schedules (locality_id, collection_day, time_window_start, time_window_end)
SELECT l.locality_id, s.day, s.start_t, s.end_t
FROM localities l
CROSS JOIN (VALUES
  ('monday'::day_enum,    '07:00:00'::TIME, '09:00:00'::TIME),
  ('wednesday'::day_enum, '07:00:00'::TIME, '09:00:00'::TIME),
  ('friday'::day_enum,    '07:00:00'::TIME, '09:00:00'::TIME)
) AS s(day, start_t, end_t)
WHERE l.name = 'Koramangala'
ON CONFLICT DO NOTHING;

-- ========================================================
-- USEFUL VIEWS
-- ========================================================

CREATE OR REPLACE VIEW daily_earnings AS
SELECT
    k.user_id,
    u.name,
    DATE(pa.pickup_completed_at)    AS date,
    COUNT(pa.assignment_id)         AS pickups_completed,
    SUM(pr_pay.amount)              AS total_earnings
FROM kabadiwala_profiles k
JOIN users u                ON k.user_id = u.user_id
LEFT JOIN pickup_assignments pa
    ON k.user_id = pa.kabadiwala_id AND pa.status = 'completed'
LEFT JOIN payment_records pr_pay
    ON pa.assignment_id = pr_pay.assignment_id
GROUP BY k.user_id, u.name, DATE(pa.pickup_completed_at);

-- ========================================================
-- END OF SCHEMA
-- ========================================================