# 🚀 Quick Start Guide

This guide will get you up and running with the Waste Management System backend in under 10 minutes.

## ⚡ Prerequisites

You need:
- **MySQL** 8.0+ installed
- **Node.js** v16+ OR **Python** 3.8+
- A code editor (VS Code recommended)
- Terminal/Command Prompt

---

## 📥 Step 1: Get the Code

```bash
cd waste-management-backend
```

---

## 🗄️ Step 2: Setup Database

### Start MySQL
```bash
mysql -u root -p
```

### Create Database
```sql
CREATE DATABASE waste_management;
USE waste_management;
SOURCE database_schema.sql;
EXIT;
```

✅ **Verify:** You should now have 15 tables with sample data.

---

## ⚙️ Step 3: Install Dependencies

### Option A: Node.js (Express)
```bash
npm install
```

### Option B: Python (Flask)
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

---

## 🔧 Step 4: Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password  # ← Change this
DB_NAME=waste_management
PORT=3000  # or 5000 for Flask
NODE_ENV=development
```

---

## 🏃 Step 5: Start the Server

### Node.js:
```bash
npm run dev
```

### Python:
```bash
python app.py
```

✅ **Success!** You should see:
```
🚀 Waste Management Backend running on port 3000
📍 API endpoint: http://localhost:3000
```

---

## 🧪 Step 6: Test the API

Open a new terminal and run:

```bash
# Test health endpoint
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2026-01-14T..."}
```

### Test Authentication Flow

1. **Send OTP:**
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9876543210"}'
```

Expected response:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp": "123456"
}
```

2. **Verify OTP and Login:**
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9876543210","otp":"123456"}'
```

Expected response:
```json
{
  "success": true,
  "token": "1",
  "user": {
    "userId": 1,
    "phoneNumber": "9876543210",
    "role": "citizen"
  },
  "isNewUser": true
}
```

3. **Use the token to create a pickup request:**
```bash
curl -X POST http://localhost:3000/api/pickups/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 1" \
  -d '{
    "localityId": 1,
    "category": "plastic",
    "estimatedWeight": 5,
    "pickupAddress": "123 Test Street",
    "preferredDate": "2026-01-25",
    "preferredTimeSlot": "morning"
  }'
```

✅ **Working!** Your backend is ready!

---

## 🎨 Step 7: Connect Your Frontend

In your React frontend (Vite), create an API client:

```javascript
// src/api/client.js
const API_BASE_URL = 'http://localhost:3000/api';

export const api = {
  // Authentication
  sendOTP: async (phoneNumber) => {
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber })
    });
    return response.json();
  },

  verifyOTP: async (phoneNumber, otp) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, otp })
    });
    return response.json();
  },

  // Localities
  getLocalities: async () => {
    const response = await fetch(`${API_BASE_URL}/localities`);
    return response.json();
  },

  // Scrap Rates
  getScrapRates: async (localityId) => {
    const response = await fetch(`${API_BASE_URL}/scrap-rates/${localityId}`);
    return response.json();
  },

  // Pickup Requests
  createPickupRequest: async (token, data) => {
    const response = await fetch(`${API_BASE_URL}/pickups/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  getMyRequests: async (token) => {
    const response = await fetch(`${API_BASE_URL}/pickups/my-requests`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  }
};
```

### Usage Example in React Component:

```javascript
import { useState } from 'react';
import { api } from './api/client';

function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  
  const handleSendOTP = async () => {
    const result = await api.sendOTP(phoneNumber);
    if (result.success) {
      setStep('otp');
      alert(`OTP sent: ${result.otp}`); // Dev only
    }
  };
  
  const handleVerifyOTP = async () => {
    const result = await api.verifyOTP(phoneNumber, otp);
    if (result.success) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      window.location.href = '/dashboard';
    }
  };
  
  return (
    <div>
      {step === 'phone' ? (
        <div>
          <input 
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number"
          />
          <button onClick={handleSendOTP}>Send OTP</button>
        </div>
      ) : (
        <div>
          <input 
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
          />
          <button onClick={handleVerifyOTP}>Verify</button>
        </div>
      )}
    </div>
  );
}
```

---

## 📱 Using Postman

1. Import `Postman_Collection.json`
2. Set variables:
   - `base_url`: `http://localhost:3000`
3. Run requests in order:
   - Send OTP → Verify OTP
   - Copy token from response
   - Set `citizen_token` variable
   - Test other endpoints

---

## 🎯 Next Steps

1. **Build Your Frontend**
   - Use the API client above
   - Create screens for each role (Citizen, Kabadiwala, Admin)

2. **Customize the Backend**
   - Add validation
   - Implement real JWT tokens
   - Integrate SMS gateway
   - Add rate limiting

3. **Deploy**
   - Follow deployment guide in README.md
   - Setup SSL certificate
   - Configure production database

---

## 🐛 Common Issues

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
```

### Database Connection Error
- Check MySQL is running: `mysql --version`
- Verify credentials in `.env`

### OTP Not Working
- In development, OTP is logged to console
- Check server logs for the OTP

### CORS Error
- Update `CORS_ORIGIN` in `.env` to match your frontend URL

---

## 📚 Resources

- **Full API Docs:** [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md)
- **Complete Setup:** [`README.md`](./README.md)
- **Database Schema:** [`database_schema.sql`](./database_schema.sql)

---

## ✅ Checklist

- [ ] MySQL installed and running
- [ ] Database created with schema
- [ ] Dependencies installed
- [ ] `.env` configured
- [ ] Server running
- [ ] Health check passes
- [ ] Authentication flow tested
- [ ] Frontend API client created

---

**You're all set! Start building your waste management platform! 🎉**

Need help? Check the full documentation or open an issue.