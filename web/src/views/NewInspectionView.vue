<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useInspectionsStore } from '../stores/inspections.js'
import CustomSelect from '../components/CustomSelect.vue'
import { toast } from '../composables/toast.js'
import { DEFECT_TYPES, SEVERITIES } from '../constants.js'
import { t } from '../i18n/index.js'

const router = useRouter()
const store = useInspectionsStore()

const today = new Date().toISOString().slice(0, 10)
const form = reactive({
  inspection_date: today,
  machine_id: '',
  defect_type: DEFECT_TYPES[0],
  custom_defect_type: '',
  severity: 'Major',
  remarks: '',
})
const busy = ref(false)
const error = ref('')
const vErrors = ref({})

function validate() {
  vErrors.value = {}
  let isValid = true

  if (!form.inspection_date) {
    vErrors.value.inspection_date = `${t('form.date')} is required`
    isValid = false
  } else if (form.inspection_date > today) {
    vErrors.value.inspection_date = 'Date cannot be in the future'
    isValid = false
  }

  const machineId = form.machine_id.trim()
  if (!machineId) {
    vErrors.value.machine_id = `${t('form.machineId')} is required`
    isValid = false
  } else if (machineId.length > 100) {
    vErrors.value.machine_id = 'Max 100 characters'
    isValid = false
  }

  if (form.defect_type === 'Other') {
    const customType = form.custom_defect_type.trim()
    if (!customType) {
      vErrors.value.custom_defect_type = `${t('form.customDefectType')} is required when Defect type is 'Other'`
      isValid = false
    } else if (customType.length > 100) {
      vErrors.value.custom_defect_type = 'Max 100 characters'
      isValid = false
    }
  }

  return isValid
}

async function submit() {
  if (!validate()) return

  error.value = ''
  busy.value = true
  try {
    const result = await store.create({
      ...form,
      custom_defect_type: form.defect_type === 'Other' ? form.custom_defect_type.trim() : null,
      machine_id: form.machine_id.trim(),
      remarks: form.remarks.trim() || null,
    })
    toast(
      result === 'queued' ? t('form.queuedToast') : t('form.savedToast'),
      result === 'queued' ? 'info' : 'success'
    )
    router.push({ name: 'inspections' })
  } catch (err) {
    error.value = err.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="page-toolbar">
      <h1>{{ t('form.title') }}</h1>
    </div>

    <form class="form-card" @submit.prevent="submit" novalidate>
      <label class="field" :class="{ 'has-error': vErrors.inspection_date }">
        <span>{{ t('form.date') }} <span class="req">*</span></span>
        <input v-model="form.inspection_date" type="date" :max="today" />
        <div v-if="vErrors.inspection_date" class="field-error">{{ vErrors.inspection_date }}</div>
      </label>

      <label class="field" :class="{ 'has-error': vErrors.machine_id }">
        <span>{{ t('form.machineId') }} <span class="req">*</span></span>
        <input
          v-model="form.machine_id"
          :placeholder="t('form.machinePlaceholder')"
          maxlength="100"
          autocapitalize="characters"
        />
        <div v-if="vErrors.machine_id" class="field-error">{{ vErrors.machine_id }}</div>
      </label>

      <label class="field">
        <span>{{ t('form.defectType') }} <span class="req">*</span></span>
        <CustomSelect
          v-model="form.defect_type"
          :options="DEFECT_TYPES.map(type => ({ value: type, label: t(`defectTypes.${type}`) }))"
        />
      </label>

      <label class="field" :class="{ 'has-error': vErrors.custom_defect_type }" v-if="form.defect_type === 'Other'">
        <span>{{ t('form.customDefectType') }} <span class="req">*</span></span>
        <input
          v-model="form.custom_defect_type"
          :placeholder="t('form.customDefectPlaceholder')"
          maxlength="100"
        />
        <div v-if="vErrors.custom_defect_type" class="field-error">{{ vErrors.custom_defect_type }}</div>
      </label>

      <fieldset class="field">
        <legend>{{ t('form.severity') }} <span class="req">*</span></legend>
        <div class="severity-picker">
          <button
            v-for="s in SEVERITIES"
            :key="s"
            type="button"
            class="severity-btn"
            :class="[`severity-${s.toLowerCase()}`, { 'severity-on': form.severity === s }]"
            @click="form.severity = s"
          >
            {{ t(`severity.${s}`) }}
          </button>
        </div>
      </fieldset>

      <label class="field">
        <span>{{ t('form.remarks') }} <em>{{ t('common.optional') }}</em></span>
        <textarea
          v-model="form.remarks"
          rows="3"
          :placeholder="t('form.remarksPlaceholder')"
        ></textarea>
      </label>

      <p v-if="error" class="form-error" role="alert">{{ error }}</p>

      <button class="btn-primary" type="submit" :disabled="busy">
        {{ busy ? t('common.saving') : t('form.save') }}
      </button>
    </form>
  </div>
</template>
