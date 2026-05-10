const DEFAULT_PAGE_SIZE = 8;

const DOCUMENT_FILTERS = [
  { value: "all", label: "Todos os cadastros" },
  { value: "with-document", label: "Com documento" },
  { value: "without-document", label: "Sem documento" },
];

const STATUS_FILTERS = {
  tenants: [
    { value: "all", label: "Todos os status" },
    { value: "active", label: "Ativos" },
    { value: "inactive", label: "Inativos" },
  ],
  properties: [
    { value: "all", label: "Todos os status" },
    { value: "available", label: "Disponiveis" },
    { value: "rented", label: "Alugados" },
  ],
  contracts: [
    { value: "all", label: "Todos os status" },
    { value: "active", label: "Ativos" },
    { value: "closed", label: "Encerrados" },
  ],
  receivables: [
    { value: "all", label: "Todos os status" },
    { value: "pending", label: "Pendentes" },
    { value: "overdue", label: "Em atraso" },
    { value: "paid", label: "Pagos" },
  ],
};

const LISTING_CONFIG = {
  owners: {
    columns: [
      { label: "Nome", sortField: "name", defaultDirection: "asc" },
      { label: "Documento" },
      { label: "Telefone" },
      { label: "E-mail" },
      { label: "Status" },
      { label: "" },
    ],
    searchPlaceholder: "Buscar por nome, documento, telefone ou e-mail",
    searchFields: ["name", "document", "phone", "email"],
    filterLabel: "Documento",
    filters: DOCUMENT_FILTERS,
    sorts: [
      { value: "name:asc", label: "Nome A-Z" },
      { value: "name:desc", label: "Nome Z-A" },
    ],
    defaultSort: "name:asc",
  },
  tenants: {
    columns: [
      { label: "Nome", sortField: "name", defaultDirection: "asc" },
      { label: "Documento" },
      { label: "Telefone" },
      { label: "E-mail" },
      { label: "Status" },
      { label: "" },
    ],
    searchPlaceholder: "Buscar por nome, documento, telefone ou e-mail",
    searchFields: ["name", "document", "phone", "email"],
    filterLabel: "Status",
    filters: STATUS_FILTERS.tenants,
    sorts: [
      { value: "name:asc", label: "Nome A-Z" },
      { value: "name:desc", label: "Nome Z-A" },
    ],
    defaultSort: "name:asc",
  },
  properties: {
    columns: [
      { label: "Codigo", sortField: "code", defaultDirection: "asc" },
      { label: "Nome" },
      { label: "Proprietario" },
      { label: "Cidade/UF" },
      {
        label: "Aluguel",
        sortField: "monthly_rent",
        defaultDirection: "desc",
      },
      { label: "Status" },
      { label: "" },
    ],
    searchPlaceholder: "Buscar por codigo, imovel, proprietario ou cidade",
    searchFields: ["code", "title", "owner_name", "city", "state"],
    filterLabel: "Status",
    filters: STATUS_FILTERS.properties,
    sorts: [
      { value: "code:asc", label: "Codigo A-Z" },
      { value: "monthly_rent:desc", label: "Maior aluguel" },
      { value: "monthly_rent:asc", label: "Menor aluguel" },
    ],
    defaultSort: "code:asc",
  },
  contracts: {
    columns: [
      { label: "Imovel" },
      { label: "Inquilino" },
      {
        label: "Periodo",
        sortField: "start_date",
        defaultDirection: "desc",
      },
      { label: "Vencimento" },
      {
        label: "Valor",
        sortField: "rent_amount",
        defaultDirection: "desc",
      },
      { label: "Status" },
      { label: "" },
    ],
    searchPlaceholder: "Buscar por imovel, inquilino ou periodo",
    searchFields: [
      "property_code",
      "property_title",
      "tenant_name",
      "start_date",
      "end_date",
    ],
    filterLabel: "Status",
    filters: STATUS_FILTERS.contracts,
    sorts: [
      { value: "start_date:desc", label: "Mais recentes" },
      { value: "rent_amount:desc", label: "Maior valor" },
      { value: "rent_amount:asc", label: "Menor valor" },
    ],
    defaultSort: "start_date:desc",
  },
  receivables: {
    columns: [
      { label: "Referencia" },
      { label: "Imovel" },
      { label: "Inquilino" },
      {
        label: "Vencimento",
        sortField: "due_date",
        defaultDirection: "asc",
      },
      { label: "Valor", sortField: "amount", defaultDirection: "desc" },
      { label: "Status" },
      { label: "" },
    ],
    searchPlaceholder: "Buscar por referencia, imovel ou inquilino",
    searchFields: [
      "reference_month",
      "property_code",
      "property_title",
      "tenant_name",
      "due_date",
    ],
    filterLabel: "Status",
    filters: STATUS_FILTERS.receivables,
    sorts: [
      { value: "due_date:asc", label: "Vencimento mais proximo" },
      { value: "due_date:desc", label: "Vencimento mais distante" },
      { value: "amount:desc", label: "Maior valor" },
      { value: "amount:asc", label: "Menor valor" },
    ],
    defaultSort: "due_date:asc",
  },
};

