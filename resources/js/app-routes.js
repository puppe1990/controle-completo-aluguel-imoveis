export const ROUTES = [
  { id: "dashboard", label: "Dashboard", eyebrow: "Visao geral" },
  { id: "owners", label: "Proprietarios", eyebrow: "Cadastro" },
  { id: "tenants", label: "Inquilinos", eyebrow: "Cadastro" },
  { id: "properties", label: "Imoveis", eyebrow: "Patrimonio" },
  { id: "contracts", label: "Contratos", eyebrow: "Locacao" },
  { id: "receivables", label: "Recebiveis", eyebrow: "Financeiro" },
  { id: "settings", label: "Configuracoes", eyebrow: "Sistema" },
];

export function getRouteFromHashValue(hash) {
  const route = hash.replace(/^#\/?/, "");
  return ROUTES.some((item) => item.id === route) ? route : "dashboard";
}
