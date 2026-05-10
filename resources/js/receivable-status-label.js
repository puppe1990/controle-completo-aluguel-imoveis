const RECEIVABLE_STATUS_LABELS = {
  paid: "Pago",
  pending: "Pendente",
  overdue: "Em atraso",
};

export function translateReceivableStatus(status) {
  return RECEIVABLE_STATUS_LABELS[status] ?? status;
}
