<template>
  <div v-if="conflicts.length" class="conflicts">
    <h3>Conflitos detectados ({{ conflicts.length }})</h3>
    <div class="filters">
      <!-- <label>Filtrar por tabela:</label>
      <select v-model="tableFilter" class="select-table">
        <option value="">(todas)</option>
        <option v-for="t in tablesAvailable" :key="t" :value="t">
          {{ t }}
        </option>
      </select> -->
      <label class="label-page">Por página:</label>
      <select v-model.number="perPage" class="select-page">
        <option :value="6">6</option>
        <option :value="12">12</option>
        <option :value="24">24</option>
      </select>
      <div class="filter-actions">
        <button
          class="btn-filter"
          :class="{ 'active-a': activeFilter === 'A' }"
          @click.prevent="pickAllWithActive('A')"
        >
          Manter A para todos
        </button>
        <button
          class="btn-filter"
          :class="{ 'active-b': activeFilter === 'B' }"
          @click.prevent="pickAllWithActive('B')"
        >
          Manter B para todos
        </button>
      </div>
    </div>

    <div
      v-for="(c, i) in pagedConflicts"
      :key="c.table + '::' + c.key"
      class="conflict-item"
    >
      <div class="conflict-header">
        <strong>{{ c.table }}</strong> — {{ c.keyCol }}={{ c.key }}
      </div>
      <div class="conflict-cols">
        <div class="conflict-col">
          <div class="col-title">A (diferenças abaixo):</div>
          <pre class="col-pre">{{ formatDiffValues(c.a, diffKeys(c)) }}</pre>
        </div>
        <div class="conflict-col">
          <div class="col-title">B (diferenças abaixo):</div>
          <pre class="col-pre">{{ formatDiffValues(c.b, diffKeys(c)) }}</pre>
        </div>
      </div>
      <div class="conflict-actions">
        <button
          class="btn-choose"
          :class="{ 'active-a': isPicked(c, 'A') }"
          @click.prevent="pickChoiceByIndex((page - 1) * perPage + i, 'A')"
        >
          Manter A
        </button>
        <button
          class="btn-choose"
          :class="{ 'active-b': isPicked(c, 'B') }"
          @click.prevent="pickChoiceByIndex((page - 1) * perPage + i, 'B')"
        >
          Manter B
        </button>
      </div>
    </div>

    <div class="pagination">
      <button @click.prevent="prevPage" :disabled="page <= 1">Prev</button>
      <div class="page-info">Página {{ page }} / {{ totalPages }}</div>
      <button @click.prevent="nextPage" :disabled="page >= totalPages">
        Next
      </button>
    </div>
  </div>
</template>

<script setup>
import { useMergeUI } from "../composables/useMergeUI";
import { ref, computed, watch } from "vue";
const {
  conflicts,
  tableFilter,
  tablesAvailable,
  perPage,
  pickAll,
  pagedConflicts,
  formatDiffValues,
  diffKeys,
  pickChoiceByIndex,
  choices,
  page,
  totalPages,
  prevPage,
  nextPage,
} = useMergeUI();

const activeFilter = ref(null);
function pickAllWithActive(choice) {
  pickAll(choice);
  // toggle: if already active, clear the active filter
  activeFilter.value = activeFilter.value === choice ? null : choice;
}

function isPicked(conflict, pick) {
  if (!conflict) return false;
  const id = `${conflict.table}::${conflict.key}`;
  return choices && choices.value && choices.value[id] && choices.value[id].pick === pick;
}

// Sync the filter active state with visible choices on the current page.
const visiblePicks = computed(() => {
  return pagedConflicts.value.map(c => {
    const id = `${c.table}::${c.key}`
    return choices && choices.value && choices.value[id] ? choices.value[id].pick : null
  })
})

watch(visiblePicks, (picks) => {
  if (!picks || picks.length === 0) { activeFilter.value = null; return }
  const allA = picks.every(p => p === 'A')
  const allB = picks.every(p => p === 'B')
  activeFilter.value = allA ? 'A' : (allB ? 'B' : null)
}, { immediate: true })
</script>

<style scoped>
.conflicts {
  margin-top: 14px;
}
.filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.filters label {
  font-weight: 600;
}
.select-table,
.select-page {
  width: 100%;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #e6e6ee;
}
.filter-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
}
.filter-actions button {
  min-height: 44px;
}

/* filter action buttons */
.btn-filter {
  padding: 8px 12px;
  border-radius: 10px;
  font-weight: 700;
  border: 0;
  cursor: pointer;
  color: #0b1220;
  background: #e6eef8;
  transition:
    transform 0.08s ease,
    box-shadow 0.12s ease,
    opacity 0.12s ease;
}
.btn-filter:active {
  background: linear-gradient(90deg,#ffb347 0%,#ff9e2a 100%);
  color: #081014;
  box-shadow: 0 10px 30px rgba(255,160,40,0.22), inset 0 -2px 6px rgba(0,0,0,0.12);
  opacity: 0.6;
  cursor: not-allowed;
  background: linear-gradient(90deg,#4fc3f7 0%,#2b9ef3 100%);
  color: #021826;
  box-shadow: 0 10px 30px rgba(40,150,240,0.18), inset 0 -2px 6px rgba(0,0,0,0.12);
  color: #111;
  box-shadow: 0 8px 20px rgba(255, 180, 60, 0.15);
}
.btn-filter.active-b {
  background: linear-gradient(90deg, #9be6ff 0%, #4fc3f7 100%);
  color: #04263a;
  box-shadow: 0 8px 20px rgba(79, 195, 247, 0.12);
}
.conflict-item {
  margin-bottom: 10px;
  padding: 8px;
  background: #0b1220;
  border-radius: 6px;
}
.conflict-header {
  font-weight: 700;
  color: #fff;
}
.conflict-cols {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
}
.conflict-col {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.col-title {
  font-size: 12px;
}
.col-pre {
  white-space: pre-wrap;
  font-size: 12px;
  color: #e6eef8;
  overflow-wrap: anywhere;
  word-break: break-word;
  max-width: 100%;
  overflow: auto;
}
.conflict-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
.conflict-actions button {
  min-height: 44px;
}

/* per-conflict choice buttons */
.btn-choose {
  padding: 8px 12px;
  border-radius: 10px;
  font-weight: 700;
  border: 0;
  cursor: pointer;
  background: #e6eef8;
  color: #071226;
  transition:
    box-shadow 0.12s ease,
    transform 0.08s ease;
}
.btn-choose:active {
  transform: translateY(1px);
}
.btn-choose:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-choose.active-a {
  background: linear-gradient(90deg,#ffb347 0%,#ff8f2a 100%);
  color: #081014;
  box-shadow: 0 8px 22px rgba(255,150,40,0.20), inset 0 -2px 6px rgba(0,0,0,0.14);
}
.btn-choose.active-b {
  background: linear-gradient(90deg,#62c8ff 0%,#2b9ef3 100%);
  color: #021826;
  box-shadow: 0 8px 22px rgba(40,150,240,0.14), inset 0 -2px 6px rgba(0,0,0,0.12);
}
.pagination {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
}
.page-info {
  flex: 1;
  text-align: center;
}

@media (min-width: 768px) {
  .filters {
    flex-direction: row;
    align-items: center;
  }
  .select-table,
  .select-page {
    width: auto;
  }
  .filter-actions {
    margin-left: auto;
  }
  .conflict-cols {
    flex-direction: row;
  }
  .conflict-actions {
    flex-direction: row;
  }
  .conflict-actions button {
    width: auto;
  }
  .filter-actions button {
    width: auto;
  }
}
</style>
