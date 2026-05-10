export const DEMO_SEED_ENV_KEY = "IMOBILIARIA_ENABLE_DEMO_SEED";

export function isEnabledEnvValue(value) {
  return ["1", "true", "yes", "on"].includes(
    String(value ?? "")
      .trim()
      .toLowerCase()
  );
}

export async function loadSettingsFeatureFlags(neutralino) {
  return {
    demoSeedEnabled: await readDemoSeedFlag(neutralino),
  };
}

async function readDemoSeedFlag(neutralino) {
  try {
    const envValue = await neutralino.os.getEnv(DEMO_SEED_ENV_KEY);
    return isEnabledEnvValue(envValue);
  } catch {
    return false;
  }
}
