import {
  buildListingView,
  createInitialListingState,
} from "./listing-state.js";
import { translateReceivableStatus } from "./receivable-status-label.js";
import { translateSystemStatus } from "./system-status-label.js";

function currency(value = 0) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function statusPill(status, label = status) {
  const map = {
    paid: "bg-emerald-100 text-emerald-800",
    pending: "bg-amber-100 text-amber-900",
    overdue: "bg-rose-100 text-rose-800",
    rented: "bg-stone-900 text-white",
    available: "bg-stone-100 text-stone-700",
    active: "bg-emerald-100 text-emerald-800",
    inactive: "bg-stone-100 text-stone-700",
    closed: "bg-stone-900 text-white",
  };
  return `<span class="rounded-full px-3 py-1 text-xs font-semibold ${map[status] ?? "bg-stone-100 text-stone-700"}">${label}</span>`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function emptyState(message) {
  return `<div class="empty-state">${message}</div>`;
}

function pageSection(title, description, content, actions = "") {
  return `
    <section class="panel page-section">
      <div class="section-heading">
        <div>
          <p class="section-eyebrow">${description}</p>
          <h3 class="section-title">${title}</h3>
        </div>
        ${actions}
      </div>
      ${content}
    </section>
  `;
}

function listSectionActions(primaryAction, exportActions) {
  return `
    <div class="section-actions">
      <div class="section-actions__primary">${primaryAction}</div>
      <div class="section-actions__secondary">${exportActions}</div>
    </div>
  `;
}

function listPageSection(title, description, content, primaryAction, route) {
  return pageSection(
    title,
    description,
    content,
    listSectionActions(primaryAction, renderReportExportActions(route))
  );
}

function listingSelectOptions(options, selectedValue) {
  return options
    .map(
      (option) => `
        <option value="${escapeHtml(option.value)}" ${selectedOption(selectedValue, option.value)}>
          ${escapeHtml(option.label)}
        </option>
      `
    )
    .join("");
}

function listingSummary(view) {
  return `
    <div class="listing-summary">
      <strong>${view.filteredItems}</strong> de <strong>${view.totalItems}</strong> registro(s)
    </div>
  `;
}

function uniqueListingSearchOptions(values) {
  return [...new Set(values.filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, "pt-BR"))
    .map(
      (value) =>
        `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`
    )
    .join("");
}

function listingSearchOptions(route, rows) {
  if (route === "owners" || route === "tenants") {
    return uniqueListingSearchOptions(
      rows.flatMap((row) => [row.name, row.document, row.phone, row.email])
    );
  }
  if (route === "properties") {
    return uniqueListingSearchOptions(
      rows.flatMap((row) => [
        row.code,
        row.title,
        row.owner_name,
        row.city,
        row.state,
      ])
    );
  }
  if (route === "contracts") {
    return uniqueListingSearchOptions(
      rows.flatMap((row) => [
        row.property_code,
        row.property_title,
        row.tenant_name,
        row.start_date,
        row.end_date,
      ])
    );
  }
  return uniqueListingSearchOptions(
    rows.flatMap((row) => [
      row.reference_month,
      row.property_code,
      row.property_title,
      row.tenant_name,
      row.due_date,
    ])
  );
}

function listingToolbar(route, view, rows) {
  return `
    <div class="listing-toolbar">
      <label class="field-block listing-toolbar__search">
        <span class="field-label">Busca</span>
        <div
          class="search-select"
          data-searchable-select
          data-searchable-free-text="true"
          data-free-text-value="${escapeHtml(view.activeSearch)}"
        >
          <input
            class="field search-select__input"
            data-searchable-input
            data-listing-search="${route}"
            data-search-placeholder="${escapeHtml(view.searchPlaceholder)}"
            type="search"
            autocomplete="off"
            placeholder="${escapeHtml(view.searchPlaceholder)}"
            value="${escapeHtml(view.activeSearch)}"
          />
          <div class="search-select__menu" data-searchable-menu></div>
          <select
            class="search-select__native"
            data-searchable-native
            data-listing-search-native="${route}"
            tabindex="-1"
            aria-hidden="true"
          >
            <option value=""></option>
            ${listingSearchOptions(route, rows)}
          </select>
        </div>
      </label>
      <label class="field-block listing-toolbar__filter">
        <span class="field-label">${escapeHtml(view.filterLabel)}</span>
        <select class="field" data-listing-filter="${route}">
          ${listingSelectOptions(view.filters, view.activeFilter)}
        </select>
      </label>
      <label class="field-block listing-toolbar__sort">
        <span class="field-label">Ordenacao</span>
        <select class="field" data-listing-sort="${route}">
          ${listingSelectOptions(view.sorts, view.activeSort)}
        </select>
      </label>
    </div>
  `;
}

function sortIndicator(direction) {
  return direction === "desc" ? "↓" : "↑";
}

function sortableHeaderButton(route, column, activeSort) {
  const isActive = activeSort.startsWith(`${column.sortField}:`);
  const nextDirection = isActive
    ? activeSort.endsWith(":desc")
      ? "asc"
      : "desc"
    : column.defaultDirection;
  const indicator = isActive ? sortIndicator(activeSort.split(":")[1]) : "↕";
  const activeClass = isActive ? " text-stone-950" : " text-stone-500";
  return `
    <button
      class="inline-flex items-center gap-1 font-medium${activeClass}"
      data-listing-header-sort="${route}"
      data-sort-field="${column.sortField}"
      data-sort-direction="${nextDirection}"
      type="button"
    >
      <span>${escapeHtml(column.label)}</span>
      <span aria-hidden="true">${indicator}</span>
    </button>
  `;
}

function renderTableHeaderCell(route, column, activeSort) {
  if (!column.sortField) {
    return `<th class="px-3 py-3 font-medium">${escapeHtml(column.label)}</th>`;
  }
  return `
    <th class="px-3 py-3 font-medium">
      ${sortableHeaderButton(route, column, activeSort)}
    </th>
  `;
}

function listingPagination(route, view) {
  if (view.totalPages <= 1) {
    return "";
  }
  return `
    <div class="listing-pagination">
      <button
        class="btn-secondary !px-3 !py-2 text-xs"
        data-listing-page="${route}"
        data-page="${view.page - 1}"
        type="button"
        ${view.page === 1 ? "disabled" : ""}
      >
        Anterior
      </button>
      <span class="listing-pagination__status">Pagina ${view.page} de ${view.totalPages}</span>
      <button
        class="btn-secondary !px-3 !py-2 text-xs"
        data-listing-page="${route}"
        data-page="${view.page + 1}"
        type="button"
        ${view.page === view.totalPages ? "disabled" : ""}
      >
        Proxima
      </button>
    </div>
  `;
}

function managedTableSection(
  route,
  listingState,
  title,
  description,
  rows,
  body,
  cta
) {
  const view = buildListingView(route, rows, listingState);
  const content = [
    listingToolbar(route, view, rows),
    listingSummary(view),
    `<div class="table-shell">${crudTable(route, view.columns, view.activeSort, body(view.rows))}</div>`,
    listingPagination(route, view),
  ].join("");
  return listPageSection(title, description, content, cta, route);
}

function backButton(route) {
  return `
    <a class="btn-secondary" href="#/${route}" onclick="window.__appNavigate('#/${route}'); return false;">
      Voltar para a listagem
    </a>
  `;
}

function fieldValue(value, fallback = "") {
  return escapeHtml(value ?? fallback);
}

function selectedOption(value, expected) {
  return String(value ?? "") === String(expected) ? "selected" : "";
}

function searchableSelectField(
  label,
  name,
  placeholder,
  options,
  attributes = ""
) {
  return `
    <label class="field-block">
      <span class="field-label">${label}</span>
      <div class="search-select" data-searchable-select>
        <input
          class="field search-select__input"
          data-searchable-input
          data-search-placeholder="${escapeHtml(placeholder)}"
          type="text"
          autocomplete="off"
          placeholder="${escapeHtml(placeholder)}"
        />
        <div class="search-select__menu" data-searchable-menu></div>
        <select
          class="search-select__native"
          data-searchable-native
          tabindex="-1"
          aria-hidden="true"
          name="${name}"
          ${attributes}
        >
          ${options}
        </select>
      </div>
    </label>
  `;
}

function actionButtons(entity, id) {
  return `
    <div class="row-actions">
      <a class="btn-warning !px-3 !py-2 text-xs" href="#/${entity}/${id}/edit" onclick="window.__appOpenCrudEdit('${entity}', '${id}'); return false;">
        Editar
      </a>
      <button class="btn-danger crud-delete-button !px-3 !py-2 text-xs" data-entity="${entity}" data-id="${id}" type="button">
        Excluir
      </button>
    </div>
  `;
}

function editorActions(entity, isEditing) {
  if (!isEditing) {
    return "";
  }
  return `
    <a class="btn-secondary" href="#/${entity}" onclick="window.__appCloseCrudEditor('${entity}'); return false;">
      Cancelar edicao
    </a>
  `;
}

function createButton(entity, label) {
  return `
    <a class="btn-primary" href="#/${entity}/new" onclick="window.__appOpenCrudCreate('${entity}'); return false;">
      ${label}
    </a>
  `;
}

/**
 * Renders the report export actions for a CRUD list route.
 * Example: renderReportExportActions("owners");
 */
export function renderReportExportActions(route) {
  return `
    <div class="row-actions">
      <button class="btn-secondary !px-3 !py-2 text-xs" data-report-export="${route}" data-report-format="excel" type="button">
        Excel
      </button>
      <button class="btn-secondary !px-3 !py-2 text-xs" data-report-export="${route}" data-report-format="pdf" type="button">
        PDF
      </button>
      <button class="btn-secondary !px-3 !py-2 text-xs" data-report-export="${route}" data-report-format="csv" type="button">
        CSV
      </button>
    </div>
  `;
}

export function renderOwnerPerformanceTable(rows) {
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
                  <td class="px-3 py-4 font-medium">${escapeHtml(row.name)}</td>
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

function ownerForm(editor) {
  const isEditing = Boolean(editor?.id);
  return `
    <form id="owner-form" class="form-stack" onsubmit="window.__appSubmitForm(event, 'owner-form'); return false;">
      <input name="id" type="hidden" value="${fieldValue(editor?.id)}" />
      <label class="field-block">
        <span class="field-label">Nome completo</span>
        <input class="field" name="name" placeholder="Ex.: Mariana Costa" required value="${fieldValue(editor?.name)}" />
      </label>
      <div class="grid gap-3 md:grid-cols-2">
        <label class="field-block">
          <span class="field-label">CPF ou CNPJ</span>
          <input class="field" data-mask="document" name="document" inputmode="numeric" placeholder="000.000.000-00" value="${fieldValue(editor?.document)}" />
        </label>
        <label class="field-block">
          <span class="field-label">Telefone</span>
          <input class="field" data-mask="phone" name="phone" inputmode="tel" placeholder="(11) 99999-9999" value="${fieldValue(editor?.phone)}" />
        </label>
      </div>
      <label class="field-block">
        <span class="field-label">E-mail</span>
        <input class="field" name="email" type="email" placeholder="nome@empresa.com.br" value="${fieldValue(editor?.email)}" />
      </label>
      <label class="field-block">
        <span class="field-label">Observacoes</span>
        <textarea class="field field-area" name="notes" placeholder="Informacoes relevantes sobre o proprietario">${fieldValue(editor?.notes)}</textarea>
      </label>
      <button class="btn-primary w-full" type="submit">
        ${isEditing ? "Salvar alteracoes" : "Salvar proprietario"}
      </button>
    </form>
  `;
}

function ownerRows(owners) {
  if (!owners.length) {
    return emptyState("Nenhum proprietario cadastrado.");
  }
  return owners
    .map(
      (owner) => `
        <tr class="border-b border-stone-100">
          <td class="px-3 py-4 font-medium text-stone-950">${escapeHtml(owner.name)}</td>
          <td class="px-3 py-4">${escapeHtml(owner.document ?? "Sem documento")}</td>
          <td class="px-3 py-4">${escapeHtml(owner.phone ?? "Sem telefone")}</td>
          <td class="px-3 py-4">${escapeHtml(owner.email ?? "Sem e-mail")}</td>
          <td class="px-3 py-4">${statusPill("active", translateSystemStatus("active"))}</td>
          <td class="px-3 py-4">${actionButtons("owners", owner.id)}</td>
        </tr>
      `
    )
    .join("");
}

function ownersPage(snapshot, editor, listingState) {
  const isEditing = Boolean(editor?.id);
  const formSection = pageSection(
    isEditing ? "Editar proprietario" : "Novo proprietario",
    "Cadastro com contato e documento",
    ownerForm(editor ?? { id: "" }),
    editorActions("owners", isEditing)
  );

  return `
    <div class="page-stack">
      ${managedTableSection(
        "owners",
        listingState,
        "Lista de proprietarios",
        `${snapshot.owners.length} registro(s) na base`,
        snapshot.owners,
        ownerRows,
        createButton("owners", "Novo proprietario")
      )}
      ${formSection}
    </div>
  `;
}

function tenantForm(editor) {
  const isEditing = Boolean(editor?.id);
  return `
    <form id="tenant-form" class="form-stack" onsubmit="window.__appSubmitForm(event, 'tenant-form'); return false;">
      <input name="id" type="hidden" value="${fieldValue(editor?.id)}" />
      <label class="field-block">
        <span class="field-label">Nome completo</span>
        <input class="field" name="name" placeholder="Ex.: Carlos Menezes" required value="${fieldValue(editor?.name)}" />
      </label>
      <div class="grid gap-3 md:grid-cols-2">
        <label class="field-block">
          <span class="field-label">CPF</span>
          <input class="field" data-mask="document" name="document" inputmode="numeric" placeholder="000.000.000-00" value="${fieldValue(editor?.document)}" />
        </label>
        <label class="field-block">
          <span class="field-label">Telefone</span>
          <input class="field" data-mask="phone" name="phone" inputmode="tel" placeholder="(11) 99999-9999" value="${fieldValue(editor?.phone)}" />
        </label>
      </div>
      <label class="field-block">
        <span class="field-label">E-mail</span>
        <input class="field" name="email" type="email" placeholder="cliente@email.com" value="${fieldValue(editor?.email)}" />
      </label>
      ${searchableSelectField(
        "Status",
        "status",
        "Buscar status...",
        `
          <option value="active" ${selectedOption(editor?.status ?? "active", "active")}>Ativo</option>
          <option value="inactive" ${selectedOption(editor?.status, "inactive")}>Inativo</option>
        `
      )}
      <button class="btn-primary w-full" type="submit">
        ${isEditing ? "Salvar alteracoes" : "Salvar inquilino"}
      </button>
    </form>
  `;
}

function tenantRows(tenants) {
  if (!tenants.length) {
    return emptyState("Nenhum inquilino cadastrado.");
  }
  return tenants
    .map(
      (tenant) => `
        <tr class="border-b border-stone-100">
          <td class="px-3 py-4 font-medium text-stone-950">${escapeHtml(tenant.name)}</td>
          <td class="px-3 py-4">${escapeHtml(tenant.document ?? "Sem documento")}</td>
          <td class="px-3 py-4">${escapeHtml(tenant.phone ?? "Sem telefone")}</td>
          <td class="px-3 py-4">${escapeHtml(tenant.email ?? "Sem e-mail")}</td>
          <td class="px-3 py-4">${statusPill(tenant.status ?? "active", translateSystemStatus(tenant.status ?? "active"))}</td>
          <td class="px-3 py-4">${actionButtons("tenants", tenant.id)}</td>
        </tr>
      `
    )
    .join("");
}

function propertyOwnerOptions(owners, selectedId) {
  return ['<option value="">Selecione o proprietario</option>']
    .concat(
      owners.map(
        (owner) =>
          `<option value="${owner.id}" ${selectedOption(selectedId, owner.id)}>${escapeHtml(owner.name)}</option>`
      )
    )
    .join("");
}

function propertyForm(snapshot, editor) {
  const isEditing = Boolean(editor?.id);
  return `
    <form id="property-form" class="form-stack" onsubmit="window.__appSubmitForm(event, 'property-form'); return false;">
      <input name="id" type="hidden" value="${fieldValue(editor?.id)}" />
      ${searchableSelectField(
        "Proprietario",
        "owner_id",
        "Buscar proprietario...",
        propertyOwnerOptions(snapshot.owners, editor?.owner_id),
        "required"
      )}
      <div class="grid gap-3 md:grid-cols-2">
        <label class="field-block">
          <span class="field-label">Codigo interno</span>
          <input class="field" data-mask="code" name="code" placeholder="APT-101" required value="${fieldValue(editor?.code)}" />
        </label>
        ${searchableSelectField(
          "Status do imovel",
          "status",
          "Buscar status...",
          `
            <option value="available" ${selectedOption(editor?.status ?? "available", "available")}>Disponivel</option>
            <option value="rented" ${selectedOption(editor?.status, "rented")}>Alugado</option>
          `
        )}
      </div>
      <label class="field-block">
        <span class="field-label">Nome comercial</span>
        <input class="field" name="title" placeholder="Apartamento Centro" required value="${fieldValue(editor?.title)}" />
      </label>
      <label class="field-block">
        <span class="field-label">Endereco</span>
        <input class="field" name="address" placeholder="Rua das Palmeiras, 101" required value="${fieldValue(editor?.address)}" />
      </label>
      <div class="grid gap-3 md:grid-cols-2">
        <label class="field-block">
          <span class="field-label">Cidade</span>
          <input class="field" name="city" placeholder="Sao Paulo" required value="${fieldValue(editor?.city)}" />
        </label>
        <label class="field-block">
          <span class="field-label">UF</span>
          <input class="field" data-mask="state" name="state" placeholder="SP" maxlength="2" required value="${fieldValue(editor?.state)}" />
        </label>
      </div>
      <label class="field-block">
        <span class="field-label">Aluguel mensal</span>
        <input class="field" data-mask="currency" name="monthly_rent" inputmode="numeric" placeholder="R$ 0,00" required value="${fieldValue(editor?.monthly_rent)}" />
      </label>
      <button class="btn-primary w-full" type="submit">
        ${isEditing ? "Salvar alteracoes" : "Salvar imovel"}
      </button>
    </form>
  `;
}

function propertyRows(properties) {
  if (!properties.length) {
    return emptyState("Nenhum imovel cadastrado.");
  }
  return properties
    .map(
      (property) => `
        <tr class="border-b border-stone-100">
          <td class="px-3 py-4 font-medium text-stone-950">${escapeHtml(property.code)}</td>
          <td class="px-3 py-4">${escapeHtml(property.title)}</td>
          <td class="px-3 py-4">${escapeHtml(property.owner_name)}</td>
          <td class="px-3 py-4">${escapeHtml(property.city)}/${escapeHtml(property.state)}</td>
          <td class="px-3 py-4">${currency(property.monthly_rent)}</td>
          <td class="px-3 py-4">${statusPill(property.status, translateSystemStatus(property.status))}</td>
          <td class="px-3 py-4">${actionButtons("properties", property.id)}</td>
        </tr>
      `
    )
    .join("");
}

function contractTenantOptions(tenants, selectedId) {
  return ['<option value="">Selecione o inquilino</option>']
    .concat(
      tenants.map(
        (tenant) =>
          `<option value="${tenant.id}" ${selectedOption(selectedId, tenant.id)}>${escapeHtml(tenant.name)}</option>`
      )
    )
    .join("");
}

function contractPropertyOptions(properties, selectedId) {
  return ['<option value="">Selecione o imovel</option>']
    .concat(
      properties.map(
        (property) =>
          `<option value="${property.id}" data-rent="${property.monthly_rent}" ${selectedOption(selectedId, property.id)}>${escapeHtml(property.code)} · ${escapeHtml(property.title)}</option>`
      )
    )
    .join("");
}

function contractForm(snapshot, editor) {
  const isEditing = Boolean(editor?.id);
  return `
    <form id="contract-form" class="form-stack" onsubmit="window.__appSubmitForm(event, 'contract-form'); return false;">
      <input name="id" type="hidden" value="${fieldValue(editor?.id)}" />
      ${searchableSelectField(
        "Imovel",
        "property_id",
        "Buscar imovel...",
        contractPropertyOptions(snapshot.properties, editor?.property_id),
        'id="contract-property-select" required'
      )}
      ${searchableSelectField(
        "Inquilino",
        "tenant_id",
        "Buscar inquilino...",
        contractTenantOptions(snapshot.tenants, editor?.tenant_id),
        "required"
      )}
      <div class="grid gap-3 md:grid-cols-2">
        <label class="field-block">
          <span class="field-label">Inicio</span>
          <input class="field" name="start_date" type="date" required value="${fieldValue(editor?.start_date)}" />
        </label>
        <label class="field-block">
          <span class="field-label">Fim</span>
          <input class="field" name="end_date" type="date" required value="${fieldValue(editor?.end_date)}" />
        </label>
      </div>
      <div class="grid gap-3 md:grid-cols-3">
        <label class="field-block">
          <span class="field-label">Vencimento</span>
          <input class="field" name="due_day" type="number" min="1" max="31" placeholder="5" required value="${fieldValue(editor?.due_day)}" />
        </label>
        <label class="field-block">
          <span class="field-label">Aluguel</span>
          <input class="field" data-mask="currency" name="rent_amount" inputmode="numeric" placeholder="R$ 0,00" required value="${fieldValue(editor?.rent_amount)}" />
        </label>
        <label class="field-block">
          <span class="field-label">Caucao</span>
          <input class="field" data-mask="currency" name="deposit_amount" inputmode="numeric" placeholder="R$ 0,00" value="${fieldValue(editor?.deposit_amount)}" />
        </label>
      </div>
      ${searchableSelectField(
        "Status",
        "status",
        "Buscar status...",
        `
          <option value="active" ${selectedOption(editor?.status ?? "active", "active")}>Ativo</option>
          <option value="closed" ${selectedOption(editor?.status, "closed")}>Encerrado</option>
        `
      )}
      <button class="btn-primary w-full" type="submit">
        ${isEditing ? "Salvar alteracoes" : "Criar contrato"}
      </button>
    </form>
  `;
}

function contractRows(contracts) {
  if (!contracts.length) {
    return emptyState("Nenhum contrato cadastrado.");
  }
  return contracts
    .map(
      (contract) => `
        <tr class="border-b border-stone-100">
          <td class="px-3 py-4 font-medium text-stone-950">${escapeHtml(contract.property_code)} · ${escapeHtml(contract.property_title)}</td>
          <td class="px-3 py-4">${escapeHtml(contract.tenant_name)}</td>
          <td class="px-3 py-4">${escapeHtml(contract.start_date)} ate ${escapeHtml(contract.end_date)}</td>
          <td class="px-3 py-4">Dia ${escapeHtml(contract.due_day)}</td>
          <td class="px-3 py-4">${currency(contract.rent_amount)}</td>
          <td class="px-3 py-4">${statusPill(contract.status, translateSystemStatus(contract.status))}</td>
          <td class="px-3 py-4">${actionButtons("contracts", contract.id)}</td>
        </tr>
      `
    )
    .join("");
}

function receivableRows(receivables) {
  if (!receivables.length) {
    return emptyState("Nenhuma conta a receber cadastrada.");
  }
  return receivables
    .map(
      (row) => `
        <tr class="border-b border-stone-100">
          <td class="px-3 py-4">${escapeHtml(row.reference_month)}</td>
          <td class="px-3 py-4">${escapeHtml(row.property_code)} · ${escapeHtml(row.property_title)}</td>
          <td class="px-3 py-4">${escapeHtml(row.tenant_name)}</td>
          <td class="px-3 py-4">${escapeHtml(row.due_date)}</td>
          <td class="px-3 py-4 font-medium">${currency(row.amount)}</td>
          <td class="px-3 py-4">${statusPill(row.status_label, translateReceivableStatus(row.status_label))}</td>
          <td class="px-3 py-4">
            ${
              row.status_label === "paid"
                ? `<button class="btn-secondary receivable-unpay-button !px-3 !py-2 text-xs" data-id="${row.id}" type="button">Cancelar</button>`
                : `<button class="btn-secondary pay-button !px-3 !py-2 text-xs" data-id="${row.id}" type="button">Registrar pagamento</button>`
            }
          </td>
        </tr>
      `
    )
    .join("");
}

function contractsPage(snapshot, editor, listingState) {
  const isEditing = Boolean(editor?.id);
  const formSection = pageSection(
    isEditing ? "Editar contrato" : "Novo contrato",
    "Locacao com recebiveis automaticos",
    contractForm(snapshot, editor ?? { id: "" }),
    editorActions("contracts", isEditing)
  );

  return `
    <div class="page-stack">
      ${managedTableSection(
        "contracts",
        listingState,
        "Contratos",
        `${snapshot.contracts.length} registro(s) na operacao`,
        snapshot.contracts,
        contractRows,
        createButton("contracts", "Novo contrato")
      )}
      ${formSection}
    </div>
  `;
}

function propertiesPage(snapshot, editor, listingState) {
  const isEditing = Boolean(editor?.id);
  const formSection = pageSection(
    isEditing ? "Editar imovel" : "Novo imovel",
    "Patrimonio com proprietario e aluguel base",
    propertyForm(snapshot, editor ?? { id: "" }),
    editorActions("properties", isEditing)
  );

  return `
    <div class="page-stack">
      ${managedTableSection(
        "properties",
        listingState,
        "Portfolio de imoveis",
        `${snapshot.properties.length} unidade(s) administrada(s)`,
        snapshot.properties,
        propertyRows,
        createButton("properties", "Novo imovel")
      )}
      ${formSection}
    </div>
  `;
}

function tenantsPage(snapshot, editor, listingState) {
  const isEditing = Boolean(editor?.id);
  const formSection = pageSection(
    isEditing ? "Editar inquilino" : "Novo inquilino",
    "Cadastro com status de relacionamento",
    tenantForm(editor ?? { id: "" }),
    editorActions("tenants", isEditing)
  );

  return `
    <div class="page-stack">
      ${managedTableSection(
        "tenants",
        listingState,
        "Lista de inquilinos",
        `${snapshot.tenants.length} registro(s) na base`,
        snapshot.tenants,
        tenantRows,
        createButton("tenants", "Novo inquilino")
      )}
      ${formSection}
    </div>
  `;
}

function crudTable(route, columns, activeSort, body) {
  if (body.startsWith("<div")) {
    return body;
  }
  return `
    <table class="min-w-full text-left text-sm">
      <thead class="text-stone-500">
        <tr class="border-b border-stone-200">
          ${columns
            .map((column) => renderTableHeaderCell(route, column, activeSort))
            .join("")}
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

export function renderCrudRoute(route, snapshot, editors, listingStates) {
  const views = listingStates ?? {
    owners: createInitialListingState("owners"),
    tenants: createInitialListingState("tenants"),
    properties: createInitialListingState("properties"),
    contracts: createInitialListingState("contracts"),
  };
  if (route === "owners") {
    return ownersPage(snapshot, editors.owners, views.owners);
  }
  if (route === "tenants") {
    return tenantsPage(snapshot, editors.tenants, views.tenants);
  }
  if (route === "properties") {
    return propertiesPage(snapshot, editors.properties, views.properties);
  }
  if (route === "contracts") {
    return contractsPage(snapshot, editors.contracts, views.contracts);
  }
  return "";
}

/**
 * Renders the receivables list with the shared listing controls.
 * Example: renderReceivablesRoute(snapshot, viewState)
 */
export function renderReceivablesRoute(snapshot, listingState) {
  const viewState = listingState ?? createInitialListingState("receivables");
  return `
    <div class="page-stack">
      ${managedTableSection(
        "receivables",
        viewState,
        "Contas a receber",
        "Financeiro",
        snapshot.receivables,
        receivableRows,
        ""
      )}
      ${pageSection("Relatorio por proprietario", "Consolidado", renderOwnerPerformanceTable(snapshot.ownerPerformance))}
    </div>
  `;
}

export function renderCrudFormRoute(route, snapshot, editor) {
  if (route === "owners") {
    return pageSection(
      editor?.id ? "Editar proprietario" : "Novo proprietario",
      "Cadastro com contato e documento",
      ownerForm(editor),
      [backButton(route), editor?.id ? editorActions("owners", true) : ""].join(
        ""
      )
    );
  }
  if (route === "tenants") {
    return pageSection(
      editor?.id ? "Editar inquilino" : "Novo inquilino",
      "Cadastro com status de relacionamento",
      tenantForm(editor),
      [
        backButton(route),
        editor?.id ? editorActions("tenants", true) : "",
      ].join("")
    );
  }
  if (route === "properties") {
    return pageSection(
      editor?.id ? "Editar imovel" : "Novo imovel",
      "Patrimonio com proprietario e aluguel base",
      propertyForm(snapshot, editor),
      [
        backButton(route),
        editor?.id ? editorActions("properties", true) : "",
      ].join("")
    );
  }
  if (route === "contracts") {
    return pageSection(
      editor?.id ? "Editar contrato" : "Novo contrato",
      "Locacao com recebiveis automaticos",
      contractForm(snapshot, editor),
      [
        backButton(route),
        editor?.id ? editorActions("contracts", true) : "",
      ].join("")
    );
  }
  return "";
}
