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
          <div
            class="col-pre"
            v-html="renderDiffColumn(c.a, c.b, diffKeys(c), 'A')"
          ></div>
        </div>
        <div class="conflict-col">
          <div class="col-title">{{ $t("conflicts.colBTitle") }}</div>
          <div
            class="col-pre"
            v-html="renderDiffColumn(c.b, c.a, diffKeys(c), 'B')"
          ></div>
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
        <button class="btn-choose btn-edit" @click.prevent="toggleEditing(c)">
          {{ isEditing(c) ? "Fechar editor" : "Editar" }}
        </button>
      </div>

      <div class="conflict-result">
        <div v-if="hasChoice(c)" class="result-preview">
          <div class="result-title">{{ $t("conflicts.resultPreview") }}</div>
          <div class="col-pre" v-html="renderPreviewFor(c)"></div>
        </div>
        <div v-if="isEditing(c)" class="result-edit">
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
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M15 18l-6-6 6-6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
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
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M9 6l6 6-6 6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useMergeUI } from "../composables/useMergeUI";
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
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
const { t } = useI18n();
const editing = ref({});
function toggleEditing(conflict) {
  const id = idFor(conflict);
  editing.value[id] = !editing.value[id];
}
function isEditing(conflict) {
  return !!editing.value[idFor(conflict)];
}
function hasChoice(conflict) {
  const id = idFor(conflict);
  return !!(choices && choices.value && choices.value[id]);
}
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

// --- Diff rendering helpers (inline word diff using LCS) ---
function safeStr(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch (e) {
      return String(v);
    }
  }
  try {
    return String(v);
  } catch (e) {
    return "";
  }
}

function tokenize(s) {
  return String(s)
    .split(/(\s+)/)
    .filter((t) => t.length > 0);
}

