import { api, HttpError, tokenStore } from '../api/http.js'
import { outboxAll, outboxRemove } from './outbox.js'
import { useInspectionsStore } from '../stores/inspections.js'
import { toast } from '../composables/toast.js'
import { t } from '../i18n/index.js'

let syncing = false

export async function flushOutbox() {
  if (syncing || !tokenStore.get()) return
  syncing = true
  try {
    const entries = await outboxAll()
    if (entries.length === 0) return

    let synced = 0
    for (const entry of entries) {
      try {
        await api.post('/inspections', entry)
        await outboxRemove(entry.client_id)
        synced++
      } catch (err) {
        if (err instanceof HttpError && err.status === 400) {
          await outboxRemove(entry.client_id)
          toast(t('sync.rejected'), 'error')
        } else {
          break
        }
      }
    }

    if (synced > 0) {
      toast(
        synced === 1 ? t('sync.syncedOne') : t('sync.syncedMany', { count: synced }),
        'success'
      )
      await useInspectionsStore().refresh()
    }
  } finally {
    syncing = false
  }
}

export function startSync() {
  window.addEventListener('online', () => {
    flushOutbox()
  })
  flushOutbox()
}
