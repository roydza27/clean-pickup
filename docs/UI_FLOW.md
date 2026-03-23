# Section 6: UI Flow
## Waste Coordination & Recycling Management System
### India Pilot MVP

## 6.1 Citizen Journey

### Screen 1: Login
```
┌─────────────────────────────────┐
│  Waste Pickup                   │
│  ────────────────────────────── │
│  [📱] Phone Number              │
│  [9876543210          ]         │
│                                 │
│  [    Send OTP    ]             │
│                                 │
│  First time? Select your role:  │
│  ○ I generate waste (Citizen)   │
│  ○ I collect scrap (Kabadiwala) │
└─────────────────────────────────┘
        ↓ (after send-otp)
┌─────────────────────────────────┐
│  Enter OTP                      │
│  Sent to 98XXXXX210             │
│  ────────────────────────────── │
│  [4] [8] [2] [9] [3] [1]        │
│                                 │
│  Resend OTP in 4:32             │
│                                 │
│  [    Verify    ]               │
└─────────────────────────────────┘
```

**Logic:**
- Role selector only appears for new users (determined by `isNewUser` in verify-otp response)
- Resend button disabled for 5 minutes, then re-enabled
- After 5 failed OTPs: show "Too many attempts" with countdown timer from 15 minutes
- On success: `token` and `user` stored to localStorage → navigate to Dashboard

---

### Screen 2: Dashboard
```
┌─────────────────────────────────┐
│  👋 Hi Priya          [Profile] │
│  Koramangala                    │
│  ────────────────────────────── │
│  ┌─────────────────────────┐    │
│  │ 🚚 Pickup Assigned       │    │
│  │ Today · Morning          │    │
│  │ Ravi Kumar · 99XXXXX655  │    │
│  │ ████████░░ In Progress   │    │
│  └─────────────────────────┘    │
│                                 │
│  Current Rates · Koramangala    │
│  ♻️ Plastic  ₹15/kg             │
│  📄 Paper    ₹10/kg             │
│  ⚙️ Metal    ₹40/kg             │
│                                 │
│  [ + Schedule Pickup ]          │
│  ────────────────────────────── │
│  Recent Pickups                 │
│  Mar 20 · Plastic · ₹93.00 ✓   │
│  Mar 15 · Metal   · ₹80.00 ✓   │
└─────────────────────────────────┘
│ 🏠 Home │ 📦 Request │ 💰 Pay │ 👤 │
```

**Logic:**
- Active pickup card shows only if a non-completed request exists (React Query: `queryKeys.pickups.mine`, filtered to non-terminal status)
- Scrap rates fetched for citizen's `localityId` (from JWT); 1-hour React Query staleTime
- "Schedule Pickup" button hidden if citizen already has active pickup for today (prevents duplicate — UX layer mirrors PICKUP-02)

---

### Screen 3: Request Pickup (4-step form)

**Step 1 — Category + Rate**
```
┌─────────────────────────────────┐
│  ← Schedule Pickup     1 of 4  │
│  What are you selling?          │
│  ────────────────────────────── │
│  ┌──────┐  ┌──────┐  ┌──────┐  │
│  │  ♻️  │  │  📄  │  │  ⚙️  │  │
│  │Plastic│  │ Paper│  │Metal │  │
│  │₹15/kg│  │₹10/kg│  │₹40/kg│  │
│  └──────┘  └──────┘  └──────┘  │
│  [Selected: Plastic ✓]          │
│                                 │
│  Est. weight (kg):              │
│  [ 5.5                ]         │
│                                 │
│  Estimated payout: ~₹82.50      │
│                                 │
│  [    Next →    ]               │
└─────────────────────────────────┘
```

**Step 2 — Date & Time**
```
┌─────────────────────────────────┐
│  ← Category            2 of 4  │
│  When should we come?           │
│  ────────────────────────────── │
│  [  ◀ March 2026  ▶  ]         │
│  Mo Tu We Th Fr Sa Su           │
│  ...calendar (7 days only)...   │
│  [23 selected]                  │
│                                 │
│  Time slot:                     │
│  ● Morning   (8 AM – 12 PM)     │
│  ○ Afternoon (12 PM – 4 PM)     │
│  ○ Evening   (4 PM – 7 PM)      │
│                                 │
│  [    Next →    ]               │
└─────────────────────────────────┘
```
*Calendar: Today + next 6 days only. Dates with existing active requests are greyed out.*

**Step 3 — Address**
```
┌─────────────────────────────────┐
│  ← Date & Time         3 of 4  │
│  Where should we come?          │
│  ────────────────────────────── │
│  Address *                      │
│  [ 45, 7th Cross, Sector 6... ] │
│                                 │
│  Landmark (helps kabadiwala)    │
│  [ Near Apollo Pharmacy       ] │
│                                 │
│  Special instructions           │
│  [ Call before arriving       ] │
│                                 │
│  [📍 Use my current location ]  │
│                                 │
│  [    Next →    ]               │
└─────────────────────────────────┘
```

