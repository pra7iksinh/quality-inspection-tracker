<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useInspectionsStore } from '../stores/inspections.js'
import { NetworkError } from '../api/http.js'
import { toast } from '../composables/toast.js'
import { t } from '../i18n/index.js'

const props = defineProps({
  inspection: { type: Object, required: true },
})
const emit = defineEmits(['close'])

const store = useInspectionsStore()
const note = ref('')
const busy = ref(false)
const error = ref('')
const online = ref(navigator.onLine)

const setOnline = () => (online.value = true)
const setOffline = () => (online.value = false)
function onKeydown(e) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => {
  window.addEventListener('online', setOnline)
  window.addEventListener('offline', setOffline)
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  window.removeEventListener('online', setOnline)
  window.removeEventListener('offline', setOffline)
  window.removeEventListener('keydown', onKeydown)
})

const canSubmit = computed(() => note.value.trim().length > 0 && !busy.value && online.value)

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await store.resolve(props.inspection.id, note.value.trim())
    toast(t('resolve.successToast'), 'success')
    emit('close')
  } catch (err) {
    error.value = err instanceof NetworkError ? t('resolve.offlineError') : err.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="sheet-backdrop" @click.self="emit('close')">
      <div class="sheet" role="dialog" :aria-label="t('resolve.title')">
        <div class="sheet-handle" aria-hidden="true"></div>
        <h2>{{ t('resolve.title') }}</h2>
        <p class="sheet-context">
          {{ inspection.machine_id }} - {{ t(`defectTypes.${inspection.defect_type}`) }}
          <span class="chip" :class="`chip-${inspection.severity.toLowerCase()}`">
            {{ t(`severity.${inspection.severity}`) }}
          </span>
        </p>

        <label class="field">
          <span>{{ t('resolve.noteLabel') }} <em>{{ t('common.required') }}</em></span>
          <textarea
            v-model="note"
            rows="3"
            :placeholder="t('resolve.notePlaceholder')"
            autofocus
          ></textarea>
        </label>

        <p v-if="!online" class="form-error" role="alert">{{ t('resolve.offlineError') }}</p>
        <p v-else-if="error" class="form-error" role="alert">{{ error }}</p>

        <div class="sheet-actions">
          <button type="button" class="btn-ghost" @click="emit('close')">
            {{ t('common.cancel') }}
          </button>
          <button type="button" class="btn-primary" :disabled="!canSubmit" @click="submit">
            {{ busy ? t('common.saving') : t('resolve.markResolved') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
