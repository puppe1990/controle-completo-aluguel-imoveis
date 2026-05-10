import { describe, expect, it } from "vitest";
import { renderDashboardPage } from "../resources/js/dashboard-page.js";

function currency(value = 0) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function emptyState(message) {
  return `<div>${message}</div>`;
}

function pageSection(title, eyebrow, content) {
  return `<section><h2>${eyebrow}</h2><h3>${title}</h3>${content}</section>`;
}

function statusPill(status, label) {
  return `<span data-status="${status}">${label}</span>`;
}

describe("dashboard-page", () => {
  it("renders actionable collections, renewals and vacancy focus", () => {
    const snapshot = {
      summary: {
        expected_total: 12000,
        received_total: 4000,
        overdue_total: 3000,
        properties: 3,
      },
      properties: [
        {
          id: 1,
          code: "APT-10",
          title: "Apartamento Centro",
          city: "Sao Paulo",
          state: "SP",
          monthly_rent: 3200,
          status: "rented",
        },
        {
          id: 2,
          code: "CASA-20",
          title: "Casa Jardim",
          city: "Campinas",
          state: "SP",
          monthly_rent: 2800,
          status: "available",
        },
        {
          id: 3,
          code: "LOFT-30",
          title: "Loft Centro",
          city: "Santos",
          state: "SP",
          monthly_rent: 2200,
          status: "rented",
        },
      ],
      contracts: [
        {
          id: 1,
          property_code: "APT-10",
          tenant_name: "Carlos",
          end_date: "2026-05-28",
          rent_amount: 3200,
          status: "active",
        },
        {
          id: 2,
          property_code: "LOFT-30",
          tenant_name: "Bianca",
          end_date: "2026-08-10",
          rent_amount: 2200,
          status: "active",
        },
      ],
      receivables: [
        {
          id: 1,
          reference_month: "2026-05",
          property_code: "APT-10",
          property_title: "Apartamento Centro",
          tenant_name: "Carlos",
          due_date: "2026-05-02",
          amount: 3000,
          status_label: "overdue",
        },
        {
          id: 2,
          reference_month: "2026-05",
          property_code: "LOFT-30",
          property_title: "Loft Centro",
          tenant_name: "Bianca",
          due_date: "2026-05-14",
          amount: 2200,
          status_label: "pending",
        },
        {
          id: 3,
          reference_month: "2026-04",
          property_code: "CASA-20",
          property_title: "Casa Jardim",
          tenant_name: "Diego",
          due_date: "2026-04-05",
          amount: 1800,
          status_label: "paid",
        },
      ],
      ownerPerformance: [],
    };

    const html = renderDashboardPage(
      snapshot,
      { currency, emptyState, pageSection, statusPill },
      { today: "2026-05-10" }
    );

    expect(html).toContain("Cobrancas que pedem acao");
    expect(html).toContain("Fila operacional");
    expect(html).toContain("Contratos para renovar");
    expect(html).toContain("Imoveis vagos para ofertar");
    expect(html).toContain("12.000,00");
    expect(html).toContain("33%");
    expect(html).toContain("2/3 (67%)");
    expect(html).toContain("APT-10 · Carlos");
    expect(html).toContain("CASA-20 · Casa Jardim");
    expect(html).not.toContain("Diego");
  });
});
