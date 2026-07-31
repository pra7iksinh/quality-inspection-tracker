<script setup>
import { computed, onMounted } from 'vue'
import { useInspectionsStore } from '../stores/inspections.js'
import { SEVERITIES } from '../constants.js'
import { t } from '../i18n/index.js'

const store = useInspectionsStore()

const summary = computed(() => store.summary)

onMounted(() => store.refresh())
</script>

<template>
  <div class="page">
    <div class="page-toolbar">
      <h1>{{ t('summary.title') }}</h1>
    </div>

    <p v-if="store.offline" class="offline-note" role="status">
      {{ t('common.offlineNote') }}
    </p>

    <div class="totals-row">
      <div class="total-card total-open">
        <svg class="total-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span class="total-number">{{ summary.totals.Open }}</span>
        <span class="total-label">{{ t('status.Open') }}</span>
      </div>
      <div class="total-card total-resolved">
        <svg class="total-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <span class="total-number">{{ summary.totals.Resolved }}</span>
        <span class="total-label">{{ t('status.Resolved') }}</span>
      </div>
    </div>

    <table class="summary-table">
      <thead>
        <tr>
          <th>{{ t('summary.severity') }}</th>
          <th>{{ t('status.Open') }}</th>
          <th>{{ t('status.Resolved') }}</th>
          <th>{{ t('summary.total') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="sev in SEVERITIES" :key="sev">
          <td>
            <span class="chip" :class="`chip-${sev.toLowerCase()}`">
              {{ t(`severity.${sev}`) }}
            </span>
          </td>
          <td>{{ summary.by_severity[sev].Open }}</td>
          <td>{{ summary.by_severity[sev].Resolved }}</td>
          <td>{{ summary.by_severity[sev].Open + summary.by_severity[sev].Resolved }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
