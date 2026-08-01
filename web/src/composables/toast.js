import { reactive } from 'vue'

export const toasts = reactive([])

let nextId = 1

export function toast(message, kind = 'info', ttl = 3500) {
  const id = nextId++
  toasts.push({ id, message, kind })
  setTimeout(() => {
    const idx = toasts.findIndex((t) => t.id === id)
    if (idx !== -1) toasts.splice(idx, 1)
  }, ttl)
}
