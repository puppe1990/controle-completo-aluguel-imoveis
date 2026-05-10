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
});
