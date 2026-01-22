# 📚 Waste Management System - API Documentation

## Base URL
```
http://localhost:3000/api  (Express)
http://localhost:5000/api  (Flask)
```

## Authentication
Most endpoints require authentication using a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 🔐 Authentication Endpoints

### 1. Send OTP
**POST** `/api/auth/send-otp`

Send OTP to user's phone number for authentication.

**Request Body:**
```json
{
  "phoneNumber": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp": "123456"  // Only in development mode
}
```

---

### 2. Verify OTP and Login
**POST** `/api/auth/verify-otp`

Verify OTP and receive authentication token.

**Request Body:**
```json
{
  "phoneNumber": "9876543210",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "token": "user_id_token",
  "user": {
    "userId": 1,
    "phoneNumber": "9876543210",
    "name": "John Doe",
    "role": "citizen"
  },
  "isNewUser": false
}
```

---

## 🏘️ Locality Endpoints

### 3. Get All Localities
**GET** `/api/localities`

Get list of all serviceable localities.

**Response:**
```json
{
  "localities": [
    {
      "locality_id": 1,
      "name": "Koramangala",
      "pincode": "560034",
      "city": "Bangalore",
      "state": "Karnataka",
      "is_serviceable": true
    }
  ]
}
```

---

### 4. Get Locality by Pincode
**GET** `/api/localities/pincode/:pincode`

Get localities for a specific pincode.

**Response:**
```json
{
  "localities": [...]
}
```

---

## 💰 Scrap Rate Endpoints

### 5. Get Current Scrap Rates
**GET** `/api/scrap-rates/:localityId`

Get current scrap rates for a locality.

**Response:**
```json
{
  "rates": [
    {
      "rate_id": 1,
      "locality_id": 1,
      "category": "plastic",
      "rate_per_kg": 15.00,
      "effective_date": "2026-01-14",
      "locality_name": "Koramangala"
    },
    {
      "rate_id": 2,
      "category": "paper",
      "rate_per_kg": 10.00
    },
    {
      "rate_id": 3,
      "category": "metal",
      "rate_per_kg": 40.00
    }
  ]
}
```

---

