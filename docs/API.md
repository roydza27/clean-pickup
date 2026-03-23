# Section 5: API Contract
## Waste Coordination & Recycling Management System
### India Pilot MVP

## 5.1 Conventions

### Base URL
```
Development:  http://localhost:4000/api
Staging:      https://staging-api.wastemgmt.in/api
Production:   https://api.wastemgmt.in/api
```

### Response Envelope
Every response — success or failure — uses this structure:
```json
// Success (single resource)
{ "success": true, "data": { ... } }

// Success (collection)
{ "success": true, "data": [...], "meta": { "page": 1, "limit": 20, "total": 143, "totalPages": 8 } }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human-readable message", "details": [...] } }
```

### Naming Conventions
- URL paths: `kebab-case` (`/my-requests`, `/send-otp`)
- JSON keys: `camelCase` (`phoneNumber`, `localityId`)
- Enum values in payloads: `snake_case` (`in_progress`, `rate_per_kg`)
- Dates: `YYYY-MM-DD`
- Timestamps: ISO 8601 UTC (`2026-03-15T08:30:00.000Z`)
- Monetary values: decimal string with 2 places (`"125.50"`)
- Weights: decimal in kg (`5.25`)

### Authentication Header
```
Authorization: Bearer <jwt_token>
```
Endpoints marked `🔒` require this header. Endpoints marked `🔓` are public.

---

## 5.2 Authentication Endpoints

### `POST /auth/send-otp` 🔓
Send OTP to a phone number.

**Request**
```json
{ "phoneNumber": "9876543210" }
```

**Response `200`**
```json
{ "success": true, "data": { "message": "OTP sent successfully" } }
```
*Development only: server logs contain OTP. Never in response body.*

**Errors**
| Code | Status | Condition |
|---|---|---|
| `OTP_RATE_EXCEEDED` | 429 | > 5 OTP requests for this number in the last hour |
| `VALIDATION_ERROR` | 400 | Phone number not 10 digits |

---

### `POST /auth/verify-otp` 🔓
Verify OTP and receive JWT.

**Request**
```json
{
  "phoneNumber": "9876543210",
  "otp": "482931",
  "role": "citizen"
}
```
`role` is required for new users. Values: `"citizen"` or `"kabadiwala"`. Ignored for returning users.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": 42,
      "name": "Priya Sharma",
      "role": "citizen",
      "localityId": 1
    },
    "isNewUser": false
  }
}
```

**Errors**
| Code | Status | Condition |
|---|---|---|
| `OTP_EXPIRED` | 400 | OTP TTL (5 min) elapsed |
| `INVALID_OTP` | 400 | OTP does not match |
| `OTP_MAX_ATTEMPTS` | 429 | 5 consecutive failures — 15-min lockout |
| `ROLE_MISMATCH` | 403 | Returning user attempted login with different role |
| `ACCOUNT_INACTIVE` | 403 | User account deactivated |

---

### `POST /auth/logout` 🔒
Invalidate the current session.

**Response `200`**
```json
{ "success": true, "data": { "message": "Logged out successfully" } }
```

---

## 5.3 Locality Endpoints

### `GET /localities` 🔓
List all serviceable localities.

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "localityId": 1,
      "name": "Koramangala",
      "city": "Bangalore",
      "state": "Karnataka",
      "pincode": "560034",
      "isServiceable": true
    }
  ]
}
```

---

### `GET /localities/pincode/:pincode` 🔓
Find localities by pincode.

**Params:** `pincode` — 6-digit string

**Response `200`** — same structure as above, filtered by pincode

**Errors**
| Code | Status | Condition |
|---|---|---|
| `NOT_FOUND` | 404 | No locality for this pincode |

---

### `GET /localities/:id/scrap-rates` 🔓
Current scrap rates for a locality (latest rate per category).

**Response `200`**
```json
{
  "success": true,
  "data": {
    "localityId": 1,
    "localityName": "Koramangala",
    "rates": [
      { "category": "plastic", "ratePerKg": "15.00", "effectiveDate": "2026-03-20" },
      { "category": "paper",   "ratePerKg": "10.00", "effectiveDate": "2026-03-20" },
      { "category": "metal",   "ratePerKg": "40.00", "effectiveDate": "2026-03-19" }
    ],
    "lastUpdatedAt": "2026-03-20T05:30:00.000Z"
  }
}
```

---

### `POST /localities/:id/scrap-rates` 🔒 Admin only
Set a new scrap rate for a category.

**Request**
```json
{
  "category": "plastic",
  "ratePerKg": 16.50,
  "effectiveDate": "2026-03-22"
}
```

**Response `201`**
```json
{ "success": true, "data": { "rateId": 28, "message": "Rate set successfully" } }
```

