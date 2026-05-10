import { describe, expect, it } from "vitest";
import {
  buildListingView,
  createInitialListingState,
} from "../resources/js/listing-state.js";

describe("listing-state", () => {
  it("filters owners by document presence and text search", () => {
    const rows = [
      { id: 1, name: "Ana Costa", document: "123", phone: "", email: "" },
      { id: 2, name: "Bruno Lima", document: "", phone: "", email: "" },
    ];

    const view = buildListingView("owners", rows, {
      ...createInitialListingState("owners"),
      search: "ana",
      filter: "with-document",
    });

    expect(view.filteredItems).toBe(1);
    expect(view.rows).toEqual([rows[0]]);
  });

  it("sorts receivables by amount and paginates the visible rows", () => {
    const rows = Array.from({ length: 9 }, (_, index) => ({
      id: index + 1,
      amount: index + 1,
      due_date: `2026-01-${String(index + 1).padStart(2, "0")}`,
      reference_month: "2026-01",
      property_code: `APT-${index + 1}`,
      property_title: "Centro",
      tenant_name: `Cliente ${index + 1}`,
      status_label: "pending",
    }));

    const firstPage = buildListingView("receivables", rows, {
      ...createInitialListingState("receivables"),
      sort: "amount:desc",
    });
    const secondPage = buildListingView("receivables", rows, {
      ...createInitialListingState("receivables"),
      sort: "amount:desc",
      page: 2,
    });

    expect(firstPage.rows[0].amount).toBe(9);
    expect(firstPage.totalPages).toBe(2);
    expect(secondPage.rows).toHaveLength(1);
    expect(secondPage.rows[0].amount).toBe(1);
  });
});
