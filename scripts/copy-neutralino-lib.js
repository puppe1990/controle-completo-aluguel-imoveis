import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const sourcePath = path.join(
  rootDir,
  "node_modules",
  "@neutralinojs",
  "lib",
  "dist",
  "neutralino.js"
);
const targetPath = path.join(rootDir, "resources", "js", "neutralino.js");

if (!fs.existsSync(sourcePath)) {
  console.warn("Neutralino client library not found. Run npm install first.");
  process.exit(0);
}

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.copyFileSync(sourcePath, targetPath);
console.log(`Copied Neutralino client library to ${targetPath}`);
