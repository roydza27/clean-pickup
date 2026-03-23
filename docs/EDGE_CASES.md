# Section 7: Edge Cases
## Waste Coordination & Recycling Management System
### India Pilot MVP

## 7.1 Authentication Edge Cases

| Scenario | What Happens | Why Correct |
|---|---|---|
| User requests OTP → does not verify → requests again | Second OTP overwrites first in Redis. First OTP is now invalid. | Single-use via overwrite; no stale OTPs accumulate. |
| User is mid-session when account is deactivated | Next request after deactivation: Redis session still exists. The `authenticate` middleware finds the session, but the service layer checks `is_active` on sensitive operations. Full effect on next login after session expires. | Graceful degradation — in-flight operations not disrupted, future logins blocked. |
| JWT token stolen and used after victim logs out | Victim logs out → `DEL session:{userId}` in Redis. Attacker's subsequent requests fail at `authenticate` middleware (session not found). | Session revocation is the defence against JWT theft. |
| Two devices simultaneously requesting OTP for same number | Each OTP request overwrites the previous Redis key. Only the most recently generated OTP is valid. | Atomic Redis write prevents race condition. |
| User tries to sign up with both citizen and kabadiwala roles | First signup with `role=citizen` creates citizen account. Second attempt with `role=kabadiwala` returns `ROLE_MISMATCH 403` because the account already exists. | Role immutability prevents dual-role accounts. |

---

## 7.2 Pickup Lifecycle Edge Cases

| Scenario | What Happens | Why Correct |
|---|---|---|
| Citizen submits pickup request → assignment engine fails (DB error) | Pickup stays in `requested`. Background job detects unassigned pickups older than 30 min and notifies admin. | Async assignment failure doesn't fail the citizen's request. Admin handles manually. |
| Citizen cancels a pickup while kabadiwala is in transit (`in_progress`) | Cancellation is rejected: `INVALID_STATUS_TRANSITION`. Status `in_progress` cannot transition to `cancelled`. | Kabadiwala is already en route. Admin can handle as exception via manual override. |
| Two concurrent requests from same citizen for same date | First INSERT succeeds. Second INSERT triggers partial unique index violation `(23505)`. Error handler returns `409 DUPLICATE_PICKUP_DATE`. | DB constraint as last line of defence against race condition at the service layer. |
| Preferred date passes without pickup completion (e.g., assigned but never started) | Stale assignment job flags it after 24h. Admin notified. The pickup remains `assigned` — it is NOT auto-cancelled. | Auto-cancellation without human review would penalise citizens for kabadiwala failures. |
| Citizen changes locality in profile after submitting a pickup request | The pickup request retains the `locality_id` captured at creation. Profile change does not affect in-flight requests. | `locality_id` is snapshotted on `pickup_requests` at creation — immutable after that. |
| Kabadiwala's `is_available` changes to `false` after being assigned a pickup | Existing assignments are unaffected. The `is_available` flag only blocks new assignments. | Consistent with KAB-03 business rule. |

---

## 7.3 Assignment Engine Edge Cases

| Scenario | What Happens | Why Correct |
|---|---|---|
| All kabadiwalas in a locality are at max daily capacity | Assignment engine returns `null`. Pickup → `unassigned_no_availability`. Admin notified. | Graceful degradation. No assignment failure — just queued for manual intervention. |
| Kabadiwala's `last_known_lat/lng` is NULL (never reported location) | Engine uses the locality centroid coordinates as a fallback for distance calculation. | Every kabadiwala has a `service_locality_id` which has coordinates. No null pointer possible. |
| Only one kabadiwala available and they exceed distance cap | Same as no candidates. `unassigned_no_availability`. Admin can manually override the distance cap for exceptional cases. | Distance cap is an engine constraint, not a hard system constraint. Admin retains authority. |
| Assignment engine runs twice for same request (race condition from retry) | First run: INSERT into `pickup_assignments` succeeds. Second run: INSERT fails with `23505` (UNIQUE on `request_id`). Second run catches DB error, logs it, exits silently. | UNIQUE constraint prevents duplicate assignments even under concurrent execution. |
| Kabadiwala is deleted (soft: `is_active=false`) while assigned | Active assignments remain. `is_active=false` only blocks new assignments. Existing assignments visible to kabadiwala until completion or admin reassignment. | Same logic as availability toggle. In-flight work is not disrupted. |

