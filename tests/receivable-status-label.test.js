import { describe, expect, it } from "vitest";
import { translateReceivableStatus } from "../resources/js/receivable-status-label.js";

describe("translateReceivableStatus", () => {
  it("translates receivable statuses to portuguese labels", () => {
    expect(translateReceivableStatus("paid")).toBe("Pago");
    expect(translateReceivableStatus("pending")).toBe("Pendente");
    expect(translateReceivableStatus("overdue")).toBe("Em atraso");
  });

  it("keeps unknown statuses unchanged", () => {
    expect(translateReceivableStatus("processing")).toBe("processing");
  });
});
