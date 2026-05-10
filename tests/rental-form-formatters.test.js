import { describe, expect, it } from "vitest";
import {
  applyInputMask,
  formatCurrencyInputValue,
  formatDocumentValue,
  formatPhoneValue,
  normalizeFormPayload,
  normalizeStateValue,
  parseCurrencyInputValue,
} from "../resources/js/rental-form-formatters.js";

class FakeMaskedField {
  constructor(mask, value) {
    this.dataset = { mask };
    this.value = value;
  }
}

describe("rental-form-formatters", () => {
  it("formats cpf and cnpj values", () => {
    expect(formatDocumentValue("12345678901")).toBe("123.456.789-01");
    expect(formatDocumentValue("12345678000199")).toBe("12.345.678/0001-99");
  });

  it("formats phone and currency values", () => {
    expect(formatPhoneValue("11987654321")).toBe("(11) 98765-4321");
    expect(formatCurrencyInputValue("123456")).toBe("R$ 1.234,56");
    expect(parseCurrencyInputValue("R$ 1.234,56")).toBe(1234.56);
  });

  it("preserves stored currency amounts when applying the mask", () => {
    const storedValueField = new FakeMaskedField("currency", "3200");
    const typedDigitsField = new FakeMaskedField("currency", "3200");

    applyInputMask(storedValueField, { storedValue: true });
    applyInputMask(typedDigitsField);

    expect(storedValueField.value).toBe("R$ 3.200,00");
    expect(typedDigitsField.value).toBe("R$ 32,00");
  });

  it("normalizes property payload with uppercase state and money", () => {
    expect(
      normalizeFormPayload("property-form", {
        owner_id: "5",
        code: " apt-101 ",
        title: "Apartamento",
        address: "Rua A",
        city: "Sao Paulo",
        state: "sp",
        monthly_rent: "R$ 3.200,50",
        status: "available",
      })
    ).toMatchObject({
      code: "APT-101",
      state: "SP",
      monthly_rent: 3200.5,
    });
  });

  it("normalizes contract payload with numeric fields", () => {
    expect(
      normalizeFormPayload("contract-form", {
        property_id: "2",
        tenant_id: "4",
        start_date: "2026-01-01",
        end_date: "2026-12-31",
        due_day: "5",
        rent_amount: "R$ 2.500,00",
        deposit_amount: "",
        status: "active",
      })
    ).toMatchObject({
      due_day: 5,
      rent_amount: 2500,
      deposit_amount: 0,
    });
    expect(normalizeStateValue("rj")).toBe("RJ");
  });
});
