import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function getRuntimeSourcePaths(rootDir) {
  return {
    sourcePath: path.join(rootDir, "src"),
    targetPath: path.join(rootDir, "dist", "imobiliaria-desktop", "src"),
  };
}

export function copyRuntimeSource(rootDir) {
  const { sourcePath, targetPath } = getRuntimeSourcePaths(rootDir);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.cpSync(sourcePath, targetPath, { recursive: true, force: true });
  return targetPath;
}

function isExecutedDirectly(moduleUrl) {
  return process.argv[1] === fileURLToPath(moduleUrl);
}

if (isExecutedDirectly(import.meta.url)) {
  const runtimeSourceTargetPath = copyRuntimeSource(process.cwd());
  console.log(`Copied runtime source files to ${runtimeSourceTargetPath}`);
}
