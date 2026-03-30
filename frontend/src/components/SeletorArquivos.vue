<template>
  <div>
    <div class="row">
      <label>Arquivo A (.jwlibrary)</label>
      <input
        type="file"
        @change="onFileA"
        accept=".jwlibrary"
        class="file-input"
      />
    </div>
    <div class="row">
      <label>Arquivo B (.jwlibrary)</label>
      <input
        type="file"
        @change="onFileB"
        accept=".jwlibrary"
        class="file-input"
      />
    </div>
  </div>
</template>

<script setup>
import { useMergeUI } from "../composables/useMergeUI";
const { onFileA, onFileB } = useMergeUI();
</script>

<style scoped>
.row {
  margin-bottom: 12px;
}
.file-input {
  width: 100%;
}
</style>
