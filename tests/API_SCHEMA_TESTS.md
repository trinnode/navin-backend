# API Schema Snapshot Tests

## Overview

This test suite ensures that API response schemas don't drift silently. If a developer accidentally renames a database field that leaks into the API response, the snapshot test will fail immediately.

## Test Files

- **Test Suite**: `tests/api-schema.snapshot.test.ts`
- **Snapshots**: `tests/__snapshots__/api-schema.snapshot.test.ts.snap`

## Covered Endpoints

### GET /api/shipments
Validates the response schema for shipment listings, including:
- Response envelope structure (`success`, `message`, `data`, `meta`)
- Shipment object fields (`_id`, `trackingNumber`, `origin`, `destination`, `status`, etc.)
- Pagination metadata (`hasMore`, `nextCursor`)

### GET /api/anomalies
Validates the response schema for anomaly listings, including:
- Response envelope structure
- Anomaly object fields (`_id`, `shipmentId`, `type`, `severity`, `message`, `timestamp`, `resolved`)
- Pagination metadata

## How It Works

1. **Initial Snapshot Creation**: When tests run for the first time, Jest creates snapshot files containing the exact API response structure
2. **Subsequent Runs**: Jest compares current API responses against stored snapshots
3. **Drift Detection**: Any change in field names, structure, or data types causes the test to fail

## Example: Catching Schema Drift

If a developer accidentally changes a database field:

```typescript
// Before: shipments.model.ts
trackingNumber: { type: String, required: true }

// After: Developer renames field
trackingId: { type: String, required: true }  // ❌ Breaking change!
```

The snapshot test will fail with:

```
- Snapshot
+ Received

  {
    "data": [
      {
        "_id": "1",
-       "trackingNumber": "TN001",
+       "trackingId": "TN001",
        ...
      }
    ]
  }
```

## Running the Tests

```bash
# Run snapshot tests
npm test -- api-schema.snapshot.test.ts

# Update snapshots after intentional API changes
npm test -- api-schema.snapshot.test.ts -u
```

## When to Update Snapshots

Update snapshots (`-u` flag) ONLY when:
- You intentionally add new fields to the API response
- You intentionally rename or remove fields (with proper versioning)
- You change the response structure as part of a planned API update

⚠️ **Never update snapshots to "fix" a failing test without understanding why the schema changed!**

## Best Practices

1. **Review Snapshot Diffs**: Always review what changed before updating snapshots
2. **Version Breaking Changes**: If updating snapshots involves breaking changes, consider API versioning
3. **Add Tests for New Endpoints**: When adding new GET endpoints, add corresponding snapshot tests
4. **Keep Snapshots Minimal**: Use representative data that covers all fields without being overly verbose

## Integration with CI/CD

These tests run automatically in CI/CD pipelines. A failing snapshot test will:
- Block the PR from merging
- Alert developers to unintended API changes
- Prevent breaking changes from reaching production

## Maintenance

- Review and update snapshots during major version releases
- Add new snapshot tests when introducing new API endpoints
- Remove snapshot tests for deprecated endpoints
