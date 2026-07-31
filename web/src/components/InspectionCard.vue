<script setup>
import { t } from '../i18n/index.js'

defineProps({
  inspection: { type: Object, required: true },
})
defineEmits(['resolve'])

function formatDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
</script>

<template>
  <article class="card" :class="`card-${inspection.severity.toLowerCase()}`">
    <div class="card-head">
      <span class="machine">{{ inspection.machine_id }}</span>
      <span class="chip" :class="`chip-${inspection.severity.toLowerCase()}`">
        {{ t(`severity.${inspection.severity}`) }}
      </span>
    </div>

    <div class="card-meta">
      <span v-if="inspection.defect_type === 'Other' && inspection.custom_defect_type">
        {{ t('form.customDefectType') }}: {{ inspection.custom_defect_type }}
      </span>
      <span v-else>{{ t(`defectTypes.${inspection.defect_type}`) }}</span>
      <span class="dot-sep" aria-hidden="true">·</span>
      <span>{{ formatDate(inspection.inspection_date) }}</span>
      <span v-if="inspection.source === 'sap'" class="tag-sap">{{ t('card.sap') }}</span>
    </div>

    <p v-if="inspection.remarks" class="card-remarks">{{ inspection.remarks }}</p>

    <p v-if="inspection.status === 'Resolved'" class="card-resolution">
      <strong>{{ t('card.resolvedPrefix') }}</strong> {{ inspection.resolution_note }}
    </p>

    <div class="card-foot">
      <span v-if="inspection.pending" class="badge badge-pending">{{ t('card.waitingToSync') }}</span>
      <span v-else-if="inspection.status === 'Resolved'" class="badge badge-resolved">
        {{ t('status.Resolved') }}
      </span>
      <span v-else class="badge badge-open">{{ t('status.Open') }}</span>

      <button
        v-if="inspection.status === 'Open' && !inspection.pending"
        class="btn-outline"
        @click="$emit('resolve', inspection)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="icon-xs">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        {{ t('card.resolve') }}
      </button>
    </div>
  </article>
</template>
