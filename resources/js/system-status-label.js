const SYSTEM_STATUS_LABELS = {
  active: "Ativo",
  inactive: "Inativo",
  available: "Disponivel",
  rented: "Alugado",
  closed: "Encerrado",
};

export function translateSystemStatus(status) {
  return SYSTEM_STATUS_LABELS[status] ?? status;
}
