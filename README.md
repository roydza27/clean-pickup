````md
# 🗑️ Waste Management System - Backend

Complete backend implementation for the **Waste Coordination & Recycling Management System** – India Pilot MVP.

---

## 📋 Table of Contents
- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)
- [Monitoring & Logs](#monitoring--logs)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)
- [Acknowledgments](#acknowledgments)
- [Roadmap](#roadmap)

---

## 🎯 Overview

This backend provides a complete REST API for a waste management platform connecting:

- **Citizens** – Selling recyclable waste  
- **Kabadiwalas** (Scrap Collectors) – Collecting and recycling waste  
- **Admins** – Managing operations, rates, and analytics  

### Key Capabilities
- ✅ OTP-based authentication
- ✅ Role-based access control (Citizen, Kabadiwala, Admin)
- ✅ Automatic profile creation per role
- ✅ Real-time scrap pricing by locality
- ✅ Pickup request & assignment management
- ✅ Route optimization support
- ✅ Payment tracking
- ✅ Garbage collection scheduling
- ✅ Analytics dashboard
- ✅ Multi-locality support

---

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js v16+
- **Framework:** Express.js
- **Database:** MySQL 8.0+
- **Authentication:** OTP-based (JWT-ready)
- **Package Manager:** npm

---

## ✨ Features

### Authentication & Authorization
- Phone number + OTP login
- Role passed explicitly during OTP verification
- Role-based access control (RBAC)
- Secure session handling

### Citizen Features
- View scrap rates by locality
- Create pickup requests
- Track pickup status
- View payment history
- Manage profile & preferences
- View garbage collection schedules

### Kabadiwala Features
- View assigned pickups
- Route optimization
- Complete pickups with weight entry
- Track earnings
- Trust score (Phase 1.5)

### Admin Features
- Manage scrap rates
- Assign pickups
- Manage localities
- View analytics
- Upload garbage schedules

---

## 📦 Prerequisites

```bash
node --version   # v16+
npm --version    # v8+
mysql --version  # v8.0+
````

---

## 🚀 Installation

```bash
git clone <repository-url>
cd waste-management-backend
npm install
```

---

## 🗄️ Database Setup

### 1. Create Database

```sql
CREATE DATABASE waste_management;
USE waste_management;
```

### 2. Import Schema

```bash
mysql -u root -p waste_management < database_schema.sql
```

### 3. Tables Created

* users
* otp_verification
* citizen_profiles
* kabadiwala_profiles
* localities
* scrap_rates
* pickup_requests
* pickup_assignments
* payment_records
* garbage_schedules
* complaints
* notifications
* trust_score_history

---

## 🔐 Database Integrity (IMPORTANT)

Foreign keys **must exist** to keep profiles consistent.

### Citizen Profiles

```sql
ALTER TABLE citizen_profiles
ADD CONSTRAINT fk_citizen_user
FOREIGN KEY (user_id)
REFERENCES users(user_id)
ON DELETE CASCADE;
```

### Kabadiwala Profiles

```sql
ALTER TABLE kabadiwala_profiles
ADD CONSTRAINT fk_kabadiwala_user
FOREIGN KEY (user_id)
REFERENCES users(user_id)
ON DELETE CASCADE;
```

📌 Admin users **do not have a separate profile table**.

---

## ⚙️ Configuration

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=waste_management

PORT=3000
NODE_ENV=development

JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:5173
```

---

## 🏃 Running the Server

```bash
npm run dev
```

Health check:

```
GET /health
```

---

## 📖 API Documentation

See **API_DOCUMENTATION.md** for full coverage.

---

### Authentication Flow (IMPORTANT)

#### 1. Send OTP

```bash
POST /api/auth/send-otp
{
  "phoneNumber": "9876543210"
}
```

#### 2. Verify OTP (ROLE REQUIRED)

```bash
POST /api/auth/verify-otp
{
  "phoneNumber": "9876543210",
  "otp": "123456",
  "role": "citizen | kabadiwala"
}
```

### Role Rules

* ❌ `admin` cannot be created via OTP
* ✅ `citizen` default
* ✅ `kabadiwala` allowed
* Profiles are **auto-created** during signup

---

## 👤 Citizen Profile APIs

### Get Profile

```
GET /api/citizen/profile
Authorization: Bearer <token>
```

### Update Profile & Preferences

```
PUT /api/citizen/profile
```

```json
{
  "name": "Rahul Sharma",
  "preferredLanguage": "en",
  "notifyPickupUpdates": true,
  "notifyPaymentUpdates": true,
  "notifyGeneral": false
}
```

📌 There is **NO separate** `/api/citizen/preferences` endpoint.

---

## 🧪 Testing

### Test Users

* **Admin:** `9999999999`
* **Citizen:** created via OTP
* **Kabadiwala:** created via OTP or admin

Profiles are created **automatically**.

---

## ⚠️ MySQL TRUNCATE WARNING

Due to foreign key constraints:

```sql
TRUNCATE users; -- ❌ NOT allowed
```

Correct way:

```sql
DELETE FROM citizen_profiles;
DELETE FROM kabadiwala_profiles;
DELETE FROM users;
```

OR (DEV ONLY):

```sql
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE users;
SET FOREIGN_KEY_CHECKS = 1;
```

---

## 📊 Monitoring & Logs

```bash
npm run dev
pm2 logs waste-backend
```

---

## 🔒 Security Best Practices

* Strong JWT secrets
* Role validation on backend
* OTP reuse prevention
* Prepared SQL statements
* FK constraints enforced

---

## 🤝 Contributing

1. Fork
2. Feature branch
3. Commit
4. PR

---

## 📞 Support

Check:

* API_DOCUMENTATION.md
* Troubleshooting section
* GitHub Issues

---

## 📄 License

MIT License

---

## 🙏 Acknowledgments

Built for the **Waste Coordination & Recycling Management System (India Pilot)**.

---

## 📈 Roadmap

### Phase 1 (Current)

* ✅ OTP auth
* ✅ Profiles
* ✅ Pickups
* ✅ Payments
* ✅ Analytics

### Phase 1.5

* ⏳ Trust score
* ⏳ Notifications
* ⏳ Complaints

### Phase 2

* 📅 GPS tracking
* 📅 Smart bins
* 📅 Mobile apps

---

Made with ❤️ for a cleaner India 🇮🇳

```

---

### ✅ What you can do now

- Commit this README safely
- Backend + DB + frontend assumptions are aligned
- No hidden mismatches remain

If you want next:
- **Citizen Account frontend wiring**
- **Kabadiwala Account cleanup**
- **Admin audit**
- **API versioning**

Just say the word.
```