**Step 4 — Summary + Submit**
```
┌─────────────────────────────────┐
│  ← Address             4 of 4  │
│  Confirm Request                │
│  ────────────────────────────── │
│  Category:   ♻️ Plastic         │
│  Est. weight: 5.5 kg            │
│  Rate:       ₹15.00/kg          │
│  Est. payout: ~₹82.50           │
│                                 │
│  Date:  Mon, Mar 25 · Morning   │
│  Address: 45, 7th Cross...      │
│  Landmark: Near Apollo...       │
│                                 │
│  ⚠️ Rate locked at ₹15/kg       │
│     (won't change after submit) │
│                                 │
│  [ Submit Pickup Request ]      │
└─────────────────────────────────┘
```

**Post-submit:** Navigate to Dashboard. Toast: "Request submitted! A kabadiwala will be assigned shortly."

---

### Screen 4: Payment Confirmation
```
┌─────────────────────────────────┐
│  Payment · Mar 23               │
│  ────────────────────────────── │
│  ♻️ Plastic · 6.2 kg            │
│  Rate: ₹15.00/kg                │
│  ──────────────────             │
│  Amount: ₹93.00                 │
│  Collected by: Ravi Kumar       │
│                                 │
│  Pay Ravi via UPI:              │
│  UPI ID: ravi.k@upi             │
│  [    Open UPI App    ]         │
│                                 │
│  After paying, enter reference: │
│  [ UPI2026032312345@okaxis ]     │
│                                 │
│  [  Confirm Payment  ]          │
└─────────────────────────────────┘
```

**Logic:**
- "Open UPI App" button uses `upi://pay?pa=ravi.k@upi&am=93.00` deep link
- UPI reference field: minimum 8 chars, validated before submit
- On confirm: `PATCH /payments/:id/confirm` → toast "Payment confirmed ✓"

---

## 6.2 Kabadiwala Journey

### Screen 1: Today's Queue (Primary Screen)
```
┌─────────────────────────────────┐
│  Ravi Kumar         [Available] │
│  Koramangala · Mon, Mar 25      │
│  4 pickups today                │
│  ────────────────────────────── │
│  #1 · Morning                   │
│  45, 7th Cross, Sector 6        │
│  Near Apollo Pharmacy           │
│  ♻️ Plastic · ~5.5 kg           │
│  Priya Sharma · 98XXXXX210      │
│  [📍 Navigate] [▶ Start]        │
│  ────────────────────────────── │
│  #2 · Morning                   │
│  12, 3rd Main, HSR Layout       │
│  ⚙️ Metal · ~3.0 kg             │
│  Amit Patel · 87XXXXX331        │
│  [📍 Navigate]                  │
│  ────────────────────────────── │
│  #3 · Afternoon  ...            │
└─────────────────────────────────┘
│  📋 Today │ 💰 Earnings │ 👤    │
```

**Logic:**
- Queue polled every 2 minutes (`refetchInterval: 120_000` in `useTodayPickups`)
- "Navigate" button: opens `https://maps.google.com/?daddr={pickupLat},{pickupLng}`
- "Start" button only visible on the first non-in-progress assignment (enforces sequential pickup)
- Availability toggle in header calls `PATCH /kabadiwala/availability`

---

### Screen 2: Active Pickup
```
┌─────────────────────────────────┐
│  ← Queue          🔴 In Progress│
│  Priya Sharma                   │
│  45, 7th Cross, Sector 6        │
│  Near Apollo Pharmacy           │
│  ────────────────────────────── │
│  ♻️ Plastic                     │
│  Estimated: ~5.5 kg             │
│  Rate: ₹15/kg                   │
│                                 │
│  📞 Call Citizen                │
│                                 │
│  ─── Complete Pickup ───        │
│  Actual weight (kg):            │
│  [ 6.2       ] kg               │
│                                 │
│  [  ✓ Mark Complete  ]          │
│                                 │
│  [  ✗ Can't Complete  ]         │
└─────────────────────────────────┘
```

**Logic:**
- "Call Citizen" button: `tel:{citizenPhone}` native call
- Weight input: numeric keyboard, decimal allowed, max 500
- "Mark Complete" → confirmation modal → `POST /kabadiwala/pickups/:id/complete`
- "Can't Complete" → reason selection modal → `POST /kabadiwala/pickups/:id/fail`
- On complete: navigate to Queue, toast "₹93.00 earned ✓"

---

### Screen 3: Earnings
```
┌─────────────────────────────────┐
│  Earnings                       │
│  This Week · Mar 17–23          │
│  ────────────────────────────── │
│  Total: ₹3,480.00               │
│  Pickups: 24 · Weight: 232 kg   │
│                                 │
│  ── Daily Breakdown ──          │
│  Mon 23  6 pickups  ₹780.00     │
│  Sun 22  5 pickups  ₹650.00     │
│  Sat 21  4 pickups  ₹520.00     │
│  ...                            │
│                                 │
│  [  This Week  | This Month ]   │
└─────────────────────────────────┘
```

