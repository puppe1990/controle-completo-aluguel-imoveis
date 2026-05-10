import { describe, expect, it } from "vitest";
import { submitFeedback } from "../resources/js/submit-feedback.js";

describe("submit-feedback", () => {
  it("returns create feedback for save flows", () => {
    expect(submitFeedback("owners.create")).toEqual({
      pending: "Salvando proprietario...",
      success: "Proprietario salvo com sucesso.",
    });
  });

  it("returns update feedback for edit flows", () => {
    expect(submitFeedback("contracts.update")).toEqual({
      pending: "Salvando contrato...",
      success: "Contrato atualizado com sucesso.",
    });
  });

  it("falls back to a generic label for unknown commands", () => {
    expect(submitFeedback("unknown.create")).toEqual({
      pending: "Salvando registro...",
      success: "Registro salvo com sucesso.",
    });
  });
});