### 6. Update Scrap Rate (Admin Only)
**POST** `/api/scrap-rates`

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "localityId": 1,
  "category": "plastic",
  "ratePerKg": 16.50,
  "effectiveDate": "2026-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rate updated successfully",
  "rateId": 7
}
```

---

## 👤 Citizen Endpoints

### 7. Get Citizen Profile
**GET** `/api/citizen/profile`

**Headers:** `Authorization: Bearer <citizen_token>`

**Response:**
```json
{
  "profile": {
    "user_id": 1,
    "phone_number": "9876543210",
    "name": "John Doe",
    "role": "citizen",
    "locality_id": 1,
    "address_line1": "123 Main Street",
    "address_line2": "Apartment 4B",
    "landmark": "Near City Mall",
    "preferred_language": "english",
    "locality_name": "Koramangala",
    "pincode": "560034",
    "city": "Bangalore"
  }
}
```

---

### 8. Update Citizen Profile
**PUT** `/api/citizen/profile`

**Headers:** `Authorization: Bearer <citizen_token>`

**Request Body:**
```json
{
  "name": "John Doe",
  "localityId": 1,
  "addressLine1": "123 Main Street",
  "addressLine2": "Apartment 4B",
  "landmark": "Near City Mall",
  "preferredLanguage": "english"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

---

## 📦 Pickup Request Endpoints

### 9. Create Pickup Request
**POST** `/api/pickups/request`

**Headers:** `Authorization: Bearer <citizen_token>`

**Request Body:**
```json
{
  "localityId": 1,
  "category": "plastic",
  "estimatedWeight": 5.5,
  "pickupAddress": "123 Main Street, Apartment 4B, Koramangala",
  "landmark": "Near City Mall",
  "preferredDate": "2026-01-20",
  "preferredTimeSlot": "morning",
  "notes": "Please call before coming"
}
```

**Categories:** `plastic`, `paper`, `metal`
**Time Slots:** `morning`, `afternoon`, `evening`

**Response:**
```json
{
  "success": true,
  "message": "Pickup request created successfully",
  "requestId": 42
}
```

---

### 10. Get My Pickup Requests
**GET** `/api/pickups/my-requests`

**Headers:** `Authorization: Bearer <citizen_token>`

**Response:**
```json
{
  "requests": [
    {
      "request_id": 42,
      "citizen_id": 1,
      "locality_id": 1,
      "category": "plastic",
      "estimated_weight": 5.5,
      "pickup_address": "123 Main Street...",
      "preferred_date": "2026-01-20",
      "status": "assigned",
      "locality_name": "Koramangala",
      "assignment_id": 15,
      "assignment_status": "assigned",
      "actual_weight": null,
      "kabadiwala_name": "Ravi Kumar",
      "kabadiwala_phone": "9988776655",
      "payment_status": "pending",
      "payment_amount": null,
      "created_at": "2026-01-14T10:30:00"
    }
  ]
}
```

---

## 🚚 Kabadiwala Endpoints

### 11. Get Assigned Pickups
**GET** `/api/kabadiwala/pickups?date=2026-01-20`

**Headers:** `Authorization: Bearer <kabadiwala_token>`

**Query Parameters:**
- `date` (optional): Date in YYYY-MM-DD format. Defaults to today.

**Response:**
```json
{
  "pickups": [
    {
      "assignment_id": 15,
      "request_id": 42,
      "sequence_order": 1,
      "status": "assigned",
      "category": "plastic",
      "pickup_address": "123 Main Street, Apartment 4B",
      "landmark": "Near City Mall",
      "citizen_name": "John Doe",
      "citizen_phone": "9876543210",
      "locality_name": "Koramangala",
      "rate_per_kg": 15.00,
      "estimated_weight": 5.5,
      "notes": "Please call before coming"
    }
  ]
}
```

---

### 12. Complete Pickup
**POST** `/api/kabadiwala/complete-pickup`

**Headers:** `Authorization: Bearer <kabadiwala_token>`

**Request Body:**
```json
{
  "assignmentId": 15,
  "actualWeight": 6.2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pickup completed successfully"
}
```

**Side Effects:**
- Updates pickup assignment status to `completed`
- Updates pickup request status to `completed`
- Creates payment record: `amount = actualWeight × rate_per_kg`
- Increments kabadiwala's completed pickups count

---

### 13. Get Earnings
**GET** `/api/kabadiwala/earnings?startDate=2026-01-01&endDate=2026-01-31`

**Headers:** `Authorization: Bearer <kabadiwala_token>`

**Query Parameters:**
- `startDate` (optional): Start date in YYYY-MM-DD format
- `endDate` (optional): End date in YYYY-MM-DD format

**Response:**
```json
{
  "earnings": [
    {
      "date": "2026-01-14",
      "pickups_completed": 8,
      "total_earnings": 520.50,
      "total_weight": 34.7
    },
    {
      "date": "2026-01-13",
      "pickups_completed": 6,
      "total_earnings": 385.00,
      "total_weight": 25.5
    }
  ],
  "summary": {
    "totalPickups": 14,
    "totalEarnings": 905.50,
    "totalWeight": 60.2
  }
}
```

---

## 👨‍💼 Admin Endpoints

### 14. Get Pending Pickup Requests
**GET** `/api/admin/pickups/pending`

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "requests": [
    {
      "request_id": 42,
      "citizen_id": 1,
      "locality_id": 1,
      "category": "plastic",
      "estimated_weight": 5.5,
      "pickup_address": "123 Main Street...",
      "preferred_date": "2026-01-20",
      "preferred_time_slot": "morning",
      "status": "pending",
      "citizen_name": "John Doe",
      "citizen_phone": "9876543210",
      "locality_name": "Koramangala",
      "city": "Bangalore",
      "created_at": "2026-01-14T10:30:00"
    }
  ]
}
```

---

### 15. Get Available Kabadiwalas
**GET** `/api/admin/kabadiwalas?localityId=1`

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `localityId` (optional): Filter by service locality

**Response:**
```json
{
  "kabadiwalas": [
    {
      "user_id": 5,
      "name": "Ravi Kumar",
      "phone_number": "9988776655",
      "trust_score": 4.85,
      "total_pickups": 150,
      "completed_pickups": 145,
      "is_available": true,
      "service_locality_name": "Koramangala"
    }
  ]
}
```

---

### 16. Assign Pickup to Kabadiwala
**POST** `/api/admin/assign-pickup`

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "requestId": 42,
  "kabadiwalId": 5,
  "assignedDate": "2026-01-20",
  "sequenceOrder": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pickup assigned successfully",
  "assignmentId": 15
}
```

**Side Effects:**
- Creates pickup assignment
- Updates request status from `pending` to `assigned`
- Increments kabadiwala's total pickups count

---

