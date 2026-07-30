import pool from './db.js'
import { migrate } from './migrate.js'
import { seed } from './seed.js'
import { createApp } from './app.js'

const PORT = Number(process.env.PORT ?? 3000)

async function waitForDb(attempts = 15) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await pool.query('SELECT 1')
      return
    } catch (err) {
      if (i === attempts) throw err
      console.log(`db not ready (attempt ${i}/${attempts}), retrying...`)
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
}

await waitForDb()
await migrate()
await seed()

const server = createApp().listen(PORT, () => {
  console.log(`Quality Inspection Tracker API listening on :${PORT}`)
})

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => pool.end().then(() => process.exit(0)))
    setTimeout(() => process.exit(1), 5000).unref()
  })
}
