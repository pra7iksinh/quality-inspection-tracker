<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { NetworkError } from '../api/http.js'
import { t } from '../i18n/index.js'

const auth = useAuthStore()
const router = useRouter()

const username = ref('supervisor')
const password = ref('Test105*')
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await auth.login(username.value.trim(), password.value)
    router.push({ name: 'inspections' })
  } catch (err) {
    error.value = err instanceof NetworkError ? t('login.errorOffline') : t('login.errorInvalid')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="login-wrap">
    <form class="login-card" @submit.prevent="submit">
      <img src="/arvind-logo.png" alt="Arvind Logo" class="login-logo" style="background: transparent; border-radius: 0; width: 240px; max-width: 100%; height: auto; object-fit: contain;" />
      <h1>{{ t('app.name') }}</h1>
      <p class="login-sub">{{ t('app.tagline') }}</p>

      <label class="field">
        <span>{{ t('login.username') }}</span>
        <input v-model="username" autocomplete="username" autocapitalize="none" required />
      </label>
      <label class="field">
        <span>{{ t('login.password') }}</span>
        <input v-model="password" type="password" autocomplete="current-password" required />
      </label>

      <p v-if="error" class="form-error" role="alert">{{ error }}</p>

      <button class="btn-primary" type="submit" :disabled="busy">
        {{ busy ? t('login.signingIn') : t('login.signIn') }}
      </button>


    </form>
  </div>
</template>
