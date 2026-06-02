# Implementation Plan: Telemetry Improvements

## Overview

Three focused changes to the telemetry module: add a secondary MongoDB index, expose a thresholds endpoint, and fix two controller bugs — then cover everything with tests. All changes are confined to existing telemetry files plus `docs/swagger.yaml` and one new test file.

## Tasks

- [x] 1. Add secondary composite index to TelemetrySchema
  - In `src/modules/telemetry/telemetry.model.ts`, add the line `TelemetrySchema.index({ sensorId: 1, shipmentId: 1, timestamp: -1 });` immediately after the existing `{ shipmentId: 1, timestamp: -1 }` index declaration
  - Verify the existing `{ shipmentId: 1, timestamp: -1 }` and `{ anchorStatus: 1 }` index lines are untouched
  - _Requirements: 1.1, 1.2_

  - [ ]* 1.1 Write schema-inspection unit tests for both indexes
    - In `tests/telemetry-improvements.test.ts`, import `TelemetrySchema` (or the `Telemetry` model) and call `.schema.indexes()` to retrieve the index list
    - Assert that `{ shipmentId: 1, timestamp: -1 }` is present
    - Assert that `{ sensorId: 1, shipmentId: 1, timestamp: -1 }` is present
    - Use descriptive `expect(...).toEqual(...)` messages so failures are self-explanatory
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Add thresholds service function and Zod schema
  - In `src/modules/telemetry/telemetry.validation.ts`, add `TelemetryThresholdsSchema` (a `z.object` with `maxTemp`, `maxHumidity`, `minBatteryLevel` as `z.number()`) and export the inferred `TelemetryThresholds` type
  - In `src/modules/telemetry/telemetry.service.ts`, add `getTelemetryThresholds(): TelemetryThresholds` returning `{ maxTemp: 85, maxHumidity: 90, minBatteryLevel: 20 }` — no DB calls, no `async`
  - _Requirements: 2.3, 2.6_

  - [ ]* 2.1 Write unit test for getTelemetryThresholds
    - Call `getTelemetryThresholds()` directly and assert the return value deep-equals `{ maxTemp: 85, maxHumidity: 90, minBatteryLevel: 20 }`
    - _Requirements: 2.3_

- [x] 3. Add getThresholds controller and wire the route
  - In `src/modules/telemetry/telemetry.controller.ts`, import `getTelemetryThresholds` from the service and add `export const getThresholds = async (req: Request, res: Response) => { ... }` that calls `sendResponse(res, 200, true, 'Thresholds retrieved', getTelemetryThresholds())`
  - In `src/modules/telemetry/telemetry.routes.ts`, import `getThresholds` and register `telemetryRouter.get('/thresholds', requireAuth, asyncHandler(getThresholds))` — place this route **before** the existing `GET /` route
  - _Requirements: 2.1, 2.2, 2.4, 2.5_

  - [ ]* 3.1 Write integration tests for GET /api/telemetry/thresholds
    - Test 200 happy path: send request with valid JWT, assert `res.status === 200`, `res.body.success === true`, and `res.body.data` deep-equals `{ maxTemp: 85, maxHumidity: 90, minBatteryLevel: 20 }`
    - Test 401 unauthenticated: send request without `Authorization` header, assert `res.status === 401`
    - Mock any external dependencies (Redis, Mongo) as needed using `jest.unstable_mockModule`
    - _Requirements: 2.1, 2.2_

- [x] 4. Fix controller bugs in getTelemetry
  - In `src/modules/telemetry/telemetry.controller.ts`, update the `getTelemetry` function:
    - Destructure `page`, `from`, and `to` from `req.query` alongside the existing `cursor`, `limit`, `shipmentId`
    - Replace the broken `page: pageNumber` argument with `page: page ? Number(page) : undefined`
    - Add `from: from as Date | undefined` and `to: to as Date | undefined` to the `getTelemetryService` call
  - Note: `validateRequest({ query: TelemetryQuerySchema })` already coerces these via Zod transforms before the controller runs, so the cast is safe
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 4.1 Write regression tests for the controller bug fixes
    - Test `GET /api/telemetry?page=1` with a valid JWT: assert response status is 200 (not 500), confirming the `ReferenceError` is gone
    - Test `GET /api/telemetry?from=2026-01-01T00:00:00.000Z&to=2026-12-31T23:59:59.000Z` with a valid JWT: mock `getTelemetryService` and assert it was called with `from` and `to` as `Date` objects
    - _Requirements: 3.1, 3.2_

