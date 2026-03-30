<template>
  <div class="review-root">
    <h3>{{ t("modal.successTitle") }}</h3>
    <p class="help">{{ t("modal.successBody") }}</p>

    <div class="review-item" style="padding: 12px">
      <div class="col-pre">
        {{ t("modal.fileLabel") }}:
        <strong>{{ downloadName || t("modal.unknownName") }}</strong>
      </div>

      <div style="margin-top: 8px; display: flex; gap: 8px">
        <a
          :href="downloadHref || '#'
          "
          :download="downloadName || ''"
          class="btn btn-primary"
          :class="{ 'btn-disabled': !downloadHref }"
          rel="noreferrer noopener"
        >
          {{ applying ? t('modal.generating') : t("modal.downloadButton") }}
        </a>

        <button class="btn" @click.prevent="$emit('cancel')">
          {{ t("modal.close") }}
        </button>
      </div>

      <div style="margin-top: 12px; color: #e6eef8">
        <h4 style="margin: 6px 0">{{ t("modal.restoreTitle") }}</h4>
        <ol style="margin: 6px 0 12px 18px">
          <li>{{ t("modal.restore1") }}</li>
          <li>{{ t("modal.restore2") }}</li>
          <li>{{ t("modal.restore3") }}</li>
          <li>{{ t("modal.restore4") }}</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMergeUI } from "../composables/useMergeUI";
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";

const {
  filteredConflicts,
  pagedConflicts,
  conflicts,
  choices,
  formatDiffValues,
  diffKeys,
  applyCustomChoices,
  mergedUrl,
  downloadName,
  downloadMerged,
} = useMergeUI();

const completed = ref(false);
const applying = ref(false);
const { t } = useI18n();

const downloadHref = computed(() => (mergedUrl && mergedUrl.value ? mergedUrl.value : ""));

// We'll operate on the full filtered set so user's edits apply to all visible conflicts
const allConflicts = computed(() => filteredConflicts.value);

const edits = ref({});
const notes = ref({});

function idFor(c) {
  return `${c.table}::${c.key}`;
}

function currentPick(c) {
  const id = idFor(c);
  return choices && choices.value && choices.value[id] ? choices.value[id].pick : null;
}

function previewValue(c) {
  const pick = currentPick(c);
  const keys = diffKeys(c);
  if (pick === "A") return formatDiffValues(c.a, keys);
  if (pick === "B") return formatDiffValues(c.b, keys);
  return "{}";
}

async function confirm() {
  const custom = [];
  for (const c of allConflicts.value) {
    const id = idFor(c);
    const pick = choices && choices.value && choices.value[id] ? choices.value[id].pick : "A";
    const entry = { table: c.table, key: c.key, keyCol: c.keyCol, pick };
    if (edits.value[id]) entry.override = edits.value[id];
    if (notes.value[id]) entry.note = notes.value[id];
    custom.push(entry);
  }

  await applyCustomChoices(custom);

  // sinaliza conclusão — o composable deve preencher `mergedUrl`
  applying.value = true;
  // if mergedUrl already set, complete immediately
  if (mergedUrl && mergedUrl.value) {
    completed.value = true;
    applying.value = false;
    $emit("merged");
    return;
  }

  // otherwise wait until mergedUrl is set (with a safety timeout)
  const stop = watch(
    mergedUrl,
    (v) => {
      if (v) {
        completed.value = true;
        applying.value = false;
        stop();
        $emit("merged");
      }
    },
    { immediate: false }
  );

  // fallback timeout: if url not provided in 8s, still show completed so user can retry
  setTimeout(() => {
    if (!mergedUrl || !mergedUrl.value) {
      completed.value = true;
      applying.value = false;
      stop();
      $emit("merged");
    }
  }, 8000);
}
</script>

<style scoped>
.review-root {
  padding: 12px;
  max-height: 60vh;
  overflow: auto;
}
.help {
  color: rgba(230, 238, 248, 0.7);
  margin-bottom: 12px;
}
.review-item {
  background: #07121a;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 10px;
}
.review-header {
  font-weight: 700;
  color: #fff;
}
.review-body {
  display: flex;
  gap: 12px;
  flex-direction: column;
}
.review-col {
  flex: 1;
}
.col-pre {
  white-space: pre-wrap;
  background: #08121a;
  padding: 8px;
  border-radius: 6px;
  color: #e6eef8;
  font-size: 12px;
}
.edit textarea {
  width: 100%;
  background: #07121a;
  color: #e6eef8;
  border: 1px solid rgba(230, 238, 248, 0.06);
  border-radius: 6px;
}
.edit input {
  width: 100%;
  margin-top: 6px;
  padding: 6px;
  border-radius: 6px;
  border: 1px solid rgba(230, 238, 248, 0.06);
  background: #07121a;
  color: #e6eef8;
}
.review-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
}
.btn {
  padding: 8px 12px;
  border-radius: 8px;
  background: #2b9ef3;
  color: #fff;
  border: none;
}
.btn-primary {
  background: linear-gradient(135deg, #4fc3f7 0%, #2b9ef3 100%);
}

.btn-disabled {
  opacity: 0.6;
  pointer-events: none;
}
</style>
