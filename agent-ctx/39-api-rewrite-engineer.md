# Task 39 - API Routes Rewrite (Database-Driven)

## Agent: API Rewrite Engineer

## Summary
Rewrote all 14 API routes to be production-ready with zero demo data. All data now comes from the Prisma ORM database.

## Files Modified

### Rewritten Routes (5)
1. **`/src/app/api/mcp/route.ts`** — MCP Hub: `db.mcpServer.findMany/upsert/delete`, activity logging
2. **`/src/app/api/git/route.ts`** — Git Integration: `db.file.findMany` for files, `db.agentRun.findMany` for commits
3. **`/src/app/api/collab/route.ts`** — Collaboration: `db.collaborator.findMany/create/delete`
4. **`/src/app/api/specs/route.ts`** — Spec Pipeline: `db.spec.findMany/create/update`, AI spec generation via z-ai-web-dev-sdk
5. **`/src/app/api/marketplace/route.ts`** — Marketplace: `db.installedIntegration`, static catalog config

### Fixed Routes (1)
6. **`/src/app/api/voice/route.ts`** — Removed fake fallback data, returns 503 if SDK fails

### New Routes (8)
7. **`/src/app/api/notifications/route.ts`** — Full CRUD for notifications
8. **`/src/app/api/activity/route.ts`** — Activity log (GET + POST)
9. **`/src/app/api/memory/route.ts`** — Memory CRUD with category filter
10. **`/src/app/api/context/route.ts`** — Codebase context + knowledge base
11. **`/src/app/api/personas/route.ts`** — Personas with auto-seed and preset protection
12. **`/src/app/api/rules/route.ts`** — AI rules with auto-seed and preset protection
13. **`/src/app/api/snippets/route.ts`** — Snippet CRUD
14. **`/src/app/api/seed/route.ts`** — One-time database seed

### Other Fixes
- **`/src/lib/db.ts`** — Reverted to clean version after .next rebuild
- **`/src/components/nexus/mcp-hub.tsx`** — Fixed orphaned SERVERS references, React Compiler lint errors, stale deps

## Key Decisions
- Empty arrays returned when database is empty — never fake data
- Activity logging on all significant mutations (MCP connect, spec create, etc.)
- Preset personas/rules cannot be deleted (only disabled)
- Marketplace catalog is a `const` — it's configuration, not demo data
- Voice route returns 503 instead of fake audio when SDK fails
- Seed endpoint is idempotent — checks if tables are empty before seeding

## Testing
- All endpoints tested with curl and return proper JSON
- Seed endpoint successfully creates 4 personas + 5 AI rules
- Lint: 0 errors, 0 warnings
