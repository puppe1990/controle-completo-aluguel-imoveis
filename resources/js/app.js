import { ROUTES, getRouteFromHashValue } from "./app-routes.js";
import { handleClipboardShortcut } from "./clipboard-shortcuts.js";
import { renderSettingsPage } from "./settings-page.js";

const EXTENSION_ID = "js.imobiliaria.sqlite";

const state = {
  route: "dashboard",
  snapshot: {
    owners: [],
    tenants: [],
    properties: [],
    contracts: [],
    receivables: [],
    summary: {},
    ownerPerformance: [],
  },
  api: null,
};

function currency(value = 0) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function statusPill(status) {
  const map = {
    paid: "bg-emerald-100 text-emerald-800",
    pending: "bg-amber-100 text-amber-900",
    overdue: "bg-rose-100 text-rose-800",
    rented: "bg-stone-900 text-white",
    available: "bg-stone-100 text-stone-700",
    active: "bg-emerald-100 text-emerald-800",
  };
  return `<span class="rounded-full px-3 py-1 text-xs font-semibold ${map[status] ?? "bg-stone-100 text-stone-700"}">${status}</span>`;
}

function formToObject(form) {
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
}

function getRouteFromHash() {
  return getRouteFromHashValue(window.location.hash);
}

async function initNeutralino() {
  if (!window.Neutralino) {
    throw new Error("Neutralino nao carregado");
  }
  Neutralino.init();
  Neutralino.events.on("windowClose", () => Neutralino.app.exit());
}

function createBackendClient() {
  const pending = new Map();

  Neutralino.events.on("backend:response", (event) => {
    const { type, payload } = event.detail;
    if (type === "backend:ready") {
      setStatus("Backend SQLite conectado");
      return;
    }

    const request = pending.get(payload.requestId);
    if (!request) {
      return;
    }

    pending.delete(payload.requestId);
    if (type === "backend:error") {
      request.reject(new Error(payload.message));
      return;
    }

    request.resolve(payload.result);
  });

  return {
    request(command, payload = {}) {
      const requestId = crypto.randomUUID();
      return new Promise((resolve, reject) => {
        pending.set(requestId, { resolve, reject });
        Neutralino.extensions.dispatch(EXTENSION_ID, "backend:request", {
          requestId,
          command,
          payload,
        });
      });
    },
  };
}

function setStatus(message) {
  const element = document.getElementById("status-banner");
  if (element) {
    element.textContent = message;
  }
}

function routeMeta() {
  return ROUTES.find((route) => route.id === state.route) ?? ROUTES[0];
}

function renderSidebar() {
  document.getElementById("route-nav").innerHTML = ROUTES.map(
    (route) => `
      <a
        href="#/${route.id}"
        class="nav-link ${state.route === route.id ? "is-active" : ""}"
      >
        <span class="nav-link__eyebrow">${route.eyebrow}</span>
        <strong class="nav-link__title">${route.label}</strong>
      </a>
    `
  ).join("");
}

function renderShellHeader() {
  const meta = routeMeta();
  document.getElementById("page-header").innerHTML = `
    <div>
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">${meta.eyebrow}</p>
      <h2 class="mt-3 text-3xl font-semibold text-stone-950">${meta.label}</h2>
    </div>
    <div class="header-actions">
      <button id="seed-demo" class="btn-secondary">Popular com dados de exemplo</button>
      <div id="status-banner" class="rounded-2xl bg-stone-950 px-4 py-3 text-sm text-white">Sistema carregando...</div>
    </div>
  `;
}

