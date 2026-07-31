<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: { type: String, required: true },
  options: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const selectRef = ref(null)

function toggle() {
  isOpen.value = !isOpen.value
}

function selectOption(val) {
  emit('update:modelValue', val)
  isOpen.value = false
}

function close(e) {
  if (selectRef.value && !selectRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', close))
onUnmounted(() => document.removeEventListener('click', close))
</script>

<template>
  <div class="custom-select" ref="selectRef">
    <button type="button" class="select-trigger" :class="{ 'is-open': isOpen }" @click="toggle">
      <span>{{ options.find(o => o.value === modelValue)?.label || modelValue }}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>
    
    <transition name="dropdown">
      <div v-if="isOpen" class="select-menu">
        <button
          v-for="opt in options"
          :key="opt.value"
          type="button"
          class="select-option"
          :class="{ 'is-selected': opt.value === modelValue }"
          @click="selectOption(opt.value)"
        >
          {{ opt.label }}
          <svg v-if="opt.value === modelValue" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="check-icon">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.custom-select {
  position: relative;
  width: 100%;
}

.select-trigger {
  width: 100%;
  min-height: 48px;
  padding: 10px 14px;
  font: inherit;
  color: var(--c-text);
  background: var(--c-surface);
  border: 1.5px solid var(--c-border);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.select-trigger:focus,
.select-trigger.is-open {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
  outline: none;
}

.chevron {
  width: 18px;
  height: 18px;
  color: var(--c-muted);
  transition: transform 0.2s ease;
}

.is-open .chevron {
  transform: rotate(180deg);
}

.select-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  z-index: 50;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.select-option {
  width: 100%;
  padding: 14px 16px;
  text-align: left;
  background: none;
  border: none;
  font: inherit;
  color: var(--c-text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background 0.15s;
}

.select-option:not(:last-child) {
  border-bottom: 1px solid var(--c-border);
}

.select-option:hover {
  background: var(--c-bg);
}

.select-option.is-selected {
  background: var(--c-open-bg);
  color: var(--c-primary);
  font-weight: 600;
}

.check-icon {
  width: 18px;
  height: 18px;
}

/* Vue transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
