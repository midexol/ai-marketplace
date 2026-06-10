# Code Audit - Remaining Items

## MEDIUM PRIORITY (Should fix soon)

### Input Sanitization
- **File:** `backend/src/api/agents/routes.ts` (createAgentSchema), `frontend/src/app/create-agent.tsx`
- **Issue:** User-provided agent names and descriptions stored directly without sanitization
- **Fix:** Add XSS sanitization library (e.g., `sanitize-html` or DOMPurify)

### Inefficient Market Stats Query
- **File:** `backend/src/services/MarketplaceService.ts` lines 198-222
- **Issue:** `getMarketStats()` fetches ALL trades and filters in memory (O(n))
- **Fix:** Use SQL date range query: `WHERE createdAt > NOW() - INTERVAL '24 hours'`

### In-Memory Governance Data
- **File:** `backend/src/api/governance/routes.ts` lines 11-38
- **Issue:** Mock proposals array lost on restart
- **Fix:** Migrate to database table with Proposal entity

### TypeORM synchronize: true
- **File:** `backend/src/database/data-source.ts` line 19
- **Issue:** Can cause schema mismatches and data loss
- **Fix:** Set `synchronize: false` and use migrations exclusively

### Portfolio Page Auth Check
- **File:** `frontend/src/app/portfolio.tsx` lines 15-37
- **Issue:** Data fetches before auth check completes
- **Fix:** Move data fetch into conditional that checks `authenticated` first

### Error Messages Expose Data
- **File:** `backend/src/middleware/errorHandler.ts`
- **Status:** ✅ FIXED - Stack traces now only logged in development

### CSRF Protection Missing
- **Affected:** All POST/PATCH/DELETE endpoints
- **Fix:** Add CSRF token generation and validation middleware

## NICE TO HAVE (Polish)

### Unused Imports
- `frontend/src/app/page.tsx` line 7: `Loader` imported but not used
- `frontend/src/components/WalletConnect.tsx`: Duplicate interface definitions

### Hard-Coded Fallback Values
- `frontend/src/providers/PrivyProvider.tsx` line 9: Development Privy ID default
- **Fix:** Throw error if env var missing instead of using placeholder

### Request Tracing
- No request ID correlation for debugging
- **Fix:** Add correlation ID middleware to track requests across services

### Numeric Precision Loss
- **File:** `backend/src/services/MarketplaceService.ts` lines 131, 166
- **Issue:** `Number(currentPrice)` loses BigInt precision
- **Fix:** Keep BigInt throughout, convert only for display

### Connection Pooling
- **File:** `backend/src/database/data-source.ts`
- **Fix:** Add `extra: { max: 10, min: 2 }` to TypeORM config

### Trade Type Mismatch
- **Issue:** Frontend `Trade` type expects `Date`, backend sends ISO string
- **Fix:** Add `createdAt` parsing in API response interceptor

### Governance Contract Integration
- **Status:** Currently mock/placeholder
- **Fix:** Connect to blockchain and verify votes on-chain

### Redis Not Used
- **Issue:** Redis included in dependencies but not used
- **Fix:** Implement caching for agent listings and market data, or remove

## COMPLETED ✅

- ✅ Authentication middleware (Privy token verification)
- ✅ Authorization checks (users can only access own data)
- ✅ Rate limiting (300 req/min global)
- ✅ BlockchainService bug fix
- ✅ Division by zero protection
- ✅ Production error logging (no stack traces)
- ✅ API client auth token support
- ✅ Backend deployment fix (build step)

---

**Recommended Next Steps:**
1. After hackathon: Fix input sanitization + governance database
2. Before production: Migrate TypeORM config and add CSRF protection
3. Performance tuning: Optimize market stats query and add Redis caching