function lcs(a, b) {
  const m = a.length,
    n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; --i) {
    for (let j = n - 1; j >= 0; --j) {
      if (a[i] === b[j]) dp[i][j] = 1 + dp[i + 1][j + 1];
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  // backtrack
  const seq = [];
  let i = 0,
    j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      seq.push(a[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return seq;
}

function inlineDiffHtml(aStr, bStr, side) {
  const aTok = tokenize(aStr);
  const bTok = tokenize(bStr);
  const common = lcs(aTok, bTok);
  const out = [];
  let ic = 0;
  if (side === "A") {
    for (let i = 0; i < aTok.length; i++) {
      const tok = aTok[i];
      if (ic < common.length && tok === common[ic]) {
        out.push(escapeHtml(tok));
        ic++;
      } else {
        out.push(`<span class="diff-del">${escapeHtml(tok)}</span>`);
      }
    }
  } else {
    for (let i = 0; i < bTok.length; i++) {
      const tok = bTok[i];
      if (ic < common.length && tok === common[ic]) {
        out.push(escapeHtml(tok));
        ic++;
      } else {
        out.push(`<span class="diff-ins">${escapeHtml(tok)}</span>`);
      }
    }
  }
  return out.join("");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// generic field extractor reused by preview and diff rendering
function getFieldValue(o, k) {
  if (o === null || o === undefined) return "";
  // primitive types
  if (typeof o === "string" || typeof o === "number" || typeof o === "boolean")
    return o;
  try {
    if (Array.isArray(o)) {
      const first = o.find((x) => x !== null && x !== undefined);
      return getFieldValue(first, k) || JSON.stringify(o);
    }
    if (Object.prototype.hasOwnProperty.call(o, k)) return o[k];
    const prefer = [
      "Text",
      "text",
      "Content",
      "content",
      "Value",
      "value",
      "Display",
      "display",
    ];
    for (const p of prefer)
      if (Object.prototype.hasOwnProperty.call(o, p)) return o[p];
    const lk = k && String(k).toLowerCase();
    for (const prop of Object.keys(o))
      if (prop.toLowerCase() === lk) return o[prop];
    const props = Object.keys(o);
    if (props.length === 1) {
      const v = o[props[0]];
      if (
        typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean"
      )
        return v;
    }
    if (typeof o.toString === "function") {
      const s = o.toString();
      if (s && s !== "[object Object]") return s;
    }
    return JSON.stringify(o);
  } catch (e) {
    return "";
  }
}

// set a value into an object preserving its structure when possible
function setFieldValue(o, k, newVal) {
  if (o === null || o === undefined) return o;
  // primitives -> return the new primitive value
  if (typeof o === "string" || typeof o === "number" || typeof o === "boolean") return newVal;
  try {
    if (Array.isArray(o)) {
      const idx = o.findIndex((x) => x !== null && x !== undefined);
      const clone = o.slice();
      if (idx >= 0) clone[idx] = setFieldValue(clone[idx], k, newVal);
      return clone;
    }
    const clone = Object.assign({}, o);
    if (Object.prototype.hasOwnProperty.call(clone, k)) {
      clone[k] = newVal;
      return clone;
    }
    const prefer = [
      "Text",
      "text",
      "Content",
      "content",
      "Value",
      "value",
      "Display",
      "display",
      "Note",
      "NoteContent",
    ];
    for (const p of prefer) if (Object.prototype.hasOwnProperty.call(clone, p)) {
      clone[p] = newVal;
      return clone;
    }
    const lk = k && String(k).toLowerCase();
    for (const prop of Object.keys(clone)) if (prop.toLowerCase() === lk) {
      clone[prop] = newVal;
      return clone;
    }
    const props = Object.keys(clone);
    if (props.length === 1) {
      const v = clone[props[0]];
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        clone[props[0]] = newVal;
        return clone;
      }
    }
    // fallback: if can't find suitable primitive, attempt to set top-level key (least invasive)
    if (!Object.prototype.hasOwnProperty.call(clone, k)) clone[k] = newVal;
    return clone;
  } catch (e) {
    return o;
  }
}

function renderDiffColumn(obj, otherObj, keys, side) {
  if (!keys || keys.length === 0) return '<div class="diff-empty">(no differing fields)</div>';
  const lines = [];

  for (const k of keys) {
    const val = safeStr(getFieldValue(obj ? obj : {}, k));
    const otherVal = safeStr(getFieldValue(otherObj ? otherObj : {}, k));
    // if both empty
    if (!val && !otherVal) continue;
    // if values equal, print plain (show the active column value)
    if (val === otherVal) {
      const labelKey = `fields.${k}`;
      let label = t(labelKey);
      if (!label || label === labelKey) label = k;
      lines.push(
        `<div class="diff-line"><strong>${escapeHtml(label)}</strong>: ${escapeHtml(val)}</div>`,
      );
      continue;
    }

    // special-case: ISO timestamps or whitespace-only — show the active column's raw value
    const isoRe = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    const onlyWhitespace = /^\s*$/;
    let html = "";
    if (isoRe.test(val) || isoRe.test(otherVal)) {
      // show the active column value with appropriate highlight
      html =
        side === "A"
          ? `<span class="diff-del">${escapeHtml(val)}</span>`
          : `<span class="diff-ins">${escapeHtml(val)}</span>`;
    } else if (onlyWhitespace.test(val) || onlyWhitespace.test(otherVal)) {
      // render visible marker for whitespace on the active column
      html = onlyWhitespace.test(val)
        ? '<em class="diff-empty">(empty)</em>'
        : escapeHtml(val);
    } else {
      // otherwise compute inline diff where aStr is active column, bStr is other column
      html = inlineDiffHtml(val, otherVal, side);
    }

    const labelKey = `fields.${k}`;
    let label = t(labelKey);
    if (!label || label === labelKey) label = k;
    lines.push(
      `<div class="diff-line"><strong>${escapeHtml(label)}</strong>: ${html}</div>`,
    );
  }
  return `<div class="diff-block">${lines.join("")}</div>`;
}

function renderPreviewHtml(obj, keys) {
  if (!keys || keys.length === 0) return '<div class="diff-empty">(no differing fields)</div>';
  const lines = [];
  for (const k of keys) {
    const v = safeStr(getFieldValue(obj ? obj : {}, k));
    if (!v) continue;
    const labelKey = `fields.${k}`;
    let label = t(labelKey);
    if (!label || label === labelKey) label = k;
    lines.push(`<div class="diff-line"><strong>${escapeHtml(label)}</strong>: ${escapeHtml(v)}</div>`);
  }
  return `<div class="diff-block">${lines.join("")}</div>`;
}

function renderPreviewFor(conflict) {
  const id = idFor(conflict);
  const ch = choices && choices.value && choices.value[id];
  const keys = diffKeys(conflict);
  const pick = ch && ch.pick ? ch.pick : "A";
  const base = pick === "A" ? conflict.a : conflict.b;

  if (ch && ch.override) {
    // apply override into a clone of the chosen object, preserving structure
    const targetKeys = keys && keys.length ? keys : Object.keys(base || {});
    // choose the most likely key to replace
    let targetKey = null;
    if (targetKeys.length === 1) targetKey = targetKeys[0];
    else {
      const prefer = ["Text", "text", "Content", "content", "Value", "value", "Note", "NoteContent", "Display", "display"];
      for (const p of prefer) if (targetKeys.includes(p)) { targetKey = p; break; }
      if (!targetKey) targetKey = targetKeys.find((x) => true);
    }

    const updated = setFieldValue(base, targetKey, ch.override);
    // update LastModified fields if present or add one
    const iso = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    let updatedClone = updated;
    try {
      // if LastModified is an object with TimeLastModified
      if (updatedClone && typeof updatedClone === "object") {
        if (Object.prototype.hasOwnProperty.call(updatedClone, "LastModified")) {
          if (updatedClone.LastModified && typeof updatedClone.LastModified === "object" && Object.prototype.hasOwnProperty.call(updatedClone.LastModified, "TimeLastModified")) {
            updatedClone = Object.assign({}, updatedClone);
            updatedClone.LastModified = Object.assign({}, updatedClone.LastModified);
            updatedClone.LastModified.TimeLastModified = iso;
          } else {
            updatedClone = Object.assign({}, updatedClone);
            updatedClone.LastModified = iso;
          }
        } else if (Object.prototype.hasOwnProperty.call(updatedClone, "TimeLastModified")) {
          updatedClone = Object.assign({}, updatedClone);
          updatedClone.TimeLastModified = iso;
        } else {
          // add LastModified if none exists
          updatedClone = Object.assign({}, updatedClone);
          updatedClone.LastModified = iso;
        }
      }
    } catch (e) {
      // ignore
    }

    return renderPreviewHtml(updatedClone, keys);
  }

  if (pick === "A") return renderPreviewHtml(conflict.a, keys);
  if (pick === "B") return renderPreviewHtml(conflict.b, keys);
  return '<div class="diff-empty">(no choice)</div>';
}

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

/* diff highlights */
.diff-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.diff-line {
  font-size: 12px;
  color: #e6eef8;
}
.diff-line strong {
  display: inline-block;
  width: 160px;
  color: #9fb3c3;
}
.diff-ins {
  background: rgba(34, 197, 94, 0.12);
  color: #c8ffd6;
  padding: 0 4px;
  border-radius: 4px;
}
.diff-del {
  background: rgba(255, 80, 80, 0.12);
  color: #ffd6d6;
  padding: 0 4px;
  border-radius: 4px;
}
.diff-empty {
  color: #9fb3c3;
  font-style: italic;
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
