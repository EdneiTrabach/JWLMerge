<template>
  <div v-if="mergedUrl" class="download">
    <a :href="mergedUrl" :download="downloadName || ''" class="download-link"
      >Abrir/baixar arquivo de merge</a
    >
  </div>
</template>

<script setup>
import { useMergeUI } from "../composables/useMergeUI";
const { mergedUrl, downloadName } = useMergeUI();
</script>

<style scoped>
.download {
  margin-top: 10px;
}
.download-link {
  display: inline-block;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  text-decoration: none;
  min-height: 44px;
}
@media (min-width: 768px) {
  .download-link {
    min-width: 180px;
  }
}
</style>
