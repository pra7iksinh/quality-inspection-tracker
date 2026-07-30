import { Router } from 'express'
import pool from '../db.js'
import { ApiError, asyncHandler } from '../middleware/errors.js'
import { validateCreate, validatePatch, validateListQuery } from '../validators/inspections.js'
import { SEVERITIES } from '../constants.js'

const router = Router()

const SORT_COLUMNS = {
  date: 'inspection_date',
  created_at: 'created_at',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

router.param('id', (req, res, next, id) => {
  if (!UUID_RE.test(id)) {
    return next(new ApiError(404, 'NOT_FOUND', 'Inspection not found'))
  }
  next()
})

function severityOrderSql() {
  const list = SEVERITIES.map((s) => `'${s}'`).join(', ')
  return `array_position(ARRAY[${list}]::text[], severity)`
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { value: q, errors } = validateListQuery(req.query)
    if (errors.length > 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid query parameters', errors)
    }

    const where = []
    const params = []
    const add = (sql, param) => {
      params.push(param)
      where.push(sql.replace('?', `$${params.length}`))
    }

    if (q.severity) add('severity = ?', q.severity)
    if (q.status) add('status = ?', q.status)
    if (q.from) add('inspection_date >= ?', q.from)
    if (q.to) add('inspection_date <= ?', q.to)

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''
    const orderCol = q.sort === 'severity' ? severityOrderSql() : SORT_COLUMNS[q.sort]
    const orderSql = `ORDER BY ${orderCol} ${q.order.toUpperCase()}, created_at DESC`

    const countResult = await pool.query(
      `SELECT count(*)::int AS total FROM inspections ${whereSql}`,
      params
    )
    const total = countResult.rows[0].total

    const offset = (q.page - 1) * q.limit
    const { rows } = await pool.query(
      `SELECT * FROM inspections ${whereSql} ${orderSql}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, q.limit, offset]
    )

    res.json({ data: rows, meta: { page: q.page, limit: q.limit, total } })
  })
)

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      'SELECT severity, status, count(*)::int AS count FROM inspections GROUP BY severity, status'
    )

    const summary = {}
    for (const severity of SEVERITIES) {
      summary[severity] = { Open: 0, Resolved: 0 }
    }
    const totals = { Open: 0, Resolved: 0 }
    for (const row of rows) {
      summary[row.severity][row.status] = row.count
      totals[row.status] += row.count
    }

    res.json({ data: { by_severity: summary, totals } })
  })
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM inspections WHERE id = $1', [req.params.id])
    if (rows.length === 0) {
      throw new ApiError(404, 'NOT_FOUND', 'Inspection not found')
    }
    res.json({ data: rows[0] })
  })
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { value, errors } = validateCreate(req.body)
    if (errors.length > 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid inspection payload', errors)
    }

    const insert = await pool.query(
      `INSERT INTO inspections
         (inspection_date, machine_id, defect_type, custom_defect_type, severity, remarks, client_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (client_id) DO NOTHING
       RETURNING *`,
      [
        value.inspection_date,
        value.machine_id,
        value.defect_type,
        value.custom_defect_type,
        value.severity,
        value.remarks,
        value.client_id,
        req.user.id,
      ]
    )

    if (insert.rows.length > 0) {
      return res.status(201).json({ data: insert.rows[0] })
    }

    const existing = await pool.query('SELECT * FROM inspections WHERE client_id = $1', [
      value.client_id,
    ])
    res.status(200).json({ data: existing.rows[0] })
  })
)

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { value, errors } = validatePatch(req.body)
    if (errors.length > 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid update payload', errors)
    }

    const { rows, rowCount } = await pool.query(
      `UPDATE inspections
       SET status = 'Resolved', resolution_note = $1, resolved_at = now(), updated_at = now()
       WHERE id = $2 AND status = 'Open'
       RETURNING *`,
      [value.resolution_note, req.params.id]
    )

    if (rowCount > 0) {
      return res.json({ data: rows[0] })
    }

    const { rowCount: exists } = await pool.query(
      'SELECT 1 FROM inspections WHERE id = $1',
      [req.params.id]
    )
    if (exists === 0) {
      throw new ApiError(404, 'NOT_FOUND', 'Inspection not found')
    }
    throw new ApiError(409, 'ALREADY_RESOLVED', 'Inspection is already resolved')
  })
)

export default router
