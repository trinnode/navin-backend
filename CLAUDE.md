You are a senior Rust developer contributing to an open-source project built on the Stellar ecosystem. 

Instructions:
1. Understand the Project First
•	Carefully read the README file.
•	Review the project structure and architecture.
•	Identify the core goal and purpose of the project.

2. Analyze Assigned Issues
•	Carefully read the below assigned issues.
•	Help solve each issues and map them to relevant parts of the codebase.

ISSUE  #162  [Optimization] Optimize Mongo indexes for sensor query pipelines
## Domain: Telemetry
### Issue [Optimization] Optimize Mongo indexes for sensor query pipelines
**Tier:** 🟡 Medium
**Description:**
- **Problem:** Fetching large sensor logs for rendering historical charts runs slow due to missing composite indexes in telemetry collections.
- **Implementation:** Create composite indexing on `{ shipmentId: 1, timestamp: -1 }` inside the telemetry Mongoose model.
**Dependencies:**
- Depends on None
**Acceptance Criteria:**
- [ ] Telemetry index exists.
- [ ] Query execution times drop below 10ms.
- [ ] Proper HTTP status codes and our standard JSON response wrapper are used.
- [ ] Edge cases (e.g., missing data, unauthorized roles) are handled gracefully.
**Testing Requirements:**
- [ ] Verify query plans using Mongoose `.explain("executionStats")`.
- [ ] Unit tests written for the core logic (target 80%+ coverage).
- [ ] External API calls or database connections are mocked in unit tests.
- [ ] Postman collection or Swagger spec updated (if this adds/modifies an endpoint).
**PR Checklist:**
- [ ] Branch is named conventionally (e.g., `feature/issue-22-short-desc`).
- [ ] `npm run lint` and `npm run build` pass with zero warnings.
- [ ] Screenshot of passing Jest terminal logs is attached to the PR.
- [ ] Database migrations/seed scripts updated (if applicable).

ISSUE #163  [Feature] Expose Telemetry configurations threshold endpoint 
## Domain: Telemetry
### Issue [Feature] Expose Telemetry configurations threshold endpoint
**Tier:** 🟢 Easy
**Description:**
- **Problem:** The frontend displays green/red status rings around sensor cards, but thresholds are hardcoded on client. We need dynamically served bounds.
- **Implementation:** Build `GET /api/telemetry/thresholds` endpoint to return system limits.
**Dependencies:**
- Depends on None
**Acceptance Criteria:**
- [ ] Returns `{ maxTemp, maxHumidity, minBatteryLevel }` schema.
- [ ] Proper HTTP status codes and our standard JSON response wrapper are used.
- [ ] Edge cases (e.g., missing data, unauthorized roles) are handled gracefully.
**Testing Requirements:**
- [ ] Request thresholds endpoint and assert payload matches boundaries.
- [ ] Unit tests written for the core logic (target 80%+ coverage).
- [ ] External API calls or database connections are mocked in unit tests.
- [ ] Postman collection or Swagger spec updated (if this adds/modifies an endpoint).
**PR Checklist:**
- [ ] Branch is named conventionally (e.g., `feature/issue-23-short-desc`).
- [ ] `npm run lint` and `npm run build` pass with zero warnings.
- [ ] Screenshot of passing Jest terminal logs is attached to the PR.
- [ ] Database migrations/seed scripts updated (if applicable).

ISSUE #161 [Feature] Real-time Telemetry broadcasts over Socket.io 
## Domain: Telemetry
### Issue [Feature] Real-time Telemetry broadcasts over Socket.io
**Tier:** 🔴 Hard
**Description:**
- **Problem:** Frontend charts require real-time dashboard plotting, but backend only records sensor telemetry in database without live triggers.
- **Implementation:** Hook Socket.io instance to broadcast event packets to designated shipment rooms inside the telemetry controller.
**Dependencies:**
- Depends on None
**Acceptance Criteria:**
- [ ] Websocket clients can join `shipment:<id>` rooms.
- [ ] Emits `sensor_update` JSON events immediately on post.
- [ ] Proper HTTP status codes and our standard JSON response wrapper are used.
- [ ] Edge cases (e.g., missing data, unauthorized roles) are handled gracefully.
**Testing Requirements:**
- [ ] Write Socket client simulation tests to capture broadcast events.
- [ ] Unit tests written for the core logic (target 80%+ coverage).
- [ ] External API calls or database connections are mocked in unit tests.
- [ ] Postman collection or Swagger spec updated (if this adds/modifies an endpoint).
**PR Checklist:**
- [ ] Branch is named conventionally (e.g., `feature/issue-21-short-desc`).
- [ ] `npm run lint` and `npm run build` pass with zero warnings.
- [ ] Screenshot of passing Jest terminal logs is attached to the PR.
- [ ] Database migrations/seed scripts updated (if applicable).
________________________________________
3. Study Reference Material
RUST BOOK - https://doc.rust-lang.org/book/
RUST BY EXAMPLE - https://doc.rust-lang.org/rust-by-example/
THE STANDARD LIBRARY - https://doc.rust-lang.org/std/index.html
EDITION GUIDE - https://doc.rust-lang.org/edition-guide/index.html
CARGO BOOK - https://doc.rust-lang.org/cargo/index.html
RUSTDOC BOOK - https://doc.rust-lang.org/rustdoc/index.html
RUSTC BOOK - https://doc.rust-lang.org/rustc/index.html
COMPILER ERROR INDEX - https://doc.rust-lang.org/error_codes/error-index.html
________________________________________
3. Open Source Standards
•	Write code that is easy for other contributors to understand.
•	Include comments only where necessary.
•	Make the solution review-ready for a pull request.
•	There SHOULDN’T be any Kiro co- or authorship anywhere in the history/comments/commit.


