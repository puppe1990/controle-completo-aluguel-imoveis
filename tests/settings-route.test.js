import { describe, expect, it } from "vitest";
import {
  ROUTES,
  getRouteContextFromHash,
  getRouteFromHashValue,
} from "../resources/js/app-routes.js";
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
    expect(getRouteContextFromHash("#/tenants/new")).toMatchObject({
      route: "tenants",
      action: "new",
      recordId: null,
    });
    expect(getRouteContextFromHash("#/tenants/12/edit")).toMatchObject({
      route: "tenants",
      action: "edit",
      recordId: "12",
    });
  });

  it("renders seed, export and import actions when demo seed is enabled", () => {
    const html = renderSettingsPage({ demoSeedEnabled: true });

    expect(html).toContain("Popular com dados de exemplo");
    expect(html).toContain("Exportar dados");
    expect(html).toContain("Importar dados");
    expect(html).toContain("Danger zone");
    expect(html).toContain("Deletar toda a base");
    expect(html).toContain('id="seed-demo"');
    expect(html).toContain('id="settings-export"');
    expect(html).toContain('id="settings-import"');
    expect(html).toContain('id="settings-reset"');
  });

  it("hides demo seed action when demo seed is disabled", () => {
    const html = renderSettingsPage();

    expect(html).not.toContain("Popular com dados de exemplo");
    expect(html).not.toContain('id="seed-demo"');
    expect(html).toContain("Exportar dados");
    expect(html).toContain("Importar dados");
    expect(html).toContain("Deletar toda a base");
  });
});
