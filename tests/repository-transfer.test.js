import { describe, expect, it } from "vitest";
import { RentalRepository } from "../src/backend/database.js";

describe("RentalRepository data transfer", () => {
  it("exports seeded data and imports it into another repository", () => {
    const sourceRepository = new RentalRepository(":memory:");
    sourceRepository.seedDemoData();

    const backup = sourceRepository.exportData("2026-02-10");
    const targetRepository = new RentalRepository(":memory:");
    targetRepository.importData(backup);

    expect(backup.version).toBe(1);
    expect(backup.snapshot.owners).toHaveLength(1);
    expect(targetRepository.snapshot("2026-02-10")).toMatchObject({
      owners: backup.snapshot.owners,
      tenants: backup.snapshot.tenants,
      properties: backup.snapshot.properties,
      contracts: backup.snapshot.contracts,
      receivables: backup.snapshot.receivables,
      summary: backup.snapshot.summary,
      ownerPerformance: backup.snapshot.ownerPerformance,
    });
  });
});
