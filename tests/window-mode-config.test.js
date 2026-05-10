import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const CONFIG_PATH = new URL("../neutralino.config.json", import.meta.url);

function readWindowModeConfig() {
  const configText = readFileSync(CONFIG_PATH, "utf8");
  const config = JSON.parse(configText);
  return config.modes.window;
}

describe("window mode config", () => {
  it("starts the app maximized", () => {
    const windowMode = readWindowModeConfig();

    expect(windowMode.fullScreen).toBe(false);
    expect(windowMode.maximize).toBe(true);
  });
});
