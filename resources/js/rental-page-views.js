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
    inactive: "bg-stone-100 text-stone-700",
    closed: "bg-stone-900 text-white",
  };
  return `<span class="rounded-full px-3 py-1 text-xs font-semibold ${map[status] ?? "bg-stone-100 text-stone-700"}">${status}</span>`;
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

function backButton(route) {
  return `
    <a class="btn-secondary" href="#/${route}">
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

function actionButtons(entity, id) {
  return `
    <div class="row-actions">
      <button class="btn-warning crud-edit-button !px-3 !py-2 text-xs" data-entity="${entity}" data-id="${id}" type="button">
        Editar
      </button>
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
    <button class="btn-secondary crud-cancel-button" data-entity="${entity}" type="button">
      Cancelar edicao
    </button>
  `;
}

function createButton(entity, label) {
  return `
    <button class="btn-primary crud-create-button" data-entity="${entity}" type="button">
      ${label}
    </button>
  `;
}

function ownerForm(editor) {
  const isEditing = Boolean(editor);
  return `
    <form id="owner-form" class="form-stack">
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
          <td class="px-3 py-4">${statusPill("active")}</td>
          <td class="px-3 py-4">${actionButtons("owners", owner.id)}</td>
        </tr>
      `
    )
    .join("");
}

function ownersPage(snapshot, editor) {
  const isEditing = Boolean(editor?.id);
  const formSection = editor
    ? pageSection(
        isEditing ? "Editar proprietario" : "Novo proprietario",
        "Cadastro com contato e documento",
        ownerForm(editor),
        editorActions("owners", isEditing)
      )
    : "";

  return `
    <div class="page-stack">
      ${pageSection(
        "Lista de proprietarios",
        `${snapshot.owners.length} registro(s) na base`,
        `<div class="table-shell">${crudTable(["Nome", "Documento", "Telefone", "E-mail", "Status", ""], ownerRows(snapshot.owners))}</div>`,
        createButton("owners", "Novo proprietario")
      )}
      ${formSection}
    </div>
  `;
}

function tenantForm(editor) {
  const isEditing = Boolean(editor);
  return `
    <form id="tenant-form" class="form-stack">
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
      <label class="field-block">
        <span class="field-label">Status</span>
        <select class="field" name="status">
          <option value="active" ${selectedOption(editor?.status ?? "active", "active")}>Ativo</option>
          <option value="inactive" ${selectedOption(editor?.status, "inactive")}>Inativo</option>
        </select>
      </label>
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
          <td class="px-3 py-4">${statusPill(tenant.status ?? "active")}</td>
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
  const isEditing = Boolean(editor);
  return `
    <form id="property-form" class="form-stack">
      <input name="id" type="hidden" value="${fieldValue(editor?.id)}" />
      <label class="field-block">
        <span class="field-label">Proprietario</span>
        <select class="field" name="owner_id" required>${propertyOwnerOptions(snapshot.owners, editor?.owner_id)}</select>
      </label>
      <div class="grid gap-3 md:grid-cols-2">
        <label class="field-block">
          <span class="field-label">Codigo interno</span>
          <input class="field" data-mask="code" name="code" placeholder="APT-101" required value="${fieldValue(editor?.code)}" />
        </label>
        <label class="field-block">
          <span class="field-label">Status do imovel</span>
          <select class="field" name="status">
            <option value="available" ${selectedOption(editor?.status ?? "available", "available")}>Disponivel</option>
            <option value="rented" ${selectedOption(editor?.status, "rented")}>Alugado</option>
          </select>
        </label>
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
          <td class="px-3 py-4">${statusPill(property.status)}</td>
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
  const isEditing = Boolean(editor);
  return `
    <form id="contract-form" class="form-stack">
      <input name="id" type="hidden" value="${fieldValue(editor?.id)}" />
      <label class="field-block">
        <span class="field-label">Imovel</span>
        <select class="field" name="property_id" id="contract-property-select" required>${contractPropertyOptions(snapshot.properties, editor?.property_id)}</select>
      </label>
      <label class="field-block">
        <span class="field-label">Inquilino</span>
        <select class="field" name="tenant_id" required>${contractTenantOptions(snapshot.tenants, editor?.tenant_id)}</select>
      </label>
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
      <label class="field-block">
        <span class="field-label">Status</span>
        <select class="field" name="status">
          <option value="active" ${selectedOption(editor?.status ?? "active", "active")}>Ativo</option>
          <option value="closed" ${selectedOption(editor?.status, "closed")}>Encerrado</option>
        </select>
      </label>
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
          <td class="px-3 py-4">${statusPill(contract.status)}</td>
          <td class="px-3 py-4">${actionButtons("contracts", contract.id)}</td>
        </tr>
      `
    )
    .join("");
}

function contractsPage(snapshot, editor) {
  const isEditing = Boolean(editor?.id);
  const formSection = editor
    ? pageSection(
        isEditing ? "Editar contrato" : "Novo contrato",
        "Locacao com recebiveis automaticos",
        contractForm(snapshot, editor),
        editorActions("contracts", isEditing)
      )
    : "";

  return `
    <div class="page-stack">
      ${pageSection(
        "Contratos",
        `${snapshot.contracts.length} registro(s) na operacao`,
        `<div class="table-shell">${crudTable(["Imovel", "Inquilino", "Periodo", "Vencimento", "Valor", "Status", ""], contractRows(snapshot.contracts))}</div>`,
        createButton("contracts", "Novo contrato")
      )}
      ${formSection}
    </div>
  `;
}

function propertiesPage(snapshot, editor) {
  const isEditing = Boolean(editor?.id);
  const formSection = editor
    ? pageSection(
        isEditing ? "Editar imovel" : "Novo imovel",
        "Patrimonio com proprietario e aluguel base",
        propertyForm(snapshot, editor),
        editorActions("properties", isEditing)
      )
    : "";

  return `
    <div class="page-stack">
      ${pageSection(
        "Portfolio de imoveis",
        `${snapshot.properties.length} unidade(s) administrada(s)`,
        `<div class="table-shell">${crudTable(["Codigo", "Nome", "Proprietario", "Cidade/UF", "Aluguel", "Status", ""], propertyRows(snapshot.properties))}</div>`,
        createButton("properties", "Novo imovel")
      )}
      ${formSection}
    </div>
  `;
}

function tenantsPage(snapshot, editor) {
  const isEditing = Boolean(editor?.id);
  const formSection = editor
    ? pageSection(
        isEditing ? "Editar inquilino" : "Novo inquilino",
        "Cadastro com status de relacionamento",
        tenantForm(editor),
        editorActions("tenants", isEditing)
      )
    : "";

  return `
    <div class="page-stack">
      ${pageSection(
        "Lista de inquilinos",
        `${snapshot.tenants.length} registro(s) na base`,
        `<div class="table-shell">${crudTable(["Nome", "Documento", "Telefone", "E-mail", "Status", ""], tenantRows(snapshot.tenants))}</div>`,
        createButton("tenants", "Novo inquilino")
      )}
      ${formSection}
    </div>
  `;
}

function crudTable(headers, body) {
  if (body.startsWith("<div")) {
    return body;
  }
  return `
    <table class="min-w-full text-left text-sm">
      <thead class="text-stone-500">
        <tr class="border-b border-stone-200">
          ${headers
            .map((header) => `<th class="px-3 py-3 font-medium">${header}</th>`)
            .join("")}
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

export function renderCrudRoute(route, snapshot, editors) {
  if (route === "owners") {
    return ownersPage(snapshot, editors.owners);
  }
  if (route === "tenants") {
    return tenantsPage(snapshot, editors.tenants);
  }
  if (route === "properties") {
    return propertiesPage(snapshot, editors.properties);
  }
  if (route === "contracts") {
    return contractsPage(snapshot, editors.contracts);
  }
  return "";
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
