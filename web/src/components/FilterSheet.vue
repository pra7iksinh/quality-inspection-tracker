<script setup>
import { reactive, watch, onMounted, onUnmounted } from 'vue'
import { useInspectionsStore, EMPTY_FILTERS } from '../stores/inspections.js'
import { SEVERITIES, STATUSES } from '../constants.js'
import { t } from '../i18n/index.js'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close'])

const store = useInspectionsStore()

function onKeydown(e) {
  if (e.key === 'Escape' && props.open) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

const SORT_OPTIONS = [
  { key: 'newest', label: () => t('filters.newestFirst') },
  { key: 'oldest', label: () => t('filters.oldestFirst') },
  { key: 'severity', label: () => t('filters.bySeverity') },
]

const draft = reactive({ ...store.filters, sort: store.sort })

watch(
  () => props.open,
  (open) => {
    if (open) Object.assign(draft, { ...store.filters, sort: store.sort })
  }
)

function apply() {
  const { sort, ...filters } = draft
  store.filters = { ...filters }
  store.sort = sort
  emit('close')
}

function clearAll() {
  Object.assign(draft, { ...EMPTY_FILTERS, sort: 'newest' })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="sheet-backdrop" @click.self="emit('close')">
      <div class="sheet" role="dialog" :aria-label="t('filters.title')">
        <div class="sheet-handle" aria-hidden="true"></div>
        <h2>{{ t('filters.title') }}</h2>

        <fieldset class="chip-group">
          <legend>{{ t('filters.status') }}</legend>
          <button
            v-for="s in ['', ...STATUSES]"
            :key="`st-${s}`"
            type="button"
            class="chip-select"
            :class="{ 'chip-on': draft.status === s }"
            @click="draft.status = s"
          >
            {{ s === '' ? t('common.all') : t(`status.${s}`) }}
          </button>
        </fieldset>

        <fieldset class="chip-group">
          <legend>{{ t('filters.severity') }}</legend>
          <button
            v-for="s in ['', ...SEVERITIES]"
            :key="`sev-${s}`"
            type="button"
            class="chip-select"
            :class="{ 'chip-on': draft.severity === s }"
            @click="draft.severity = s"
          >
            {{ s === '' ? t('common.all') : t(`severity.${s}`) }}
          </button>
        </fieldset>

        <fieldset class="chip-group">
          <legend>{{ t('filters.dateRange') }}</legend>
          <div class="date-range">
            <label class="field field-inline">
              <span>{{ t('filters.from') }}</span>
              <input v-model="draft.from" type="date" :max="draft.to || undefined" />
            </label>
            <label class="field field-inline">
              <span>{{ t('filters.to') }}</span>
              <input v-model="draft.to" type="date" :min="draft.from || undefined" />
            </label>
          </div>
        </fieldset>

        <fieldset class="chip-group">
          <legend>{{ t('filters.sortBy') }}</legend>
          <button
            v-for="opt in SORT_OPTIONS"
            :key="opt.key"
            type="button"
            class="chip-select"
            :class="{ 'chip-on': draft.sort === opt.key }"
            @click="draft.sort = opt.key"
          >
            {{ opt.label() }}
          </button>
        </fieldset>

        <div class="sheet-actions">
          <button type="button" class="btn-ghost" @click="clearAll">
            {{ t('common.clearAll') }}
          </button>
          <button type="button" class="btn-primary" @click="apply">{{ t('common.apply') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
