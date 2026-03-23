# Section 8: Performance Considerations
## Waste Coordination & Recycling Management System
### India Pilot MVP

## 8.1 Query Optimization

### Hot Path: Assignment Engine Candidate Query

This query runs on every pickup request creation. With 20 kabadiwalas per locality it is fast; at 200 it needs careful indexing.

```sql
-- Query (from Section 3, AssignmentEngine._fetchCandidates)
-- Key indexes used:
--   idx_kp_locality_available  → filters kabadiwala_profiles efficiently
--   idx_pa_kabadiwala_date     → counts today's assignments per kabadiwala

EXPLAIN ANALYZE
SELECT kp.user_id, kp.reliability_score, ...
FROM kabadiwala_profiles kp
JOIN users u ON kp.user_id = u.id
LEFT JOIN pickup_assignments pa ON pa.kabadiwala_id = kp.user_id
    AND pa.assigned_date = '2026-03-25'
    AND pa.status NOT IN ('failed', 'reassigned')
WHERE kp.service_locality_id = 1
  AND kp.is_available = true
  AND u.is_active = true
GROUP BY kp.user_id, ...
HAVING COUNT(pa.id) < 10;

-- Expected plan: Index Scan on idx_kp_locality_available → Nested Loop
-- At 20 kabadiwalas per locality: ~0.5ms
-- At 200 kabadiwalas per locality: ~3ms (still acceptable)
-- At 2000: consider locality partitioning
```

### Hot Path: Citizen's Request List

```sql
-- idx_pr_citizen_id covers (citizen_id, created_at DESC)
-- React Query caches this for 5 minutes — most requests served from cache
-- Only on cache miss does this query hit the DB

SELECT pr.*, pa.kabadiwala_id, pay.amount
FROM pickup_requests pr
LEFT JOIN pickup_assignments pa ON pr.id = pa.request_id
    AND pa.status != 'reassigned'
LEFT JOIN payment_records pay ON pa.id = pay.assignment_id
WHERE pr.citizen_id = $1
ORDER BY pr.created_at DESC
LIMIT 20;

-- Index Scan on idx_pr_citizen_id → 0.2ms for 1000 requests per citizen
```

### Avoiding N+1 in Kabadiwala Queue

```javascript
// WRONG — N+1 pattern:
const assignments = await getAssignments(kabadiwalId, date);
for (const a of assignments) {
  a.citizenDetails = await getCitizenDetails(a.citizenId); // N queries
}

// RIGHT — single JOIN query:
const assignments = await query(`
  SELECT pa.*, pr.*, u.name AS citizen_name, u.phone_number AS citizen_phone
  FROM pickup_assignments pa
  JOIN pickup_requests pr ON pa.request_id = pr.id
  JOIN users u ON pr.citizen_id = u.id
  WHERE pa.kabadiwala_id = $1 AND pa.assigned_date = $2
  ORDER BY pa.sequence_order
`, [kabadiwalId, date]);
// Single query, regardless of queue size
```

---

## 8.2 Caching Strategy

| Data | Cache | TTL | Invalidation |
|---|---|---|---|
| Scrap rates per locality | Redis | 1 hour | On new rate INSERT |
| Active weight configuration | Redis | 5 min | On learning loop weight update |
| System configurations | Redis | 10 min | On admin config update |
| Pickup queue (kabadiwala) | React Query | 2 min | On assignment mutation |
| Citizen's own pickups | React Query | 5 min | On pickup create/cancel mutation |
| Scrap rates (frontend) | React Query | 1 hour | On admin rate update (via query invalidation after mutation) |
| Localities list | React Query | 24 hours | Rarely changes |

### Cache-Aside Pattern for Scrap Rates

