# Task 1-deploy: Deploy Agent Work Record

## Task
Update API routes to gracefully handle database unavailability for Cloudflare Workers deployment.

## Changes Made

### Pattern Applied
Every route handler now:
1. Checks `isDbAvailable()` at the start
2. Returns fallback data immediately if DB is unavailable
3. Uses dynamic import `const { db } = await import('@/lib/db')` instead of static import
4. Catches errors and returns fallback data in catch block
5. Preserves `export const runtime = 'edge'` at top

### Files Modified (9 routes)

1. **`/api/dev-surfaces/route.ts`**
   - GET: returns `FALLBACK_SURFACES` when DB unavailable
   - POST/PUT/DELETE: returns 503 with message
   - Changed `import { Prisma }` to `import type { Prisma }`
   - Removed static `import { db }`

2. **`/api/subscription/route.ts`**
   - GET: returns fallback subscription object with plan info
   - POST/PUT: returns 503
   - Uses `FALLBACK_SUBSCRIPTION` from db-fallback

3. **`/api/models/route.ts`**
   - No DB dependency, but added `FALLBACK_MODELS` import as safety net in catch
   - Added fallback import from db-fallback

4. **`/api/api-keys/route.ts`**
   - GET: returns `{ keys: [] }` when DB unavailable
   - POST/PUT/DELETE: returns 503

5. **`/api/model-health/route.ts`**
   - No changes needed — doesn't use DB

6. **`/api/improvement-loops/route.ts`**
   - GET: returns 5 seeded fallback loops with summary
   - POST/PUT/DELETE: returns 503
   - `getFallbackLoops()` helper function

7. **`/api/improvement-loops/metrics/route.ts`**
   - GET: returns 10 seeded fallback metrics with computed health score and trend data
   - `computeFallbackResponse()` helper function

8. **`/api/improvement-loops/suggestions/route.ts`**
   - GET: returns 6 seeded fallback suggestions with summary
   - POST/PUT: returns 503
   - `computeFallbackResponse()` helper function

9. **`/api/donate/route.ts`**
   - GET: returns `{ donations: [], total: 0, count: 0 }`
   - POST: returns 503

10. **`/api/subscription/usage/route.ts`**
    - GET: returns zero usage with `FALLBACK_SUBSCRIPTION.tokensLimit`
    - Includes 6-month empty monthlyUsage array

## Verification
- ESLint: Zero errors in `src/app/api/` directory
- All `export const runtime = 'edge'` preserved
- All fallback data matches expected response shapes
