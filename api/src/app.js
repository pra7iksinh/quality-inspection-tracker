import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import pool from './db.js'
import { requireAuth } from './middleware/auth.js'
import { asyncHandler, errorHandler, notFoundHandler } from './middleware/errors.js'
import authRoutes from './routes/auth.js'
import inspectionRoutes from './routes/inspections.js'
import sapWebhookRoutes from './routes/sapWebhook.js'

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')

export function createApp() {
  const app = express()
  app.use(cors())
  app.use(express.json())

  app.get(
    '/api/health',
    asyncHandler(async (req, res) => {
      await pool.query('SELECT 1')
      res.json({ data: { status: 'ok' } })
    })
  )

  app.use('/api/auth', authRoutes)
  app.use('/api/inspections', requireAuth, inspectionRoutes)
  app.use('/api/sap-webhook', sapWebhookRoutes)

  app.use('/api', notFoundHandler)

  app.use(express.static(PUBLIC_DIR))
  app.get('*', (req, res, next) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'), (err) => {
      if (err) next(err)
    })
  })

  app.use(errorHandler)
  return app
}
