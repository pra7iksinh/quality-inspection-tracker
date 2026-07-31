<script setup>
import { onMounted, ref } from 'vue'
import { useInspectionsStore } from '../stores/inspections.js'
import InspectionCard from '../components/InspectionCard.vue'
import FilterSheet from '../components/FilterSheet.vue'
import ResolveModal from '../components/ResolveModal.vue'
import { t } from '../i18n/index.js'

const store = useInspectionsStore()
const filtersOpen = ref(false)
const resolving = ref(null)

onMounted(() => store.refresh())
</script>

<template>
  <div class="page">
    <div class="page-toolbar">
      <h1>{{ t('list.title') }}</h1>
      <button class="btn-outline btn-filter" @click="filtersOpen = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="icon-sm">
          <path d="M3 6h18M6 12h12M9 18h6"/>
        </svg>
        {{ t('list.filterSort') }}
        <span v-if="store.activeFilterCount > 0" class="filter-count">
          {{ store.activeFilterCount }}
        </span>
      </button>
    </div>

    <p v-if="store.offline" class="offline-note" role="status">
      {{ t('common.offlineNote') }}
    </p>

    <div v-if="store.loading && store.visible.length === 0" class="empty-state">
      {{ t('common.loading') }}
    </div>

    <template v-else>
      <div v-if="store.visible.length === 0" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="1"/>
          <path d="M12 11v4M12 19h.01"/>
        </svg>
        <p>
          <strong>{{ t('list.emptyTitle') }}</strong>
        </p>
        <p v-if="store.activeFilterCount > 0">{{ t('list.emptyFiltered') }}</p>
        <p v-else>{{ t('list.emptyNoData') }}</p>
      </div>

      <InspectionCard
        v-for="item in store.visible"
        :key="item.id ?? item.client_id"
        :inspection="item"
        @resolve="resolving = $event"
      />
    </template>

    <FilterSheet :open="filtersOpen" @close="filtersOpen = false" />
    <ResolveModal v-if="resolving" :inspection="resolving" @close="resolving = null" />
  </div>
</template>
