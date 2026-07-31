<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth.js'
import { useInspectionsStore } from './stores/inspections.js'
import BottomNav from './components/BottomNav.vue'
import SyncBadge from './components/SyncBadge.vue'
import { toasts } from './composables/toast.js'
import { t } from './i18n/index.js'

const auth = useAuthStore()
const router = useRouter()
const authed = computed(() => auth.isAuthed)

function logout() {
  auth.logout()
  useInspectionsStore().$reset()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app">
    <header v-if="authed" class="topbar">
      <div class="topbar-title">
        <img src="/arvind-favicon.ico" alt="Arvind Logo" class="topbar-logo" style="background: white; border-radius: 4px; padding: 2px;" />
        {{ t('app.name') }}
      </div>
      <div class="topbar-actions">
        <SyncBadge />
        <button class="btn-ghost" @click="logout" :title="t('common.logout')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-sm">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {{ t('common.logout') }}
        </button>
      </div>
    </header>

    <main class="content" :class="{ 'content-authed': authed }">
      <RouterView />
    </main>

    <BottomNav v-if="authed" />

    <div class="toast-host" aria-live="polite">
      <div v-for="msg in toasts" :key="msg.id" class="toast" :class="`toast-${msg.kind}`">
        {{ msg.message }}
      </div>
    </div>
  </div>
</template>
