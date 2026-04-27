# Demonstration: How Snapshot Tests Catch Schema Drift

## Scenario: Developer Accidentally Renames a Database Field

### Step 1: Current Working State

The shipments model has a field called `trackingNumber`:

```typescript
// src/modules/shipments/shipments.model.ts
trackingNumber: { type: String, required: true }
```

The API returns this field in responses:

```json
{
  "success": true,
  "message": "Shipments retrieved",
  "data": [
    {
      "_id": "1",
      "trackingNumber": "TN001",  // ✅ Current field name
      "origin": "New York",
      "destination": "Los Angeles",
      "status": "IN_TRANSIT"
    }
  ]
}
```

Snapshot test: **PASSES** ✅

---

### Step 2: Developer Makes Breaking Change

Developer renames the field without realizing it affects the API:

```typescript
// src/modules/shipments/shipments.model.ts
trackingId: { type: String, required: true }  // ❌ Renamed!
```

---

### Step 3: Snapshot Test Catches the Drift

When tests run, the snapshot test **FAILS** ❌:

```
FAIL tests/api-schema.snapshot.test.ts

  ● API Schema Snapshot Tests › GET /api/shipments › should match response schema snapshot

    expect(received).toMatchSnapshot()

    Snapshot name: `API Schema Snapshot Tests GET /api/shipments should match response schema snapshot 1`

    - Snapshot  - 1
    + Received  + 1

      {
        "data": [
          {
            "_id": "1",
            "destination": "Los Angeles",
            "enterpriseId": "ent1",
            "logisticsId": "log1",
            "milestones": [],
            "origin": "New York",
            "status": "IN_TRANSIT",
    -       "trackingNumber": "TN001",
    +       "trackingId": "TN001",
          },
        ],
        "message": "Shipments retrieved",
        "meta": {
          "hasMore": false,
          "nextCursor": null,
        },
        "success": true,
      }
```

---

### Step 4: Developer Response

The developer now has two options:

#### Option A: Revert the Breaking Change (Recommended)
```typescript
// Revert back to original field name
trackingNumber: { type: String, required: true }  // ✅ Fixed
```

Test now **PASSES** ✅

#### Option B: Intentional API Change (Requires Versioning)
If the change is intentional:

1. Update API documentation
2. Implement API versioning (e.g., `/api/v2/shipments`)
3. Notify API consumers
4. Update the snapshot:
   ```bash
   npm test -- api-schema.snapshot.test.ts -u
   ```

---

## Real-World Impact

### Without Snapshot Tests ❌
- Breaking change goes unnoticed
- Deploys to production
- Client applications break
- Emergency hotfix required
- Customer trust damaged

### With Snapshot Tests ✅
- Breaking change caught in CI/CD
- PR blocked from merging
- Developer fixes issue before merge
- Zero production impact
- API stability maintained

---

## Try It Yourself

1. Run the current tests (should pass):
   ```bash
   npm test -- api-schema.snapshot.test.ts
   ```

2. Make a breaking change to any field in `shipments.model.ts` or `anomaly.model.ts`

3. Run tests again - they will fail and show you exactly what changed

4. Revert your change and tests will pass again

This demonstrates how snapshot tests act as a safety net against unintended API schema changes!
