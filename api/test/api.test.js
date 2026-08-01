import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import pool from '../src/db.js'
import { migrate } from '../src/migrate.js'
import { seed } from '../src/seed.js'
import { createApp } from '../src/app.js'

let app
let token

beforeAll(async () => {
  await migrate()
  await seed()
  app = createApp()

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'supervisor1', password: 'arvind123' })
  token = res.body.data.token
})

afterAll(async () => {
  await pool.end()
})

const auth = (req) => req.set('Authorization', `Bearer ${token}`)

function validPayload(overrides = {}) {
  return {
    inspection_date: '2026-07-31',
    machine_id: 'TEST-LOOM-1',
    defect_type: 'Weave Defect',
    severity: 'Major',
    remarks: 'created by test',
    ...overrides,
  }
}

describe('auth', () => {
  it('rejects bad credentials with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'supervisor1', password: 'nope' })
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('rejects inspection routes without a token', async () => {
    const res = await request(app).get('/api/inspections')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/inspections', () => {
  it('creates an inspection with 201 and returns the record', async () => {
    const res = await auth(request(app).post('/api/inspections')).send(validPayload())
    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({
      machine_id: 'TEST-LOOM-1',
      status: 'Open',
      source: 'manual',
    })
    expect(res.body.data.id).toBeDefined()
  })

  it('returns 400 with field details for an invalid payload', async () => {
    const res = await auth(request(app).post('/api/inspections')).send({
      machine_id: '',
      defect_type: 'Bad',
    })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    const fields = res.body.error.details.map((d) => d.field)
    expect(fields).toEqual(
      expect.arrayContaining(['inspection_date', 'machine_id', 'defect_type', 'severity'])
    )
  })

  it('is idempotent on client_id: replay returns the same record with 200', async () => {
    const client_id = crypto.randomUUID()
    const first = await auth(request(app).post('/api/inspections')).send(
      validPayload({ client_id })
    )
    const replay = await auth(request(app).post('/api/inspections')).send(
      validPayload({ client_id })
    )
    expect(first.status).toBe(201)
    expect(replay.status).toBe(200)
    expect(replay.body.data.id).toBe(first.body.data.id)
  })
})

describe('GET /api/inspections', () => {
  it('filters by severity and status', async () => {
    await auth(request(app).post('/api/inspections')).send(
      validPayload({ severity: 'Critical', machine_id: 'TEST-FILTER' })
    )
    const res = await auth(request(app).get('/api/inspections?severity=Critical&status=Open'))
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThan(0)
    for (const row of res.body.data) {
      expect(row.severity).toBe('Critical')
      expect(row.status).toBe('Open')
    }
    expect(res.body.meta.total).toBeGreaterThanOrEqual(res.body.data.length)
  })

  it('filters by date range', async () => {
    await auth(request(app).post('/api/inspections')).send(
      validPayload({ inspection_date: '2020-01-15', machine_id: 'TEST-OLD' })
    )
    const res = await auth(request(app).get('/api/inspections?from=2020-01-01&to=2020-01-31'))
    expect(res.status).toBe(200)
    for (const row of res.body.data) {
      expect(row.inspection_date >= '2020-01-01' && row.inspection_date <= '2020-01-31').toBe(true)
    }
  })

  it('sorts by severity with Critical first (order=asc)', async () => {
    const res = await auth(request(app).get('/api/inspections?sort=severity&order=asc&limit=200'))
    const rank = { Critical: 1, Major: 2, Minor: 3 }
    const ranks = res.body.data.map((r) => rank[r.severity])
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
  })

  it('rejects unknown filter values with 400', async () => {
    const res = await auth(request(app).get('/api/inspections?severity=Bogus'))
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/inspections/:id (resolve)', () => {
  async function createOpen() {
    const res = await auth(request(app).post('/api/inspections')).send(validPayload())
    return res.body.data.id
  }

  it('requires a resolution note (400)', async () => {
    const id = await createOpen()
    const res = await auth(request(app).patch(`/api/inspections/${id}`)).send({
      status: 'Resolved',
    })
    expect(res.status).toBe(400)
  })

  it('resolves with a note and stamps resolved_at', async () => {
    const id = await createOpen()
    const res = await auth(request(app).patch(`/api/inspections/${id}`)).send({
      status: 'Resolved',
      resolution_note: 'fixed in test',
    })
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Resolved')
    expect(res.body.data.resolution_note).toBe('fixed in test')
    expect(res.body.data.resolved_at).not.toBeNull()
  })

  it('returns 409 when already resolved', async () => {
    const id = await createOpen()
    await auth(request(app).patch(`/api/inspections/${id}`)).send({
      status: 'Resolved',
      resolution_note: 'first',
    })
    const res = await auth(request(app).patch(`/api/inspections/${id}`)).send({
      status: 'Resolved',
      resolution_note: 'second',
    })
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('ALREADY_RESOLVED')
  })

  it('returns 404 for unknown or malformed ids', async () => {
    const unknown = await auth(
      request(app).patch('/api/inspections/00000000-0000-4000-8000-000000000000')
    ).send({ status: 'Resolved', resolution_note: 'x' })
    expect(unknown.status).toBe(404)

    const malformed = await auth(request(app).get('/api/inspections/not-a-uuid'))
    expect(malformed.status).toBe(404)
  })
})

describe('GET /api/inspections/summary', () => {
  it('returns counts per severity that add up to totals', async () => {
    const res = await auth(request(app).get('/api/inspections/summary'))
    expect(res.status).toBe(200)
    const { by_severity, totals } = res.body.data
    for (const status of ['Open', 'Resolved']) {
      const sum = Object.values(by_severity).reduce((acc, s) => acc + s[status], 0)
      expect(sum).toBe(totals[status])
    }
  })
})

describe('POST /api/sap-webhook', () => {
  const payload = {
    plant_code: 'GJ-01',
    machine: 'LOOM-14',
    defect_code: 'WEAVE',
    severity: 'HIGH',
    inspected_at: '2026-07-30T10:00:00Z',
    notes: 'auto from SAP QM',
  }

  it('rejects a missing/invalid secret with 401', async () => {
    const res = await request(app).post('/api/sap-webhook').send(payload)
    expect(res.status).toBe(401)
  })

  it('creates a mapped inspection with 201', async () => {
    const res = await request(app)
      .post('/api/sap-webhook')
      .set('X-SAP-Secret', process.env.SAP_WEBHOOK_SECRET)
      .send(payload)
    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({
      machine_id: 'GJ-01:LOOM-14',
      defect_type: 'Weave Defect',
      severity: 'Critical',
      inspection_date: '2026-07-30',
      source: 'sap',
    })
  })

  it('maps unknown defect codes to Other, keeping the code in remarks', async () => {
    const res = await request(app)
      .post('/api/sap-webhook')
      .set('X-SAP-Secret', process.env.SAP_WEBHOOK_SECRET)
      .send({ ...payload, defect_code: 'SHRINK' })
    expect(res.status).toBe(201)
    expect(res.body.data.defect_type).toBe('Other')
    expect(res.body.data.remarks).toContain('SHRINK')
  })

  it('rejects an incomplete payload with 400', async () => {
    const res = await request(app)
      .post('/api/sap-webhook')
      .set('X-SAP-Secret', process.env.SAP_WEBHOOK_SECRET)
      .send({ plant_code: 'GJ-01' })
    expect(res.status).toBe(400)
  })
})