```javascript
// locality.service.getCurrentRate(localityId, category)
async function getCurrentRate(localityId, category) {
  const cacheKey = `scrap_rates:${localityId}`;

  // 1. Try cache
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    const rates = JSON.parse(cached);
    return rates[category] ?? null;
  }

  // 2. Cache miss — fetch all categories for locality in one query
  const result = await query(`
    SELECT DISTINCT ON (category)
      category, rate_per_kg, effective_date
    FROM scrap_rates
    WHERE locality_id = $1 AND effective_date <= CURRENT_DATE
    ORDER BY category, effective_date DESC
  `, [localityId]);

  // 3. Store as object keyed by category
  const rates = Object.fromEntries(
    result.rows.map(r => [r.category, { ratePerKg: r.rate_per_kg, effectiveDate: r.effective_date }])
  );
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(rates));

  return rates[category] ?? null;
}

// Invalidation: called after every scrap rate INSERT
async function invalidateRateCache(localityId) {
  await redisClient.del(`scrap_rates:${localityId}`);
}
```

---

## 8.3 Connection Pool Sizing

```javascript
// config/database.js
const pool = new Pool({
  max: 20,              // Max concurrent DB connections
  // Rule of thumb: max = 2 × CPU cores of DB server, or match app server count × 5
  // For a 4-core DB server: 8–20 is appropriate
  // Two app servers × 20 each = 40 max connections to PostgreSQL
  // PostgreSQL default max_connections = 100 — safe headroom

  idleTimeoutMillis: 30000,       // Release idle connections after 30s
  connectionTimeoutMillis: 2000,  // Fail fast if no connection available in 2s
});
```

**Monitoring:** `pg_stat_activity` query for connection utilisation:
```sql
SELECT count(*), state FROM pg_stat_activity
WHERE datname = 'waste_management'
GROUP BY state;
-- If 'idle' connections >> 'active': reduce pool max
-- If frequent connection timeouts: increase pool max or add read replica
```

---

## 8.4 Bottleneck Analysis

| Bottleneck | Trigger | Mitigation |
|---|---|---|
| Assignment engine query latency | Many concurrent pickup submissions (e.g., post-event surge) | Queue assignments via Redis job queue (Bull). Process sequentially per locality to prevent simultaneous DB contention. |
| Analytics dashboard slow queries | Full-table scans on `pickup_requests` over date ranges | Route analytics to read replica. Add `idx_pr_status_created`. At 1M+ rows: partition `pickup_requests` by `created_at` month. |
| Redis OTP key storm | Viral campaign or scripted attack generating thousands of OTP requests | Nginx rate limiter (IP-level, 10 req/min on `/auth/send-otp`) is the first defence before Redis is touched. |
| Notification service blocking pickup completion | SMS gateway slow to respond | Move SMS dispatch to async job queue. `completePickup` transaction completes first; SMS enqueued after. |
| `updated_at` trigger overhead | High-frequency updates on `pickup_assignments` | Trigger overhead is microseconds per row. Not a practical concern at MVP scale (< 10,000 rows/day). |
| Learning loop memory | Processing 1000+ feedback records in-memory for gradient computation | Learning loop processes feedback in batches of 200. Gradient is accumulated incrementally, not loaded all at once. |

---

## 8.5 Scaling Strategy

### Phase 1: MVP (< 1,000 pickups/month)
- Single Node.js app server
- Single PostgreSQL instance
- Single Redis instance
- All on one cloud provider region

### Phase 2: Growth (1,000–10,000 pickups/month)
- Add PostgreSQL read replica → route analytics queries there
- Add Redis Sentinel for HA
- Consider CDN for React app static assets (already in Nginx config)
- Add `EXPLAIN ANALYZE` monitoring for any query > 100ms

### Phase 3: Scale (10,000–100,000 pickups/month)
- Partition `pickup_requests` by `(locality_id, created_at)` month
- Extract assignment engine to separate Node.js service (high compute, independent scaling)
- Add Bull job queue for assignment processing (decouple from HTTP request cycle)
- Add TimescaleDB extension for time-series analytics
- Load balance across 2–3 app server instances behind ALB

### Phase 4: Multi-City (100,000+ pickups/month)
- Geography-based DB sharding: `locality_id 1–100` on Shard A, `101–200` on Shard B
- Per-locality learning models (Koramangala kabadiwalas behave differently than Whitefield)
- Message queue (Kafka/SQS) for inter-service communication
- Dedicated analytics data warehouse (ClickHouse or Redshift)

---

---
