import { describe, expect, it } from "vitest";
import {
  renderCrudFormRoute,
  renderCrudRoute,
  renderReceivablesRoute,
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

  it("renders listing controls for CRUD and receivables routes", () => {
    const snapshot = {
      owners: [{ id: 1, name: "Ana", document: "123", phone: "", email: "" }],
      tenants: [],
      properties: [],
      contracts: [],
      receivables: [
        {
          id: 5,
          reference_month: "2026-01",
          property_code: "APT-1",
          property_title: "Apartamento 1",
          tenant_name: "Bruno",
          due_date: "2026-01-10",
          amount: 1200,
          status_label: "pending",
        },
      ],
      ownerPerformance: [],
    };

    const ownersHtml = renderCrudRoute("owners", snapshot, {});
    const receivablesHtml = renderReceivablesRoute(snapshot);

    expect(ownersHtml).toContain('data-listing-search="owners"');
    expect(ownersHtml).toContain('data-searchable-free-text="true"');
    expect(ownersHtml).toContain('data-listing-filter="owners"');
    expect(ownersHtml).toContain('data-listing-sort="owners"');
    expect(ownersHtml).toContain('data-listing-header-sort="owners"');
    expect(ownersHtml).toContain('data-sort-field="name"');
    expect(receivablesHtml).toContain('data-listing-search="receivables"');
    expect(receivablesHtml).toContain(
      'data-listing-search-native="receivables"'
    );
    expect(receivablesHtml).toContain('data-report-export="receivables"');
    expect(receivablesHtml).toContain('data-listing-header-sort="receivables"');
    expect(receivablesHtml).toContain('data-sort-field="amount"');
  });
});
