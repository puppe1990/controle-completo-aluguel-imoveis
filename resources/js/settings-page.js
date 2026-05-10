function renderDemoSeedSection() {
  return `
      <section class="panel page-section">
        <div class="section-heading">
          <div>
            <p class="section-eyebrow">Base inicial</p>
            <h3 class="section-title">Popular com dados de exemplo</h3>
          </div>
        </div>
        <div class="card-list">
          <article class="record-card">
            <p>Carregue proprietarios, inquilinos, imoveis, contratos e recebiveis de exemplo para explorar o sistema.</p>
            <button id="seed-demo" class="btn-secondary mt-4" type="button">Popular com dados de exemplo</button>
          </article>
        </div>
      </section>
  `;
}

export function renderSettingsPage(options = {}) {
  const { demoSeedEnabled = false } = options;
  return `
    <div class="page-stack">
      ${demoSeedEnabled ? renderDemoSeedSection() : ""}
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
            <button id="settings-import" class="btn-secondary mt-4" type="button">Selecionar arquivo</button>
          </article>
        </div>
      </section>
      <section class="panel page-section">
        <div class="section-heading">
          <div>
            <p class="section-eyebrow">Danger zone</p>
            <h3 class="section-title">Deletar toda a base</h3>
          </div>
        </div>
        <div class="card-list">
          <article class="record-card">
            <p>Apaga proprietarios, inquilinos, imoveis, contratos, recebiveis e volta o sistema para uma base vazia.</p>
            <button id="settings-reset" class="btn-danger mt-4" type="button">Deletar tudo</button>
          </article>
        </div>
      </section>
    </div>
  `;
}