**Errors**
| Code | Status | Condition |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Past `effectiveDate` |
| `CONFLICT` | 409 | Rate already set for this category on this date |

---

## 5.4 Citizen Endpoints

### `GET /citizen/profile` 🔒 Citizen only

**Response `200`**
```json
{
  "success": true,
  "data": {
    "userId": 42,
    "name": "Priya Sharma",
    "phoneNumber": "98XXXXX210",
    "localityId": 1,
    "localityName": "Koramangala",
    "addressLine1": "45, 7th Cross",
    "addressLine2": "Sector 6",
    "landmark": "Near Apollo Pharmacy",
    "preferredLanguage": "english"
  }
}
```
*`phoneNumber` is partially masked in API responses (security).*

---

### `PUT /citizen/profile` 🔒 Citizen only

**Request**
```json
{
  "name": "Priya Sharma",
  "localityId": 1,
  "addressLine1": "45, 7th Cross",
  "addressLine2": "Sector 6",
  "landmark": "Near Apollo Pharmacy",
  "preferredLanguage": "english"
}
```
*`phoneNumber` and `role` are not accepted in this endpoint.*

**Response `200`**
```json
{ "success": true, "data": { "message": "Profile updated successfully" } }
```

---

## 5.5 Pickup Request Endpoints

### `POST /pickups/request` 🔒 Citizen only
Create a new pickup request.

**Request**
```json
{
  "localityId": 1,
  "category": "plastic",
  "estimatedWeight": 5.5,
  "pickupAddress": "45, 7th Cross, Sector 6, Koramangala",
  "landmark": "Near Apollo Pharmacy",
  "preferredDate": "2026-03-25",
  "preferredTimeSlot": "morning",
  "notes": "Please call before arriving"
}
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "requestId": 301,
    "status": "requested",
    "ratePerKgAtRequest": "15.00",
    "message": "Pickup request created. A kabadiwala will be assigned shortly."
  }
}
```

**Errors**
| Code | Status | Condition |
|---|---|---|
| `DUPLICATE_PICKUP_DATE` | 409 | Active request already exists for this date |
| `LOCALITY_NOT_SERVICEABLE` | 400 | Locality not active |
| `VALIDATION_ERROR` | 400 | Past date / > 7 days / weight out of range |
| `NOT_FOUND` | 404 | No scrap rate for this category in this locality |

---

### `GET /pickups/my-requests` 🔒 Citizen only
List all of the authenticated citizen's pickup requests.

**Query params:** `?status=assigned&page=1&limit=20`

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "requestId": 301,
      "category": "plastic",
      "status": "assigned",
      "estimatedWeight": 5.5,
      "pickupAddress": "45, 7th Cross, Koramangala",
      "preferredDate": "2026-03-25",
      "preferredTimeSlot": "morning",
      "ratePerKgAtRequest": "15.00",
      "createdAt": "2026-03-23T10:15:00.000Z",
      "assignment": {
        "assignmentId": 88,
        "kabadiwalName": "Ravi Kumar",
        "kabadiwalPhone": "99XXXXX655",
        "assignedAt": "2026-03-23T10:15:42.000Z"
      },
      "payment": null
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 14, "totalPages": 1 }
}
```

---

### `GET /pickups/:id` 🔒 Citizen (own) or Admin
Get full details of one pickup request.

**Response `200`** — same shape as one item from `my-requests` list, with additional `statusHistory` array:
```json
{
  "success": true,
  "data": {
    "requestId": 301,
    ...
    "statusHistory": [
      { "from": null,        "to": "requested", "changedAt": "2026-03-23T10:15:00.000Z" },
      { "from": "requested", "to": "assigned",  "changedAt": "2026-03-23T10:15:42.000Z" }
    ]
  }
}
```

---

### `PATCH /pickups/:id/cancel` 🔒 Citizen (own) or Admin
Cancel a pickup request.

**Request**
```json
{ "reason": "Not at home that day" }
```

**Response `200`**
```json
{ "success": true, "data": { "message": "Pickup request cancelled" } }
```

**Errors**
| Code | Status | Condition |
|---|---|---|
| `INVALID_STATUS_TRANSITION` | 409 | Pickup is already completed or cancelled |
| `NOT_FOUND` | 404 | Pickup not found |

---

## 5.6 Kabadiwala Endpoints

### `GET /kabadiwala/profile` 🔒 Kabadiwala only

**Response `200`**
```json
{
  "success": true,
  "data": {
    "userId": 7,
    "name": "Ravi Kumar",
    "phoneNumber": "99XXXXX655",
    "serviceLocalityId": 1,
    "serviceLocalityName": "Koramangala",
    "isAvailable": true,
    "totalPickups": 210,
    "completedPickups": 198,
    "reliabilityScore": "0.943"
  }
}
```

---

### `PATCH /kabadiwala/availability` 🔒 Kabadiwala only
Toggle availability status.

**Request**
```json
{ "isAvailable": false }
```

**Response `200`**
```json
{ "success": true, "data": { "isAvailable": false } }
```

---

### `GET /kabadiwala/pickups` 🔒 Kabadiwala only
Today's (or a specific date's) assigned pickup queue, ordered by `sequence_order`.

**Query params:** `?date=2026-03-25`

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "assignmentId": 88,
      "requestId": 301,
      "sequenceOrder": 1,
      "status": "assigned",
      "category": "plastic",
      "pickupAddress": "45, 7th Cross, Koramangala",
      "landmark": "Near Apollo Pharmacy",
      "preferredTimeSlot": "morning",
      "estimatedWeight": 5.5,
      "ratePerKg": "15.00",
      "citizenName": "Priya Sharma",
      "citizenPhone": "98XXXXX210",
      "notes": "Please call before arriving",
      "pickupLat": 12.9352,
      "pickupLng": 77.6245
    }
  ]
}
```

