<template>
  <header class="app-header">
    <div class="header-inner">
      <h1 class="title">{{ $t("header.title") }}</h1>
      <p class="subtitle">{{ $t("header.subtitle") }}</p>
      <p class="hint">{{ $t("header.tip") }}</p>
    </div>
  </header>
</template>

<script setup></script>

<style scoped>
.app-header {
  background: linear-gradient(
    90deg,
    rgba(59, 91, 255, 0.12),
    rgba(255, 122, 182, 0.06)
  );
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
}
.header-inner {
  max-width: 980px;
  margin: 0 auto;
}
.title {
  margin: 0 0 6px 0;
  font-size: 20px;
  color: var(--text, #ffffff);
}
.subtitle {
  margin: 0 0 6px 0;
  font-size: 13px;
  color: rgba(230, 238, 248, 0.95);
}
.hint {
  margin: 0;
  font-size: 12px;
  color: rgba(230, 238, 248, 0.7);
}

@media (min-width: 768px) {
  .title {
    font-size: 24px;
  }
  .subtitle {
    font-size: 14px;
  }
}
</style>
