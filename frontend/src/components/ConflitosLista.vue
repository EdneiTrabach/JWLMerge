<template>
  <div v-if="conflicts.length" class="conflicts">
    <h3>{{ $t("conflicts.detected", { count: conflicts.length }) }}</h3>
    <div class="filters">
      <!-- <label>Filtrar por tabela:</label>
      <select v-model="tableFilter" class="select-table">
        <option value="">(todas)</option>
        <option v-for="t in tablesAvailable" :key="t" :value="t">
          {{ t }}
        </option>
      </select> -->
      <label class="label-page">{{ $t("conflicts.perPageLabel") }}</label>
      <select v-model.number="perPage" class="select-page">
        <option :value="6">20</option>
        <option :value="12">40</option>
        <option :value="24">100</option>
      </select>
      <div class="filter-actions">
        <button
          class="btn-filter"
          :class="{ 'active-a': activeFilter === 'A' }"
          @click.prevent="pickAllWithActive('A')"
        >
          {{ $t("conflicts.keepAllA") }}
        </button>
        <button
          class="btn-filter"
          :class="{ 'active-b': activeFilter === 'B' }"
          @click.prevent="pickAllWithActive('B')"
        >
          {{ $t("conflicts.keepAllB") }}
        </button>
      </div>
    </div>

    <div
      v-for="(c, i) in pagedConflicts"
      :key="c.table + '::' + c.key"
      class="conflict-item"
    >
      <div class="conflict-header">
        <strong>{{ c.table }}</strong> — {{ displayName(c) }}
      </div>
      <div class="conflict-cols">
        <div class="conflict-col">
          <div class="col-title">{{ $t("conflicts.colATitle") }}</div>
          <pre class="col-pre">{{ formatDiffValues(c.a, diffKeys(c)) }}</pre>
        </div>
        <div class="conflict-col">
          <div class="col-title">{{ $t("conflicts.colBTitle") }}</div>
          <pre class="col-pre">{{ formatDiffValues(c.b, diffKeys(c)) }}</pre>
        </div>
      </div>
      <div class="conflict-actions">
        <button
          class="btn-choose"
          :class="{ 'active-a': isPicked(c, 'A') }"
          @click.prevent="pickChoiceByIndex((page - 1) * perPage + i, 'A')"
        >
          {{ $t("conflicts.keepA") }}
        </button>
        <button
          class="btn-choose"
          :class="{ 'active-b': isPicked(c, 'B') }"
          @click.prevent="pickChoiceByIndex((page - 1) * perPage + i, 'B')"
        >
          {{ $t("conflicts.keepB") }}
        </button>
      </div>

      <div class="conflict-result">
        <div class="result-preview">
          <div class="result-title">{{ $t("conflicts.resultPreview") }}</div>
          <pre class="col-pre">{{ previewFor(c) }}</pre>
        </div>
        <div class="result-edit">
          <label class="col-title">{{ $t("conflicts.editResult") }}</label>
          <textarea
            :value="getOverride(c)"
            @input="onEdit($event.target.value, c)"
            rows="4"
          />
        </div>
      </div>
    </div>

    <div class="pagination">
      <button
        class="btn-page prev"
        @click.prevent="prevPage"
        :disabled="page <= 1"
        :aria-disabled="page <= 1"
        aria-label="previous"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>{{ $t("pagination.prev") }}</span>
      </button>

      <div class="page-info">
        {{ $t("pagination.pageInfo", { page: page, total: totalPages }) }}
      </div>

      <button
        class="btn-page next"
        @click.prevent="nextPage"
        :disabled="page >= totalPages"
        :aria-disabled="page >= totalPages"
        aria-label="next"
      >
        <span>{{ $t("pagination.next") }}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
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
  return (
    choices &&
    choices.value &&
    choices.value[id] &&
    choices.value[id].pick === pick
  );
}

function idFor(conflict) {
  return `${conflict.table}::${conflict.key}`;
}

function truncateText(s, max = 80) {
  if (s == null) return "";
  const str = String(s)
    .replace(/\r?\n+/g, " ")
    .trim();
  return str.length > max ? str.slice(0, max) + "..." : str;
}