function summaryCards(summary = {}) {
  const cards = [
    { label: "Proprietarios", value: summary.owners ?? 0 },
    { label: "Inquilinos", value: summary.tenants ?? 0 },
    { label: "Imoveis", value: summary.properties ?? 0 },
    { label: "Contratos ativos", value: summary.active_contracts ?? 0 },
    { label: "Recebido", value: currency(summary.received_total ?? 0) },
    { label: "Em atraso", value: currency(summary.overdue_total ?? 0) },
  ];

  return `
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      ${cards
        .map(
          (item) => `
            <article class="stat-card">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">${item.label}</p>
              <p class="mt-4 text-3xl font-semibold text-stone-950">${item.value}</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function emptyState(message) {
  return `<div class="empty-state">${message}</div>`;
}

function pageSection(title, description, content) {
  return `
    <section class="panel page-section">
      <div class="section-heading">
        <div>
          <p class="section-eyebrow">${description}</p>
          <h3 class="section-title">${title}</h3>
        </div>
      </div>
      ${content}
    </section>
  `;
}

function ownersPage() {
  const { owners } = state.snapshot;
  return `
    <div class="page-grid page-grid--split">
      ${pageSection(
        "Novo proprietario",
        "Cadastro",
        `
          <form id="owner-form" class="form-stack">
            <input class="field" name="name" placeholder="Nome completo" required />
            <input class="field" name="document" placeholder="CPF/CNPJ" />
            <input class="field" name="phone" placeholder="Telefone" />
            <input class="field" name="email" placeholder="E-mail" />
            <textarea class="field field-area" name="notes" placeholder="Observacoes"></textarea>
            <button class="btn-primary w-full" type="submit">Salvar proprietario</button>
          </form>
        `
      )}
      ${pageSection(
        "Lista de proprietarios",
        "Base atual",
        owners.length
          ? `<div class="card-list">
              ${owners
                .map(
                  (owner) => `
                    <article class="record-card">
                      <div class="record-card__top">
                        <strong>${owner.name}</strong>
                        ${statusPill("active")}
                      </div>
                      <p>${owner.document ?? "Sem documento"}</p>
                      <p>${owner.phone ?? "Sem telefone"} · ${owner.email ?? "Sem e-mail"}</p>
                    </article>
                  `
                )
                .join("")}
            </div>`
          : emptyState("Nenhum proprietario cadastrado.")
      )}
    </div>
  `;
}

function tenantsPage() {
  const { tenants } = state.snapshot;
  return `
    <div class="page-grid page-grid--split">
      ${pageSection(
        "Novo inquilino",
        "Cadastro",
        `
          <form id="tenant-form" class="form-stack">
            <input class="field" name="name" placeholder="Nome completo" required />
            <input class="field" name="document" placeholder="CPF" />
            <input class="field" name="phone" placeholder="Telefone" />
            <input class="field" name="email" placeholder="E-mail" />
            <button class="btn-primary w-full" type="submit">Salvar inquilino</button>
          </form>
        `
      )}
      ${pageSection(
        "Lista de inquilinos",
        "Base atual",
        tenants.length
          ? `<div class="card-list">
              ${tenants
                .map(
                  (tenant) => `
                    <article class="record-card">
                      <div class="record-card__top">
                        <strong>${tenant.name}</strong>
                        ${statusPill(tenant.status ?? "active")}
                      </div>
                      <p>${tenant.document ?? "Sem documento"}</p>
                      <p>${tenant.phone ?? "Sem telefone"} · ${tenant.email ?? "Sem e-mail"}</p>
                    </article>
                  `
                )
                .join("")}
            </div>`
          : emptyState("Nenhum inquilino cadastrado.")
      )}
    </div>
  `;
}

function propertyOwnerOptions() {
  return ['<option value="">Selecione o proprietario</option>']
    .concat(
      state.snapshot.owners.map(
        (owner) => `<option value="${owner.id}">${owner.name}</option>`
      )
    )
    .join("");
}

function contractTenantOptions() {
  return ['<option value="">Selecione o inquilino</option>']
    .concat(
      state.snapshot.tenants.map(
        (tenant) => `<option value="${tenant.id}">${tenant.name}</option>`
      )
    )
    .join("");
}

function contractPropertyOptions() {
  return ['<option value="">Selecione o imovel</option>']
    .concat(
      state.snapshot.properties.map(
        (property) =>
          `<option value="${property.id}" data-rent="${property.monthly_rent}">${property.code} · ${property.title}</option>`
      )
    )
    .join("");
}

function propertiesPage() {
  const { properties } = state.snapshot;
  return `
    <div class="page-grid page-grid--split">
      ${pageSection(
        "Novo imovel",
        "Cadastro",
        `
          <form id="property-form" class="form-stack">
            <select class="field" name="owner_id" required>${propertyOwnerOptions()}</select>
            <input class="field" name="code" placeholder="Codigo interno" required />
            <input class="field" name="title" placeholder="Nome do imovel" required />
            <input class="field" name="address" placeholder="Endereco" required />
            <div class="grid gap-3 md:grid-cols-2">
              <input class="field" name="city" placeholder="Cidade" required />
              <input class="field" name="state" placeholder="UF" maxlength="2" required />
            </div>
            <input class="field" name="monthly_rent" type="number" min="0" step="0.01" placeholder="Aluguel mensal" required />
            <button class="btn-primary w-full" type="submit">Salvar imovel</button>
          </form>
        `
      )}
      ${pageSection(
        "Portfolio de imoveis",
        "Patrimonio administrado",
        properties.length
          ? `<div class="card-list">
              ${properties
                .map(
                  (property) => `
                    <article class="record-card">
                      <div class="record-card__top">
                        <strong>${property.code} · ${property.title}</strong>
                        ${statusPill(property.status)}
                      </div>
                      <p>${property.address}</p>
                      <p>${property.city}/${property.state} · ${currency(property.monthly_rent)}</p>
                      <p>Proprietario: ${property.owner_name}</p>
                    </article>
                  `
                )
                .join("")}
            </div>`
          : emptyState("Nenhum imovel cadastrado.")
      )}
    </div>
  `;
}

function contractsPage() {
  const { contracts } = state.snapshot;
  return `
    <div class="page-grid page-grid--split">
      ${pageSection(
        "Novo contrato",
        "Locacao",
        `
          <form id="contract-form" class="form-stack">
            <select class="field" name="property_id" id="contract-property-select" required>${contractPropertyOptions()}</select>
            <select class="field" name="tenant_id" id="contract-tenant-select" required>${contractTenantOptions()}</select>
            <div class="grid gap-3 md:grid-cols-2">
              <input class="field" name="start_date" type="date" required />
              <input class="field" name="end_date" type="date" required />
            </div>
            <div class="grid gap-3 md:grid-cols-3">
              <input class="field" name="due_day" type="number" min="1" max="31" placeholder="Dia de vencimento" required />
              <input class="field" name="rent_amount" type="number" min="0" step="0.01" placeholder="Valor do aluguel" required />
              <input class="field" name="deposit_amount" type="number" min="0" step="0.01" placeholder="Caucao" />
            </div>
            <button class="btn-primary w-full" type="submit">Criar contrato</button>
          </form>
        `
      )}
      ${pageSection(
        "Contratos ativos",
        "Operacao",
        contracts.length
          ? `<div class="table-shell">
              <table class="min-w-full text-left text-sm">
                <thead class="text-stone-500">
                  <tr class="border-b border-stone-200">
                    <th class="px-3 py-3 font-medium">Imovel</th>
                    <th class="px-3 py-3 font-medium">Inquilino</th>
                    <th class="px-3 py-3 font-medium">Periodo</th>
                    <th class="px-3 py-3 font-medium">Valor</th>
                    <th class="px-3 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${contracts
                    .map(
                      (contract) => `
                        <tr class="border-b border-stone-100">
                          <td class="px-3 py-4">${contract.property_code} · ${contract.property_title}</td>
                          <td class="px-3 py-4">${contract.tenant_name}</td>
                          <td class="px-3 py-4">${contract.start_date} ate ${contract.end_date}</td>
                          <td class="px-3 py-4">${currency(contract.rent_amount)}</td>
                          <td class="px-3 py-4">${statusPill(contract.status)}</td>
                        </tr>
                      `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>`
          : emptyState("Nenhum contrato cadastrado.")
      )}
    </div>
  `;
}

function receivablesTable(receivables) {
  if (!receivables.length) {
    return emptyState("Nenhuma conta a receber cadastrada.");
  }

  return `
    <div class="table-shell">
      <table class="min-w-full text-left text-sm">
        <thead class="text-stone-500">
          <tr class="border-b border-stone-200">
            <th class="px-3 py-3 font-medium">Referencia</th>
            <th class="px-3 py-3 font-medium">Imovel</th>
            <th class="px-3 py-3 font-medium">Inquilino</th>
            <th class="px-3 py-3 font-medium">Vencimento</th>
            <th class="px-3 py-3 font-medium">Valor</th>
            <th class="px-3 py-3 font-medium">Status</th>
            <th class="px-3 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          ${receivables
            .map(
              (row) => `
                <tr class="border-b border-stone-100">
                  <td class="px-3 py-4">${row.reference_month}</td>
                  <td class="px-3 py-4">${row.property_code} · ${row.property_title}</td>
                  <td class="px-3 py-4">${row.tenant_name}</td>
                  <td class="px-3 py-4">${row.due_date}</td>
                  <td class="px-3 py-4 font-medium">${currency(row.amount)}</td>
                  <td class="px-3 py-4">${statusPill(row.status_label)}</td>
                  <td class="px-3 py-4">
                    ${
                      row.status_label === "paid"
                        ? '<span class="text-xs text-stone-400">Liquidado</span>'
                        : `<button class="btn-secondary pay-button !px-3 !py-2 text-xs" data-id="${row.id}">Registrar pagamento</button>`
                    }
                  </td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function ownerPerformanceTable(rows) {
  if (!rows.length) {
    return emptyState("Sem consolidado por proprietario.");
  }

  return `
    <div class="table-shell">
      <table class="min-w-full text-left text-sm">
        <thead class="text-stone-500">
          <tr class="border-b border-stone-200">
            <th class="px-3 py-3 font-medium">Proprietario</th>
            <th class="px-3 py-3 font-medium">Imoveis</th>
            <th class="px-3 py-3 font-medium">Previsto</th>
            <th class="px-3 py-3 font-medium">Recebido</th>
            <th class="px-3 py-3 font-medium">Em atraso</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
                <tr class="border-b border-stone-100">
                  <td class="px-3 py-4 font-medium">${row.name}</td>
                  <td class="px-3 py-4">${row.properties_count}</td>
                  <td class="px-3 py-4">${currency(row.expected_total)}</td>
                  <td class="px-3 py-4">${currency(row.received_total)}</td>
                  <td class="px-3 py-4">${currency(row.overdue_total)}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function receivablesPage() {
  return `
    <div class="page-stack">
      ${pageSection("Contas a receber", "Financeiro", receivablesTable(state.snapshot.receivables))}
      ${pageSection("Relatorio por proprietario", "Consolidado", ownerPerformanceTable(state.snapshot.ownerPerformance))}
    </div>
  `;
}

function dashboardPage() {
  return `
    <div class="page-stack">
      ${summaryCards(state.snapshot.summary)}
      <div class="page-grid page-grid--split">
        ${pageSection("Recebimentos e inadimplencia", "Financeiro", receivablesTable(state.snapshot.receivables.slice(0, 6)))}
        ${pageSection(
          "Operacao atual",
          "Resumo rapido",
          `
            <div class="card-list">
              <article class="record-card">
                <div class="record-card__top">
                  <strong>Proprietarios</strong>
                  <span>${state.snapshot.owners.length}</span>
                </div>
                <p>Base de proprietarios administrados no sistema.</p>
              </article>
              <article class="record-card">
                <div class="record-card__top">
                  <strong>Inquilinos</strong>
                  <span>${state.snapshot.tenants.length}</span>
                </div>
                <p>Clientes com contratos ativos ou historico cadastrado.</p>
              </article>
              <article class="record-card">
                <div class="record-card__top">
                  <strong>Imoveis</strong>
                  <span>${state.snapshot.properties.length}</span>
                </div>
                <p>Unidades disponiveis e alugadas sob gestao.</p>
              </article>
            </div>
          `
        )}
      </div>
      ${pageSection("Performance por proprietario", "Analise", ownerPerformanceTable(state.snapshot.ownerPerformance))}
    </div>
  `;
}

function settingsPage() {
  return renderSettingsPage();
}

function downloadBackupFile(backup) {
  const content = JSON.stringify(backup, null, 2);
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "imobiliaria-backup.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

async function exportBackup() {
  setStatus("Gerando backup...");
  const backup = await state.api.request("settings.export");
  downloadBackupFile(backup);
  setStatus("Backup exportado");
}

async function importBackupFile(file) {
  setStatus("Importando backup...");
  const content = await file.text();
  const backup = JSON.parse(content);
  const snapshot = await state.api.request("settings.import", { backup });
  await refreshSnapshot(snapshot);
  setStatus("Backup importado");
}

function renderCurrentRoute() {
  const view = document.getElementById("app-view");
  const pages = {
    dashboard: dashboardPage,
    owners: ownersPage,
    tenants: tenantsPage,
    properties: propertiesPage,
    contracts: contractsPage,
    receivables: receivablesPage,
    settings: settingsPage,
  };

  view.innerHTML = pages[state.route]();
}

function renderApp() {
  renderSidebar();
  renderShellHeader();
  renderCurrentRoute();
  setStatus("Sistema pronto para uso");
}

async function refreshSnapshot(snapshot) {
  state.snapshot = snapshot;
  renderApp();
}

async function handleFormSubmit(command, form) {
  const payload = formToObject(form);
  const snapshot = await state.api.request(command, payload);
  await refreshSnapshot(snapshot);
  form.reset();
}

function attachEvents() {
  document.body.addEventListener("submit", async (event) => {
    const form = event.target;
    const commandMap = {
      "owner-form": "owners.create",
      "tenant-form": "tenants.create",
      "property-form": "properties.create",
      "contract-form": "contracts.create",
    };
    const command = commandMap[form.id];
    if (!command) {
      return;
    }
    event.preventDefault();
    await handleFormSubmit(command, form);
  });

  document.body.addEventListener("click", async (event) => {
    const payButton = event.target.closest(".pay-button");
    if (payButton) {
      const snapshot = await state.api.request("receivables.pay", {
        id: payButton.dataset.id,
      });
      await refreshSnapshot(snapshot);
      return;
    }

    if (event.target.id === "seed-demo") {
      const snapshot = await state.api.request("seedDemo");
      await refreshSnapshot(snapshot);
      return;
    }

    if (event.target.id === "settings-export") {
      await exportBackup();
    }
  });

  document.body.addEventListener("change", async (event) => {
    if (event.target.id === "settings-import-file") {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      await importBackupFile(file);
      event.target.value = "";
      return;
    }

    if (event.target.id !== "contract-property-select") {
      return;
    }
    const selected = event.target.selectedOptions[0];
    const rentField = document.querySelector(
      '#contract-form [name="rent_amount"]'
    );
    if (selected?.dataset?.rent && rentField) {
      rentField.value = selected.dataset.rent;
    }
  });

  window.addEventListener("hashchange", () => {
    state.route = getRouteFromHash();
    renderApp();
  });

  document.body.addEventListener("keydown", async (event) => {
    await handleClipboardShortcut(event, Neutralino.clipboard);
  });
}

async function main() {
  try {
    await initNeutralino();
    state.api = createBackendClient();
    attachEvents();
    state.route = getRouteFromHash();
    const snapshot = await state.api.request("bootstrap");
    await refreshSnapshot(snapshot);
  } catch (error) {
    setStatus(error.message);
    const view = document.getElementById("app-view");
    if (view) {
      view.innerHTML = `<section class="panel page-section"><div class="empty-state">${error.message}</div></section>`;
    }
  }
}

main();