---

### `PATCH /kabadiwala/pickups/:assignmentId/start` 🔒 Kabadiwala only
Mark a pickup as in progress (kabadiwala is on the way).

**Request**
```json
{
  "currentLat": 12.9280,
  "currentLng": 77.6270
}
```
*Coordinates optional — update `last_known_lat/lng` on profile.*

**Response `200`**
```json
{ "success": true, "data": { "status": "in_progress" } }
```

---

### `POST /kabadiwala/pickups/:assignmentId/complete` 🔒 Kabadiwala only
Complete a pickup. Triggers payment record creation.

**Request**
```json
{
  "actualWeight": 6.2,
  "completionPhotoUrl": "https://storage.wastemgmt.in/photos/pa88.jpg"
}
```
*`completionPhotoUrl` is optional in MVP.*

**Response `200`**
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "actualWeight": 6.2,
    "paymentAmount": "93.00",
    "paymentId": 55
  }
}
```

**Errors**
| Code | Status | Condition |
|---|---|---|
| `ALREADY_COMPLETED` | 409 | Idempotent guard — already completed |
| `INVALID_STATUS_TRANSITION` | 409 | Assignment not in `assigned` or `in_progress` |
| `VALIDATION_ERROR` | 400 | Weight > 5× estimated / out of range |

---

### `POST /kabadiwala/pickups/:assignmentId/fail` 🔒 Kabadiwala only
Report inability to complete a pickup.

**Request**
```json
{ "failureReason": "Citizen not available at address" }
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "message": "Pickup marked as failed. Reassignment will be attempted."
  }
}
```

---

### `GET /kabadiwala/earnings` 🔒 Kabadiwala only
Daily earnings summary.

**Query params:** `?startDate=2026-03-01&endDate=2026-03-23`

**Response `200`**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPickups": 18,
      "totalEarningsRs": "2340.00",
      "totalWeightKg": "156.00"
    },
    "daily": [
      {
        "date": "2026-03-23",
        "pickupsCompleted": 6,
        "earningsRs": "780.00",
        "totalWeightKg": "52.00"
      }
    ]
  }
}
```

---

## 5.7 Payment Endpoints

### `GET /payments` 🔒 Citizen or Kabadiwala
Payment history for the authenticated user.

**Query params:** `?status=pending&page=1&limit=20`

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "paymentId": 55,
      "assignmentId": 88,
      "amountRs": "93.00",
      "status": "pending",
      "category": "plastic",
      "actualWeightKg": 6.2,
      "ratePerKg": "15.00",
      "pickupAddress": "45, 7th Cross, Koramangala",
      "completedAt": "2026-03-23T14:30:00.000Z",
      "upiReference": null,
      "paidAt": null
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 }
}
```

---

### `PATCH /payments/:id/confirm` 🔒 Citizen only
Confirm payment with UPI reference.

**Request**
```json
{
  "upiReference": "UPI2026032312345@okaxis"
}
```

**Response `200`**
```json
{
  "success": true,
  "data": { "paymentId": 55, "status": "paid", "paidAt": "2026-03-23T15:00:00.000Z" }
}
```

**Errors**
| Code | Status | Condition |
|---|---|---|
| `PAYMENT_NOT_PENDING` | 409 | Payment already paid or disputed |

---

### `POST /payments/:id/dispute` 🔒 Citizen or Kabadiwala
Raise a payment dispute.

**Request**
```json
{ "reason": "Kabadiwala entered wrong weight" }
```

**Response `200`**
```json
{ "success": true, "data": { "status": "disputed", "message": "Dispute raised. Admin will review within 24 hours." } }
```

---

## 5.8 Garbage Schedule Endpoints

### `GET /garbage-schedules/:localityId` 🔓

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "scheduleId": 3,
      "collectionDay": "monday",
      "timeWindowStart": "07:00:00",
      "timeWindowEnd": "09:00:00",
      "isActive": true
    },
    {
      "scheduleId": 4,
      "collectionDay": "thursday",
      "timeWindowStart": "07:00:00",
      "timeWindowEnd": "09:00:00",
      "isActive": true
    }
  ]
}
```

