# Design Document: Telemetry Improvements

## Overview

Three targeted changes to the telemetry module:

1. **Index optimisation (#162)** — add a secondary composite index `{ sensorId: 1, shipmentId: 1, timestamp: -1 }` to `TelemetrySchema` and write schema-inspection unit tests.
2. **Thresholds endpoint (#163)** — add `GET /api/telemetry/thresholds` (auth-protected) returning hardcoded sensor alert boundaries.
3. **Controller bug-fixes + broadcast tests (#161)** — fix `pageNumber` undefined and missing `from`/`to` forwarding in `getTelemetry`, then add Jest tests verifying `emitTelemetryUpdate` is called correctly during bulk ingest.

No new infrastructure is introduced. All changes are confined to the existing telemetry module files plus `docs/swagger.yaml` and a new test file.

---

## Architecture

The existing request flow is unchanged:

```
Route → validateRequest(Zod) → requireAuth → asyncHandler(Controller) → Service → Model
```

Socket.io broadcasts remain a side-effect of the service layer (`bulkIngestTelemetry` calls `emitTelemetryUpdate` synchronously before the `setImmediate` anomaly block). The controller bug-fixes ensure query params are correctly threaded through without altering this flow.

```mermaid
flowchart LR
    Client -->|GET /api/telemetry/thresholds| Router
    Router -->|requireAuth| Controller
    Controller -->|getTelemetryThresholds| Service
    Service -->|{ maxTemp, maxHumidity, minBatteryLevel }| Controller
    Controller -->|sendResponse 200| Client

    Client2[IoT / API client] -->|POST /api/telemetry/bulk| Router2[Router]
    Router2 -->|requireAuth| Controller2[bulkIngest]
    Controller2 -->|bulkIngestTelemetry| Service2[Service]
    Service2 -->|emitTelemetryUpdate| SocketIO[Socket.io room]
    Service2 -->|Telemetry.create| MongoDB
```

---

## Components and Interfaces

### 1. `telemetry.model.ts` — Secondary Index

Add one line after the existing index declaration:

```typescript
TelemetrySchema.index({ sensorId: 1, shipmentId: 1, timestamp: -1 });
```

No other model changes. The existing `{ shipmentId: 1, timestamp: -1 }` and `{ anchorStatus: 1 }` indexes are retained.

### 2. `telemetry.validation.ts` — Thresholds Schema

Add a response-shape schema and exported type:

```typescript
export const TelemetryThresholdsSchema = z.object({
  maxTemp: z.number(),
  maxHumidity: z.number(),
  minBatteryLevel: z.number(),
});

export type TelemetryThresholds = z.infer<typeof TelemetryThresholdsSchema>;
```

No request body or query params are needed for the thresholds endpoint.

### 3. `telemetry.service.ts` — Thresholds Service Function

Add a pure function returning hardcoded constants:

```typescript
export function getTelemetryThresholds(): TelemetryThresholds {
  return { maxTemp: 85, maxHumidity: 90, minBatteryLevel: 20 };
}
```

No database calls. Returns a plain object matching `TelemetryThresholds`.

### 4. `telemetry.controller.ts` — Bug Fixes + Thresholds Controller

**Bug fix — `getTelemetry`:**

```typescript
// Before (broken):
const { cursor, limit = 20, shipmentId } = req.query;
// pageNumber referenced but never declared
// from/to never forwarded

// After (fixed):
const { cursor, page, limit = 20, shipmentId, from, to } = req.query;
// ...
await getTelemetryService({
  cursor: cursor as string | undefined,
  page: page ? Number(page) : undefined,
  limit: Number(limit),
  shipmentId: shipmentId as string | undefined,
  organizationId: organizationId as string | undefined,
  from: from as Date | undefined,
  to: to as Date | undefined,
});
```

Note: `validateRequest({ query: TelemetryQuerySchema })` already coerces `page` to a number and `from`/`to` to `Date` objects via Zod transforms, so `req.query` values are already the correct types when the controller runs.

**New controller — `getThresholds`:**

```typescript
export const getThresholds = async (req: Request, res: Response) => {
  const data = getTelemetryThresholds();
  sendResponse(res, 200, true, 'Thresholds retrieved', data);
};
```

### 5. `telemetry.routes.ts` — New Route

```typescript
telemetryRouter.get(
  '/thresholds',
  requireAuth,
  asyncHandler(getThresholds)
);
```

Route must be declared **before** the `GET /` route to avoid Express matching `/thresholds` as a query on the root path (though with explicit path strings this is not an issue, it is good practice).

### 6. `docs/swagger.yaml` — New Path Entry

Add under `paths`:

```yaml
/api/telemetry/thresholds:
  get:
    tags:
      - Telemetry
    summary: Get telemetry alert thresholds
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Thresholds retrieved
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: Thresholds retrieved
                data:
                  type: object
                  properties:
                    maxTemp:
                      type: number
                      example: 85
                    maxHumidity:
                      type: number
                      example: 90
                    minBatteryLevel:
                      type: number
                      example: 20
      '401':
        $ref: '#/components/responses/Unauthorized'
```

---

## Data Models

No new Mongoose models or schema fields are introduced.

**Thresholds interface** (TypeScript only, no DB persistence):

```typescript
interface TelemetryThresholds {
  maxTemp: number;        // 85 °C
  maxHumidity: number;    // 90 %
  minBatteryLevel: number; // 20 %
}
```

**Updated `getTelemetryService` parameter interface** — `from` and `to` are already in the service signature but were never passed from the controller. The fix threads them through:

```typescript
// telemetry.service.ts — existing signature (no change needed)
export async function getTelemetryService(params: {
  cursor?: string;
  page?: number;
  limit: number;
  shipmentId?: string;
  organizationId?: string;
  from?: Date;   // already present in service, was just never passed
  to?: Date;     // already present in service, was just never passed
})
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

PBT applicability assessment: Most of this feature involves deterministic schema checks, a pure constant-returning function, and bug fixes. Two acceptance criteria (4.3 and 4.4) are genuinely property-like — the payload shape invariant and the per-item emit count — and benefit from input variation. A property-based testing library (fast-check) is appropriate for these two.

### Property 1: Bulk ingest emit count equals item count

*For any* non-empty list of valid `BulkTelemetryItem` objects (each with a distinct `shipmentId`), calling `bulkIngestTelemetry` SHALL result in `emitTelemetryUpdate` being called exactly as many times as there are items in the list.

**Validates: Requirements 4.4**

### Property 2: Emit payload contains all required TelemetryUpdatePayload fields

*For any* valid `BulkTelemetryItem`, after `bulkIngestTelemetry` processes it, the second argument passed to `emitTelemetryUpdate` SHALL be an object containing non-null, correctly-typed values for `shipmentId`, `temperature`, `humidity`, `latitude`, `longitude`, `batteryLevel`, `timestamp`, and `dataHash`.

**Validates: Requirements 4.3**

---

## Error Handling

| Scenario | HTTP Status | AppError code |
|---|---|---|
| Missing / invalid JWT on `GET /thresholds` | 401 | `ERR_AUTH_INVALID` (via `requireAuth`) |
| `pageNumber` undefined (bug, now fixed) | was 500 ReferenceError → now 200 | n/a after fix |
| `from`/`to` not forwarded (bug, now fixed) | was silently ignored → now applied | n/a after fix |

No new `AppError` codes are needed. The thresholds service function is pure and cannot throw.

---

## Testing Strategy

### Unit / Integration Tests (example-based)

All tests live in `tests/`. Use `jest.unstable_mockModule` for external dependencies (Socket.io, Redis queue, Mongoose models) following the pattern in `tests/realtime.events.test.ts`.

**New test file: `tests/telemetry-improvements.test.ts`**

| Test | Type | Requirement |
|---|---|---|
| TelemetrySchema has `{ shipmentId: 1, timestamp: -1 }` index | Example | 1.2 |
| TelemetrySchema has `{ sensorId: 1, shipmentId: 1, timestamp: -1 }` index | Example | 1.1 |
| `getTelemetryThresholds()` returns `{ maxTemp: 85, maxHumidity: 90, minBatteryLevel: 20 }` | Example | 2.3 |
| `GET /api/telemetry/thresholds` with valid JWT → 200 + correct data | Example | 2.1 |
| `GET /api/telemetry/thresholds` without JWT → 401 | Example | 2.2 |
| `GET /api/telemetry?page=1` does not throw ReferenceError | Example | 3.1 |
| `GET /api/telemetry?from=...&to=...` forwards dates to service | Example | 3.2 |
| `POST /api/telemetry/bulk` (1 item) → `emitTelemetryUpdate` called once | Example | 4.1 |
| `POST /api/telemetry/bulk` (1 item) → first arg equals shipmentId | Example | 4.2 |
| `POST /api/telemetry/bulk` without JWT → 401, emit not called | Example | 4.5 |

**Property-based tests (fast-check, min 100 iterations each):**

| Test | Property | Requirement |
|---|---|---|
| For N items with distinct shipmentIds → emit called N times | Property 1 | 4.4 |
| For any valid item → emit payload has all required fields | Property 2 | 4.3 |

Tag format for property tests:
```
// Feature: telemetry-improvements, Property 1: Bulk ingest emit count equals item count
// Feature: telemetry-improvements, Property 2: Emit payload contains all required TelemetryUpdatePayload fields
```

### Mocking Strategy

- `src/infra/socket/io.ts` → mock `emitTelemetryUpdate`, `emitAnomalyDetected`
- `src/infra/redis/queue.ts` → mock `pushStellarAnchorJob`, `pushAlertJob`
- `src/modules/telemetry/telemetry.model.ts` → mock `Telemetry.create` for property tests (to avoid DB dependency)
- `src/modules/shipments/shipments.model.ts` → mock `Shipment.find` / `Shipment.findOne`
- `src/modules/anomaly/anomaly.service.ts` → mock `detectAnomaly`

### Existing Tests

No existing tests should be broken. The controller bug-fix changes `pageNumber` → `page` which was previously causing a `ReferenceError` at runtime; any existing test hitting `GET /api/telemetry?page=N` would have been failing silently or not testing that path.
