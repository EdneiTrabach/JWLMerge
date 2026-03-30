<template>
  <div class="language-selector">
    <label>{{ $t('language') }}:</label>
    <select v-model="current" @change="onChange" class="select-page">
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
.select-page {
  width: auto;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #23313a;
  background: #071226;
  color: #e6eef8;
  -webkit-appearance: none;
  appearance: none;
}
.select-page option {
  background: #071226;
  color: #e6eef8;
}
</style>