### 17. Get Analytics Dashboard
**GET** `/api/admin/analytics`

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "summary": {
    "totalPickups": 1247,
    "totalWeightKg": 8543.5,
    "totalEarnings": 125680.50,
    "activeKabadiwalas": 23
  },
  "pickupsByCategory": [
    {
      "category": "plastic",
      "count": 520,
      "total_weight": 3200.5
    },
    {
      "category": "paper",
      "count": 450,
      "total_weight": 3150.0
    },
    {
      "category": "metal",
      "count": 277,
      "total_weight": 2193.0
    }
  ],
  "recentPickups": [
    {
      "request_id": 42,
      "locality_name": "Koramangala",
      "citizen_name": "John Doe",
      "kabadiwala_name": "Ravi Kumar",
      "category": "plastic",
      "actual_weight": 6.2,
      "pickup_completed_at": "2026-01-14T14:30:00",
      "status": "completed"
    }
  ]
}
```

---

## 🗑️ Garbage Schedule Endpoints

### 18. Get Garbage Schedule
**GET** `/api/garbage-schedule/:localityId`

Get garbage collection schedule for a locality.

**Response:**
```json
{
  "schedules": [
    {
      "schedule_id": 1,
      "locality_id": 1,
      "collection_day": "monday",
      "time_window_start": "07:00:00",
      "time_window_end": "09:00:00",
      "is_active": true,
      "locality_name": "Koramangala"
    },
    {
      "schedule_id": 2,
      "collection_day": "wednesday",
      "time_window_start": "07:00:00",
      "time_window_end": "09:00:00"
    }
  ]
}
```

---

### 19. Report Missed Garbage Pickup
**POST** `/api/garbage-schedule/missed`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "localityId": 1,
  "scheduledDate": "2026-01-14",
  "notes": "Garbage truck did not arrive during scheduled time"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Missed pickup reported successfully"
}
```

---

## 💳 Payment Endpoints

### 20. Get Citizen Payment History
**GET** `/api/payments/citizen`

**Headers:** `Authorization: Bearer <citizen_token>`

**Response:**
```json
{
  "payments": [
    {
      "payment_id": 12,
      "assignment_id": 15,
      "amount": 93.00,
      "payment_status": "paid",
      "upi_reference": "UPI123456789",
      "payment_date": "2026-01-14T15:00:00",
      "kabadiwala_name": "Ravi Kumar",
      "category": "plastic",
      "pickup_address": "123 Main Street...",
      "actual_weight": 6.2,
      "pickup_completed_at": "2026-01-14T14:30:00"
    }
  ]
}
```

---

### 21. Update Payment Status
**PUT** `/api/payments/:paymentId/status`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "paymentStatus": "paid",
  "upiReference": "UPI123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment status updated"
}
```

---

## 🏥 Health Check

### 22. Health Check
**GET** `/health`

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-14T10:30:00.000Z"
}
```

---

## 📊 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔒 Role-Based Access

| Endpoint | Citizen | Kabadiwala | Admin |
|----------|---------|------------|-------|
| Send OTP | ✅ | ✅ | ✅ |
| Verify OTP | ✅ | ✅ | ✅ |
| Get Localities | ✅ | ✅ | ✅ |
| Get Scrap Rates | ✅ | ✅ | ✅ |
| Update Scrap Rates | ❌ | ❌ | ✅ |
| Citizen Profile | ✅ | ❌ | ❌ |
| Create Pickup Request | ✅ | ❌ | ❌ |
| My Pickup Requests | ✅ | ❌ | ❌ |
| Kabadiwala Pickups | ❌ | ✅ | ❌ |
| Complete Pickup | ❌ | ✅ | ❌ |
| Kabadiwala Earnings | ❌ | ✅ | ❌ |
| Pending Pickups | ❌ | ❌ | ✅ |
| Get Kabadiwalas | ❌ | ❌ | ✅ |
| Assign Pickup | ❌ | ❌ | ✅ |
| Analytics Dashboard | ❌ | ❌ | ✅ |
| Payment History | ✅ | ✅ | ✅ |

---

## 🚀 Testing with cURL

### Send OTP
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9876543210"}'
```

### Verify OTP
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9876543210","otp":"123456"}'
```

### Get Localities
```bash
curl http://localhost:3000/api/localities
```

### Create Pickup Request (with authentication)
```bash
curl -X POST http://localhost:3000/api/pickups/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "localityId": 1,
    "category": "plastic",
    "estimatedWeight": 5.5,
    "pickupAddress": "123 Main Street",
    "landmark": "Near City Mall",
    "preferredDate": "2026-01-20",
    "preferredTimeSlot": "morning"
  }'
```

---

## 🔧 Common Issues & Solutions

### Issue: "Access token required"
**Solution:** Include Authorization header:
```
Authorization: Bearer <token>
```

### Issue: "Insufficient permissions"
**Solution:** Verify you're using a token with the correct role for the endpoint.

### Issue: "Invalid or expired OTP"
**Solution:** 
- OTPs expire after 10 minutes
- Request a new OTP
- Ensure phone number and OTP match exactly

### Issue: "Pickup already assigned"
**Solution:** Each pickup request can only be assigned once. Check if it's already assigned.

---

## 📝 Notes

1. **Development Mode:** In development, the OTP is returned in the response for testing purposes. This should be removed in production.

2. **Authentication:** The current implementation uses a simple user_id-based token. In production, implement proper JWT tokens with expiration.

3. **Phone Numbers:** All phone numbers should be 10 digits (Indian format).

4. **Dates:** All dates should be in YYYY-MM-DD format.

5. **Times:** All times should be in HH:MM:SS format (24-hour).

6. **Weights:** All weights are in kilograms (kg).

7. **Currency:** All amounts are in Indian Rupees (₹).