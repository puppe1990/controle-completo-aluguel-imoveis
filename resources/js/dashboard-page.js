import { renderOwnerPerformanceTable } from "./rental-page-views.js";
import { translateReceivableStatus } from "./receivable-status-label.js";

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

function isoDate(dateValue) {
  return new Date(`${dateValue}T00:00:00`);
}

function daysUntil(dateValue, today) {
  return Math.round((isoDate(dateValue) - isoDate(today)) / ONE_DAY_IN_MS);
}

function percentageLabel(value) {
  return `${Math.round(value)}%`;
}

function ratioPercentage(part, total) {
  if (!total) {
    return 0;
  }
  return (Number(part) / Number(total)) * 100;
}

function activeContracts(snapshot) {
  return snapshot.contracts.filter((contract) => contract.status === "active");
}

function availableProperties(snapshot) {
  return snapshot.properties.filter(
    (property) => property.status === "available"
  );
}

function overdueReceivables(snapshot) {
  return snapshot.receivables.filter((row) => row.status_label === "overdue");
}

function dueSoonReceivables(snapshot, today) {
  return snapshot.receivables.filter((row) => {
    const remainingDays = daysUntil(row.due_date, today);
    return (
      row.status_label === "pending" && remainingDays >= 0 && remainingDays <= 7
    );
  });
}

function expiringContracts(snapshot, today) {
  return activeContracts(snapshot)
    .filter((contract) => {
      const remainingDays = daysUntil(contract.end_date, today);
      return remainingDays >= 0 && remainingDays <= 30;
    })
    .sort((left, right) => left.end_date.localeCompare(right.end_date));
}

function actionableReceivables(snapshot, today) {
  const overdueRows = overdueReceivables(snapshot);
  const dueSoonRows = dueSoonReceivables(snapshot, today);
  return [...overdueRows, ...dueSoonRows]
    .sort((left, right) => left.due_date.localeCompare(right.due_date))
    .slice(0, 6);
}

function dashboardMetrics(snapshot, today) {
  const summary = snapshot.summary ?? {};
  const rentedProperties =
    snapshot.properties.length - availableProperties(snapshot).length;
  return {
    occupancyRate: ratioPercentage(
      rentedProperties,
      snapshot.properties.length
    ),
    collectionRate: ratioPercentage(
      summary.received_total ?? 0,
      summary.expected_total ?? 0
    ),
    rentedProperties,
    overdueRows: overdueReceivables(snapshot),
    dueSoonRows: dueSoonReceivables(snapshot, today),
    availableRows: availableProperties(snapshot),
    expiringRows: expiringContracts(snapshot, today),
  };
}

