<template>
  <div v-if="conflicts.length" class="conflicts">
    <h3>Conflitos detectados ({{ conflicts.length }})</h3>
    <div class="filters">
      <label>Filtrar por tabela:</label>
      <select v-model="tableFilter" class="select-table">
        <option value="">(todas)</option>
        <option v-for="t in tablesAvailable" :key="t" :value="t">
          {{ t }}
        </option>
      </select>
      <label class="label-page">Por página:</label>
      <select v-model.number="perPage" class="select-page">
        <option :value="6">6</option>
        <option :value="12">12</option>
        <option :value="24">24</option>
      </select>
      <div class="filter-actions">
        <button @click.prevent="pickAll('A')">Manter A para todos</button>
        <button @click.prevent="pickAll('B')">Manter B para todos</button>
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
          @click.prevent="pickChoiceByIndex((page - 1) * perPage + i, 'A')"
        >
          Manter A
        </button>
        <button
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
  page,
  totalPages,
  prevPage,
  nextPage,
} = useMergeUI();
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
}
.col-title {
  font-size: 12px;
}
.col-pre {
  white-space: pre-wrap;
  font-size: 12px;
  color: #e6eef8;
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
