import { Router } from 'express'
import pool from '../db.js'
import { ApiError, asyncHandler } from '../middleware/errors.js'

const router = Router()

const DEFECT_MAP = {
  WEAVE: 'Weave Defect',
  SHADE: 'Shade Variation',
  HOLE: 'Hole/Tear',
  COUNT: 'Count Deviation',
}

const SEVERITY_MAP = {
  CRITICAL: 'Critical',
  HIGH: 'Critical',
  MEDIUM: 'Major',
  LOW: 'Minor',
}

/**
 * Expected payload (documented in README):
 * {
 *   "plant_code":   "GJ-01",                  // required
 *   "machine":      "LOOM-14",                // required
 *   "defect_code":  "WEAVE",                  // required: WEAVE | SHADE | HOLE | COUNT | anything else -> Other
 *   "severity":     "HIGH",                   // required: CRITICAL | HIGH | MEDIUM | LOW
 *   "inspected_at": "2026-07-31T10:00:00Z",   // optional ISO timestamp, defaults to now
 *   "notes":        "free text"               // optional
 * }
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    if (req.headers['x-sap-secret'] !== process.env.SAP_WEBHOOK_SECRET) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Missing or invalid X-SAP-Secret header')
    }

    const body = req.body ?? {}
    const errors = []
    for (const field of ['plant_code', 'machine', 'defect_code', 'severity']) {
      if (typeof body[field] !== 'string' || body[field].trim() === '') {
        errors.push({ field, message: 'Required, non-empty string' })
      }
    }

    const severity = SEVERITY_MAP[body.severity?.toUpperCase?.()]
    if (body.severity && !severity) {
      errors.push({
        field: 'severity',
        message: `Must be one of: ${Object.keys(SEVERITY_MAP).join(', ')}`,
      })
    }

    let inspectionDate = new Date()
    if (body.inspected_at != null) {
      inspectionDate = new Date(body.inspected_at)
      if (Number.isNaN(inspectionDate.getTime())) {
        errors.push({ field: 'inspected_at', message: 'Must be an ISO 8601 timestamp' })
      }
    }

    if (errors.length > 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid SAP payload', errors)
    }

    const defectCode = body.defect_code.toUpperCase()
    const defectType = DEFECT_MAP[defectCode] ?? 'Other'
    const remarks = [
      defectType === 'Other' ? `SAP defect code: ${defectCode}` : null,
      body.notes?.trim() || null,
    ]
      .filter(Boolean)
      .join(' - ')

    const { rows } = await pool.query(
      `INSERT INTO inspections
         (inspection_date, machine_id, defect_type, severity, remarks, source)
       VALUES ($1, $2, $3, $4, $5, 'sap')
       RETURNING *`,
      [
        inspectionDate.toISOString().slice(0, 10),
        `${body.plant_code.trim()}:${body.machine.trim()}`,
        defectType,
        severity,
        remarks || null,
      ]
    )

    res.status(201).json({ data: rows[0] })
  })
)

export default router
