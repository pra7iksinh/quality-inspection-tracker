import { DEFECT_TYPES, SEVERITIES, STATUSES } from '../constants.js'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidDate(value) {
  return typeof value === 'string' && DATE_RE.test(value) && !Number.isNaN(Date.parse(value))
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export function validateCreate(body = {}) {
  const errors = []

  if (!isValidDate(body.inspection_date)) {
    errors.push({ field: 'inspection_date', message: 'Required, format YYYY-MM-DD' })
  }
  if (!isNonEmptyString(body.machine_id)) {
    errors.push({ field: 'machine_id', message: 'Required, non-empty string' })
  } else if (body.machine_id.trim().length > 100) {
    errors.push({ field: 'machine_id', message: 'Max 100 characters' })
  }
  if (!DEFECT_TYPES.includes(body.defect_type)) {
    errors.push({ field: 'defect_type', message: `Must be one of: ${DEFECT_TYPES.join(', ')}` })
  }
  if (body.defect_type === 'Other' && !isNonEmptyString(body.custom_defect_type)) {
    errors.push({ field: 'custom_defect_type', message: 'Required when defect type is Other' })
  }
  if (!SEVERITIES.includes(body.severity)) {
    errors.push({ field: 'severity', message: `Must be one of: ${SEVERITIES.join(', ')}` })
  }
  if (body.remarks != null && typeof body.remarks !== 'string') {
    errors.push({ field: 'remarks', message: 'Must be a string when provided' })
  }
  if (body.client_id != null && !UUID_RE.test(body.client_id)) {
    errors.push({ field: 'client_id', message: 'Must be a UUID when provided' })
  }

  const value = {
    inspection_date: body.inspection_date,
    machine_id: typeof body.machine_id === 'string' ? body.machine_id.trim() : body.machine_id,
    defect_type: body.defect_type,
    custom_defect_type: body.defect_type === 'Other' && isNonEmptyString(body.custom_defect_type) ? body.custom_defect_type.trim() : null,
    severity: body.severity,
    remarks: isNonEmptyString(body.remarks) ? body.remarks.trim() : null,
    client_id: body.client_id ?? null,
  }
  return { value, errors }
}

export function validatePatch(body = {}) {
  const errors = []
  const allowed = ['status', 'resolution_note']
  const unknown = Object.keys(body).filter((k) => !allowed.includes(k))

  if (unknown.length > 0) {
    errors.push({
      field: unknown.join(', '),
      message: `Only [${allowed.join(', ')}] can be updated`,
    })
  }
  if (body.status !== 'Resolved') {
    errors.push({ field: 'status', message: "The only supported transition is status: 'Resolved'" })
  }
  if (!isNonEmptyString(body.resolution_note)) {
    errors.push({ field: 'resolution_note', message: 'A resolution note is mandatory when resolving' })
  }

  return {
    value: { resolution_note: isNonEmptyString(body.resolution_note) ? body.resolution_note.trim() : null },
    errors,
  }
}

export function validateListQuery(query = {}) {
  const errors = []

  if (query.severity != null && !SEVERITIES.includes(query.severity)) {
    errors.push({ field: 'severity', message: `Must be one of: ${SEVERITIES.join(', ')}` })
  }
  if (query.status != null && !STATUSES.includes(query.status)) {
    errors.push({ field: 'status', message: `Must be one of: ${STATUSES.join(', ')}` })
  }
  for (const field of ['from', 'to']) {
    if (query[field] != null && !isValidDate(query[field])) {
      errors.push({ field, message: 'Format YYYY-MM-DD' })
    }
  }

  const SORTS = ['date', 'severity', 'created_at']
  if (query.sort != null && !SORTS.includes(query.sort)) {
    errors.push({ field: 'sort', message: `Must be one of: ${SORTS.join(', ')}` })
  }
  if (query.order != null && !['asc', 'desc'].includes(query.order)) {
    errors.push({ field: 'order', message: 'Must be asc or desc' })
  }

  const page = query.page != null ? Number(query.page) : 1
  const limit = query.limit != null ? Number(query.limit) : 50
  if (!Number.isInteger(page) || page < 1) {
    errors.push({ field: 'page', message: 'Must be a positive integer' })
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
    errors.push({ field: 'limit', message: 'Must be an integer between 1 and 200' })
  }

  const value = {
    severity: query.severity ?? null,
    status: query.status ?? null,
    from: query.from ?? null,
    to: query.to ?? null,
    sort: query.sort ?? 'date',
    order: query.order ?? 'desc',
    page,
    limit,
  }
  return { value, errors }
}
