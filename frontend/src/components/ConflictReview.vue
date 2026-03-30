<template>
  <div class="review-root">
    <h3>Revisar escolhas antes do merge</h3>
    <p class="help">Revise cada conflito, edite manualmente o resultado se necessário e adicione uma anotação. Depois clique em "Confirmar e gerar merge".</p>

    <div v-for="(c, i) in allConflicts" :key="c.table + '::' + c.key" class="review-item">
      <div class="review-header"><strong>{{ c.table }}</strong> — {{ c.keyCol }}={{ c.key }}</div>
      <div class="review-body">
        <div class="review-col">
          <div class="col-title">Escolha atual:</div>
          <div class="current-pick">{{ currentPick(c) || 'nenhuma' }}</div>
        </div>
        <div class="review-col">
          <div class="col-title">Preview do valor escolhido:</div>
          <pre class="col-pre">{{ previewValue(c) }}</pre>
        </div>
        <div class="review-col edit">
          <label>Editar resultado (opcional)</label>
          <textarea v-model="edits[idFor(c)]" rows="3" />
          <label>Anotação (opcional)</label>
          <input v-model="notes[idFor(c)]" type="text" />
        </div>
      </div>
    </div>

    <div class="review-actions">
      <button class="btn" @click="$emit('cancel')">Cancelar</button>
      <button class="btn btn-primary" @click="confirm">Confirmar e gerar merge</button>
    </div>
  </div>
</template>

<script setup>
import { useMergeUI } from '../composables/useMergeUI'
import { ref, computed } from 'vue'
const { filteredConflicts, pagedConflicts, conflicts, choices, formatDiffValues, diffKeys, applyCustomChoices } = useMergeUI()

// We'll operate on the full filtered set so user's edits apply to all visible conflicts
const allConflicts = computed(() => filteredConflicts.value)

const edits = ref({})
const notes = ref({})

function idFor(c){ return `${c.table}::${c.key}` }

function currentPick(c){ const id = idFor(c); return choices && choices.value && choices.value[id] ? choices.value[id].pick : null }

function previewValue(c){ const pick = currentPick(c); const keys = diffKeys(c); if (pick === 'A') return formatDiffValues(c.a, keys); if (pick === 'B') return formatDiffValues(c.b, keys); return '{}'}

async function confirm(){
  const custom = []
  for (const c of allConflicts.value){
    const id = idFor(c)
    const pick = (choices && choices.value && choices.value[id]) ? choices.value[id].pick : 'A'
    const entry = { table: c.table, key: c.key, keyCol: c.keyCol, pick }
    if (edits.value[id]) entry.override = edits.value[id]
    if (notes.value[id]) entry.note = notes.value[id]
    custom.push(entry)
  }
  await applyCustomChoices(custom)
  // emit merged to parent to indicate merge generated
  // wait a tick for mergedUrl to be set in composable
  $emit('merged')
}
</script>

<style scoped>
.review-root{ padding:12px; max-height:60vh; overflow:auto }
.help{ color: rgba(230,238,248,0.7); margin-bottom:12px }
.review-item{ background:#07121a; padding:10px; border-radius:8px; margin-bottom:10px }
.review-header{ font-weight:700; color:#fff }
.review-body{ display:flex; gap:12px; flex-direction:column }
.review-col{ flex:1 }
.col-pre{ white-space:pre-wrap; background: #08121a; padding:8px; border-radius:6px; color:#e6eef8; font-size:12px }
.edit textarea{ width:100%; background:#07121a; color:#e6eef8; border:1px solid rgba(230,238,248,0.06); border-radius:6px }
.edit input{ width:100%; margin-top:6px; padding:6px; border-radius:6px; border:1px solid rgba(230,238,248,0.06); background:#07121a; color:#e6eef8 }
.review-actions{ display:flex; gap:8px; justify-content:flex-end; margin-top:12px }
.btn{ padding:8px 12px; border-radius:8px; background:#2b9ef3; color:#fff; border:none }
.btn-primary{ background: linear-gradient(135deg,#4fc3f7 0%,#2b9ef3 100%)}
</style>