function parseSort(sortValue, fallback) {
  const [field, direction] = String(sortValue || fallback).split(":");
  return { field, direction: direction === "desc" ? "desc" : "asc" };
}

function isNumericValue(value) {
  if (typeof value === "number") {
    return !Number.isNaN(value);
  }
  if (typeof value !== "string") {
    return false;
  }
  const normalized = value.trim();
  if (!normalized) {
    return false;
  }
  return !Number.isNaN(Number(normalized));
}

function normalizeListingText(value = "") {
  return String(value)
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

function compareValues(left, right) {
  if (isNumericValue(left) || isNumericValue(right)) {
    return Number(left ?? 0) - Number(right ?? 0);
  }
  return String(left ?? "").localeCompare(String(right ?? ""), "pt-BR");
}

/**
 * Resolves the next sort value for a clicked table header.
 * Example: nextListingSort("amount:desc", "amount", "desc")
 */
export function nextListingSort(currentSort, field, defaultDirection = "asc") {
  const { field: currentField, direction } = parseSort(currentSort, "");
  if (currentField !== field) {
    return `${field}:${defaultDirection}`;
  }
  return `${field}:${direction === "desc" ? "asc" : "desc"}`;
}

function matchesSearch(row, fields, search) {
  if (!search) {
    return true;
  }
  return fields.some((field) =>
    normalizeListingText(row[field] ?? "").includes(search)
  );
}

function matchesFilter(route, row, filter) {
  if (filter === "all") {
    return true;
  }
  if (route === "owners") {
    return filter === "with-document"
      ? Boolean(row.document)
      : !Boolean(row.document);
  }
  return String(row.status ?? row.status_label ?? "") === filter;
}

function sortRows(rows, sortValue, fallback) {
  const { field, direction } = parseSort(sortValue, fallback);
  const factor = direction === "desc" ? -1 : 1;
  return [...rows].sort(
    (left, right) => compareValues(left[field], right[field]) * factor
  );
}

function paginateRows(rows, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    page: currentPage,
    totalPages,
    rows: rows.slice(start, start + pageSize),
  };
}

/**
 * Builds the initial UI state for a managed listing.
 * Example: createInitialListingState("owners")
 */
export function createInitialListingState(route) {
  const config = LISTING_CONFIG[route];
  return {
    search: "",
    filter: config.filters[0]?.value ?? "all",
    sort: config.defaultSort,
    page: 1,
  };
}

/**
 * Returns the controls config and visible rows for a listing route.
 * Example: buildListingView("receivables", rows, createInitialListingState("receivables"))
 */
export function buildListingView(route, rows, state) {
  const config = LISTING_CONFIG[route];
  const search = normalizeListingText(state.search);
  const filteredRows = rows.filter(
    (row) =>
      matchesSearch(row, config.searchFields, search) &&
      matchesFilter(route, row, state.filter)
  );
  const sortedRows = sortRows(filteredRows, state.sort, config.defaultSort);
  const pagination = paginateRows(sortedRows, state.page, DEFAULT_PAGE_SIZE);
  return {
    ...config,
    columns: config.columns,
    activeFilter: state.filter,
    activeSort: state.sort,
    activeSearch: state.search,
    page: pagination.page,
    totalPages: pagination.totalPages,
    totalItems: rows.length,
    filteredItems: filteredRows.length,
    rows: pagination.rows,
  };
}
