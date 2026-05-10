import { describe, expect, it } from "vitest";
import {
  filterSearchableOptions,
  normalizeSearchableText,
  restoreSearchableInput,
  selectedSearchableLabel,
  setSearchableFreeTextValue,
} from "../resources/js/searchable-select.js";

describe("searchable-select", () => {
  it("normalizes accents and casing before filtering", () => {
    expect(normalizeSearchableText("  São José  ")).toBe("sao jose");
  });

  it("filters only selectable options that match the query", () => {
    const options = [
      { value: "", label: "Selecione o imovel", disabled: false },
      { value: "1", label: "Casa Sao Bento", disabled: false },
      { value: "2", label: "Apartamento Centro", disabled: false },
      { value: "3", label: "Bloqueado", disabled: true },
    ];

    expect(filterSearchableOptions(options, "sao")).toEqual([options[1]]);
    expect(filterSearchableOptions(options, "")).toEqual([
      options[1],
      options[2],
    ]);
  });

  it("returns the selected label for the synced input", () => {
    const options = [
      { value: "8", label: "Mariana Costa", disabled: false },
      { value: "12", label: "Carlos Menezes", disabled: false },
    ];

    expect(selectedSearchableLabel(options, 12)).toBe("Carlos Menezes");
    expect(selectedSearchableLabel(options, "404")).toBe("");
  });

  it("restores free-text searchable inputs without clearing the query", () => {
    const input = { value: "", dataset: { searchPlaceholder: "Buscar..." } };
    const container = {
      dataset: { searchableFreeText: "true", freeTextValue: "Ana" },
      querySelector(selector) {
        if (selector === "[data-searchable-input]") {
          return input;
        }
        return { options: [] };
      },
    };

    setSearchableFreeTextValue(container, "Bruno");
    restoreSearchableInput(container);

    expect(input.value).toBe("Bruno");
  });
});
