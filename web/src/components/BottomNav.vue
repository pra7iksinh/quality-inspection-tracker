<script setup>
import { t } from '../i18n/index.js'
</script>

<template>
  <nav class="bottom-nav">
    <RouterLink :to="{ name: 'inspections' }" class="nav-item" exact-active-class="nav-active">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 6h16M4 12h16M4 18h10" stroke-linecap="round" />
      </svg>
      <span>{{ t('nav.inspections') }}</span>
    </RouterLink>
    <RouterLink :to="{ name: 'new' }" class="nav-item nav-item-primary" exact-active-class="nav-active">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14" stroke-linecap="round" />
      </svg>
      <span>{{ t('nav.logDefect') }}</span>
    </RouterLink>
    <RouterLink :to="{ name: 'summary' }" class="nav-item" exact-active-class="nav-active">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 20V10M12 20V4M19 20v-7" stroke-linecap="round" />
      </svg>
      <span>{{ t('nav.summary') }}</span>
    </RouterLink>
  </nav>
</template>
