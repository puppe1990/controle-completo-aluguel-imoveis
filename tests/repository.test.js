import { describe, expect, it } from "vitest";
import { RentalRepository } from "../src/backend/database.js";

describe("RentalRepository", () => {
  it("creates contract receivables and dashboard totals", () => {
    const repository = new RentalRepository(":memory:");
    const owner = repository.createOwner({ name: "Ana Rocha" });
    const tenant = repository.createTenant({ name: "Pedro Lima" });
    const property = repository.createProperty({
      owner_id: owner.id,
      code: "CASA-01",
      title: "Casa Jardim",
      address: "Rua Um, 10",
      city: "Campinas",
      state: "SP",
      monthly_rent: 2500
    });

    repository.createContract({
      property_id: property.id,
      tenant_id: tenant.id,
      start_date: "2026-01-01",
      end_date: "2026-03-31",
      due_day: 8,
      rent_amount: 2500,
      deposit_amount: 2500
    });

    const receivables = repository.listReceivables("2026-02-10");
    expect(receivables).toHaveLength(3);
    expect(receivables[0].status_label).toBe("overdue");
    expect(repository.getSummary("2026-02-10")).toMatchObject({
      owners: 1,
      tenants: 1,
      properties: 1,
      active_contracts: 1,
      expected_total: 7500,
      overdue_total: 5000
    });
  });

  it("marks a receivable as paid and updates the summary", () => {
    const repository = new RentalRepository(":memory:");
    const snapshot = repository.seedDemoData();
    const pending = snapshot.receivables.find((item) => item.status_label !== "paid");

    repository.recordPayment(pending.id, { received_at: "2026-02-05" });
    const summary = repository.getSummary("2026-02-10");

    expect(summary.received_total).toBe(6400);
    expect(summary.overdue_total).toBe(0);
  });
});