---

## 7.4 Payment Edge Cases

| Scenario | What Happens | Why Correct |
|---|---|---|
| Kabadiwala submits completion twice (double-tap / retry) | Second `completePickup` call: service layer checks `assignment.status === 'completed'` → throws `ALREADY_COMPLETED 409`. | Idempotent guard (DUP-04) prevents double payment record creation. |
| Actual weight significantly higher than estimated | Weight validation allows up to 5× estimated. If exceeds 5×, `VALIDATION_ERROR` returned. Kabadiwala must verify and re-submit with corrected weight. | Catches data entry errors (grams vs kg, extra zeros). |
| Citizen enters wrong UPI reference | System accepts any string ≥ 8 chars. Verification against UPI APIs is out of scope for MVP. Incorrect reference is a dispute scenario. | Manual trust model for MVP. Phase 2 adds UPI webhook verification. |
| Admin updates scrap rate between request creation and pickup completion | Payment uses `rate_per_kg_at_request` (snapshotted at creation). New rate has no effect on this pickup. | PICKUP-05 + PAY-02 together guarantee rate stability. |
| Payment dispute raised after payment already confirmed as `paid` | `PATCH /payments/:id/dispute` checks current status. `paid` → `disputed` is not a valid transition. Returns `PAYMENT_NOT_PENDING 409`. | Terminal state protection. A confirmed payment cannot be re-opened unilaterally by citizen. Admin can handle as exception via DB if genuinely fraudulent. |

---

## 7.5 Network & Partial State Edge Cases

| Scenario | What Happens | Why Correct |
|---|---|---|
| Client submits pickup request, network drops before response | Client retries. Server: second INSERT triggers `DUPLICATE_PICKUP_DATE 409`. Client treats `409` as "already created" and navigates to dashboard to show the existing request. | Frontend should treat `409 DUPLICATE_PICKUP_DATE` as idempotent success — the request was created on the first attempt. |
| Kabadiwala's phone loses connectivity mid-pickup | Kabadiwala app caches the pickup queue locally (React Query cache persists in memory). They can complete the pickup form offline and submit when connectivity returns. | React Query cache + service worker (offline support) keeps the queue visible. |
| Transaction partially fails during assignment (INSERT assignment succeeds, UPDATE pickup_request fails) | PostgreSQL rolls back the entire transaction. Both operations either commit together or neither does. Pickup remains `requested`. Next assignment engine run retries it. | ACID transaction wrapping all assignment writes (Section 3, `assignment.service`). |
| Redis goes down | OTP generation fails (cannot store OTP hash). Auth returns `500`. Scrap rate cache is unavailable → falls back to PostgreSQL query. Session validation fails → all authenticated requests return `401`. | Redis is a dependency for auth. Graceful degradation exists only for the cache layer. For auth, Redis is required — this is an acceptable architectural decision documented as a known risk. |

---

## 7.6 Learning Loop Edge Cases

| Scenario | What Happens | Why Correct |
|---|---|---|
| Learning loop runs but < 30 unprocessed feedback records exist | Loop exits immediately, logs warning, notifies admin. No weight update. | LEARN-01 minimum data threshold. |
| Weight update would push one weight below 0.10 | `clamp()` enforces 0.10 minimum. Remaining weights re-normalised to sum to 1.0. | LEARN-02 hard bounds. |
| Simulated performance with new weights is exactly equal to current | `improvementPct = 0.0 < 5.0` → weights rejected. Current weights retained. | LEARN-03 threshold gate. |
| Admin manually overrides weights on same day learning loop runs | Learning loop runs first (Sunday 2 AM). Admin override creates new `weight_configurations` row with `source='admin_override'`, deactivates learning loop's row. Next week's loop uses the admin override as the baseline. | Admin override is the latest `is_active = true` row. Learning loop reads this as current weights. |
| Consecutive loop runs both produce marginal improvements | Week 1: +5.1% accepted. Week 2: +5.3% accepted. Weights converge gradually. Convergence is expected and correct behaviour. | Gradient descent converges. Admin monitors via Learning Insights screen. |

---

---
