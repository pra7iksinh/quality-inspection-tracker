import { openDB } from 'idb'

const dbPromise = openDB('qit', 1, {
  upgrade(db) {
    db.createObjectStore('outbox', { keyPath: 'client_id' })
    db.createObjectStore('cache')
  },
})

export async function outboxAdd(entry) {
  const db = await dbPromise
  await db.put('outbox', entry)
}

export async function outboxAll() {
  const db = await dbPromise
  return db.getAll('outbox')
}

export async function outboxRemove(clientId) {
  const db = await dbPromise
  await db.delete('outbox', clientId)
}

export async function cacheSet(key, value) {
  const db = await dbPromise
  await db.put('cache', value, key)
}

export async function cacheGet(key) {
  const db = await dbPromise
  return db.get('cache', key)
}
