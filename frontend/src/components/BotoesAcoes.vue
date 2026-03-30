<template>
  <div class="actions">
    <!-- <button @click="inspectLocal" :disabled="!fileA && !fileB">
      Inspecionar
    </button>
    <button @click="mergeLocal" :disabled="!fileA || !fileB">
      Mesclar local
    </button>
    <button @click="mergeLocalFull('A')" :disabled="!fileA || !fileB">
      Mesclar tudo no front (A)
    </button> -->
    <button class="btn btn-primary" @click="detectAndShowConflicts" :disabled="!fileA || !fileB">
      Detectar conflitos
    </button>
    <button class="btn btn-accent" @click="applyChoicesAndMerge" :disabled="!conflicts.length">
      Aplicar escolhas e mesclar
    </button>
    <!-- <button @click="downloadMerged" :disabled="!mergedUrl">Baixar merge</button> -->
  </div>
</template>

<script setup>
import { useMergeUI } from "../composables/useMergeUI";
const {
  fileA,
  fileB,
  mergedUrl,
  conflicts,
  inspectLocal,
  mergeServer,
  mergeLocal,
  mergeLocalFull,
  detectAndShowConflicts,
  applyChoicesAndMerge,
  downloadMerged,
} = useMergeUI();
</script>

<style scoped>
.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}
.actions button {
  width: 100%;
}

/* modern button styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: transform .08s ease, box-shadow .12s ease, opacity .12s ease;
  box-shadow: 0 6px 18px rgba(2,6,23,0.35);
  color: #fff;
}
.btn:active{ transform: translateY(1px) }
.btn:disabled{ opacity: .55; cursor: not-allowed; box-shadow: none }

.btn-primary{
  background: linear-gradient(135deg,#4fc3f7 0%,#2b9ef3 100%);
  box-shadow: 0 10px 26px rgba(40,150,240,0.18);
}
.btn-accent{
  background: linear-gradient(135deg,#ffb347 0%,#ff8f2a 100%);
  box-shadow: 0 10px 26px rgba(255,150,40,0.18);
}

@media (min-width: 768px) {
  .actions {
    flex-direction: row;
  }
  .actions button {
    width: auto;
  }
}
</style>