---

### `POST /garbage-schedules/missed` 🔒 Citizen only
Report a missed municipal garbage collection.

**Request**
```json
{
  "localityId": 1,
  "scheduledDate": "2026-03-23",
  "notes": "Truck did not arrive during 7-9 AM window"
}
```

**Response `201`**
```json
{ "success": true, "data": { "message": "Missed pickup reported. Thank you." } }
```

---

## 5.9 Admin Endpoints

### `GET /admin/dashboard` 🔒 Admin only
Analytics overview.

**Query params:** `?startDate=2026-03-01&endDate=2026-03-23`

**Response `200`**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPickups": 847,
      "completedPickups": 721,
      "failedPickups": 38,
      "completionRate": "85.1",
      "totalWeightKg": "5842.50",
      "totalPaymentsRs": "87637.50",
      "activeKabadiwalas": 18
    },
    "byCategory": [
      { "category": "plastic", "count": 390, "totalWeightKg": "2730.00" },
      { "category": "paper",   "count": 280, "totalWeightKg": "1960.00" },
      { "category": "metal",   "count": 151, "totalWeightKg": "1152.50" }
    ],
    "byLocality": [
      { "localityName": "Koramangala", "completedPickups": 320, "totalWeightKg": "2240.00" }
    ]
  }
}
```

---

### `GET /admin/pickups/unassigned` 🔒 Admin only
Pickups needing manual assignment.

**Response `200`** — list of pickup requests with status `requested` or `unassigned_no_availability`.

---

### `POST /admin/pickups/assign` 🔒 Admin only
Manually assign a pickup to a kabadiwala.

**Request**
```json
{
  "requestId": 305,
  "kabadiwalId": 7,
  "adminNote": "Kabadiwala Ravi requested this area specifically"
}
```

**Response `200`**
```json
{ "success": true, "data": { "assignmentId": 92, "message": "Pickup manually assigned" } }
```

---

### `GET /admin/kabadiwalas` 🔒 Admin only
List all kabadiwalas with performance stats.

**Query params:** `?localityId=1&isAvailable=true`

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "userId": 7,
      "name": "Ravi Kumar",
      "phoneNumber": "99XXXXX655",
      "serviceLocalityName": "Koramangala",
      "isAvailable": true,
      "totalPickups": 210,
      "completedPickups": 198,
      "reliabilityScore": "0.943",
      "todayAssignmentCount": 4
    }
  ]
}
```

---

### `GET /admin/learning/weights` 🔒 Admin only
Current active weights and full history.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "active": {
      "configId": 5,
      "wDistance": "0.281",
      "wWorkload": "0.312",
      "wReliability": "0.407",
      "source": "learning_loop",
      "improvementPct": "8.3",
      "effectiveFrom": "2026-03-17T20:30:00.000Z"
    },
    "history": [
      {
        "configId": 4,
        "wDistance": "0.310",
        "wWorkload": "0.320",
        "wReliability": "0.370",
        "source": "learning_loop",
        "improvementPct": "5.7",
        "effectiveFrom": "2026-03-10T20:30:00.000Z"
      }
    ]
  }
}
```

---

### `PUT /admin/learning/weights` 🔒 Admin only
Manually override factor weights.

**Request**
```json
{
  "wDistance": 0.250,
  "wWorkload": 0.350,
  "wReliability": 0.400,
  "adminNote": "Reliability weight boosted — complaints about unreliable kabadiwalas this week"
}
```

**Response `200`**
```json
{ "success": true, "data": { "configId": 6, "message": "Weights updated" } }
```

---

## 5.10 Health & System

### `GET /health` 🔓
```json
{ "status": "ok", "timestamp": "2026-03-23T08:30:00.000Z", "version": "1.0.0" }
```

### `GET /health/deep` 🔒 Admin only
```json
{
  "status": "ok",
  "checks": {
    "database": { "status": "ok", "responseMs": 3 },
    "redis":    { "status": "ok", "responseMs": 1 },
    "storage":  { "status": "ok" }
  }
}
```

---

---
