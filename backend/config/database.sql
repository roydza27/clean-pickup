-- ========================================
-- WASTE MANAGEMENT SYSTEM - DATABASE SCHEMA
-- ========================================
-- PostgreSQL/MySQL Compatible Schema
-- Created for India Pilot MVP


-- User Roles
CREATE TYPE user_role AS ENUM ('citizen', 'kabadiwala', 'admin');

-- Language
CREATE TYPE language_type AS ENUM ('english', 'hindi');

-- Scrap Categories
CREATE TYPE scrap_category AS ENUM ('plastic', 'paper', 'metal');

-- Pickup Status
CREATE TYPE pickup_status AS ENUM ('pending', 'assigned', 'completed', 'cancelled');

-- Assignment Status
CREATE TYPE assignment_status AS ENUM ('assigned', 'in_progress', 'completed', 'failed');

-- Payment Status
CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid');

-- Complaint Type
CREATE TYPE complaint_type_enum AS ENUM ('missed_pickup', 'delayed_pickup', 'improper_behavior', 'other');

-- Complaint Status
CREATE TYPE complaint_status_enum AS ENUM ('submitted', 'under_review', 'resolved');

-- Time Slot
CREATE TYPE time_slot_enum AS ENUM ('morning', 'afternoon', 'evening');

-- Collection Day
CREATE TYPE day_enum AS ENUM 
('monday','tuesday','wednesday','thursday','friday','saturday','sunday');

-- Notification Type
CREATE TYPE notification_type_enum AS ENUM 
('pickup_assigned','payment_received','garbage_schedule','general');


-- ========================================
-- 1. USERS TABLE
-- ========================================
CREATE TABLE users (
    user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100),
    role user_role NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_phone ON users(phone_number);
CREATE INDEX idx_role ON users(role);

