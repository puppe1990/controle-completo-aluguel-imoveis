import { describe, expect, it, vi } from "vitest";
import { exportRouteReport } from "../resources/js/report-export.js";

function createNeutralinoDouble(selection = "/tmp/relatorio") {
  return {
    os: {
      showSaveDialog: vi.fn().mockResolvedValue(selection),
    },
    filesystem: {
      writeBinaryFile: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
    },
  };
}

function createSnapshot() {
  return {
    owners: [
      {
        name: "Mariana Costa",
        document: "123",
        phone: "11999999999",
        email: "mariana@teste.com",
        notes: "VIP",
      },
    ],
    tenants: [],
    properties: [],
    contracts: [],
    receivables: [],
  };
}

describe("report-export", () => {
  it("exports csv reports as text files", async () => {
    const neutralino = createNeutralinoDouble("/tmp/proprietarios.csv");

    await exportRouteReport(
      "owners",
      "csv",
      createSnapshot(),
      neutralino,
      new Date("2026-05-10T00:00:00.000Z")
    );

    expect(neutralino.os.showSaveDialog).toHaveBeenCalledWith(
      "Salvar relatorio",
      expect.objectContaining({
        defaultPath: "imobiliaria-owners-2026-05-10.csv",
      })
    );
    expect(neutralino.filesystem.writeFile).toHaveBeenCalledWith(
      "/tmp/proprietarios.csv",
      expect.stringContaining('"Mariana Costa"')
    );
  });

  it("exports excel reports as xls html files", async () => {
    const neutralino = createNeutralinoDouble("/tmp/proprietarios.xls");

    await exportRouteReport(
      "owners",
      "excel",
      createSnapshot(),
      neutralino,
      new Date("2026-05-10T00:00:00.000Z")
    );

    expect(neutralino.filesystem.writeFile).toHaveBeenCalledWith(
      "/tmp/proprietarios.xls",
      expect.stringContaining("<table>")
    );
  });

  it("exports pdf reports as binary files", async () => {
    const neutralino = createNeutralinoDouble("/tmp/proprietarios.pdf");

    await exportRouteReport(
      "owners",
      "pdf",
      createSnapshot(),
      neutralino,
      new Date("2026-05-10T00:00:00.000Z")
    );

    expect(neutralino.filesystem.writeBinaryFile).toHaveBeenCalledWith(
      "/tmp/proprietarios.pdf",
      expect.any(ArrayBuffer)
    );
  });
});
