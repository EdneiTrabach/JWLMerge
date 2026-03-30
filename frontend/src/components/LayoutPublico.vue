<template>
  <div class="app-container">
    <header>
      <h1>BACKUP JW - UI (Vue)</h1>
    </header>

    <main>
      <section class="card">
        <SeletorArquivos />
        <BotoesAcoes />
        <LinkDownload />
        <ConflitosLista />
        <AreaLog />
      </section>
    </main>
  </div>
</template>

<script setup>
import SeletorArquivos from "./SeletorArquivos.vue";
import BotoesAcoes from "./BotoesAcoes.vue";
import LinkDownload from "./LinkDownload.vue";
import ConflitosLista from "./ConflitosLista.vue";
import AreaLog from "./AreaLog.vue";
</script>

<style scoped>
@import "../styles.css";
.row{margin-bottom:12px}
</style>
