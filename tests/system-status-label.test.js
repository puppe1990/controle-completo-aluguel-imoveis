import { describe, expect, it } from "vitest";
import { translateSystemStatus } from "../resources/js/system-status-label.js";

describe("translateSystemStatus", () => {
  it("translates system statuses to portuguese labels", () => {
    expect(translateSystemStatus("active")).toBe("Ativo");
    expect(translateSystemStatus("inactive")).toBe("Inativo");
    expect(translateSystemStatus("available")).toBe("Disponivel");
    expect(translateSystemStatus("rented")).toBe("Alugado");
    expect(translateSystemStatus("closed")).toBe("Encerrado");
  });

  it("keeps unknown statuses unchanged", () => {
    expect(translateSystemStatus("processing")).toBe("processing");
  });
});
