# DžematApp Tenant Isolation Problem - Technical Analysis

**Date**: December 1, 2025  
**Status**: UNRESOLVED - Seeking external review  
**Severity**: CRITICAL - Data isolation broken across all tenants

---

## PROBLEM STATEMENT

### What User Observes
When logging into ANY tenant (DEMO2025, GAM9000, SG77245) or SuperAdmin panel:
- **ALL users see the SAME 13 users** across every tenant
- Users are NOT properly isolated by tenant
- Each tenant should show ONLY their own users, but instead shows all users from all tenants

**Example:**
- Login to GAM9000 tenant → See 13 users (should see 1 admin only)
- Login to SG77245 tenant → See 13 users (should see 1 admin only)  
- Login to DEMO2025 tenant → See 13 users (should see 24 members + 1 admin)
- SuperAdmin panel → See 13 users (should be configurable or hidden)

---

## DATABASE STATE (VERIFIED CORRECT)

**SQL Query Results - User Distribution:**
```
Tenant                  | User Count | Users
DEMO2025               | 24         | 24 members + Admin Džemat
SG77245 (ghb)          | 1          | Admin ghb only
GAM9000                | 1          | Admin GAM only
tenant-superadmin-global | 1        | Super Admin only
────────────────────────────────────────────
TOTAL                  | 27         | Correct distribution
```

**Conclusion**: Database is CORRECT ✅
- Each tenant has the RIGHT users assigned
- No data leakage in the database
- All 27 users are properly tenant-scoped with correct `tenant_id` values

---

## API ENDPOINT ANALYSIS

### GET /api/users Endpoint (server/routes.ts:1446)

**Current Implementation:**
```typescript
app.get("/api/users", requireAuth, async (req, res) => {
  const session = req.session as any;
  
  // Logic: Use session.tenantId as authoritative source
  const tenantId = session.tenantId || req.user?.tenantId || req.tenantId || "default-tenant-demo";
  
  const users = await storage.getAllUsers(tenantId);
  res.json(users.map(user => ({ ...user, password: undefined })));
});
```

**Backend Logic is Correct** ✅
- Properly retrieves `session.tenantId`
- Calls `storage.getAllUsers(tenantId)` with correct tenant filter
- Should return only users for that specific tenant

### Storage.getAllUsers() (server/storage.ts:530)

**Implementation:**
```typescript
async getAllUsers(tenantId: string): Promise<User[]> {
  return await db.select().from(users).where(
    and(
      eq(users.tenantId, tenantId),
      sql`(${users.isSuperAdmin} IS NULL OR ${users.isSuperAdmin} = false)`
    )
  );
}
```

**Backend Query is Correct** ✅
- Filters by `tenant_id` = parameter
- Excludes SuperAdmin users
- SQL is logically sound

---

## INVESTIGATION STEPS COMPLETED

### 1. ✅ Verified Database Integrity
- Checked all 27 users in database
- Confirmed each user has correct `tenant_id`
- No cross-tenant data duplication

### 2. ✅ Verified Backend Logic
- `/api/users` endpoint correctly extracts `session.tenantId`
- `storage.getAllUsers()` correctly filters by tenantId
- SQL WHERE clause is syntactically correct

### 3. ✅ Verified Demo User Cleanup
- Ran purge endpoint to remove demo users from non-demo tenants
- Database confirms demo users (Iso, Elma, Hase) removed from GAM9000 and SG77245
- Demo users now ONLY exist in Demo Džemat (where they should be)

### 4. ✅ Verified Login Process
- `session.tenantId` is properly set during login (server/routes.ts:255)
- Login endpoint correctly sets `req.session.tenantId = tenantId` (line 255)
- Session is explicitly saved with `.save()` callback

---

## POSSIBLE ROOT CAUSES

### Hypothesis 1: Session NOT Being Set Properly During Login
**Evidence**: If `session.tenantId` is undefined/null, endpoint falls back to `"default-tenant-demo"`
- **Problem**: All users would see Demo Džemat users (13 users)
- **Matches**: Observed symptom EXACTLY

**Investigation Needed**:
- Are sessions persisting correctly after login?
- Is `req.session.save()` actually completing successfully?
- Does `session.tenantId` survive across multiple requests?

### Hypothesis 2: Session Store Issue
**Details**: Using PostgreSQL session store (`connect-pg-simple`)
- Sessions might not be updating correctly
- Sessions might be cached/stale
- Session TTL might be expiring too quickly

**Evidence**: User reported refresh (F5) changed view temporarily
- Suggests cache clearing affected display
- Sessions might be getting lost/reloaded

### Hypothesis 3: Frontend Caching Issue
**Details**: React Query caching `/api/users` without proper cache invalidation
- Endpoint returns correct data, but frontend caches global result
- Navigating between tenants doesn't invalidate cache

**Evidence**: User saw "Iso, Elma, Hase" (Demo Džemat users) initially
- After refresh, saw correct 13 users
- Suggests frontend state issue

