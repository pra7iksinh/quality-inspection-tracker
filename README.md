# Quality Inspection Tracker

A mobile-first web app for shop-floor supervisors to log, track, and resolve fabric quality defects

**Stack:** Vue 3 (Vite, Pinia) · Node.js/Express · PostgreSQL · Docker Compose


## Quick start (Docker)

```bash
docker compose up --build
```

Open **http://localhost:3000** - that's it. Migrations and seed data run automatically on boot.

### Login Credentials

| Username      | Password   |
| ------------- | ---------- |
| `supervisor`  | `Test105*` |
| `supervisor1` | `Test105*` |

---

## Features

**Core**
- Log an inspection: date, machine/line ID (free text), defect type (dropdown), severity, optional remarks
- Sortable, filterable list - severity, status (Open/Resolved), date range; sort by newest/oldest/severity
- Resolve with a **mandatory** resolution note (enforced in UI, API, and a DB CHECK constraint)
- Summary: Open/Resolved counts by severity

**Bonus (all three)**
- **Offline support** - the app is a PWA: it opens without connectivity, inspections logged offline are queued in IndexedDB and sync automatically when the connection returns (visible as a "waiting to sync" badge + header counter)
- **Mock SAP integration** - `POST /api/sap-webhook` auto-creates inspections (payload documented below)
- **JWT auth** - login with seeded supervisor accounts, 12-hour tokens

## API

All endpoints return a consistent envelope: `{ "data": ... }` on success, `{ "error": { "code", "message", "details?" } }` on failure.

| Method | Path | Auth | Purpose | Status codes |
|---|---|---|---|---|
| POST | `/api/auth/login` | - | `{username, password}` → `{token, user}` | 200, 400, 401 |
| GET | `/api/inspections` | JWT | List. Query: `severity`, `status`, `from`, `to`, `sort` (date\|severity\|created_at), `order` (asc\|desc), `page`, `limit` | 200, 400 |
| POST | `/api/inspections` | JWT | Create (accepts optional `client_id` uuid for idempotency) | 201, 200*, 400 |
| GET | `/api/inspections/summary` | JWT | Open/Resolved counts by severity | 200 |
| GET | `/api/inspections/:id` | JWT | Detail | 200, 404 |
| PATCH | `/api/inspections/:id` | JWT | Resolve: `{"status": "Resolved", "resolution_note": "..."}` - note is mandatory | 200, 400, 404, 409 |
| POST | `/api/sap-webhook` | `X-SAP-Secret` header | Auto-create from an SAP QM notification | 201, 400, 401 |
| GET | `/api/health` | - | Healthcheck | 200 |


##  Mock SAP Integration (Webhook)

As requested, the application exposes a webhook endpoint to accept JSON payloads from SAP QM to auto-create inspection records.

**Endpoint:** `POST /api/sap-webhook`
**Authentication:** Requires an `X-SAP-Secret` header matching the `SAP_WEBHOOK_SECRET` environment variable (set to `sap-demo-secret` by default).

### How to test the Webhook

You can test this endpoint directly from your terminal using `curl`:

```bash
curl -X POST http://localhost:3000/api/sap-webhook \
  -H 'Content-Type: application/json' \
  -H 'X-SAP-Secret: sap-demo-secret' \
  -d '{
    "plant_code":   "GJ-01",
    "machine":      "LOOM-14",
    "defect_code":  "WEAVE",
    "severity":     "HIGH",
    "inspected_at": "2026-07-31T10:00:00Z",
    "notes":        "Auto-created from SAP QM notification"
  }'
```

### Expected Payload Shape

| JSON Field | Required | Description |
|---|---|---|
| `plant_code` | **Yes** | Combined with `machine` into `machine_id` (e.g., `GJ-01:LOOM-14`). |
| `machine` | **Yes** | The machine ID. |
| `defect_code` | **Yes** | Mapped to app enums: `WEAVE`→Weave Defect, `SHADE`→Shade Variation, `HOLE`→Hole/Tear, `COUNT`→Count Deviation. Anything else becomes 'Other'. |
| `severity` | **Yes** | Mapped to app enums: `CRITICAL`/`HIGH`→Critical, `MEDIUM`→Major, `LOW`→Minor. |
| `inspected_at` | No | timestamp. Defaults to the current time if omitted. |
| `notes` | No | Additional context, stored in the inspection's `remarks` field. |

## Testing

```bash
cd api && npm test        # 18 integration tests (vitest + supertest) - needs the compose db running
./scripts/smoke.sh           # end-to-end curl check against a running instance (17 checks)
```

## Architecture Decisions

### Simple SQL instead of an ORM

The application uses plain PostgreSQL queries with the `pg` package instead of an ORM. Since the project is small, this keeps the code simple, easy to understand, and avoids unnecessary dependencies. 

### Offline support

Users can create inspections even when there is no internet connection. The data is stored in the browser using IndexedDB and automatically synced when the connection is restored. Each inspection has a unique client ID to prevent duplicate records during sync. Resolving an inspection requires an internet connection to avoid updating outdated information.

### Fast filtering

The application downloads the latest 200 inspections and performs filtering and sorting in the browser. This makes the app faster, especially on slow or unstable internet connections. The backend still supports filtering, sorting, and pagination for future scalability.

### Authentication

Supervisors log in using JWT authentication with a 12-hour token. The SAP webhook uses a separate shared secret (`X-SAP-Secret`) instead of a user account. Inspections created through the webhook are marked as coming from SAP.

### Lightweight mobile-first design

The interface is built with custom CSS instead of a UI framework to keep the application lightweight and fast. It is designed for mobile devices first, with large touch-friendly buttons and a layout that works well on a 390px-wide screen.

### Centralized text

All application text is stored in a single language file (`web/src/i18n/en.js`). This makes it easy to update labels and allows additional languages.

---

## Assumptions

* The application is designed for a single factory or plant.
* Any supervisor can resolve any inspection.
* Inspections can only move from Open to Resolved.
* Existing inspections cannot be edited or reopened.
* Creating inspections works offline, but resolving them requires an internet connection.
* Severity is displayed in the order: Critical → Major → Minor.
* The UI prevents selecting future dates for inspections.
* Demo user accounts are provided instead of a complete user management system.

---

## What I Would Improve with More Time

* Implement a more secure authentication system using refresh tokens and HTTP-only cookies.
* Use the browser's Background Sync API so offline data can sync automatically even when the application is closed.
* Add pagination to support large numbers of inspection records.
* Introduce user roles (such as Inspector and Manager), support photo uploads for defects.

## Project structure

```
docker-compose.yml        postgres + api (api serves the built web app)
api/                      Express REST API
  src/migrations/         plain-SQL migrations, applied once each on boot
  src/routes/             auth, inspections, sap-webhook
  src/validators/         request validation (field-level error details)
  test/                   vitest + supertest integration suite
web/                      Vue 3 PWA (Vite, Pinia, vue-router)
  src/i18n/               ALL static UI text, one file per language (en.js)
  src/offline/            IndexedDB outbox + sync manager
  src/stores/             auth + inspections (filtering/sorting/summary)
  src/views/              Login, InspectionList, NewInspection, Summary
scripts/smoke.sh          end-to-end curl smoke test
scripts/generate-icons.mjs  PWA icon generator (pure Node, no image deps)
```
