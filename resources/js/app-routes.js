export const ROUTES = [
  { id: "dashboard", label: "Dashboard", eyebrow: "Visao geral" },
  { id: "owners", label: "Proprietarios", eyebrow: "Cadastro" },
  { id: "tenants", label: "Inquilinos", eyebrow: "Cadastro" },
  { id: "properties", label: "Imoveis", eyebrow: "Patrimonio" },
  { id: "contracts", label: "Contratos", eyebrow: "Locacao" },
  { id: "receivables", label: "Recebiveis", eyebrow: "Financeiro" },
  { id: "settings", label: "Configuracoes", eyebrow: "Sistema" },
];

const CRUD_ROUTES = new Set(["owners", "tenants", "properties", "contracts"]);

export function getRouteFromHashValue(hash) {
  return getRouteContextFromHash(hash).route;
}

export function getRouteContextFromHash(hash) {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const route = parts[0];
  if (!ROUTES.some((item) => item.id === route)) {
    return { route: "dashboard", action: "list", recordId: null };
  }

  if (!CRUD_ROUTES.has(route)) {
    return { route, action: "list", recordId: null };
  }

  if (parts[1] === "new") {
    return { route, action: "new", recordId: null };
  }

  if (parts[2] === "edit") {
    return { route, action: "edit", recordId: parts[1] ?? null };
  }

  return { route, action: "list", recordId: null };
}

export function crudListHash(route) {
  return `#/${route}`;
}

export function crudCreateHash(route) {
  return `#/${route}/new`;
}

export function crudEditHash(route, id) {
  return `#/${route}/${id}/edit`;
}