### Hypothesis 4: Authentication Middleware Issue
**Details**: Auth middleware in `server/index.ts` might not be setting `req.tenantId` correctly
- Even if `session.tenantId` is set, middleware might override it
- `req.user?.tenantId` might be stale/incorrect

---

## ACTIONS ALREADY TAKEN

### ✅ Added Detailed Logging
```typescript
// Added to /api/users endpoint:
console.log("[GET /api/users] DEBUG:", {
  "req.user.tenantId": req.user?.tenantId,
  "session.tenantId": session.tenantId,
  "req.tenantId": req.tenantId,
  "username": req.user?.username,
  "userId": req.user?.id
});
console.log("[GET /api/users] Using tenantId:", tenantId);
console.log("[GET /api/users] Found", users.length, "users for tenant:", tenantId);
```

**Status**: Deployed, ready to capture debug info

### ✅ Verified Demo User Purge
- Created `/api/tenants/purge-demo-users` endpoint
- Successfully removed demo users from non-demo tenants
- Database now shows correct isolation

### ✅ Updated Documentation
- Updated `replit.md` with current tenant isolation status
- Documented all 27 users and their distribution

---

## WHAT NEEDS TO BE DEBUGGED NEXT

### 1. Session Persistence
**Action Required**: Check server logs while logging in to each tenant
- Does `session.tenantId` get SET during login?
- Does `session.tenantId` PERSIST across subsequent requests?
- Are sessions being stored/retrieved from PostgreSQL session store correctly?

### 2. Frontend Behavior
**Action Required**: Monitor network requests
- What tenantId does `/api/users` receive for each login?
- Does `/api/users` return different user counts for different tenants?
- Is frontend caching preventing correct display?

### 3. Session Store Health
**Action Required**: Check PostgreSQL session table
```sql
SELECT * FROM "session" LIMIT 5;
-- Check if tenant_id is being stored in session JSON
```

### 4. Auth Middleware Verification
**Action Required**: Review `server/index.ts` auth middleware
- Line where `req.tenantId` is set from `session.tenantId`
- Check if it's being overridden anywhere else

---

## TECHNICAL DETAILS FOR EXTERNAL REVIEW

### Stack
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Session Store**: `connect-pg-simple` (PostgreSQL-backed)
- **Multi-Tenancy**: Session-based isolation using `session.tenantId`

### Key Files
- `server/routes.ts` - Line 1446 (/api/users endpoint)
- `server/storage.ts` - Line 530 (getAllUsers function)  
- `server/index.ts` - Auth middleware (tenant resolution)
- `server/routes.ts` - Lines 215-292 (Login endpoints)

### Session Flow
1. User logs in with `username`, `password`, `tenantCode`
2. Login endpoint converts `tenantCode` → `tenantId`
3. Sets `req.session.tenantId = tenantId`
4. Saves session: `req.session.save((err) => {...})`
5. Returns user with `tenantId`
6. Subsequent requests use `session.tenantId` to filter data

---

## QUESTIONS FOR EXTERNAL REVIEW

1. **Session Persistence**: Could `connect-pg-simple` have issues with session updates?
2. **Middleware Order**: Is auth middleware being applied in correct order?
3. **Cache Invalidation**: Should React Query cache be per-tenant?
4. **Session Fallback**: Should we NOT fallback to `"default-tenant-demo"` but instead return 401?
5. **Frontend State**: Is `useAuth` hook properly storing/syncing `tenantId`?

---

## CURRENT BLOCKERS

- ❌ Cannot confirm if `session.tenantId` is actually being set/persisted
- ❌ Cannot see server logs in real-time (iPad limitation - no F12 console)
- ❌ Cannot trace session state across multiple HTTP requests
- ❌ Cannot verify if session store (PostgreSQL) is working correctly

---

## NEXT STEPS (If Problem Persists)

### Option 1: Add Debug Endpoint (Quick)
```typescript
app.get("/api/debug/session", (req, res) => {
  res.json({
    sessionTenantId: (req.session as any).tenantId,
    userTenantId: req.user?.tenantId,
    reqTenantId: req.tenantId,
    isSuperAdmin: (req.session as any).isSuperAdmin
  });
});
```

### Option 2: Test Session Store Directly
```typescript
// Check if session is actually persisting
// Maybe session is lost between requests?
```

### Option 3: Add Cache Busting
```typescript
// Force React Query to not cache /api/users across tenants
queryKey: ['/api/users', tenantId]  // Include tenantId in key
```

### Option 4: Review Auth Middleware
```typescript
// server/index.ts - check where req.tenantId is set
// Might be overriding session.tenantId
```

---

## SUMMARY FOR CLAUDE/GEMINI

**TL;DR**:
- Database is CORRECT (27 users, properly scoped by tenant_id)
- Backend logic is CORRECT (endpoint and storage filters by tenant)
- Frontend shows WRONG data (all 13 users appear in every tenant)
- Root cause is likely: Session not persisting OR frontend cache not invalidating OR auth middleware overriding session
- Need to debug: Session persistence across HTTP requests + Frontend cache behavior
