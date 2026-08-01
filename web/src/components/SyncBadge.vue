<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useInspectionsStore } from '../stores/inspections.js'
import { flushOutbox } from '../offline/sync.js'
import { t } from '../i18n/index.js'

const store = useInspectionsStore()
const online = ref(navigator.onLine)

const setOnline = () => (online.value = true)
const setOffline = () => (online.value = false)

onMounted(() => {
  window.addEventListener('online', setOnline)
  window.addEventListener('offline', setOffline)
})
onUnmounted(() => {
  window.removeEventListener('online', setOnline)
  window.removeEventListener('offline', setOffline)
})

const pendingCount = computed(() => store.pending.length)
</script>

<template>
  <button
    v-if="!online || pendingCount > 0"
    class="sync-badge"
    :class="online ? 'sync-pending' : 'sync-offline'"
    @click="flushOutbox"
  >
    <span class="sync-dot" aria-hidden="true"></span>
    <template v-if="!online">{{ t('sync.offline') }}</template>
    <template v-else>{{ t('sync.toSync', { count: pendingCount }) }}</template>
  </button>
</template>
