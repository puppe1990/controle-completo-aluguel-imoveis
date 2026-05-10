import {
  ROUTES,
  crudCreateHash,
  crudEditHash,
  crudListHash,
  getRouteContextFromHash,
} from "./app-routes.js";
import { handleClipboardShortcut } from "./clipboard-shortcuts.js";
import {
  applyInputMask,
  applyInputMasks,
  normalizeFormPayload,
} from "./rental-form-formatters.js";
import { renderCrudFormRoute, renderCrudRoute } from "./rental-page-views.js";
import { renderSettingsPage } from "./settings-page.js";

const EXTENSION_ID = "js.imobiliaria.sqlite";

const state = {
  route: "dashboard",
  routeContext: {
    route: "dashboard",
    action: "list",
    recordId: null,
  },
  api: null,
  deleteModal: null,
  snapshot: {
    owners: [],
    tenants: [],
    properties: [],
    contracts: [],
    receivables: [],
    summary: {},
    ownerPerformance: [],
  },
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
    closed: "bg-stone-900 text-white",
  };
  return `<span class="rounded-full px-3 py-1 text-xs font-semibold ${map[status] ?? "bg-stone-100 text-stone-700"}">${status}</span>`;
}

function formToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function getRouteFromHash() {
  return getRouteContextFromHash(window.location.hash);
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

function initNeutralino() {
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

function renderSidebar() {
  document.getElementById("route-nav").innerHTML = ROUTES.map(
    (route) => `
      <a href="#/${route.id}" class="nav-link ${state.route === route.id ? "is-active" : ""}">
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
    <p id="status-banner" class="text-sm text-stone-500"></p>
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
              <article class="record-card"><div class="record-card__top"><strong>Proprietarios</strong><span>${state.snapshot.owners.length}</span></div><p>Base de proprietarios administrados no sistema.</p></article>
              <article class="record-card"><div class="record-card__top"><strong>Inquilinos</strong><span>${state.snapshot.tenants.length}</span></div><p>Clientes com contratos ativos ou historico cadastrado.</p></article>
              <article class="record-card"><div class="record-card__top"><strong>Imoveis</strong><span>${state.snapshot.properties.length}</span></div><p>Unidades disponiveis e alugadas sob gestao.</p></article>
            </div>
          `
        )}
      </div>
      ${pageSection("Performance por proprietario", "Analise", ownerPerformanceTable(state.snapshot.ownerPerformance))}
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

function settingsPage() {
  return renderSettingsPage();
}

function currentRouteView() {
  if (["owners", "tenants", "properties", "contracts"].includes(state.route)) {
    if (state.routeContext.action === "list") {
      return renderCrudRoute(state.route, state.snapshot, {});
    }
    return renderCrudFormRoute(
      state.route,
      state.snapshot,
      currentCrudRecord(state.route, state.routeContext)
    );
  }
  if (state.route === "receivables") {
    return receivablesPage();
  }
  if (state.route === "settings") {
    return settingsPage();
  }
  return dashboardPage();
}

function renderCurrentRoute() {
  document.getElementById("app-view").innerHTML =
    currentRouteView() + renderDeleteModal();
  applyInputMasks(document.getElementById("app-view"), {
    storedValue: true,
  });
}

function renderApp() {
  renderSidebar();
  renderShellHeader();
  renderCurrentRoute();
  setStatus("");
}

function refreshSnapshot(snapshot) {
  state.snapshot = snapshot;
  renderApp();
}

function navigateToHash(hash) {
  if (window.location.hash === hash) {
    state.routeContext = getRouteFromHash();
    state.route = state.routeContext.route;
    renderApp();
    return;
  }
  window.location.hash = hash;
}

function currentCrudRecord(route, routeContext) {
  if (routeContext.action === "new") {
    return { id: "" };
  }
  if (routeContext.action !== "edit") {
    return null;
  }
  return (
    state.snapshot[route].find(
      (row) => String(row.id) === String(routeContext.recordId)
    ) ?? null
  );
}

function navigateToCrudCreate(entity) {
  navigateToHash(crudCreateHash(entity));
}

function navigateToCrudEdit(entity, id) {
  navigateToHash(crudEditHash(entity, id));
}

function navigateToCrudList(entity) {
  navigateToHash(crudListHash(entity));
}

function formEntity(formId) {
  const map = {
    "owner-form": "owners",
    "tenant-form": "tenants",
    "property-form": "properties",
    "contract-form": "contracts",
  };
  return map[formId];
}

function formCommand(form) {
  const entity = formEntity(form.id);
  if (!entity) {
    return null;
  }
  const id = form.querySelector('[name="id"]')?.value;
  return id ? `${entity}.update` : `${entity}.create`;
}

async function handleFormSubmit(form) {
  const entity = formEntity(form.id);
  const command = formCommand(form);
  const payload = normalizeFormPayload(form.id, formToObject(form));
  const snapshot = await state.api.request(command, payload);
  refreshSnapshot(snapshot);
  navigateToCrudList(entity);
}

function deleteCommand(entity) {
  return `${entity}.delete`;
}

function deleteLabel(entity) {
  const map = {
    owners: "este proprietario",
    tenants: "este inquilino",
    properties: "este imovel",
    contracts: "este contrato",
  };
  return map[entity] ?? "este registro";
}

function deleteImpactCopy(entity) {
  if (entity === "owners") {
    return "Ao excluir um proprietario, o sistema tambem remove os imoveis vinculados, os contratos desses imoveis e os recebiveis relacionados.";
  }
  if (entity === "properties") {
    return "Se existir vinculo impeditivo, o sistema vai bloquear a exclusao.";
  }
  if (entity === "tenants") {
    return "Se existir contrato vinculado, o sistema vai bloquear a exclusao.";
  }
  if (entity === "contracts") {
    return "Ao excluir um contrato, os recebiveis gerados por ele tambem serao removidos.";
  }
  if (entity === "settings-reset") {
    return "Essa acao apaga toda a base: proprietarios, inquilinos, imoveis, contratos e recebiveis. Nao existe desfazer.";
  }
  return "Se existir vinculo impeditivo, o sistema vai bloquear a exclusao.";
}

function openDeleteModal(entity, id) {
  state.deleteModal = { entity, id };
  renderApp();
}

function closeDeleteModal() {
  state.deleteModal = null;
  renderApp();
}

function renderDeleteModal() {
  if (!state.deleteModal) {
    return "";
  }
  return `
    <div class="modal-backdrop" data-modal-close="true">
      <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
        <p class="section-eyebrow">Confirmacao de exclusao</p>
        <h3 id="delete-modal-title" class="modal-title">Tem certeza que deseja excluir?</h3>
        <p class="modal-copy">
          Essa acao vai remover ${deleteLabel(state.deleteModal.entity)}.
        </p>
        <p class="modal-copy">
          ${deleteImpactCopy(state.deleteModal.entity)}
        </p>
        <div class="modal-actions">
          <button class="btn-secondary" data-delete-cancel="true" type="button">Cancelar</button>
          <button class="btn-danger" data-delete-confirm="true" type="button">Excluir agora</button>
        </div>
      </section>
    </div>
  `;
}

async function confirmCrudDelete() {
  const { entity, id } = state.deleteModal;
  const command =
    entity === "settings-reset" ? "settings.reset" : deleteCommand(entity);
  const payload = entity === "settings-reset" ? {} : { id };
  const snapshot = await state.api.request(command, payload);
  state.deleteModal = null;
  refreshSnapshot(snapshot);
}

async function exportBackup() {
  setStatus("Gerando backup...");
  const backup = await state.api.request("settings.export");
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "imobiliaria-backup.json";
  anchor.click();
  URL.revokeObjectURL(url);
  setStatus("Backup exportado");
}

async function importBackupFile(file) {
  setStatus("Importando backup...");
  const snapshot = await state.api.request("settings.import", {
    backup: JSON.parse(await file.text()),
  });
  refreshSnapshot(snapshot);
  setStatus("Backup importado");
}

async function runUiTask(task) {
  try {
    await task();
  } catch (error) {
    setStatus(error.message);
  }
}

function attachSubmitEvents() {
  document.body.addEventListener("submit", async (event) => {
    const form = event.target;
    if (!formEntity(form.id)) {
      return;
    }
    event.preventDefault();
    await runUiTask(() => handleFormSubmit(form));
  });
}

function attachClickEvents() {
  document.body.addEventListener("click", async (event) => {
    const createButton = event.target.closest(".crud-create-button");
    if (createButton) {
      navigateToCrudCreate(createButton.dataset.entity);
      return;
    }

    const editButton = event.target.closest(".crud-edit-button");
    if (editButton) {
      navigateToCrudEdit(editButton.dataset.entity, editButton.dataset.id);
      return;
    }

    const cancelButton = event.target.closest(".crud-cancel-button");
    if (cancelButton) {
      navigateToCrudList(cancelButton.dataset.entity);
      return;
    }

    const deleteButton = event.target.closest(".crud-delete-button");
    if (deleteButton) {
      openDeleteModal(deleteButton.dataset.entity, deleteButton.dataset.id);
      return;
    }

    if (event.target.matches("[data-modal-close]")) {
      closeDeleteModal();
      return;
    }

    if (event.target.closest("[data-delete-cancel]")) {
      closeDeleteModal();
      return;
    }

    if (event.target.closest("[data-delete-confirm]")) {
      await runUiTask(confirmCrudDelete);
      return;
    }

    const payButton = event.target.closest(".pay-button");
    if (payButton) {
      await runUiTask(async () => {
        const snapshot = await state.api.request("receivables.pay", {
          id: payButton.dataset.id,
        });
        refreshSnapshot(snapshot);
      });
      return;
    }

    if (event.target.id === "seed-demo") {
      await runUiTask(async () => {
        refreshSnapshot(await state.api.request("seedDemo"));
      });
      return;
    }

    if (event.target.id === "settings-export") {
      await runUiTask(exportBackup);
      return;
    }

    if (event.target.id === "settings-reset") {
      openDeleteModal("settings-reset", "all");
    }
  });
}

function attachChangeEvents() {
  document.body.addEventListener("change", async (event) => {
    if (event.target.id === "settings-import-file") {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      await runUiTask(() => importBackupFile(file));
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
    if (!selected?.dataset?.rent || !rentField || rentField.value) {
      return;
    }
    rentField.value = selected.dataset.rent;
    applyInputMask(rentField, { storedValue: true });
  });
}

function attachInputEvents() {
  document.body.addEventListener("input", (event) => {
    if (event.target.matches("[data-mask]")) {
      applyInputMask(event.target);
    }
  });

  document.body.addEventListener(
    "blur",
    (event) => {
      if (event.target.matches("[data-mask]")) {
        applyInputMask(event.target);
      }
    },
    true
  );
}

function attachGlobalEvents() {
  window.addEventListener("hashchange", () => {
    state.routeContext = getRouteFromHash();
    state.route = state.routeContext.route;
    renderApp();
  });

  document.body.addEventListener("keydown", async (event) => {
    await handleClipboardShortcut(event, Neutralino.clipboard);
  });
}

function attachEvents() {
  attachSubmitEvents();
  attachClickEvents();
  attachChangeEvents();
  attachInputEvents();
  attachGlobalEvents();
}

async function main() {
  try {
    initNeutralino();
    state.api = createBackendClient();
    attachEvents();
    state.routeContext = getRouteFromHash();
    state.route = state.routeContext.route;
    refreshSnapshot(await state.api.request("bootstrap"));
  } catch (error) {
    setStatus(error.message);
    document.getElementById("app-view").innerHTML = pageSection(
      "Falha na inicializacao",
      "Sistema",
      emptyState(error.message)
    );
  }
}

main();
