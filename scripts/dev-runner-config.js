const RESTART_PATHS = [
  "src/",
  "extensions/",
  "neutralino.config.json",
  "package.json",
];

export function shouldRestartNeutralinoApp(filePath) {
  return RESTART_PATHS.some((prefix) => filePath.includes(prefix));
}

export function getRestartWatchPaths() {
  return ["src", "extensions", "neutralino.config.json", "package.json"];
}
