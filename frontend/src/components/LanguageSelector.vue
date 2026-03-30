<template>
  <div class="language-selector">
    <label>{{ $t('language') }}:</label>
    <select v-model="current" @change="onChange">
      <option value="pt-BR">Português (PT-BR)</option>
      <option value="en">English</option>
      <option value="es">Español</option>
    </select>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const stored = localStorage.getItem('app.locale')
const current = ref(stored || locale.value || 'pt-BR')

// initialize
locale.value = current.value

function onChange() {
  locale.value = current.value
  try { localStorage.setItem('app.locale', current.value) } catch (_) {}
}
</script>

<style scoped>
.language-selector{
  display:flex;
  gap:8px;
  align-items:center;
  margin-bottom:8px;
}
select{padding:6px;border-radius:6px}
</style>
