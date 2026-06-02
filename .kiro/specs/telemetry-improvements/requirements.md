# Requirements Document

## Introduction

This spec covers three targeted improvements to the telemetry module of the navin-backend logistics API:

1. **Issue #162 — MongoDB index optimisation**: Add a secondary composite index on `{ sensorId, shipmentId, timestamp }` to accelerate sensor-scoped queries, and verify both indexes via schema inspection tests.
2. **Issue #163 — Thresholds endpoint**: Expose `GET /api/telemetry/thresholds` (auth-protected) that returns the system-wide sensor alert boundaries consumed by the frontend.
3. **Issue #161 — Controller bug-fixes + Socket.io broadcast tests**: Fix two bugs in `telemetry.controller.ts` (`pageNumber` undefined, `from`/`to` not forwarded to the service) and add Jest tests that verify `emitTelemetryUpdate` is called correctly during bulk ingest.

All work must conform to the project conventions in `AGENTS.md`: TypeScript strict, no `any`, no `console.*`, `sendResponse()` envelope, `AppError` for errors, `requireAuth` on every route, Zod validation, and Swagger docs updated.

---

## Glossary

- **Telemetry_Module**: The set of files `telemetry.model.ts`, `telemetry.controller.ts`, `telemetry.service.ts`, `telemetry.routes.ts`, `telemetry.validation.ts`.
- **TelemetrySchema**: The Mongoose schema defined in `telemetry.model.ts`.
- **Composite_Index**: A MongoDB index spanning multiple fields in a defined order.
- **Thresholds**: Hardcoded system constants `{ maxTemp: 85, maxHumidity: 90, minBatteryLevel: 20 }` representing sensor alert boundaries.
- **Socket_Broadcast**: A call to `emitTelemetryUpdate(shipmentId, payload)` from `src/infra/socket/io.ts` that emits a `telemetry_update` event to the `shipment:<id>` Socket.io room.
- **BulkIngest**: The `POST /api/telemetry/bulk` endpoint handled by `bulkIngestTelemetry` in `telemetry.service.ts`.
- **Controller_Bug**: The two defects in `telemetry.controller.ts`: (a) `pageNumber` referenced but never declared, (b) `from` and `to` query params not forwarded to `getTelemetryService`.
- **AppError**: The project error class from `src/shared/http/errors.ts` used in place of `new Error()`.
- **sendResponse**: The project response helper from `src/shared/http/sendResponse.ts` used in place of `res.json()`.
- **requireAuth**: JWT + Redis-blocklist middleware from `src/shared/middleware/requireAuth.ts`.

---

## Requirements

### Requirement 1: Secondary Composite Index for Sensor-Scoped Queries

**User Story:** As a backend developer, I want a composite index on `{ sensorId, shipmentId, timestamp }` in the Telemetry collection, so that sensor-scoped historical queries execute efficiently without full collection scans.

#### Acceptance Criteria

1. THE TelemetrySchema SHALL define an index `{ sensorId: 1, shipmentId: 1, timestamp: -1 }` in addition to the existing `{ shipmentId: 1, timestamp: -1 }` index.
2. THE TelemetrySchema SHALL retain the existing index `{ shipmentId: 1, timestamp: -1 }` unchanged.
3. WHEN a unit test inspects the TelemetrySchema index definitions, THE test SHALL confirm that both `{ shipmentId: 1, timestamp: -1 }` and `{ sensorId: 1, shipmentId: 1, timestamp: -1 }` are present.
4. IF the secondary index is absent from the schema, THEN THE test SHALL fail with a descriptive assertion message.

---

### Requirement 2: Telemetry Thresholds Endpoint

**User Story:** As a frontend developer, I want a `GET /api/telemetry/thresholds` endpoint, so that the UI can dynamically fetch sensor alert boundaries instead of hardcoding them on the client.

#### Acceptance Criteria

1. WHEN an authenticated user sends `GET /api/telemetry/thresholds`, THE Telemetry_Module SHALL return HTTP 200 with the envelope `{ success: true, message: "Thresholds retrieved", data: { maxTemp: 85, maxHumidity: 90, minBatteryLevel: 20 } }`.
2. WHEN an unauthenticated request is sent to `GET /api/telemetry/thresholds`, THE Telemetry_Module SHALL return HTTP 401 with an error envelope.
3. THE `getTelemetryThresholds` service function SHALL return the object `{ maxTemp: 85, maxHumidity: 90, minBatteryLevel: 20 }` as a plain TypeScript interface with no database calls.
4. THE `getThresholds` controller function SHALL call `getTelemetryThresholds` and pass the result to `sendResponse` with status 200.
5. THE route `GET /api/telemetry/thresholds` SHALL be registered in `telemetry.routes.ts` with `requireAuth` middleware applied before the controller.
6. THE `TelemetryThresholdsSchema` Zod schema SHALL be defined in `telemetry.validation.ts` (no body or query parameters required; schema validates the response shape for documentation purposes).
7. THE `docs/swagger.yaml` SHALL include a `GET /api/telemetry/thresholds` path entry with a 200 response schema matching `{ maxTemp, maxHumidity, minBatteryLevel }` and a 401 response.

---

### Requirement 3: Controller Bug Fixes

**User Story:** As a developer, I want the `getTelemetry` controller to correctly pass all query parameters to the service, so that pagination and date-range filtering work as intended.

#### Acceptance Criteria

1. WHEN `GET /api/telemetry` is called with a `page` query parameter, THE Telemetry_Module SHALL pass the numeric `page` value to `getTelemetryService` without a `ReferenceError`.
2. WHEN `GET /api/telemetry` is called with `from` and `to` query parameters, THE Telemetry_Module SHALL forward both values to `getTelemetryService` so that date-range filtering is applied.
3. THE `getTelemetry` controller SHALL destructure `page`, `from`, and `to` from `req.query` (in addition to the existing `cursor`, `limit`, and `shipmentId`).
4. THE `getTelemetryService` call in the controller SHALL include `from` and `to` as typed `Date | undefined` arguments matching the service's parameter interface.
5. IF `page` is present in `req.query`, THEN THE controller SHALL coerce it to a number before passing it to the service (consistent with the Zod schema coercion already applied by `validateRequest`).

---

### Requirement 4: Socket.io Broadcast Tests for Bulk Ingest

**User Story:** As a developer, I want Jest tests that verify `emitTelemetryUpdate` is called with the correct `shipmentId` and payload shape during bulk ingest, so that real-time broadcast behaviour is regression-tested.

#### Acceptance Criteria

1. WHEN `POST /api/telemetry/bulk` is called with a valid authenticated request containing one telemetry item, THE test SHALL assert that `emitTelemetryUpdate` was called exactly once.
2. WHEN `emitTelemetryUpdate` is called during an actual bulk ingest operation, THE test SHALL assert that the first argument equals the resolved `shipmentId` string.
3. WHEN `emitTelemetryUpdate` is called during bulk ingest, THE test SHALL assert that the second argument contains the fields `shipmentId`, `temperature`, `humidity`, `latitude`, `longitude`, `batteryLevel`, `timestamp`, and `dataHash`.
4. WHEN `POST /api/telemetry/bulk` is called with two telemetry items for different shipments, THE test SHALL assert that `emitTelemetryUpdate` was called twice, once per shipment.
5. WHEN `POST /api/telemetry/bulk` is called without a valid JWT, THE test SHALL assert that `emitTelemetryUpdate` was not called and the response status is 401.
6. THE test file SHALL mock `emitTelemetryUpdate` from `src/infra/socket/io.ts` using `jest.unstable_mockModule` (consistent with the pattern in `tests/realtime.events.test.ts`).
