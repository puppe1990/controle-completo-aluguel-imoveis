export function renderSettingsPage() {
  return `
    <div class="page-stack">
      <section class="panel page-section">
        <div class="section-heading">
          <div>
            <p class="section-eyebrow">Backup</p>
            <h3 class="section-title">Exportar dados</h3>
          </div>
        </div>
        <div class="card-list">
          <article class="record-card">
            <p>Baixe um arquivo JSON com cadastros, contratos e recebiveis.</p>
            <button id="settings-export" class="btn-primary mt-4" type="button">Exportar dados</button>
          </article>
        </div>
      </section>
      <section class="panel page-section">
        <div class="section-heading">
          <div>
            <p class="section-eyebrow">Restauracao</p>
            <h3 class="section-title">Importar dados</h3>
          </div>
        </div>
        <div class="card-list">
          <article class="record-card">
            <p>Restaure o sistema a partir de um arquivo JSON exportado pelo app.</p>
            <label class="btn-secondary mt-4 inline-flex cursor-pointer" for="settings-import-file">Selecionar arquivo</label>
            <input id="settings-import-file" class="hidden" type="file" accept="application/json" />
          </article>
        </div>
      </section>
    </div>
  `;
}
