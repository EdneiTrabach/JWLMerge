# Relatório de strings hardcoded — sugestões de chaves

Este arquivo lista as strings encontradas no código-fonte do frontend (`frontend/src`) que parecem ser texto visível na UI, com localização e chave sugerida para i18n.

IMPORTANTE:

- Textos vindos do banco de dados/exemplos (conteúdo das notas) NÃO devem ser traduzidos — são dados do usuário.
- Revise as chaves sugeridas; posso aplicar automaticamente depois da sua aprovação.

---

## Formato

- Arquivo: caminho relativo
- Trecho: trecho de contexto
- Texto atual: "..."
- Chave sugerida: `namespace.key`

---

1. Arquivo: `src/components/AppHeader.vue`
   Trecho: `<h1 class="title">Bem-vindo ao Backup JW</h1>`
   Texto atual: "Bem-vindo ao Backup JW"
   Chave sugerida: `header.title`

   Trecho: `Dica rápida: carregue os arquivos A e B, clique em "Detectar conflitos"...`
   Texto atual: "Dica rápida: carregue os arquivos A e B, clique em \"Detectar conflitos\" e use as escolhas para gerar o merge."
   Chave sugerida: `header.tip`

2. Arquivo: `src/components/SeletorArquivos.vue`
   Trecho: `<label>Arquivo A (.jwlibrary)</label>`
   Texto atual: "Arquivo A (.jwlibrary)"
   Chave sugerida: `filePicker.fileA.label`

   Trecho: `<label>Arquivo B (.jwlibrary)</label>`
   Texto atual: "Arquivo B (.jwlibrary)"
   Chave sugerida: `filePicker.fileB.label`

3. Arquivo: `src/components/BotoesAcoes.vue`
   Trecho: botão com texto `Detectar conflitos`
   Texto atual: "Detectar conflitos"
   Chave sugerida: `actions.detectConflicts`

   Trecho: botão com texto `Aplicar escolhas e mesclar`
   Texto atual: "Aplicar escolhas e mesclar"
   Chave sugerida: `actions.applyAndMerge`

4. Arquivo: `src/components/ConflitosLista.vue`
   Trecho: título
   Texto atual: `Conflitos detectados ({{ count }})`
   Chave sugerida: `conflicts.detected`

   Trecho: label página
   Texto atual: `Por página:`
   Chave sugerida: `conflicts.perPageLabel`

   Trecho: botão: `Manter A` / `Manter B` (por conflito)
   Texto atual: "Manter A" / "Manter B"
   Chave sugerida: `conflicts.keepA`, `conflicts.keepB`

   Trecho: botões de filtro: `Manter A para todos` / `Manter B para todos`
   Texto atual: "Manter A para todos" / "Manter B para todos"
   Chave sugerida: `conflicts.keepAllA`, `conflicts.keepAllB`

   Trecho: col titles: `A (diferenças abaixo):` / `B (diferenças abaixo):`
   Texto atual: "A (diferenças abaixo):" / "B (diferenças abaixo):"
   Chave sugerida: `conflicts.colATitle`, `conflicts.colBTitle`

   Trecho: preview/result
   Texto atual: "Resultado (preview):" / "Editar resultado (opcional)"
   Chave sugerida: `conflicts.resultPreview`, `conflicts.editResult`

   Trecho: paginação `Prev` / `Next` / `Página {{page}} / {{total}}`
   Texto atual: "Prev" / "Next" / "Página {{page}} / {{total}}"
   Chave sugerida: `pagination.prev`, `pagination.next`, `pagination.pageInfo`

5. Arquivo: `src/components/ConflictReview.vue`
   Trecho: label `Editar resultado (opcional)` (duplicado)
   Texto atual: "Editar resultado (opcional)"
   Chave sugerida: `conflicts.editResult` (reusar)

6. Arquivo: `src/components/LinkDownload.vue`
   Trecho: texto/label do botão de download (ex.: `Baixar resultado`)
   Texto atual: verificar componente (varia conforme implementação)
   Chave sugerida: `download.button`

7. Arquivo: `src/composables/useMergeUI.js`
   Trecho: logs de console/área de log (mensagens internas):
   - 'Arquivo A selecionado: ' + fileA.value.name
   - 'Arquivo B selecionado: ' + fileB.value.name
   - 'Detectando conflitos entre arquivos...'
   - 'Conflitos detectados: ' + cs.length
   - 'Iniciando fluxo de mesclagem 100% no front (prefer=' + prefer + ')'
   - 'Erro detectando conflitos: ' + (e.message || e)
   - 'Erro ao aplicar escolhas: ' + (e.message || e)
   - 'Erro ao aplicar escolhas customizadas: ' + (e.message || e)
     Observação: essas mensagens são de log; se aparecerem na UI, devemos i18n-las também.
     Chaves sugeridas: `log.fileASelected`, `log.fileBSelected`, `log.detectingConflicts`, `log.conflictsCount`, `log.startMergeFront`, `log.error.detectConflicts`, `log.error.applyChoices`, `log.error.applyCustom`

8. Outras ocorrências (sintéticas encontradas)
   - Texto do header do app, tips e labels duplicados em algumas vistas — considerar centralizar via chaves.
   - `Language` / `Idioma` já definido em `i18n/locales/*.json` como `language`.

---

Observações finais e próximos passos sugeridos:

- Confirme ou ajuste as chaves sugeridas (posso renomear conforme sua conveniência).
- Após aprovação, eu posso: (A) aplicar automaticamente as substituições nos componentes (trocar os textos por `{{ $t('key') }}` ou `t('key')` nos scripts) e adicionar as entradas às três línguas (PT/EN/ES) com traduções automáticas iniciais, ou (B) gerar um PR com as mudanças em pequenos lotes (recomendado para revisão).
- Recomendo persistir preferência de idioma em `localStorage` (posso implementar junto).

Se quiser que eu aplique agora, responda com `APLICAR` e eu começo pelos componentes mais críticos em um commit. Se preferir revisar, diga `REVISAR` e eu gero um arquivo separável (CSV/JSON) com todas as entradas para você revisar offline.
