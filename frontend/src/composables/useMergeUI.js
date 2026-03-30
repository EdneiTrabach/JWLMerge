import { ref, computed } from "vue";
// note: avoid calling Pinia stores at module load time to prevent "no active Pinia" errors
import { uploadFilesForMerge, downloadMergedUrl } from "../composables/useApi";
import { inspectLocal as inspectLib } from "../lib/inspectLocal";
import {
  mergeJwlFiles,
  detectConflicts,
  mergeWithChoices,
} from "../lib/merger";

const fileA = ref(null);
const fileB = ref(null);
const log = ref([]);
const mergedUrl = ref("");
const downloadName = ref("");
const conflicts = ref([]);
const choices = ref({});
const page = ref(1);
const perPage = ref(6);
const tableFilter = ref("");

function ensureJwLibraryName(name) {
  if (!name) return "merged.jwlibrary";
  let n = String(name);
  if (n.toLowerCase().endsWith('.zip')) n = n.replace(/\.zip$/i, '.jwlibrary');
  else if (!n.toLowerCase().endsWith('.jwlibrary')) n = n + '.jwlibrary';
  return n;
}

function onFileA(e) {
  fileA.value = e.target.files[0];
  log.value.unshift("Arquivo A selecionado: " + fileA.value.name);
}
function onFileB(e) {
  fileB.value = e.target.files[0];
  log.value.unshift("Arquivo B selecionado: " + fileB.value.name);
}

async function inspectLocal() {
  const f = fileA.value || fileB.value;
  if (!f) {
    log.value.unshift("Nenhum arquivo selecionado para inspeção");
    return;
  }
  log.value.unshift("Inspecionando " + f.name + " (sql.js + JSZip)");
  try {
    const info = await inspectLib(f);
    log.value.unshift("integrity: " + info.integrity);
    if (info.manifest) log.value.unshift("manifest lido");
    const tbls = Object.keys(info.tables);
    if (tbls.length === 0) log.value.unshift("Nenhuma tabela detectada");
    tbls.forEach((t) =>
      log.value.unshift(`${t}: ${info.tables[t].count} linhas`),
    );
  } catch (err) {
    log.value.unshift("Erro na inspeção: " + (err.message || err));
  }
}

