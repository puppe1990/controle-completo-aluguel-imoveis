import { describe, expect, it } from "vitest";
import { normalizeSelectedPath } from "../resources/js/dialog-file-path.js";

describe("dialog-file-path", () => {
  it("returns the selected path from string or array responses", () => {
    expect(normalizeSelectedPath("/tmp/owners.csv")).toBe("/tmp/owners.csv");
    expect(normalizeSelectedPath(["/tmp/owners.csv"])).toBe("/tmp/owners.csv");
    expect(normalizeSelectedPath([])).toBeNull();
    expect(normalizeSelectedPath(null)).toBeNull();
  });

  it("throws when dialog selection has an unsupported shape", () => {
    expect(() => normalizeSelectedPath({ path: "/tmp/owners.csv" })).toThrow(
      'Selecao de arquivo invalida: value="{"path":"/tmp/owners.csv"}" expected="string ou string[]"'
    );
  });
});