- [x] 5. Checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 6. Write Socket.io broadcast tests for bulk ingest
  - Create (or extend) `tests/telemetry-improvements.test.ts` with a describe block for `POST /api/telemetry/bulk` broadcast behaviour
  - Mock `emitTelemetryUpdate` from `src/infra/socket/io.ts` using `jest.unstable_mockModule` (follow the pattern in `tests/realtime.events.test.ts`)
  - Also mock `pushStellarAnchorJob`, `pushAlertJob` (Redis queue), `Telemetry.create` (Mongoose), `Shipment.findOne` / `Shipment.find`, and `detectAnomaly`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 6.1 Write example-based broadcast tests
    - Test: POST one item with valid JWT → assert `mockEmitTelemetryUpdate` called exactly once (_Requirements: 4.1_)
    - Test: POST one item → assert `mockEmitTelemetryUpdate.mock.calls[0][0]` equals the item's `shipmentId` (_Requirements: 4.2_)
    - Test: POST one item → assert `mockEmitTelemetryUpdate.mock.calls[0][1]` contains `shipmentId`, `temperature`, `humidity`, `latitude`, `longitude`, `batteryLevel`, `timestamp`, `dataHash` (_Requirements: 4.3_)
    - Test: POST without JWT → assert status 401 and `mockEmitTelemetryUpdate` not called (_Requirements: 4.5_)

  - [ ]* 6.2 Write property-based test: emit count equals item count
    - Install `fast-check` if not already present (`npm install --save-dev fast-check`)
    - Use `fc.array(fc.record({ shipmentId: fc.uuidV(4), temperature: fc.float(...), ... }), { minLength: 1, maxLength: 20 })` to generate N items
    - For each generated array, POST to `/api/telemetry/bulk` (with mocked Telemetry.create returning a synthetic doc per item) and assert `mockEmitTelemetryUpdate` call count equals the array length
    - Tag: `// Feature: telemetry-improvements, Property 1: Bulk ingest emit count equals item count`
    - Configure minimum 100 iterations: `fc.assert(fc.asyncProperty(...), { numRuns: 100 })`
    - _Requirements: 4.4_

  - [ ]* 6.3 Write property-based test: emit payload shape invariant
    - For any valid `BulkTelemetryItem` generated by fast-check, after bulk ingest, assert the second argument to `emitTelemetryUpdate` contains all required `TelemetryUpdatePayload` fields with correct types (`string` for `shipmentId`, `timestamp`, `dataHash`; `number` for sensor readings)
    - Tag: `// Feature: telemetry-improvements, Property 2: Emit payload contains all required TelemetryUpdatePayload fields`
    - Configure minimum 100 iterations
    - _Requirements: 4.3_

- [ ] 7. Update Swagger documentation
  - In `docs/swagger.yaml`, add the `GET /api/telemetry/thresholds` path entry under `paths` with a 200 response schema (`data.maxTemp`, `data.maxHumidity`, `data.minBatteryLevel` as numbers) and a 401 `$ref: '#/components/responses/Unauthorized'`
  - _Requirements: 2.7_

- [~] 8. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- The controller fix in task 4 is a prerequisite for the regression tests in 4.1
- The thresholds route in task 3 must be registered before `GET /` to avoid any potential Express routing ambiguity
- `fast-check` property tests (6.2, 6.3) require mocking `Telemetry.create` to return a synthetic document per item so the service loop completes without a real DB connection
- All new code must pass `npm run build` (TypeScript strict) and `npm run lint` before the PR

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "2", "4"] },
    { "wave": 2, "tasks": ["3"] },
    { "wave": 3, "tasks": ["5"] },
    { "wave": 4, "tasks": ["6", "7"] },
    { "wave": 5, "tasks": ["8"] }
  ]
}
```