async function mergeServer() {
  if (!fileA.value || !fileB.value) return;
  log.value.unshift("Enviando arquivos para merge no servidor...");
  try {
    const resp = await uploadFilesForMerge(fileA.value, fileB.value);
    log.value.unshift("Resposta do servidor: " + JSON.stringify(resp));
    const out =
      resp &&
      (resp.out_path || resp.path || (resp.result && resp.result.out_path));
    if (out) {
      const dlUrl = downloadMergedUrl(out);
      let name = out.split(/[\\\/]/).pop();
      try {
        const respFile = await fetch(dlUrl, { method: "GET" });
        if (!respFile.ok) throw new Error("Falha ao baixar do servidor: " + respFile.status);
        const blob = await respFile.blob();
        const url = URL.createObjectURL(blob);
        mergedUrl.value = url;
        // try to extract filename from Content-Disposition header
        const cd = respFile.headers.get("content-disposition") || "";
        const m1 = /filename\*=[^']+'[^']+'([^;\n\r]+)/i.exec(cd);
        const m2 = /filename=\"?([^\";]+)\"?/i.exec(cd);
        if (m1 && m1[1]) name = decodeURIComponent(m1[1]);
        else if (m2 && m2[1]) name = m2[1];
        downloadName.value = ensureJwLibraryName(name);
        log.value.unshift("Merge processado, pronto para download: " + out);
        console.log("[useMergeUI] mergedUrl set (server-fetch):", url);
      } catch (err) {
        // fallback: use server URL directly (might be cross-origin) but still force .jwlibrary name
        const url = downloadMergedUrl(out);
        mergedUrl.value = url;
        downloadName.value = ensureJwLibraryName(name);
        log.value.unshift("Falha ao baixar blob do servidor; usando URL direta: " + (err.message || err));
        console.log("[useMergeUI] mergedUrl set (server-fallback):", url, err);
      }
    } else {
      log.value.unshift(
        "Resposta inesperada do servidor: " + JSON.stringify(resp),
      );
    }
  } catch (err) {
    log.value.unshift("Erro: " + (err.message || err));
  }
}

async function mergeLocal() {
  if (!fileA.value || !fileB.value) return;
  log.value.unshift("Iniciando merge local...");
  try {
    const { blob, filename } = await mergeJwlFiles([fileA.value, fileB.value], {
      progress: (p) => {
        if (p && p.step) log.value.unshift(JSON.stringify(p));
      },
    });
    const url = URL.createObjectURL(blob);
    mergedUrl.value = url;
    downloadName.value = ensureJwLibraryName(filename);
    log.value.unshift("Merge local concluído: " + downloadName.value);
    console.log("[useMergeUI] mergedUrl set (local):", url);
  } catch (err) {
    log.value.unshift("Erro no merge local: " + (err.message || err));
  }
}

async function detectAndShowConflicts() {
  if (!fileA.value || !fileB.value) return;
  log.value.unshift("Detectando conflitos entre arquivos...");
  try {
    const cs = await detectConflicts(fileA.value, fileB.value);
    conflicts.value = cs;
    choices.value = {};
    page.value = 1;
    tableFilter.value = "";
    log.value.unshift("Conflitos detectados: " + cs.length);
  } catch (e) {
    log.value.unshift("Erro detectando conflitos: " + (e.message || e));
  }
}

async function mergeLocalFull(prefer = "A") {
  // prefer: 'A'|'B'|'ask' — if 'ask', only detect conflicts and return for manual resolution
  if (!fileA.value || !fileB.value) {
    log.value.unshift("Selecione os arquivos A e B antes de mesclar");
    return;
  }
  log.value.unshift(
    "Iniciando fluxo de mesclagem 100% no front (prefer=" + prefer + ")",
  );
  await detectAndShowConflicts();
  if (!conflicts.value || conflicts.value.length === 0) {
    log.value.unshift("Nenhum conflito detectado; executando merge direto");
    await mergeLocal();
    return;
  }
  if (prefer === "ask") {
    log.value.unshift("Conflitos detectados — aguarde escolhas manuais");
    return;
  }
  // apply chosen preference to all visible conflicts and run merge
  pickAll(prefer);
  log.value.unshift(
    `Aplicando prefer='${prefer}' para todos os conflitos e gerando merge`,
  );
  await applyChoicesAndMerge();
}

function pickChoiceByIndex(idx, pick) {
  const c = conflicts.value[idx];
  if (!c) return;
  const id = `${c.table}::${c.key}`;
  choices.value[id] = { table: c.table, key: c.key, keyCol: c.keyCol, pick };
  log.value.unshift(`Escolhido ${pick} para ${c.table}#${c.key}`);
}

function pickAll(pick) {
  const list = filteredConflicts.value;
  for (const c of list) {
    const id = `${c.table}::${c.key}`;
    choices.value[id] = { table: c.table, key: c.key, keyCol: c.keyCol, pick };
  }
  log.value.unshift(
    `Aplicado '${pick}' para ${list.length} conflitos visíveis`,
  );
}

async function applyChoicesAndMerge() {
  const chosen = Object.values(choices.value);
  if (chosen.length === 0) {
    log.value.unshift("Nenhuma escolha feita; nada a aplicar");
    return;
  }
  log.value.unshift("Aplicando escolhas e gerando merge local...");
  try {
    // debug log: summarize choices
    const cntA = chosen.filter((c) => c.pick === "A").length;
    const cntB = chosen.filter((c) => c.pick === "B").length;
    log.value.unshift(
      `Resumo escolhas: total=${chosen.length} A=${cntA} B=${cntB}`,
    );
    log.value.unshift(
      "Amostra escolhas: " + JSON.stringify(chosen.slice(0, 10)),
    );
    const { blob, filename } = await mergeWithChoices(
      fileA.value,
      fileB.value,
      chosen,
      {
        progress: (p) => {
          if (p && p.step) log.value.unshift(JSON.stringify(p));
        },
      },
    );
    const url = URL.createObjectURL(blob);
    mergedUrl.value = url;
    downloadName.value = ensureJwLibraryName(filename);
    log.value.unshift("Merge com escolhas gerado: " + filename);
    log.value.unshift("URL do merge criada (local): " + url);
    console.log("[useMergeUI] mergedUrl set (with choices):", url);
  } catch (e) {
    log.value.unshift("Erro ao aplicar escolhas: " + (e.message || e));
  }
}

// apply custom choices (with optional overrides/annotations)
async function applyCustomChoices(customChosen) {
  if (!customChosen || customChosen.length === 0) {
    log.value.unshift("Nenhuma escolha customizada fornecida; nada a aplicar");
    return;
  }
  log.value.unshift("Aplicando escolhas customizadas e gerando merge local...");
  try {
    const cntA = customChosen.filter((c) => c.pick === "A").length;
    const cntB = customChosen.filter((c) => c.pick === "B").length;
    log.value.unshift(
      `Resumo escolhas custom: total=${customChosen.length} A=${cntA} B=${cntB}`,
    );
    log.value.unshift(
      "Amostra escolhas custom: " + JSON.stringify(customChosen.slice(0, 10)),
    );
    const { blob, filename } = await mergeWithChoices(
      fileA.value,
      fileB.value,
      customChosen,
      {
        progress: (p) => {
          if (p && p.step) log.value.unshift(JSON.stringify(p));
        },
      },
    );
    const url = URL.createObjectURL(blob);
    mergedUrl.value = url;
    downloadName.value = ensureJwLibraryName(filename);
    log.value.unshift("Merge com escolhas custom gerado: " + filename);
    log.value.unshift("URL do merge criada (local): " + url);
    console.log("[useMergeUI] mergedUrl set (with custom choices):", url);
  } catch (e) {
    log.value.unshift(
      "Erro ao aplicar escolhas customizadas: " + (e.message || e),
    );
  }
}

function downloadMerged() {
  if (!mergedUrl.value)
    return log.value.unshift(
      "Nenhum arquivo mergeado disponível para download",
    );
  try {
    // If mergedUrl is a blob/object URL, create a temporary anchor with download attribute
    if (mergedUrl.value.startsWith("blob:")) {
      const a = document.createElement("a");
      a.href = mergedUrl.value;
      a.download = downloadName.value || "merged.jwlibrary";
      document.body.appendChild(a);
      a.click();
      a.remove();
      log.value.unshift("Iniciando download (blob): " + a.download);
      // revoke object URL after a short delay
      setTimeout(() => {
        try {
          URL.revokeObjectURL(mergedUrl.value);
        } catch (e) {}
      }, 5000);
      return;
    }

    // For normal URLs (server download), create anchor with download attr to force filename
    const a = document.createElement("a");
    a.href = mergedUrl.value;
    a.download = downloadName.value || "";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    log.value.unshift(
      "Iniciando download: " + (downloadName.value || mergedUrl.value),
    );
  } catch (e) {
    log.value.unshift("Falha ao iniciar download: " + (e.message || e));
  }
}

const tablesAvailable = computed(() =>
  Array.from(new Set(conflicts.value.map((c) => c.table))).sort(),
);
const filteredConflicts = computed(() => {
  if (!tableFilter.value) return conflicts.value;
  return conflicts.value.filter((c) => c.table === tableFilter.value);
});
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredConflicts.value.length / perPage.value)),
);
const pagedConflicts = computed(() => {
  const start = (page.value - 1) * perPage.value;
  return filteredConflicts.value.slice(start, start + perPage.value);
});
function nextPage() {
  if (page.value < totalPages.value) page.value++;
}
function prevPage() {
  if (page.value > 1) page.value--;
}

function diffKeys(c) {
  const a = c.a || {};
  const b = c.b || {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const diffs = [];
  for (const k of keys) {
    const av = a[k];
    const bv = b[k];
    if (JSON.stringify(av) !== JSON.stringify(bv)) diffs.push(k);
  }
  return diffs;
}

function formatDiffValues(obj, keys) {
  if (!obj) return "{}";
  const out = {};
  for (const k of keys) out[k] = obj[k];
  return JSON.stringify(out, null, 2);
}

export function useMergeUI() {
  return {
    fileA,
    fileB,
    log,
    mergedUrl,
    downloadName,
    conflicts,
    choices,
    page,
    perPage,
    tableFilter,
    onFileA,
    onFileB,
    inspectLocal,
    mergeServer,
    mergeLocal,
    detectAndShowConflicts,
    pickChoiceByIndex,
    pickAll,
    applyChoicesAndMerge,
    applyCustomChoices,
    // full front-only merge: prefer = 'A' | 'B' | 'ask'
    mergeLocalFull,
    downloadMerged,
    tablesAvailable,
    filteredConflicts,
    totalPages,
    pagedConflicts,
    nextPage,
    prevPage,
    diffKeys,
    formatDiffValues,
  };
}
