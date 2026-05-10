import { describe, expect, it } from "vitest";
import { ROUTES, getRouteFromHashValue } from "../resources/js/app-routes.js";
import { renderSettingsPage } from "../resources/js/settings-page.js";

describe("settings route", () => {
  it("registers the settings route and resolves its hash", () => {
    expect(ROUTES).toContainEqual({
      id: "settings",
      label: "Configuracoes",
      eyebrow: "Sistema",
    });
    expect(getRouteFromHashValue("#/settings")).toBe("settings");
    expect(getRouteFromHashValue("#/missing")).toBe("dashboard");
  });

  it("renders export and import actions", () => {
    const html = renderSettingsPage();

    expect(html).toContain("Exportar dados");
    expect(html).toContain("Importar dados");
    expect(html).toContain('id="settings-export"');
    expect(html).toContain('id="settings-import-file"');
  });
});