function metricCards(summary, metrics, currency) {
  const cards = [
    {
      label: "Carteira prevista",
      value: currency(summary.expected_total ?? 0),
    },
    { label: "Recebido", value: currency(summary.received_total ?? 0) },
    { label: "Em atraso", value: currency(summary.overdue_total ?? 0) },
    { label: "Adimplencia", value: percentageLabel(metrics.collectionRate) },
    {
      label: "Ocupacao",
      value: `${metrics.rentedProperties}/${summary.properties ?? 0} (${percentageLabel(metrics.occupancyRate)})`,
    },
    {
      label: "Renovacoes urgentes",
      value: String(metrics.expiringRows.length),
    },
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

function receivablesTable(receivables, helpers) {
  if (!receivables.length) {
    return helpers.emptyState(
      "Nenhuma cobranca vencida ou a vencer nos proximos 7 dias."
    );
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
                  <td class="px-3 py-4 font-medium">${helpers.currency(row.amount)}</td>
                  <td class="px-3 py-4">${helpers.statusPill(row.status_label, translateReceivableStatus(row.status_label))}</td>
                  <td class="px-3 py-4">
                    <a class="btn-secondary !px-3 !py-2 text-xs" href="#/receivables">Abrir cobrancas</a>
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

function priorityCard(title, value, message, href, actionLabel) {
  return `
    <article class="record-card">
      <div class="record-card__top">
        <strong>${title}</strong>
        <span>${value}</span>
      </div>
      <p>${message}</p>
      <a class="btn-secondary mt-4 !px-3 !py-2 text-xs" href="${href}">${actionLabel}</a>
    </article>
  `;
}

function prioritiesPanel(summary, metrics, currency) {
  return `
    <div class="card-list">
      ${priorityCard("Cobrar atrasos", currency(summary.overdue_total ?? 0), `${metrics.overdueRows.length} titulos ja venceram e precisam de follow-up.`, "#/receivables", "Ver inadimplencia")}
      ${priorityCard("Confirmar proximos vencimentos", currency(metrics.dueSoonRows.reduce((total, row) => total + Number(row.amount), 0)), `${metrics.dueSoonRows.length} titulos vencem em ate 7 dias.`, "#/receivables", "Acompanhar agenda")}
      ${priorityCard("Atacar vacancia", String(metrics.availableRows.length), `${metrics.availableRows.length} imoveis estao livres para nova locacao.`, "#/properties", "Ver imoveis vagos")}
      ${priorityCard("Renovar contratos", String(metrics.expiringRows.length), `${metrics.expiringRows.length} contratos encerram nos proximos 30 dias.`, "#/contracts", "Planejar renovacoes")}
    </div>
  `;
}

function expiringContractsList(rows, helpers, today) {
  if (!rows.length) {
    return helpers.emptyState(
      "Nenhum contrato ativo encerra nos proximos 30 dias."
    );
  }
  return `
    <div class="card-list">
      ${rows
        .map(
          (contract) => `
            <article class="record-card">
              <div class="record-card__top">
                <strong>${contract.property_code} · ${contract.tenant_name}</strong>
                ${helpers.statusPill("pending", `${daysUntil(contract.end_date, today)} dias`)}
              </div>
              <p>Encerramento em ${contract.end_date} com aluguel de ${helpers.currency(contract.rent_amount)}.</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function vacancyInventoryList(rows, helpers) {
  if (!rows.length) {
    return helpers.emptyState("Nenhum imovel vago no momento.");
  }
  return `
    <div class="card-list">
      ${rows
        .map(
          (property) => `
            <article class="record-card">
              <div class="record-card__top">
                <strong>${property.code} · ${property.title}</strong>
                ${helpers.statusPill(property.status, "Disponivel")}
              </div>
              <p>${property.city}/${property.state} · aluguel alvo de ${helpers.currency(property.monthly_rent)}.</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

/**
 * Renderiza a dashboard operacional principal.
 * Exemplo: renderDashboardPage(snapshot, helpers, { today: "2026-05-10" }).
 */
export function renderDashboardPage(snapshot, helpers, options = {}) {
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const summary = snapshot.summary ?? {};
  const metrics = dashboardMetrics(snapshot, today);
  return `
    <div class="page-stack">
      ${metricCards(summary, metrics, helpers.currency)}
      <div class="page-grid page-grid--split">
        ${helpers.pageSection("Cobrancas que pedem acao", "Financeiro", receivablesTable(actionableReceivables(snapshot, today), helpers))}
        ${helpers.pageSection("Fila operacional", "Prioridades do dia", prioritiesPanel(summary, metrics, helpers.currency))}
      </div>
      <div class="page-grid page-grid--split">
        ${helpers.pageSection("Contratos para renovar", "Proximos 30 dias", expiringContractsList(metrics.expiringRows, helpers, today))}
        ${helpers.pageSection("Imoveis vagos para ofertar", "Vacancia", vacancyInventoryList(metrics.availableRows, helpers))}
      </div>
      ${helpers.pageSection("Performance por proprietario", "Analise", renderOwnerPerformanceTable(snapshot.ownerPerformance))}
    </div>
  `;
}