-- ========================================
-- 2. OTP VERIFICATION TABLE
-- ========================================
CREATE TABLE otp_verification (
    otp_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_phone_otp ON otp_verification(phone_number, otp_code);
CREATE INDEX idx_expires ON otp_verification(expires_at);

-- ========================================
-- 3. LOCALITIES TABLE
-- ========================================
CREATE TABLE localities (
    locality_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    is_serviceable BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pincode ON localities(pincode);
CREATE INDEX idx_city ON localities(city);

-- ========================================
-- 4. CITIZEN PROFILES TABLE
-- ========================================
CREATE TABLE citizen_profiles (
    profile_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT NOT NULL,
    locality_id INT,
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    landmark VARCHAR(100),
    preferred_language language_type DEFAULT 'english',
    notification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (locality_id) REFERENCES localities(locality_id) ON DELETE SET NULL
);

-- ========================================
-- 5. KABADIWALA PROFILES TABLE
-- ========================================
CREATE TABLE kabadiwala_profiles (
    profile_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT NOT NULL,
    service_locality_id INT,
    vehicle_type VARCHAR(50),
    trust_score DECIMAL(3,2) NOT NULL DEFAULT 5.00 
    CHECK (trust_score >= 0 AND trust_score <= 5),
    total_pickups INT NOT NULL DEFAULT 0 CHECK (total_pickups >= 0),
    completed_pickups INT NOT NULL DEFAULT 0 CHECK (completed_pickups >= 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (service_locality_id) REFERENCES localities(locality_id) ON DELETE SET NULL
);

CREATE INDEX idx_trust_score ON kabadiwala_profiles(trust_score);
CREATE INDEX idx_availability ON kabadiwala_profiles(is_available);

-- ========================================
-- 6. SCRAP RATES TABLE
-- ========================================
CREATE TABLE scrap_rates (
    rate_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    locality_id INT NOT NULL,
    category scrap_category NOT NULL,
    rate_per_kg DECIMAL(10,2) NOT NULL,
    effective_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (locality_id) REFERENCES localities(locality_id) ON DELETE CASCADE,
    UNIQUE (locality_id, category, effective_date)
);

CREATE INDEX idx_locality_category ON scrap_rates(locality_id, category);
CREATE INDEX idx_effective_date ON scrap_rates(effective_date);

-- ========================================
-- 7. PICKUP REQUESTS TABLE
-- ========================================
CREATE TABLE pickup_requests (
    request_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    citizen_id INT NOT NULL,
    locality_id INT NOT NULL,
    category scrap_category NOT NULL,
    estimated_weight DECIMAL(10,2) CHECK (estimated_weight >= 0),
    pickup_address TEXT NOT NULL,
    landmark VARCHAR(100),
    preferred_date DATE NOT NULL,
    preferred_time_slot time_slot_enum DEFAULT 'morning',
    status pickup_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (citizen_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (locality_id) REFERENCES localities(locality_id) ON DELETE CASCADE
);

CREATE INDEX idx_status ON pickup_requests(status);
CREATE INDEX idx_preferred_date ON pickup_requests(preferred_date);
CREATE INDEX idx_citizen ON pickup_requests(citizen_id);

-- ========================================
-- 8. PICKUP ASSIGNMENTS TABLE
-- ========================================
CREATE TABLE pickup_assignments (
    assignment_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    request_id INT NOT NULL,
    kabadiwala_id INT NOT NULL,
    assigned_date DATE NOT NULL,
    sequence_order INT NOT NULL DEFAULT 1 CHECK (sequence_order > 0),
    status assignment_status DEFAULT 'assigned',
    actual_weight DECIMAL(10,2) CHECK (actual_weight >= 0),
    pickup_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES pickup_requests(request_id) ON DELETE CASCADE,
    FOREIGN KEY (kabadiwala_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE (request_id, kabadiwala_id)
);

CREATE INDEX idx_kabadiwala_date ON pickup_assignments(kabadiwala_id, assigned_date);
CREATE INDEX idx_status_assignment ON pickup_assignments(status);

-- ========================================
-- 9. PAYMENT RECORDS TABLE
-- ========================================
CREATE TABLE payment_records (
    payment_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    assignment_id INT NOT NULL,
    citizen_id INT NOT NULL,
    kabadiwala_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    payment_status payment_status_enum DEFAULT 'pending',
    upi_reference VARCHAR(100),
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES pickup_assignments(assignment_id) ON DELETE CASCADE,
    FOREIGN KEY (citizen_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (kabadiwala_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_citizen_status ON payment_records(citizen_id, payment_status);
CREATE INDEX idx_kabadiwala_payment ON payment_records(kabadiwala_id);

-- ========================================
-- 10. GARBAGE SCHEDULES TABLE
-- ========================================
CREATE TABLE garbage_schedules (
    schedule_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    locality_id INT NOT NULL,
    collection_day day_enum NOT NULL,
    time_window_start TIME NOT NULL,
    time_window_end TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (locality_id) REFERENCES localities(locality_id) ON DELETE CASCADE
);

CREATE INDEX idx_locality_day 
ON garbage_schedules(locality_id, collection_day);

-- ========================================
-- 11. MISSED GARBAGE PICKUPS TABLE
-- ========================================
CREATE TABLE missed_garbage_pickups (
    log_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    locality_id INT NOT NULL,
    scheduled_date DATE NOT NULL,
    reported_by_user_id INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (locality_id) REFERENCES localities(locality_id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_locality_date 
ON missed_garbage_pickups(locality_id, scheduled_date);

-- ========================================
-- 12. COMPLAINTS TABLE (Phase 1.5)
-- ========================================
CREATE TABLE complaints (
    complaint_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    citizen_id INT NOT NULL,
    assignment_id INT,
    complaint_type complaint_type_enum NOT NULL,
    description TEXT NOT NULL,
    status complaint_status_enum DEFAULT 'submitted',
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (citizen_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES pickup_assignments(assignment_id) ON DELETE SET NULL
);

CREATE INDEX idx_complaint_status ON complaints(status);
CREATE INDEX idx_complaint_citizen ON complaints(citizen_id);

-- ========================================
-- 13. TRUST SCORE HISTORY TABLE (Phase 1.5)
-- ========================================
CREATE TABLE trust_score_history (
    history_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kabadiwala_id INT NOT NULL,
    previous_score DECIMAL(3,2),
    new_score DECIMAL(3,2) NOT NULL,
    reason VARCHAR(200),
    assignment_id INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kabadiwala_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES pickup_assignments(assignment_id) ON DELETE SET NULL
);

CREATE INDEX idx_trust_kabadiwala 
ON trust_score_history(kabadiwala_id);

-- ========================================
-- 14. QR CODES TABLE (Phase 1.5)
-- ========================================
CREATE TABLE qr_codes (
    qr_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    assignment_id INT NOT NULL,
    qr_code VARCHAR(100) UNIQUE NOT NULL,
    is_scanned BOOLEAN NOT NULL DEFAULT FALSE,
    scanned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES pickup_assignments(assignment_id) ON DELETE CASCADE
);

CREATE INDEX idx_qr_code 
ON qr_codes(qr_code);

-- ========================================
-- 15. NOTIFICATIONS TABLE
-- ========================================
CREATE TABLE notifications (
    notification_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type notification_type_enum NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_user_read 
ON notifications(user_id, is_read);

CREATE INDEX idx_created 
ON notifications(created_at);


-- ========================================
-- Functions
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ========================================
-- Triggers
-- ========================================

-- USERS
CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- LOCALITIES
CREATE TRIGGER trigger_localities_updated_at
BEFORE UPDATE ON localities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- SCRAP RATES
CREATE TRIGGER trigger_scrap_rates_updated_at
BEFORE UPDATE ON scrap_rates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- PICKUP REQUESTS
CREATE TRIGGER trigger_pickup_requests_updated_at
BEFORE UPDATE ON pickup_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- PICKUP ASSIGNMENTS
CREATE TRIGGER trigger_pickup_assignments_updated_at
BEFORE UPDATE ON pickup_assignments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- PAYMENT RECORDS
CREATE TRIGGER trigger_payment_records_updated_at
BEFORE UPDATE ON payment_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- COMPLAINTS
CREATE TRIGGER trigger_complaints_updated_at
BEFORE UPDATE ON complaints
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- GARBAGE SCHEDULES
CREATE TRIGGER trigger_garbage_schedules_updated_at
BEFORE UPDATE ON garbage_schedules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SAMPLE DATA INSERTION
-- ========================================

-- Insert sample localities
INSERT INTO localities (name, pincode, city, state) VALUES
('Koramangala', '560034', 'Bangalore', 'Karnataka'),
('Indiranagar', '560038', 'Bangalore', 'Karnataka'),
('Whitefield', '560066', 'Bangalore', 'Karnataka');

-- Insert admin user
INSERT INTO users (phone_number, name, role) VALUES
('9999999999', 'System Admin', 'admin');

-- Insert sample scrap rates
INSERT INTO scrap_rates (locality_id, category, rate_per_kg, effective_date) VALUES
(1, 'plastic', 15.00, CURRENT_DATE),
(1, 'paper', 10.00, CURRENT_DATE),
(1, 'metal', 40.00, CURRENT_DATE),
(2, 'plastic', 15.00, CURRENT_DATE),
(2, 'paper', 10.00, CURRENT_DATE),
(2, 'metal', 40.00, CURRENT_DATE);

-- Insert sample garbage schedules
INSERT INTO garbage_schedules (locality_id, collection_day, time_window_start, time_window_end) VALUES
(1, 'monday', '07:00:00', '09:00:00'),
(1, 'wednesday', '07:00:00', '09:00:00'),
(1, 'friday', '07:00:00', '09:00:00'),
(2, 'tuesday', '08:00:00', '10:00:00'),
(2, 'thursday', '08:00:00', '10:00:00'),
(2, 'saturday', '08:00:00', '10:00:00');

-- ========================================
-- USEFUL VIEWS
-- ========================================

-- View for daily kabadiwala earnings
CREATE VIEW daily_earnings AS
SELECT 
    k.user_id,
    u.name,
    DATE(pa.pickup_completed_at) as date,
    COUNT(pa.assignment_id) as pickups_completed,
    SUM(pr.amount) as total_earnings
FROM kabadiwala_profiles k
JOIN users u ON k.user_id = u.user_id
LEFT JOIN pickup_assignments pa ON k.user_id = pa.kabadiwala_id AND pa.status = 'completed'
LEFT JOIN payment_records pr ON pa.assignment_id = pr.assignment_id
GROUP BY k.user_id, u.name, DATE(pa.pickup_completed_at);

-- View for pickup statistics
CREATE VIEW pickup_statistics AS
SELECT 
    l.name as locality_name,
    pr.category,
    COUNT(pr.request_id) as total_requests,
    SUM(CASE WHEN pr.status = 'completed' THEN 1 ELSE 0 END) as completed_requests,
    SUM(CASE WHEN pr.status = 'pending' THEN 1 ELSE 0 END) as pending_requests,
    SUM(CASE WHEN pa.actual_weight IS NOT NULL THEN pa.actual_weight ELSE 0 END) as total_weight_kg
FROM pickup_requests pr
LEFT JOIN localities l ON pr.locality_id = l.locality_id
LEFT JOIN pickup_assignments pa ON pr.request_id = pa.request_id
GROUP BY l.name, pr.category;

-- ========================================
-- INDEXES FOR OPTIMIZATION
-- ========================================

-- INDEXES FOR OPTIMIZATION

-- Additional composite indexes for common queries
CREATE INDEX idx_assignment_status_date ON pickup_assignments(status, assigned_date);
CREATE INDEX idx_payment_status_date ON payment_records(payment_status, payment_date);
CREATE INDEX idx_notification_user_type ON notifications(user_id, notification_type, is_read);

-- PARTIAL INDEXES

CREATE INDEX idx_active_scrap_rates  ON scrap_rates(locality_id, category) WHERE is_active = TRUE;
CREATE INDEX idx_unread_notifications ON notifications(user_id) WHERE is_read = FALSE;

-- ========================================
-- END OF SCHEMA
-- ========================================