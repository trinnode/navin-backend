# 🚀 Quick Reference: API Schema Snapshot Tests

## Files Created
```
tests/
├── api-schema.snapshot.test.ts          # Main test suite
├── __snapshots__/
│   └── api-schema.snapshot.test.ts.snap # Generated snapshots
├── API_SCHEMA_TESTS.md                  # Full documentation
└── SNAPSHOT_DEMO.md                     # Demo walkthrough
```

## Commands

| Action | Command |
|--------|---------|
| Run snapshot tests | `npm test -- api-schema.snapshot.test.ts` |
| Update snapshots | `npm test -- api-schema.snapshot.test.ts -u` |
| Run all tests | `npm test` |

## What's Protected

✅ **GET /api/shipments** - Shipment listing schema  
✅ **GET /api/anomalies** - Anomaly listing schema

## How It Works

1. **First run**: Creates snapshot files with exact API response structure
2. **Subsequent runs**: Compares current responses to snapshots
3. **On mismatch**: Test fails with clear diff showing changes
4. **In CI/CD**: Blocks PRs with schema drift

## Example Failure

```diff
- "trackingNumber": "TN001"
+ "trackingId": "TN001"
```

## When to Update Snapshots

✅ Intentional API changes  
✅ New fields added  
✅ Planned schema updates  

❌ Never update just to "fix" failing tests  
❌ Always review diffs first  

## Quick Test

```bash
# 1. Run tests (should pass)
npm test -- api-schema.snapshot.test.ts

# 2. Change a field name in shipments.model.ts
# 3. Run tests again - will fail with diff
# 4. Revert change - tests pass again
```

## Benefits

- 🛡️ Prevents accidental breaking changes
- ⚡ Instant feedback on schema drift
- 📝 Self-documenting API schemas
- 🔒 CI/CD integration
- 🎯 Zero-trust validation

---

**Status**: ✅ Implemented and Passing  
**Coverage**: 2 endpoints, 2 snapshots  
**Test Time**: ~8 seconds
