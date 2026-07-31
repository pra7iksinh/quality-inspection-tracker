import { defineStore } from 'pinia'
import { api, NetworkError } from '../api/http.js'
import { outboxAdd, outboxAll, cacheGet, cacheSet } from '../offline/outbox.js'
import { flushOutbox } from '../offline/sync.js'

const SEVERITY_RANK = { Critical: 1, Major: 2, Minor: 3 }

export const EMPTY_FILTERS = { severity: '', status: '', from: '', to: '' }

export const useInspectionsStore = defineStore('inspections', {
  state: () => ({
    items: [],
    pending: [],
    total: 0,
    loading: false,
    offline: false,
    filters: { ...EMPTY_FILTERS },
    sort: 'newest',
  }),

  getters: {
    activeFilterCount: (state) =>
      Object.values(state.filters).filter((v) => v !== '').length,

    visible(state) {
      const pendingRows = state.pending.map((e) => ({ ...e, status: 'Open', pending: true }))
      const rows = [...pendingRows, ...state.items].filter((r) => {
        const f = state.filters
        if (f.severity && r.severity !== f.severity) return false
        if (f.status && r.status !== f.status) return false
        if (f.from && r.inspection_date < f.from) return false
        if (f.to && r.inspection_date > f.to) return false
        return true
      })

      const byDate = (a, b) =>
        a.inspection_date < b.inspection_date ? 1 : a.inspection_date > b.inspection_date ? -1 : 0
      if (state.sort === 'severity') {
        rows.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || byDate(a, b))
      } else if (state.sort === 'oldest') {
        rows.sort((a, b) => -byDate(a, b))
      } else {
        rows.sort(byDate)
      }
      return rows
    },

    summary(state) {
      const empty = () => ({ Open: 0, Resolved: 0 })
      const by_severity = { Critical: empty(), Major: empty(), Minor: empty() }
      const totals = empty()
      for (const r of [...state.pending.map((e) => ({ ...e, status: 'Open' })), ...state.items]) {
        by_severity[r.severity][r.status]++
        totals[r.status]++
      }
      return { by_severity, totals }
    },
  },

  actions: {
    async refresh() {
      this.loading = true
      try {
        const res = await api.get('/inspections?limit=200&sort=date&order=desc')
        this.items = res.data
        this.total = res.meta.total
        this.offline = false
        await cacheSet('inspections', { items: res.data, total: res.meta.total })
      } catch (err) {
        if (!(err instanceof NetworkError)) throw err
        const cached = await cacheGet('inspections')
        if (cached) {
          this.items = cached.items
          this.total = cached.total
        }
        this.offline = true
      } finally {
        this.pending = await outboxAll()
        this.loading = false
      }
    },

    async create(payload) {
      const entry = { ...payload, client_id: crypto.randomUUID() }
      try {
        await api.post('/inspections', entry)
      } catch (err) {
        if (!(err instanceof NetworkError)) throw err
        await outboxAdd(entry)
        this.pending = await outboxAll()
        return 'queued'
      }
      await this.refresh()
      flushOutbox()
      return 'saved'
    },

    async resolve(id, note) {
      await api.patch(`/inspections/${id}`, { status: 'Resolved', resolution_note: note })
      await this.refresh()
    },
  },
})
