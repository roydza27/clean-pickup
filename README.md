# 🗑️ Waste Management System - Backend

Complete backend implementation for the **Waste Coordination & Recycling Management System** – India Pilot MVP.

---

## 📋 Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Core Concepts](#core-concepts)
- [User Roles & Responsibilities](#user-roles--responsibilities)
- [Features](#features)
- [Authentication & Authorization](#authentication--authorization)
- [Database Design](#database-design)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Request & Response Conventions](#request--response-conventions)
- [Error Handling](#error-handling)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security Best Practices](#security-best-practices)
- [Operational Notes](#operational-notes)
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

The system is designed for **Indian urban and semi-urban waste ecosystems**, where informal recycling networks coexist with municipal waste systems.

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

## 🏗️ System Architecture

### High-Level Flow

1. User logs in using phone number + OTP
2. Backend verifies OTP and assigns role
3. Role-specific profile is created automatically
4. User interacts with role-restricted APIs
5. Admin oversees operations and analytics

### Architectural Principles

- REST-first API design
- Stateless authentication
- Role isolation at API level
- Strong referential integrity at database level
- Frontend-agnostic backend

---

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js v16+
- **Framework:** Express.js
- **Database:** MySQL 8.0+
- **Authentication:** OTP-based (JWT-ready)
- **Package Manager:** npm

### Optional / Future
- Redis (OTP rate limiting, caching)
- Message queues (notifications)
- SMS gateway integrations

---

## 🧠 Core Concepts

### OTP Authentication
- OTPs are **single-use**
- OTPs expire automatically
- OTP reuse is blocked at DB level

### Role Immutability
- User role is assigned at signup
- Role **cannot be changed via API**
- Prevents privilege escalation

### Profile Separation
- `users` table stores identity
- Role-specific data lives in profile tables

---

## 👥 User Roles & Responsibilities

### Citizen
- Request scrap pickups
- Track pickups and payments
- Manage address and preferences

### Kabadiwala
- Accept and complete pickups
- Enter collected weights
- Track earnings

### Admin
- Configure scrap rates
- Assign pickups
- Monitor system analytics
- Manage localities

---

## ✨ Features

### Authentication & Authorization
- Phone number + OTP login
- Role passed explicitly during OTP verification
- Role-based access control (RBAC)
- Secure session handling

### Citizen Features
- View daily scrap rates by locality
- Submit pickup requests
- Track pickup status
- View payment history
- Manage profile & preferences
- View garbage collection schedules

### Kabadiwala Features
- View assigned pickups
- Optimized route sequencing
- Complete pickups with weight entry
- Track daily/weekly earnings
- Trust score (Phase 1.5)

### Admin Features
- Manage scrap rates (by locality & category)
- Assign pickups to kabadiwalas
- Manage localities & service zones
- View comprehensive analytics
- Monitor system performance
- Upload garbage schedules

### Analytics
- Total pickups & weight collected
- Earnings distribution
- Category-wise breakdown
- Kabadiwala performance metrics
- Landfill diversion estimates

---

## 📦 Prerequisites

### For Node.js (Express)
```bash
node --version  # v16 or higher
npm --version   # v8 or higher
mysql --version # MySQL 8.0 or higher
```



---

## 🚀 Installation

### Clone the Repository
```bash
git clone <repository-url>
cd waste-management-backend
```

### Option 1: Node.js Setup
```bash
# Install dependencies
npm install
---

## 🗄️ Database Setup

### 1. Create Database
```bash
mysql -u root -p
```

```sql
CREATE DATABASE waste_management;
USE waste_management;
```

### 2. Import Schema
```bash
# Make sure you're in the project directory
mysql -u root -p waste_management < database_schema.sql
```

### 3. Verify Installation
```sql
SHOW TABLES;
```

You should see 15 tables:
- users
- otp_verification
- localities
- citizen_profiles
- kabadiwala_profiles
- scrap_rates
- pickup_requests
- pickup_assignments
- payment_records
- garbage_schedules
- missed_garbage_pickups
- complaints
- trust_score_history
- qr_codes
- notifications

### 4. Sample Data
The schema includes sample data:
- 3 localities (Koramangala, Indiranagar, Whitefield)
- 1 admin user (phone: 9999999999)
- Scrap rates for all categories
- Garbage collection schedules

---

## ⚙️ Configuration

### 1. Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

### 2. Edit `.env` file

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=waste_management

# Server Configuration
PORT=3000                    # For Express
NODE_ENV=development         # For Express


# JWT Secret (Generate strong secret for production)
JWT_SECRET=your_secret_key_here

# SMS Gateway (Optional - for production)
SMS_API_KEY=your_sms_api_key
SMS_API_URL=https://api.sms-gateway.com/send

# CORS Settings
CORS_ORIGIN=http://localhost:5173
```

### 3. Generate Strong JWT Secret (Production)
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"


## 🏃 Running the Server

### Development Mode

#### Node.js (Express)
```bash
# Using npm
npm run dev

# Or using node directly
node server.js
```


### Production Mode

#### Node.js (Express)
```bash
NODE_ENV=production npm start
```

### Verify Server is Running

Visit:
- Express: http://localhost:3000/health

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-14T10:30:00.000Z"
}
```

---

## 📖 API Documentation

Complete API documentation is available in [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md)

### Quick Start Examples

#### 1. Send OTP
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9876543210"}'
```

#### 2. Verify OTP & Login
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9876543210","otp":"123456"}'
```

#### 3. Get Scrap Rates
```bash
curl http://localhost:3000/api/scrap-rates/1
```

#### 4. Create Pickup Request (Authenticated)
```bash
curl -X POST http://localhost:3000/api/pickups/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "localityId": 1,
    "category": "plastic",
    "estimatedWeight": 5.5,
    "pickupAddress": "123 Main Street",
    "preferredDate": "2026-01-20",
    "preferredTimeSlot": "morning"
  }'
```

---

## 📁 Project Structure

```
waste-management-backend/
├── server.js                 # Express server (Node.js)
├── database_schema.sql       # Complete database schema
├── package.json              # Node.js dependencies
├── requirements.txt          # Python dependencies
├── .env.example              # Environment variables template
├── .env                      # Your environment variables (git-ignored)
├── API_DOCUMENTATION.md      # Complete API docs
├── README.md                 # This file
└── .gitignore                # Git ignore file
```

---

## 🧪 Testing

### Manual Testing with cURL

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for all endpoint examples.

### Testing Flow

1. **Authentication**
   ```bash
   # Send OTP
   curl -X POST http://localhost:3000/api/auth/send-otp \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber":"9876543210"}'
   
   # Verify OTP (use OTP from response or database)
   curl -X POST http://localhost:3000/api/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber":"9876543210","otp":"123456"}'
   ```

2. **Get Data**
   ```bash
   # Get localities
   curl http://localhost:3000/api/localities
   
   # Get scrap rates for locality 1
   curl http://localhost:3000/api/scrap-rates/1
   ```

3. **Create Pickup Request** (save token from step 1)
   ```bash
   curl -X POST http://localhost:3000/api/pickups/request \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <your-token>" \
     -d '{
       "localityId": 1,
       "category": "plastic",
       "estimatedWeight": 5,
       "pickupAddress": "Test Address",
       "preferredDate": "2026-01-20",
       "preferredTimeSlot": "morning"
     }'
   ```

### Test Users

After running the schema, you have:
- **Admin:** 9999999999 (Create kabadiwalas & manage system)
- **Citizens:** Create via OTP login
- **Kabadiwalas:** Create manually in database or via admin panel

To create a test Kabadiwala:
```sql
-- Create user
INSERT INTO users (phone_number, name, role) 
VALUES ('9988776655', 'Test Kabadiwala', 'kabadiwala');

-- Get the user_id from above insert
SET @kabadiwala_id = LAST_INSERT_ID();

-- Create kabadiwala profile
INSERT INTO kabadiwala_profiles (user_id, service_locality_id) 
VALUES (@kabadiwala_id, 1);
```

---

## 🚀 Deployment

### Prerequisites for Production

1. **Database**
   - MySQL 8.0+ or PostgreSQL hosted on cloud (AWS RDS, Google Cloud SQL, etc.)
   - Proper security groups and firewall rules

2. **Server**
   - VPS or cloud instance (AWS EC2, DigitalOcean, etc.)
   - Domain name (optional but recommended)
   - SSL certificate (Let's Encrypt)

3. **Environment**
   - Strong JWT secret
   - SMS gateway integration (MSG91, Twilio, etc.)
   - Monitoring tools (optional)

### Deployment Steps

#### Option 1: Traditional VPS (Ubuntu)

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js (for Express)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# OR Install Python (for Flask)
sudo apt install -y python3 python3-pip python3-venv

# 3. Install MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# 4. Install Nginx (reverse proxy)
sudo apt install -y nginx

# 5. Clone repository
git clone <your-repo>
cd waste-management-backend

# 6. Install dependencies
npm install  # For Node.js
# OR
python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt

# 7. Setup database
mysql -u root -p < database_schema.sql

# 8. Configure environment
cp .env.example .env
nano .env  # Edit with production values

# 9. Install PM2 (for Node.js) or systemd service
npm install -g pm2
pm2 start server.js --name waste-backend
pm2 save
pm2 startup

# OR for Python, create systemd service
sudo nano /etc/systemd/system/waste-backend.service
```

#### Option 2: Docker

```bash
# Create Dockerfile for Node.js
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]

# Create Dockerfile for Python
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]

# Build and run
docker build -t waste-backend .
docker run -p 3000:3000 --env-file .env waste-backend
```

#### Option 3: Cloud Platforms

**Heroku:**
```bash
heroku create waste-management-backend
heroku addons:create cleardb:ignite
git push heroku main
```

**AWS Elastic Beanstalk:**
```bash
eb init -p node.js-18 waste-backend
eb create waste-backend-env
eb deploy
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;  # Or 5000 for Flask
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## 🔒 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` file
   - Use strong JWT secrets (64+ characters)
   - Rotate secrets regularly

2. **Database**
   - Use strong passwords
   - Limit network access
   - Regular backups
   - Use prepared statements (already implemented)

3. **API Security**
   - Implement rate limiting
   - Add request validation
   - Enable CORS properly
   - Use HTTPS in production

4. **Authentication**
   - Implement JWT with expiration
   - Add refresh token mechanism
   - Integrate real SMS gateway
   - Add brute force protection

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```
Error: Access denied for user 'root'@'localhost'
```
**Solution:** Check DB credentials in `.env` file

#### 2. Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:**
```bash
# Find process using port
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>
```

#### 3. OTP Not Sending
**Solution:** Check SMS gateway configuration or use console logs in development

#### 4. CORS Errors
**Solution:** Update `CORS_ORIGIN` in `.env` to match your frontend URL

---

## 📊 Monitoring & Logs

### Development
```bash
# Node.js
npm run dev  # Logs to console

# Python
python app.py  # Logs to console
```

### Production

#### Using PM2 (Node.js)
```bash
pm2 logs waste-backend
pm2 monit
```

#### Using systemd (Python)
```bash
sudo journalctl -u waste-backend -f
```

---

## 🤝 Contributing

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

### Code Style
- **Node.js:** Follow Airbnb JavaScript Style Guide
- **Python:** Follow PEP 8

---

## 📞 Support

For questions or issues:
1. Check [API Documentation](./API_DOCUMENTATION.md)
2. Review [Troubleshooting](#troubleshooting) section
3. Open an issue on GitHub

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

Built for the **Waste Coordination & Recycling Management System (India Pilot)** project.

**Target Users:**
- Citizens selling recyclable waste
- Kabadiwalas (scrap collectors)
- Municipal administrators

**Impact Goals:**
- Increase recyclable waste recovery by 30%+
- Improve Kabadiwala income stability
- Reduce landfill waste
- Improve garbage collection predictability

---

## 📈 Roadmap

### Phase 1 (Current - MVP)
- ✅ Core API implementation
- ✅ Authentication & authorization
- ✅ Pickup management
- ✅ Payment tracking
- ✅ Analytics dashboard

### Phase 1.5 (Next)
- ⏳ Trust & rating system
- ⏳ Complaint management
- ⏳ QR code verification
- ⏳ Real-time notifications
- ⏳ SMS gateway integration

### Phase 2 (Future)
- 📅 Smart bin integration
- 📅 GPS tracking
- 📅 Automated weighing
- 📅 Carbon credits
- 📅 Blockchain traceability
- 📅 Mobile apps (iOS/Android)

---

Made with ❤️ for a cleaner India 🇮🇳