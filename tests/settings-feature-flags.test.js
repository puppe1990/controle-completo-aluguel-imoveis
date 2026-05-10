import { describe, expect, it, vi } from "vitest";
import {
  DEMO_SEED_ENV_KEY,
  isEnabledEnvValue,
  loadSettingsFeatureFlags,
} from "../resources/js/settings-feature-flags.js";

describe("settings feature flags", () => {
  it("accepts common truthy env values", () => {
    expect(isEnabledEnvValue("true")).toBe(true);
    expect(isEnabledEnvValue("TRUE")).toBe(true);
    expect(isEnabledEnvValue("1")).toBe(true);
    expect(isEnabledEnvValue("on")).toBe(true);
    expect(isEnabledEnvValue("yes")).toBe(true);
    expect(isEnabledEnvValue("false")).toBe(false);
    expect(isEnabledEnvValue("0")).toBe(false);
    expect(isEnabledEnvValue("")).toBe(false);
  });

  it("loads demo seed flag from Neutralino env", async () => {
    const getEnv = vi.fn().mockResolvedValue("true");

    const flags = await loadSettingsFeatureFlags({
      os: { getEnv },
    });

    expect(flags).toEqual({ demoSeedEnabled: true });
    expect(getEnv).toHaveBeenCalledWith(DEMO_SEED_ENV_KEY);
  });

  it("disables demo seed when env lookup fails", async () => {
    const flags = await loadSettingsFeatureFlags({
      os: { getEnv: vi.fn().mockRejectedValue(new Error("missing")) },
    });

    expect(flags).toEqual({ demoSeedEnabled: false });
  });
});
