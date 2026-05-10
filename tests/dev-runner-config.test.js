import { describe, expect, it } from "vitest";
import {
  getRestartWatchPaths,
  shouldRestartNeutralinoApp,
} from "../scripts/dev-runner-config.js";

describe("dev runner config", () => {
  it("restarts the app for backend and extension changes", () => {
    expect(shouldRestartNeutralinoApp("src/backend/database.js")).toBe(true);
    expect(shouldRestartNeutralinoApp("extensions/sqlite-bridge/main.js")).toBe(
      true
    );
    expect(shouldRestartNeutralinoApp("neutralino.config.json")).toBe(true);
  });

  it("keeps frontend resource changes on hot reload only", () => {
    expect(shouldRestartNeutralinoApp("resources/js/app.js")).toBe(false);
    expect(shouldRestartNeutralinoApp("resources/styles/input.css")).toBe(
      false
    );
    expect(getRestartWatchPaths()).toEqual([
      "src",
      "extensions",
      "neutralino.config.json",
      "package.json",
    ]);
  });
});
