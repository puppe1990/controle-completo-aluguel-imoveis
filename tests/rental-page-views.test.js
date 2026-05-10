import { describe, expect, it } from "vitest";
import {
  renderCrudFormRoute,
  renderCrudRoute,
  renderReportExportActions,
} from "../resources/js/rental-page-views.js";

describe("rental-page-views", () => {
  it("renders create and edit navigation as hash links", () => {
    const html = renderCrudRoute(
      "owners",
      {
        owners: [{ id: 7, name: "Ana", document: "", phone: "", email: "" }],
        tenants: [],
        properties: [],
        contracts: [],
      },
      {}
    );

    expect(html).toContain('href="#/owners/new"');
    expect(html).toContain('href="#/owners/7/edit"');
  });

  it("renders create owner form with save label", () => {
    const html = renderCrudFormRoute(
      "owners",
      {
        owners: [],
        tenants: [],
        properties: [],
        contracts: [],
      },
      { id: "" }
    );

    expect(html).toContain("Salvar proprietario");
  });

  it("renders report export actions for managed routes", () => {
    const ownersHtml = renderCrudRoute(
      "owners",
      {
        owners: [],
        tenants: [],
        properties: [],
        contracts: [],
      },
      {}
    );

    expect(renderReportExportActions("receivables")).toContain(
      'data-report-export="receivables"'
    );
    expect(ownersHtml).toContain('data-report-export="owners"');
    expect(ownersHtml).toContain('data-report-format="excel"');
    expect(ownersHtml).toContain('data-report-format="pdf"');
    expect(ownersHtml).toContain('data-report-format="csv"');
  });

  it("renders grouped list header actions for every CRUD list", () => {
    const snapshot = {
      owners: [{ id: 1, name: "Ana", document: "", phone: "", email: "" }],
      tenants: [{ id: 2, name: "Bruno", document: "", phone: "", email: "" }],
      properties: [
        {
          id: 3,
          code: "APT-1",
          title: "Apartamento 1",
          owner_name: "Ana",
          city: "Sao Paulo",
          state: "SP",
          rent_amount: 1200,
          status: "available",
        },
      ],
      contracts: [
        {
          id: 4,
          property_code: "APT-1",
          property_title: "Apartamento 1",
          tenant_name: "Bruno",
          start_date: "2026-01-01",
          end_date: "2026-12-31",
          due_day: 10,
          rent_amount: 1200,
          status: "active",
        },
      ],
    };

    ["owners", "tenants", "properties", "contracts"].forEach((route) => {
      const html = renderCrudRoute(route, snapshot, {});

      expect(html).toContain('class="section-actions"');
      expect(html).toContain('class="section-actions__primary"');
      expect(html).toContain('class="section-actions__secondary"');
    });
  });
});