function displayName(conflict) {
  if (!conflict) return "";
  const a = conflict.a || {};
  const b = conflict.b || {};
  const candidates = [
    "Title",
    "NoteTitle",
    "Note",
    "Content",
    "NoteContent",
    "ChapterAndVerseString",
    "BookNameChapterAndVerseString",
    "PubSymbol",
    "Name",
    "Label",
  ];
  for (const k of candidates) {
    const v = a[k] ?? b[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return truncateText(v);
    }
  }
  // fallback to key column/value if no descriptive field found
  return `${conflict.keyCol}=${conflict.key}`;
}

function getOverride(conflict) {
  const id = idFor(conflict);
  return choices && choices.value && choices.value[id]
    ? choices.value[id].override || ""
    : "";
}

function onEdit(text, conflict) {
  const id = idFor(conflict);
  if (!choices.value[id]) {
    // ensure there's an entry so apply later includes this edit; default pick to 'A'
    choices.value[id] = {
      table: conflict.table,
      key: conflict.key,
      keyCol: conflict.keyCol,
      pick: "A",
    };
  }
  choices.value[id].override = text;
}

function previewFor(conflict) {
  const id = idFor(conflict);
  const ch = choices && choices.value && choices.value[id];
  if (ch && ch.override) return ch.override;
  const pick = ch && ch.pick ? ch.pick : null;
  const keys = diffKeys(conflict);
  if (pick === "A") return formatDiffValues(conflict.a, keys);
  if (pick === "B") return formatDiffValues(conflict.b, keys);
  return "{}";
}

// Sync the filter active state with visible choices on the current page.
const visiblePicks = computed(() => {
  return pagedConflicts.value.map((c) => {
    const id = `${c.table}::${c.key}`;
    return choices && choices.value && choices.value[id]
      ? choices.value[id].pick
      : null;
  });
});

watch(
  visiblePicks,
  (picks) => {
    if (!picks || picks.length === 0) {
      activeFilter.value = null;
      return;
    }
    const allA = picks.every((p) => p === "A");
    const allB = picks.every((p) => p === "B");
    activeFilter.value = allA ? "A" : allB ? "B" : null;
  },
  { immediate: true },
);
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
  border: 1px solid #23313a;
  background: #071226;
  color: #e6eef8;
  -webkit-appearance: none;
  appearance: none;
}
.select-page option,
.select-table option {
  background: #071226;
  color: #e6eef8;
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
  background: linear-gradient(90deg, #ffb347 0%, #ff9e2a 100%);
  color: #081014;
  box-shadow:
    0 10px 30px rgba(255, 160, 40, 0.22),
    inset 0 -2px 6px rgba(0, 0, 0, 0.12);
  opacity: 0.6;
  cursor: not-allowed;
  background: linear-gradient(90deg, #4fc3f7 0%, #2b9ef3 100%);
  color: #021826;
  box-shadow:
    0 10px 30px rgba(40, 150, 240, 0.18),
    inset 0 -2px 6px rgba(0, 0, 0, 0.12);
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
  background: linear-gradient(90deg, #ffb347 0%, #ff8f2a 100%);
  color: #081014;
  box-shadow:
    0 8px 22px rgba(255, 150, 40, 0.2),
    inset 0 -2px 6px rgba(0, 0, 0, 0.14);
}
.btn-choose.active-b {
  background: linear-gradient(90deg, #62c8ff 0%, #2b9ef3 100%);
  color: #021826;
  box-shadow:
    0 8px 22px rgba(40, 150, 240, 0.14),
    inset 0 -2px 6px rgba(0, 0, 0, 0.12);
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

/* styled pagination buttons */
.btn-page {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 0;
  font-weight: 700;
  cursor: pointer;
  color: #fff;
  min-width: 84px;
}
.btn-page svg {
  display: block;
  color: #fff;
}
.btn-page.prev {
  background: linear-gradient(90deg, #ffb347 0%, #ff8f2a 100%);
}
.btn-page.next {
  background: linear-gradient(90deg, #62c8ff 0%, #2b9ef3 100%);
}
.btn-page:disabled,
.btn-page[aria-disabled="true"] {
  opacity: 0.45;
  cursor: not-allowed;
  filter: grayscale(0.15);
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
