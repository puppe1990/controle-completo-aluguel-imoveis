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
      monthly_rent: 2500,
    });

    repository.createContract({
      property_id: property.id,
      tenant_id: tenant.id,
      start_date: "2026-01-01",
      end_date: "2026-03-31",
      due_day: 8,
      rent_amount: 2500,
      deposit_amount: 2500,
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
      overdue_total: 5000,
    });
  });

  it("marks a receivable as paid and updates the summary", () => {
    const repository = new RentalRepository(":memory:");
    const snapshot = repository.seedDemoData();
    const pending = snapshot.receivables.find(
      (item) => item.status_label !== "paid"
    );

    repository.recordPayment(pending.id, { received_at: "2026-02-05" });
    const summary = repository.getSummary("2026-02-10");

    expect(summary.received_total).toBe(6400);
    expect(summary.overdue_total).toBe(0);
  });

  it("cancels a paid receivable and restores pending totals", () => {
    const repository = new RentalRepository(":memory:");
    const snapshot = repository.seedDemoData();
    const paid = snapshot.receivables.find(
      (item) => item.status_label === "paid"
    );

    repository.cancelPayment(paid.id);

    const receivable = repository.listContractReceivables(paid.contract_id)[0];
    const summary = repository.getSummary("2026-02-10");
    expect(receivable).toMatchObject({
      id: paid.id,
      status: "pending",
      received_at: null,
    });
    expect(summary.received_total).toBe(0);
    expect(summary.overdue_total).toBe(6400);
  });

  it("updates contract receivables and keeps paid months", () => {
    const repository = new RentalRepository(":memory:");
    const snapshot = repository.seedDemoData();
    const contract = snapshot.contracts[0];
    const property = snapshot.properties[0];
    const tenant = snapshot.tenants[0];

    repository.updateContract(contract.id, {
      property_id: property.id,
      tenant_id: tenant.id,
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      due_day: 10,
      rent_amount: 3500,
      deposit_amount: 3500,
      status: "active",
    });

    const receivables = repository.listContractReceivables(contract.id);
    expect(receivables).toHaveLength(12);
    expect(receivables[0]).toMatchObject({
      reference_month: "2026-01",
      status: "paid",
      amount: 3500,
      due_date: "2026-01-10",
    });
    expect(receivables[1]).toMatchObject({
      reference_month: "2026-02",
      status: "pending",
      amount: 3500,
      due_date: "2026-02-10",
    });
  });

  it("deletes owner with linked property, contract and receivables", () => {
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
      monthly_rent: 2500,
    });

    repository.createContract({
      property_id: property.id,
      tenant_id: tenant.id,
      start_date: "2026-01-01",
      end_date: "2026-03-31",
      due_day: 8,
      rent_amount: 2500,
      deposit_amount: 2500,
    });

    repository.deleteOwner(owner.id);

    expect(repository.listOwners()).toHaveLength(0);
    expect(repository.listProperties()).toHaveLength(0);
    expect(repository.listContracts()).toHaveLength(0);
    expect(repository.listReceivables()).toHaveLength(0);
    expect(repository.listTenants()).toHaveLength(1);
  });

  it("updates owner and deletes free tenant", () => {
    const repository = new RentalRepository(":memory:");
    const owner = repository.createOwner({ name: "Ana Rocha" });
    const tenant = repository.createTenant({ name: "Pedro Lima" });

    const updated = repository.updateOwner(owner.id, {
      name: "Ana Rocha Silva",
      document: "123.456.789-00",
      phone: "(11) 99999-0000",
      email: "ana@teste.com",
      notes: "Contato principal",
    });

    repository.deleteTenant(tenant.id);

    expect(updated).toMatchObject({
      name: "Ana Rocha Silva",
      document: "123.456.789-00",
    });
    expect(repository.listTenants()).toHaveLength(0);
  });

  it("resets the whole database from settings", () => {
    const repository = new RentalRepository(":memory:");
    repository.seedDemoData();

    const snapshot = repository.resetData();

    expect(snapshot.owners).toHaveLength(0);
    expect(snapshot.tenants).toHaveLength(0);
    expect(snapshot.properties).toHaveLength(0);
    expect(snapshot.contracts).toHaveLength(0);
    expect(snapshot.receivables).toHaveLength(0);
  });
});
