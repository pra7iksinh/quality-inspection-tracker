import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import pool from './db.js'

const USERS = [
  { username: 'supervisor', password: 'Test105*', name: 'Super Visor' },
  { username: 'supervisor1', password: 'Test105*', name: 'Super Visor 1' },
]

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

const SAMPLE_INSPECTIONS = [
  { date: daysAgo(0), machine: 'LOOM-14', defect: 'Weave Defect', severity: 'Critical', remarks: 'Broken pick every ~2m along weft' },
  { date: daysAgo(0), machine: 'DYE-03', defect: 'Shade Variation', severity: 'Major', remarks: 'Batch 4417 darker than approved lot' },
  { date: daysAgo(1), machine: 'LOOM-07', defect: 'Hole/Tear', severity: 'Critical', remarks: 'Tear near selvedge, ~4cm' },
  { date: daysAgo(2), machine: 'SPIN-21', defect: 'Count Deviation', severity: 'Minor', remarks: null },
  { date: daysAgo(3), machine: 'LOOM-14', defect: 'Weave Defect', severity: 'Major', remarks: 'Reed mark visible on face side', resolved: 'Reed replaced, verified on next 50m run' },
  { date: daysAgo(4), machine: 'DYE-01', defect: 'Shade Variation', severity: 'Minor', remarks: 'Marginal, within tolerance on recheck', resolved: 'Re-matched against master swatch - approved' },
  { date: daysAgo(6), machine: 'LOOM-02', defect: 'Other', severity: 'Minor', remarks: 'Oil stain, likely from loose spindle', resolved: 'Spindle tightened and fabric segment cut out' },
  { date: daysAgo(8), machine: 'SPIN-09', defect: 'Count Deviation', severity: 'Major', remarks: 'Yarn count off spec on ring frame 9', source: 'sap' },
]

export async function seed() {
  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 10)
    await pool.query(
      `INSERT INTO users (username, password_hash, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO NOTHING`,
      [u.username, hash, u.name]
    )
  }

  const { rows } = await pool.query('SELECT count(*)::int AS count FROM inspections')
  if (rows[0].count > 0) return

  const { rows: users } = await pool.query('SELECT id FROM users ORDER BY id LIMIT 1')
  const createdBy = users[0]?.id ?? null

  for (const s of SAMPLE_INSPECTIONS) {
    await pool.query(
      `INSERT INTO inspections
         (inspection_date, machine_id, defect_type, severity, remarks,
          status, resolution_note, resolved_at, source, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        s.date,
        s.machine,
        s.defect,
        s.severity,
        s.remarks,
        s.resolved ? 'Resolved' : 'Open',
        s.resolved ?? null,
        s.resolved ? new Date() : null,
        s.source ?? 'manual',
        createdBy,
      ]
    )
  }
  console.log(`seeded: ${USERS.length} users, ${SAMPLE_INSPECTIONS.length} inspections`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