---

## 6.3 Admin Journey

### Screen 1: Dashboard Overview
```
┌──────────────────────────────────────────────────────────┐
│  🗑️ WasteMgmt Admin         System OK · 18 kabadiwalas  │
│ ──────────────────────────────────────────────────────── │
│  [Dashboard] [Assignments] [Rates] [Kabadiwalas] [ML]    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  847     │ │  85.1%   │ │  5,842   │ │ ₹87,637  │   │
│  │ Pickups  │ │Completion│ │   kg     │ │ Payments │   │
│  │ ↑12% WoW │ │ ↑3.2%    │ │ Diverted │ │  ↑8% MoM │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│  ⚠️  3 pickups unassigned · 1 stale assignment (>24h)    │
│                                                          │
│  [Pickup Completion Rate ─── line chart ───]             │
│  [Pickups by Category ─── bar chart ───────]             │
└──────────────────────────────────────────────────────────┘
```

---

### Screen 2: Assignment Queue
```
┌──────────────────────────────────────────────────────────┐
│  Assignments  [All] [Unassigned] [In Progress] [Failed]  │
├──────────────────────────────────────────────────────────┤
│  ID   │ Citizen   │ Category │ Date    │ Status     │ ⚡  │
│  305  │ Meena V.  │ Plastic  │ Mar 25  │ Unassigned │[+] │
│  298  │ Suresh K. │ Metal    │ Mar 24  │ Failed     │[↺] │
│  301  │ Priya S.  │ Plastic  │ Mar 25  │ Assigned   │ —  │
├──────────────────────────────────────────────────────────┤
│  [+] = Manually Assign   [↺] = Reassign                  │
└──────────────────────────────────────────────────────────┘

── Manual Assign Modal ──
  Request #305 · Plastic · Mar 25 · Koramangala
  ────────────────────────────────────────────
  Select Kabadiwala:
  ● Ravi Kumar    · 4/10 pickups today · Score 0.86
  ○ Mohan Das     · 7/10 pickups today · Score 0.71
  ○ Sunil Verma   · 2/10 pickups today · Score 0.69
  
  Note (required):
  [ Assigned per citizen request              ]
  
  [ Confirm Assignment ]
```

---

### Screen 3: Learning Insights
```
┌──────────────────────────────────────────────────────────┐
│  Assignment Intelligence                                  │
├──────────────────────────────────────────────────────────┤
│  Current Weights (Config #5 · Active since Mar 17)       │
│                                                          │
│  Distance     ██████████████░░░░░░  0.281  (28.1%)       │
│  Workload     ████████████████░░░░  0.312  (31.2%)       │
│  Reliability  ████████████████████  0.407  (40.7%)       │
│                                                          │
│  Last update: Mar 17 · +8.3% improvement                 │
│  Training data: 147 pickups analyzed                     │
│                                                          │
│  [Learning Loop: ● Enabled]  [Override Weights]          │
│                                                          │
│  ── Weight History ─────────────────────────────────     │
│  Config │ Date     │ Source      │ Improve │ D/W/R        │
│  #5     │ Mar 17   │ Learning    │ +8.3%   │ .28/.31/.41  │
│  #4     │ Mar 10   │ Learning    │ +5.7%   │ .31/.32/.37  │
│  #3     │ Mar 03   │ Admin       │  —      │ .30/.30/.40  │
│  #1     │ Feb 24   │ Initial     │  —      │ .33/.33/.34  │
└──────────────────────────────────────────────────────────┘
```

---

## 6.4 Navigation Logic

### Citizen App Route Map
```
/login           → Login (unauthenticated only)
/dashboard       → Dashboard (default after login)
/request         → RequestPickup (multi-step form)
/pickups         → PickupHistory (list)
/pickups/:id     → PickupDetail
/payments        → Payments (list)
/payments/:id    → PaymentDetail
/schedule        → GarbageSchedule
/profile         → Profile
```

### Kabadiwala App Route Map
```
/login           → Login
/queue           → TodayQueue (default after login)
/queue/:id       → ActivePickup
/earnings        → Earnings
/profile         → Profile
```

### Admin App Route Map
```
/login           → Login
/dashboard       → Dashboard (default)
/assignments     → AssignmentQueue
/assignments/:id → AssignmentDetail
/rates           → ScrapRates
/localities      → Localities
/kabadiwalas     → Kabadiwala list
/kabadiwalas/:id → KabadiProfile
/learning        → LearningInsights
/garbage         → GarbageSchedules
/config          → SystemConfiguration
```

### Protected Route Logic
```jsx
// router/ProtectedRoute.jsx
function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Wrong role for this app — redirect to their correct app
    const redirects = {
      citizen:    'http://citizen.wastemgmt.in',
      kabadiwala: 'http://kabadiwala.wastemgmt.in',
      admin:      'http://admin.wastemgmt.in',
    };
    window.location.href = redirects[user.role];
    return null;
  }

  return children;
}
```

---

---
