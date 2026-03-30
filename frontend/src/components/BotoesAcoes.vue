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
    <button class="btn btn-accent" @click="onApply" :disabled="!conflicts.length">
      Aplicar escolhas e mesclar
    </button>
    
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <ConflictReview v-if="showReview" @merged="onMerged" @cancel="showModal=false" />
        <div v-else class="modal-result">
          <h3>Parabéns — Merge gerado!</h3>
          <p>Seu arquivo de backup foi gerado com sucesso. Clique no botão abaixo para baixar e siga as instruções para instalar no JW Library.</p>
          <a :href="mergedUrl" :download="downloadName || ''" class="download-btn">Baixar backup</a>
          <button class="modal-close" @click="showModal = false">Fechar</button>
        </div>
      </div>
    </div>
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

import { ref } from 'vue'

const showModal = ref(false)
const showReview = ref(true)

import ConflictReview from './ConflictReview.vue'

function onMerged(){
  // after merged, show result content
  showReview.value = false
}

async function onApply() {
  // open review modal so user can edit per-conflict before final merge
  showReview.value = true
  showModal.value = true
}
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

/* modal */
.modal-overlay{
  position: fixed;
  inset: 0;
  display:flex;
  align-items:center;
  justify-content:center;
  background: rgba(2,6,23,0.6);
  z-index: 1200;
}
.modal{
  background: #09121a;
  color: #e6eef8;
  padding: 20px;
  border-radius: 12px;
  max-width: 520px;
  width: calc(100% - 40px);
  box-shadow: 0 14px 40px rgba(2,6,23,0.6);
  text-align: center;
}
.modal h3{ margin-top:0 }
.download-btn{
  display:inline-block;
  margin:12px 0;
  padding:10px 14px;
  background: linear-gradient(135deg,#ffb347 0%,#ff8f2a 100%);
  color:#081014;
  border-radius:10px;
  text-decoration:none;
  font-weight:700;
}
.modal-close{
  display:inline-block;
  margin-left:8px;
  background:transparent;
  color:#e6eef8;
  border:1px solid rgba(230,238,248,0.08);
  padding:8px 12px;
  border-radius:8px;
  cursor:pointer;
}
</style>
